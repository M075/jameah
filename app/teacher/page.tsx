import Link from "next/link";
import { connectDB } from "@/lib/db";
import { StudentModel, TermModel } from "@/lib/models";
import { getRequestContext } from "@/lib/auth/context";

export default async function TeacherDashboard() {
  const { teacher, isAdmin } = await getRequestContext();
  await connectDB();

  const filter = isAdmin || !teacher ? {} : { "subjects.teacher": teacher._id };
  const students = await StudentModel.find(filter)
    .sort({ studentCode: 1 })
    .lean();

  const terms = await TermModel.find().sort({ startDate: -1 }).lean();
  const activeTerm = terms.find((t) => t.active) ?? terms[0];

  return (
    <div>
      <h1 className="text-xl font-semibold text-emerald-900">My Students</h1>
      <p className="mt-1 text-sm text-gray-600">
        {students.length} student{students.length === 1 ? "" : "s"}
        {activeTerm ? ` · Term: ${activeTerm.name} ${activeTerm.academicYear}` : ""}
      </p>

      <div className="mt-6 overflow-hidden rounded-xl border border-gray-200 bg-white">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 text-left text-gray-500">
            <tr>
              <th className="px-4 py-2 font-medium">Code</th>
              <th className="px-4 py-2 font-medium">Name</th>
              <th className="px-4 py-2 font-medium">Grade</th>
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
                <td className="px-4 py-2 text-right">
                  <Link
                    href={`/teacher/students/${String(s._id)}`}
                    className="rounded-md bg-emerald-700 px-3 py-1.5 text-xs font-medium text-white hover:bg-emerald-800"
                  >
                    Enter marks
                  </Link>
                </td>
              </tr>
            ))}
            {students.length === 0 ? (
              <tr>
                <td
                  colSpan={4}
                  className="px-4 py-6 text-center text-gray-400"
                >
                  No students assigned yet.
                </td>
              </tr>
            ) : null}
          </tbody>
        </table>
      </div>
    </div>
  );
}
