export interface AppConfig {
  postgresUrl: string;
  mongoUrl: string;
  mongoDbName: string;
  redisUrl: string;
  jwtSecret: string;
  accessTokenExpireMinutes: number;
  deviceTokenExpireMinutes: number;
  pairingCodeTtlSeconds: number;
  corsOrigins: string[];
  port: number;
}

export default (): AppConfig => ({
  postgresUrl: process.env.POSTGRES_URL ?? "postgresql://postgres:postgres@localhost:5432/monitoring_platform",
  mongoUrl: process.env.MONGO_URL ?? "mongodb://localhost:27017",
  mongoDbName: process.env.MONGO_DB_NAME ?? "monitoring_platform",
  redisUrl: process.env.REDIS_URL ?? "redis://localhost:6379/0",
  jwtSecret: process.env.JWT_SECRET ?? "dev-secret-change-me",
  accessTokenExpireMinutes: 60 * 24,
  deviceTokenExpireMinutes: 60 * 24 * 30,
  pairingCodeTtlSeconds: 300,
  corsOrigins: (process.env.CORS_ORIGINS ?? "http://localhost:5173,http://localhost:3000,http://localhost:19006").split(","),
  port: Number(process.env.PORT ?? 8000),
});
