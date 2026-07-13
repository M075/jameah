import Link from "next/link";
import { connectDB } from "@/lib/db";
import { TeacherModel, type TeacherType } from "@/lib/models";
import SubjectForm from "@/components/admin/SubjectForm";

export default async function NewSubjectPage() {
  await connectDB();
  const teachers = await TeacherModel.find({ type: "aalim" })
    .sort({ name: 1 })
    .lean<TeacherType[]>();

  return (
    <div>
      <Link
        href="/admin/subjects"
        className="text-sm text-emerald-700 hover:underline"
      >
        ← All subjects
      </Link>
      <h1 className="mt-2 text-xl font-semibold text-emerald-900">
        Add subject
      </h1>
      <p className="mt-1 text-sm text-gray-600">
        Create a subject, choose its Aalim year, and assign the teacher who
        teaches it. Students in that year are assigned the subject automatically.
      </p>
      <div className="mt-6 rounded-xl border border-gray-200 bg-white p-6">
        <SubjectForm
          teachers={teachers.map((t) => ({
            _id: String(t._id),
            name: t.name,
          }))}
        />
      </div>
    </div>
  );
}
