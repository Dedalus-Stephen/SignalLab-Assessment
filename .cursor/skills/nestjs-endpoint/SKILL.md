---
name: nestjs-endpoint
description: >
  Scaffold a new NestJS REST endpoint in Signal Lab with controller, service, DTO,
  Swagger docs, and observability. Use this skill when asked to "add an endpoint",
  "create an API route", "add a new resource", or "scaffold a controller" in the backend.
---

# NestJS Endpoint Skill — Signal Lab

## When to Use

- Creating a new REST endpoint or resource
- Adding a new controller/service pair
- Someone says "add an endpoint for X" or "create a CRUD for Y"

## Step-by-Step: Create a New Endpoint

### Step 1: Generate the Module

Use NestJS CLI or create files manually in `apps/backend/src/<domain>/`:

```
apps/backend/src/<domain>/
├── <domain>.module.ts
├── <domain>.controller.ts
├── <domain>.service.ts
└── dto/
    ├── create-<domain>.dto.ts
    └── <domain>-response.dto.ts
```

### Step 2: Define the DTO

Use `class-validator` for validation and `@nestjs/swagger` for docs:

```typescript
// dto/create-<domain>.dto.ts
import { IsString, IsOptional, IsEnum } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateDomainDto {
  @ApiProperty({ description: 'Type of the operation', enum: ['typeA', 'typeB'] })
  @IsEnum(['typeA', 'typeB'])
  type: string;

  @ApiPropertyOptional({ description: 'Optional name' })
  @IsOptional()
  @IsString()
  name?: string;
}
```

### Step 3: Create the Service

Inject `PrismaService`, add logging and metrics:

```typescript
// <domain>.service.ts
import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { Counter, Histogram } from 'prom-client';

const opsTotal = new Counter({
  name: '<domain>_operations_total',
  help: 'Total <domain> operations',
  labelNames: ['type', 'status'] as const,
});

const opsDuration = new Histogram({
  name: '<domain>_operation_duration_seconds',
  help: '<Domain> operation duration',
  labelNames: ['type'] as const,
  buckets: [0.01, 0.05, 0.1, 0.5, 1, 2, 5],
});

@Injectable()
export class DomainService {
  private readonly logger = new Logger(DomainService.name);

  constructor(private readonly prisma: PrismaService) {}

  async create(dto: CreateDomainDto) {
    const end = opsDuration.startTimer({ type: dto.type });
    try {
      const result = await this.prisma.<model>.create({ data: { ... } });
      opsTotal.inc({ type: dto.type, status: 'completed' });
      this.logger.log({ message: 'Operation completed', type: dto.type, id: result.id });
      return result;
    } catch (error) {
      opsTotal.inc({ type: dto.type, status: 'failed' });
      this.logger.error({ message: 'Operation failed', type: dto.type, error: error.message });
      throw error;
    } finally {
      end();
    }
  }
}
```

### Step 4: Create the Controller

```typescript
// <domain>.controller.ts
import { Controller, Post, Body, Get, Query } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';

@ApiTags('<domain>')
@Controller('api/<domain>')
export class DomainController {
  constructor(private readonly service: DomainService) {}

  @Post()
  @ApiOperation({ summary: 'Create a new <domain> operation' })
  @ApiResponse({ status: 201, description: 'Created successfully' })
  @ApiResponse({ status: 400, description: 'Validation error' })
  async create(@Body() dto: CreateDomainDto) {
    return this.service.create(dto);
  }

  @Get()
  @ApiOperation({ summary: 'List recent <domain> operations' })
  async findAll(@Query('limit') limit?: number) {
    return this.service.findRecent(limit || 20);
  }
}
```

### Step 5: Register the Module

```typescript
// <domain>.module.ts
import { Module } from '@nestjs/common';
import { DomainController } from './<domain>.controller';
import { DomainService } from './<domain>.service';

@Module({
  controllers: [DomainController],
  providers: [DomainService],
})
export class DomainModule {}
```

Then add `DomainModule` to the `imports` array in `app.module.ts`.

### Step 6: Add Prisma Model (if needed)

Add the model to `prisma/schema.prisma`, then:

```bash
npx prisma migrate dev --name add-<domain>-model
```

### Step 7: Verify

1. Check Swagger: `http://localhost:3001/api/docs` — new endpoints visible
2. Test the endpoint: `curl -X POST http://localhost:3001/api/<domain> -H 'Content-Type: application/json' -d '{"type":"typeA"}'`
3. Check metrics: `curl http://localhost:3001/metrics | grep <domain>`
4. Check logs in Grafana → Loki

## Checklist

- [ ] DTO with class-validator decorators
- [ ] Swagger decorators on controller and DTO
- [ ] PrismaService injected in service
- [ ] Prometheus counter + histogram
- [ ] Structured logging (Logger, not console.log)
- [ ] Error handling with appropriate NestJS exceptions
- [ ] Module registered in app.module.ts
- [ ] Prisma model + migration (if new data)
