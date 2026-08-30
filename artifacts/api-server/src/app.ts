import express, { type Express, type NextFunction, type Request, type Response } from "express";
import cors from "cors";
import pinoHttp from "pino-http";
import { ZodError } from "zod";
import router from "./routes";
import { logger } from "./lib/logger";

const app: Express = express();

app.use(
  pinoHttp({
    logger,
    serializers: {
      req(req) {
        return {
          id: req.id,
          method: req.method,
          url: req.url?.split("?")[0],
        };
      },
      res(res) {
        return {
          statusCode: res.statusCode,
        };
      },
    },
  }),
);
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use("/api", router);
app.use("/api", (_req, res) => {
  res.status(404).json({ error: "Not found" });
});

// The database may wrap pg errors (e.g. inside drizzle transactions), so walk
// the cause chain looking for an error that carries a PostgreSQL error code.
type PgError = { code: string };

const findPgError = (err: unknown): PgError | undefined => {
  let current: unknown = err;
  for (let depth = 0; depth < 6; depth += 1) {
    if (typeof current !== "object" || current === null) return undefined;
    const code = (current as { code?: unknown }).code;
    if (typeof code === "string" && /^\d{5}$/.test(code)) return current as PgError;
    current = (current as { cause?: unknown }).cause;
  }
  return undefined;
};

app.use((err: unknown, req: Request, res: Response, _next: NextFunction) => {
  if (err instanceof ZodError) {
    res.status(400).json({ error: "Validation failed", details: err.flatten() });
    return;
  }

  const pgError = findPgError(err);
  if (pgError) {
    switch (pgError.code) {
      case "23505":
        res.status(409).json({ error: "A record with the same identifier already exists" });
        return;
      case "23503":
        res.status(400).json({ error: "Referenced record does not exist" });
        return;
      case "23502":
        res.status(400).json({ error: "A required field is missing" });
        return;
      case "23514":
        res.status(400).json({ error: "Invalid value for a constrained field" });
        return;
    }
  }

  req.log.error({ err }, "Unhandled request error");
  res.status(500).json({ error: "Internal server error" });
});

export default app;