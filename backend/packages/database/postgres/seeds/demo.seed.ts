// Dev-only demo data: `pnpm seed:demo`. Deliberately NOT wired into the
// automatic migration-on-boot path in apps/api/src/main.ts — auto-creating
// known-password accounts on every environment boot (including a
// misconfigured prod) is a credential-exposure smell, so seeding demo
// accounts stays an explicit, opt-in command. Idempotent: safe to re-run.
import "dotenv/config";
import { randomBytes } from "crypto";
import * as bcrypt from "bcryptjs";
import { DataSource } from "typeorm";
import { loadAppConfig } from "@app/common/config/configuration";
import { ROLE_CODES } from "@app/common/constants/permissions.constant";
import { SCOPE_TYPES } from "@app/common/constants/scope.constant";
import { buildPostgresDataSourceOptions } from "../options";
import { Location, Role, Tenant, User, UserRoleAssignment, Workspace } from "../entities";

function generatePassword(): string {
  return randomBytes(9).toString("base64url");
}

async function main() {
  const config = loadAppConfig();
  const dataSource = new DataSource(buildPostgresDataSourceOptions(config.postgres));
  await dataSource.initialize();

  const tenants = dataSource.getRepository(Tenant);
  const workspaces = dataSource.getRepository(Workspace);
  const locations = dataSource.getRepository(Location);
  const roles = dataSource.getRepository(Role);
  const users = dataSource.getRepository(User);
  const assignments = dataSource.getRepository(UserRoleAssignment);

  const existing = await tenants.findOneBy({ slug: "acme" });
  if (existing) {
    console.log('Demo tenant "acme" already exists — seed is idempotent, nothing to do.');
    await dataSource.destroy();
    return;
  }

  const tenant = await tenants.save(tenants.create({ name: "Acme Corp", slug: "acme" }));
  const workspace = await workspaces.save(
    workspaces.create({ tenantId: tenant.id, name: "Default Workspace", slug: "default" }),
  );

  const [home] = await locations.save([
    locations.create({ workspaceId: workspace.id, name: "Home", type: "home" }),
    locations.create({ workspaceId: workspace.id, name: "Work", type: "work" }),
    locations.create({ workspaceId: workspace.id, name: "Other", type: "other" }),
  ]);

  const adminRole = await roles.findOneByOrFail({ code: ROLE_CODES.ADMIN });
  const userRole = await roles.findOneByOrFail({ code: ROLE_CODES.USER });

  const adminPassword = generatePassword();
  const userPassword = generatePassword();

  const adminUser = await users.save(
    users.create({
      email: "admin@example.com",
      hashedPassword: await bcrypt.hash(adminPassword, 10),
      tenantId: tenant.id,
    }),
  );
  const regularUser = await users.save(
    users.create({
      email: "user@example.com",
      hashedPassword: await bcrypt.hash(userPassword, 10),
      tenantId: tenant.id,
    }),
  );

  await assignments.save([
    assignments.create({ userId: adminUser.id, roleId: adminRole.id, scopeType: SCOPE_TYPES.TENANT, scopeId: tenant.id }),
    assignments.create({ userId: regularUser.id, roleId: userRole.id, scopeType: SCOPE_TYPES.LOCATION, scopeId: home.id }),
  ]);

  console.log("Demo data seeded:");
  console.log("  tenant=acme workspace=default locations=home,work,other");
  console.log(`  admin : admin@example.com / ${adminPassword}  (role=admin, scope=tenant:${tenant.id})`);
  console.log(`  user  : user@example.com  / ${userPassword}  (role=user, scope=location:${home.id} "Home")`);
  console.log("These are dev-only credentials — never run this script against production.");

  await dataSource.destroy();
}

main().catch((error) => {
  console.error("Demo seed failed:", error);
  process.exit(1);
});
