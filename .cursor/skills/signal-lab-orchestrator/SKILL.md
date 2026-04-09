---
name: signal-lab-orchestrator
description: >
  Small-model PRD orchestrator for Signal Lab. Accepts a PRD file, decomposes it into
  atomic tasks, delegates each to subagents via Task tool, tracks state in context.json,
  and supports resume after interruption. Use when asked to "run a PRD", "execute a PRD",
  "orchestrate PRD implementation", or when the /run-prd command is invoked.
---

# Signal Lab PRD Orchestrator

## When to Use

- Someone says "run PRD", "execute PRD 002", "implement this PRD"
- The `/run-prd` command is invoked with a PRD path
- Someone says "continue PRD execution" or "resume orchestrator"
- Someone asks to "check orchestrator status"

## When NOT to Use

- Single-task requests ("add a field to Prisma schema") — use specific skills directly
- Questions about the project — just answer them
- Non-PRD feature requests — handle normally

---

## Architecture Overview

```
┌──────────────────────────────────────┐
│         ORCHESTRATOR (this skill)    │
│   Reads PRD → Plans → Delegates     │
│   Keeps main chat under ~15k tokens │
└──────────┬───────────────────────────┘
           │ Task tool (one per subtask)
           ▼
┌──────────────────────────────────────┐
│          SUBAGENTS                   │
│  Each gets a focused prompt + only   │
│  the context it needs               │
│                                     │
│  ┌─────────┐ ┌──────────┐          │
│  │ analyzer │ │ planner  │          │
│  └─────────┘ └──────────┘          │
│  ┌─────────────┐ ┌──────────┐      │
│  │ implementer │ │ reviewer │      │
│  └─────────────┘ └──────────┘      │
└──────────────────────────────────────┘
           │
           ▼
┌──────────────────────────────────────┐
│  .execution/<timestamp>/context.json │
│  State persisted to disk after each  │
│  phase — enables resume on failure   │
└──────────────────────────────────────┘
```

The orchestrator NEVER does implementation work itself. It reads, plans, delegates, and tracks.

---

## Phase Pipeline

| # | Phase | What Happens | Model |
|---|-------|-------------|-------|
| 1 | PRD Analysis | Parse PRD into structured requirements | fast |
| 2 | Codebase Scan | Map current project structure and existing code | fast |
| 3 | Planning | High-level implementation plan | default |
| 4 | Decomposition | Break plan into atomic tasks with dependencies | default |
| 5 | Implementation | Execute tasks via subagents in dependency order | fast (80%) / default (20%) |
| 6 | Review | Verify quality per domain (database, backend, frontend) | fast (readonly) |
| 7 | Report | Generate human-readable execution summary | fast |

---

## Execution Instructions

### Step 0: Initialize or Resume

**If starting fresh:**

1. Create the execution directory:
   ```
   .execution/<YYYY-MM-DD-HH-mm>/
   ```
2. Create `context.json` with the initial state (see Context File Schema below).
3. Set `currentPhase` to `"analysis"`.
4. Proceed to Phase 1.

**If resuming (context.json already exists):**

1. Read `.execution/*/context.json` (find the most recent execution directory).
2. Find `currentPhase`.
3. Skip all phases where `status` is `"completed"`.
4. Resume from the first phase that is `"in_progress"` or `"pending"`.
5. For `"in_progress"` implementation phase, check `tasks` array — skip completed tasks, resume from first `"pending"` or `"in_progress"` task.

**Tell the user:**
> "Resuming PRD execution from phase: {currentPhase}. {N} phases completed, {M} remaining."

---

### Phase 1: PRD Analysis (fast model)

**Delegate via Task tool with this prompt:**

```
Read the PRD file at: {prdPath}

Extract and return a structured JSON object with:
{
  "requirements": [
    { "id": "R1", "text": "...", "type": "functional|non-functional" }
  ],
  "features": [
    { "id": "F1", "title": "...", "description": "...", "acceptanceCriteria": ["..."] }
  ],
  "constraints": ["Must use NestJS", "Must use Prisma", ...],
  "dependencies": ["existing Prisma schema", "Docker Compose", ...],
  "estimatedComplexity": "low|medium|high"
}

Only return the JSON. No commentary.
```

**After subagent returns:**
1. Parse the result and store in `context.json` under `phases.analysis.result`.
2. Set `phases.analysis.status` to `"completed"`.
3. Set `currentPhase` to `"codebase"`.
4. Write `context.json` to disk.

