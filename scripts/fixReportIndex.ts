/**
 * One-off migration: the `reports` collection in an existing database may
 * still carry a stale unique index `student_1_term_1_template_1` from the
 * pre-refactor schema (which keyed on a `template` field that no longer
 * exists). Because every current report has `template: null`, that index
 * wrongly allows only ONE report per student+term, causing E11000 duplicates
 * when saving a second subject. This drops the stale index and ensures the
 * correct `student_1_term_1_subject_1` unique index exists.
 *
 * Run once:  npx tsx scripts/fixReportIndex.ts
 */
import { loadEnv } from "./loadEnv";
import { connectDB } from "../lib/db";
import { ReportModel } from "../lib/models";

async function main() {
  loadEnv();
  await connectDB();

  const coll = ReportModel.collection;
  const indexes = await coll.indexes();
  console.log("Current indexes:", indexes.map((i) => i.name));

  // Drop the stale template-based index if present.
  const STALE = "student_1_term_1_template_1";
  if (indexes.some((i) => i.name === STALE)) {
    await coll.dropIndex(STALE);
    console.log(`Dropped stale index: ${STALE}`);
  } else {
    console.log(`Stale index ${STALE} not found — nothing to drop.`);
  }

  // Ensure the correct unique index (per student + term + subject) exists.
  await coll.createIndex(
    { student: 1, term: 1, subject: 1 },
    { unique: true, name: "student_1_term_1_subject_1" },
  );
  console.log("Ensured unique index: student_1_term_1_subject_1");

  console.log("Done.");
  process.exit(0);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
