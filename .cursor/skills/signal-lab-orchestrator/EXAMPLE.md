# Orchestrator Example — Running PRD 002

This is a worked example showing what happens when you run the orchestrator against PRD 002 (Observability Demo). It demonstrates the full pipeline from start to finish.

---

## Triggering the Orchestrator

**User types in Cursor chat:**
```
/run-prd prds/002_prd-observability-demo.md
```

**Orchestrator responds:**
> Starting PRD execution for `prds/002_prd-observability-demo.md`
> Creating execution directory: `.execution/2026-04-08-14-30/`
> Initializing context.json...
> Phase 1 of 7: PRD Analysis — delegating to analyzer subagent...

---

## Phase 1: PRD Analysis Result

The analyzer subagent reads PRD 002 and returns:

```json
{
  "requirements": [
    { "id": "R1", "text": "4 scenario types: success, validation_error, system_error, slow_request", "type": "functional", "priority": "must-have" },
    { "id": "R2", "text": "Scenario runner UI with RHF form, TanStack Query mutation, toast feedback", "type": "functional", "priority": "must-have" },
    { "id": "R3", "text": "Run history list with auto-refresh and colored badges", "type": "functional", "priority": "must-have" },
    { "id": "R4", "text": "POST /api/scenarios/run endpoint with type-based behavior", "type": "functional", "priority": "must-have" },
    { "id": "R5", "text": "Prometheus metrics: scenario_runs_total, scenario_run_duration_seconds, http_requests_total", "type": "functional", "priority": "must-have" },
    { "id": "R6", "text": "Structured JSON logging shipped to Loki", "type": "functional", "priority": "must-have" },
    { "id": "R7", "text": "Sentry integration: captureException for system_error", "type": "functional", "priority": "must-have" },
    { "id": "R8", "text": "Grafana dashboard with 3+ panels", "type": "functional", "priority": "must-have" },
    { "id": "R9", "text": "Docker Compose adds prometheus, grafana, loki, promtail", "type": "functional", "priority": "must-have" },
    { "id": "R10", "text": "5th scenario type 'teapot': HTTP 418, body {signal: 42, message: \"I'm a teapot\"}, metadata {easter: true}", "type": "functional", "priority": "nice-to-have" }
  ],
  "features": [
    { "id": "F1", "title": "Scenario Runner UI", "description": "Form + history + obs links", "acceptanceCriteria": ["RHF form with Select", "useMutation for POST", "Toast on result", "History with badges"] },
    { "id": "F2", "title": "Backend Scenario Execution", "description": "Type-based processing with observability signals", "acceptanceCriteria": ["4+1 scenario types", "Prisma persistence", "Metrics + logs + Sentry"] },
    { "id": "F3", "title": "Observability Stack", "description": "Prometheus + Grafana + Loki + Sentry", "acceptanceCriteria": ["Metrics endpoint", "3+ Grafana panels", "Loki log query works", "Sentry captures errors"] }
  ],
  "constraints": ["NestJS backend", "Prisma ORM", "shadcn/ui + Tailwind", "TanStack Query", "React Hook Form"],
  "existingDependencies": ["PRD 001 foundation must be complete"],
  "hiddenRequirements": ["teapot scenario (HTTP 418, signal: 42) — bonus points"]
}
```

> ✓ Phase 1 complete. Found 10 requirements (9 must-have, 1 bonus), 3 features.

---

## Phase 4: Decomposition Result (abbreviated)

After planning + decomposition, the orchestrator produces this task list:

