"use server";

import type { Types } from "mongoose";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { headers } from "next/headers";
import { z } from "zod";
import bcrypt from "bcryptjs";
import { connectDB } from "@/lib/db";
import {
  StudentModel,
  TeacherModel,
  UserModel,
  SubjectModel,
  ReportModel,
  TermModel,
  PROGRAMMES,
  type Role,
  type ProgrammeKey,
  type SubjectType,
} from "@/lib/models";
import { getRequestContext } from "@/lib/auth/context";
import { signMagicToken } from "@/lib/auth/magicToken";
import { sendLoginEmail } from "@/lib/email/sendEmail";

export interface AdminActionState {
  ok?: boolean;
  id?: string;
  errors?: string[];
}

const EMAIL_RE = /^[^@\s]+@[^@\s]+\.[^@\s]+$/;

/** Generate a unique sequential student code, e.g. "S-0102". */
async function generateStudentCode(): Promise<string> {
  const count = await StudentModel.countDocuments();
  let n = count + 1;
  for (;;) {
    const candidate = `S-${String(n).padStart(4, "0")}`;
    if (!(await StudentModel.findOne({ studentCode: candidate }))) {
      return candidate;
    }
    n += 1;
  }
}

/** Resolve the public origin (scheme + host) so magic-link emails point here. */
async function getOrigin(): Promise<string> {
  const h = await headers();
  const host = h.get("x-forwarded-host") ?? h.get("host") ?? "localhost:3000";
  const proto =
    h.get("x-forwarded-proto") ?? (host.startsWith("localhost") ? "http" : "https");
  return `${proto}://${host}`;
}

/**
 * Build a signed magic-link token for `userId` and email it. Failures are
 * logged, never thrown, so creating the account always succeeds even if the
 * mail provider is misconfigured.
 */
async function sendMagicLoginEmail(
  email: string,
  name: string,
  userId: string,
  role: Role,
): Promise<void> {
  try {
    const token = await signMagicToken({ sub: userId, email, role });
    const url = `${await getOrigin()}/login/magic?token=${encodeURIComponent(token)}`;
    await sendLoginEmail({ to: email, name, url });
  } catch (err) {
    console.error("Failed to send magic login email:", err);
  }
}

/**
 * Recompute a student's subject list from their programme + year. Aalim
 * students in year N are auto-assigned every Aalim subject for that year,
 * each carrying that subject's teacher (so teacher dashboards populate).
 * Hifz students (or any student with no year) get an empty list — Hifz
 * has no subjects.
 */
async function assignSubjectsForYear(studentId: string): Promise<void> {
  const student = await StudentModel.findById(studentId);
  if (!student) return;

  if (student.programme !== "aalim" || !student.year) {
    student.subjects = [];
  } else {
    const subs = await SubjectModel.find({
      type: "aalim",
      year: student.year,
    }).lean<SubjectType[]>();
    student.subjects = subs.map((s) => ({
      subject: s._id,
      teacher: s.teacher ?? null,
    }));
  }
  await student.save();
}

/**
 * Recompute subject assignments for every Aalim student in a given year.
 * Called when a subject is added to / moved between years so existing
 * students of that class immediately pick up (or drop) the subject.
 */
async function reassignStudentsInYear(year: number): Promise<void> {
  if (!Number.isInteger(year) || year < 1 || year > 6) return;
  const students = await StudentModel.find({
    programme: "aalim",
    year,
  }).select("_id");
  for (const s of students) {
    await assignSubjectsForYear(String(s._id));
  }
}

/* --------------------------------------------------------------------------
 * Subjects
 * ------------------------------------------------------------------------ */

