// stores application settings

import { registerAs } from "@nestjs/config";

export default registerAs('app', () => ({
    name: process.env.APP_NAME || 'Monitoring App Backend',
    env: process.env.NODE_ENV || 'development',
    port: Number(process.env.PORT) || 3000,
    apiPrefix: process.env.API_PREFIX || 'api',
    apiVersion: process.env.API_VERSION || 'v1',
}));