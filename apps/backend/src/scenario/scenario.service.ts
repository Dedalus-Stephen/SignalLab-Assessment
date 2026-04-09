import {
  Injectable,
  BadRequestException,
  InternalServerErrorException,
  HttpException,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import * as Sentry from '@sentry/node';
import { PrismaService } from '../common/prisma.service';
import { MetricsService } from '../metrics/metrics.service';
import { RunScenarioDto } from './scenario.dto';

@Injectable()
export class ScenarioService {
  private readonly logger = new Logger(ScenarioService.name);

  constructor(
    private prisma: PrismaService,
    private metricsService: MetricsService,
  ) {}

  async run(dto: RunScenarioDto) {
    const startTime = Date.now();

    try {
      switch (dto.type) {
        case 'success':
          return await this.handleSuccess(dto, startTime);
        case 'validation_error':
          return await this.handleValidationError(dto, startTime);
        case 'system_error':
          return await this.handleSystemError(dto, startTime);
        case 'slow_request':
          return await this.handleSlowRequest(dto, startTime);
        case 'teapot':
          return await this.handleTeapot(dto, startTime);
        default:
          throw new BadRequestException(`Unknown scenario type: ${dto.type}`);
      }
    } catch (error) {
      // Re-throw HTTP exceptions as-is
      if (error instanceof HttpException) {
        throw error;
      }
      throw error;
    }
  }

  private async handleSuccess(dto: RunScenarioDto, startTime: number) {
    const duration = Date.now() - startTime;

    const run = await this.prisma.scenarioRun.create({
      data: {
        type: dto.type,
        status: 'completed',
        duration,
        metadata: dto.name ? { name: dto.name } : undefined,
      },
    });

    this.metricsService.recordScenarioRun(dto.type, 'completed', duration);

    this.logger.log({
      message: 'Scenario run completed',
      scenarioType: dto.type,
      scenarioId: run.id,
      duration,
      status: 'completed',
    });

    return { id: run.id, status: run.status, duration: run.duration };
  }

  private async handleValidationError(dto: RunScenarioDto, startTime: number) {
    const duration = Date.now() - startTime;

    const run = await this.prisma.scenarioRun.create({
      data: {
        type: dto.type,
        status: 'failed',
        duration,
        error: 'Simulated validation error: invalid input data',
        metadata: dto.name ? { name: dto.name } : undefined,
      },
    });

    this.metricsService.recordScenarioRun(dto.type, 'failed', duration);

    this.logger.warn({
      message: 'Scenario validation error',
      scenarioType: dto.type,
      scenarioId: run.id,
      duration,
      error: 'Simulated validation error',
    });

    Sentry.addBreadcrumb({
      category: 'scenario',
      message: `Validation error in scenario ${run.id}`,
      level: 'warning',
    });

    throw new BadRequestException({
      message: 'Simulated validation error: invalid input data',
      scenarioId: run.id,
    });
  }

  private async handleSystemError(dto: RunScenarioDto, startTime: number) {
    const duration = Date.now() - startTime;

    const run = await this.prisma.scenarioRun.create({
      data: {
        type: dto.type,
        status: 'failed',
        duration,
        error: 'Simulated system error: unhandled exception',
        metadata: dto.name ? { name: dto.name } : undefined,
      },
    });

    this.metricsService.recordScenarioRun(dto.type, 'failed', duration);

    this.logger.error({
      message: 'Scenario system error',
      scenarioType: dto.type,
      scenarioId: run.id,
      duration,
      error: 'Simulated system error',
    });

    const error = new Error(
      `Simulated system error in scenario ${run.id}: unhandled exception`,
    );
    Sentry.captureException(error);

    throw new InternalServerErrorException({
      message: 'Simulated system error: unhandled exception',
      scenarioId: run.id,
    });
  }

  private async handleSlowRequest(dto: RunScenarioDto, startTime: number) {
    const delay = Math.floor(Math.random() * 3000) + 2000; // 2000-5000ms
    await new Promise((resolve) => setTimeout(resolve, delay));

    const duration = Date.now() - startTime;

    const run = await this.prisma.scenarioRun.create({
      data: {
        type: dto.type,
        status: 'completed',
        duration,
        metadata: dto.name ? { name: dto.name, delay } : { delay },
      },
    });

    this.metricsService.recordScenarioRun(dto.type, 'completed', duration);

    this.logger.warn({
      message: 'Slow scenario run completed',
      scenarioType: dto.type,
      scenarioId: run.id,
      duration,
      delay,
      status: 'completed',
    });

    return { id: run.id, status: run.status, duration: run.duration };
  }

  private async handleTeapot(dto: RunScenarioDto, startTime: number) {
    const duration = Date.now() - startTime;

    const run = await this.prisma.scenarioRun.create({
      data: {
        type: dto.type,
        status: 'completed',
        duration,
        metadata: { easter: true, name: dto.name || undefined },
      },
    });

    this.metricsService.recordScenarioRun(dto.type, 'completed', duration);

    this.logger.log({
      message: "I'm a teapot",
      scenarioType: dto.type,
      scenarioId: run.id,
      duration,
      signal: 42,
    });

    throw new HttpException(
      { signal: 42, message: "I'm a teapot" },
      HttpStatus.I_AM_A_TEAPOT,
    );
  }

  async getHistory(limit = 20) {
    return this.prisma.scenarioRun.findMany({
      take: limit,
      orderBy: { createdAt: 'desc' },
    });
  }
}