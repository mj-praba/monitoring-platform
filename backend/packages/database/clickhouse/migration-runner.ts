import { readdirSync, readFileSync } from "fs";
import { join } from "path";
import type { ClickHouseClient } from "@clickhouse/client";

const SCHEMA_MIGRATIONS_TABLE = "schema_migrations";

// Lightweight ClickHouse migration mechanism (TypeORM has no ClickHouse
// driver): applies every *.sql file in `migrationsDir` not yet recorded in
// a schema_migrations table, in filename order. One SQL statement per
// file — deliberate constraint, avoids building a statement splitter for
// the HTTP client. Throws immediately on failure; no partial-apply.
export async function runClickHouseMigrations(client: ClickHouseClient, migrationsDir: string): Promise<void> {
  await client.command({
    query: `
      CREATE TABLE IF NOT EXISTS ${SCHEMA_MIGRATIONS_TABLE}
      (version String, applied_at DateTime DEFAULT now())
      ENGINE = MergeTree ORDER BY version
    `,
  });

  const appliedResult = await client.query({ query: `SELECT version FROM ${SCHEMA_MIGRATIONS_TABLE}`, format: "JSONEachRow" });
  const appliedRows = await appliedResult.json<{ version: string }>();
  const applied = new Set(appliedRows.map((row) => row.version));

  const files = readdirSync(migrationsDir)
    .filter((file) => file.endsWith(".sql"))
    .sort();

  for (const file of files) {
    if (applied.has(file)) continue;

    const sql = readFileSync(join(migrationsDir, file), "utf-8").trim();
    await client.command({ query: sql });
    await client.insert({
      table: SCHEMA_MIGRATIONS_TABLE,
      values: [{ version: file }],
      format: "JSONEachRow",
    });
  }
}
