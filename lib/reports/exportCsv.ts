import { stringify } from "csv-stringify/sync";
import { connectDB } from "@/lib/db";
import {
  ReportModel,
  StudentModel,
  TermModel,
  type ReportType,
  type StudentType,
  type TermType,
} from "@/lib/models";
import {
  buildReportTemplate,
  markFieldId,
  remarksFieldId,
  computeResult,
  type ReportData,
  type SubjectRef,
} from "@/lib/reports";

const FIXED_COLUMNS = [
  "studentName",
  "grade",
  "term",
  "academicYear",
  "subject",
  "status",
  "mark",
  "remarks",
  "overallPercent",
  "gradeLetter",
  "publishedAt",
] as const;

/** Resolve a student's assigned subjects into {id, name} refs. */
function subjectRefsOf(student: StudentType | null): SubjectRef[] {
  if (!student) return [];
  return (student.subjects ?? []).map((entry) => {
    const sub = entry.subject as
      | { _id?: unknown; name?: string }
      | string
      | null
      | undefined;
    if (sub && typeof sub === "object" && "_id" in sub) {
      return { id: String(sub._id), name: sub.name ?? "Subject" };
    }
    return { id: String(sub), name: "Subject" };
  });
}

/**
 * Build a flattened CSV of every report. Each report is one student + term
 * holding all subjects, so we emit one row per subject. Returns the CSV as a
 * string so both the CLI script and the admin API route can use it.
 */
export async function buildReportsCsv(): Promise<string> {
  await connectDB();

  const [reports, terms] = await Promise.all([
    ReportModel.find()
      .populate({
        path: "student",
        populate: { path: "subjects.subject" },
      })
      .populate("term")
      .sort({ createdAt: -1 })
      .lean<ReportType[]>(),
    TermModel.find().lean<TermType[]>(),
  ]);

  const termMap = new Map(terms.map((t) => [String(t._id), t]));

  const rows: Record<string, string>[] = [];
  for (const r of reports) {
    const student = r.student as unknown as StudentType | null;
    if (!student) continue;

    const term = termMap.get(String(r.term));
    const data = (r.data ?? {}) as Record<string, string | number>;
    const subjectRefs = subjectRefsOf(student);
    const template = buildReportTemplate(student.programme, subjectRefs);
    const result = computeResult(template, data);
    const overall = String(result.percent ?? "");
    const gradeLetter = result.grade;
    const publishedAt = r.publishedAt
      ? new Date(r.publishedAt).toISOString()
      : "";

    for (const s of subjectRefs) {
      const mark = data[markFieldId(s.id)];
      const remark = data[remarksFieldId(s.id)];
      rows.push({
        studentName: student.name ?? "",
        grade: student.grade ?? "",
        term: term?.name ?? "",
        academicYear: term?.academicYear ?? "",
        subject: s.name,
        status: r.status,
        mark: mark === undefined || mark === null ? "" : String(mark),
        remarks: typeof remark === "string" ? remark : "",
        overallPercent: overall,
        gradeLetter,
        publishedAt,
      });
    }
  }

  return stringify(rows, { header: true, columns: FIXED_COLUMNS });
}
