---
description: "Check the health of the entire Signal Lab Docker stack — all services, endpoints, and observability pipeline."
---

# Health Check

Run a comprehensive health check of the entire Signal Lab stack. Execute the following checks in order:

## 1. Docker Services

Run `docker compose ps` and verify all services are running:

- [ ] `postgres` — healthy
- [ ] `backend` — running, port 3001
- [ ] `frontend` — running, port 3000
- [ ] `prometheus` — running, port 9090
- [ ] `loki` — running, port 3100
- [ ] `promtail` — running
- [ ] `grafana` — running, port 3200

If any service is not running, check logs with `docker compose logs <service>`.

## 2. Backend Health

```bash
curl -s http://localhost:3001/api/health
```

Expected: `{ "status": "ok", "timestamp": "..." }`

## 3. Frontend

```bash
curl -s -o /dev/null -w "%{http_code}" http://localhost:3000
```

Expected: `200`

## 4. Swagger Docs

```bash
curl -s -o /dev/null -w "%{http_code}" http://localhost:3001/api/docs
```

Expected: `200`

## 5. Prometheus Metrics

```bash
curl -s http://localhost:3001/metrics | head -5
```

Expected: Prometheus text format with metric entries

## 6. Prometheus Scraping

```bash
curl -s http://localhost:9090/api/v1/targets | grep -o '"health":"[^"]*"'
```

Expected: `"health":"up"` for the backend target

## 7. Loki

```bash
curl -s http://localhost:3100/ready
```

Expected: `ready`

## 8. Grafana

```bash
curl -s -o /dev/null -w "%{http_code}" http://localhost:3200/api/health
```

Expected: `200`

## 9. End-to-End Signal Test

Run a test scenario and verify the signal flows:

```bash
# Trigger a scenario
curl -s -X POST http://localhost:3001/api/scenarios/run \
  -H 'Content-Type: application/json' \
  -d '{"type":"success"}' | jq .

# Check metric was incremented
curl -s http://localhost:3001/metrics | grep scenario_runs_total
```

## Report

Output a summary:

```
Signal Lab Health Check
========================
Docker services:  ✓ 7/7 running
Backend health:   ✓ 200 OK
Frontend:         ✓ 200 OK
Swagger:          ✓ Available
Metrics endpoint: ✓ Serving Prometheus format
Prometheus:       ✓ Scraping backend
Loki:             ✓ Ready
Grafana:          ✓ Running on :3200
E2E signal:       ✓ Scenario → metric confirmed

Overall: ALL HEALTHY
```