export async function createSubject(
  _prev: AdminActionState,
  formData: FormData,
): Promise<AdminActionState> {
  const { isAdmin } = await getRequestContext();
  if (!isAdmin) return { errors: ["Not authorised."] };

  const name = String(formData.get("name") ?? "").trim();
  const type = String(formData.get("type") ?? "") as ProgrammeKey;
  const yearRaw = Number(formData.get("year"));
  const teacherId = String(formData.get("teacher") ?? "").trim();

  const errors: string[] = [];
  if (!name) errors.push("Name is required.");
  if (!PROGRAMMES.includes(type)) errors.push("Valid type is required.");
  if (
    !Number.isInteger(yearRaw) ||
    yearRaw < 1 ||
    yearRaw > 6
  ) {
    errors.push("Year must be a whole number between 1 and 6.");
  }
  if (errors.length) return { errors };

  await connectDB();
  if (
    await SubjectModel.findOne({ name, year: yearRaw, type })
  ) {
    return {
      errors: [
        `A ${type} subject named "${name}" for year ${yearRaw} already exists.`,
      ],
    };
  }

  let teacher: Types.ObjectId | null = null;
  if (teacherId) {
    const t = await TeacherModel.findById(teacherId).lean();
    if (!t) return { errors: ["Selected teacher does not exist."] };
    if (t.type !== type) {
      return {
        errors: [
          `${t.name} is a ${t.type} teacher and can't teach a ${type} subject.`,
        ],
      };
    }
    teacher = t._id;
  }

  const subject = await SubjectModel.create({
    name,
    type,
    year: yearRaw,
    teacher,
  });

  // Existing students in this class should immediately gain the new subject.
  if (type === "aalim") {
    await reassignStudentsInYear(yearRaw);
  }
  redirect(`/admin/subjects/${String(subject._id)}`);
}

export async function updateSubject(
  _prev: AdminActionState,
  formData: FormData,
): Promise<AdminActionState> {
  const { isAdmin } = await getRequestContext();
  if (!isAdmin) return { errors: ["Not authorised."] };

  const id = String(formData.get("subjectId") ?? "");
  const name = String(formData.get("name") ?? "").trim();
  const type = String(formData.get("type") ?? "") as ProgrammeKey;
  const yearRaw = Number(formData.get("year"));
  const teacherId = String(formData.get("teacher") ?? "").trim();

  const errors: string[] = [];
  if (!id) errors.push("Missing subject id.");
  if (!name) errors.push("Name is required.");
  if (!PROGRAMMES.includes(type)) errors.push("Valid type is required.");
  if (
    !Number.isInteger(yearRaw) ||
    yearRaw < 1 ||
    yearRaw > 6
  ) {
    errors.push("Year must be a whole number between 1 and 6.");
  }
  if (errors.length) return { errors };

  await connectDB();
  if (
    await SubjectModel.findOne({
      name,
      year: yearRaw,
      type,
      _id: { $ne: id },
    })
  ) {
    return {
      errors: [
        `A ${type} subject named "${name}" for year ${yearRaw} already exists.`,
      ],
    };
  }

  let teacher: Types.ObjectId | null = null;
  if (teacherId) {
    const t = await TeacherModel.findById(teacherId).lean();
    if (!t) return { errors: ["Selected teacher does not exist."] };
    if (t.type !== type) {
      return {
        errors: [
          `${t.name} is a ${t.type} teacher and can't teach a ${type} subject.`,
        ],
      };
    }
    teacher = t._id;
  }

  const existing = await SubjectModel.findById(id).lean<SubjectType>();
  const oldYear = existing?.year ?? null;

  const updated = await SubjectModel.findByIdAndUpdate(
    id,
    { name, type, year: yearRaw, teacher },
    { new: true },
  );

  // Keep student dashboards correct: anyone already assigned this subject
  // should now point at the (possibly new) teacher.
  if (updated && teacher) {
    await StudentModel.updateMany(
      { "subjects.subject": updated._id },
      { $set: { "subjects.$.teacher": teacher } },
    );
  }

  // If the year (or programme) changed, recompute assignments for the
  // affected class(es) so students gain/drop this subject appropriately.
  if (type === "aalim") {
    if (oldYear !== yearRaw) {
      if (oldYear) await reassignStudentsInYear(oldYear);
      await reassignStudentsInYear(yearRaw);
    } else if (existing && existing.type !== "aalim") {
      // Programme switched to Aalim — assign to the new year's students.
      await reassignStudentsInYear(yearRaw);
    }
  } else if (oldYear) {
    // Programme switched away from Aalim — drop it from the old year.
    await reassignStudentsInYear(oldYear);
  }

  redirect(`/admin/subjects/${id}`);
}

