import { createLogger as createWinstonLogger, Logger } from "winston";
import { loggerConfig } from "./logger.config";

// Plain, framework-agnostic logger for apps/websocket and apps/workers/*
// (no Nest, no DI container). apps/api uses logger.module.ts instead,
// which wraps the same loggerConfig through nest-winston.
export function createLogger(context: string): Logger {
  return createWinstonLogger(loggerConfig).child({ context });
}
