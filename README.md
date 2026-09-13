# BookLoop

**Give your books a second life** — a school marketplace to buy, sell, exchange and donate used school books.

## Stack

Next.js 16 (App Router, TypeScript) · Tailwind v4 + shadcn/ui · Neon Postgres + Drizzle · Vercel

## Quickstart

```bash
npm install
cp .env.example .env   # fill in DATABASE_URL (Neon)
npm run db:push        # create tables
npm run db:seed        # dev data
npm run dev
```

Health check: `GET /api/health` → `{ ok: true, db: true }`

## Documentation

Everything lives in [`docs/`](docs/):

- [Problem statement](docs/PROBLEM_STATEMENT.md) — what and why
- [Screen flow](docs/SCREEN_FLOW.md) · [Workflows](docs/WORKFLOW.md) · [UI reference](docs/UI_REFERENCE.md)
- [Tech stack](docs/TECH.md) · [Architecture](docs/ARCHITECTURE.md) · [Database schema](docs/DATABASE_SCHEMA.md)
- [Decision log](docs/DECISIONS.md) — every decision, numbered
- [Build phases](docs/phases/README.md) — task-level plan with test-gated checkboxes
