# Cursor AI Layer — Signal Lab

This document describes the AI-powered development layer that enables a new Cursor chat to continue working on Signal Lab without manual onboarding.

## Philosophy

Every artifact exists to solve a specific problem:
- **Rules** prevent the AI from making wrong choices (wrong library, wrong pattern)
- **Skills** teach the AI how to do complex multi-step tasks specific to this project
- **Commands** give developers one-click workflows for common tasks
- **Hooks** catch mistakes automatically at edit-time and shell-time
- **Marketplace skills** provide general knowledge about our stack that we don't need to write ourselves

---

## Rules (`.cursor/rules/`)

Rules are always-on constraints injected into every Cursor conversation.

| Rule File | What It Fixes | Scope |
|-----------|--------------|-------|
| `stack-constraints.mdc` | Prevents using wrong libraries (SWR instead of TanStack Query, TypeORM instead of Prisma, Redux, etc.). Lists every allowed and forbidden technology | Always on |
| `observability-conventions.mdc` | Enforces metric naming (`snake_case`, `_total` suffix for counters), structured log format (JSON with required fields like `scenarioType`, `scenarioId`, `duration`), and Sentry usage (captureException for 5xx, breadcrumbs for 4xx) | Always on |
| `prisma-patterns.mdc` | Prevents raw SQL, enforces PrismaService injection pattern, documents migration workflow, explains error code handling (P2002, P2025) | Auto on `prisma/**` and `*.service.ts` |
| `frontend-patterns.mdc` | Enforces TanStack Query for all data fetching, React Hook Form for all forms, shadcn/ui for UI components, Tailwind for styling. Includes code examples for correct patterns | Auto on `apps/frontend/**` |
| `error-handling.mdc` | Maps every error type to its HTTP code, log level, and Sentry action. Prevents silent error swallowing. Covers both backend (NestJS exceptions) and frontend (toast notifications) | Auto on `apps/**` |

**Design decisions:**
- `stack-constraints` and `observability-conventions` are `alwaysApply: true` because they affect every decision the agent makes regardless of which file is open
- Other rules use glob patterns to activate only when relevant files are touched, saving context window tokens
- Each rule has a single clear responsibility with no overlap between them

---

## Custom Skills (`.cursor/skills/`)

Skills are dynamic how-to guides loaded on demand when the agent recognizes a relevant task.

| Skill | When It Activates | What It Does |
|-------|-------------------|--------------|
| `observability` | "add metrics", "add logging", "instrument endpoint", "add monitoring" | Step-by-step guide to wire Prometheus counter + histogram, NestJS structured logging, and Sentry captureException/breadcrumbs into any endpoint. Includes naming rules, code templates, and a verification checklist |
| `nestjs-endpoint` | "add endpoint", "create API route", "scaffold controller" | Complete scaffold recipe: module → controller → service → DTO (with class-validator + Swagger) → Prisma model → observability wiring. Everything a new endpoint needs in one workflow |
| `shadcn-form` | "add form", "create input form", "add validation" | Wires React Hook Form + zod schema + TanStack Query mutation + shadcn/ui components (Card, Input, Select, Button, Toast) into a working validated form with loading states and error handling |

**Why these three:**
- `observability` is mandatory per PRD and covers the most critical cross-cutting concern — every endpoint must have metrics, logs, and Sentry, and marketplace skills don't know our specific wiring pattern
- `nestjs-endpoint` automates the most common backend task with all Signal Lab conventions baked in (metric naming, log format, Prisma access pattern, Swagger decorators)
- `shadcn-form` automates the most common frontend task with the exact library combination this project uses (RHF + zod + TanStack Query + shadcn — no marketplace skill teaches this specific integration)

---

## Commands (`.cursor/commands/`)

Commands are slash-triggered workflows. Type `/command-name` in Cursor chat to run them.

| Command | What It Does |
|---------|--------------|
| `/add-endpoint` | Scaffolds a complete NestJS endpoint with controller, service, DTO, Swagger docs, Prisma model, and full observability. Combines the `nestjs-endpoint` and `observability` skills into one workflow |
| `/check-obs` | Audits all backend services for observability completeness — checks that every service has metrics (counter + histogram), structured logging (Logger, not console.log), Sentry integration, and corresponding Grafana dashboard panels. Produces a pass/fail report |
| `/health-check` | Verifies the entire Docker stack: all 7 services running, backend health endpoint responding, Swagger available, Prometheus scraping, Loki ready, Grafana up, and an end-to-end signal test (trigger scenario → verify metric incremented) |