export async function deleteSubject(formData: FormData): Promise<void> {
  const { isAdmin } = await getRequestContext();
  if (!isAdmin) redirect("/admin/subjects");

  const id = String(formData.get("subjectId") ?? "");
  if (!id) redirect("/admin/subjects");

  await connectDB();
  // Don't delete while any student still references it.
  const usedByStudent = await StudentModel.countDocuments({
    "subjects.subject": id,
  });
  if (usedByStudent > 0) {
    redirect("/admin/subjects?error=in_use");
  }
  await SubjectModel.findByIdAndDelete(id);
  redirect("/admin/subjects");
}

/* --------------------------------------------------------------------------
 * Teachers
 * ------------------------------------------------------------------------ */

async function upsertTeacher(
  teacherId: string | null,
  formData: FormData,
): Promise<AdminActionState> {
  const { isAdmin } = await getRequestContext();
  if (!isAdmin) return { errors: ["Not authorised."] };

  const name = String(formData.get("name") ?? "").trim();
  const type = String(formData.get("type") ?? "") as ProgrammeKey;
  const subjectIds = formData
    .getAll("subjects")
    .map(String)
    .filter(Boolean);
  const createLogin = formData.get("createLogin");
  const email = String(formData.get("email") ?? "").trim();
  const password = String(formData.get("password") ?? "");

  const errors: string[] = [];
  if (!name) errors.push("Name is required.");
  if (!PROGRAMMES.includes(type)) errors.push("Valid type is required.");
  if (errors.length) return { errors };

  await connectDB();

  // Validate that every selected subject exists and matches the teacher's type.
  const subjects = await SubjectModel.find({ _id: { $in: subjectIds } }).lean();
  const validSubjectIds = subjects
    .filter((s) => s.type === type)
    .map((s) => s._id);

  if (teacherId) {
    const teacher = await TeacherModel.findByIdAndUpdate(
      teacherId,
      { name, type, subjects: validSubjectIds, active: true },
      { new: true },
    );
    if (!teacher) return { errors: ["Teacher not found."] };
  } else {
    const teacher = await TeacherModel.create({
      name,
      type,
      subjects: validSubjectIds,
      active: true,
    });
    teacherId = String(teacher._id);
  }

  if (createLogin) {
    if (!EMAIL_RE.test(email)) {
      return { errors: ["A valid email is required to create a login."] };
    }
    const lower = email.toLowerCase();

    // If this teacher already has a linked login, update it rather than
    // creating a duplicate (which would fail on the unique email index).
    const existingUser = teacherId
      ? await UserModel.findOne({ teacherId }).lean()
      : null;

    if (existingUser) {
      if (existingUser.email !== lower) {
        if (
          await UserModel.findOne({
            email: lower,
            _id: { $ne: existingUser._id },
          })
        ) {
          return { errors: [`A user with email ${lower} already exists.`] };
        }
      }
      await UserModel.findByIdAndUpdate(existingUser._id, {
        name,
        email: lower,
      });
    } else {
      if (await UserModel.findOne({ email: lower })) {
        return { errors: [`A user with email ${lower} already exists.`] };
      }
      const loginMethod = String(formData.get("loginMethod") ?? "magic");
      let user;
      if (loginMethod === "password") {
        if (password.length < 8) {
          return { errors: ["Password must be at least 8 characters."] };
        }
        user = await UserModel.create({
          name,
          email: lower,
          passwordHash: await bcrypt.hash(password, 10),
          role: "teacher" as Role,
          teacherId,
          studentId: null,
        });
      } else {
        user = await UserModel.create({
          name,
          email: lower,
          role: "teacher" as Role,
          teacherId,
          studentId: null,
        });
        await sendMagicLoginEmail(lower, name, String(user._id), "teacher");
      }
      await TeacherModel.findByIdAndUpdate(teacherId, { userId: user._id });
    }
  }

  redirect(teacherId ? `/admin/teachers/${teacherId}` : "/admin/teachers");
}

