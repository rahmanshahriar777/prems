import {
  ExceptionFilter,
  Catch,
  ArgumentsHost,
  HttpException,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import { Request, Response } from 'express';

@Catch()
export class AllExceptionsFilter implements ExceptionFilter {
  private readonly logger = new Logger(AllExceptionsFilter.name);

  catch(exception: unknown, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<Request>();

    let status = HttpStatus.INTERNAL_SERVER_ERROR;
    let message = 'Internal server error';
    let code = 'INTERNAL_ERROR';
    let details: any = null;

    if (exception instanceof HttpException) {
      status = exception.getStatus();
      const res = exception.getResponse();

      if (typeof res === 'string') {
        message = res;
      } else if (typeof res === 'object' && res !== null) {
        const obj = res as Record<string, any>;
        message = obj.message || exception.message;
        code = obj.error || 'HTTP_EXCEPTION';
        details = obj.details || (Array.isArray(obj.message) ? obj.message : undefined);
      }
    } else if (exception instanceof Error) {
      message = exception.message;
      code = exception.name;
    }

    if (status >= 500) {
      this.logger.error(
        `[${request.method}] ${request.url} - ${status} ${message}`,
        exception instanceof Error ? exception.stack : undefined,
      );
    } else {
      this.logger.warn(`[${request.method}] ${request.url} - ${status} ${message}`);
    }

    response.status(status).json({
      success: false,
      error: {
        code,
        message,
        statusCode: status,
        details,
        path: request.url,
        timestamp: new Date().toISOString(),
      },
    });
  }
}
