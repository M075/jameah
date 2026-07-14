import Link from "next/link";
import { notFound } from "next/navigation";
import { connectDB } from "@/lib/db";
import {
  StudentModel,
  TermModel,
  ReportModel,
  type StudentType,
  type TermType,
} from "@/lib/models";
import type { SubjectRef } from "@/lib/reports";
import { getRequestContext } from "@/lib/auth/context";
import MarkEntryForm from "@/app/teacher/students/[studentId]/edit/mark-entry-form";

/** Read {id, name} from a student.subjects entry (populated or bare ObjectId). */
function subjectRef(entry: { subject: unknown }): SubjectRef {
  const sub = entry.subject as
    | { _id?: unknown; name?: string }
    | string
    | null
    | undefined;
  const id =
    sub && typeof sub === "object" && "_id" in sub
      ? String(sub._id)
      : String(sub);
  const name =
    sub && typeof sub === "object" && "name" in sub
      ? (sub.name ?? "Subject")
      : "Subject";
  return { id, name };
}

export default async function AdminMarksPage({
  params,
  searchParams,
}: {
  params: Promise<{ studentId: string }>;
  searchParams: Promise<{ term?: string }>;
}) {
  const { studentId } = await params;
  const { term } = await searchParams;

  await getRequestContext();
  await connectDB();

  const student = await StudentModel.findById(studentId)
    .populate("subjects.subject")
    .populate("subjects.teacher")
    .lean<StudentType>();
  if (!student) notFound();

  const terms = await TermModel.find().sort({ startDate: -1 }).lean<TermType[]>();
  // Always use the active term (falling back to the most recent), so the admin
  // lands straight on the mark entry form — no term picker in between.
  const activeTerm = terms.find((t) => t.active) ?? terms[0];
  const chosenTermId = term || (activeTerm ? String(activeTerm._id) : "");

  if (!chosenTermId) {
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
        <p className="mt-4 rounded-lg bg-gray-50 px-4 py-6 text-center text-sm text-gray-400">
          No terms exist yet. Create one before entering marks.
        </p>
      </div>
    );
  }

  const [termDoc, report] = await Promise.all([
    TermModel.findById(chosenTermId).lean<TermType>(),
    ReportModel.findOne({ student: studentId, term: chosenTermId }).lean(),
  ]);
  if (!termDoc) notFound();

  const subjects = (student.subjects ?? []).map(subjectRef);
  const initialData = (report?.data ?? {}) as Record<string, string | number>;

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
          Enter marks
        </h1>
        <span className="text-sm text-gray-500">
          {termDoc.name} {termDoc.academicYear}
        </span>
      </div>
      <p className="text-sm text-gray-600">
        {student.name}
        {report ? ` · current status: ${report.status}` : " · new report"}
      </p>

      <div className="mt-6">
        <MarkEntryForm
          studentId={studentId}
          termId={chosenTermId}
          programme={student.programme}
          subjects={subjects}
          initialData={initialData}
          returnUrl={`/admin/students/${studentId}`}
        />
      </div>
    </div>
  );
}
