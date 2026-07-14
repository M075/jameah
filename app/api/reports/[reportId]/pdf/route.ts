import { createElement } from "react";
import { renderToBuffer } from "@react-pdf/renderer";
import { StudentModel } from "@/lib/models";
import { loadReportContext } from "@/lib/reports/loadReport";
import { getRequestContext } from "@/lib/auth/context";
import ReportPdf from "@/components/report/ReportPdf";

// @react-pdf/renderer needs Node APIs, so this route runs on the Node runtime.
export const runtime = "nodejs";

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ reportId: string }> },
) {
  const { reportId } = await params;
  const { session, isAdmin } = await getRequestContext();
  if (!session?.user) return new Response("Unauthorized", { status: 401 });

  const ctx = await loadReportContext(reportId);
  if (!ctx) return new Response("Not found", { status: 404 });

  // Students may only fetch their own reports; admins may fetch any.
  if (!isAdmin) {
    const student = await StudentModel.findOne({
      userId: session.user.id,
    }).lean();
    if (!student || String(ctx.report.student) !== String(student._id)) {
      return new Response("Forbidden", { status: 403 });
    }
  }

  const buffer = await renderToBuffer(createElement(ReportPdf, { ctx }) as any);

  const filename = `report-${ctx.student?.name ?? "student"}.pdf`;
  return new Response(buffer as unknown as BodyInit, {
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `inline; filename="${filename}"`,
      "Cache-Control": "no-store",
    },
  });
}
