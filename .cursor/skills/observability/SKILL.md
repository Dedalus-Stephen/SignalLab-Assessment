---
name: observability
description: >
  Add Prometheus metrics, structured logging, and Sentry integration to a new or existing
  NestJS endpoint in Signal Lab. Use this skill when creating a new endpoint, adding a new
  scenario type, or when asked to "add observability", "add metrics", "add logging",
  "instrument", or "add monitoring" to any backend feature.
---

# Observability Skill — Signal Lab

## When to Use

- Adding a new API endpoint that needs metrics and logging
- Adding a new scenario type to the scenario runner
- Someone says "add observability" or "instrument this endpoint"
- Reviewing whether an endpoint has proper observability

## Prerequisites

These packages are already installed in the backend:

- `prom-client` — Prometheus metrics
- `@sentry/nestjs` — Sentry error tracking
- `@nestjs/common` Logger — structured logging

## Step-by-Step: Add Observability to a New Endpoint

### Step 1: Define Metrics

In your service file (or a shared metrics file), register Prometheus metrics:

```typescript
import { Counter, Histogram } from 'prom-client';

// Counter for total operations
const operationCounter = new Counter({
  name: '<domain>_<operation>_total',          // e.g. scenario_runs_total
  help: 'Total number of <operations>',
  labelNames: ['type', 'status'] as const,
});

// Histogram for duration
const operationDuration = new Histogram({
  name: '<domain>_<operation>_duration_seconds', // e.g. scenario_run_duration_seconds
  help: 'Duration of <operations> in seconds',
  labelNames: ['type'] as const,
  buckets: [0.01, 0.05, 0.1, 0.5, 1, 2, 5, 10],
});
```

Naming rules:
- `snake_case` always
- Counters end with `_total`
- Histograms for time end with `_seconds`
- Keep label cardinality below 10 values per label

### Step 2: Add Structured Logging

Use NestJS Logger (it outputs JSON to stdout, which Promtail ships to Loki):

```typescript
import { Logger } from '@nestjs/common';

@Injectable()
export class YourService {
  private readonly logger = new Logger(YourService.name);

  async yourMethod(dto: YourDto) {
    const start = Date.now();

    this.logger.log({
      message: 'Starting operation',
      operationType: dto.type,
      operationId: 'will-be-assigned',
    });

    // ... do work ...

    const duration = Date.now() - start;
    this.logger.log({
      message: 'Operation completed',
      operationType: dto.type,
      operationId: result.id,
      duration,
    });
  }
}
```

Log levels:
- `this.logger.log(...)` → info — successful operations
- `this.logger.warn(...)` → warn — slow requests, validation errors
- `this.logger.error(...)` → error — system errors, unhandled exceptions

### Step 3: Add Sentry Integration

For error scenarios, capture exceptions in Sentry:

```typescript
import * as Sentry from '@sentry/nestjs';

// For system/unhandled errors (5xx):
try {
  // risky operation
} catch (error) {
  Sentry.withScope((scope) => {
    scope.setTag('scenario_type', dto.type);
    scope.setExtra('scenarioId', run.id);
    Sentry.captureException(error);
  });
  throw new InternalServerErrorException('System error');
}

// For validation/expected errors — breadcrumb only:
Sentry.addBreadcrumb({
  category: 'scenario',
  message: `Validation error for scenario type: ${dto.type}`,
  level: 'warning',
});
```

### Step 4: Wire Metrics into the Flow

Record metrics at the end of your operation:

```typescript
async yourMethod(dto: YourDto) {
  const end = operationDuration.startTimer({ type: dto.type });

  try {
    const result = await this.doWork(dto);
    operationCounter.inc({ type: dto.type, status: 'completed' });
    return result;
  } catch (error) {
    operationCounter.inc({ type: dto.type, status: 'failed' });
    throw error;
  } finally {
    end(); // records duration
  }
}
```

### Step 5: Verify

1. Hit the endpoint: `curl -X POST http://localhost:3001/api/your-endpoint`
2. Check metrics: `curl http://localhost:3001/metrics | grep your_metric`
3. Check logs in Loki: Grafana → Explore → Loki → `{job="signal-lab"} | json`
4. Check Sentry: trigger an error scenario and verify it appears in the Sentry dashboard

## Existing Reference

See `apps/backend/src/scenario/scenario.service.ts` for a complete working example of all three observability signals wired into the scenario runner.

## Common Mistakes

- Forgetting to call `end()` on histogram timer (use `finally` block)
- Using `console.log` instead of NestJS Logger (logs won't be structured JSON)
- Putting user IDs or request IDs as metric labels (label explosion)
- Capturing expected business errors in Sentry as exceptions (use breadcrumbs instead)
- Not including `scenarioType` in log entries (makes Loki filtering impossible)
