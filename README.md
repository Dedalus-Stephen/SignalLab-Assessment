# Signal Lab

Observability playground — run scenarios, generate metrics, logs, and errors. See them in Grafana, Loki, and Sentry.

## Prerequisites

- Docker >= 24.0
- Docker Compose >= 2.20
- Node.js >= 20 (for local development only)

## Quick Start

```bash
# 1. Clone and enter
git clone git@github.com:Dedalus-Stephen/SignalLab-Assessment.git
cd SignalLab-Assessment

# 2. Copy env file
cp .env.example .env
# Edit .env and set your SENTRY_DSN

# 3. Start everything
docker compose up -d

# 4. Verify
curl http://localhost:3001/api/health
# → { "status": "ok", "timestamp": "..." }
```

## Access Points

| Service      | URL                            | Credentials     |
|------------- |--------------------------------|-----------------|
| Frontend     | http://localhost:3000           | —               |
| Backend API  | http://localhost:3001           | —               |
| Swagger      | http://localhost:3001/api/docs  | —               |
| Metrics      | http://localhost:3001/metrics   | —               |
| Grafana      | http://localhost:3200           | admin / admin   |
| Prometheus   | http://localhost:9090           | —               |
| Loki         | http://localhost:3100           | —               |
| PostgreSQL   | localhost:5432                  | see .env        |

## Verification Walkthrough (5 min)

1. **Start the stack**: `docker compose up -d` — wait for all services to be healthy.
2. **Open UI**: http://localhost:3000 — the Signal Lab page loads.
3. **Run "success" scenario** → green badge appears in history, toast shows success.
4. **Run "system_error" scenario** → red badge in history, error toast.
5. **Run "slow_request" scenario** → takes 2-5s, then completes with duration shown.
6. **Run "teapot" scenario** → toast shows "I'm a teapot! (HTTP 418)".
7. **Check metrics**: http://localhost:3001/metrics → see `scenario_runs_total`, `scenario_run_duration_seconds`.
8. **Check Grafana**: http://localhost:3200 → open "Signal Lab — Observability" dashboard → see graphs with data.
9. **Check Loki logs**: In Grafana → Explore → select Loki datasource → query `{job="signal-lab"} | json` → see structured logs.
10. **Check Sentry**: Open your Sentry project → see captured exception from `system_error` scenario.

## Scenario Types

| Type               | HTTP Status | Behavior                                         |
|--------------------|-------------|--------------------------------------------------|
| `success`          | 200         | Saves run, returns completed                     |
| `validation_error` | 400         | Saves run as failed, returns validation error    |
| `system_error`     | 500         | Saves run as failed, captures exception in Sentry|
| `slow_request`     | 200         | Sleeps 2-5s, then success path                   |
| `teapot`           | 418         | Returns `{ signal: 42 }`, saves with easter egg  |

## Observability Signals

- **Prometheus metrics**: `scenario_runs_total` (counter), `scenario_run_duration_seconds` (histogram), `http_requests_total` (counter)
- **Structured logs**: JSON format to stdout, collected by Promtail → Loki. Fields: `timestamp`, `level`, `scenarioType`, `scenarioId`, `duration`, `error`
- **Sentry**: Exception capture on `system_error`, breadcrumbs on `validation_error`
- **Grafana dashboard**: 5 panels — Scenario Runs by Type, Latency Distribution, Error Rate, HTTP Requests, Application Logs

## Stop

```bash
docker compose down
# To also remove all data:
docker compose down -v
```

## Project Structure

```
signal-lab/
├── apps/
│   ├── frontend/          # Next.js + shadcn/ui + TanStack Query + RHF
│   └── backend/           # NestJS + Prisma + Sentry + prom-client
├── prisma/
│   └── schema.prisma
├── monitoring/
│   ├── prometheus/        # Prometheus scrape config
│   ├── grafana/           # Provisioned datasources + dashboards
│   ├── loki/              # Loki config
│   └── promtail/          # Promtail log shipping config
├── docker-compose.yml
├── .env.example
└── README.md
```