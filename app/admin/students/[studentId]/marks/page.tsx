import Link from "next/link";
import { notFound } from "next/navigation";
import { connectDB } from "@/lib/db";
import {
  StudentModel,
  TermModel,
  ReportModel,
  SubjectModel,
  type StudentType,
  type TermType,
  type SubjectType,
} from "@/lib/models";
import { buildReportTemplate, type ReportData } from "@/lib/reports";
import { getRequestContext } from "@/lib/auth/context";
import MarkEntryForm from "@/app/teacher/students/[studentId]/edit/mark-entry-form";

export default async function AdminMarksPage({
  params,
  searchParams,
}: {
  params: Promise<{ studentId: string }>;
  searchParams: Promise<{ term?: string; subject?: string }>;
}) {
  const { studentId } = await params;
  const { term, subject } = await searchParams;

  await getRequestContext();
  await connectDB();

  const student = await StudentModel.findById(studentId)
    .populate("subjects.subject")
    .populate("subjects.teacher")
    .lean<StudentType>();
  if (!student) notFound();

  const terms = await TermModel.find().sort({ startDate: -1 }).lean<TermType[]>();
  const assignments = student.subjects ?? [];

  // No term/subject chosen yet → show a picker. A plain GET form posts to
  // this same route with ?term=&subject=, re-rendering with the editor.
  if (!term || !subject) {
    const activeTerm = terms.find((t) => t.active) ?? terms[0];
    return (
      <div>
        <Link
          href={`/admin/students/${studentId}`}
          className="text-sm text-emerald-700 hover:underline"
        >
          ← Back to {student.name}
        </Link>
        <h1 className="mt-2 text-xl font-semibold text-emerald-900">
          Enter marks
        </h1>
        <p className="mt-1 text-sm text-gray-600">
          {student.name} ({student.studentCode})
        </p>

        {assignments.length === 0 ? (
          <p className="mt-4 rounded-lg bg-gray-50 px-4 py-6 text-center text-sm text-gray-400">
            This student has no subjects assigned.
          </p>
        ) : (
          <form
            method="get"
            className="mt-6 space-y-4 rounded-xl border border-gray-200 bg-white p-6"
          >
            <div>
              <label className="block text-sm font-medium text-gray-700">
                Term <span className="text-red-500">*</span>
              </label>
              <select
                name="term"
                required
                defaultValue={activeTerm ? String(activeTerm._id) : ""}
                className="mt-1 w-full rounded-md border border-gray-300 px-3 py-2 text-sm"
              >
                <option value="">— select —</option>
                {terms.map((t) => (
                  <option key={String(t._id)} value={String(t._id)}>
                    {t.name} {t.academicYear}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">
                Subject <span className="text-red-500">*</span>
              </label>
              <select
                name="subject"
                required
                className="mt-1 w-full rounded-md border border-gray-300 px-3 py-2 text-sm"
              >
                <option value="">— select —</option>
                {assignments.map((a) => {
                  const subj = a.subject as unknown as { _id: string; name: string };
                  return (
                    <option key={String(subj._id)} value={String(subj._id)}>
                      {subj.name}
                    </option>
                  );
                })}
              </select>
            </div>
            <button
              type="submit"
              className="rounded-md bg-emerald-700 px-4 py-2 text-sm font-medium text-white hover:bg-emerald-800"
            >
              Continue
            </button>
          </form>
        )}
      </div>
    );
  }

  const [termDoc, subjectDoc, report] = await Promise.all([
    TermModel.findById(term).lean<TermType>(),
    SubjectModel.findById(subject).lean<SubjectType>(),
    ReportModel.findOne({ student: studentId, term, subject }).lean(),
  ]);
  if (!termDoc || !subjectDoc) notFound();

  const tmpl = buildReportTemplate(subjectDoc.type, [
    { id: String(subjectDoc._id), name: subjectDoc.name },
  ]);
  const initialData = (report?.data ?? {}) as ReportData;

  return (
    <div>
      <Link
        href={`/admin/students/${studentId}`}
        className="text-sm text-emerald-700 hover:underline"
      >
        ← Back to {student.name}
      </Link>
      <div className="mt-2 flex items-baseline justify-between">
        <h1 className="text-xl font-semibold text-emerald-900">
          {subjectDoc.name}
        </h1>
        <span className="text-sm text-gray-500">
          {termDoc.name} {termDoc.academicYear}
        </span>
      </div>
      <p className="text-sm text-gray-600">
        {student.name} ({student.studentCode})
        {report ? ` · current status: ${report.status}` : " · new report"}
      </p>

      <div className="mt-6">
        <MarkEntryForm
          template={tmpl}
          initialData={initialData}
          studentId={studentId}
          termId={term}
          subjectId={subject}
        />
      </div>
    </div>
  );
}