---

### Phase 2: Codebase Scan (fast model)

**Delegate via Task tool with this prompt:**

```
Scan the Signal Lab project structure and report what currently exists.

Check these locations:
- prisma/schema.prisma — what models exist?
- apps/backend/src/ — what modules, controllers, services exist?
- apps/frontend/src/ — what pages, components exist?
- docker-compose.yml — what services are defined?
- monitoring/ — what Grafana dashboards, Prometheus configs exist?

Return a JSON object:
{
  "database": {
    "models": ["ScenarioRun"],
    "migrations": ["init"]
  },
  "backend": {
    "modules": ["scenario", "health", "metrics"],
    "endpoints": ["POST /api/scenarios/run", "GET /api/health", "GET /metrics"],
    "services": ["ScenarioService", "PrismaService"]
  },
  "frontend": {
    "pages": ["/"],
    "components": ["ScenarioForm", "RunHistory"],
    "libraries": ["tanstack-query", "react-hook-form", "shadcn"]
  },
  "infrastructure": {
    "dockerServices": ["frontend", "backend", "postgres", "prometheus", "grafana", "loki", "promtail"],
    "observability": {
      "prometheus": true,
      "grafana": true,
      "loki": true,
      "sentry": true
    }
  }
}

Only return the JSON. No commentary.
```

**After subagent returns:**
1. Store result in `phases.codebase.result`.
2. Set `phases.codebase.status` to `"completed"`.
3. Set `currentPhase` to `"planning"`.
4. Write `context.json` to disk.

---

### Phase 3: Planning (default model)

**Delegate via Task tool with this prompt:**

```
You are planning the implementation of a PRD for Signal Lab.

PRD Requirements:
{phases.analysis.result}

Current Codebase State:
{phases.codebase.result}

Create a high-level implementation plan. For each item, note:
- What needs to be CREATED (doesn't exist yet)
- What needs to be MODIFIED (exists but needs changes)
- What can be SKIPPED (already done)

Return a JSON object:
{
  "plan": [
    {
      "id": "P1",
      "domain": "database|backend|frontend|infrastructure|documentation",
      "action": "create|modify|skip",
      "title": "Short description",
      "details": "What specifically needs to happen",
      "dependsOn": ["P0"]  // IDs of items that must complete first
    }
  ],
  "skipReason": {
    "P3": "Already implemented in PRD 001"
  }
}

Only return the JSON. No commentary.
```

**After subagent returns:**
1. Store result in `phases.planning.result`.
2. Set `phases.planning.status` to `"completed"`.
3. Set `currentPhase` to `"decomposition"`.
4. Write `context.json` to disk.

---

### Phase 4: Decomposition (default model)

**Delegate via Task tool with this prompt:**

```
You are decomposing a high-level plan into atomic implementation tasks for Signal Lab.

High-Level Plan:
{phases.planning.result}

Current Codebase:
{phases.codebase.result}

Rules for decomposition:
1. Each task must be completable in 5-10 minutes by an AI agent.
2. Each task description is 1-3 sentences.
3. Each task maps to a specific skill: "backend-implementer", "frontend-implementer",
   "database-implementer", "infra-implementer", "docs-writer".
4. Mark complexity: "low", "medium", or "high".
5. Assign model recommendation:
   - "fast" for: adding fields, creating DTOs, simple endpoints, adding a metric/log,
     creating basic UI components, writing config files, updating docs.
   - "default" for: architecture decisions, complex business logic, multi-system
     integration, designing review criteria.
6. Tasks must have explicit dependency ordering.

Return a JSON array:
{
  "tasks": [
    {
      "id": "task-001",
      "title": "Add ScenarioRun model to Prisma schema",
      "description": "Add the ScenarioRun model with fields: id, type, status, duration, error, metadata, createdAt. Use cuid() for id.",
      "domain": "database",
      "skill": "database-implementer",
      "complexity": "low",
      "model": "fast",
      "dependsOn": [],
      "acceptanceCriteria": ["Model exists in schema.prisma", "Migration runs successfully"]
    }
  ],
  "dependencyGroups": [
    { "group": 1, "taskIds": ["task-001", "task-002"], "description": "Database layer" },
    { "group": 2, "taskIds": ["task-003", "task-004"], "description": "Backend services" }
  ],
  "modelSplit": {
    "fast": 10,
    "default": 2,
    "percentage": "83% fast"
  }
}

Only return the JSON. No commentary.
```

