import { buildReportsCsv } from "@/lib/reports/exportCsv";
import { getRequestContext } from "@/lib/auth/context";

export const runtime = "nodejs";

export async function GET() {
  const { isAdmin } = await getRequestContext();
  if (!isAdmin) return new Response("Forbidden", { status: 403 });

  const csv = await buildReportsCsv();
  const stamp = new Date().toISOString().slice(0, 10);

  return new Response(csv, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="reports-backup-${stamp}.csv"`,
      "Cache-Control": "no-store",
    },
  });
}
