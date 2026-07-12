/**
 * Export all reports to a timestamped CSV under ./backups.
 * Run with:  npx tsx scripts/backup.ts   (or `npm run backup`).
 */
import fs from "node:fs";
import path from "node:path";
import { loadEnv } from "./loadEnv";
import { buildReportsCsv } from "../lib/reports/exportCsv";

async function main() {
  loadEnv();
  const csv = await buildReportsCsv();

  const dir = path.resolve(process.cwd(), "backups");
  fs.mkdirSync(dir, { recursive: true });

  const stamp = new Date().toISOString().replace(/[:.]/g, "-").replace("Z", "");
  const file = path.join(dir, `reports-${stamp}.csv`);
  fs.writeFileSync(file, csv, "utf8");

  const lines = csv.trim().split("\n").length - 1; // minus header
  console.log(`Wrote ${lines} report row(s) to ${file}`);
}

main().then(
  () => process.exit(0),
  (err) => {
    console.error(err);
    process.exit(1);
  },
);
