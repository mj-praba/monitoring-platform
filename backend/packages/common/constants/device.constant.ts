export const DEVICE_TYPE_CODES = {
  MOBILE: "mobile",
  DESKTOP: "desktop",
  IOT: "iot",
} as const;

export type DeviceTypeCode = (typeof DEVICE_TYPE_CODES)[keyof typeof DEVICE_TYPE_CODES];

export const DEVICE_TYPE_LABELS: Record<DeviceTypeCode, string> = {
  [DEVICE_TYPE_CODES.MOBILE]: "Mobile",
  [DEVICE_TYPE_CODES.DESKTOP]: "Desktop",
  [DEVICE_TYPE_CODES.IOT]: "IoT",
};

// apps/workers/cron-worker marks a device offline once its lastSeenAt is
// older than this.
export const DEVICE_OFFLINE_THRESHOLD_MS = 2 * 60 * 1000;
