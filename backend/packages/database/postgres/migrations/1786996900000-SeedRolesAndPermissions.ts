import { randomUUID } from "crypto";
import { MigrationInterface, QueryRunner } from "typeorm";
import { DEVICE_TYPE_CODES, DEVICE_TYPE_LABELS } from "@app/common/constants/device.constant";
import {
  PERMISSION_CODES,
  PERMISSION_DESCRIPTIONS,
  ROLE_CODES,
  ROLE_DESCRIPTIONS,
  ROLE_PERMISSIONS,
} from "@app/common/constants/permissions.constant";

// Reference data needed in every environment (not demo data — that's
// postgres/seeds/demo.seed.ts, a separate opt-in script). Reads from the
// same ROLE_PERMISSIONS map apps/api's guards and demo.seed.ts use, so the
// seeded rows can never drift from what the application code expects to
// find.
export class SeedRolesAndPermissions1786996900000 implements MigrationInterface {
  name = "SeedRolesAndPermissions1786996900000";

  public async up(queryRunner: QueryRunner): Promise<void> {
    const permissionIds = new Map<string, string>();
    for (const code of Object.values(PERMISSION_CODES)) {
      const id = randomUUID();
      permissionIds.set(code, id);
      await queryRunner.query(`INSERT INTO "permissions" ("id", "code", "description") VALUES ($1, $2, $3)`, [
        id,
        code,
        PERMISSION_DESCRIPTIONS[code],
      ]);
    }

    for (const roleCode of Object.values(ROLE_CODES)) {
      const roleId = randomUUID();
      await queryRunner.query(`INSERT INTO "roles" ("id", "code", "description") VALUES ($1, $2, $3)`, [
        roleId,
        roleCode,
        ROLE_DESCRIPTIONS[roleCode],
      ]);

      for (const permissionCode of ROLE_PERMISSIONS[roleCode]) {
        await queryRunner.query(`INSERT INTO "role_permissions" ("role_id", "permission_id") VALUES ($1, $2)`, [
          roleId,
          permissionIds.get(permissionCode),
        ]);
      }
    }

    for (const code of Object.values(DEVICE_TYPE_CODES)) {
      await queryRunner.query(`INSERT INTO "device_types" ("id", "code", "label") VALUES ($1, $2, $3)`, [
        randomUUID(),
        code,
        DEVICE_TYPE_LABELS[code],
      ]);
    }
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DELETE FROM "role_permissions"`);
    await queryRunner.query(`DELETE FROM "roles"`);
    await queryRunner.query(`DELETE FROM "permissions"`);
    await queryRunner.query(`DELETE FROM "device_types"`);
  }
}