**After subagent returns:**
1. Parse the tasks array and add each task to `context.json` under `tasks` with `status: "pending"`.
2. Store the full result in `phases.decomposition.result`.
3. Set `phases.decomposition.status` to `"completed"`.
4. Set `currentPhase` to `"implementation"`.
5. Write `context.json` to disk.

**Tell the user:**
> "Decomposed PRD into {N} tasks: {fast_count} for fast model, {default_count} for default model ({percentage}% fast). Starting implementation..."

---

### Phase 5: Implementation (fast 80% / default 20%)

Execute tasks in dependency group order. Within each group, tasks can run sequentially.

**For each task:**

1. Read the task from `context.json`.
2. Set task `status` to `"in_progress"`.
3. Write `context.json` to disk.
4. Delegate via Task tool with this prompt:

```
You are a {task.skill} working on Signal Lab.

YOUR TASK:
{task.title}

DESCRIPTION:
{task.description}

ACCEPTANCE CRITERIA:
{task.acceptanceCriteria}

CONTEXT — Current project structure:
{phases.codebase.result}

RULES:
- Follow Signal Lab conventions (see .cursor/rules/).
- Use the observability skill pattern for any new endpoints.
- Use Prisma for all database access (no raw SQL).
- Use TanStack Query on frontend, React Hook Form for forms, shadcn/ui for components.
- Add Swagger decorators to all endpoints.
- Add structured logging (JSON format) to all backend operations.

Implement the task. When done, list the files you created or modified.
```

5. After the subagent completes:
   - Set task `status` to `"completed"`.
   - Update `phases.implementation.completedTasks` count.
   - Write `context.json` to disk.

6. If the subagent fails or produces an error:
   - Set task `status` to `"failed"`.
   - Store error in task `error` field.
   - Continue to the next task (do NOT block).
   - Write `context.json` to disk.

**After all tasks complete, tell the user:**
> "Implementation complete. {completed}/{total} tasks done. {failed} failed. Moving to review..."

---

### Phase 6: Review (fast model, readonly)

Run one review subagent per domain. Each reviewer checks quality without modifying code.

**For each domain (database, backend, frontend):**

Delegate via Task tool with this prompt:

```
You are a code reviewer for Signal Lab's {domain} layer. Review ONLY — do not modify files.

Check for:
DATABASE:
- Prisma schema matches PRD requirements
- Migration exists and is valid
- No raw SQL, no alternative ORMs

BACKEND:
- All endpoints have Swagger decorators (@ApiTags, @ApiOperation, @ApiResponse)
- All services have Prometheus metrics (counter + histogram)
- All services have structured logging (NestJS Logger, not console.log)
- Error handling uses NestJS exceptions with correct HTTP codes
- Sentry integration for 5xx errors

FRONTEND:
- TanStack Query for all data fetching (no raw fetch in components)
- React Hook Form for all forms
- shadcn/ui components used consistently
- Loading states and error handling present

Return a JSON object:
{
  "domain": "{domain}",
  "passed": true|false,
  "checks": [
    { "item": "Swagger decorators", "passed": true, "details": "All endpoints decorated" },
    { "item": "Prometheus metrics", "passed": false, "details": "Missing histogram on POST /scenarios/run", "fix": "Add Histogram to ScenarioService" }
  ],
  "summary": "2/3 checks passed. Missing Prometheus histogram."
}

Only return the JSON. No commentary.
```

**Review Loop (if review fails):**

1. If `passed` is `false`, collect the failed checks with their `fix` suggestions.
2. Create a focused fix task and delegate to an implementer subagent:
   ```
   Fix the following issues in Signal Lab's {domain} layer:

   {list of failed checks with fix suggestions}

   Apply the minimum changes needed. Do not refactor unrelated code.
   ```
3. Re-run the reviewer.
4. Repeat up to **3 times** per domain.
5. If still failing after 3 retries, mark the domain review as `"failed"` with details and move on.

**After all domain reviews:**
1. Store results in `phases.review.result`.
2. Set `phases.review.status` to `"completed"`.
3. Set `currentPhase` to `"report"`.
4. Write `context.json` to disk.

---

### Phase 7: Report (fast model)

**Delegate via Task tool with this prompt:**