---

## Hooks (`.cursor/hooks.json`)

Hooks run automatically at specific lifecycle points — no manual invocation needed.

| Hook | Trigger | Problem It Solves |
|------|---------|-------------------|
| **After Prisma schema change** | `afterFileEdit` on `prisma/schema.prisma` | Reminds the agent to run `prisma migrate dev` and `prisma generate`. Without this, schema changes silently break the app because TypeScript types and the database get out of sync |
| **After controller edit** | `afterFileEdit` on `*.controller.ts` | Reminds the agent to verify Swagger decorators, Prometheus metrics, and structured logging exist on the endpoint. Catches the most common mistake: adding a new endpoint without any observability |
| **Secret guard** | `beforeShellExecution` | Blocks any shell command that contains hardcoded passwords, tokens, or API keys. Prevents accidental credential exposure in terminal history or Docker logs |

---

## Marketplace Skills (`.agents/skills/`)

These are community-maintained skills installed from the marketplace. They provide broad, general-purpose knowledge about our stack technologies.

| Skill | Why It's Here |
|-------|---------------|
| `vercel-react-best-practices` | Next.js App Router conventions, server vs. client components, caching strategies, metadata API, image optimization. Broader Next.js knowledge beyond what our `frontend-patterns` rule covers |
| `shadcn` | Full shadcn/ui component library reference — dialogs, data tables, navigation menus, theming, dark mode. Our custom `shadcn-form` skill only covers form patterns; this covers everything else |
| `tailwind-design-system` | Tailwind utility class reference, responsive design patterns, CSS variable integration with shadcn themes. Prevents mistakes like mixing Tailwind with inline styles |
| `nestjs-best-practices` | Dependency injection patterns, guards, interceptors, pipes, module organization. Broader NestJS knowledge beyond our project-specific `nestjs-endpoint` scaffold |
| `prisma-cli` | Prisma CLI commands, schema syntax, migration workflows. General Prisma tooling knowledge |
| `prisma-postgres` | Prisma + PostgreSQL specific patterns — connection pooling, indexes, JSON column handling, performance tuning |
| `prisma-postgres-setup` | Setting up Prisma with PostgreSQL from scratch — initial configuration, Docker setup, connection strings |
| `postgresql-table-design` | Table design best practices — normalization, indexing strategies, constraint patterns. Useful when extending the database schema beyond the current `ScenarioRun` model |
| `docker` | Docker and Docker Compose configuration, multi-stage builds, health checks, volume management, networking. Essential for debugging the observability stack (Prometheus, Loki, Grafana, Promtail containers) |

**What custom skills cover that marketplace skills don't:**

No marketplace skill knows about Signal Lab's specific patterns. Custom skills fill three gaps:

1. **Observability wiring** — our `observability` skill teaches the exact pattern of combining `prom-client` counters/histograms + NestJS `Logger` for structured JSON logs + `@sentry/nestjs` captureException/addBreadcrumb, with our specific metric naming convention (`scenario_runs_total`, `scenario_run_duration_seconds`). No marketplace skill covers this integration.

2. **Project-specific scaffold** — our `nestjs-endpoint` skill produces endpoints that match Signal Lab's exact file structure (`apps/backend/src/<domain>/`), include all required observability from step 1, use PrismaService injection, and have Swagger decorators. Generic NestJS skills teach patterns but don't know our project layout.

3. **Frontend data flow** — our `shadcn-form` skill wires together the specific chain of React Hook Form → zod → TanStack Query `useMutation` → query invalidation → shadcn Toast, using `Controller` for Select components. This exact integration isn't covered by any single marketplace skill.

---

## How to Verify the AI Layer

Open a new Cursor chat in this repository and try:

1. **Rules test**: Ask "what state management library should I use?" — the agent should say TanStack Query for server state, useState for local, and reject Redux/Zustand
2. **Skill test**: Ask "add observability to a new endpoint" — the agent should follow the observability skill's step-by-step with correct metric naming
3. **Command test**: Type `/health-check` — the agent should check all Docker services, endpoints, and observability pipeline
4. **Hook test**: Edit `prisma/schema.prisma` — the agent should immediately remind you about running migrations
5. **Marketplace test**: Ask "how do I add a shadcn dialog component?" — the agent should use knowledge from the `shadcn` marketplace skill