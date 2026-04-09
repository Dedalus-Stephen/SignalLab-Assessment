import { Module } from '@nestjs/common';
import { HealthModule } from './health/health.module';
import { ScenarioModule } from './scenario/scenario.module';
import { PrismaService } from './common/prisma.service';

@Module({
  imports: [HealthModule, ScenarioModule],
  providers: [PrismaService],
  exports: [PrismaService],
})
export class AppModule {}
