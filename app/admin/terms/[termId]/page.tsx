import Link from "next/link";
import { notFound } from "next/navigation";
import { connectDB } from "@/lib/db";
import { TermModel, type TermType } from "@/lib/models";
import { getRequestContext } from "@/lib/auth/context";
import TermForm from "@/components/admin/TermForm";
import { deleteTerm } from "@/app/admin/actions";

function toInput(d: unknown): string {
  if (!d) return "";
  const date = d instanceof Date ? d : new Date(d as string);
  return isNaN(date.getTime()) ? "" : date.toISOString().slice(0, 10);
}

export default async function EditTermPage({
  params,
}: {
  params: Promise<{ termId: string }>;
}) {
  const { termId } = await params;
  await getRequestContext();
  await connectDB();

  const term = await TermModel.findById(termId).lean<TermType>();
  if (!term) notFound();

  return (
    <div>
      <Link
        href="/admin/terms"
        className="text-sm text-emerald-700 hover:underline"
      >
        ← All terms
      </Link>
      <h1 className="mt-2 text-xl font-semibold text-emerald-900">Edit term</h1>
      <div className="mt-6 rounded-xl border border-gray-200 bg-white p-6">
        <TermForm
          id={String(term._id)}
          name={term.name}
          academicYear={term.academicYear}
          startDate={toInput(term.startDate)}
          endDate={toInput(term.endDate)}
          active={Boolean(term.active)}
        />
      </div>

      <div className="mt-6 rounded-xl border border-red-200 bg-white p-6">
        <h2 className="text-sm font-semibold text-red-800">Delete term</h2>
        <p className="mt-1 text-sm text-gray-600">
          Removes this term. Reports already linked to it are kept.
        </p>
        <form action={deleteTerm} className="mt-4">
          <input type="hidden" name="termId" value={String(term._id)} />
          <button
            type="submit"
            className="rounded-md bg-red-600 px-4 py-2 text-sm font-medium text-white hover:bg-red-700"
          >
            Delete term
          </button>
        </form>
      </div>
    </div>
  );
}
