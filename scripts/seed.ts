/**
 * Idempotent seed script. Run with:  npx tsx scripts/seed.ts
 * (or `npm run seed`). Creates an admin, teachers, students, a term, and a
 * few sample reports so the app is usable immediately after a fresh DB.
 *
 * Uses relative imports so it runs under `tsx` without path-alias resolution.
 */
import bcrypt from "bcryptjs";
import { loadEnv } from "./loadEnv";
import { connectDB } from "../lib/db";
import {
  UserModel,
  TeacherModel,
  StudentModel,
  TermModel,
  ReportModel,
  type Role,
} from "../lib/models";
import { reportTemplates, getFields, type ReportData } from "../lib/reports";

const DEFAULT_PASSWORD = "Password123!";

async function hash(pw: string) {
  return bcrypt.hash(pw, 10);
}

async function main() {
  loadEnv();
  await connectDB();

  // --- Term ---------------------------------------------------------------
  const term = await TermModel.findOneAndUpdate(
    { name: "Term 1", academicYear: "1447H" },
    {
      name: "Term 1",
      academicYear: "1447H",
      startDate: new Date("2026-01-05"),
      endDate: new Date("2026-04-10"),
      active: true,
    },
    { upsert: true, new: true, setDefaultsOnInsert: true },
  );
  console.log(`Term: ${term.name} ${term.academicYear}`);

  // --- Teachers -----------------------------------------------------------
  const teacherDefs = [
    {
      teacherCode: "T-HIFZ-01",
      name: "Ustadh Abdur Rahman",
      email: "hifz@jameah.edu",
      subjects: ["hifz", "islamic"],
    },
    {
      teacherCode: "T-ISL-01",
      name: "Ustadha Fatima",
      email: "islamic@jameah.edu",
      subjects: ["islamic"],
    },
  ];

  const teacherIds: Record<string, string> = {};
  for (const t of teacherDefs) {
    const teacher = await TeacherModel.findOneAndUpdate(
      { teacherCode: t.teacherCode },
      { teacherCode: t.teacherCode, name: t.name, subjects: t.subjects },
      { upsert: true, new: true, setDefaultsOnInsert: true },
    );
    teacherIds[t.teacherCode] = teacher._id.toString();

    const pw = await hash(DEFAULT_PASSWORD);
    const teacherUser = await UserModel.findOneAndUpdate(
      { email: t.email },
      {
        name: t.name,
        email: t.email,
        passwordHash: pw,
        role: "teacher" as Role,
        teacherId: teacher._id,
        studentId: null,
      },
      { upsert: true, new: true, setDefaultsOnInsert: true },
    );
    // Link back: set the profile's userId so dashboards can find it.
    await TeacherModel.findByIdAndUpdate(teacher._id, {
      userId: teacherUser._id,
    });
    console.log(`Teacher + login: ${t.name} <${t.email}>`);
  }

  // --- Admin --------------------------------------------------------------
  const adminPw = await hash(DEFAULT_PASSWORD);
  await UserModel.findOneAndUpdate(
    { email: "admin@jameah.edu" },
    {
      name: "Administrator",
      email: "admin@jameah.edu",
      passwordHash: adminPw,
      role: "admin" as Role,
      teacherId: null,
      studentId: null,
    },
    { upsert: true, new: true, setDefaultsOnInsert: true },
  );
  console.log("Admin login: admin@jameah.edu");

  // --- Students -----------------------------------------------------------
  // [code, name, grade, assignedTeacherCode, withLogin]
  const studentDefs: [
    string,
    string,
    string,
    string,
    boolean,
  ][] = [
    ["S-001", "Yusuf Khan", "Hifz Year 1", "T-HIFZ-01", true],
    ["S-002", "Maryam Ali", "Hifz Year 1", "T-HIFZ-01", false],
    ["S-003", "Ibrahim Hassan", "Hifz Year 2", "T-HIFZ-01", false],
    ["S-004", "Aisha Rahman", "Alim Year 1", "T-ISL-01", true],
    ["S-005", "Omar Farooq", "Alim Year 1", "T-ISL-01", false],
    ["S-006", "Fatima Noor", "Alim Year 2", "T-ISL-01", false],
  ];

  const studentIds: Record<string, string> = {};
  for (const [code, name, grade, tCode, withLogin] of studentDefs) {
    const student = await StudentModel.findOneAndUpdate(
      { studentCode: code },
      {
        studentCode: code,
        name,
        grade,
        teacher: teacherIds[tCode],
        active: true,
      },
      { upsert: true, new: true, setDefaultsOnInsert: true },
    );
    studentIds[code] = student._id.toString();

    if (withLogin) {
      const email = `${code.toLowerCase()}@jameah.edu`;
      const pw = await hash(DEFAULT_PASSWORD);
      const studentUser = await UserModel.findOneAndUpdate(
        { email },
        {
          name,
          email,
          passwordHash: pw,
          role: "student" as Role,
          studentId: student._id,
          teacherId: null,
        },
        { upsert: true, new: true, setDefaultsOnInsert: true },
      );
      // Link back: set the profile's userId so dashboards can find it.
      await StudentModel.findByIdAndUpdate(student._id, {
        userId: studentUser._id,
      });
      console.log(`Student + login: ${name} <${email}>`);
    } else {
      console.log(`Student: ${name} (${code})`);
    }
  }

  // --- Sample reports -----------------------------------------------------
  // Give the two students with logins a published report so the student view
  // and PDF download are testable immediately.
  const sampleStudents = ["S-001", "S-004"];
  for (const code of sampleStudents) {
    const templateKey = code === "S-001" ? "hifz" : "islamic";
    const template = reportTemplates.find((t) => t.key === templateKey)!;
    const data: ReportData = {};
    for (const f of getFields(template)) {
      if (f.type === "score") {
        const max = f.max ?? 100;
        data[f.id] = Math.round(max * 0.82);
      } else if (f.type === "grade") {
        data[f.id] = "good";
      } else {
        data[f.id] = "A consistent and diligent student. Keep up the good work.";
      }
    }

    await ReportModel.findOneAndUpdate(
      {
        student: studentIds[code],
        term: term._id,
        template: templateKey,
      },
      {
        student: studentIds[code],
        term: term._id,
        template: templateKey,
        teacher: teacherIds[code === "S-001" ? "T-HIFZ-01" : "T-ISL-01"],
        status: "published",
        data,
        comments: data.remarks as string,
        publishedAt: new Date(),
      },
      { upsert: true, new: true, setDefaultsOnInsert: true },
    );
    console.log(`Sample report (published): ${code} / ${template.label}`);
  }

  console.log("\nSeed complete.");
  console.log(`Default password for all accounts: ${DEFAULT_PASSWORD}`);
  console.log("Logins:");
  console.log("  admin@jameah.edu");
  console.log("  hifz@jameah.edu");
  console.log("  islamic@jameah.edu");
  console.log("  s-001@jameah.edu");
  console.log("  s-004@jameah.edu");
}

main()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error(err);
    process.exit(1);
  });
