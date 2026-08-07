import { utilities as nestWinstonUtilities } from 'nest-winston';
import { format, LoggerOptions, transports } from 'winston';

const isProduction = process.env.NODE_ENV === 'production';

export const loggerConfig: LoggerOptions = {
    level: isProduction ? 'info' : 'debug',

    format: isProduction
        ? format.combine(
            format.timestamp(),
            format.errors({ stack: true }),
            format.json(),
        )
        : format.combine(
            format.timestamp(),
            format.errors({ stack: true }),
            nestWinstonUtilities.format.nestLike('MonitoringApp', {
                colors: true,
                prettyPrint: true,
            }),
        ),

    transports: [
        new transports.Console(),
    ],
};