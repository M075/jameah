import Link from "next/link";
import { notFound } from "next/navigation";
import { connectDB } from "@/lib/db";
import { SubjectModel, TeacherModel, type TeacherType } from "@/lib/models";
import { getRequestContext } from "@/lib/auth/context";
import SubjectForm from "@/components/admin/SubjectForm";
import { deleteSubject } from "@/app/admin/actions";

export default async function EditSubjectPage({
  params,
}: {
  params: Promise<{ subjectId: string }>;
}) {
  const { subjectId } = await params;
  await getRequestContext();
  await connectDB();

  const subject = await SubjectModel.findById(subjectId).lean();
  if (!subject) notFound();

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
        Edit subject
      </h1>
      <div className="mt-6 rounded-xl border border-gray-200 bg-white p-6">
        <SubjectForm
          id={String(subject._id)}
          name={subject.name}
          type={subject.type}
          year={subject.year}
          teacher={subject.teacher ? String(subject.teacher) : ""}
          teachers={teachers.map((t) => ({
            _id: String(t._id),
            name: t.name,
          }))}
        />
      </div>

      <form action={deleteSubject} className="mt-6">
        <input type="hidden" name="subjectId" value={String(subject._id)} />
        <button
          type="submit"
          className="rounded-md border border-red-300 px-4 py-2 text-sm font-medium text-red-700 hover:bg-red-50"
        >
          Delete subject
        </button>
      </form>
    </div>
  );
}
