import Link from "next/link";
import { notFound } from "next/navigation";
import { connectDB } from "@/lib/db";
import {
  TeacherModel,
  UserModel,
  SubjectModel,
  type SubjectType,
  type TeacherType,
  type UserType,
} from "@/lib/models";
import { getRequestContext } from "@/lib/auth/context";
import TeacherForm from "@/components/admin/TeacherForm";
import { deleteTeacher } from "@/app/admin/actions";

export default async function EditTeacherPage({
  params,
}: {
  params: Promise<{ teacherId: string }>;
}) {
  const { teacherId } = await params;
  await getRequestContext();
  await connectDB();

  const teacher = await TeacherModel.findById(teacherId).lean<TeacherType>();
  if (!teacher) notFound();

  // Linked login account (if this teacher was given one) — so we can show
  // and edit the email rather than starting from a blank field.
  const loginUser = await UserModel.findOne({ teacherId })
    .lean<UserType>()
    .select("email");

  // Subjects this teacher is assigned to (via each subject's teacher field).
  const taught = await SubjectModel.find({ teacher: teacherId })
    .sort({ year: 1, name: 1 })
    .lean<SubjectType[]>();

  return (
    <div>
      <Link
        href="/admin/teachers"
        className="text-sm text-emerald-700 hover:underline"
      >
        ← All teachers
      </Link>
      <h1 className="mt-2 text-xl font-semibold text-emerald-900">
        Edit teacher
      </h1>
      <div className="mt-6 rounded-xl border border-gray-200 bg-white p-6">
        <TeacherForm
          id={String(teacher._id)}
          name={teacher.name}
          type={teacher.type}
          email={loginUser?.email ?? ""}
        />
      </div>

      <div className="mt-6 rounded-xl border border-gray-200 bg-white p-6">
        <h2 className="text-sm font-semibold text-emerald-900">
          Subjects taught
        </h2>
        {taught.length > 0 ? (
          <ul className="mt-3 flex flex-wrap gap-2">
            {taught.map((s) => (
              <li
                key={String(s._id)}
                className="rounded-full bg-emerald-50 px-3 py-1 text-sm text-emerald-800"
              >
                {s.name} · Year {s.year}
              </li>
            ))}
          </ul>
        ) : (
          <p className="mt-2 text-sm text-gray-400">
            No subjects assigned yet. Assign this teacher from each subject&apos;s
            edit page.
          </p>
        )}
      </div>

      <div className="mt-6 rounded-xl border border-red-200 bg-white p-6">
        <h2 className="text-sm font-semibold text-red-800">Delete teacher</h2>
        <p className="mt-1 text-sm text-gray-600">
          Removes this teacher and their login, and unassigns them from any
          student subjects. Reports they created are kept.
        </p>
        <form action={deleteTeacher} className="mt-4">
          <input
            type="hidden"
            name="teacherId"
            value={String(teacher._id)}
          />
          <button
            type="submit"
            className="rounded-md bg-red-600 px-4 py-2 text-sm font-medium text-white hover:bg-red-700"
          >
            Delete teacher
          </button>
        </form>
      </div>
    </div>
  );
}
