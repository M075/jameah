import Link from "next/link";
import { connectDB } from "@/lib/db";
import { TeacherModel, StudentModel, SubjectModel, type SubjectType } from "@/lib/models";
import { getRequestContext } from "@/lib/auth/context";
import { deleteTeacher } from "@/app/admin/actions";

export default async function AdminTeachersPage() {
  await getRequestContext();
  await connectDB();

  const teachers = await TeacherModel.find()
    .sort({ name: 1 })
    .lean();
  // Subjects are owned by the Subject (each has a teacher), so derive each
  // teacher's subject list rather than reading a denormalised array.
  const subjects = await SubjectModel.find().lean<SubjectType[]>();
  const subjectsByTeacher = new Map<string, string[]>();
  for (const s of subjects) {
    if (!s.teacher) continue;
    const key = String(s.teacher);
    const list = subjectsByTeacher.get(key) ?? [];
    list.push(s.name);
    subjectsByTeacher.set(key, list);
  }
  const studentCounts = await StudentModel.aggregate([
    { $unwind: "$subjects" },
    { $group: { _id: "$subjects.teacher", count: { $sum: 1 } } },
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

      <div className="mt-6 overflow-x-auto rounded-xl border border-gray-200 bg-white">
        <table className="min-w-[680px] w-full text-sm">
          <thead className="bg-gray-50 text-left text-gray-500">
            <tr>
              <th className="px-4 py-2 font-medium">Name</th>
              <th className="px-4 py-2 font-medium">Type</th>
              <th className="px-4 py-2 font-medium">Subjects</th>
              <th className="px-4 py-2 font-medium text-right">Students</th>
              <th className="px-4 py-2 font-medium text-right">Action</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {teachers.map((t) => (
              <tr key={String(t._id)} className="hover:bg-emerald-50/40">
                <td className="px-4 py-2 font-medium text-gray-800">
                  {t.name}
                </td>
                <td className="px-4 py-2 text-gray-600">
                  <span
                    className={
                      t.type === "hifz"
                        ? "rounded bg-emerald-100 px-2 py-0.5 text-xs font-medium text-emerald-800"
                        : "rounded bg-amber-100 px-2 py-0.5 text-xs font-medium text-amber-800"
                    }
                  >
                    {t.type === "hifz" ? "Hifz" : "Aalim"}
                  </span>
                </td>
                <td className="px-4 py-2 text-gray-600">
                  {(t.subjects as { name: string }[])
                    .map((s) => s.name)
                    .join(", ") || "—"}
                </td>
                <td className="px-4 py-2 text-right text-gray-600">
                  {countMap.get(String(t._id)) ?? 0}
                </td>
                <td className="px-4 py-2 text-right">
                  <div className="flex items-center justify-end gap-2">
                    <Link
                      href={`/admin/teachers/${String(t._id)}`}
                      className="rounded-md border border-gray-300 px-2.5 py-1 text-sm font-medium text-gray-700 hover:bg-gray-100"
                    >
                      Edit
                    </Link>
                    <form action={deleteTeacher}>
                      <input
                        type="hidden"
                        name="teacherId"
                        value={String(t._id)}
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
