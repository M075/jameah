import Link from "next/link";
import { connectDB } from "@/lib/db";
import { StudentModel, TermModel, ReportModel } from "@/lib/models";
import { getRequestContext } from "@/lib/auth/context";
import { deleteStudent } from "@/app/admin/actions";

/** Marks-entry status badge for the active term. */
function StatusBadge({ status }: { status?: string }) {
  if (!status) {
    return (
      <span className="rounded-full bg-gray-100 px-2 py-0.5 text-xs font-medium text-gray-500">
        Not started
      </span>
    );
  }
  const published = status === "published";
  return (
    <span
      className={`rounded-full px-2 py-0.5 text-xs font-medium ${
        published
          ? "bg-emerald-100 text-emerald-800"
          : "bg-amber-100 text-amber-800"
      }`}
    >
      {published ? "Published" : "Draft"}
    </span>
  );
}

export default async function AdminStudentsPage() {
  await getRequestContext();
  await connectDB();

  const students = await StudentModel.find().sort({ name: 1 }).lean();

  // Marks-entry status for the active term (or most recent), shown per student.
  const terms = await TermModel.find().sort({ startDate: -1 }).lean();
  const activeTerm = terms.find((t) => t.active) ?? terms[0];
  const reports = activeTerm
    ? await ReportModel.find({
        term: activeTerm._id,
        student: { $in: students.map((s) => s._id) },
      }).lean()
    : [];
  const statusByStudent = new Map<string, string>(
    reports.map((r) => [String(r.student), r.status]),
  );

  return (
    <div>
      <Link href="/admin" className="text-sm text-emerald-700 hover:underline">
        ← Dashboard
      </Link>
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-semibold text-emerald-900">Students</h1>
        <Link
          href="/admin/students/new"
          className="rounded-md bg-emerald-700 px-3 py-1.5 text-sm font-medium text-white hover:bg-emerald-800"
        >
          + Add student
        </Link>
      </div>
      <p className="mt-1 text-sm text-gray-600">
        {students.length} student{students.length === 1 ? "" : "s"}
      </p>

      <div className="mt-6 overflow-x-auto rounded-xl border border-gray-200 bg-white">
        <table className="min-w-[680px] w-full text-sm">
          <thead className="bg-gray-50 text-left text-gray-500">
            <tr>
              <th className="px-4 py-2 font-medium">Name</th>
              <th className="px-4 py-2 font-medium">Class</th>
              <th className="px-4 py-2 font-medium">Marks</th>
              <th className="px-4 py-2 font-medium">Programme</th>
              <th className="px-4 py-2 font-medium text-right">Action</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {students.map((s) => (
              <tr key={String(s._id)} className="hover:bg-emerald-50/40">
                <td className="px-4 py-2 font-medium text-gray-800">
                  {s.name}
                </td>
                <td className="px-4 py-2 text-gray-600">{s.grade}</td>
                <td className="px-4 py-2">
                  <StatusBadge status={statusByStudent.get(String(s._id))} />
                </td>
                <td className="px-4 py-2 text-gray-600">
                  {s.programme ? (
                    <span
                      className={
                        s.programme === "hifz"
                          ? "rounded bg-emerald-100 px-2 py-0.5 text-xs font-medium text-emerald-800"
                          : "rounded bg-amber-100 px-2 py-0.5 text-xs font-medium text-amber-800"
                      }
                    >
                      {s.programme === "hifz" ? "Hifz" : "Aalim"}
                    </span>
                  ) : (
                    "—"
                  )}
                </td>
                <td className="px-4 py-2 text-right">
                  <div className="flex items-center justify-end gap-2">
                    <Link
                      href={`/admin/students/${String(s._id)}/marks`}
                      className="rounded-md border border-emerald-300 px-2.5 py-1 text-sm font-medium text-emerald-700 hover:bg-emerald-50"
                    >
                      Marks
                    </Link>
                    <Link
                      href={`/admin/students/${String(s._id)}`}
                      className="rounded-md border border-gray-300 px-2.5 py-1 text-sm font-medium text-gray-700 hover:bg-gray-100"
                    >
                      Edit
                    </Link>
                    <form action={deleteStudent}>
                      <input
                        type="hidden"
                        name="studentId"
                        value={String(s._id)}
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
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
