import Link from "next/link";
import { notFound } from "next/navigation";
import { connectDB } from "@/lib/db";
import {
  StudentModel,
  TermModel,
  ReportModel,
  type StudentType,
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

  if (!isAdmin && teacher && !(student.subjects ?? []).some((s) => String(s.teacher) === String(teacher._id))) {
    notFound();
  }

  const terms = await TermModel.find().sort({ startDate: -1 }).lean();
  const activeTerm = terms.find((t) => t.active) ?? terms[0];

  // Subjects this teacher is responsible for on this student.
  const mySubjects = (student.subjects ?? []).filter((s) =>
    isAdmin || (teacher && String(s.teacher) === String(teacher._id)),
  );

  const reports = await ReportModel.find({ student: student._id }).lean();
  const statusOf = (subjectId: string, termId: string) =>
    reports.find(
      (r) =>
        String(r.subject) === subjectId &&
        String(r.term) === termId,
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

      {!activeTerm ? (
        <p className="mt-6 rounded-lg bg-amber-50 px-4 py-3 text-sm text-amber-800">
          No terms exist yet. Create one (or run the seed script) before entering
          marks.
        </p>
      ) : (
        <section className="mt-8">
          <h2 className="text-sm font-semibold uppercase tracking-wide text-gray-500">
            Subjects you teach · {activeTerm.name} {activeTerm.academicYear}
          </h2>
          <div className="mt-3 grid gap-3 sm:grid-cols-2">
            {mySubjects.map((entry) => {
              const subj = entry.subject as unknown as {
                _id: string;
                name: string;
              };
              const status = statusOf(
                String(subj._id),
                String(activeTerm._id),
              );
              return (
                <Link
                  key={String(subj._id)}
                  href={`/teacher/students/${studentId}/edit?term=${String(
                    activeTerm._id,
                  )}&subject=${String(subj._id)}`}
                  className="flex items-center justify-between rounded-xl border border-gray-200 bg-white p-4 shadow-sm hover:border-emerald-400"
                >
                  <div>
                    <div className="font-medium text-emerald-800">
                      {subj.name}
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
            {mySubjects.length === 0 ? (
              <p className="text-sm text-gray-400">
                No subjects are assigned to you for this student.
              </p>
            ) : null}
          </div>
        </section>
      )}
    </div>
  );
}
