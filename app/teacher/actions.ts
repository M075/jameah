"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { connectDB } from "@/lib/db";
import {
  StudentModel,
  ReportModel,
  SubjectModel,
  type ReportStatus,
  type StudentType,
} from "@/lib/models";
import { buildReportTemplate, getFields, type ReportData } from "@/lib/reports";
import { getRequestContext } from "@/lib/auth/context";

const inputSchema = z.object({
  studentId: z.string().min(1),
  termId: z.string().min(1),
  subjectId: z.string().min(1),
  status: z.enum(["draft", "published"]),
  data: z.record(z.string(), z.union([z.string(), z.number()])),
});

export interface SaveResult {
  ok: boolean;
  id?: string;
  status?: ReportStatus;
  errors?: string[];
}

/** Validate report data against the template; required when publishing. */
function validate(
  template: ReturnType<typeof buildReportTemplate>,
  data: ReportData,
  status: ReportStatus,
): string[] {
  const errors: string[] = [];
  for (const f of getFields(template)) {
    const v = data[f.id];
    if (f.type === "score") {
      if (v === "" || v === undefined || v === null) {
        if (status === "published") errors.push(`${f.label} is required.`);
        continue;
      }
      const n = Number(v);
      const max = f.max ?? 100;
      if (!Number.isFinite(n) || n < 0 || n > max) {
        errors.push(`${f.label} must be between 0 and ${max}.`);
      }
    } else if (f.type === "grade") {
      if (!v) {
        if (status === "published") errors.push(`${f.label} is required.`);
        continue;
      }
      if (!f.options?.some((o) => o.value === v)) {
        errors.push(`${f.label} has an invalid value.`);
      }
    }
  }
  return errors;
}

export async function saveReport(
  raw: z.input<typeof inputSchema>,
): Promise<SaveResult> {
  const parsed = inputSchema.safeParse(raw);
  if (!parsed.success) {
    return { ok: false, errors: ["Invalid input."] };
  }
  const { studentId, termId, subjectId, status, data } = parsed.data;

  const { teacher, isAdmin } = await getRequestContext();
  if (!isAdmin && !teacher) {
    return { ok: false, errors: ["Not authorised."] };
  }

  await connectDB();
  const student = await StudentModel.findById(studentId).lean<StudentType>();
  if (!student) return { ok: false, errors: ["Student not found."] };

  // Find the subject assignment for this student; it carries the teacher.
  const assignment = (student.subjects ?? []).find(
    (s) => String(s.subject) === subjectId,
  );
  if (!assignment) {
    return { ok: false, errors: ["This subject is not assigned to the student."] };
  }
  if (!isAdmin && teacher && String(assignment.teacher) !== String(teacher._id)) {
    return { ok: false, errors: ["This subject is not assigned to you."] };
  }

  const subjectDoc = await SubjectModel.findById(subjectId).lean();
  if (!subjectDoc) return { ok: false, errors: ["Subject not found."] };

  const tmpl = buildReportTemplate(subjectDoc.type, [
    { id: String(subjectDoc._id), name: subjectDoc.name },
  ]);
  const errors = validate(tmpl, data as ReportData, status);
  if (errors.length) return { ok: false, errors };

  // Drop empty score/grade values so partial drafts don't store junk.
  const clean: ReportData = {};
  for (const f of getFields(tmpl)) {
    const v = data[f.id];
    if (f.type === "text") {
      clean[f.id] = typeof v === "string" ? v : "";
    } else if (v !== "" && v !== undefined && v !== null) {
      clean[f.id] = v;
    }
  }

  const report = await ReportModel.findOneAndUpdate(
    { student: studentId, term: termId, subject: subjectId },
    {
      student: studentId,
      term: termId,
      subject: subjectId,
      teacher: assignment.teacher,
      status,
      data: clean,
      comments: typeof clean.remarks === "string" ? clean.remarks : "",
      publishedAt: status === "published" ? new Date() : null,
    },
    { upsert: true, new: true, setDefaultsOnInsert: true },
  );

  revalidatePath(`/teacher/students/${studentId}`);
  revalidatePath(`/teacher/students/${studentId}/edit`);
  revalidatePath(`/admin/students/${studentId}`);
  revalidatePath(`/admin/students/${studentId}/marks`);
  revalidatePath(`/admin/reports`);

  return {
    ok: true,
    id: String(report._id),
    status: report.status,
  };
}
