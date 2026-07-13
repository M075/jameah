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
import { deleteStudent } from "@/app/admin/actions";
import StudentDetailsForm from "@/components/admin/StudentDetailsForm";

export default async function AdminStudentReportsPage({
  params,
}: {
  params: Promise<{ studentId: string }>;
}) {
  const { studentId } = await params;
  await getRequestContext();
  await connectDB();

  const student = await StudentModel.findById(studentId)
    .populate("subjects.subject")
    .populate("subjects.teacher")
    .lean<StudentType>();
  if (!student) notFound();

  const terms = await TermModel.find().sort({ startDate: -1 }).lean();
  const activeTerm = terms.find((t) => t.active) ?? terms[0];

  const reports = await ReportModel.find({ student: studentId })
    .populate("term")
    .populate("subject")
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
        {student.programme ? ` · ${student.programme === "hifz" ? "Hifz" : "Aalim"}` : ""}
      </p>

      {/* Edit student details */}
      <div className="mt-6 rounded-xl border border-gray-200 bg-white p-6">
        <h2 className="text-sm font-semibold text-emerald-900">
          Student details
        </h2>
        <StudentDetailsForm
          studentId={studentId}
          studentCode={student.studentCode ?? ""}
          name={student.name}
          year={student.year ?? null}
          programme={student.programme ?? ""}
        />
      </div>

      {/* Auto-assigned subjects (derived from the student's year) */}
      <div className="mt-6 rounded-xl border border-gray-200 bg-white p-6">
        <h2 className="text-sm font-semibold text-emerald-900">
          Subjects (auto-assigned)
        </h2>
        {student.subjects && student.subjects.length > 0 ? (
          <ul className="mt-3 divide-y divide-gray-100">
            {student.subjects.map((entry) => {
              const subj = entry.subject as unknown as {
                _id: string;
                name: string;
              };
              const teach = entry.teacher as unknown as {
                name?: string;
              } | null;
              return (
                <li
                  key={String(subj._id)}
                  className="flex items-center justify-between py-2 text-sm"
                >
                  <span className="font-medium text-gray-800">
                    {subj.name}
                  </span>
                  <span className="text-gray-600">
                    {teach?.name ?? "No teacher assigned"}
                  </span>
                </li>
              );
            })}
          </ul>
        ) : (
          <p className="mt-2 text-sm text-gray-400">
            {student.programme === "aalim"
              ? "No subjects are assigned yet — set the student's year above."
              : "Hifz students have no subjects."}
          </p>
        )}
      </div>

      {/* Per-subject report cards */}
      <div className="mt-6 space-y-3">
        {reports.map((r) => {
          const term = r.term as unknown as {
            name: string;
            academicYear: string;
          };
          const subject = r.subject as unknown as {
            name: string;
            _id: string;
          };
          const isPublished = r.status === "published";
          return (
            <div
              key={String(r._id)}
              className="flex items-center justify-between rounded-xl border border-gray-200 bg-white p-4 shadow-sm"
            >
              <div>
                <div className="font-medium text-emerald-800">
                  {subject?.name ?? "Subject"}
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
                {activeTerm ? (
                  <Link
                    href={`/teacher/students/${studentId}/edit?term=${String(
                      activeTerm._id,
                    )}&subject=${String(subject?._id)}`}
                    className="rounded-md border border-gray-300 px-2.5 py-1 text-sm font-medium text-gray-700 hover:bg-gray-100"
                  >
                    Edit
                  </Link>
                ) : null}
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

      <div className="mt-6 rounded-xl border border-red-200 bg-white p-6">
        <h2 className="text-sm font-semibold text-red-800">Delete student</h2>
        <p className="mt-1 text-sm text-gray-600">
          Permanently removes this student, their login and all their reports.
        </p>
        <form action={deleteStudent} className="mt-4">
          <input type="hidden" name="studentId" value={studentId} />
          <button
            type="submit"
            className="rounded-md bg-red-600 px-4 py-2 text-sm font-medium text-white hover:bg-red-700"
          >
            Delete student
          </button>
        </form>
      </div>
    </div>
  );
}
