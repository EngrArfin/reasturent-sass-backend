import {
  ExceptionFilter,
  Catch,
  ArgumentsHost,
  HttpException,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import { Request, Response } from 'express';
import { Prisma } from '../../../generated/prisma/client';

@Catch()
export class AllExceptionsFilter implements ExceptionFilter {
  private readonly logger = new Logger(AllExceptionsFilter.name);

  catch(exception: unknown, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<Request>();

    let status = HttpStatus.INTERNAL_SERVER_ERROR;
    let message: string | string[] = 'Internal server error';
    let error = 'Internal Server Error';
    let details: any = null;

    // 1. Handle NestJS HTTP Exceptions (BadRequest, NotFound, Conflict, Unauthorized, Forbidden, etc.)
    if (exception instanceof HttpException) {
      status = exception.getStatus();
      const res = exception.getResponse();

      if (typeof res === 'string') {
        message = res;
        error = exception.name.replace('Exception', '');
      } else if (typeof res === 'object' && res !== null) {
        const responseObj = res as Record<string, any>;
        message = responseObj.message || exception.message;
        error = responseObj.error || exception.name.replace('Exception', '');
        
        if (responseObj.validationErrors) {
          details = responseObj.validationErrors;
        } else if (Array.isArray(responseObj.message)) {
          details = responseObj.message;
        }
      }
    }
    // 2. Handle Prisma Client Known Request Errors (P2002, P2025, P2003, P2000, etc.)
    else if (exception instanceof Prisma.PrismaClientKnownRequestError) {
      switch (exception.code) {
        case 'P2002': {
          status = HttpStatus.CONFLICT;
          error = 'Conflict';
          const target = (exception.meta?.target as string[]) || [];
          const fields = target.length > 0 ? target.join(', ') : 'field';
          message = `Duplicate entry: A record with this ${fields} already exists`;
          details = { code: exception.code, fields: target };
          break;
        }
        case 'P2025': {
          status = HttpStatus.NOT_FOUND;
          error = 'Not Found';
          message = (exception.meta?.cause as string) || 'Requested record was not found or has been deleted';
          details = { code: exception.code };
          break;
        }
        case 'P2003': {
          status = HttpStatus.BAD_REQUEST;
          error = 'Foreign Key Violation';
          message = 'Referenced entity does not exist or relation constraint violated';
          details = { code: exception.code, field: exception.meta?.field_name };
          break;
        }
        case 'P2000': {
          status = HttpStatus.BAD_REQUEST;
          error = 'Input Too Long';
          message = 'The provided value exceeds the maximum allowable length';
          details = { code: exception.code };
          break;
        }
        default: {
          status = HttpStatus.BAD_REQUEST;
          error = 'Database Error';
          message = exception.message ? exception.message.split('\n').pop() || 'Database operation failed' : 'Database error';
          details = { code: exception.code };
          break;
        }
      }
      this.logger.warn(`Prisma Error [${exception.code}]: ${message} (${request.method} ${request.url})`);
    }
    // 3. Handle Prisma Database Validation Errors
    else if (exception instanceof Prisma.PrismaClientValidationError) {
      status = HttpStatus.BAD_REQUEST;
      error = 'Database Validation Error';
      message = 'Invalid parameters provided for database operation';
      this.logger.warn(`Prisma Validation Error: ${exception.message} (${request.method} ${request.url})`);
    }
    // 4. Handle Prisma Database Connection / Initialization Errors
    else if (exception instanceof Prisma.PrismaClientInitializationError) {
      status = HttpStatus.SERVICE_UNAVAILABLE;
      error = 'Database Unavailable';
      message = 'Could not connect to database server. Please verify connection.';
      this.logger.error(`Prisma Init Error: ${exception.message}`, exception.stack);
    }
    // 5. Handle Generic Unhandled JavaScript Runtime Errors
    else if (exception instanceof Error) {
      status = HttpStatus.INTERNAL_SERVER_ERROR;
      error = exception.name || 'Internal Server Error';
      message = process.env.NODE_ENV === 'production' ? 'An unexpected internal error occurred' : exception.message;
      this.logger.error(
        `Unhandled Exception: ${exception.message} (${request.method} ${request.url})`,
        exception.stack,
      );
    } else {
      this.logger.error(`Unknown Error: ${JSON.stringify(exception)} (${request.method} ${request.url})`);
    }

    const primaryMessage = Array.isArray(message) ? message.join('; ') : message;

    response.status(status).json({
      success: false,
      statusCode: status,
      error,
      message: primaryMessage,
      details: details || (Array.isArray(message) ? message : undefined),
      timestamp: new Date().toISOString(),
      path: request.url,
      method: request.method,
    });
  }
}

export { AllExceptionsFilter as HttpExceptionFilter, AllExceptionsFilter as GlobalExceptionFilter };
