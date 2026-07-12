import fs from "node:fs";
import path from "node:path";

/**
 * Minimal .env loader for standalone scripts run via `tsx` (Next.js loads env
 * automatically, but raw tsx does not). Reads .env.local then .env, setting
 * any variables not already present in process.env. Does not override existing
 * environment variables.
 */
export function loadEnv(): void {
  const root = process.cwd();
  for (const file of [".env.local", ".env"]) {
    const p = path.join(root, file);
    if (!fs.existsSync(p)) continue;
    const text = fs.readFileSync(p, "utf8");
    for (const line of text.split(/\r?\n/)) {
      const match = line.match(/^\s*([\w.-]+)\s*=\s*(.*)\s*$/);
      if (!match) continue;
      const key = match[1];
      let val = match[2].trim();
      if (
        (val.startsWith('"') && val.endsWith('"')) ||
        (val.startsWith("'") && val.endsWith("'"))
      ) {
        val = val.slice(1, -1);
      }
      if (process.env[key] === undefined) process.env[key] = val;
    }
  }
}
