"use server";

import { redirect } from "next/navigation";
import { z } from "zod";
import bcrypt from "bcryptjs";
import { connectDB } from "@/lib/db";
import {
  StudentModel,
  TeacherModel,
  UserModel,
  type Role,
} from "@/lib/models";
import { getRequestContext } from "@/lib/auth/context";

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
      grade: z.string().trim().optional().default(""),
      section: z.string().trim().optional().default(""),
      teacherId: z.string().optional().default(""),
      createLogin: z.string().optional(),
      email: z.string().trim().optional().default(""),
      password: z.string().optional().default(""),
    })
    .safeParse(Object.fromEntries(formData));

  if (!parsed.success) {
    return { errors: parsed.error.issues.map((i) => i.message) };
  }
  const d = parsed.data;

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

  const student = await StudentModel.create({
    studentCode,
    name: d.name,
    grade: d.grade,
    section: d.section,
    teacher: d.teacherId || null,
    active: true,
  });

  if (d.createLogin === "on") {
    if (!EMAIL_RE.test(d.email)) {
      return { errors: ["A valid email is required to create a login."] };
    }
    if (!d.password || d.password.length < 8) {
      return { errors: ["Password must be at least 8 characters."] };
    }
    const email = d.email.toLowerCase();
    if (await UserModel.findOne({ email })) {
      return { errors: [`A user with email ${email} already exists.`] };
    }
    const passwordHash = await bcrypt.hash(d.password, 10);
    const user = await UserModel.create({
      name: d.name,
      email,
      passwordHash,
      role: "student" as Role,
      studentId: student._id,
      teacherId: null,
    });
    student.userId = user._id;
    await student.save();
  }

  redirect("/admin/students");
}

/** Create a teacher (and optionally a linked teacher login). Admin only. */
export async function createTeacher(
  _prev: AdminActionState,
  formData: FormData,
): Promise<AdminActionState> {
  const { isAdmin } = await getRequestContext();
  if (!isAdmin) return { errors: ["Not authorised."] };

  const teacherCode = String(formData.get("teacherCode") ?? "").trim();
  const name = String(formData.get("name") ?? "").trim();
  const subjects = formData
    .getAll("subjects")
    .map(String)
    .filter((s) => s === "hifz" || s === "islamic");
  const createLogin = formData.get("createLogin");
  const email = String(formData.get("email") ?? "").trim();
  const password = String(formData.get("password") ?? "");

  const errors: string[] = [];
  if (!teacherCode) errors.push("Teacher code is required.");
  if (!name) errors.push("Name is required.");
  if (errors.length) return { errors };

  await connectDB();
  if (await TeacherModel.findOne({ teacherCode })) {
    return { errors: [`Teacher code "${teacherCode}" already exists.`] };
  }

  const teacher = await TeacherModel.create({
    teacherCode,
    name,
    subjects,
    active: true,
  });

  if (createLogin) {
    if (!EMAIL_RE.test(email)) {
      return { errors: ["A valid email is required to create a login."] };
    }
    if (password.length < 8) {
      return { errors: ["Password must be at least 8 characters."] };
    }
    const lower = email.toLowerCase();
    if (await UserModel.findOne({ email: lower })) {
      return { errors: [`A user with email ${lower} already exists.`] };
    }
    const passwordHash = await bcrypt.hash(password, 10);
    const user = await UserModel.create({
      name,
      email: lower,
      passwordHash,
      role: "teacher" as Role,
      teacherId: teacher._id,
      studentId: null,
    });
    teacher.userId = user._id;
    await teacher.save();
  }

  redirect("/admin/teachers");
}