export async function createTeacher(
  _prev: AdminActionState,
  formData: FormData,
): Promise<AdminActionState> {
  return upsertTeacher(null, formData);
}

export async function updateTeacher(
  _prev: AdminActionState,
  formData: FormData,
): Promise<AdminActionState> {
  const id = String(formData.get("teacherId") ?? "");
  return upsertTeacher(id, formData);
}

/* --------------------------------------------------------------------------
 * Students
 * ------------------------------------------------------------------------ */

/** Create a student (and optionally a linked student login). Admin only. */
export async function createStudent(
  _prev: AdminActionState,
  formData: FormData,
): Promise<AdminActionState> {
  const { isAdmin } = await getRequestContext();
  if (!isAdmin) return { errors: ["Not authorised."] };

  const parsed = z
    .object({
      studentCode: z.string().trim().optional().default(""),
      name: z.string().trim().min(1, "Name is required."),
      year: z.string().trim().optional().default(""),
      programme: z.string().trim().optional().default(""),
      createLogin: z.string().optional(),
      loginMethod: z.string().optional().default("magic"),
      email: z.string().trim().optional().default(""),
      password: z.string().optional().default(""),
    })
    .safeParse(Object.fromEntries(formData));

  if (!parsed.success) {
    return { errors: parsed.error.issues.map((i) => i.message) };
  }
  const d = parsed.data;

  const yearNum = d.year ? Number(d.year) : undefined;
  const yearValid =
    yearNum !== undefined &&
    Number.isInteger(yearNum) &&
    yearNum >= 1 &&
    yearNum <= 6;

  const errors: string[] = [];
  if (!d.name) errors.push("Name is required.");
  if (!PROGRAMMES.includes(d.programme as ProgrammeKey)) {
    errors.push("Valid programme is required.");
  }
  if (d.programme === "aalim" && !yearValid) {
    errors.push("Year (1–6) is required for Aalim students.");
  }
  if (errors.length) return { errors };

  await connectDB();

  // Resolve the code: validate uniqueness if provided, else auto-generate.
  let studentCode = d.studentCode;
  if (studentCode) {
    if (await StudentModel.findOne({ studentCode })) {
      return { errors: [`Student code "${studentCode}" already exists.`] };
    }
  } else {
    studentCode = await generateStudentCode();
  }

  const grade =
    d.programme === "aalim" && yearValid ? `Year ${yearNum}` : "";
  const student = await StudentModel.create({
    studentCode,
    name: d.name,
    grade,
    programme: d.programme,
    year: d.programme === "aalim" && yearValid ? (yearNum as number) : null,
    subjects: [],
    active: true,
  });

  // Auto-assign this class's subjects (each with its teacher).
  await assignSubjectsForYear(String(student._id));

  if (d.createLogin === "on") {
    if (!EMAIL_RE.test(d.email)) {
      return { errors: ["A valid email is required to create a login."] };
    }
    const email = d.email.toLowerCase();
    if (await UserModel.findOne({ email })) {
      return { errors: [`A user with email ${email} already exists.`] };
    }
    const loginMethod = d.loginMethod === "password" ? "password" : "magic";
    let user;
    if (loginMethod === "password") {
      if (!d.password || d.password.length < 8) {
        return { errors: ["Password must be at least 8 characters."] };
      }
      user = await UserModel.create({
        name: d.name,
        email,
        passwordHash: await bcrypt.hash(d.password, 10),
        role: "student" as Role,
        studentId: student._id,
        teacherId: null,
      });
    } else {
      user = await UserModel.create({
        name: d.name,
        email,
        role: "student" as Role,
        studentId: student._id,
        teacherId: null,
      });
      await sendMagicLoginEmail(email, d.name, String(user._id), "student");
    }
    student.userId = user._id;
    await student.save();
  }

  redirect("/admin/students");
}

