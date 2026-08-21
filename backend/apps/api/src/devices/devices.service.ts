import { randomBytes, randomInt } from "crypto";
import { BadRequestException, Injectable, NotFoundException } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { InjectRepository } from "@nestjs/typeorm";
import { In, Repository } from "typeorm";
import { AppConfig } from "@app/common/config/configuration";
import { PERMISSION_CODES } from "@app/common/constants/permissions.constant";
import { hasPermission, loadUserAssignments, ScopeTarget } from "@app/auth/permissions";
import { TokenService } from "@app/auth/token.service";
import {
  Device,
  DeviceType,
  Location,
  PairingSession,
  Role,
  User,
  UserRoleAssignment,
  Workspace,
} from "@app/database/postgres/entities";
import { MongoService } from "@app/database/mongo/mongo.service";
import { DeviceOut, toDeviceOut } from "./devices.mapper";

function generateCode(): string {
  return String(randomInt(0, 1_000_000)).padStart(6, "0");
}

function generateDeviceToken(): string {
  return randomBytes(32).toString("base64url");
}

@Injectable()
export class DevicesService {
  constructor(
    @InjectRepository(Device) private readonly devices: Repository<Device>,
    @InjectRepository(PairingSession) private readonly pairingSessions: Repository<PairingSession>,
    @InjectRepository(DeviceType) private readonly deviceTypes: Repository<DeviceType>,
    @InjectRepository(Location) private readonly locations: Repository<Location>,
    @InjectRepository(Workspace) private readonly workspaces: Repository<Workspace>,
    @InjectRepository(UserRoleAssignment) private readonly assignments: Repository<UserRoleAssignment>,
    @InjectRepository(Role) private readonly roles: Repository<Role>,
    private readonly tokenService: TokenService,
    private readonly mongoService: MongoService,
    private readonly config: ConfigService<AppConfig, true>,
  ) {}

  // locationId is checked by PermissionsGuard (devices:manage) at the
  // controller before this runs, and locked into the pairing session so
  // the later, unauthenticated pairClaim call never has to make its own
  // authorization decision.
  async pairStart(user: User, locationId: string) {
    const location = await this.locations.findOneBy({ id: locationId });
    if (!location) throw new BadRequestException("Unknown location");

    const code = generateCode();
    const expiresAt = new Date(Date.now() + this.config.get("auth", { infer: true }).pairingCodeTtlSeconds * 1000);
    const session = this.pairingSessions.create({ code, ownerId: user.id, locationId, expiresAt });
    await this.pairingSessions.save(session);

    return {
      code,
      expires_at: expiresAt.toISOString(),
      ws_claim_url: `/ws/pairing/${code}`,
    };
  }

  async pairStatus(code: string): Promise<DeviceOut | null> {
    const session = await this.pairingSessions.findOneBy({ code });
    if (!session) throw new NotFoundException("Unknown pairing code");
    if (session.status !== "claimed" || !session.deviceId) return null;

    const device = await this.devices.findOneBy({ id: session.deviceId });
    if (!device) return null;
    return toDeviceOut(device);
  }

  async pairClaim(code: string, name: string, platform: string, deviceTypeCode: string) {
    const session = await this.pairingSessions.findOneBy({ code });
    if (!session) throw new NotFoundException("Unknown pairing code");
    if (session.status !== "pending") throw new BadRequestException("Pairing code already used");
    if (session.expiresAt.getTime() < Date.now()) {
      session.status = "expired";
      await this.pairingSessions.save(session);
      throw new BadRequestException("Pairing code expired");
    }

    const deviceType = await this.deviceTypes.findOneByOrFail({ code: deviceTypeCode });

    const device = this.devices.create({
      ownerId: session.ownerId,
      locationId: session.locationId,
      deviceTypeId: deviceType.id,
      name,
      platform,
      deviceToken: generateDeviceToken(),
      status: "online",
      lastSeenAt: new Date(),
    });
    await this.devices.save(device);

    session.status = "claimed";
    session.deviceId = device.id;
    await this.pairingSessions.save(session);

    const deviceTokenExpireMinutes = this.config.get("auth", { infer: true }).deviceTokenExpireMinutes;
    const token = this.tokenService.createAccessToken(device.id, "device", deviceTokenExpireMinutes);
    return {
      device_id: device.id,
      device_token: token,
      ws_device_url: `/ws/device/${device.id}`,
    };
  }

