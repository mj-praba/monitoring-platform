import { AppState, AppStateStatus } from "react-native";
import { WS_BASE_URL } from "./api";
import { sampleDeviceMetrics } from "./deviceStats";

const SEND_INTERVAL_MS = 2000;

export class DeviceMetricsStreamer {
  private socket: WebSocket | null = null;
  private timer: ReturnType<typeof setInterval> | null = null;
  private appStateSub: { remove: () => void } | null = null;

  constructor(
    private deviceId: string,
    private deviceToken: string,
    private onStatusChange: (sending: boolean) => void,
  ) {}

  start(): void {
    this.appStateSub = AppState.addEventListener("change", this.handleAppStateChange);
    if (AppState.currentState === "active") {
      this.connect();
    }
  }

  stop(): void {
    this.appStateSub?.remove();
    this.disconnect();
  }

  private handleAppStateChange = (state: AppStateStatus) => {
    if (state === "active") {
      this.connect();
    } else {
      // App backgrounded or closed: stop the socket immediately, no more data leaves the device.
      this.disconnect();
    }
  };

  private connect(): void {
    if (this.socket) return;
    const url = `${WS_BASE_URL}/ws/device/${this.deviceId}?token=${this.deviceToken}`;
    const socket = new WebSocket(url);
    this.socket = socket;

    socket.onopen = () => {
      this.onStatusChange(true);
      this.timer = setInterval(async () => {
        if (socket.readyState !== WebSocket.OPEN) return;
        const sample = await sampleDeviceMetrics();
        socket.send(JSON.stringify(sample));
      }, SEND_INTERVAL_MS);
    };

    socket.onclose = () => this.onStatusChange(false);
    socket.onerror = () => this.onStatusChange(false);
  }

  private disconnect(): void {
    if (this.timer) {
      clearInterval(this.timer);
      this.timer = null;
    }
    this.socket?.close();
    this.socket = null;
    this.onStatusChange(false);
  }
}
