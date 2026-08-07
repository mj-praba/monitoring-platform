// validations to run application
import * as Joi from 'joi';

export const validationSchema = Joi.object({
    NODE_ENV: Joi.string()
        .valid('development', 'test', 'production')
        .default('development'),

    PORT: Joi.number()
        .port()
        .default(3000),

    APP_NAME: Joi.string()
        .required(),

    API_PREFIX: Joi.string()
        .default('api'),

    API_VERSION: Joi.string()
        .default('v1'),

    DATABASE_URL: Joi.string()
        .uri()
        .required(),

    JWT_SECRET: Joi.string()
        .min(32)
        .required(),

    JWT_EXPIRES_IN: Joi.string()
        .default('1h'),

    REDIS_HOST: Joi.string()
        .hostname()
        .required(),

    REDIS_PORT: Joi.number()
        .port()
        .default(6379),

    MQTT_URL: Joi.string()
        .uri()
        .required(),

    KAFKA_BROKER: Joi.string()
        .required(),

    WS_PORT: Joi.number()
        .port()
        .default(3001),
});