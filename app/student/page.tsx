import Link from "next/link";
import { connectDB } from "@/lib/db";
import {
  StudentModel,
  ReportModel,
  TermModel,
  SubjectModel,
} from "@/lib/models";
import { getRequestContext } from "@/lib/auth/context";

export default async function StudentDashboard() {
  const { session, isAdmin } = await getRequestContext();
  await connectDB();

  // Admins land here only via the hub; show all students' reports is out of
  // scope — for an admin, send them to the admin dashboard.
  if (isAdmin) {
    return (
      <div>
        <h1 className="text-xl font-semibold text-emerald-900">My Reports</h1>
        <p className="mt-2 text-sm text-gray-600">
          Admins manage reports from the{" "}
          <Link href="/admin" className="text-emerald-700 underline">
            admin dashboard
          </Link>
          .
        </p>
      </div>
    );
  }

  const student = await StudentModel.findOne({
    userId: session!.user.id,
  }).lean();
  if (!student) {
    return (
      <div>
        <h1 className="text-xl font-semibold text-emerald-900">My Reports</h1>
        <p className="mt-2 text-sm text-gray-600">
          No student record is linked to your account yet.
        </p>
      </div>
    );
  }

  const reports = await ReportModel.find({ student: student._id })
    .populate({ path: "term", model: TermModel })
    .populate({ path: "subject", model: SubjectModel })
    .sort({ createdAt: -1 })
    .lean();

  return (
    <div>
      <h1 className="text-xl font-semibold text-emerald-900">My Reports</h1>
      <p className="mt-1 text-sm text-gray-600">
        {student.name} ({student.studentCode})
      </p>

      <div className="mt-6 space-y-3">
        {reports.map((r) => {
          const term = r.term as unknown as { name: string; academicYear: string };
          const subject = r.subject as unknown as { name: string };
          const isPublished = r.status === "published";
          return (
            <Link
              key={String(r._id)}
              href={`/student/reports/${String(r._id)}`}
              className="flex items-center justify-between rounded-xl border border-gray-200 bg-white p-4 shadow-sm hover:border-emerald-400"
            >
              <div>
                <div className="font-medium text-emerald-800">
                  {subject?.name ?? "Report"}
                </div>
                <div className="text-xs text-gray-500">
                  {term?.name} {term?.academicYear}
                </div>
              </div>
              <span
                className={
                  isPublished
                    ? "rounded-full bg-emerald-100 px-2 py-1 text-xs font-medium text-emerald-800"
                    : "rounded-full bg-amber-100 px-2 py-1 text-xs font-medium text-amber-800"
                }
              >
                {r.status}
              </span>
            </Link>
          );
        })}
        {reports.length === 0 ? (
          <p className="rounded-lg bg-gray-50 px-4 py-6 text-center text-sm text-gray-400">
            No reports yet.
          </p>
        ) : null}
      </div>
    </div>
  );
}