```json
{
  "tasks": [
    {
      "id": "task-001",
      "title": "Add ScenarioRun model to Prisma schema",
      "domain": "database",
      "skill": "database-implementer",
      "complexity": "low",
      "model": "fast",
      "dependsOn": []
    },
    {
      "id": "task-002",
      "title": "Run Prisma migration for ScenarioRun",
      "domain": "database",
      "skill": "database-implementer",
      "complexity": "low",
      "model": "fast",
      "dependsOn": ["task-001"]
    },
    {
      "id": "task-003",
      "title": "Create RunScenarioDto with class-validator",
      "domain": "backend",
      "skill": "backend-implementer",
      "complexity": "low",
      "model": "fast",
      "dependsOn": ["task-001"]
    },
    {
      "id": "task-004",
      "title": "Create ScenarioResponseDto with Swagger decorators",
      "domain": "backend",
      "skill": "backend-implementer",
      "complexity": "low",
      "model": "fast",
      "dependsOn": []
    },
    {
      "id": "task-005",
      "title": "Implement ScenarioService with type-based execution logic",
      "domain": "backend",
      "skill": "backend-implementer",
      "complexity": "medium",
      "model": "default",
      "dependsOn": ["task-002", "task-003"]
    },
    {
      "id": "task-006",
      "title": "Add Prometheus metrics to ScenarioService",
      "domain": "backend",
      "skill": "backend-implementer",
      "complexity": "low",
      "model": "fast",
      "dependsOn": ["task-005"]
    },
    {
      "id": "task-007",
      "title": "Add structured logging to ScenarioService",
      "domain": "backend",
      "skill": "backend-implementer",
      "complexity": "low",
      "model": "fast",
      "dependsOn": ["task-005"]
    },
    {
      "id": "task-008",
      "title": "Add Sentry integration to ScenarioService",
      "domain": "backend",
      "skill": "backend-implementer",
      "complexity": "low",
      "model": "fast",
      "dependsOn": ["task-005"]
    },
    {
      "id": "task-009",
      "title": "Implement teapot easter egg scenario",
      "domain": "backend",
      "skill": "backend-implementer",
      "complexity": "low",
      "model": "fast",
      "dependsOn": ["task-005"]
    },
    {
      "id": "task-010",
      "title": "Create ScenarioForm component with RHF + shadcn",
      "domain": "frontend",
      "skill": "frontend-implementer",
      "complexity": "medium",
      "model": "fast",
      "dependsOn": ["task-005"]
    },
    {
      "id": "task-011",
      "title": "Create RunHistory component with TanStack Query",
      "domain": "frontend",
      "skill": "frontend-implementer",
      "complexity": "low",
      "model": "fast",
      "dependsOn": ["task-005"]
    },
    {
      "id": "task-012",
      "title": "Add observability links section to UI",
      "domain": "frontend",
      "skill": "frontend-implementer",
      "complexity": "low",
      "model": "fast",
      "dependsOn": []
    },
    {
      "id": "task-013",
      "title": "Add Prometheus + Grafana + Loki + Promtail to docker-compose",
      "domain": "infrastructure",
      "skill": "infra-implementer",
      "complexity": "medium",
      "model": "default",
      "dependsOn": []
    },
    {
      "id": "task-014",
      "title": "Create Prometheus scrape config for backend /metrics",
      "domain": "infrastructure",
      "skill": "infra-implementer",
      "complexity": "low",
      "model": "fast",
      "dependsOn": ["task-013"]
    },
    {
      "id": "task-015",
      "title": "Create Grafana dashboard JSON with 3 panels",
      "domain": "infrastructure",
      "skill": "infra-implementer",
      "complexity": "medium",
      "model": "fast",
      "dependsOn": ["task-013", "task-006"]
    },
    {
      "id": "task-016",
      "title": "Configure Promtail to ship logs to Loki",
      "domain": "infrastructure",
      "skill": "infra-implementer",
      "complexity": "low",
      "model": "fast",
      "dependsOn": ["task-013"]
    }
  ],
  "dependencyGroups": [
    { "group": 1, "title": "Database Layer", "taskIds": ["task-001", "task-002"] },
    { "group": 2, "title": "Backend DTOs", "taskIds": ["task-003", "task-004"] },
    { "group": 3, "title": "Core Service Logic", "taskIds": ["task-005"] },
    { "group": 4, "title": "Backend Observability", "taskIds": ["task-006", "task-007", "task-008", "task-009"] },
    { "group": 5, "title": "Frontend Components", "taskIds": ["task-010", "task-011", "task-012"] },
    { "group": 6, "title": "Infrastructure", "taskIds": ["task-013", "task-014", "task-015", "task-016"] }
  ],
  "modelSplit": {
    "fast": { "count": 14, "taskIds": ["task-001", "task-002", "task-003", "task-004", "task-006", "task-007", "task-008", "task-009", "task-010", "task-011", "task-012", "task-014", "task-015", "task-016"] },
    "default": { "count": 2, "taskIds": ["task-005", "task-013"] },
    "ratio": "88% fast / 12% default"
  }
}
```

> Decomposed into 16 tasks: 14 fast, 2 default (88% fast). Starting implementation...

---

## Phase 5: Implementation Progress

The orchestrator works through dependency groups in order:

