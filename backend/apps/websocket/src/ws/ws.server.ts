import type { Server as HttpServer, IncomingMessage } from "http";
import type { Socket } from "net";
import { parse as parseUrl } from "url";
import { WebSocket, WebSocketServer } from "ws";
import type { DataSource, Repository } from "typeorm";
import { hasPermission, loadUserAssignments } from "@app/auth/permissions";
import type { TokenService } from "@app/auth/token.service";
import { PERMISSION_CODES } from "@app/common/constants/permissions.constant";
import { Device, Location, Role, UserRoleAssignment, Workspace } from "@app/database/postgres/entities";
import { deviceChannel, RedisService } from "@app/database/redis/redis.service";
import { parseDeviceMetricsMessage } from "./device-metrics.util";

// Deliberately NOT using Nest's @WebSocketGateway() decorator: it's built around a
// single fixed namespace (or socket.io), and this app needs per-connection dynamic
// paths (/ws/device/{id}, /ws/dashboard/{id}) speaking plain WebSocket - the same
// protocol the browser's `new WebSocket(url)` and React Native's WebSocket already
// use. Attaching a raw `ws` server to a plain HTTP server and routing on
// `request.url` ourselves keeps that wire format unchanged.
export interface WsDeps {
  dataSource: DataSource;
  tokenService: TokenService;
  redisService: RedisService;
}

export function attachWebSocketServer(server: HttpServer, deps: WsDeps): void {
  const wss = new WebSocketServer({ noServer: true });

  server.on("upgrade", (request: IncomingMessage, socket: Socket, head: Buffer) => {
    handleUpgrade(wss, request, socket, head, deps).catch(() => socket.destroy());
  });
}

async function handleUpgrade(
  wss: WebSocketServer,
  request: IncomingMessage,
  socket: Socket,
  head: Buffer,
  deps: WsDeps,
): Promise<void> {
  const { pathname, query } = parseUrl(request.url ?? "", true);
  const token = typeof query.token === "string" ? query.token : "";
  const deviceRepo: Repository<Device> = deps.dataSource.getRepository(Device);

  const deviceMatch = pathname?.match(/^\/ws\/device\/([^/]+)$/);
  if (deviceMatch) {
    const deviceId = deviceMatch[1];
    const payload = deps.tokenService.verifyToken(token);
    if (!payload || payload.scope !== "device" || payload.sub !== deviceId) {
      rejectUpgrade(socket, 401);
      return;
    }
    const device = await deviceRepo.findOneBy({ id: deviceId });
    if (!device) {
      rejectUpgrade(socket, 401);
      return;
    }
    wss.handleUpgrade(request, socket, head, (ws) => onDeviceSocketConnected(ws, deviceId, deps, deviceRepo));
    return;
  }

  const dashboardMatch = pathname?.match(/^\/ws\/dashboard\/([^/]+)$/);
  if (dashboardMatch) {
    const deviceId = dashboardMatch[1];
    const payload = deps.tokenService.verifyToken(token);
    if (!payload || payload.scope !== "user") {
      rejectUpgrade(socket, 401);
      return;
    }
    const device = await deviceRepo.findOneBy({ id: deviceId });
    if (!device) {
      rejectUpgrade(socket, 403);
      return;
    }
    const allowed = await canViewDevice(deps.dataSource, payload.sub, device);
    if (!allowed) {
      rejectUpgrade(socket, 403);
      return;
    }
    wss.handleUpgrade(request, socket, head, (ws) => onDashboardSocketConnected(ws, deviceId, deps));
    return;
  }

  socket.destroy();
}

// Owner always allowed (self-service fast path); otherwise the same
// devices:read scoped permission check apps/api's PermissionsGuard uses —
// one implementation (@app/auth/permissions), two call sites.
async function canViewDevice(dataSource: DataSource, userId: string, device: Device): Promise<boolean> {
  if (device.ownerId === userId) return true;

  const location = await dataSource.getRepository(Location).findOneBy({ id: device.locationId });
  if (!location) return false;
  const workspace = await dataSource.getRepository(Workspace).findOneBy({ id: location.workspaceId });
  if (!workspace) return false;

  const assignments = await loadUserAssignments(
    dataSource.getRepository(UserRoleAssignment),
    dataSource.getRepository(Role),
    userId,
  );
  return hasPermission(assignments, PERMISSION_CODES.DEVICES_READ, {
    tenantId: workspace.tenantId,
    workspaceId: workspace.id,
    locationId: location.id,
  });
}

function rejectUpgrade(socket: Socket, code: 401 | 403): void {
  const statusText = code === 403 ? "Forbidden" : "Unauthorized";
  socket.write(`HTTP/1.1 ${code} ${statusText}\r\n\r\n`);
  socket.destroy();
}

function onDeviceSocketConnected(ws: WebSocket, deviceId: string, deps: WsDeps, deviceRepo: Repository<Device>): void {
  deviceRepo.update({ id: deviceId }, { status: "online", lastSeenAt: new Date() }).catch(() => undefined);

  ws.on("message", (raw: Buffer) => {
    const metrics = parseDeviceMetricsMessage(raw.toString());
    if (!metrics) return;

    const now = new Date();
    const payload = { ...metrics, device_id: deviceId, received_at: now.toISOString() };

    // Publish only — nothing here blocks on or depends on a database write
    // succeeding. Durable persistence into MongoDB happens asynchronously
    // and independently in apps/workers/ingestion-worker, which subscribes
    // to this same channel. This is the whole point of the availability
    // (REST)/consistency (WS) split: the hot delivery path never waits on
    // a database write.
    void deps.redisService.publish(deviceChannel(deviceId), JSON.stringify(payload));
    void deviceRepo.update({ id: deviceId }, { status: "online", lastSeenAt: now });
  });

  ws.on("close", () => {
    void deviceRepo.update({ id: deviceId }, { status: "offline" });
  });
}

function onDashboardSocketConnected(ws: WebSocket, deviceId: string, deps: WsDeps): void {
  const channel = deviceChannel(deviceId);
  const subscriber = deps.redisService.createSubscriber();

  void subscriber.subscribe(channel);
  subscriber.on("message", (ch: string, message: string) => {
    if (ch === channel && ws.readyState === WebSocket.OPEN) ws.send(message);
  });

  ws.on("close", () => {
    void subscriber.unsubscribe(channel);
    subscriber.disconnect();
  });
}
