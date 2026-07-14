"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { connectDB } from "@/lib/db";
import {
  StudentModel,
  ReportModel,
  type ReportStatus,
  type ReportType,
  type StudentType,
} from "@/lib/models";
import {
  buildReportTemplate,
  getFields,
  type ReportData,
  type SubjectRef,
} from "@/lib/reports";
import { getRequestContext } from "@/lib/auth/context";

const inputSchema = z.object({
  studentId: z.string().min(1),
  termId: z.string().min(1),
  status: z.enum(["draft", "published"]),
  data: z.record(z.string(), z.union([z.string(), z.number()])),
});

export interface SaveResult {
  ok: boolean;
  id?: string;
  status?: ReportStatus;
  errors?: string[];
}

/** Resolve a student's assigned subjects into {id, name} refs. */
function subjectRefsOf(student: StudentType): SubjectRef[] {
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
 * Persist a mark entry for a student + term. The whole term report is one
 * document; each call merges the submitted subjects' marks + remarks into the
 * existing data so teachers contributing different subjects don't clobber one
 * another. Validation only runs over the keys the caller actually submitted.
 */
export async function saveReport(
  raw: z.input<typeof inputSchema>,
): Promise<SaveResult> {
  const parsed = inputSchema.safeParse(raw);
  if (!parsed.success) {
    return { ok: false, errors: ["Invalid input."] };
  }
  const { studentId, termId, status, data } = parsed.data;

  const { teacher, isAdmin } = await getRequestContext();
  if (!isAdmin && !teacher) {
    return { ok: false, errors: ["Not authorised."] };
  }

  await connectDB();
  const student = await StudentModel.findById(studentId)
    .populate("subjects.subject")
    .lean<StudentType>();
  if (!student) return { ok: false, errors: ["Student not found."] };

  // Subjects this caller is allowed to edit for this student.
  const editable = (student.subjects ?? []).filter(
    (s) =>
      isAdmin ||
      (teacher && String(s.teacher) === String(teacher._id)),
  );
  if (editable.length === 0) {
    return { ok: false, errors: ["No subjects are assigned to you."] };
  }

  // `subjects.subject` is populated above, so each entry's `.subject` is a
  // document — extract its _id (matching how the form builds field ids).
  const subjectIdOf = (entry: { subject: unknown }): string => {
    const sub = entry.subject as
      | { _id?: unknown }
      | string
      | null
      | undefined;
    if (sub && typeof sub === "object" && "_id" in sub) {
      return String(sub._id);
    }
    return String(sub);
  };
  const editableIds = new Set(editable.map((s) => subjectIdOf(s)));
  const tmpl = buildReportTemplate(student.programme, subjectRefsOf(student));

  // Validate only the keys the caller submitted (their subjects).
  const errors: string[] = [];
  for (const f of getFields(tmpl)) {
    if (!(f.id in data)) continue;
    if (!editableIds.has(f.id.replace(/__(mark|remarks)$/, ""))) {
      continue; // not this caller's subject — leave it untouched
    }
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
    }
  }
  if (errors.length) return { ok: false, errors };

  // Build the submitted slice, dropping empty marks so drafts stay clean.
  // Empty remarks are kept (set to "") so clearing a remark is persisted.
  const slice: ReportData = {};
  for (const f of getFields(tmpl)) {
    if (!(f.id in data)) continue;
    if (!editableIds.has(f.id.replace(/__(mark|remarks)$/, ""))) continue;
    const v = data[f.id];
    if (f.type === "score") {
      slice[f.id] =
        v === "" || v === undefined || v === null ? "" : Number(v);
    } else {
      slice[f.id] = typeof v === "string" ? v : "";
    }
  }

  // Merge into the existing report so other teachers' subjects survive.
  const existing = await ReportModel.findOne({
    student: studentId,
    term: termId,
  }).lean<ReportType>();
  const base = (existing?.data ?? {}) as ReportData;
  const merged: ReportData = { ...base, ...slice };

  const report = await ReportModel.findOneAndUpdate(
    { student: studentId, term: termId },
    {
      student: studentId,
      term: termId,
      teacher: isAdmin ? (existing?.teacher ?? null) : teacher!._id,
      status,
      data: merged,
      publishedAt:
        status === "published"
          ? existing?.publishedAt ?? new Date()
          : null,
    },
    { upsert: true, new: true, setDefaultsOnInsert: true },
  );

  revalidatePath(`/teacher/students/${studentId}`);
  revalidatePath(`/teacher/students/${studentId}/edit`);
  revalidatePath(`/admin/students/${studentId}`);
  revalidatePath(`/admin/students/${studentId}/marks`);
  revalidatePath(`/admin/reports`);
  revalidatePath(`/student/reports/${report._id}`);
  revalidatePath(`/student`);

  return {
    ok: true,
    id: String(report._id),
    status: report.status,
  };
}
