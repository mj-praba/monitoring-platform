import { HttpException, HttpStatus } from "@nestjs/common";
import { IAppExceptionOptions } from "../types/exception.types";

export class AppException extends HttpException {
  constructor({ message, code, statusCode = HttpStatus.INTERNAL_SERVER_ERROR, details }: IAppExceptionOptions) {
    super({ message, code, statusCode, details }, statusCode);
  }
}
