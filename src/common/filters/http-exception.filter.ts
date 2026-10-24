import {
  ArgumentsHost,
  Catch,
  ExceptionFilter,
  HttpException,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import { Request, Response } from 'express';

// Filtro global para estandarizar respuestas de excepcion HTTP
@Catch()
export class HttpExceptionFilter implements ExceptionFilter {
  private readonly logger = new Logger(HttpExceptionFilter.name);

  catch(exception: unknown, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<Request>();

    let status = HttpStatus.INTERNAL_SERVER_ERROR;

    if (exception instanceof HttpException) {
      status = exception.getStatus();
    } else if (
      typeof exception === 'object' &&
      exception !== null &&
      'status' in exception &&
      typeof (exception as any).status === 'number'
    ) {
      status = (exception as any).status;
    } else if (
      typeof exception === 'object' &&
      exception !== null &&
      'statusCode' in exception &&
      typeof (exception as any).statusCode === 'number'
    ) {
      status = (exception as any).statusCode;
    }

    const exceptionResponse =
      exception instanceof HttpException ? exception.getResponse() : null;

    let message: string | string[] = 'Error interno del servidor';
    let errorName = 'Internal Server Error';

    if (typeof exceptionResponse === 'string') {
      message = exceptionResponse;
    } else if (
      typeof exceptionResponse === 'object' &&
      exceptionResponse !== null
    ) {
      const resObj = exceptionResponse as Record<string, any>;
      message = resObj.message || message;
      errorName = resObj.error || errorName;
    } else if (exception instanceof Error) {
      if (status === HttpStatus.PAYLOAD_TOO_LARGE) {
        message = 'El tamano de la carga util excede el limite permitido (50MB)';
        errorName = 'Payload Too Large';
      } else {
        message = exception.message || message;
      }
    }

    if (status >= 500) {
      this.logger.error(
        `${request.method} ${request.url} - ${status}`,
        exception instanceof Error ? exception.stack : String(exception),
      );
    }

    response.status(status).json({
      statusCode: status,
      error: errorName,
      message,
      timestamp: new Date().toISOString(),
      path: request.url,
    });
  }
}
