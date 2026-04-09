# Orchestrator Coordination — Subagent Prompts

This file contains the prompt templates the orchestrator uses when delegating to subagents via the Task tool. Each prompt is self-contained — the subagent receives only this prompt plus the relevant slice of `context.json`, not the full chat history.

---

## Prompt Design Principles

1. **Minimal context:** Each subagent gets only the data it needs. An implementer doesn't need the full PRD — just its specific task, acceptance criteria, and relevant project structure.
2. **Structured output:** Every prompt requests JSON output so the orchestrator can parse and store results programmatically.
3. **Explicit constraints:** Each prompt includes the Signal Lab conventions the subagent must follow, so it doesn't need access to the full rules directory.
4. **No ambiguity:** The prompt tells the subagent exactly what to do and what format to return. "Creative interpretation" is for the planning phase only.

---

## Subagent Roles

### 1. PRD Analyzer

**Role:** Parse a PRD document into structured data.
**Model:** fast
**Input:** PRD file path
**Output:** JSON with requirements, features, constraints

```markdown
# Task: Analyze PRD

Read the file at `{prdPath}` and extract structured information.

Return a JSON object with this exact shape:
{
  "requirements": [
    {
      "id": "R1",
      "text": "Health endpoint: GET /api/health → { status: ok, timestamp }",
      "type": "functional",
      "priority": "must-have"
    }
  ],
  "features": [
    {
      "id": "F1",
      "title": "Scenario Runner UI",
      "description": "Form to select and run scenarios with results display",
      "acceptanceCriteria": [
        "Form uses React Hook Form with Select for type",
        "Mutation via TanStack Query useMutation",
        "Toast notification on success/error"
      ]
    }
  ],
  "constraints": [
    "Must use NestJS for backend",
    "Must use Prisma for database access",
    "Must use shadcn/ui + Tailwind for frontend"
  ],
  "existingDependencies": [
    "PRD 001 foundation must be in place",
    "Docker Compose base configuration exists"
  ],
  "hiddenRequirements": [
    "Check for easter eggs or bonus scenarios mentioned in the PRD"
  ]
}

Important:
- Read the PRD carefully — look for hidden/bonus requirements (e.g., teapot scenario, signal: 42)
- Classify each requirement as "must-have" or "nice-to-have"
- Only return the JSON, no commentary
```

---

### 2. Codebase Scanner

**Role:** Map what currently exists in the project.
**Model:** fast
**Input:** None (reads file system)
**Output:** JSON snapshot of current project state

```markdown
# Task: Scan Codebase

Explore the Signal Lab project and document what currently exists.

Check these specific locations:
1. `prisma/schema.prisma` — list all models and their fields
2. `apps/backend/src/` — list all modules, controllers, services, DTOs
3. `apps/frontend/src/` — list all pages, components, hooks
4. `docker-compose.yml` — list all services and their ports
5. `monitoring/` — list Grafana dashboards, Prometheus config, Loki config
6. `.cursor/` — list existing skills, rules, commands, hooks
7. `package.json` (root + apps) — list key dependencies

Return a JSON object:
{
  "database": {
    "models": [{ "name": "ScenarioRun", "fields": ["id", "type", "status", ...] }],
    "migrationCount": 1,
    "seedExists": false
  },
  "backend": {
    "modules": ["app", "scenario", "health", "metrics"],
    "endpoints": [
      { "method": "POST", "path": "/api/scenarios/run", "hasSwagger": true, "hasMetrics": true },
      { "method": "GET", "path": "/api/health", "hasSwagger": false, "hasMetrics": false }
    ],
    "services": ["ScenarioService", "PrismaService"],
    "observability": {
      "prometheusMetrics": ["scenario_runs_total", "scenario_run_duration_seconds"],
      "sentryConfigured": true,
      "structuredLogging": true
    }
  },
  "frontend": {
    "pages": ["/"],
    "components": ["ScenarioForm", "RunHistory", "ObsLinks"],
    "stateManagement": "TanStack Query",
    "formLibrary": "React Hook Form"
  },
  "infrastructure": {
    "dockerServices": [
      { "name": "frontend", "port": 3000 },
      { "name": "backend", "port": 3001 },
      { "name": "postgres", "port": 5432 }
    ],
    "monitoringStack": {
      "prometheus": true,
      "grafana": true,
      "loki": true,
      "promtail": true
    }
  },
  "cursorLayer": {
    "skills": ["nestjs-endpoint", "observability", "shadcn-form"],
    "rules": ["stack-constraints", "observability-conventions", "prisma-patterns", "frontend-patterns", "error-handling"],
    "commands": ["add-endpoint", "check-obs", "health-check"],
    "hooks": ["afterFileEdit: schema.prisma", "afterFileEdit: *.controller.ts", "beforeShellExecution: secret guard"]
  }
}

Only return the JSON. No commentary.
```

