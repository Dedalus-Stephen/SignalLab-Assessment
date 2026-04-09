---
description: "Check that observability is properly wired for all endpoints — metrics, logging, Sentry, and Grafana dashboard."
---

# Check Observability

Audit the current codebase for observability completeness. Check each service and controller in `apps/backend/src/` and verify the following:

## Metrics Check

1. Open `http://localhost:3001/metrics` (or read the source)
2. For each service, verify:
   - [ ] A counter metric exists (`_total` suffix)
   - [ ] A histogram metric exists (`_duration_seconds` suffix)
   - [ ] Labels follow convention: `type`, `status` for domain metrics
   - [ ] Counter is incremented in both success and failure paths
   - [ ] Histogram timer is started at the top and ended in a `finally` block
3. For HTTP metrics:
   - [ ] `http_requests_total` counter exists with `method`, `path`, `status_code` labels

## Logging Check

1. For each service, verify:
   - [ ] Uses `Logger` from `@nestjs/common` (NOT `console.log`)
   - [ ] Log entries include: `message`, `scenarioType` (or domain type), `operationId`, `duration`
   - [ ] Log levels are correct: `log()` for success, `warn()` for slow/validation, `error()` for system errors
   - [ ] No sensitive data is logged (passwords, tokens, PII)

## Sentry Check

1. Verify `@sentry/nestjs` is initialized in `main.ts`
2. For error paths, verify:
   - [ ] `Sentry.captureException()` is called for 5xx errors
   - [ ] `Sentry.addBreadcrumb()` is called for notable events (4xx)
   - [ ] Sentry scope includes relevant tags and extras
   - [ ] Expected business errors (404, 418) are NOT captured as exceptions

## Grafana Dashboard Check

1. Open `monitoring/grafana/dashboards/` and verify:
   - [ ] At least 3 panels exist
   - [ ] Panels reference actual metric names from the codebase
   - [ ] Prometheus datasource is configured in `monitoring/grafana/provisioning/datasources/`
   - [ ] Loki datasource is configured for log panels

## Report

After checking, output a summary like:

```
Observability Audit Report
===========================
Metrics:      ✓ 3/3 services instrumented
Logging:      ✓ Structured JSON, proper levels
Sentry:       ✓ Initialized, captures system errors
Dashboard:    ✓ 5 panels, all metrics mapped
Issues found: 0

(or list specific issues to fix)
```
