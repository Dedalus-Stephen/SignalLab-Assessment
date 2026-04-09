---
description: "Scaffold a new NestJS REST endpoint with controller, service, DTO, Swagger, Prisma model, and full observability (metrics + logging + Sentry)."
---

# Add Endpoint

Create a new fully-instrumented NestJS endpoint. I need the following information:

1. **Domain name** (e.g., "scenario", "user", "report") — use `$ARGUMENTS` if provided
2. **Operations** — what CRUD operations are needed (default: create + list)

## Instructions

Follow the `nestjs-endpoint` skill for the full scaffold process. Specifically:

1. Create the folder structure at `apps/backend/src/<domain>/`
2. Create the DTO with class-validator + Swagger decorators in `dto/`
3. Create the service with:
   - PrismaService injection
   - Prometheus counter (`<domain>_operations_total`) and histogram (`<domain>_operation_duration_seconds`)
   - NestJS Logger with structured log entries (include domain-specific context)
   - Sentry captureException for system errors
4. Create the controller with Swagger `@ApiTags`, `@ApiOperation`, `@ApiResponse`
5. Create the module and register it in `app.module.ts`
6. If a new data model is needed, add it to `prisma/schema.prisma` and run `npx prisma migrate dev --name add-<domain>`
7. Verify:
   - Swagger shows the new endpoint at `http://localhost:3001/api/docs`
   - Metrics appear at `http://localhost:3001/metrics`
   - Logs appear in stdout as structured JSON

Follow the observability-conventions rule for metric naming and log format. Follow the prisma-patterns rule for database access. Follow the error-handling rule for exception mapping.
