/**
 * Idempotent seed script. Run with:  npx tsx scripts/seed.ts
 * (or `npm run seed`). Creates an admin, teachers, students, subjects,
 * a term, and a few sample per-subject reports so the app is usable
 * immediately after a fresh DB.
 *
 * Domain model:
 *   - Aalim = 6 years, one class per year. Subjects belong to Aalim only and
 *     each subject is owned by a single teacher assigned by admin (subject.teacher).
 *   - Hifz students have NO subjects.
 *   - Aalim students get a `year`; when set they are auto-assigned every
 *     subject of that year (each carrying its teacher), which populates the
 *     teacher dashboards (filter on subjects.teacher).
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
  type Role,
  type ProgrammeKey,
} from "../lib/models";

const DEFAULT_PASSWORD = "Password123!";

const AALIM_SUBJECT_NAMES = ["Arabic", "Fiqh", "Aqeedah", "Hadith", "Seerah", "Quran"];

async function hash(pw: string) {
  return bcrypt.hash(pw, 10);
}

async function assignSubjectsForYear(studentId: string): Promise<void> {
  const student = await StudentModel.findById(studentId);
  if (!student) return;
  if (student.programme !== "aalim" || !student.year) {
    student.subjects = [];
  } else {
    const subs = await SubjectModel.find({ type: "aalim", year: student.year }).lean();
    student.subjects = subs.map((s) => ({ subject: s._id, teacher: s.teacher ?? null }));
  }
  await student.save();
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
  // Teachers no longer carry a subjects array; subjects reference their teacher.
  const teacherDefs: {
    name: string;
    email: string;
    type: ProgrammeKey;
  }[] = [
    { name: "Ustadh Abdur Rahman", email: "hifz@jameah.edu", type: "hifz" },
    { name: "Ustadha Fatima", email: "islamic@jameah.edu", type: "aalim" },
  ];
  const teacherIds: Record<string, string> = {};
  for (const t of teacherDefs) {
    const teacher = await TeacherModel.findOneAndUpdate(
      { name: t.name },
      { name: t.name, type: t.type },
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

  // --- Subjects: Aalim only, each with a year and a teacher ----------------
  // Assign Aalim subjects to the Aalim teacher (admin reassigns as needed).
  const aalimTeacherId = teacherIds["islamic@jameah.edu"] ?? null;
  for (let year = 1; year <= 6; year++) {
    for (let i = 0; i < AALIM_SUBJECT_NAMES.length; i++) {
      const name = AALIM_SUBJECT_NAMES[i];
      await SubjectModel.findOneAndUpdate(
        { name, year, type: "aalim" },
        { name, year, type: "aalim", teacher: aalimTeacherId, active: true },
        { upsert: true, new: true, setDefaultsOnInsert: true },
      );
    }
  }
  console.log(`Subjects: ${AALIM_SUBJECT_NAMES.length * 6} (Aalim years 1–6)`);

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
  // [code, name, grade, programme, year, teacherEmail, withLogin]
  const studentDefs: [
    string,
    string,
    string,
    ProgrammeKey,
    number | null,
    string | null,
    boolean,
  ][] = [
    ["S-001", "Yusuf Khan", "Hifz Year 1", "hifz", null, "hifz@jameah.edu", true],
    ["S-002", "Maryam Ali", "Hifz Year 1", "hifz", null, null, false],
    ["S-003", "Ibrahim Hassan", "Hifz Year 2", "hifz", null, null, false],
    ["S-004", "Aisha Rahman", "Aalim Year 1", "aalim", 1, "islamic@jameah.edu", true],
    ["S-005", "Omar Farooq", "Aalim Year 1", "aalim", 1, null, false],
    ["S-006", "Fatima Noor", "Aalim Year 2", "aalim", 2, null, false],
  ];

  const studentIds: Record<string, string> = {};
  const studentSubjects: Record<string, { subject: string; teacher: string | null }[]> = {};
  for (const [code, name, grade, programme, year, , withLogin] of studentDefs) {
    const student = await StudentModel.findOneAndUpdate(
      { studentCode: code },
      {
        studentCode: code,
        name,
        grade,
        programme,
        year,
        subjects: [],
        active: true,
      },
      { upsert: true, new: true, setDefaultsOnInsert: true },
    );
    studentIds[code] = String(student._id);

    // Auto-assign subjects for Aalim students.
    await assignSubjectsForYear(String(student._id));
    const refreshed = await StudentModel.findById(String(student._id)).lean();
    studentSubjects[code] = (refreshed?.subjects ?? []).map(
      (e: { subject: unknown; teacher: unknown }) => ({
        subject: String(e.subject),
        teacher: e.teacher ? String(e.teacher) : null,
      }),
    );

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
      const subject = await SubjectModel.findById(entry.subject).lean();
      const data = {
        subject: subject?.name ?? "Subject",
        marks: [
          { label: "Participation", value: 8 },
          { label: "Homework", value: 16 },
          { label: "Exam", value: 60 },
        ],
        total: 84,
        grade: "B",
        comments: "A consistent and diligent student. Keep up the good work.",
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
          comments: data.comments,
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
