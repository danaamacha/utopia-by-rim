import {
  ExceptionFilter,
  Catch,
  ArgumentsHost,
  HttpException,
  HttpStatus,
  ConflictException,
} from '@nestjs/common';
import { QueryFailedError } from 'typeorm';

@Catch()
export class AllExceptionsFilter implements ExceptionFilter {
  catch(exception: unknown, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse();
    const request = ctx.getRequest();

    let status = HttpStatus.INTERNAL_SERVER_ERROR;
    let message: any = 'Internal server error';

    // Handle TypeORM duplicate key errors
    if (
      exception instanceof QueryFailedError &&
      exception.message.includes('duplicate key')
    ) {
      status = HttpStatus.CONFLICT;
      // Extract field name from error message if possible
      if (exception.message.includes('slug')) {
        message = 'A category with this slug already exists';
      } else if (exception.message.includes('sku')) {
        message = 'A product with this SKU already exists';
      } else if (exception.message.includes('email')) {
        message = 'A user with this email already exists';
      } else {
        message = 'Duplicate entry - this value already exists';
      }
    }
    // Handle HttpException (including ConflictException)
    else if (exception instanceof HttpException) {
      status = exception.getStatus();
      message = exception.getResponse();
    }
    // Handle regular Error
    else if (exception instanceof Error) {
      message = exception.message;
    }

    // Log the full error for debugging
    console.error('❌ Error:', message);
    if (exception instanceof Error) {
      console.error('Stack:', exception.stack);
    }

    response.status(status).json({
      statusCode: status,
      timestamp: new Date().toISOString(),
      path: request.url,
      message: typeof message === 'string' ? message : (message as any)?.message || message,
      ...(process.env.NODE_ENV !== 'production' &&
        exception instanceof Error && { stack: exception.stack }),
    });
  }
}

