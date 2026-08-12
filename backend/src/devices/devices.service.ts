import { randomBytes, randomInt } from "crypto";
import { BadRequestException, Injectable, NotFoundException } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository } from "typeorm";
import { AppConfig } from "../config/configuration";
import { TokenService } from "../auth/token.service";
import { Device } from "../entities/device.entity";
import { PairingSession } from "../entities/pairing-session.entity";
import { User } from "../entities/user.entity";
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
    private readonly tokenService: TokenService,
    private readonly config: ConfigService<AppConfig, true>,
  ) {}

  async pairStart(user: User) {
    const code = generateCode();
    const expiresAt = new Date(Date.now() + this.config.get("pairingCodeTtlSeconds") * 1000);
    const session = this.pairingSessions.create({ code, ownerId: user.id, expiresAt });
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

  async pairClaim(code: string, name: string, platform: string) {
    const session = await this.pairingSessions.findOneBy({ code });
    if (!session) throw new NotFoundException("Unknown pairing code");
    if (session.status !== "pending") throw new BadRequestException("Pairing code already used");
    if (session.expiresAt.getTime() < Date.now()) {
      session.status = "expired";
      await this.pairingSessions.save(session);
      throw new BadRequestException("Pairing code expired");
    }

    const device = this.devices.create({
      ownerId: session.ownerId,
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

    const token = this.tokenService.createToken(device.id, "device", this.config.get("deviceTokenExpireMinutes"));
    return {
      device_id: device.id,
      device_token: token,
      ws_device_url: `/ws/device/${device.id}`,
    };
  }

  async listDevices(user: User): Promise<DeviceOut[]> {
    const devices = await this.devices.find({ where: { ownerId: user.id }, order: { createdAt: "DESC" } });
    return devices.map(toDeviceOut);
  }

  async getDevice(user: User, deviceId: string): Promise<DeviceOut> {
    const device = await this.devices.findOneBy({ id: deviceId });
    if (!device || device.ownerId !== user.id) throw new NotFoundException("Device not found");
    return toDeviceOut(device);
  }
}
