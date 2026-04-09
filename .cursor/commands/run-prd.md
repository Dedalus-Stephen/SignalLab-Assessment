# /run-prd — Execute a PRD via the Orchestrator

Execute a PRD through the Signal Lab orchestrator pipeline. The orchestrator analyzes the PRD, scans the codebase, plans implementation, decomposes into atomic tasks, delegates to subagents, reviews quality, and generates a completion report.

## Usage

```
/run-prd <path-to-prd>
```

Example:
```
/run-prd prds/002_prd-observability-demo.md
```

To resume an interrupted execution:
```
/run-prd --resume
```

## What Happens

Use the `signal-lab-orchestrator` skill from `.cursor/skills/signal-lab-orchestrator/SKILL.md`.

Follow these steps:

1. **If `--resume` flag is present:** Find the most recent `.execution/*/context.json` file. Read it and resume from `currentPhase`. Skip all completed phases and tasks. Tell the user what's being resumed.

2. **If starting fresh with a PRD path:**
   - Validate the PRD file exists at the given path.
   - Create `.execution/<YYYY-MM-DD-HH-mm>/` directory.
   - Initialize `context.json` with all phases set to `"pending"`.
   - Begin Phase 1 (PRD Analysis).

3. **Execute all 7 phases** in order as described in the orchestrator SKILL.md:
   - Phase 1: PRD Analysis (fast model) — parse requirements
   - Phase 2: Codebase Scan (fast model) — map existing code
   - Phase 3: Planning (default model) — create implementation plan
   - Phase 4: Decomposition (default model) — break into atomic tasks
   - Phase 5: Implementation (fast 80% / default 20%) — delegate tasks via Task tool
   - Phase 6: Review (fast, readonly) — verify quality per domain
   - Phase 7: Report (fast) — generate completion summary

4. **After each phase:** Update `context.json` on disk so progress is never lost.

5. **After all phases:** Print the final report and suggest running `/health-check` and `/check-obs` to verify the result.

## Key Behaviors

- The orchestrator delegates work to subagents via the Task tool — it does NOT implement code itself.
- Each subagent gets a focused prompt with only the context it needs (see COORDINATION.md).
- 80%+ of implementation tasks should use the fast model.
- Failed tasks are logged but do not block other tasks.
- The review phase retries up to 3 times per domain before marking as failed.

## Related

- Orchestrator skill: `.cursor/skills/signal-lab-orchestrator/SKILL.md`
- Subagent prompts: `.cursor/skills/signal-lab-orchestrator/COORDINATION.md`
- Worked example: `.cursor/skills/signal-lab-orchestrator/EXAMPLE.md`
- Post-execution checks: `/health-check`, `/check-obs`