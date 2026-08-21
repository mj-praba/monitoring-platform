export interface PostgresConfig {
  host: string;
  port: number;
  username: string;
  password: string;
  database: string;
  schema: string;
  ssl: boolean;
}

export interface MongoConfig {
  host: string;
  port: number;
  username?: string;
  password?: string;
  database: string;
  ssl: boolean;
}

export interface RedisConfig {
  host: string;
  port: number;
  username?: string;
  password?: string;
  db: number;
  ssl: boolean;
}

export interface ClickHouseConfig {
  host: string;
  port: number;
  username: string;
  password: string;
  database: string;
  ssl: boolean;
}
