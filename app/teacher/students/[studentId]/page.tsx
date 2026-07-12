import Link from "next/link";
import { notFound } from "next/navigation";
import { connectDB } from "@/lib/db";
import {
  StudentModel,
  TermModel,
  ReportModel,
  type TemplateKey,
} from "@/lib/models";
import { reportTemplates } from "@/lib/reports";
import { getRequestContext } from "@/lib/auth/context";

export default async function StudentReportsPage({
  params,
}: {
  params: Promise<{ studentId: string }>;
}) {
  const { studentId } = await params;
  const { teacher, isAdmin } = await getRequestContext();
  await connectDB();

  const student = await StudentModel.findById(studentId).lean();
  if (!student) notFound();

  if (!isAdmin && teacher && String(student.teacher) !== String(teacher._id)) {
    notFound();
  }

  const terms = await TermModel.find().sort({ startDate: -1 }).lean();
  const reports = await ReportModel.find({ student: student._id }).lean();
  const statusOf = (termId: string, tpl: TemplateKey) =>
    reports.find(
      (r) =>
        String(r.term) === termId && (r.template as TemplateKey) === tpl,
    )?.status;

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
        {student.studentCode}
        {student.grade ? ` · ${student.grade}` : ""}
      </p>

      {terms.length === 0 ? (
        <p className="mt-6 rounded-lg bg-amber-50 px-4 py-3 text-sm text-amber-800">
          No terms exist yet. Create one (or run the seed script) before entering
          marks.
        </p>
      ) : (
        terms.map((term) => (
          <section key={String(term._id)} className="mt-8">
            <h2 className="text-sm font-semibold uppercase tracking-wide text-gray-500">
              {term.name} {term.academicYear}
              {term.active ? (
                <span className="ml-2 rounded bg-emerald-100 px-1.5 py-0.5 text-[10px] font-medium text-emerald-800">
                  ACTIVE
                </span>
              ) : null}
            </h2>
            <div className="mt-3 grid gap-3 sm:grid-cols-2">
              {reportTemplates.map((tpl) => {
                const status = statusOf(String(term._id), tpl.key);
                return (
                  <Link
                    key={tpl.key}
                    href={`/teacher/students/${studentId}/edit?term=${String(
                      term._id,
                    )}&template=${tpl.key}`}
                    className="flex items-center justify-between rounded-xl border border-gray-200 bg-white p-4 shadow-sm hover:border-emerald-400"
                  >
                    <div>
                      <div className="font-medium text-emerald-800">
                        {tpl.label}
                      </div>
                      <div className="text-xs text-gray-500">
                        {tpl.description}
                      </div>
                    </div>
                    {status ? (
                      <span
                        className={
                          status === "published"
                            ? "rounded-full bg-emerald-100 px-2 py-1 text-xs font-medium text-emerald-800"
                            : "rounded-full bg-amber-100 px-2 py-1 text-xs font-medium text-amber-800"
                        }
                      >
                        {status}
                      </span>
                    ) : (
                      <span className="rounded-full bg-gray-100 px-2 py-1 text-xs font-medium text-gray-500">
                        not started
                      </span>
                    )}
                  </Link>
                );
              })}
            </div>
          </section>
        ))
      )}
    </div>
  );
}
