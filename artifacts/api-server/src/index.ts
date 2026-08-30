import app from "./app";
import { pool } from "@workspace/db";
import { logger } from "./lib/logger";

const port = Number(process.env.PORT || 5000);

if (Number.isNaN(port) || port <= 0) {
  throw new Error(`Invalid PORT value: "${process.env.PORT}"`);
}

const DATABASE_URL = process.env.DATABASE_URL;

if (!DATABASE_URL) {
  logger.error(
    "DATABASE_URL is not set. Add it to your environment or a root .env file, then run the database migrations (pnpm --filter @workspace/db run db:migrate).",
  );
  process.exit(1);
}

const waitForDatabase = async (attempts = 5): Promise<void> => {
  for (let attempt = 1; attempt <= attempts; attempt += 1) {
    try {
      await pool.query("SELECT 1");
      logger.info("Database connection established");
      return;
    } catch (error) {
      if (attempt === attempts) throw error;
      logger.warn({ error, attempt, attempts }, "Database not ready, retrying…");
      await new Promise((resolve) => setTimeout(resolve, 2_000));
    }
  }
};

waitForDatabase()
  .then(() => {
    app.listen(port, (err) => {
      if (err) {
        logger.error({ err }, "Error listening on port");
        process.exit(1);
      }

      logger.info({ port }, "Server listening");
    });
  })
  .catch((error) => {
    logger.error({ error }, "Failed to connect to the database. Check DATABASE_URL and that PostgreSQL is reachable.");
    process.exit(1);
  });