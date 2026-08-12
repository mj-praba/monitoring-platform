import { useParams } from "react-router-dom";
import { useDashboardSocket } from "../hooks/useDashboardSocket";

function StatCard({ label, value }: { label: string; value: string }) {
  return (
    <div className="card stat-card">
      <span className="muted small">{label}</span>
      <span className="stat-value">{value}</span>
    </div>
  );
}

function gbFromMb(mb: number | null): string {
  if (mb == null) return "--";
  return `${(mb / 1024).toFixed(1)} GB`;
}

export function Monitor() {
  const { deviceId } = useParams<{ deviceId: string }>();
  const { latest, isSending, connected } = useDashboardSocket(deviceId);

  const cpu = latest?.cpu_load_estimate_percent != null ? `${latest.cpu_load_estimate_percent.toFixed(0)}%` : "--";
  const totalMemory = gbFromMb(latest?.total_memory_mb ?? null);
  const disk =
    latest?.free_disk_mb != null && latest?.total_disk_mb != null
      ? `${gbFromMb(latest.free_disk_mb)} free / ${gbFromMb(latest.total_disk_mb)}`
      : "--";
  const battery = latest?.battery_level != null ? `${(latest.battery_level * 100).toFixed(0)}%` : "--";

  return (
    <div className="page">
      <header className="page-header">
        <h1>Device Monitor</h1>
      </header>

      <div className={`sending-banner ${isSending ? "sending-active" : "sending-idle"}`}>
        {isSending ? (
          <>
            <span className="dot" /> Sending data{" "}
            <span className="muted small">(Experimental - Don't worry, won't publish data when app closed)</span>
          </>
        ) : (
          <>Not sending — open the app on your phone to start streaming data.</>
        )}
      </div>

      <div className="stat-grid">
        <StatCard label="CPU (JS thread load estimate)" value={cpu} />
        <StatCard label="Total RAM" value={totalMemory} />
        <StatCard label="Disk" value={disk} />
        <StatCard label="Battery" value={battery} />
        <StatCard label="Battery state" value={latest?.battery_state ?? "--"} />
        <StatCard label="Device" value={latest?.device_model ?? "--"} />
        <StatCard label="OS version" value={latest?.os_version ?? "--"} />
      </div>

      <p className="muted small">
        Dashboard socket: {connected ? "connected" : "disconnected"}
        {latest?.received_at ? ` · last update ${new Date(latest.received_at).toLocaleTimeString()}` : ""}
      </p>
      <p className="muted small">
        All of the above is read without asking for any Android permission — battery, total RAM, and disk space are
        plain device info; CPU is a JS-thread-responsiveness proxy since apps can't read true system CPU load
        without root.
      </p>
    </div>
  );
}
