import { Injectable } from '@nestjs/common';
import { PrismaService } from '../common/prisma.service';
import { RunScenarioDto } from './scenario.dto';

@Injectable()
export class ScenarioService {
  constructor(private prisma: PrismaService) {}

  async run(dto: RunScenarioDto) {
    const startTime = Date.now();

    const run = await this.prisma.scenarioRun.create({
      data: {
        type: dto.type,
        status: 'completed',
        duration: Date.now() - startTime,
        metadata: dto.name ? { name: dto.name } : undefined,
      },
    });

    return {
      id: run.id,
      status: run.status,
      duration: run.duration,
    };
  }

  async getHistory(limit = 20) {
    return this.prisma.scenarioRun.findMany({
      take: limit,
      orderBy: { createdAt: 'desc' },
    });
  }
}
