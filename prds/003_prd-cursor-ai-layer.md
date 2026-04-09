# PRD 003 — Signal Lab: Cursor AI Layer

## Цель

Превратить репозиторий в среду, где новый чат Cursor может продолжать разработку без ручного онбординга. Для этого нужно создать набор `rules`, `skills`, `commands`, `hooks` и подключить marketplace skills.

## Зачем это нужно

Без AI-слоя каждый новый чат:
- не знает стек и ограничения;
- не знает conventions по метрикам и логам;
- может добавить Redux вместо Zustand или SWR вместо TanStack Query;
- не имеет готовых workflows для типовых задач.

Мы проверяем, умеет ли кандидат фиксировать решения в reusable артефактах для AI-агента.

## Требования

### R1. Rules (`.cursor/rules/`)

Минимум покрыть:

| Правило | Что фиксирует |
|---------|---------------|
| Stack constraints | Запрещённые и разрешённые библиотеки |
| Observability conventions | Naming для метрик, format для логов, когда кидать в Sentry |
| Prisma patterns | Как работать с Prisma, что запрещено (raw SQL, другие ORM) |
| Frontend patterns | TanStack Query для server state, RHF для форм, shadcn для UI |
| Error handling | Как обрабатывать ошибки на backend и frontend |

Правила не должны конфликтовать друг с другом. Каждое правило — 1 файл с чёткой зоной ответственности.

### R2. Custom Skills (`.cursor/skills/`)

Минимум **3 custom skills**. Обязательно:

1. **Observability skill** — как добавлять метрики, логи и Sentry интеграцию к новому endpoint.
2. Ещё 2 на выбор кандидата. Хорошие примеры:
   - Skill для создания нового NestJS endpoint по шаблону.
   - Skill для добавления shadcn-формы с валидацией.
   - Skill для review observability-ready состояния.
   - Skill для работы с Prisma schema changes.

Каждый skill должен иметь:
- `SKILL.md` с frontmatter (`name`, `description`).
- Чёткую секцию "When to Use".
- Конкретные инструкции, а не общие советы.
- Размер до 500 строк (progressive disclosure через доп. файлы).

### R3. Commands (`.cursor/commands/`)

Минимум **3 команды**. Хорошие направления:

- `/add-endpoint` — scaffold нового NestJS endpoint с observability.
- `/check-obs` — проверить, что observability подключена правильно.
- `/run-prd` — запустить реализацию по PRD через orchestrator.
- `/health-check` — проверить состояние docker stack.

Каждая команда — markdown-файл с промптом, который агент может выполнить.

### R4. Hooks

Минимум **2 hook** с реальной пользой. Примеры:

- **After schema change**: напомнить про миграцию и обновление типов.
- **After new endpoint**: проверить, что добавлены метрики и логирование.
- **Before commit**: проверить, что нет hardcoded secrets.
- **After API change**: напомнить обновить Swagger и фронтенд.

Каждый hook должен решать конкретную проблему, а не быть формальным файлом.

### R5. Marketplace Skills

Минимум **6 подключённых** marketplace skills, релевантных стеку. Ожидаемые:

- `next-best-practices` или `vercel-react-best-practices`
- `shadcn-ui`
- `tailwind-design-system` или `tailwind-v4-shadcn`
- `nestjs-best-practices`
- `prisma-orm`
- `docker-expert`
- `postgresql-table-design`

Допускается эквивалентный набор. Кандидат должен **объяснить**, почему выбран именно этот набор и что custom skills закрывают из того, чего нет в marketplace.

### R6. Документация AI-слоя

Отдельный файл или секция в README:
- Список всех rules и что каждый фиксирует.
- Список skills и когда использовать.
- Список commands.
- Список hooks и какую проблему решают.
- Список marketplace skills и зачем каждый.

## Как оцениваем

Мы открываем новый чат Cursor в репозитории и проверяем:

1. Агент "знает" стек без ручного объяснения.
2. Команды работают: `/add-endpoint`, `/check-obs`.
3. Skills вызываются по назначению.
4. Hooks срабатывают в правильный момент.
5. Правила предотвращают типовые ошибки (добавить Redux, забыть метрики).

## Критерии приёмки

- [ ] Минимум 5 rules файлов с чётким scope.
- [ ] Минимум 3 custom skills с frontmatter и "When to Use".
- [ ] Минимум 3 commands.
- [ ] Минимум 2 hooks с описанием решаемой проблемы.
- [ ] Минимум 6 marketplace skills с обоснованием.
- [ ] Новый чат Cursor может продолжить работу по PRD без ручного контекста.
