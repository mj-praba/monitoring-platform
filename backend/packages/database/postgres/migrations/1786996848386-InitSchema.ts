import { MigrationInterface, QueryRunner } from "typeorm";

export class InitSchema1786996848386 implements MigrationInterface {
    name = 'InitSchema1786996848386'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`CREATE TABLE "tenants" ("id" character varying NOT NULL, "name" character varying NOT NULL, "slug" character varying NOT NULL, "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), CONSTRAINT "UQ_2310ecc5cb8be427097154b18fc" UNIQUE ("slug"), CONSTRAINT "PK_53be67a04681c66b87ee27c9321" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE TABLE "workspaces" ("id" character varying NOT NULL, "tenant_id" character varying NOT NULL, "name" character varying NOT NULL, "slug" character varying NOT NULL, "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), CONSTRAINT "PK_098656ae401f3e1a4586f47fd8e" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE UNIQUE INDEX "IDX_6bda7cb08f75ea3d635da8e327" ON "workspaces" ("tenant_id", "slug") `);
        await queryRunner.query(`CREATE TABLE "locations" ("id" character varying NOT NULL, "workspace_id" character varying NOT NULL, "name" character varying NOT NULL, "type" character varying NOT NULL DEFAULT 'other', "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), CONSTRAINT "PK_7cc1c9e3853b94816c094825e74" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE TABLE "permissions" ("id" character varying NOT NULL, "code" character varying NOT NULL, "description" character varying NOT NULL, CONSTRAINT "UQ_8dad765629e83229da6feda1c1d" UNIQUE ("code"), CONSTRAINT "PK_920331560282b8bd21bb02290df" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE TABLE "roles" ("id" character varying NOT NULL, "code" character varying NOT NULL, "description" character varying NOT NULL, CONSTRAINT "UQ_f6d54f95c31b73fb1bdd8e91d0c" UNIQUE ("code"), CONSTRAINT "PK_c1433d71a4838793a49dcad46ab" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE TABLE "user_role_assignments" ("id" character varying NOT NULL, "user_id" character varying NOT NULL, "role_id" character varying NOT NULL, "scope_type" character varying NOT NULL, "scope_id" character varying NOT NULL, "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), CONSTRAINT "PK_ac634a3aa59d70bf0fb7b423b47" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE TABLE "users" ("id" character varying NOT NULL, "email" character varying NOT NULL, "hashed_password" character varying NOT NULL, "tenant_id" character varying NOT NULL, "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), CONSTRAINT "UQ_97672ac88f789774dd47f7c8be3" UNIQUE ("email"), CONSTRAINT "PK_a3ffb1c0c8416b9fc6f907b7433" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE TABLE "device_types" ("id" character varying NOT NULL, "code" character varying NOT NULL, "label" character varying NOT NULL, CONSTRAINT "UQ_f41ceb37e6d7b9a10a14b2d2707" UNIQUE ("code"), CONSTRAINT "PK_c22e8985afe8ffe3ee485e41af8" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE TABLE "devices" ("id" character varying NOT NULL, "owner_id" character varying NOT NULL, "device_type_id" character varying NOT NULL, "location_id" character varying NOT NULL, "name" character varying NOT NULL DEFAULT 'Android device', "platform" character varying NOT NULL DEFAULT 'android', "device_token" character varying NOT NULL, "status" character varying NOT NULL DEFAULT 'offline', "metadata" jsonb NOT NULL DEFAULT '{}', "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "last_seen_at" TIMESTAMP WITH TIME ZONE, CONSTRAINT "UQ_a63867095088b891e2c5d68ec24" UNIQUE ("device_token"), CONSTRAINT "PK_b1514758245c12daf43486dd1f0" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE TABLE "pairing_sessions" ("id" character varying NOT NULL, "code" character varying NOT NULL, "owner_id" character varying NOT NULL, "location_id" character varying NOT NULL, "status" character varying NOT NULL DEFAULT 'pending', "device_id" character varying, "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "expires_at" TIMESTAMP WITH TIME ZONE NOT NULL, CONSTRAINT "UQ_180a21a382fe719e512f2518c66" UNIQUE ("code"), CONSTRAINT "PK_e5fba9574321ec5176aa97bf997" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE TABLE "refresh_tokens" ("id" character varying NOT NULL, "user_id" character varying NOT NULL, "token_hash" character varying NOT NULL, "issued_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "expires_at" TIMESTAMP WITH TIME ZONE NOT NULL, "revoked_at" TIMESTAMP WITH TIME ZONE, "replaced_by_id" character varying, CONSTRAINT "UQ_a7838d2ba25be1342091b6695f1" UNIQUE ("token_hash"), CONSTRAINT "PK_7d8bee0204106019488c4c50ffa" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE TABLE "role_permissions" ("role_id" character varying NOT NULL, "permission_id" character varying NOT NULL, CONSTRAINT "PK_25d24010f53bb80b78e412c9656" PRIMARY KEY ("role_id", "permission_id"))`);
        await queryRunner.query(`CREATE INDEX "IDX_178199805b901ccd220ab7740e" ON "role_permissions" ("role_id") `);
        await queryRunner.query(`CREATE INDEX "IDX_17022daf3f885f7d35423e9971" ON "role_permissions" ("permission_id") `);
        await queryRunner.query(`ALTER TABLE "role_permissions" ADD CONSTRAINT "FK_178199805b901ccd220ab7740ec" FOREIGN KEY ("role_id") REFERENCES "roles"("id") ON DELETE CASCADE ON UPDATE CASCADE`);
        await queryRunner.query(`ALTER TABLE "role_permissions" ADD CONSTRAINT "FK_17022daf3f885f7d35423e9971e" FOREIGN KEY ("permission_id") REFERENCES "permissions"("id") ON DELETE CASCADE ON UPDATE CASCADE`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "role_permissions" DROP CONSTRAINT "FK_17022daf3f885f7d35423e9971e"`);
        await queryRunner.query(`ALTER TABLE "role_permissions" DROP CONSTRAINT "FK_178199805b901ccd220ab7740ec"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_17022daf3f885f7d35423e9971"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_178199805b901ccd220ab7740e"`);
        await queryRunner.query(`DROP TABLE "role_permissions"`);
        await queryRunner.query(`DROP TABLE "refresh_tokens"`);
        await queryRunner.query(`DROP TABLE "pairing_sessions"`);
        await queryRunner.query(`DROP TABLE "devices"`);
        await queryRunner.query(`DROP TABLE "device_types"`);
        await queryRunner.query(`DROP TABLE "users"`);
        await queryRunner.query(`DROP TABLE "user_role_assignments"`);
        await queryRunner.query(`DROP TABLE "roles"`);
        await queryRunner.query(`DROP TABLE "permissions"`);
        await queryRunner.query(`DROP TABLE "locations"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_6bda7cb08f75ea3d635da8e327"`);
        await queryRunner.query(`DROP TABLE "workspaces"`);
        await queryRunner.query(`DROP TABLE "tenants"`);
    }

}
