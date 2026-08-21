import { DataSource } from "typeorm";
import { DEVICE_OFFLINE_THRESHOLD_MS } from "@app/common/constants/device.constant";
import { Device } from "@app/database/postgres/entities";

// Belt-and-suspenders alongside apps/websocket's ws.on("close") handler,
// which marks a device offline immediately on a graceful disconnect — this
// job catches the case a device drops off the network without the socket
// ever firing "close" (crash, connectivity loss, killed process).
export async function markStaleDevicesOffline(dataSource: DataSource): Promise<void> {
  const staleBefore = new Date(Date.now() - DEVICE_OFFLINE_THRESHOLD_MS);
  await dataSource
    .getRepository(Device)
    .createQueryBuilder()
    .update()
    .set({ status: "offline" })
    .where("status = :online", { online: "online" })
    .andWhere("last_seen_at < :staleBefore", { staleBefore })
    .execute();
}
