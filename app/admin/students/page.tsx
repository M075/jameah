import Link from "next/link";
import { connectDB } from "@/lib/db";
import { StudentModel, TeacherModel } from "@/lib/models";
import { getRequestContext } from "@/lib/auth/context";

export default async function AdminStudentsPage() {
  await getRequestContext();
  await connectDB();

  const students = await StudentModel.find()
    .populate("teacher")
    .sort({ studentCode: 1 })
    .lean();

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

      <div className="mt-6 overflow-hidden rounded-xl border border-gray-200 bg-white">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 text-left text-gray-500">
            <tr>
              <th className="px-4 py-2 font-medium">Code</th>
              <th className="px-4 py-2 font-medium">Name</th>
              <th className="px-4 py-2 font-medium">Grade</th>
              <th className="px-4 py-2 font-medium">Teacher</th>
              <th className="px-4 py-2 font-medium text-right">Action</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {students.map((s) => (
              <tr key={String(s._id)} className="hover:bg-emerald-50/40">
                <td className="px-4 py-2 font-mono text-xs text-gray-500">
                  {s.studentCode}
                </td>
                <td className="px-4 py-2 font-medium text-gray-800">
                  {s.name}
                </td>
                <td className="px-4 py-2 text-gray-600">{s.grade}</td>
                <td className="px-4 py-2 text-gray-600">
                  {(s.teacher as { name?: string } | null)?.name ?? "—"}
                </td>
                <td className="px-4 py-2 text-right">
                  <Link
                    href={`/admin/students/${String(s._id)}`}
                    className="rounded-md bg-emerald-700 px-3 py-1.5 text-xs font-medium text-white hover:bg-emerald-800"
                  >
                    View reports
                  </Link>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
