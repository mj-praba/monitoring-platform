// stores application settings

import { registerAs } from "@nestjs/config";

export default registerAs('app', () => ({
    name: process.env.APP_NAME,
    env: process.env.NODE_ENV,
    port: Number(process.env.PORT),
    apiPrefix: process.env.API_PREFIX,
    apiVersion: process.env.API_VERSION,
}));