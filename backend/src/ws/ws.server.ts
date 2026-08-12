import type { Server as HttpServer, IncomingMessage } from "http";
import type { Socket } from "net";
import { parse as parseUrl } from "url";
import { WebSocket, WebSocketServer } from "ws";
import type { Repository } from "typeorm";
import type { TokenService } from "../auth/token.service";
import type { Device } from "../entities/device.entity";
import { deviceChannel, RedisService } from "../redis/redis.service";
import type { MongoService } from "../mongo/mongo.service";
import { parseDeviceMetricsMessage } from "./device-metrics.util";

// Deliberately NOT using Nest's @WebSocketGateway() decorator: it's built around a
// single fixed namespace (or socket.io), and this app needs per-connection dynamic
// paths (/ws/device/{id}, /ws/dashboard/{id}) speaking plain WebSocket - the same
// protocol the browser's `new WebSocket(url)` and React Native's WebSocket already
// use. Attaching a raw `ws` server to the underlying HTTP server and routing on
// `request.url` ourselves keeps that wire format identical to the old FastAPI
// implementation, so neither the frontend nor the mobile app needed to change.
export interface WsDeps {
  deviceRepo: Repository<Device>;
  tokenService: TokenService;
  redisService: RedisService;
  mongoService: MongoService;
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

  const deviceMatch = pathname?.match(/^\/ws\/device\/([^/]+)$/);
  if (deviceMatch) {
    const deviceId = deviceMatch[1];
    const payload = deps.tokenService.decodeToken(token);
    if (!payload || payload.scope !== "device" || payload.sub !== deviceId) {
      rejectUpgrade(socket, 401);
      return;
    }
    const device = await deps.deviceRepo.findOneBy({ id: deviceId });
    if (!device) {
      rejectUpgrade(socket, 401);
      return;
    }
    wss.handleUpgrade(request, socket, head, (ws) => onDeviceSocketConnected(ws, deviceId, deps));
    return;
  }

  const dashboardMatch = pathname?.match(/^\/ws\/dashboard\/([^/]+)$/);
  if (dashboardMatch) {
    const deviceId = dashboardMatch[1];
    const payload = deps.tokenService.decodeToken(token);
    if (!payload || payload.scope !== "user") {
      rejectUpgrade(socket, 401);
      return;
    }
    const device = await deps.deviceRepo.findOneBy({ id: deviceId });
    if (!device || device.ownerId !== payload.sub) {
      rejectUpgrade(socket, 403);
      return;
    }
    wss.handleUpgrade(request, socket, head, (ws) => onDashboardSocketConnected(ws, deviceId, deps));
    return;
  }

  socket.destroy();
}

function rejectUpgrade(socket: Socket, code: 401 | 403): void {
  const statusText = code === 403 ? "Forbidden" : "Unauthorized";
  socket.write(`HTTP/1.1 ${code} ${statusText}\r\n\r\n`);
  socket.destroy();
}

function onDeviceSocketConnected(ws: WebSocket, deviceId: string, deps: WsDeps): void {
  deps.deviceRepo.update({ id: deviceId }, { status: "online", lastSeenAt: new Date() }).catch(() => undefined);

  ws.on("message", (raw: Buffer) => {
    const metrics = parseDeviceMetricsMessage(raw.toString());
    if (!metrics) return;

    const now = new Date();
    const payload = { ...metrics, device_id: deviceId, received_at: now.toISOString() };

    void deps.redisService.publish(deviceChannel(deviceId), JSON.stringify(payload));
    void deps.mongoService.deviceMetricsCollection().insertOne(payload);
    void deps.deviceRepo.update({ id: deviceId }, { status: "online", lastSeenAt: now });
  });

  ws.on("close", () => {
    void deps.deviceRepo.update({ id: deviceId }, { status: "offline" });
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