---

### 3. Planner

**Role:** Create a high-level implementation plan by diffing PRD requirements against codebase state.
**Model:** default
**Input:** PRD analysis result + codebase scan result
**Output:** Ordered plan with create/modify/skip actions

```markdown
# Task: Create Implementation Plan

You are planning a PRD implementation for Signal Lab.

## PRD Requirements
{phases.analysis.result}

## Current Codebase State
{phases.codebase.result}

## Instructions

Compare what the PRD requires against what already exists. Produce a plan where each item is one of:
- **create** — doesn't exist, must build from scratch
- **modify** — exists but needs changes to meet PRD requirements
- **skip** — already fully implemented

Order items by dependency: database first, then backend, then frontend, then infra, then docs.

Return a JSON object:
{
  "plan": [
    {
      "id": "P1",
      "domain": "database",
      "action": "create",
      "title": "Add ScenarioRun model to Prisma",
      "details": "Create model with id (cuid), type, status, duration, error, metadata (Json), createdAt fields",
      "dependsOn": [],
      "estimatedMinutes": 5
    },
    {
      "id": "P2",
      "domain": "backend",
      "action": "modify",
      "title": "Implement scenario execution logic",
      "details": "Add switch/case for success, validation_error, system_error, slow_request types in ScenarioService",
      "dependsOn": ["P1"],
      "estimatedMinutes": 15
    }
  ],
  "summary": {
    "create": 5,
    "modify": 3,
    "skip": 2,
    "totalEstimatedMinutes": 45
  }
}

Only return the JSON. No commentary.
```

---

### 4. Decomposer

**Role:** Break plan items into atomic, 5–10 minute tasks with model assignments.
**Model:** default
**Input:** Plan + codebase state
**Output:** Task array with dependency groups

```markdown
# Task: Decompose Plan into Atomic Tasks

Break down the following plan into tasks that a single AI agent can complete in 5-10 minutes.

## Plan
{phases.planning.result}

## Model Selection Rules

Assign "fast" to tasks that are:
- Single-file changes (add a field, create a DTO, add a metric)
- Template-based (new endpoint following existing patterns)
- Config changes (Docker, Prometheus, Grafana JSON)
- Documentation updates

Assign "default" to tasks that require:
- Multi-file coordination (wiring service + controller + frontend)
- Architectural decisions
- Complex conditional logic
- Integration debugging

Target: 80%+ tasks should be "fast".

## Task Skills Mapping

Map each task to the appropriate skill:
- "database-implementer" — Prisma schema, migrations
- "backend-implementer" — NestJS controllers, services, DTOs
- "frontend-implementer" — React components, pages, hooks
- "infra-implementer" — Docker, Prometheus, Grafana, Loki configs
- "docs-writer" — README, API docs, comments

Return a JSON object:
{
  "tasks": [
    {
      "id": "task-001",
      "planItemId": "P1",
      "title": "Create ScenarioRun Prisma model",
      "description": "Add ScenarioRun model to prisma/schema.prisma with fields: id (cuid), type (String), status (String), duration (Int?), error (String?), metadata (Json?), createdAt (DateTime).",
      "domain": "database",
      "skill": "database-implementer",
      "complexity": "low",
      "model": "fast",
      "dependsOn": [],
      "acceptanceCriteria": [
        "Model exists in prisma/schema.prisma",
        "npx prisma validate passes"
      ],
      "filesToTouch": ["prisma/schema.prisma"]
    }
  ],
  "dependencyGroups": [
    {
      "group": 1,
      "title": "Database Layer",
      "taskIds": ["task-001", "task-002"],
      "description": "Schema and migrations — must complete before backend work"
    }
  ],
  "modelSplit": {
    "fast": { "count": 10, "taskIds": ["task-001", "task-003", ...] },
    "default": { "count": 2, "taskIds": ["task-005", "task-008"] },
    "ratio": "83% fast / 17% default"
  }
}

Only return the JSON. No commentary.
```

---

### 5. Implementer (per task)

**Role:** Execute a single atomic task.
**Model:** fast or default (per task assignment)
**Input:** Task details + relevant context slice
**Output:** Files created/modified