/* --------------------------------------------------------------------------
 * Student details update + deletion
 * ------------------------------------------------------------------------ */

export async function updateStudent(
  _prev: AdminActionState,
  formData: FormData,
): Promise<AdminActionState> {
  const { isAdmin } = await getRequestContext();
  if (!isAdmin) return { errors: ["Not authorised."] };

  const parsed = z
    .object({
      studentId: z.string().min(1, "Missing student id."),
      studentCode: z.string().trim().optional().default(""),
      name: z.string().trim().min(1, "Name is required."),
      year: z.string().trim().optional().default(""),
      programme: z.string().trim().optional().default(""),
    })
    .safeParse(Object.fromEntries(formData));

  if (!parsed.success) {
    return { errors: parsed.error.issues.map((i) => i.message) };
  }
  const d = parsed.data;

  const yearNum = d.year ? Number(d.year) : undefined;
  const yearValid =
    yearNum !== undefined &&
    Number.isInteger(yearNum) &&
    yearNum >= 1 &&
    yearNum <= 6;

  const errors: string[] = [];
  if (!PROGRAMMES.includes(d.programme as ProgrammeKey)) {
    errors.push("Valid programme is required.");
  }
  if (d.programme === "aalim" && !yearValid) {
    errors.push("Year (1–6) is required for Aalim students.");
  }
  if (errors.length) return { errors };

  await connectDB();

  if (d.studentCode) {
    const clash = await StudentModel.findOne({
      studentCode: d.studentCode,
      _id: { $ne: d.studentId },
    });
    if (clash) {
      return { errors: [`Student code "${d.studentCode}" is already in use.`] };
    }
  }

  const grade =
    d.programme === "aalim" && yearValid ? `Year ${yearNum}` : "";
  const student = await StudentModel.findByIdAndUpdate(
    d.studentId,
    {
      studentCode: d.studentCode || undefined,
      name: d.name,
      grade,
      year: d.programme === "aalim" && yearValid ? (yearNum as number) : null,
      programme: d.programme,
    },
    { new: true },
  );
  if (!student) return { errors: ["Student not found."] };

  // Recompute subject assignments (e.g. when the year changes).
  await assignSubjectsForYear(d.studentId);

  redirect(`/admin/students/${d.studentId}`);
}

export async function deleteStudent(formData: FormData): Promise<void> {
  const { isAdmin } = await getRequestContext();
  if (!isAdmin) redirect("/admin/students");

  const id = String(formData.get("studentId") ?? "");
  if (!id) redirect("/admin/students");

  await connectDB();
  const student = await StudentModel.findById(id);
  if (!student) redirect("/admin/students");

  // Remove the linked login account and this student's reports, then the
  // student record itself.
  if (student.userId) {
    await UserModel.deleteOne({ _id: student.userId });
  }
  await ReportModel.deleteMany({ student: id });
  await StudentModel.findByIdAndDelete(id);

  redirect("/admin/students");
}

/* --------------------------------------------------------------------------
 * Teacher deletion
 * ------------------------------------------------------------------------ */

export async function deleteTeacher(formData: FormData): Promise<void> {
  const { isAdmin } = await getRequestContext();
  if (!isAdmin) redirect("/admin/teachers");

  const id = String(formData.get("teacherId") ?? "");
  if (!id) redirect("/admin/teachers");

  await connectDB();
  const teacher = await TeacherModel.findById(id);
  if (!teacher) redirect("/admin/teachers");

  // Unassign this teacher from any student subject assignments (kept, not
  // deleted). Reports they authored are retained. Done in code rather than an
  // array-filter update because Mongoose can't resolve the subdocument path.
  const affected = await StudentModel.find({ "subjects.teacher": id });
  for (const student of affected) {
    let changed = false;
    for (const sub of student.subjects) {
      if (sub.teacher && String(sub.teacher) === id) {
        sub.teacher = null;
        changed = true;
      }
    }
    if (changed) await student.save();
  }

  if (teacher.userId) {
    await UserModel.deleteOne({ _id: teacher.userId });
  }

  await TeacherModel.findByIdAndDelete(id);
  redirect("/admin/teachers");
}

