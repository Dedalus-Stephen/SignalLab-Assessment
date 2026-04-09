import { Module } from '@nestjs/common';
import { APP_INTERCEPTOR } from '@nestjs/core';
import { HealthModule } from './health/health.module';
import { ScenarioModule } from './scenario/scenario.module';
import { MetricsModule } from './metrics/metrics.module';
import { PrismaService } from './common/prisma.service';
import { HttpMetricsInterceptor } from './common/http-metrics.interceptor';

@Module({
  imports: [HealthModule, ScenarioModule, MetricsModule],
  providers: [
    PrismaService,
    {
      provide: APP_INTERCEPTOR,
      useClass: HttpMetricsInterceptor,
    },
  ],
  exports: [PrismaService],
})
export class AppModule {}