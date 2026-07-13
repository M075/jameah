import Link from "next/link";
import { getRequestContext } from "@/lib/auth/context";
import TeacherForm from "@/components/admin/TeacherForm";

export default async function NewTeacherPage() {
  await getRequestContext();

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
        A teacher is either Hifz or Aalim. Assign this teacher to subjects from
        each subject&apos;s edit page.
      </p>
      <div className="mt-6 rounded-xl border border-gray-200 bg-white p-6">
        <TeacherForm />
      </div>
    </div>
  );
}
