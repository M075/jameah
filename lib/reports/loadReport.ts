import { connectDB } from "@/lib/db";
import {
  ReportModel,
  StudentModel,
  TermModel,
  TeacherModel,
  SubjectModel,
  type ReportType,
  type StudentType,
  type TermType,
  type TeacherType,
  type SubjectType,
  type ProgrammeKey,
} from "@/lib/models";
import {
  buildReportTemplate,
  computeResult,
  type ReportData,
  type ReportResult,
  type ReportTemplate,
} from "@/lib/reports";

export interface ReportContext {
  report: ReportType;
  student: StudentType | null;
  term: TermType | null;
  teacher: TeacherType | null;
  subject: SubjectType | null;
  programme: ProgrammeKey;
  template: ReportTemplate;
  result: ReportResult;
  data: ReportData;
}

/**
 * Load a report together with its student, term, teacher, and subject, plus the
 * derived template and computed result. Shared by the HTML view and the PDF
 * route so both render from one source of truth.
 */
export async function loadReportContext(
  reportId: string,
): Promise<ReportContext | null> {
  await connectDB();
  const report = await ReportModel.findById(reportId).lean<ReportType>();
  if (!report) return null;

  const [student, term, teacher, subject] = await Promise.all([
    StudentModel.findById(report.student).lean<StudentType>(),
    TermModel.findById(report.term).lean<TermType>(),
    TeacherModel.findById(report.teacher).lean<TeacherType>(),
    SubjectModel.findById(report.subject).lean<SubjectType>(),
  ]);

  const programme = (subject?.type ?? "hifz") as ProgrammeKey;
  const template = buildReportTemplate(programme, [
    { id: String(report.subject), name: subject?.name ?? "Subject" },
  ]);
  const data = (report.data ?? {}) as ReportData;
  const result = computeResult(template, data);

  return {
    report,
    student,
    term,
    teacher,
    subject,
    programme,
    template,
    result,
    data,
  };
}
