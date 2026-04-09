import { Injectable, OnModuleInit } from '@nestjs/common';
import * as client from 'prom-client';

@Injectable()
export class MetricsService implements OnModuleInit {
  private readonly register: client.Registry;

  public readonly scenarioRunsTotal: client.Counter<string>;
  public readonly scenarioRunDuration: client.Histogram<string>;
  public readonly httpRequestsTotal: client.Counter<string>;

  constructor() {
    this.register = new client.Registry();

    // Set default labels
    this.register.setDefaultLabels({ app: 'signal-lab' });

    // Collect default metrics (CPU, memory, event loop, etc.)
    client.collectDefaultMetrics({ register: this.register });

    // Scenario runs counter
    this.scenarioRunsTotal = new client.Counter({
      name: 'scenario_runs_total',
      help: 'Total number of scenario runs',
      labelNames: ['type', 'status'],
      registers: [this.register],
    });

    // Scenario run duration histogram
    this.scenarioRunDuration = new client.Histogram({
      name: 'scenario_run_duration_seconds',
      help: 'Duration of scenario runs in seconds',
      labelNames: ['type'],
      buckets: [0.01, 0.05, 0.1, 0.5, 1, 2, 5, 10],
      registers: [this.register],
    });

    // HTTP requests counter
    this.httpRequestsTotal = new client.Counter({
      name: 'http_requests_total',
      help: 'Total number of HTTP requests',
      labelNames: ['method', 'path', 'status_code'],
      registers: [this.register],
    });
  }

  onModuleInit() {
    // Metrics are ready
  }

  recordScenarioRun(type: string, status: string, durationMs: number) {
    this.scenarioRunsTotal.inc({ type, status });
    this.scenarioRunDuration.observe({ type }, durationMs / 1000);
  }

  recordHttpRequest(method: string, path: string, statusCode: number) {
    // Normalize path to avoid high cardinality
    const normalizedPath = this.normalizePath(path);
    this.httpRequestsTotal.inc({
      method,
      path: normalizedPath,
      status_code: statusCode.toString(),
    });
  }

  private normalizePath(path: string): string {
    // Strip query params and normalize IDs
    return path
      .split('?')[0]
      .replace(/\/c[a-z0-9]{20,}/g, '/:id'); // Normalize cuid params
  }

  async getMetrics(): Promise<string> {
    return this.register.metrics();
  }

  getContentType(): string {
    return this.register.contentType;
  }
}