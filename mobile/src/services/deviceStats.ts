import * as Battery from "expo-battery";
import * as Device from "expo-device";
import * as FileSystem from "expo-file-system";

export interface DeviceMetricsSample {
  battery_level: number | null;
  battery_state: string | null;
  total_memory_mb: number | null;
  free_disk_mb: number | null;
  total_disk_mb: number | null;
  cpu_load_estimate_percent: number | null;
  device_model: string | null;
  os_version: string | null;
  ts: string;
}

const BATTERY_STATE_LABEL: Record<Battery.BatteryState, string> = {
  [Battery.BatteryState.UNKNOWN]: "unknown",
  [Battery.BatteryState.UNPLUGGED]: "unplugged",
  [Battery.BatteryState.CHARGING]: "charging",
  [Battery.BatteryState.FULL]: "full",
};

// Android doesn't expose system-wide CPU load to unprivileged apps (no root, no
// permission would even grant it), so there's no real "CPU %" to read here - not
// a limitation of Expo specifically. As a stand-in, we measure how much a short
// setTimeout overshoots its requested delay: the more the JS thread is busy doing
// other work, the later the timer fires. It's a genuine measurement (not random),
// but it reflects JS-thread contention, not true system CPU load.
async function measureJsThreadLoadPercent(): Promise<number> {
  const requestedMs = 50;
  const start = Date.now();
  await new Promise<void>((resolve) => setTimeout(resolve, requestedMs));
  const actualMs = Date.now() - start;
  const overshootMs = Math.max(0, actualMs - requestedMs);
  return Math.round(Math.min(100, (overshootMs / requestedMs) * 100));
}

const bytesToMb = (bytes: number | null | undefined) => (bytes != null ? Math.round(bytes / (1024 * 1024)) : null);

export async function sampleDeviceMetrics(): Promise<DeviceMetricsSample> {
  const [level, state, freeDiskBytes, totalDiskBytes, cpuLoad] = await Promise.all([
    Battery.getBatteryLevelAsync(),
    Battery.getBatteryStateAsync(),
    FileSystem.getFreeDiskStorageAsync(),
    FileSystem.getTotalDiskCapacityAsync(),
    measureJsThreadLoadPercent(),
  ]);

  return {
    battery_level: level >= 0 ? level : null,
    battery_state: BATTERY_STATE_LABEL[state] ?? "unknown",
    total_memory_mb: bytesToMb(Device.totalMemory),
    free_disk_mb: bytesToMb(freeDiskBytes),
    total_disk_mb: bytesToMb(totalDiskBytes),
    cpu_load_estimate_percent: cpuLoad,
    device_model: Device.modelName ?? null,
    os_version: Device.osVersion ?? null,
    ts: new Date().toISOString(),
  };
}
