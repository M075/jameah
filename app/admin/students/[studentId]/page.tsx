import Link from "next/link";
import { notFound } from "next/navigation";
import { connectDB } from "@/lib/db";
import {
  StudentModel,
  TermModel,
  ReportModel,
  type TemplateKey,
} from "@/lib/models";
import { reportRegistry } from "@/lib/reports";
import { getRequestContext } from "@/lib/auth/context";

export default async function AdminStudentReportsPage({
  params,
}: {
  params: Promise<{ studentId: string }>;
}) {
  const { studentId } = await params;
  await getRequestContext();
  await connectDB();

  const student = await StudentModel.findById(studentId).lean();
  if (!student) notFound();

  const reports = await ReportModel.find({ student: studentId })
    .populate({ path: "term", model: TermModel })
    .sort({ createdAt: -1 })
    .lean();

  return (
    <div>
      <Link
        href="/admin/students"
        className="text-sm text-emerald-700 hover:underline"
      >
        ← All students
      </Link>
      <h1 className="mt-2 text-xl font-semibold text-emerald-900">
        {student.name}
      </h1>
      <p className="text-sm text-gray-600">
        {student.studentCode}
        {student.grade ? ` · ${student.grade}` : ""}
      </p>

      <div className="mt-4">
        <Link
          href={`/teacher/students/${studentId}`}
          className="inline-block rounded-md bg-emerald-700 px-4 py-2 text-sm font-medium text-white hover:bg-emerald-800"
        >
          Enter / edit marks
        </Link>
      </div>

      <div className="mt-6 space-y-3">
        {reports.map((r) => {
          const term = r.term as unknown as { name: string; academicYear: string };
          const tpl = reportRegistry[r.template as TemplateKey];
          const isPublished = r.status === "published";
          return (
            <div
              key={String(r._id)}
              className="flex items-center justify-between rounded-xl border border-gray-200 bg-white p-4 shadow-sm"
            >
              <div>
                <div className="font-medium text-emerald-800">
                  {tpl?.label ?? r.template}
                </div>
                <div className="text-xs text-gray-500">
                  {term?.name} {term?.academicYear}
                </div>
              </div>
              <div className="flex items-center gap-3">
                <span
                  className={
                    isPublished
                      ? "rounded-full bg-emerald-100 px-2 py-1 text-xs font-medium text-emerald-800"
                      : "rounded-full bg-amber-100 px-2 py-1 text-xs font-medium text-amber-800"
                  }
                >
                  {r.status}
                </span>
                <Link
                  href={`/student/reports/${String(r._id)}`}
                  className="text-sm text-emerald-700 hover:underline"
                >
                  View
                </Link>
                <Link
                  href={`/teacher/students/${studentId}/edit?term=${String(
                    r.term,
                  )}&template=${r.template}`}
                  className="rounded-md border border-gray-300 px-2.5 py-1 text-sm font-medium text-gray-700 hover:bg-gray-100"
                >
                  Edit
                </Link>
              </div>
            </div>
          );
        })}
        {reports.length === 0 ? (
          <p className="rounded-lg bg-gray-50 px-4 py-6 text-center text-sm text-gray-400">
            No reports for this student yet.
          </p>
        ) : null}
      </div>
    </div>
  );
}
