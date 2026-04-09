# PRD 001 — Signal Lab: Platform Foundation

## Цель

Собрать каркас приложения Signal Lab: frontend, backend, база данных, контейнерное окружение. После этого PRD у тебя должен быть рабочий стартовый проект, который запускается одной командой и имеет минимальный end-to-end flow.

## Что должно получиться

```
signal-lab/
├── apps/
│   ├── frontend/          # Next.js
│   └── backend/           # NestJS
├── prisma/
│   └── schema.prisma
├── docker-compose.yml     # всё окружение
├── .env.example
└── README.md
```

Допускается эквивалентная структура, если она обоснована.

## Обязательный стек

- **Frontend**: Next.js (App Router), shadcn/ui, Tailwind CSS, TanStack Query, React Hook Form.
- **Backend**: NestJS, TypeScript strict.
- **Database**: PostgreSQL 16 через Prisma.
- **Infra**: Docker Compose — одна команда поднимает всё.

## Функциональные требования

### F1. Docker Compose

- `docker compose up -d` поднимает: frontend, backend, PostgreSQL.
- Frontend доступен на `localhost:3000`.
- Backend доступен на `localhost:3001`.
- PostgreSQL доступен на `localhost:5432`.
- Контейнеры используют hot reload (volume mounts для source).
- `.env.example` содержит все переменные без секретов.

### F2. Backend

- Health endpoint: `GET /api/health` → `{ "status": "ok", "timestamp": "..." }`.
- Минимум один доменный endpoint: `POST /api/scenarios/run` (заглушка, которая принимает тело и возвращает 200 с ID).
- Global exception filter с корректными HTTP кодами.
- Swagger на `/api/docs`.

### F3. Frontend

- Одна рабочая страница с базовой навигацией.
- Форма через React Hook Form (даже если пока заглушка).
- Запрос к API через TanStack Query (даже если пока показывает health status).
- shadcn/ui компоненты: Button, Card, Input — минимум 3 использования.
- Tailwind для layout.

### F4. Database

- Prisma schema с минимум одной моделью `ScenarioRun`:

```prisma
model ScenarioRun {
  id        String   @id @default(cuid())
  type      String   // see PRD 002 for types; attentive readers may find a fifth
  status    String
  duration  Int?
  error     String?
  metadata  Json?    // optional: for extra context per run
  createdAt DateTime @default(now())
}
```

- Миграция применяется при старте или через задокументированную команду.
- Seed не обязателен, но приветствуется.

### F5. Documentation

- `README.md`:
  - Предусловия (Docker, Node).
  - Запуск: `docker compose up -d`.
  - Проверка: `curl localhost:3001/api/health`.
  - Остановка: `docker compose down`.

## Нефункциональные требования

- Структура каталогов предсказуема без объяснений.
- Конфигурация отделена от кода: `.env` или Docker env.
- Ошибки старта диагностируемы по `docker compose logs`.
- Нет hardcoded secrets в коммитах.

## Критерии приёмки

- [ ] `docker compose up -d` поднимает всё без ошибок.
- [ ] `GET /api/health` возвращает 200.
- [ ] Frontend открывается в браузере.
- [ ] Prisma schema содержит модель и миграция применена.
- [ ] Использованы все обязательные frontend-библиотеки.
- [ ] README достаточен для запуска за 3 минуты.
