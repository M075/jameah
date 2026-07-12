import Link from "next/link";
import { notFound } from "next/navigation";
import { connectDB } from "@/lib/db";
import { StudentModel, TermModel, ReportModel, type TemplateKey } from "@/lib/models";
import { getTemplate, type ReportData } from "@/lib/reports";
import { getRequestContext } from "@/lib/auth/context";
import MarkEntryForm from "./mark-entry-form";

export default async function EditReportPage({
  params,
  searchParams,
}: {
  params: Promise<{ studentId: string }>;
  searchParams: Promise<{ term?: string; template?: string }>;
}) {
  const { studentId } = await params;
  const { term, template } = await searchParams;

  if (!term || (template !== "hifz" && template !== "islamic")) {
    notFound();
  }

  const { teacher, isAdmin } = await getRequestContext();
  await connectDB();

  const student = await StudentModel.findById(studentId).lean();
  if (!student) notFound();
  if (!isAdmin && teacher && String(student.teacher) !== String(teacher._id)) {
    notFound();
  }

  const termDoc = await TermModel.findById(term).lean();
  if (!termDoc) notFound();

  const report = await ReportModel.findOne({
    student: studentId,
    term,
    template,
  }).lean();

  const tmpl = getTemplate(template as TemplateKey);
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
          {tmpl.label}
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
        />
      </div>
    </div>
  );
}
