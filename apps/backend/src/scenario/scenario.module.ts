import { Module } from '@nestjs/common';
import { ScenarioController } from './scenario.controller';
import { ScenarioService } from './scenario.service';
import { PrismaService } from '../common/prisma.service';
import { MetricsModule } from '../metrics/metrics.module';

@Module({
  imports: [MetricsModule],
  controllers: [ScenarioController],
  providers: [ScenarioService, PrismaService],
})
export class ScenarioModule {}