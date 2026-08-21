import { DataSource } from "typeorm";
import { PairingSession } from "@app/database/postgres/entities";

// Proactive version of logic that otherwise only ran lazily, inside
// devices.service.ts's pairClaim, when someone happened to try claiming an
// already-expired code.
export async function expirePairingSessions(dataSource: DataSource): Promise<void> {
  await dataSource
    .getRepository(PairingSession)
    .createQueryBuilder()
    .update()
    .set({ status: "expired" })
    .where("status = :pending", { pending: "pending" })
    .andWhere("expires_at < :now", { now: new Date() })
    .execute();
}
