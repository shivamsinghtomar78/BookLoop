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

## Docker

```bash
docker compose up --build                                  # web on :3000
docker compose --profile realtime up --build               # + socket.io on :4001
```

Both images are small (`node:22-alpine`; web uses Next standalone output) and
capped at 768 MB / 384 MB. Real secrets come from `.env` / `.env.local` at
runtime — nothing is baked into the image.

## Documentation

Everything lives in [`docs/`](docs/):

- [Problem statement](docs/PROBLEM_STATEMENT.md) — what and why
- [Screen flow](docs/SCREEN_FLOW.md) · [Workflows](docs/WORKFLOW.md) · [UI reference](docs/UI_REFERENCE.md)
- [Tech stack](docs/TECH.md) · [Architecture](docs/ARCHITECTURE.md) · [Database schema](docs/DATABASE_SCHEMA.md)
- [Decision log](docs/DECISIONS.md) — every decision, numbered
- [Build phases](docs/phases/README.md) — task-level plan with test-gated checkboxes
