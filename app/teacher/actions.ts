"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { connectDB } from "@/lib/db";
import {
  StudentModel,
  ReportModel,
  type TemplateKey,
  type ReportStatus,
} from "@/lib/models";
import { getTemplate, getFields, type ReportData } from "@/lib/reports";
import { getRequestContext } from "@/lib/auth/context";

const inputSchema = z.object({
  studentId: z.string().min(1),
  termId: z.string().min(1),
  template: z.enum(["hifz", "islamic"]),
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
  template: ReturnType<typeof getTemplate>,
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
  const { studentId, termId, template, status, data } = parsed.data;

  const { teacher, isAdmin } = await getRequestContext();
  if (!isAdmin && !teacher) {
    return { ok: false, errors: ["Not authorised."] };
  }

  await connectDB();
  const student = await StudentModel.findById(studentId).lean();
  if (!student) return { ok: false, errors: ["Student not found."] };
  if (!isAdmin && teacher && String(student.teacher) !== String(teacher._id)) {
    return { ok: false, errors: ["This student is not assigned to you."] };
  }

  const tmpl = getTemplate(template as TemplateKey);
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
    { student: studentId, term: termId, template },
    {
      student: studentId,
      term: termId,
      template,
      teacher: isAdmin ? student.teacher : teacher!._id,
      status,
      data: clean,
      comments: typeof clean.remarks === "string" ? clean.remarks : "",
      publishedAt: status === "published" ? new Date() : null,
    },
    { upsert: true, new: true, setDefaultsOnInsert: true },
  );

  revalidatePath(`/teacher/students/${studentId}`);
  revalidatePath(`/teacher/students/${studentId}/edit`);

  return {
    ok: true,
    id: String(report._id),
    status: report.status,
  };
}
