import Link from "next/link";
import { connectDB } from "@/lib/db";
import {
  StudentModel,
  TermModel,
  ReportModel,
  type StudentType,
  type TermType,
} from "@/lib/models";
import { getRequestContext } from "@/lib/auth/context";
import { deleteReport } from "@/app/admin/actions";

export default async function AdminReportsPage({
  searchParams,
}: {
  searchParams: Promise<{ student?: string; term?: string; status?: string }>;
}) {
  const { student, term, status } = await searchParams;
  await getRequestContext();
  await connectDB();

  const filter: Record<string, unknown> = {};
  if (student) filter.student = student;
  if (term) filter.term = term;
  if (status) filter.status = status;

  const [students, terms, reports] = await Promise.all([
    StudentModel.find().sort({ studentCode: 1 }).lean<StudentType[]>(),
    TermModel.find().sort({ startDate: -1 }).lean<TermType[]>(),
    ReportModel.find(filter)
      .populate("student")
      .populate("term")
      .populate("subject")
      .sort({ createdAt: -1 })
      .lean(),
  ]);

  const studentMap = new Map(students.map((s) => [String(s._id), s]));
  const termMap = new Map(terms.map((t) => [String(t._id), t]));

  return (
    <div>
      <Link href="/admin" className="text-sm text-emerald-700 hover:underline">
        ← Dashboard
      </Link>
      <div className="flex items-center justify-between">
        <h1 className="mt-2 text-xl font-semibold text-emerald-900">Reports</h1>
        <Link
          href="/admin/backup"
          className="rounded-md border border-gray-300 px-3 py-1.5 text-sm font-medium text-gray-700 hover:bg-gray-100"
        >
          Export CSV
        </Link>
      </div>

      <form className="mt-4 flex flex-wrap items-end gap-3 rounded-xl border border-gray-200 bg-white p-4">
        <label className="text-sm">
          <span className="block font-medium text-gray-700">Student</span>
          <select
            name="student"
            defaultValue={student ?? ""}
            className="mt-1 rounded-md border border-gray-300 px-2 py-1.5 text-sm"
          >
            <option value="">All students</option>
            {students.map((s) => (
              <option key={String(s._id)} value={String(s._id)}>
                {s.studentCode} · {s.name}
              </option>
            ))}
          </select>
        </label>
        <label className="text-sm">
          <span className="block font-medium text-gray-700">Term</span>
          <select
            name="term"
            defaultValue={term ?? ""}
            className="mt-1 rounded-md border border-gray-300 px-2 py-1.5 text-sm"
          >
            <option value="">All terms</option>
            {terms.map((t) => (
              <option key={String(t._id)} value={String(t._id)}>
                {t.name} {t.academicYear}
              </option>
            ))}
          </select>
        </label>
        <label className="text-sm">
          <span className="block font-medium text-gray-700">Status</span>
          <select
            name="status"
            defaultValue={status ?? ""}
            className="mt-1 rounded-md border border-gray-300 px-2 py-1.5 text-sm"
          >
            <option value="">All statuses</option>
            <option value="draft">Draft</option>
            <option value="published">Published</option>
          </select>
        </label>
        <button
          type="submit"
          className="rounded-md bg-emerald-700 px-3 py-1.5 text-sm font-medium text-white hover:bg-emerald-800"
        >
          Filter
        </button>
        {(student || term || status) && (
          <Link
            href="/admin/reports"
            className="rounded-md px-3 py-1.5 text-sm text-gray-600 hover:underline"
          >
            Clear
          </Link>
        )}
      </form>

      <div className="mt-6 overflow-hidden rounded-xl border border-gray-200 bg-white">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 text-left text-gray-500">
            <tr>
              <th className="px-4 py-2 font-medium">Student</th>
              <th className="px-4 py-2 font-medium">Term</th>
              <th className="px-4 py-2 font-medium">Subject</th>
              <th className="px-4 py-2 font-medium">Status</th>
              <th className="px-4 py-2 font-medium text-right">Action</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {reports.map((r) => {
              const st =
                studentMap.get(String(r.student)) ??
                (r.student as unknown as StudentType);
              const tm =
                termMap.get(String(r.term)) ??
                (r.term as unknown as TermType);
              const subj = r.subject as unknown as { _id: string; name: string };
              const isPublished = r.status === "published";
              return (
                <tr key={String(r._id)} className="hover:bg-emerald-50/40">
                  <td className="px-4 py-2 font-medium text-gray-800">
                    {st?.name ?? "Student"}
                    <span className="block font-mono text-xs text-gray-400">
                      {st?.studentCode}
                    </span>
                  </td>
                  <td className="px-4 py-2 text-gray-600">
                    {tm ? `${tm.name} ${tm.academicYear}` : "—"}
                  </td>
                  <td className="px-4 py-2 text-gray-600">
                    {subj?.name ?? "Subject"}
                  </td>
                  <td className="px-4 py-2">
                    <span
                      className={
                        isPublished
                          ? "rounded-full bg-emerald-100 px-2 py-1 text-xs font-medium text-emerald-800"
                          : "rounded-full bg-amber-100 px-2 py-1 text-xs font-medium text-amber-800"
                      }
                    >
                      {r.status}
                    </span>
                  </td>
                  <td className="px-4 py-2 text-right">
                    <div className="flex items-center justify-end gap-2">
                      <Link
                        href={`/student/reports/${String(r._id)}`}
                        className="rounded-md border border-gray-300 px-2.5 py-1 text-sm font-medium text-gray-700 hover:bg-gray-100"
                      >
                        View
                      </Link>
                      <Link
                        href={`/teacher/students/${String(r.student)}/edit?term=${String(r.term)}&subject=${String(subj?._id)}`}
                        className="rounded-md border border-gray-300 px-2.5 py-1 text-sm font-medium text-gray-700 hover:bg-gray-100"
                      >
                        Edit
                      </Link>
                      <form action={deleteReport}>
                        <input
                          type="hidden"
                          name="reportId"
                          value={String(r._id)}
                        />
                        <button
                          type="submit"
                          className="rounded-md border border-red-300 px-2.5 py-1 text-sm font-medium text-red-700 hover:bg-red-50"
                        >
                          Delete
                        </button>
                      </form>
                    </div>
                  </td>
                </tr>
              );
            })}
            {reports.length === 0 ? (
              <tr>
                <td
                  colSpan={5}
                  className="px-4 py-6 text-center text-gray-400"
                >
                  No reports yet.
                </td>
              </tr>
            ) : null}
          </tbody>
        </table>
      </div>
    </div>
  );
}
