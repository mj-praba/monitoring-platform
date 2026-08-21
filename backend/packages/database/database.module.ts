import { Global, Module } from "@nestjs/common";
import { ClickHouseModule } from "./clickhouse/module";
import { MongoModule } from "./mongo/module";
import { PostgresModule } from "./postgres/module";
import { RedisModule } from "./redis/module";

// apps/api only. The one place "make DB access available app-wide" lives —
// each leaf module's job is just "wire up this one database from config";
// being @Global() is a separate, single policy decision made here once,
// not repeated on every leaf module.
@Global()
@Module({
  imports: [PostgresModule, MongoModule, RedisModule, ClickHouseModule],
  exports: [PostgresModule, MongoModule, RedisModule, ClickHouseModule],
})
export class DatabaseModule {}