  async listDevices(user: User): Promise<DeviceOut[]> {
    const locationIds = await this.resolveVisibleLocationIds(user);
    const devices =
      locationIds.length > 0
        ? await this.devices.find({ where: { locationId: In(locationIds) }, order: { createdAt: "DESC" } })
        : await this.devices.find({ where: { ownerId: user.id }, order: { createdAt: "DESC" } });
    return devices.map(toDeviceOut);
  }

  async getDevice(user: User, deviceId: string): Promise<DeviceOut> {
    const device = await this.findVisibleDevice(user, deviceId);
    return toDeviceOut(device);
  }

  // Availability-oriented read: latest known metrics from MongoDB, written
  // asynchronously by apps/workers/ingestion-worker. Can lag the live
  // WebSocket feed by that worker's write latency, but is always
  // answerable even with no dashboard currently connected.
  async getLatestMetrics(user: User, deviceId: string): Promise<Record<string, unknown> | null> {
    await this.findVisibleDevice(user, deviceId);
    const latest = await this.mongoService
      .deviceMetricsCollection()
      .findOne({ device_id: deviceId }, { sort: { received_at: -1 } });
    return latest ?? null;
  }

  private async findVisibleDevice(user: User, deviceId: string): Promise<Device> {
    const device = await this.devices.findOneBy({ id: deviceId });
    if (!device) throw new NotFoundException("Device not found");
    if (device.ownerId === user.id) return device;

    const target = await this.scopeTargetForLocation(device.locationId, user.tenantId);
    const resolvedAssignments = await loadUserAssignments(this.assignments, this.roles, user.id);
    if (!hasPermission(resolvedAssignments, PERMISSION_CODES.DEVICES_READ, target)) {
      throw new NotFoundException("Device not found");
    }
    return device;
  }

  private async scopeTargetForLocation(locationId: string, fallbackTenantId: string): Promise<ScopeTarget> {
    const location = await this.locations.findOneBy({ id: locationId });
    if (!location) return { tenantId: fallbackTenantId };
    const workspace = await this.workspaces.findOneBy({ id: location.workspaceId });
    return {
      tenantId: workspace?.tenantId ?? fallbackTenantId,
      workspaceId: location.workspaceId,
      locationId: location.id,
    };
  }

  private async resolveVisibleLocationIds(user: User): Promise<string[]> {
    const resolvedAssignments = await loadUserAssignments(this.assignments, this.roles, user.id);
    const readable = resolvedAssignments.filter((a) => a.permissionCodes.has(PERMISSION_CODES.DEVICES_READ));
    if (readable.length === 0) return [];

    const locationIds = new Set<string>();
    for (const assignment of readable) {
      if (assignment.scopeType === "location") {
        locationIds.add(assignment.scopeId);
      } else if (assignment.scopeType === "workspace") {
        const locs = await this.locations.findBy({ workspaceId: assignment.scopeId });
        locs.forEach((l) => locationIds.add(l.id));
      } else if (assignment.scopeType === "tenant") {
        const tenantWorkspaces = await this.workspaces.findBy({ tenantId: assignment.scopeId });
        if (tenantWorkspaces.length === 0) continue;
        const locs = await this.locations.findBy({ workspaceId: In(tenantWorkspaces.map((w) => w.id)) });
        locs.forEach((l) => locationIds.add(l.id));
      }
    }
    return [...locationIds];
  }
}
