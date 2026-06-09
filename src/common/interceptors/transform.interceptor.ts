import { Injectable, NestInterceptor, ExecutionContext, CallHandler } from '@nestjs/common';
import { Observable } from 'rxjs';
import { map, tap } from 'rxjs/operators';
import { Request, Response } from 'express';
import { LoggerService } from '../services/logger.service';

export interface Response<T> {
  code: number;
  data: T;
  message: string;
}

@Injectable()
export class TransformInterceptor<T> implements NestInterceptor<T, Response<T>> {
  constructor(private readonly logger: LoggerService) {}

  intercept(context: ExecutionContext, next: CallHandler): Observable<Response<T>> {
    const now = Date.now();
    const httpContext = context.switchToHttp();
    const request = httpContext.getRequest<Request>();
    const response = httpContext.getResponse<Response>();

    const { method, url, body, query, params } = request;

    // 记录请求开始日志
    this.logger.log(
      `Request started`,
      'TransformInterceptor',
      {
        method,
        url,
        body,
        query,
        params,
      }
    );

    return next.handle().pipe(
      map(data => ({
        code: 200,
        data,
        message: 'Success',
      })),
      tap((data) => {
        const elapsed = Date.now() - now;
        // 记录请求结束日志
        this.logger.log(
          `Request completed in ${elapsed}ms`,
          'TransformInterceptor',
          {
            method,
            url,
            statusCode: response.statusCode,
            response: data,
            elapsed,
          }
        );
      }),
    );
  }
}
