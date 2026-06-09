import { ExceptionFilter, Catch, ArgumentsHost, HttpException, HttpStatus, Injectable } from '@nestjs/common';
import { Request, Response } from 'express';
import { LoggerService } from '../services/logger.service';

@Catch()
@Injectable()
export class HttpExceptionFilter implements ExceptionFilter {
  constructor(private readonly logger: LoggerService) {}

  catch(exception: any, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<Request>();
    
    let status = HttpStatus.INTERNAL_SERVER_ERROR;
    let message = 'Internal server error';
    
    if (exception instanceof HttpException) {
      status = exception.getStatus();
      message = exception.message;
    } else if (exception.code) {
      // 处理数据库错误
      switch (exception.code) {
        case 'ER_DUP_ENTRY':
          status = HttpStatus.CONFLICT;
          message = 'Duplicate entry';
          break;
        case 'ER_BAD_FIELD_ERROR':
          status = HttpStatus.BAD_REQUEST;
          message = 'Invalid field';
          break;
        default:
          message = exception.message || message;
      }
    } else {
      // 其他错误
      message = exception.message || message;
    }

    // 记录错误日志
    this.logger.error(
      `${status} - ${message}`,
      exception.stack,
      'HttpExceptionFilter',
      {
        path: request.url,
        method: request.method,
        body: request.body,
        query: request.query,
        params: request.params,
      }
    );

    response
      .status(status)
      .json({
        code: status,
        message: message,
        timestamp: new Date().toISOString(),
        path: request.url,
        // 开发环境下可以添加错误堆栈信息
        // stack: process.env.NODE_ENV === 'development' ? exception.stack : undefined,
      });
  }
}
