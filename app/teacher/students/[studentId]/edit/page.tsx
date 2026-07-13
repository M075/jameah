import Link from "next/link";
import { notFound } from "next/navigation";
import { connectDB } from "@/lib/db";
import {
  StudentModel,
  TermModel,
  ReportModel,
  SubjectModel,
  type StudentType,
} from "@/lib/models";
import { buildReportTemplate, type ReportData } from "@/lib/reports";
import { getRequestContext } from "@/lib/auth/context";
import MarkEntryForm from "./mark-entry-form";

export default async function EditReportPage({
  params,
  searchParams,
}: {
  params: Promise<{ studentId: string }>;
  searchParams: Promise<{ term?: string; subject?: string }>;
}) {
  const { studentId } = await params;
  const { term, subject } = await searchParams;

  if (!term || !subject) {
    notFound();
  }

  const { teacher, isAdmin } = await getRequestContext();
  await connectDB();

  const student = await StudentModel.findById(studentId)
    .populate("subjects.subject")
    .lean<StudentType>();
  if (!student) notFound();

  // `s.subject` may be a populated doc or a bare ObjectId; read the id either
  // way so the comparison against the `subject` query param is correct.
  const subjectIdOf = (s: { subject: unknown }): string => {
    const sub = s.subject as { _id?: unknown } | string | { toString(): string };
    if (sub && typeof sub === "object" && "_id" in sub) {
      return String((sub as { _id: unknown })._id);
    }
    return String(sub);
  };

  const assignment = (student.subjects ?? []).find(
    (s) => subjectIdOf(s) === subject,
  );
  if (!assignment) notFound();
  if (!isAdmin && teacher && String(assignment.teacher) !== String(teacher._id)) {
    notFound();
  }

  const [termDoc, subjectDoc, report] = await Promise.all([
    TermModel.findById(term).lean(),
    SubjectModel.findById(subject).lean(),
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
        href={`/teacher/students/${studentId}`}
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
        {report
          ? ` · current status: ${report.status}`
          : " · new report"}
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
