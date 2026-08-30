import path from "node:path";
import { fileURLToPath } from "node:url";
import { migrate } from "drizzle-orm/node-postgres/migrator";
import { db, pool } from "../index";

const migrationsFolder = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../../drizzle");

const run = async () => {
  await migrate(db, { migrationsFolder });
  console.log(`Migrations applied from ${migrationsFolder}`);
};

run()
  .then(() => pool.end())
  .catch((error) => {
    console.error("Migration failed:", error);
    void pool.end();
    process.exit(1);
  });