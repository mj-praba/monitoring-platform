import { HttpStatus } from '@nestjs/common';

export interface IAppExceptionOptions {
  message: string;
  code: string;
  statusCode?: HttpStatus;
  details?: unknown;
}
