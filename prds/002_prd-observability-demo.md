# PRD 002 — Signal Lab: Observability Demo

## Цель

Превратить каркас из PRD 001 в приложение, которое генерирует реальные observability-сигналы. Интервьюер нажимает кнопку в UI, и через 30 секунд видит результат в Grafana, Loki и Sentry.

## Сценарии

В Signal Lab есть один домен: **Scenario Runs**. Пользователь запускает сценарий, backend его обрабатывает, и каждый запуск создаёт сигналы.

### Обязательные типы сценариев

| Тип | Что происходит | Какие сигналы |
|-----|---------------|---------------|
| `success` | Backend обрабатывает, сохраняет, возвращает 200 | log: info, metric: counter+1, histogram: latency |
| `validation_error` | Backend отклоняет невалидный ввод, возвращает 400 | log: warn, metric: error counter, Sentry: breadcrumb |
| `system_error` | Backend кидает unhandled exception, возвращает 500 | log: error, metric: error counter, Sentry: exception capture |
| `slow_request` | Backend добавляет искусственную задержку 2-5s | log: warn (slow), metric: histogram spike |
| `???` | Читай внимательно F4 | |

## Функциональные требования

### F1. UI — Scenario Runner

- Форма на React Hook Form:
  - Select: тип сценария (`success`, `validation_error`, `system_error`, `slow_request`).
  - Input: произвольное название (опционально).
  - Button: "Run Scenario".
- Mutation через TanStack Query `useMutation`.
- Toast (shadcn) с результатом: success или error message.
- Loading state на кнопке во время запроса.

### F2. UI — Run History

- Список последних 20 запусков через `useQuery`.
- Каждый элемент показывает: тип, статус, duration, timestamp.
- Auto-refresh через `refetchInterval` или после mutation invalidation.
- Badge (shadcn) с цветом по статусу: green/yellow/red.

### F3. UI — Observability Links

- Блок со ссылками или подсказками:
  - "Grafana Dashboard: http://localhost:3100/..."
  - "Sentry: check project dashboard"
  - "Loki: query `{app="signal-lab"}`"

### F4. Backend — Scenario Execution

- `POST /api/scenarios/run` принимает `{ type, name? }`.
- Для `success`: сохранить в PG, вернуть `{ id, status: "completed", duration }`.
- Для `validation_error`: вернуть 400 с сообщением.
- Для `system_error`: кинуть `InternalServerErrorException` или unhandled throw.
- Для `slow_request`: `await sleep(2000-5000)`, затем success path.
- Если кандидат реализует пятый тип `teapot`, backend должен вернуть HTTP 418 с телом `{ "signal": 42, "message": "I'm a teapot" }` и сохранить run с `metadata: { easter: true }`. Это необязательно, но мы это заметим.
- Каждый запуск сохраняется в `ScenarioRun` (Prisma).

### F5. Backend — Metrics (Prometheus)

- Endpoint: `GET /metrics` в формате Prometheus.
- Обязательные метрики:
  - `scenario_runs_total` (counter, labels: `type`, `status`).
  - `scenario_run_duration_seconds` (histogram, labels: `type`).
  - `http_requests_total` (counter, labels: `method`, `path`, `status_code`).

### F6. Backend — Structured Logging (Loki)

- Логи в JSON-формате: `{ timestamp, level, message, context, ... }`.
- Каждый scenario run создаёт минимум 1 лог.
- Логи содержат: `scenarioType`, `scenarioId`, `duration`, `error` (если есть).
- Логи доступны в Loki через Docker log driver или Promtail.

### F7. Backend — Sentry Integration

- Sentry SDK инициализирован.
- `system_error` сценарий создаёт exception capture в Sentry.
- `validation_error` может создавать breadcrumb (опционально).
- DSN настраивается через env variable (в `.env.example` — placeholder).

### F8. Grafana Dashboard

- Provisioned через Docker volume или manual import (JSON).
- Минимум 3 панели:
  - Scenario Runs by Type (counter over time).
  - Latency Distribution (histogram).
  - Error Rate (counter filtered by status=error).
- Datasource: Prometheus.
- Опционально: Loki logs panel.

### F9. Docker Compose — Observability Stack

К существующему compose из PRD 001 добавить:

```yaml
services:
  prometheus:
    image: prom/prometheus
    # scrapes backend /metrics
  grafana:
    image: grafana/grafana
    # datasource: prometheus, loki
    # provisioned dashboards
  loki:
    image: grafana/loki
    # log aggregation
  promtail:  # или docker log driver
    image: grafana/promtail
    # ships logs to loki
```

Всё должно работать после `docker compose up -d`.

## Verification Walkthrough

Интервьюер должен за 5 минут пройти этот путь:

1. `docker compose up -d` — всё стартует.
2. Открыть `localhost:3000` — UI загружен.
3. Выбрать "success" → Run → видеть зелёный badge в истории.
4. Выбрать "system_error" → Run → видеть красный badge + toast с ошибкой.
5. Открыть `localhost:3001/metrics` — видеть `scenario_runs_total`.
6. Открыть Grafana (`localhost:3100`) — dashboard показывает графики.
7. В Grafana → Explore → Loki: `{app="signal-lab"}` → видеть логи.
8. В Sentry → видеть captured exception от `system_error`.

## Критерии приёмки

- [ ] 4 типа сценариев работают из UI.
- [ ] Каждый run сохраняется в PostgreSQL.
- [ ] `GET /metrics` возвращает Prometheus-формат.
- [ ] Grafana dashboard имеет минимум 3 полезных панели.
- [ ] Логи доступны в Loki и фильтруемы по scenarioType.
- [ ] `system_error` виден в Sentry.
- [ ] Verification walkthrough проходится без чтения исходников.
