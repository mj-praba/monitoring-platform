import { WebSocket } from "ws";

// One process-wide registry, populated as /ws/dashboard/{deviceId} connections
// open and cleaned up as they close. There's a single shared Kafka consumer
// (wired up in main.ts) reading the whole device-metrics topic — this
// registry is how its message handler finds which local ws connections care
// about a given device id, replacing the old "one Redis subscriber per
// dashboard connection" (Kafka has no per-connection dynamic subscribe).
export class DashboardRegistry {
  private readonly byDevice = new Map<string, Set<WebSocket>>();

  register(deviceId: string, ws: WebSocket): void {
    let sockets = this.byDevice.get(deviceId);
    if (!sockets) {
      sockets = new Set();
      this.byDevice.set(deviceId, sockets);
    }
    sockets.add(ws);
  }

  deregister(deviceId: string, ws: WebSocket): void {
    const sockets = this.byDevice.get(deviceId);
    if (!sockets) return;
    sockets.delete(ws);
    if (sockets.size === 0) this.byDevice.delete(deviceId);
  }

  dispatch(deviceId: string, message: string): void {
    const sockets = this.byDevice.get(deviceId);
    if (!sockets) return;
    for (const ws of sockets) {
      if (ws.readyState === WebSocket.OPEN) ws.send(message);
    }
  }
}
