import Link from "next/link";
import { getRequestContext } from "@/lib/auth/context";
import StudentForm from "@/components/admin/StudentForm";

export default async function NewStudentPage() {
  await getRequestContext();

  return (
    <div>
      <Link
        href="/admin/students"
        className="text-sm text-emerald-700 hover:underline"
      >
        ← All students
      </Link>
      <h1 className="mt-2 text-xl font-semibold text-emerald-900">
        Add student
      </h1>
      <p className="mt-1 text-sm text-gray-600">
        Create a student profile. Optionally generate a login so the student can
        view their own reports.
      </p>
      <div className="mt-6 rounded-xl border border-gray-200 bg-white p-6">
        <StudentForm />
      </div>
    </div>
  );
}
