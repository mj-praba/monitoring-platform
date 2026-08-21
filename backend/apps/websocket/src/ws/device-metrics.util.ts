export interface DeviceMetricsMessage {
  battery_level: number | null;
  battery_state: string | null;
  total_memory_mb: number | null;
  free_disk_mb: number | null;
  total_disk_mb: number | null;
  cpu_load_estimate_percent: number | null;
  device_model: string | null;
  os_version: string | null;
  ts: string | null;
}

const NUMERIC_FIELDS = [
  "battery_level",
  "total_memory_mb",
  "free_disk_mb",
  "total_disk_mb",
  "cpu_load_estimate_percent",
] as const;
const STRING_FIELDS = ["battery_state", "device_model", "os_version", "ts"] as const;

// Mirrors the old Pydantic model: unknown fields are ignored, missing fields
// default to null, and a field with the wrong type invalidates the message
// (caller skips it), same as the old `except ValidationError: continue`.
export function parseDeviceMetricsMessage(raw: string): DeviceMetricsMessage | null {
  let obj: unknown;
  try {
    obj = JSON.parse(raw);
  } catch {
    return null;
  }
  if (typeof obj !== "object" || obj === null) return null;
  const record = obj as Record<string, unknown>;

  const result = {} as DeviceMetricsMessage;
  for (const field of NUMERIC_FIELDS) {
    const value = record[field];
    if (value === undefined || value === null) {
      result[field] = null;
    } else if (typeof value === "number") {
      result[field] = value;
    } else {
      return null;
    }
  }
  for (const field of STRING_FIELDS) {
    const value = record[field];
    if (value === undefined || value === null) {
      result[field] = null;
    } else if (typeof value === "string") {
      result[field] = value;
    } else {
      return null;
    }
  }
  return result;
}
