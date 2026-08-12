import { Device } from "../entities/device.entity";

export interface DeviceOut {
  id: string;
  name: string;
  platform: string;
  status: string;
  last_seen_at: string | null;
}

export function toDeviceOut(device: Device): DeviceOut {
  return {
    id: device.id,
    name: device.name,
    platform: device.platform,
    status: device.status,
    last_seen_at: device.lastSeenAt ? new Date(device.lastSeenAt).toISOString() : null,
  };
}
