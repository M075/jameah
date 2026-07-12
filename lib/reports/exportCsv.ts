import { stringify } from "csv-stringify/sync";
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
} from "@/lib/models";
import {
  reportTemplates,
  getFields,
  computeResult,
  type ReportData,
} from "@/lib/reports";

const FIXED_COLUMNS = [
  "studentCode",
  "studentName",
  "grade",
  "term",
  "academicYear",
  "template",
  "status",
  "overallPercent",
  "gradeLetter",
  "publishedAt",
] as const;

/**
 * Build a flattened CSV of every report. Fixed columns come first, followed by
 * one column per report-field id (union across all templates), then remarks.
 * Returns the CSV as a string so both the CLI script and the admin API route
 * can use it.
 */
export async function buildReportsCsv(): Promise<string> {
  await connectDB();

  const [reports, students, terms, teachers] = await Promise.all([
    ReportModel.find().sort({ createdAt: -1 }).lean<ReportType[]>(),
    StudentModel.find().lean<StudentType[]>(),
    TermModel.find().lean<TermType[]>(),
    TeacherModel.find().lean<TeacherType[]>(),
  ]);

  const studentMap = new Map(students.map((s) => [String(s._id), s]));
  const termMap = new Map(terms.map((t) => [String(t._id), t]));

  // Union of all template field ids, in declaration order.
  const fieldIds = Array.from(
    new Set(reportTemplates.flatMap((t) => getFields(t).map((f) => f.id))),
  );

  const header = [...FIXED_COLUMNS, ...fieldIds, "remarks"];

  const rows = reports.map((r) => {
    const student = studentMap.get(String(r.student));
    const term = termMap.get(String(r.term));
    const template = reportTemplates.find((t) => t.key === r.template)!;
    const result = computeResult(template, (r.data ?? {}) as ReportData);
    const data = (r.data ?? {}) as Record<string, string | number>;

    const row: Record<string, string | number> = {
      studentCode: student?.studentCode ?? "",
      studentName: student?.name ?? "",
      grade: student?.grade ?? "",
      term: term?.name ?? "",
      academicYear: term?.academicYear ?? "",
      template: r.template,
      status: r.status,
      overallPercent: result.percent ?? "",
      gradeLetter: result.grade,
      publishedAt: r.publishedAt ? new Date(r.publishedAt).toISOString() : "",
    };
    for (const id of fieldIds) row[id] = data[id] ?? "";
    row.remarks = typeof data.remarks === "string" ? data.remarks : "";
    return row;
  });

  return stringify(rows, { header: true, columns: header });
}
