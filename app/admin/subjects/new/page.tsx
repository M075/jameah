import Link from "next/link";
import SubjectForm from "@/components/admin/SubjectForm";

export default function NewSubjectPage() {
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
        Create a subject and tag it as Hifz or Aalim. Teachers are assigned to
        subjects from the teacher page.
      </p>
      <div className="mt-6 rounded-xl border border-gray-200 bg-white p-6">
        <SubjectForm />
      </div>
    </div>
  );
}
