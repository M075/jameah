import Link from "next/link";
import { connectDB } from "@/lib/db";
import { TeacherModel, StudentModel } from "@/lib/models";
import { getRequestContext } from "@/lib/auth/context";

export default async function AdminTeachersPage() {
  await getRequestContext();
  await connectDB();

  const teachers = await TeacherModel.find().sort({ teacherCode: 1 }).lean();
  const studentCounts = await StudentModel.aggregate([
    { $group: { _id: "$teacher", count: { $sum: 1 } } },
  ]);
  const countMap = new Map(
    studentCounts.map((c) => [String(c._id), c.count]),
  );

  return (
    <div>
      <Link href="/admin" className="text-sm text-emerald-700 hover:underline">
        ← Dashboard
      </Link>
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-semibold text-emerald-900">Teachers</h1>
        <Link
          href="/admin/teachers/new"
          className="rounded-md bg-emerald-700 px-3 py-1.5 text-sm font-medium text-white hover:bg-emerald-800"
        >
          + Add teacher
        </Link>
      </div>

      <div className="mt-6 overflow-hidden rounded-xl border border-gray-200 bg-white">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 text-left text-gray-500">
            <tr>
              <th className="px-4 py-2 font-medium">Code</th>
              <th className="px-4 py-2 font-medium">Name</th>
              <th className="px-4 py-2 font-medium">Subjects</th>
              <th className="px-4 py-2 font-medium text-right">Students</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {teachers.map((t) => (
              <tr key={String(t._id)} className="hover:bg-emerald-50/40">
                <td className="px-4 py-2 font-mono text-xs text-gray-500">
                  {t.teacherCode}
                </td>
                <td className="px-4 py-2 font-medium text-gray-800">
                  {t.name}
                </td>
                <td className="px-4 py-2 text-gray-600">
                  {t.subjects.join(", ") || "—"}
                </td>
                <td className="px-4 py-2 text-right text-gray-600">
                  {countMap.get(String(t._id)) ?? 0}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
