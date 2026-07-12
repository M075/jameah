import Link from "next/link";
import { connectDB } from "@/lib/db";
import {
  StudentModel,
  TeacherModel,
  TermModel,
  ReportModel,
} from "@/lib/models";
import { getRequestContext } from "@/lib/auth/context";

export default async function AdminDashboard() {
  await getRequestContext(); // enforces auth (proxy also guards /admin)
  await connectDB();

  const [students, teachers, terms, published, drafts] = await Promise.all([
    StudentModel.countDocuments(),
    TeacherModel.countDocuments(),
    TermModel.countDocuments(),
    ReportModel.countDocuments({ status: "published" }),
    ReportModel.countDocuments({ status: "draft" }),
  ]);

  const stats = [
    { label: "Students", value: students, href: "/admin/students" },
    { label: "Teachers", value: teachers, href: "/admin/teachers" },
    { label: "Terms", value: terms, href: "/admin/students" },
    { label: "Published reports", value: published, href: "/admin/backup" },
    { label: "Draft reports", value: drafts, href: "/admin/backup" },
  ];

  return (
    <div>
      <h1 className="text-xl font-semibold text-emerald-900">
        Admin Dashboard
      </h1>

      <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {stats.map((s) => (
          <Link
            key={s.label}
            href={s.href}
            className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm hover:border-emerald-400"
          >
            <div className="text-3xl font-bold text-emerald-800">
              {s.value}
            </div>
            <div className="mt-1 text-sm text-gray-600">{s.label}</div>
          </Link>
        ))}
      </div>

      <div className="mt-6">
        <Link
          href="/admin/backup"
          className="inline-block rounded-md bg-emerald-700 px-4 py-2 text-sm font-medium text-white hover:bg-emerald-800"
        >
          Export CSV backup →
        </Link>
      </div>
    </div>
  );
}
