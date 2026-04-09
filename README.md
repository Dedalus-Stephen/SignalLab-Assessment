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
# Edit .env and add your SENTRY_DSN

# 3. Start everything
docker compose up -d

# 4. Verify
curl http://localhost:3001/api/health
# → { "status": "ok", "timestamp": "..." }
```

## Access Points

| Service    | URL                          |
|------------|------------------------------|
| Frontend   | http://localhost:3000         |
| Backend    | http://localhost:3001         |
| Swagger    | http://localhost:3001/api/docs|
| PostgreSQL | localhost:5432               |

## Stop

```bash
docker compose down
# To also remove data:
docker compose down -v
```

## Project Structure

```
signal-lab/
├── apps/
│   ├── frontend/          # Next.js + shadcn/ui + TanStack Query + RHF
│   └── backend/           # NestJS + Prisma + Sentry
├── prisma/
│   └── schema.prisma      # Database schema
├── docker-compose.yml      # All services
├── .env.example            # Environment template
└── README.md
```
