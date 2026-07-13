import { stringify } from "csv-stringify/sync";
import { connectDB } from "@/lib/db";
import {
  ReportModel,
  StudentModel,
  TermModel,
  SubjectModel,
  type ReportType,
  type StudentType,
  type TermType,
  type SubjectType,
} from "@/lib/models";
import {
  buildReportTemplate,
  markFieldId,
  conductFieldId,
  computeResult,
  gradeOption,
  type ReportData,
} from "@/lib/reports";

const FIXED_COLUMNS = [
  "studentCode",
  "studentName",
  "grade",
  "term",
  "academicYear",
  "subject",
  "status",
  "mark",
  "conduct",
  "overallPercent",
  "gradeLetter",
  "publishedAt",
  "remarks",
] as const;

/**
 * Build a flattened CSV of every report. With one report per student + term +
 * subject, each row is one subject. Returns the CSV as a string so both the
 * CLI script and the admin API route can use it.
 */
export async function buildReportsCsv(): Promise<string> {
  await connectDB();

  const [reports, students, terms, subjects] = await Promise.all([
    ReportModel.find().sort({ createdAt: -1 }).lean<ReportType[]>(),
    StudentModel.find().lean<StudentType[]>(),
    TermModel.find().lean<TermType[]>(),
    SubjectModel.find().lean<SubjectType[]>(),
  ]);

  const studentMap = new Map(students.map((s) => [String(s._id), s]));
  const termMap = new Map(terms.map((t) => [String(t._id), t]));
  const subjectMap = new Map(subjects.map((s) => [String(s._id), s]));

  const rows = reports.map((r) => {
    const student = studentMap.get(String(r.student));
    const term = termMap.get(String(r.term));
    const subject = subjectMap.get(String(r.subject));
    const data = (r.data ?? {}) as Record<string, string | number>;

    let mark = "";
    let conduct = "";
    let overall = "";
    let gradeLetter = "";
    if (subject) {
      const template = buildReportTemplate(subject.type, [
        { id: String(subject._id), name: subject.name },
      ]);
      const result = computeResult(template, data as ReportData);
      const markId = markFieldId(String(subject._id));
      const conductId = conductFieldId(String(subject._id));
      mark = String(data[markId] ?? "");
      const conductVal = String(data[conductId] ?? "");
      conduct = gradeOption(conductVal)?.label ?? conductVal;
      overall = String(result.percent ?? "");
      gradeLetter = result.grade;
    }

    return {
      studentCode: student?.studentCode ?? "",
      studentName: student?.name ?? "",
      grade: student?.grade ?? "",
      term: term?.name ?? "",
      academicYear: term?.academicYear ?? "",
      subject: subject?.name ?? "",
      status: r.status,
      mark,
      conduct,
      overallPercent: overall,
      gradeLetter,
      publishedAt: r.publishedAt ? new Date(r.publishedAt).toISOString() : "",
      remarks:
        typeof r.comments === "string" && r.comments ? r.comments : "",
    };
  });

  return stringify(rows, { header: true, columns: FIXED_COLUMNS });
}
