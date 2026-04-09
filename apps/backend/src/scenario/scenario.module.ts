import { Module } from '@nestjs/common';
import { ScenarioController } from './scenario.controller';
import { ScenarioService } from './scenario.service';
import { PrismaService } from '../common/prisma.service';

@Module({
  controllers: [ScenarioController],
  providers: [ScenarioService, PrismaService],
})
export class ScenarioModule {}