```markdown
# Task: {task.title}

## What To Do
{task.description}

## Acceptance Criteria
{task.acceptanceCriteria — one per line}

## Files You May Need to Touch
{task.filesToTouch}

## Signal Lab Conventions (MUST follow)

BACKEND:
- Use NestJS modules, controllers, services (no Express directly)
- Use PrismaService for all database access (inject via constructor)
- Add Swagger decorators: @ApiTags, @ApiOperation, @ApiResponse on all endpoints
- Use class-validator decorators on all DTOs
- Use NestJS Logger for logging (not console.log) — JSON format with context fields
- Metrics: Counter with `_total` suffix, Histogram with `_seconds` suffix, snake_case names
- Sentry: captureException for 5xx, addBreadcrumb for 4xx

FRONTEND:
- Use TanStack Query useQuery/useMutation for all API calls
- Use React Hook Form with zodResolver for all forms
- Use shadcn/ui components (Button, Card, Input, Select, Badge, Toast)
- Use Tailwind CSS for layout (no CSS modules, no styled-components)
- Add "use client" directive to components with hooks/browser APIs

DATABASE:
- Prisma only — no raw SQL, no TypeORM, no Knex
- Run `npx prisma migrate dev --name <name>` after schema changes
- Run `npx prisma generate` after schema changes

Implement the task now. When done, list all files you created or modified.
```

---

### 6. Domain Reviewer

**Role:** Check implementation quality for a specific domain.
**Model:** fast (readonly)
**Input:** Domain name + what to check
**Output:** Pass/fail report

```markdown
# Task: Review {domain} Implementation

Review the Signal Lab {domain} layer for quality and convention compliance.
DO NOT modify any files. Read only.

## Checklist

{Include the relevant checklist based on domain — see SKILL.md Phase 6}

## Return Format
{
  "domain": "{domain}",
  "passed": true|false,
  "score": "3/4 checks passed",
  "checks": [
    {
      "item": "Swagger decorators on all endpoints",
      "passed": true,
      "details": "All 3 endpoints have @ApiTags and @ApiOperation"
    },
    {
      "item": "Prometheus metrics on all services",
      "passed": false,
      "details": "ScenarioService missing histogram for run duration",
      "fix": "Add new Histogram({ name: 'scenario_run_duration_seconds', ... }) to ScenarioService"
    }
  ],
  "summary": "Backend mostly compliant. One missing histogram metric."
}

Only return the JSON. No commentary.
```

---

### 7. Report Generator

**Role:** Create the final human-readable execution report.
**Model:** fast
**Input:** Complete context.json
**Output:** Formatted text report

```markdown
# Task: Generate Execution Report

Create a summary report of the PRD execution.

## Execution Data
{full context.json}

## Report Format

Use exactly this format:

```
Signal Lab PRD Execution — {Complete|Partial}

PRD: {prdPath}
Execution ID: {executionId}
Started: {startedAt}
Completed: {now}

━━━ Tasks ━━━
Total: {total} | Completed: {completed} | Failed: {failed} | Retries: {retries}
Model usage: {fast_count} fast, {default_count} default ({percentage}% fast)

━━━ Completed ━━━
  ✓ {task.title}
  ... (for each completed task)

━━━ Failed ━━━
  ✗ {task.title} — {task.error}
  ... (for each failed task, or "None" if all passed)

━━━ Review Results ━━━
  {domain}: {PASS|FAIL} — {summary}
  ... (for each domain reviewed)

━━━ Next Steps ━━━
  - {actionable suggestion for each failed item}
  - Run /health-check to verify Docker stack
  - Run /check-obs to verify observability pipeline
  - Run verification walkthrough from PRD
```

Only return the formatted report. No JSON wrapping, no markdown code blocks.
```

---

## Token Budget Estimates

| Subagent | Input Tokens (approx) | Output Tokens (approx) |
|----------|----------------------|----------------------|
| PRD Analyzer | ~2,000 (PRD text) | ~500 (structured JSON) |
| Codebase Scanner | ~500 (instructions) | ~800 (project map) |
| Planner | ~1,500 (analysis + codebase) | ~600 (plan) |
| Decomposer | ~1,200 (plan + rules) | ~1,000 (task array) |
| Implementer (per task) | ~800 (task + conventions) | ~500–2,000 (code) |
| Reviewer (per domain) | ~600 (checklist) | ~400 (report) |
| Report Generator | ~2,000 (full context) | ~500 (formatted text) |

**Total orchestrator main chat usage:** ~15,000 tokens (coordination + user communication).
**Total subagent usage:** ~20,000–40,000 tokens (spread across 15–20 Task calls).

This is the key insight: instead of one 50k+ token conversation, we use ~15k in the main chat and distribute the rest across focused, short-lived subagent sessions.