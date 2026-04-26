import { ExceptionFilter, Catch, ArgumentsHost, HttpException, HttpStatus, Logger } from '@nestjs/common';
import { Request, Response } from 'express';
import {
  DomainException,
  InsufficientStockException,
  CartNotFoundException,
  CartExpiredException,
  CartAlreadyCheckedOutException,
  ProductNotFoundException,
} from '../exceptions/domain.exception';

@Catch()
export class GlobalExceptionFilter implements ExceptionFilter {
  private readonly logger = new Logger(GlobalExceptionFilter.name);

  catch(exception: unknown, host: ArgumentsHost): void {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<Request>();

    const { status, body } = this.resolve(exception);

    this.logger.error(`${request.method} ${request.url} → ${status}`, exception instanceof Error ? exception.stack : String(exception));

    response.status(status).json(body);
  }

  private resolve(exception: unknown): { status: number; body: object } {
    if (exception instanceof InsufficientStockException) {
      return {
        status: HttpStatus.CONFLICT,
        body: { error: { code: exception.code, message: exception.message, details: exception.details } },
      };
    }

    if (exception instanceof CartNotFoundException || exception instanceof ProductNotFoundException) {
      return {
        status: HttpStatus.NOT_FOUND,
        body: { error: { code: exception.code, message: exception.message } },
      };
    }

    if (exception instanceof CartExpiredException) {
      return {
        status: HttpStatus.GONE,
        body: { error: { code: exception.code, message: exception.message } },
      };
    }

    if (exception instanceof CartAlreadyCheckedOutException) {
      return {
        status: HttpStatus.UNPROCESSABLE_ENTITY,
        body: { error: { code: exception.code, message: exception.message } },
      };
    }

    if (exception instanceof DomainException) {
      return {
        status: HttpStatus.BAD_REQUEST,
        body: { error: { code: exception.code, message: exception.message } },
      };
    }

    if (exception instanceof HttpException) {
      const res = exception.getResponse();
      const code = typeof res === 'object' && 'message' in res ? 'VALIDATION_ERROR' : 'HTTP_ERROR';
      const message = typeof res === 'object' && 'message' in res ? (res as { message: unknown }).message : exception.message;
      return {
        status: exception.getStatus(),
        body: { error: { code, message } },
      };
    }

    return {
      status: HttpStatus.INTERNAL_SERVER_ERROR,
      body: { error: { code: 'INTERNAL_ERROR', message: 'An unexpected error occurred.' } },
    };
  }
}
