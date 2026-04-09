import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
} from '@nestjs/common';
import { Observable } from 'rxjs';
import { tap, catchError } from 'rxjs/operators';
import { Request, Response } from 'express';
import { MetricsService } from '../metrics/metrics.service';

@Injectable()
export class HttpMetricsInterceptor implements NestInterceptor {
  constructor(private metricsService: MetricsService) {}

  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    const req = context.switchToHttp().getRequest<Request>();
    const res = context.switchToHttp().getResponse<Response>();

    // Skip /metrics endpoint itself
    if (req.path === '/metrics') {
      return next.handle();
    }

    return next.handle().pipe(
      tap(() => {
        this.metricsService.recordHttpRequest(
          req.method,
          req.path,
          res.statusCode,
        );
      }),
      catchError((error) => {
        const statusCode = error.status || error.getStatus?.() || 500;
        this.metricsService.recordHttpRequest(
          req.method,
          req.path,
          statusCode,
        );
        throw error;
      }),
    );
  }
}