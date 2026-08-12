import { useEffect, useRef, useState } from "react";
import { WS_BASE_URL, getToken } from "../api/client";

export interface MetricsMessage {
  device_id: string;
  battery_level: number | null;
  battery_state: string | null;
  total_memory_mb: number | null;
  free_disk_mb: number | null;
  total_disk_mb: number | null;
  cpu_load_estimate_percent: number | null;
  device_model: string | null;
  os_version: string | null;
  ts: string | null;
  received_at: string;
}

const STALE_AFTER_MS = 6000;

export function useDashboardSocket(deviceId: string | undefined) {
  const [latest, setLatest] = useState<MetricsMessage | null>(null);
  const [isSending, setIsSending] = useState(false);
  const [connected, setConnected] = useState(false);
  const socketRef = useRef<WebSocket | null>(null);

  useEffect(() => {
    if (!deviceId) return;
    const token = getToken();
    const socket = new WebSocket(`${WS_BASE_URL}/ws/dashboard/${deviceId}?token=${token}`);
    socketRef.current = socket;

    socket.onopen = () => setConnected(true);
    socket.onclose = () => setConnected(false);
    socket.onmessage = (event) => {
      const data = JSON.parse(event.data) as MetricsMessage;
      setLatest(data);
      setIsSending(true);
    };

    return () => {
      socket.close();
      socketRef.current = null;
    };
  }, [deviceId]);

  useEffect(() => {
    if (!latest) return;
    const timeout = setTimeout(() => setIsSending(false), STALE_AFTER_MS);
    return () => clearTimeout(timeout);
  }, [latest]);

  return { latest, isSending, connected };
}
