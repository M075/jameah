import Link from "next/link";
import { connectDB } from "@/lib/db";
import { SubjectModel, TeacherModel, type SubjectType, type TeacherType } from "@/lib/models";
import { getRequestContext } from "@/lib/auth/context";
import SubjectForm from "@/components/admin/SubjectForm";

export default async function AdminSubjectsPage() {
  await getRequestContext();
  await connectDB();

  const subjects = await SubjectModel.find()
    .sort({ type: 1, year: 1, name: 1 })
    .populate("teacher")
    .lean<SubjectType[]>();
  // Aalim teachers are the only ones who can be assigned to subjects.
  const teachers = await TeacherModel.find({ type: "aalim" })
    .sort({ name: 1 })
    .lean<TeacherType[]>();

  const teacherName = (subjectId: string) => {
    const subj = subjects.find((s) => String(s._id) === subjectId);
    const t = subj?.teacher as { name?: string } | null | undefined;
    return t?.name ?? "—";
  };

  return (
    <div>
      <Link
        href="/admin"
        className="text-sm text-emerald-700 hover:underline"
      >
        ← Dashboard
      </Link>
      <div className="flex items-center justify-between">
        <h1 className="mt-2 text-xl font-semibold text-emerald-900">Subjects</h1>
        <Link
          href="/admin/subjects/new"
          className="rounded-md bg-emerald-700 px-3 py-1.5 text-sm font-medium text-white hover:bg-emerald-800"
        >
          + Add subject
        </Link>
      </div>

      <div className="mt-6 overflow-x-auto rounded-xl border border-gray-200 bg-white">
        <table className="min-w-[560px] w-full text-sm">
          <thead className="bg-gray-50 text-left text-gray-500">
            <tr>
              <th className="px-4 py-2 font-medium">Name</th>
              <th className="px-4 py-2 font-medium">Type</th>
              <th className="px-4 py-2 font-medium">Year</th>
              <th className="px-4 py-2 font-medium">Teacher</th>
              <th className="px-4 py-2 font-medium text-right">Action</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {subjects.map((s) => (
              <tr key={String(s._id)} className="hover:bg-emerald-50/40">
                <td className="px-4 py-2 font-medium text-gray-800">
                  {s.name}
                </td>
                <td className="px-4 py-2 text-gray-600">
                  <span
                    className={
                      s.type === "hifz"
                        ? "rounded bg-emerald-100 px-2 py-0.5 text-xs font-medium text-emerald-800"
                        : "rounded bg-amber-100 px-2 py-0.5 text-xs font-medium text-amber-800"
                    }
                  >
                    {s.type === "hifz" ? "Hifz" : "Aalim"}
                  </span>
                </td>
                <td className="px-4 py-2 text-gray-600">{s.year}</td>
                <td className="px-4 py-2 text-gray-600">
                  {teacherName(String(s._id))}
                </td>
                <td className="px-4 py-2 text-right">
                  <Link
                    href={`/admin/subjects/${String(s._id)}`}
                    className="rounded-md border border-gray-300 px-2.5 py-1 text-sm font-medium text-gray-700 hover:bg-gray-100"
                  >
                    Edit
                  </Link>
                </td>
              </tr>
            ))}
            {subjects.length === 0 ? (
              <tr>
                <td
                  colSpan={4}
                  className="px-4 py-6 text-center text-gray-400"
                >
                  No subjects yet.
                </td>
              </tr>
            ) : null}
          </tbody>
        </table>
      </div>

      <div className="mt-8 rounded-xl border border-gray-200 bg-white p-6">
        <h2 className="text-sm font-semibold text-emerald-900">
          Add a subject
        </h2>
        <div className="mt-4">
          <SubjectForm
            teachers={teachers.map((t) => ({
              _id: String(t._id),
              name: t.name,
            }))}
          />
        </div>
      </div>
    </div>
  );
}
