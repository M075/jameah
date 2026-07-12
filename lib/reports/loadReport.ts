import { connectDB } from "@/lib/db";
import {
  ReportModel,
  StudentModel,
  TermModel,
  TeacherModel,
  type ReportType,
  type StudentType,
  type TermType,
  type TeacherType,
  type TemplateKey,
} from "@/lib/models";
import { getTemplate, computeResult, type ReportData, type ReportResult, type ReportTemplate } from "@/lib/reports";

export interface ReportContext {
  report: ReportType;
  student: StudentType | null;
  term: TermType | null;
  teacher: TeacherType | null;
  templateKey: TemplateKey;
  template: ReportTemplate;
  result: ReportResult;
  data: ReportData;
}

/**
 * Load a report together with its student, term, and teacher, plus the derived
 * template and computed result. Shared by the HTML view and the PDF route so
 * both render from one source of truth.
 */
export async function loadReportContext(
  reportId: string,
): Promise<ReportContext | null> {
  await connectDB();
  const report = await ReportModel.findById(reportId).lean<ReportType>();
  if (!report) return null;

  const [student, term, teacher] = await Promise.all([
    StudentModel.findById(report.student).lean<StudentType>(),
    TermModel.findById(report.term).lean<TermType>(),
    TeacherModel.findById(report.teacher).lean<TeacherType>(),
  ]);

  const templateKey = report.template as TemplateKey;
  const template = getTemplate(templateKey);
  const data = (report.data ?? {}) as ReportData;
  const result = computeResult(template, data);

  return { report, student, term, teacher, templateKey, template, result, data };
}
