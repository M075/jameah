import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { connectDB } from "@/lib/db";
import {
  StudentModel,
  TermModel,
  ReportModel,
  type StudentType,
} from "@/lib/models";
import type { SubjectRef } from "@/lib/reports";
import { getRequestContext } from "@/lib/auth/context";
import MarkEntryForm from "./mark-entry-form";

/** Read {id, name} from a student.subjects entry (populated or bare ObjectId). */
function subjectRef(entry: {
  subject: unknown;
  teacher: unknown;
}): SubjectRef & { teacherId: string | null } {
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
  const teach = entry.teacher as { _id?: unknown } | string | null | undefined;
  const teacherId =
    teach && typeof teach === "object" && "_id" in teach
      ? String(teach._id)
      : teach
        ? String(teach)
        : null;
  return { id, name, teacherId };
}

export default async function EditReportPage({
  params,
  searchParams,
}: {
  params: Promise<{ studentId: string }>;
  searchParams: Promise<{ term?: string }>;
}) {
  const { studentId } = await params;
  const { term } = await searchParams;

  const { teacher, isAdmin } = await getRequestContext();
  await connectDB();

  const student = await StudentModel.findById(studentId)
    .populate("subjects.subject")
    .populate("subjects.teacher")
    .lean<StudentType>();
  if (!student) notFound();

  if (!term) redirect(`/teacher/students/${studentId}`);

  const termDoc = await TermModel.findById(term).lean();
  if (!termDoc) notFound();

  // Subjects this caller may enter marks for.
  const allRefs = (student.subjects ?? []).map(subjectRef);
  const editable = isAdmin
    ? allRefs
    : allRefs.filter(
        (s) => teacher && s.teacherId && s.teacherId === String(teacher._id),
      );
  if (editable.length === 0) notFound();

  const report = await ReportModel.findOne({
    student: studentId,
    term,
  }).lean();

  const initialData = (report?.data ?? {}) as Record<string, string | number>;

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
          termId={term}
          programme={student.programme}
          subjects={editable}
          initialData={initialData}
          returnUrl="/teacher"
        />
      </div>
    </div>
  );
}
