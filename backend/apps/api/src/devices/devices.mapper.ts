import { Device } from "@app/database/postgres/entities";

export interface DeviceOut {
  id: string;
  name: string;
  platform: string;
  status: string;
  location_id: string;
  device_type_id: string;
  metadata: Record<string, unknown>;
  last_seen_at: string | null;
}

export function toDeviceOut(device: Device): DeviceOut {
  return {
    id: device.id,
    name: device.name,
    platform: device.platform,
    status: device.status,
    location_id: device.locationId,
    device_type_id: device.deviceTypeId,
    metadata: device.metadata,
    last_seen_at: device.lastSeenAt ? new Date(device.lastSeenAt).toISOString() : null,
  };
}
