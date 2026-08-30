import { existsSync, readFileSync } from "node:fs";
import path from "node:path";

const ENV_FILE_NAMES = [".env.local", ".env"];

const UNQUOTE = /^(['"])(.*)\1$/;

/**
 * Minimal dotenv-equivalent loader. Exported variables are only set when they
 * are missing from the process environment so that real environment variables
 * (e.g. Replit secrets) always win over values in dotfiles.
 *
 * The root `.env` of the repository lives outside the package directories, so
 * we walk up from the current working directory until an env file is found.
 */
export function loadEnv(): void {
  let directory = process.cwd();

  for (let depth = 0; depth < 4; depth += 1) {
    for (const name of ENV_FILE_NAMES) {
      const file = path.join(directory, name);
      if (!existsSync(file)) continue;

      try {
        const raw = readFileSync(file, "utf8");
        for (const line of raw.split(/\r?\n/)) {
          const trimmed = line.trim();
          if (!trimmed || trimmed.startsWith("#")) continue;

          const eq = trimmed.indexOf("=");
          if (eq === -1) continue;

          const key = trimmed.slice(0, eq).trim();
          const rawValue = trimmed.slice(eq + 1).trim();
          if (!key || process.env[key] !== undefined) continue;

          const value = UNQUOTE.test(rawValue)
            ? rawValue.replace(UNQUOTE, "$2")
            : rawValue;
          process.env[key] = value;
        }
      } catch {
        // Ignore unreadable dotfiles rather than crashing the process.
      }

      return;
    }

    const parent = path.dirname(directory);
    if (parent === directory) return;
    directory = parent;
  }
}