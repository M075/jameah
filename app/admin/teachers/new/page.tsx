import Link from "next/link";
import { connectDB } from "@/lib/db";
import { SubjectModel, type SubjectType } from "@/lib/models";
import { getRequestContext } from "@/lib/auth/context";
import TeacherForm from "@/components/admin/TeacherForm";

export default async function NewTeacherPage() {
  await getRequestContext();
  await connectDB();
  const subjects = await SubjectModel.find().sort({ name: 1 }).lean();

  return (
    <div>
      <Link
        href="/admin/teachers"
        className="text-sm text-emerald-700 hover:underline"
      >
        ← All teachers
      </Link>
      <h1 className="mt-2 text-xl font-semibold text-emerald-900">
        Add teacher
      </h1>
      <p className="mt-1 text-sm text-gray-600">
        A teacher is either Hifz or Aalim, then assigned to the subjects they
        teach.
      </p>
      <div className="mt-6 rounded-xl border border-gray-200 bg-white p-6">
        <TeacherForm
          subjects={(subjects as SubjectType[]).map((s) => ({
            _id: String(s._id),
            name: s.name,
            type: s.type,
          }))}
        />
      </div>
    </div>
  );
}
