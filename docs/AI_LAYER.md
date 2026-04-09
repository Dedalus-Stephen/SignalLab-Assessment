# Cursor AI Layer — Signal Lab

This document describes the AI-powered development layer that enables a new Cursor chat to continue working on Signal Lab without manual onboarding.

## Philosophy

Every artifact exists to solve a specific problem:
- **Rules** prevent the AI from making wrong choices (wrong library, wrong pattern)
- **Skills** teach the AI how to do complex multi-step tasks specific to this project
- **Commands** give developers one-click workflows for common tasks
- **Hooks** catch mistakes automatically at edit-time and shell-time
- **Marketplace skills** provide general knowledge about our stack that we don't need to write ourselves

## Rules (`.cursor/rules/`)

Rules are always-on constraints injected into every Cursor conversation.

| Rule File | What It Fixes | Scope |
|-----------|--------------|-------|
| `stack-constraints.mdc` | Prevents using wrong libraries (SWR instead of TanStack Query, TypeORM instead of Prisma, Redux, etc.) | Always on |
| `observability-conventions.mdc` | Enforces metric naming (`snake_case`, `_total` suffix), log format (JSON with required fields), and Sentry usage patterns | Always on |
| `prisma-patterns.mdc` | Prevents raw SQL, enforces PrismaService injection, documents migration workflow | Auto: `prisma/**`, `*.service.ts` |
| `frontend-patterns.mdc` | Enforces TanStack Query for data fetching, RHF for forms, shadcn/ui for components, Tailwind for styling | Auto: `apps/frontend/**` |
| `error-handling.mdc` | Maps error types to HTTP codes, log levels, and Sentry actions. Prevents silent error swallowing | Auto: `apps/**` |

**Design decisions:**
- `stack-constraints` and `observability-conventions` are `alwaysApply: true` because they affect every decision the agent makes
- Other rules use glob patterns to activate only when relevant files are touched, saving context tokens
- Rules don't overlap — each has a single clear responsibility

## Custom Skills (`.cursor/skills/`)

Skills are dynamic how-to guides loaded on demand when the agent recognizes a relevant task.

| Skill | When It Activates | What It Does |
|-------|-------------------|--------------|
| `observability` | "add metrics", "add logging", "instrument endpoint" | Step-by-step guide to add Prometheus counter + histogram, NestJS structured logging, and Sentry integration to any endpoint |
| `nestjs-endpoint` | "add endpoint", "create API route", "scaffold controller" | Complete scaffold: module → controller → service → DTO → Swagger → Prisma model → observability wiring |
| `shadcn-form` | "add form", "create input form", "add validation" | Wires React Hook Form + zod + TanStack Query mutation + shadcn/ui components into a working validated form |

**Why these three:**
- `observability` is mandatory per PRD and covers the most critical cross-cutting concern
- `nestjs-endpoint` automates the most common backend task (new endpoint) with all conventions baked in
- `shadcn-form` automates the most common frontend task (new form) with the specific library combination this project uses

**What custom skills cover that marketplace doesn't:**
Marketplace skills teach general library knowledge. Custom skills encode *this project's specific patterns* — how observability, endpoint scaffold, and forms work in Signal Lab specifically, including file paths, naming conventions, and the exact wiring between libraries.

## Commands (`.cursor/commands/`)

Commands are slash-triggered workflows. Type `/command-name` in Cursor to run them.

| Command | What It Does |
|---------|--------------|
| `/add-endpoint` | Scaffolds a complete NestJS endpoint with observability. Uses the `nestjs-endpoint` and `observability` skills under the hood |
| `/check-obs` | Audits all services for observability completeness — checks metrics, logging, Sentry, and Grafana dashboard. Produces a report |
| `/health-check` | Verifies the entire Docker stack is running: all 7 services, endpoints responding, Prometheus scraping, Loki ready, end-to-end signal test |

## Hooks (`.cursor/hooks.json`)

Hooks run automatically at specific lifecycle points — no manual invocation needed.

| Hook | Trigger | Problem It Solves |
|------|---------|-------------------|
| After schema change | `afterFileEdit` on `prisma/schema.prisma` | Reminds the agent to run `prisma migrate dev` and `prisma generate`. Without this, schema changes silently break the app because types and DB are out of sync |
| After controller edit | `afterFileEdit` on `*.controller.ts` | Reminds the agent to verify Swagger decorators, metrics, and logging exist. Catches the most common mistake: adding an endpoint without observability |
| Secret guard | `beforeShellExecution` | Blocks shell commands that contain hardcoded secrets (passwords, tokens, API keys). Prevents accidental credential exposure in terminal history or logs |

## Marketplace Skills

These are community-maintained skills installed via Cursor Settings > Skills.

| Skill | Why It's Here |
|-------|---------------|
| `nextjs-best-practices` | App Router conventions, server/client components, caching — broader Next.js knowledge beyond our custom rules |
| `shadcn-ui` | Full component library reference (dialogs, data tables, navigation) — our custom skill covers forms only |
| `tailwind-css` | Utility class reference, responsive patterns, CSS variable integration with shadcn themes |
| `nestjs-best-practices` | DI patterns, guards, interceptors, pipes — broader NestJS knowledge beyond our endpoint scaffold |
| `prisma-orm` | Schema design, query optimization, relations — HOW Prisma works vs. our rule which says WHAT to do |
| `docker-compose` | Container configuration, multi-stage builds, health checks — essential for debugging the observability stack |
| `typescript-strict` | Strict mode patterns, generics, utility types — prevents `any` usage across the monorepo |

**Custom fills gaps marketplace doesn't cover:**
No marketplace skill knows about Signal Lab's specific metric naming (`scenario_runs_total`), logging format, Sentry integration pattern, project file structure, or the specific wiring between prom-client + NestJS Logger + Sentry that every endpoint must follow.

## How to Verify

Open a new Cursor chat in this repository and try:

1. **Rules test**: Ask "what state management library should I use?" — the agent should say TanStack Query for server state, useState for local, and reject Redux/Zustand
2. **Skill test**: Ask "add observability to a new endpoint" — the agent should follow the step-by-step from the observability skill
3. **Command test**: Type `/health-check` — the agent should run through all Docker service checks
4. **Hook test**: Edit `prisma/schema.prisma` — the agent should remind you about migrations