/* --------------------------------------------------------------------------
 * Reports deletion
 * ------------------------------------------------------------------------ */

export async function deleteReport(formData: FormData): Promise<void> {
  const { isAdmin } = await getRequestContext();
  if (!isAdmin) redirect("/admin/reports");

  const id = String(formData.get("reportId") ?? "");
  if (!id) redirect("/admin/reports");

  await connectDB();
  const report = await ReportModel.findById(id);
  if (!report) redirect("/admin/reports");

  const studentId = String(report.student);
  await ReportModel.findByIdAndDelete(id);

  revalidatePath("/admin/reports");
  revalidatePath(`/admin/students/${studentId}`);
  redirect("/admin/reports");
}

/* --------------------------------------------------------------------------
 * Terms
 * ------------------------------------------------------------------------ */

/** Parse a date-input ("YYYY-MM-DD") into a Date, or null when empty. */
function parseDate(raw: FormDataEntryValue | null): Date | null {
  const s = raw ? String(raw).trim() : "";
  if (!s) return null;
  const d = new Date(s);
  return isNaN(d.getTime()) ? null : d;
}

export async function createTerm(
  _prev: AdminActionState,
  formData: FormData,
): Promise<AdminActionState> {
  const { isAdmin } = await getRequestContext();
  if (!isAdmin) return { errors: ["Not authorised."] };

  const name = String(formData.get("name") ?? "").trim();
  const academicYear = String(formData.get("academicYear") ?? "").trim();
  const active = formData.get("active") === "on";

  if (!name) return { errors: ["Name is required."] };

  await connectDB();
  // Active is exclusive: clearing it from every other term first.
  if (active) {
    await TermModel.updateMany({}, { active: false });
  }
  const term = await TermModel.create({
    name,
    academicYear,
    startDate: parseDate(formData.get("startDate")),
    endDate: parseDate(formData.get("endDate")),
    active,
  });
  revalidatePath("/admin/terms");
  redirect(`/admin/terms/${String(term._id)}`);
}

export async function updateTerm(
  _prev: AdminActionState,
  formData: FormData,
): Promise<AdminActionState> {
  const { isAdmin } = await getRequestContext();
  if (!isAdmin) return { errors: ["Not authorised."] };

  const id = String(formData.get("termId") ?? "");
  const name = String(formData.get("name") ?? "").trim();
  const academicYear = String(formData.get("academicYear") ?? "").trim();
  const active = formData.get("active") === "on";

  if (!id) return { errors: ["Missing term id."] };
  if (!name) return { errors: ["Name is required."] };

  await connectDB();
  if (active) {
    await TermModel.updateMany({ _id: { $ne: id } }, { active: false });
  }
  await TermModel.findByIdAndUpdate(id, {
    name,
    academicYear,
    startDate: parseDate(formData.get("startDate")),
    endDate: parseDate(formData.get("endDate")),
    active,
  });
  revalidatePath("/admin/terms");
  redirect(`/admin/terms/${id}`);
}

export async function deleteTerm(formData: FormData): Promise<void> {
  const { isAdmin } = await getRequestContext();
  if (!isAdmin) redirect("/admin/terms");

  const id = String(formData.get("termId") ?? "");
  if (!id) redirect("/admin/terms");

  await connectDB();
  await TermModel.findByIdAndDelete(id);
  redirect("/admin/terms");
}

/** Make a single term active and clear the flag on all others. */
export async function setActiveTerm(formData: FormData): Promise<void> {
  const { isAdmin } = await getRequestContext();
  if (!isAdmin) redirect("/admin/terms");

  const id = String(formData.get("termId") ?? "");
  if (!id) redirect("/admin/terms");

  await connectDB();
  await TermModel.updateMany({}, { active: false });
  await TermModel.findByIdAndUpdate(id, { active: true });
  revalidatePath("/admin/terms");
  redirect("/admin/terms");
}

