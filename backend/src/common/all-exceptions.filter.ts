import { ArgumentsHost, Catch, ExceptionFilter, HttpException, HttpStatus, Logger } from '@nestjs/common';
import { randomUUID } from 'crypto';
import { Request, Response } from 'express';

// Todas as respostas de erro saem no mesmo formato, com um id para rastrear no log.
@Catch()
export class AllExceptionsFilter implements ExceptionFilter {
  private readonly logger = new Logger('ExceptionFilter');

  catch(exception: unknown, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const res = ctx.getResponse<Response>();
    const req = ctx.getRequest<Request>();
    const errorId = randomUUID();

    let status = HttpStatus.INTERNAL_SERVER_ERROR;
    let message: string | string[] = 'Erro interno do servidor.';

    if (exception instanceof HttpException) {
      status = exception.getStatus();
      const body = exception.getResponse();
      message = typeof body === 'string' ? body : ((body as any).message ?? exception.message);
    }

    if (status >= 500) {
      this.logger.error(
        JSON.stringify({ errorId, method: req.method, path: req.url, message: (exception as Error)?.message }),
        (exception as Error)?.stack,
      );
    } else {
      this.logger.warn(JSON.stringify({ errorId, method: req.method, path: req.url, status, message }));
    }

    res.status(status).json({
      statusCode: status,
      message,
      errorId,
      path: req.url,
      timestamp: new Date().toISOString(),
    });
  }
}
