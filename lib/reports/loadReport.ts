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
  type ProgrammeKey,
} from "@/lib/models";
import {
  buildReportTemplate,
  computeResult,
  type ReportData,
  type ReportResult,
  type ReportTemplate,
  type SubjectRef,
} from "@/lib/reports";

/** A resolved subject reference used for rendering the consolidated report. */
export interface SubjectEntry {
  id: string;
  name: string;
  /** Name of the teacher assigned to this subject (populated), if any. */
  teacher?: string;
}

export interface ReportContext {
  report: ReportType;
  student: StudentType | null;
  term: TermType | null;
  teacher: TeacherType | null;
  programme: ProgrammeKey;
  /** Every subject assigned to the student (drives the per-subject layout). */
  subjects: SubjectEntry[];
  template: ReportTemplate;
  result: ReportResult;
  data: ReportData;
}

/**
 * Resolve a student's `subjects` sub-documents into {id, name, teacher} entries.
 * Keeping this in one place means the HTML view and the PDF render from the
 * exact same subject list (including the teacher name).
 */
function resolveSubjects(student: StudentType | null): SubjectEntry[] {
  if (!student) return [];
  return (student.subjects ?? []).map((entry) => {
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
    const teach = entry.teacher as
      | { name?: string }
      | string
      | null
      | undefined;
    const teacherName =
      teach && typeof teach === "object" && "name" in teach
        ? (teach.name ?? undefined)
        : undefined;
    return { id, name, teacher: teacherName };
  });
}

/**
 * Load a report together with its student, term, teacher, plus the derived
 * template and computed result. The report is one document per student + term
 * and holds every assigned subject; the template and subject list are built
 * from all of the student's assigned subjects. Shared by the HTML view and the
 * PDF route so both render from one source of truth.
 */
export async function loadReportContext(
  reportId: string,
): Promise<ReportContext | null> {
  await connectDB();
  const report = await ReportModel.findById(reportId).lean<ReportType>();
  if (!report) return null;

  const [student, term, teacher] = await Promise.all([
    StudentModel.findById(report.student)
      .populate("subjects.subject")
      .populate("subjects.teacher")
      .lean<StudentType>(),
    TermModel.findById(report.term).lean<TermType>(),
    TeacherModel.findById(report.teacher).lean<TeacherType>(),
  ]);

  const programme = (student?.programme ?? "aalim") as ProgrammeKey;
  const subjects = resolveSubjects(student);
  const subjectRefs: SubjectRef[] = subjects;
  const template = buildReportTemplate(programme, subjectRefs);
  const data = (report.data ?? {}) as ReportData;
  const result = computeResult(template, data);

  return {
    report,
    student,
    term,
    teacher,
    programme,
    subjects,
    template,
    result,
    data,
  };
}
