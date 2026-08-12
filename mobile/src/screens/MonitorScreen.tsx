import { useEffect, useRef, useState } from "react";
import { AppState, StyleSheet, Text, View } from "react-native";
import { DeviceMetricsSample, sampleDeviceMetrics } from "../services/deviceStats";
import { DeviceMetricsStreamer } from "../services/socket";

interface Props {
  deviceId: string;
  deviceToken: string;
}

function StatRow({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.statRow}>
      <Text style={styles.statLabel}>{label}</Text>
      <Text style={styles.statValue}>{value}</Text>
    </View>
  );
}

function gb(mb: number | null): string {
  return mb != null ? `${(mb / 1024).toFixed(1)} GB` : "--";
}

export function MonitorScreen({ deviceId, deviceToken }: Props) {
  const [sending, setSending] = useState(false);
  const [sample, setSample] = useState<DeviceMetricsSample | null>(null);
  const streamerRef = useRef<DeviceMetricsStreamer | null>(null);

  useEffect(() => {
    const streamer = new DeviceMetricsStreamer(deviceId, deviceToken, setSending);
    streamerRef.current = streamer;
    streamer.start();
    return () => streamer.stop();
  }, [deviceId, deviceToken]);

  useEffect(() => {
    let cancelled = false;
    let timer: ReturnType<typeof setTimeout> | null = null;

    async function tick() {
      if (AppState.currentState === "active") {
        const next = await sampleDeviceMetrics();
        if (!cancelled) setSample(next);
      }
      timer = setTimeout(tick, 2000);
    }
    tick();

    return () => {
      cancelled = true;
      if (timer) clearTimeout(timer);
    };
  }, []);

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Monitoring active</Text>
      <View style={[styles.banner, sending ? styles.bannerActive : styles.bannerIdle]}>
        <Text style={sending ? styles.bannerTextActive : styles.bannerTextIdle}>
          {sending ? "● Sending data" : "Not sending"}
        </Text>
      </View>
      <Text style={styles.note}>(Experimental - Don't worry, won't publish data when app closed)</Text>

      <View style={styles.statsCard}>
        <StatRow label="Battery" value={sample?.battery_level != null ? `${Math.round(sample.battery_level * 100)}%` : "--"} />
        <StatRow label="Battery state" value={sample?.battery_state ?? "--"} />
        <StatRow label="Total RAM" value={gb(sample?.total_memory_mb ?? null)} />
        <StatRow label="Disk free / total" value={`${gb(sample?.free_disk_mb ?? null)} / ${gb(sample?.total_disk_mb ?? null)}`} />
        <StatRow label="CPU (JS thread load)" value={sample?.cpu_load_estimate_percent != null ? `${sample.cpu_load_estimate_percent}%` : "--"} />
        <StatRow label="Device" value={sample?.device_model ?? "--"} />
        <StatRow label="OS version" value={sample?.os_version ?? "--"} />
      </View>

      <Text style={styles.hint}>
        None of this needs a permission prompt - it's read from expo-battery, expo-device, and expo-file-system.
        Keep this screen open in the foreground to keep streaming to the dashboard.
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 20, paddingTop: 80, backgroundColor: "#0f1115", alignItems: "center" },
  title: { color: "#e7e9ee", fontSize: 22, fontWeight: "700", marginBottom: 24 },
  banner: { paddingVertical: 10, paddingHorizontal: 18, borderRadius: 999, marginBottom: 8 },
  bannerActive: { backgroundColor: "rgba(53,201,143,0.15)" },
  bannerIdle: { backgroundColor: "rgba(139,147,163,0.15)" },
  bannerTextActive: { color: "#35c98f", fontWeight: "600" },
  bannerTextIdle: { color: "#8b93a3", fontWeight: "600" },
  note: { color: "#8b93a3", fontSize: 12, textAlign: "center", marginBottom: 20 },
  statsCard: {
    width: "100%",
    backgroundColor: "#171a21",
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#232733",
    padding: 16,
    marginBottom: 20,
  },
  statRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingVertical: 6,
  },
  statLabel: { color: "#8b93a3", fontSize: 13 },
  statValue: { color: "#e7e9ee", fontSize: 13, fontWeight: "600" },
  hint: { color: "#8b93a3", fontSize: 12, textAlign: "center" },
});
