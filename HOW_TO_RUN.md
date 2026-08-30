# How to Run DevFlow AI

## Quick start (3 commands)

```bash
pnpm install
pnpm dev
```

That's it.

- Frontend (React + Vite): http://localost:5173
- API server (Express): http://localhost:5000/api/healthz

> Requires Node.js 18+ and pnpm (`npm install -g pnpm` if you don't have it). The repo rejects npm/yarn via a preinstall hook — use pnpm.

## What runs

| Service | Port | Command |
|---|---|---|
| Frontend | 5173 | `pnpm --filter @workspace/devflow-ai run dev` |
| API server | 5000 | `pnpm --filter @workspace/api-server run dev` |
| Both at once | — | `pnpm dev` (root) |

Ports can be overridden with the `PORT` env variable. The frontend also accepts `BASE_PATH` (defaults to `/`).

## Database (required)

Projects, tasks, and activity are stored in PostgreSQL via Drizzle. Add a `DATABASE_URL` to the repository-root `.env` file (see `.env.example`) before starting:

```bash
# .env  (repo root)
DATABASE_URL=postgresql://USERNAME:PASSWORD@HOST:5432/mydatabase?sslmode=require
```

Then generate and apply the Drizzle migration, and (optionally) load demo data:

```bash
pnpm --filter @workspace/db run db:generate   # create SQL from the schema (already committed)
pnpm --filter @workspace/db run db:migrate    # apply migrations to the database
pnpm --filter @workspace/db run db:seed       # idempotent demo data (projects/tasks/activity)
```

The API server refuses to start and print the exact fix if `DATABASE_URL` is missing.

## Optional

- **OpenAI Copilot**: set `OPENAI_API_KEY` in your environment before starting. Without it, the Copilot uses built-in deterministic answers grounded on the persisted workspace data.

## Other useful commands

```bash
pnpm run typecheck   # type-check everything
pnpm run build       # type-check + build all packages
```

## Verify it works

Open http://localhost:5173 in your browser, or:

```bash
curl http://localhost:5000/api/healthz   # -> {"status":"ok"}
```
