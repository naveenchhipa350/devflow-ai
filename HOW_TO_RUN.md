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

## Optional

- **OpenAI Copilot**: set `OPENAI_API_KEY` in your environment before starting. Without it, the Copilot uses built-in deterministic workspace answers.
- **Database**: not required — data is in-memory. PostgreSQL/Drizzle is scaffolded under `lib/db`.

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
