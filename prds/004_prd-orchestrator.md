# PRD 004 — Signal Lab: Small-Model PRD Orchestrator

## Цель

Создать orchestrator skill, который принимает PRD и проводит его через pipeline: анализ → план → декомпозиция → реализация → review. Orchestrator должен минимизировать контекст в основном чате и позволять малым моделям выполнять большинство подзадач.

## Зачем это нужно

Большой prompt — это не AI-архитектура. Мы проверяем, понимает ли кандидат:

- **Context economy**: основной чат тратит ~15k токенов, вся тяжёлая работа в subagents.
- **Atomic decomposition**: задачи разбиты так, что 80%+ может делать fast/small model.
- **State persistence**: состояние живёт в файле, а не только в истории чата.
- **Resumability**: можно продолжить с любой фазы после сбоя.

## Что должно получиться

```
.cursor/skills/
  signal-lab-orchestrator/
    SKILL.md              # главный файл orchestrator
    COORDINATION.md       # промпты для каждого subagent (опционально)
    EXAMPLE.md            # пример использования (опционально)
```

## Обязательные фазы

| # | Фаза | Что делает | Модель |
|---|------|-----------|--------|
| 1 | PRD Analysis | Разбирает PRD на требования, features, constraints | fast |
| 2 | Codebase Scan | Понимает текущую структуру проекта | fast (explore) |
| 3 | Planning | Высокоуровневый план реализации | default |
| 4 | Decomposition | Разбивка на атомарные задачи с dependencies | default |
| 5 | Implementation | Выполнение задач по группам зависимостей | fast (80%) / default (20%) |
| 6 | Review | Проверка качества по критериям | fast (readonly) |
| 7 | Report | Итоговый отчёт с результатами | fast |

## Функциональные требования

### F1. PRD Input

- Orchestrator принимает PRD как текст или путь к файлу.
- Orchestrator создаёт рабочую директорию: `.execution/<timestamp>/`.
- Orchestrator создаёт `context.json` с начальным состоянием.

### F2. Context File

```json
{
  "executionId": "2026-04-08-14-30",
  "prdPath": "prds/002_prd-observability-demo.md",
  "status": "in_progress",
  "currentPhase": "implementation",
  "phases": {
    "analysis": { "status": "completed", "result": "..." },
    "codebase": { "status": "completed", "result": "..." },
    "planning": { "status": "completed", "result": "..." },
    "decomposition": { "status": "completed", "result": "..." },
    "implementation": { "status": "in_progress", "completedTasks": 5, "totalTasks": 8 },
    "review": { "status": "pending" },
    "report": { "status": "pending" }
  },
  "signal": 42,
  "tasks": [
    {
      "id": "task-001",
      "title": "Add ScenarioRun model to Prisma schema",
      "type": "database",
      "complexity": "low",
      "model": "fast",
      "status": "completed"
    }
  ]
}
```

### F3. Model Selection

Orchestrator должен явно маркировать задачи:

**fast model** (80%+ задач):
- Добавить поле в Prisma schema.
- Создать DTO с валидацией.
- Создать простой endpoint.
- Добавить метрику или лог.
- Создать UI компонент без сложной логики.

**default model** (20% задач):
- Планирование архитектуры.
- Сложная бизнес-логика.
- Интеграция нескольких систем.
- Review с анализом trade-offs.

### F4. Task Decomposition

Каждая задача должна быть:
- Выполнима за 5-10 минут.
- Описана 1-3 предложениями.
- Привязана к конкретному skill (backend-implementer, frontend-implementer и т.д.).
- Помечена `complexity: low | medium | high` и рекомендуемой моделью.

### F5. Subagent Delegation

Orchestrator **не делает работу сам**. Для каждой фазы он:
1. Читает текущий `context.json`.
2. Формирует промпт для subagent.
3. Запускает subagent через Task tool.
4. Получает результат.
5. Обновляет `context.json`.

### F6. Review Loop

```
Для каждого домена (database, backend, frontend):
  1. Запустить reviewer subagent (readonly).
  2. Если не прошёл — запустить implementer с feedback.
  3. Повторить до 3 раз.
  4. Если не прошёл после 3 попыток — пометить failed, продолжить.
```

### F7. Retry / Resume

- Если orchestrator прерван, повторный запуск читает `context.json` и продолжает с текущей фазы.
- Completed фазы не перевыполняются.
- Failed задачи помечаются, но не блокируют остальные.

### F8. Final Report

Orchestrator выдаёт итог:

```
Signal Lab PRD Execution — Complete

Tasks: 12 completed, 1 failed, 2 retries
Duration: ~25 min
Model usage: 10 fast, 3 default

Completed:
  ✓ Prisma schema + migration
  ✓ ScenarioService + Controller
  ✓ Prometheus metrics
  ✓ Structured logging
  ✓ Sentry integration
  ✓ Frontend scenario form
  ✓ Run history list
  ✓ Grafana dashboard

Failed:
  ✗ Loki log panel (max retries)

Next steps:
  - Fix Loki panel manually
  - Run verification walkthrough
```

## Что НЕ нужно

- Универсальный framework для всех проектов.
- Полная автономность без человека.
- Копирование prd-executor 1:1 — нужна адаптация под Signal Lab.

## Критерии приёмки

- [ ] Orchestrator skill существует и запускается из чата.
- [ ] Создаётся `context.json` с понятной структурой.
- [ ] Задачи разбиты на atomic уровень.
- [ ] Есть явное разделение fast / default model.
- [ ] Orchestrator использует другие custom и marketplace skills.
- [ ] Повторный запуск продолжает с места остановки.
- [ ] Финальный отчёт читаем и полезен.
