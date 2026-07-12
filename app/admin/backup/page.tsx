import Link from "next/link";
import { getRequestContext } from "@/lib/auth/context";

export default async function AdminBackupPage() {
  await getRequestContext();

  return (
    <div>
      <Link href="/admin" className="text-sm text-emerald-700 hover:underline">
        ← Dashboard
      </Link>
      <h1 className="mt-2 text-xl font-semibold text-emerald-900">
        CSV Backup
      </h1>
      <p className="mt-1 max-w-prose text-sm text-gray-600">
        Download a flattened CSV of every report — one row per report, with
        fixed columns (student, term, status, overall %) followed by a column
        for each report field. Use this for archival or re-import.
      </p>

      <div className="mt-6">
        <a
          href="/api/admin/backup"
          className="inline-block rounded-md bg-emerald-700 px-4 py-2 text-sm font-medium text-white hover:bg-emerald-800"
        >
          Download reports CSV
        </a>
      </div>

      <p className="mt-3 text-xs text-gray-400">
        Tip: you can also run <code>npm run backup</code> from the CLI to write a
        timestamped file under <code>./backups</code>.
      </p>
    </div>
  );
}
