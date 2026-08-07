import {
    ArgumentsHost,
    Catch,
    ExceptionFilter,
    HttpException,
    HttpStatus,
    Logger,
} from '@nestjs/common';
import { Request, Response } from 'express';

import {
    ERROR_CODES,
    ERROR_MESSAGES,
} from '../constants/error.constants';

@Catch()
export class HttpExceptionFilter implements ExceptionFilter {
    private readonly logger = new Logger(HttpExceptionFilter.name);

    catch(exception: unknown, host: ArgumentsHost): void {
        const context = host.switchToHttp();

        const response = context.getResponse<Response>();
        const request = context.getRequest<Request>();

        const status =
            exception instanceof HttpException
                ? exception.getStatus()
                : HttpStatus.INTERNAL_SERVER_ERROR;

        const exceptionResponse =
            exception instanceof HttpException
                ? exception.getResponse()
                : null;

        let code: string = ERROR_CODES.INTERNAL_SERVER_ERROR;
        let message: string = ERROR_MESSAGES.INTERNAL_SERVER_ERROR;
        let details: unknown = undefined;

        if (
            typeof exceptionResponse === 'object' &&
            exceptionResponse !== null
        ) {
            if ('code' in exceptionResponse) {
                code = String(exceptionResponse.code);
            }

            if ('message' in exceptionResponse) {
                message = Array.isArray(exceptionResponse.message)
                    ? exceptionResponse.message.join(', ')
                    : String(exceptionResponse.message);
            }

            if ('details' in exceptionResponse) {
                details = exceptionResponse.details;
            }
        } else if (typeof exceptionResponse === 'string') {
            message = exceptionResponse;
        }

        if (status >= HttpStatus.INTERNAL_SERVER_ERROR) {
            if (exception instanceof Error) {
                this.logger.error(exception.message, exception.stack);
            } else {
                this.logger.error('Unknown exception occurred', String(exception));
            }
        }

        response.status(status).json({
            statusCode: status,
            code,
            message,
            ...(details !== undefined && { details }),
            path: request.url,
            timestamp: new Date().toISOString(),
        });
    }
}