```
Group 1 — Database Layer:
  ✓ task-001: Add ScenarioRun model to Prisma schema (fast, 2 min)
  ✓ task-002: Run Prisma migration (fast, 1 min)

Group 2 — Backend DTOs:
  ✓ task-003: Create RunScenarioDto (fast, 3 min)
  ✓ task-004: Create ScenarioResponseDto (fast, 2 min)

Group 3 — Core Service Logic:
  ✓ task-005: Implement ScenarioService execution logic (default, 8 min)

Group 4 — Backend Observability:
  ✓ task-006: Add Prometheus metrics (fast, 3 min)
  ✓ task-007: Add structured logging (fast, 3 min)
  ✓ task-008: Add Sentry integration (fast, 2 min)
  ✓ task-009: Implement teapot easter egg (fast, 2 min)

Group 5 — Frontend Components:
  ✓ task-010: Create ScenarioForm (fast, 5 min)
  ✓ task-011: Create RunHistory (fast, 4 min)
  ✓ task-012: Add observability links (fast, 2 min)

Group 6 — Infrastructure:
  ✓ task-013: Add monitoring to docker-compose (default, 6 min)
  ✓ task-014: Create Prometheus config (fast, 2 min)
  ✗ task-015: Create Grafana dashboard JSON (fast, FAILED — invalid JSON)
  ✓ task-016: Configure Promtail (fast, 2 min)
```

> Implementation complete. 15/16 tasks done. 1 failed. Moving to review...

---

## Phase 6: Review Results

```
Database review: PASS (2/2 checks)
  ✓ ScenarioRun model matches PRD
  ✓ Migration exists and is valid

Backend review: PASS (4/4 checks)
  ✓ Swagger decorators on all endpoints
  ✓ Prometheus metrics (counter + histogram)
  ✓ Structured logging with context fields
  ✓ Sentry captureException for system_error

Frontend review: PASS (3/3 checks)
  ✓ TanStack Query for data fetching
  ✓ React Hook Form with zod validation
  ✓ shadcn/ui components used consistently
```

---

## Phase 7: Final Report

```
Signal Lab PRD Execution — Partial

PRD: prds/002_prd-observability-demo.md
Execution ID: 2026-04-08-14-30
Started: 2026-04-08T14:30:00Z
Completed: 2026-04-08T15:15:00Z

━━━ Tasks ━━━
Total: 16 | Completed: 15 | Failed: 1 | Retries: 1
Model usage: 14 fast, 2 default (88% fast)

━━━ Completed ━━━
  ✓ Add ScenarioRun model to Prisma schema
  ✓ Run Prisma migration for ScenarioRun
  ✓ Create RunScenarioDto with class-validator
  ✓ Create ScenarioResponseDto with Swagger decorators
  ✓ Implement ScenarioService with type-based execution logic
  ✓ Add Prometheus metrics to ScenarioService
  ✓ Add structured logging to ScenarioService
  ✓ Add Sentry integration to ScenarioService
  ✓ Implement teapot easter egg scenario
  ✓ Create ScenarioForm component with RHF + shadcn
  ✓ Create RunHistory component with TanStack Query
  ✓ Add observability links section to UI
  ✓ Add Prometheus + Grafana + Loki + Promtail to docker-compose
  ✓ Create Prometheus scrape config
  ✓ Configure Promtail to ship logs to Loki

━━━ Failed ━━━
  ✗ Create Grafana dashboard JSON — Invalid JSON output after 3 retries

━━━ Review Results ━━━
  database: PASS — Schema and migration valid
  backend: PASS — All endpoints have Swagger, metrics, logging, Sentry
  frontend: PASS — TanStack Query, RHF, shadcn all used correctly

━━━ Next Steps ━━━
  - Fix Grafana dashboard manually (create JSON with 3 panels: runs by type, latency, error rate)
  - Run /health-check to verify Docker stack
  - Run /check-obs to verify observability pipeline
  - Run verification walkthrough from PRD section "Verification Walkthrough"
```

---

## Resume Example

If the orchestrator was interrupted during task-008 (Sentry integration), re-running `/run-prd` would produce:

```
Resuming PRD execution from phase: implementation
5 phases completed (analysis, codebase, planning, decomposition, implementation partially)
7 of 16 tasks completed. Resuming from task-008: Add Sentry integration to ScenarioService
```

It reads `context.json`, sees that tasks 001–007 are `"completed"` and task-008 is `"in_progress"`, and picks up from there. No work is repeated.