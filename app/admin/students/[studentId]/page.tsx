import Link from "next/link";
import { notFound } from "next/navigation";
import { connectDB } from "@/lib/db";
import {
  StudentModel,
  SubjectModel,
  TeacherModel,
  TermModel,
  ReportModel,
  type SubjectType,
  type TeacherType,
  type StudentType,
} from "@/lib/models";
import { getRequestContext } from "@/lib/auth/context";
import { assignStudentSubjects, deleteStudent } from "@/app/admin/actions";
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

  const programmeSubjects = student.programme
    ? await SubjectModel.find({ type: student.programme })
        .sort({ name: 1 })
        .lean<SubjectType[]>()
    : [];
  const teachers = await TeacherModel.find({
    type: student.programme,
  })
    .populate("subjects")
    .lean<TeacherType[]>();

  const assignedTeacher = (subjectId: string): string => {
    const entry = (student.subjects ?? []).find(
      (s) => String(s.subject) === subjectId,
    );
    return entry && entry.teacher ? String(entry.teacher) : "";
  };

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
          grade={student.grade ?? ""}
          section={student.section ?? ""}
          programme={student.programme ?? ""}
        />
      </div>

      {/* Per-subject teacher assignment */}
      <div className="mt-6 rounded-xl border border-gray-200 bg-white p-6">
        <h2 className="text-sm font-semibold text-emerald-900">
          Assign teachers per subject
        </h2>
        {!student.programme ? (
          <p className="mt-2 text-sm text-amber-700">
            Set the student's programme on the Add/Edit form before assigning
            subjects.
          </p>
        ) : (
          <form
            action={async (fd: FormData) => {
              await assignStudentSubjects(fd);
            }}
            className="mt-4 space-y-3"
          >
            <input type="hidden" name="studentId" value={studentId} />
            {programmeSubjects.map((subj) => {
              const eligible = teachers.filter((t) =>
                (t.subjects as { _id: unknown }[]).some(
                  (s) => String(s._id) === String(subj._id),
                ),
              );
              return (
                <div
                  key={String(subj._id)}
                  className="flex items-center gap-3"
                >
                  <span className="w-40 text-sm font-medium text-gray-700">
                    {subj.name}
                  </span>
                  <select
                    name={`subject:${String(subj._id)}`}
                    defaultValue={assignedTeacher(String(subj._id))}
                    className="rounded-md border border-gray-300 px-2 py-1.5 text-sm"
                  >
                    <option value="">— none —</option>
                    {eligible.map((t) => (
                      <option key={String(t._id)} value={String(t._id)}>
                        {t.name}
                      </option>
                    ))}
                  </select>
                </div>
              );
            })}
            <button
              type="submit"
              className="rounded-md bg-emerald-700 px-4 py-2 text-sm font-medium text-white hover:bg-emerald-800"
            >
              Save assignments
            </button>
          </form>
        )}
      </div>

      {/* Per-subject report cards */}
      <div className="mt-6 space-y-3">
        {reports.map((r) => {
          const term = r.term as unknown as { name: string; academicYear: string };
          const subject = r.subject as unknown as { name: string; _id: string };
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
