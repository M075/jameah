/**
 * Idempotent seed script. Run with:  npx tsx scripts/seed.ts
 * (or `npm run seed`). Creates an admin, teachers, students, subjects,
 * a term, and a few sample per-subject reports so the app is usable
 * immediately after a fresh DB.
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
  SubjectModel,
  ReportModel,
  PROGRAMMES,
  type Role,
  type ProgrammeKey,
} from "../lib/models";

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

  // --- Subjects ------------------------------------------------------------
  const subjectDefs: [string, ProgrammeKey][] = [
    ["Memorisation", "hifz"],
    ["Tajweed", "hifz"],
    ["Revision", "hifz"],
    ["Quran", "aalim"],
    ["Arabic", "aalim"],
    ["Fiqh", "aalim"],
    ["Aqeedah", "aalim"],
    ["Hadith", "aalim"],
    ["Seerah", "aalim"],
  ];
  const subjectIds: Record<string, string> = {};
  for (const [name, type] of subjectDefs) {
    const s = await SubjectModel.findOneAndUpdate(
      { name },
      { name, type },
      { upsert: true, new: true, setDefaultsOnInsert: true },
    );
    subjectIds[name] = String(s._id);
  }
  const hifzSubjectIds = subjectDefs
    .filter(([, t]) => t === "hifz")
    .map(([n]) => subjectIds[n]);
  const aalimSubjectIds = subjectDefs
    .filter(([, t]) => t === "aalim")
    .map(([n]) => subjectIds[n]);
  console.log(`Subjects: ${subjectDefs.length} created`);

  // --- Teachers -----------------------------------------------------------
  const teacherDefs: {
    name: string;
    email: string;
    type: ProgrammeKey;
    subjects: string[];
  }[] = [
    {
      name: "Ustadh Abdur Rahman",
      email: "hifz@jameah.edu",
      type: "hifz",
      subjects: hifzSubjectIds,
    },
    {
      name: "Ustadha Fatima",
      email: "islamic@jameah.edu",
      type: "aalim",
      subjects: aalimSubjectIds,
    },
  ];

  const teacherIds: Record<string, string> = {};
  for (const t of teacherDefs) {
    const teacher = await TeacherModel.findOneAndUpdate(
      { name: t.name },
      { name: t.name, type: t.type, subjects: t.subjects },
      { upsert: true, new: true, setDefaultsOnInsert: true },
    );
    teacherIds[t.email] = String(teacher._id);

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
  // [code, name, grade, programme, teacherEmail, withLogin]
  const studentDefs: [
    string,
    string,
    string,
    ProgrammeKey,
    string,
    boolean,
  ][] = [
    ["S-001", "Yusuf Khan", "Hifz Year 1", "hifz", "hifz@jameah.edu", true],
    ["S-002", "Maryam Ali", "Hifz Year 1", "hifz", "hifz@jameah.edu", false],
    ["S-003", "Ibrahim Hassan", "Hifz Year 2", "hifz", "hifz@jameah.edu", false],
    ["S-004", "Aisha Rahman", "Alim Year 1", "aalim", "islamic@jameah.edu", true],
    ["S-005", "Omar Farooq", "Alim Year 1", "aalim", "islamic@jameah.edu", false],
    ["S-006", "Fatima Noor", "Alim Year 2", "aalim", "islamic@jameah.edu", false],
  ];

  const studentIds: Record<string, string> = {};
  const studentSubjects: Record<string, { subject: string; teacher: string }[]> = {};
  for (const [code, name, grade, programme, tEmail, withLogin] of studentDefs) {
    const subjectIdsForProgramme =
      programme === "hifz" ? hifzSubjectIds : aalimSubjectIds;
    const teacherId = teacherIds[tEmail];
    const subjects = subjectIdsForProgramme.map((sid) => ({
      subject: sid,
      teacher: teacherId,
    }));
    studentSubjects[code] = subjects;

    const student = await StudentModel.findOneAndUpdate(
      { studentCode: code },
      {
        studentCode: code,
        name,
        grade,
        programme,
        subjects,
        active: true,
      },
      { upsert: true, new: true, setDefaultsOnInsert: true },
    );
    studentIds[code] = String(student._id);

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
      await StudentModel.findByIdAndUpdate(student._id, {
        userId: studentUser._id,
      });
      console.log(`Student + login: ${name} <${email}>`);
    } else {
      console.log(`Student: ${name} (${code})`);
    }
  }

  // --- Sample per-subject reports ------------------------------------------
  // Give the two students with logins a published report for every subject.
  for (const code of ["S-001", "S-004"]) {
    const studentId = studentIds[code];
    for (const entry of studentSubjects[code]) {
      const data = {
        [`${entry.subject}__mark`]: Math.round(82 + Math.random() * 12),
        [`${entry.subject}__conduct`]: "good",
        remarks: "A consistent and diligent student. Keep up the good work.",
      };
      await ReportModel.findOneAndUpdate(
        { student: studentId, term: term._id, subject: entry.subject },
        {
          student: studentId,
          term: term._id,
          subject: entry.subject,
          teacher: entry.teacher,
          status: "published",
          data,
          comments: data.remarks as string,
          publishedAt: new Date(),
        },
        { upsert: true, new: true, setDefaultsOnInsert: true },
      );
    }
    console.log(`Sample reports (published): ${code} — all subjects`);
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
