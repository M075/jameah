import Link from "next/link";
import { notFound } from "next/navigation";
import { connectDB } from "@/lib/db";
import { StudentModel } from "@/lib/models";
import { loadReportContext } from "@/lib/reports/loadReport";
import { getRequestContext } from "@/lib/auth/context";
import ReportHtml from "@/components/report/ReportHtml";
import PrintButton from "@/components/PrintButton";

export default async function StudentReportPage({
  params,
}: {
  params: Promise<{ reportId: string }>;
}) {
  const { reportId } = await params;
  const { session, isAdmin } = await getRequestContext();
  await connectDB();

  const ctx = await loadReportContext(reportId);
  if (!ctx) notFound();

  // A student may only view their own reports; admins may view any.
  if (!isAdmin) {
    const student = await StudentModel.findOne({
      userId: session!.user.id,
    }).lean();
    if (!student || String(ctx.report.student) !== String(student._id)) {
      notFound();
    }
  }

  return (
    <div>
      <div className="no-print mb-4 flex items-center justify-between">
        <Link
          href="/student"
          className="text-sm text-emerald-700 hover:underline"
        >
          ← Back to my reports
        </Link>
        <div className="flex gap-2">
          <PrintButton />
          <a
            href={`/api/reports/${reportId}/pdf`}
            className="rounded-md bg-emerald-700 px-4 py-2 text-sm font-medium text-white hover:bg-emerald-800"
          >
            Download PDF
          </a>
        </div>
      </div>

      <ReportHtml ctx={ctx} />
    </div>
  );
}
