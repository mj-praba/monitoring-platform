import "reflect-metadata";
import { join } from "path";
import { ValidationPipe } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { NestFactory } from "@nestjs/core";
import { DocumentBuilder, SwaggerModule } from "@nestjs/swagger";
import { WINSTON_MODULE_NEST_PROVIDER } from "nest-winston";
import { DataSource } from "typeorm";
import { AppConfig } from "@app/common/config/configuration";
import { HttpExceptionFilter } from "@app/common/filters/http-exception.filter";
import { ClickHouseService } from "@app/database/clickhouse/clickhouse.service";
import { runClickHouseMigrations } from "@app/database/clickhouse/migration-runner";
import { MongoService } from "@app/database/mongo/mongo.service";
import { RedisService } from "@app/database/redis/redis.service";
import { AppModule } from "./app.module";

// Same relative depth in both ts-node (source) and compiled dist, since
// packages/* is compiled alongside apps/api/src into a mirrored dist tree
// (see backend/apps/api/tsconfig.build.json) — this path resolves
// correctly under both.
const CLICKHOUSE_MIGRATIONS_DIR = join(__dirname, "../../../packages/database/clickhouse/migrations");

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  const config = app.get(ConfigService<AppConfig, true>);
  const logger = app.get(WINSTON_MODULE_NEST_PROVIDER);
  app.useLogger(logger);

  // Explicit dataSource.runMigrations() rather than the implicit
  // `migrationsRun: true` TypeORM option: a failure here gets a clear log
  // line and a controlled exit instead of an opaque rejected promise from
  // Nest's bootstrap.
  const dataSource = app.get(DataSource);
  try {
    logger.log("Running Postgres migrations...", "Bootstrap");
    await dataSource.runMigrations();
    logger.log("Postgres migrations applied", "Bootstrap");
  } catch (error) {
    logger.error("Postgres migration failed, aborting startup", (error as Error).stack, "Bootstrap");
    await app.close();
    process.exit(1);
  }

  const clickhouseService = app.get(ClickHouseService);
  try {
    logger.log("Running ClickHouse migrations...", "Bootstrap");
    await runClickHouseMigrations(clickhouseService.getClient(), CLICKHOUSE_MIGRATIONS_DIR);
    logger.log("ClickHouse migrations applied", "Bootstrap");
  } catch (error) {
    logger.error("ClickHouse migration failed, aborting startup", (error as Error).stack, "Bootstrap");
    await app.close();
    process.exit(1);
  }

  app.useGlobalFilters(new HttpExceptionFilter());
  app.enableCors({ origin: config.get("corsOrigins"), credentials: true });
  app.useGlobalPipes(new ValidationPipe({ whitelist: true, transform: true }));

  const swaggerConfig = new DocumentBuilder()
    .setTitle("Monitoring Platform API")
    .setDescription(
      "REST API for the monitoring platform — the availability-oriented read path. " +
        "See apps/websocket/asyncapi.yaml for the real-time, consistency-oriented WebSocket API.",
    )
    .setVersion("1.0")
    .addBearerAuth()
    .build();
  const document = SwaggerModule.createDocument(app, swaggerConfig);
  SwaggerModule.setup("api/docs", app, document);

  const port = config.get("port");
  await app.listen(port);
  logger.log(`monitoring-platform api listening on port ${port}`, "Bootstrap");

  const mongoService = app.get(MongoService);
  const redisService = app.get(RedisService);
  const shutdown = async () => {
    await Promise.allSettled([mongoService.disconnect(), redisService.disconnect(), clickhouseService.disconnect()]);
    process.exit(0);
  };
  process.on("SIGTERM", shutdown);
  process.on("SIGINT", shutdown);
}

bootstrap();
