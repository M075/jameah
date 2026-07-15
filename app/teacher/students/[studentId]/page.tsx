import Link from "next/link";
import { notFound } from "next/navigation";
import { connectDB } from "@/lib/db";
import {
  StudentModel,
  TermModel,
  ReportModel,
  type StudentType,
  type TermType,
  type ReportType,
} from "@/lib/models";
import { getRequestContext } from "@/lib/auth/context";

export default async function StudentReportsPage({
  params,
}: {
  params: Promise<{ studentId: string }>;
}) {
  const { studentId } = await params;
  const { teacher, isAdmin } = await getRequestContext();
  await connectDB();

  const student = await StudentModel.findById(studentId)
    .populate("subjects.subject")
    .lean<StudentType>();
  if (!student) notFound();

  if (
    !isAdmin &&
    teacher &&
    !(student.subjects ?? []).some((s) => String(s.teacher) === String(teacher._id))
  ) {
    notFound();
  }

  const terms = await TermModel.find().sort({ startDate: -1 }).lean<TermType[]>();
  const activeTerm = terms.find((t) => t.active) ?? terms[0];

  const reports = await ReportModel.find({ student: student._id })
    .populate("term")
    .lean<ReportType[]>();
  const reportByTerm = new Map(
    reports.map((r) => [String(r.term), r]),
  );

  const canEdit = isAdmin || (student.subjects ?? []).some((s) =>
    isAdmin || (teacher && String(s.teacher) === String(teacher._id)),
  );

  return (
    <div>
      <Link
        href="/teacher"
        className="text-sm text-emerald-700 hover:underline"
      >
        ← Back to students
      </Link>
      <h1 className="mt-2 text-xl font-semibold text-emerald-900">
        {student.name}
      </h1>
      <p className="text-sm text-gray-600">
        {student.grade ? student.grade : ""}
      </p>

      {!activeTerm ? (
        <p className="mt-6 rounded-lg bg-amber-50 px-4 py-3 text-sm text-amber-800">
          No terms exist yet. Create one (or run the seed script) before entering
          marks.
        </p>
      ) : (
        <section className="mt-8">
          <h2 className="text-sm font-semibold uppercase tracking-wide text-gray-500">
            Term reports
          </h2>
          <div className="mt-3 space-y-3">
            {terms.map((term) => {
              const report = reportByTerm.get(String(term._id));
              const isActive = activeTerm && String(term._id) === String(activeTerm._id);
              const isPublished = report?.status === "published";
              return (
                <div
                  key={String(term._id)}
                  className="flex items-center justify-between rounded-xl border border-gray-200 bg-white p-4 shadow-sm"
                >
                  <div>
                    <div className="font-medium text-emerald-800">
                      {term.name} {term.academicYear}
                    </div>
                    {isActive ? (
                      <div className="text-xs text-emerald-600">Active term</div>
                    ) : null}
                    {report ? (
                      <span
                        className={
                          isPublished
                            ? "mt-1 inline-block rounded-full bg-emerald-100 px-2 py-0.5 text-xs font-medium text-emerald-800"
                            : "mt-1 inline-block rounded-full bg-amber-100 px-2 py-0.5 text-xs font-medium text-amber-800"
                        }
                      >
                        {report.status}
                      </span>
                    ) : (
                      <span className="mt-1 inline-block rounded-full bg-gray-100 px-2 py-0.5 text-xs font-medium text-gray-500">
                        not started
                      </span>
                    )}
                  </div>
                  <div className="flex items-center gap-2">
                    {report ? (
                      <Link
                        href={`/student/reports/${String(report._id)}`}
                        className="rounded-md border border-gray-300 px-2.5 py-1 text-sm font-medium text-gray-700 hover:bg-gray-100"
                      >
                        View
                      </Link>
                    ) : null}
                    {canEdit ? (
                      <Link
                        href={`/teacher/students/${studentId}/edit?term=${String(
                          (activeTerm ?? term)._id,
                        )}`}
                        className="rounded-md bg-emerald-700 px-3 py-1.5 text-sm font-medium text-white hover:bg-emerald-800"
                      >
                        {report ? "Edit marks" : "Enter marks"}
                      </Link>
                    ) : null}
                  </div>
                </div>
              );
            })}
            {terms.length === 0 ? (
              <p className="text-sm text-gray-400">No terms available.</p>
            ) : null}
          </div>
        </section>
      )}
    </div>
  );
}
