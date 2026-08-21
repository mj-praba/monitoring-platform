import Joi from "joi";
import { ClickHouseConfig, MongoConfig, PostgresConfig, RedisConfig } from "../types/database-config.types";

export interface AuthConfig {
  jwtSecret: string;
  accessTokenExpireMinutes: number;
  refreshTokenExpireDays: number;
  deviceTokenExpireMinutes: number;
  pairingCodeTtlSeconds: number;
}

export interface AppConfig {
  nodeEnv: string;
  port: number;
  wsPort: number;
  corsOrigins: string[];
  auth: AuthConfig;
  postgres: PostgresConfig;
  mongo: MongoConfig;
  redis: RedisConfig;
  clickhouse: ClickHouseConfig;
}

const DEV_JWT_SECRET = "dev-secret-change-me";

const envSchema = Joi.object({
  NODE_ENV: Joi.string().valid("development", "test", "production").default("development"),
  PORT: Joi.number().port().default(8001),
  WS_PORT: Joi.number().port().default(8002),
  CORS_ORIGINS: Joi.string().default("http://localhost:5173,http://localhost:3000,http://localhost:19006"),

  JWT_SECRET: Joi.string()
    .min(16)
    .required()
    .when("NODE_ENV", { is: "production", then: Joi.invalid(DEV_JWT_SECRET) }),
  ACCESS_TOKEN_EXPIRE_MINUTES: Joi.number().positive().default(60 * 24),
  REFRESH_TOKEN_EXPIRE_DAYS: Joi.number().positive().default(30),
  DEVICE_TOKEN_EXPIRE_MINUTES: Joi.number().positive().default(60 * 24 * 30),
  PAIRING_CODE_TTL_SECONDS: Joi.number().positive().default(300),

  POSTGRES_HOST: Joi.string().required(),
  POSTGRES_PORT: Joi.number().port().required(),
  POSTGRES_USER: Joi.string().required(),
  POSTGRES_PASSWORD: Joi.string().allow("").required(),
  POSTGRES_DB: Joi.string().required(),
  POSTGRES_SCHEMA: Joi.string().default("public"),
  POSTGRES_SSL: Joi.boolean().default(false),

  MONGO_HOST: Joi.string().required(),
  MONGO_PORT: Joi.number().port().required(),
  MONGO_USER: Joi.string().allow("").optional(),
  MONGO_PASSWORD: Joi.string().allow("").optional(),
  MONGO_DB: Joi.string().required(),
  MONGO_SSL: Joi.boolean().default(false),

  REDIS_HOST: Joi.string().required(),
  REDIS_PORT: Joi.number().port().required(),
  REDIS_USER: Joi.string().allow("").optional(),
  REDIS_PASSWORD: Joi.string().allow("").optional(),
  REDIS_DB: Joi.number().min(0).default(0),
  REDIS_SSL: Joi.boolean().default(false),

  CLICKHOUSE_HOST: Joi.string().required(),
  CLICKHOUSE_PORT: Joi.number().port().required(),
  CLICKHOUSE_USER: Joi.string().required(),
  CLICKHOUSE_PASSWORD: Joi.string().allow("").required(),
  CLICKHOUSE_DB: Joi.string().required(),
  CLICKHOUSE_SSL: Joi.boolean().default(false),
}).unknown(true);

// Framework-agnostic: called directly by the plain-TS apps (websocket,
// workers) as the first line of main.ts, and wrapped by Nest's
// ConfigModule.forRoot({ load: [loadAppConfig] }) in apps/api. Validates
// and throws synchronously on invalid/missing env — fail-fast in every
// process, Nest or not.
export function loadAppConfig(): AppConfig {
  const { error, value: env } = envSchema.validate(process.env, { abortEarly: false });
  if (error) {
    throw new Error(`Invalid environment configuration: ${error.message}`);
  }

  return {
    nodeEnv: env.NODE_ENV,
    port: env.PORT,
    wsPort: env.WS_PORT,
    corsOrigins: String(env.CORS_ORIGINS).split(","),
    auth: {
      jwtSecret: env.JWT_SECRET,
      accessTokenExpireMinutes: env.ACCESS_TOKEN_EXPIRE_MINUTES,
      refreshTokenExpireDays: env.REFRESH_TOKEN_EXPIRE_DAYS,
      deviceTokenExpireMinutes: env.DEVICE_TOKEN_EXPIRE_MINUTES,
      pairingCodeTtlSeconds: env.PAIRING_CODE_TTL_SECONDS,
    },
    postgres: {
      host: env.POSTGRES_HOST,
      port: env.POSTGRES_PORT,
      username: env.POSTGRES_USER,
      password: env.POSTGRES_PASSWORD,
      database: env.POSTGRES_DB,
      schema: env.POSTGRES_SCHEMA,
      ssl: env.POSTGRES_SSL,
    },
    mongo: {
      host: env.MONGO_HOST,
      port: env.MONGO_PORT,
      username: env.MONGO_USER || undefined,
      password: env.MONGO_PASSWORD || undefined,
      database: env.MONGO_DB,
      ssl: env.MONGO_SSL,
    },
    redis: {
      host: env.REDIS_HOST,
      port: env.REDIS_PORT,
      username: env.REDIS_USER || undefined,
      password: env.REDIS_PASSWORD || undefined,
      db: env.REDIS_DB,
      ssl: env.REDIS_SSL,
    },
    clickhouse: {
      host: env.CLICKHOUSE_HOST,
      port: env.CLICKHOUSE_PORT,
      username: env.CLICKHOUSE_USER,
      password: env.CLICKHOUSE_PASSWORD,
      database: env.CLICKHOUSE_DB,
      ssl: env.CLICKHOUSE_SSL,
    },
  };
}