```
Generate a human-readable execution report for a Signal Lab PRD run.

Execution data:
{entire context.json}

Format the report exactly like this:

Signal Lab PRD Execution — {Complete|Partial}

PRD: {prdPath}
Execution ID: {executionId}
Duration: ~{estimated duration}

Tasks: {completed} completed, {failed} failed, {retries} retries
Model usage: {fast_count} fast, {default_count} default

Completed:
  ✓ {task title} (for each completed task)

Failed:
  ✗ {task title} — {error reason} (for each failed task)

Review Results:
  {domain}: {passed/failed} — {summary} (for each domain)

Next steps:
  - {actionable suggestions for any failed items}
  - Run verification walkthrough

Only return the formatted report. No JSON wrapping.
```

**After subagent returns:**
1. Store the report in `phases.report.result`.
2. Set `phases.report.status` to `"completed"`.
3. Set `status` (top-level) to `"completed"`.
4. Write `context.json` to disk.
5. Print the report to the user.

---

## Context File Schema

```json
{
  "executionId": "2026-04-08-14-30",
  "prdPath": "prds/002_prd-observability-demo.md",
  "status": "pending|in_progress|completed|failed",
  "currentPhase": "analysis|codebase|planning|decomposition|implementation|review|report",
  "startedAt": "2026-04-08T14:30:00Z",
  "completedAt": null,
  "phases": {
    "analysis":       { "status": "pending", "result": null },
    "codebase":       { "status": "pending", "result": null },
    "planning":       { "status": "pending", "result": null },
    "decomposition":  { "status": "pending", "result": null },
    "implementation": { "status": "pending", "completedTasks": 0, "totalTasks": 0 },
    "review":         { "status": "pending", "result": null },
    "report":         { "status": "pending", "result": null }
  },
  "signal": 42,
  "tasks": []
}
```

---

## Model Selection Criteria

### Use fast model for (80%+ of tasks):
- Adding a field or model to Prisma schema
- Creating a DTO with class-validator decorators
- Creating a simple CRUD endpoint
- Adding a Prometheus counter or histogram
- Adding structured log lines to a service
- Creating a basic React component
- Writing or updating a Dockerfile / docker-compose service
- Updating documentation or README
- Creating config files (Prometheus scrape config, Grafana datasource)

### Use default model for (20% of tasks):
- Designing the overall implementation plan
- Complex business logic with multiple code paths
- Integrating multiple systems (e.g., wiring Sentry + Prometheus + Loki together)
- Decomposing PRD into tasks (requires judgment about dependencies)
- Reviewing trade-offs and architecture decisions
- Debugging integration issues that span multiple services

**Rule of thumb:** If a task can be described in 1-2 sentences and has a single clear output file, it's `fast`. If it requires reasoning about trade-offs or touching 3+ files, it's `default`.

---

## Integration with Other Skills

The orchestrator delegates to subagents that should follow these existing skills:

| Subagent Role | Uses These Skills / Rules |
|---------------|--------------------------|
| database-implementer | `prisma-patterns` rule, `prisma-cli` marketplace skill |
| backend-implementer | `nestjs-endpoint` skill, `observability` skill, `error-handling` rule |
| frontend-implementer | `shadcn-form` skill, `frontend-patterns` rule, `shadcn` marketplace skill |
| infra-implementer | `docker` marketplace skill, `observability-conventions` rule |
| reviewer | All rules (readonly check against conventions) |

Each subagent prompt includes a reminder to follow `.cursor/rules/` — this ensures conventions are respected even in delegated tasks.

---

## Error Handling

- **Subagent timeout / no response:** Mark task as `"failed"`, log error in context.json, continue.
- **Invalid JSON from subagent:** Retry once with a stricter prompt ("Return ONLY valid JSON"). If still invalid, mark phase as `"failed"` with the raw output stored for debugging.
- **Orchestrator interruption:** On next run, read `context.json` and resume. No completed work is lost.
- **All tasks in a dependency group failed:** Log a warning, skip dependent groups, note in final report.

---

## Checklist (for the orchestrator to verify itself)

- [ ] `.execution/<timestamp>/` directory created
- [ ] `context.json` initialized with all phases as `"pending"`
- [ ] Each phase updates `context.json` before and after execution
- [ ] Tasks have explicit `fast` / `default` model labels
- [ ] 80%+ of tasks are marked `fast`
- [ ] Review loop runs up to 3 retries per domain
- [ ] Failed tasks don't block other tasks
- [ ] Final report is printed to the user
- [ ] Resume works: re-running skips completed phases