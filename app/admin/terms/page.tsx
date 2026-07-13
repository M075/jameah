import Link from "next/link";
import { connectDB } from "@/lib/db";
import { TermModel, type TermType } from "@/lib/models";
import { getRequestContext } from "@/lib/auth/context";
import TermForm from "@/components/admin/TermForm";
import { deleteTerm, setActiveTerm } from "@/app/admin/actions";

function fmt(d: unknown): string {
  if (!d) return "—";
  const date = d instanceof Date ? d : new Date(d as string);
  if (isNaN(date.getTime())) return "—";
  return date.toISOString().slice(0, 10);
}

export default async function AdminTermsPage() {
  await getRequestContext();
  await connectDB();

  const terms = await TermModel.find().sort({ startDate: -1 }).lean<TermType[]>();

  return (
    <div>
      <Link href="/admin" className="text-sm text-emerald-700 hover:underline">
        ← Dashboard
      </Link>
      <h1 className="mt-2 text-xl font-semibold text-emerald-900">Terms</h1>
      <p className="mt-1 text-sm text-gray-600">
        Set the academic terms. Exactly one term is active at a time and is used
        as the default when entering marks.
      </p>

      <div className="mt-6 overflow-x-auto rounded-xl border border-gray-200 bg-white">
        <table className="min-w-[640px] w-full text-sm">
          <thead className="bg-gray-50 text-left text-gray-500">
            <tr>
              <th className="px-4 py-2 font-medium">Name</th>
              <th className="px-4 py-2 font-medium">Year</th>
              <th className="px-4 py-2 font-medium">Start</th>
              <th className="px-4 py-2 font-medium">End</th>
              <th className="px-4 py-2 font-medium">Status</th>
              <th className="px-4 py-2 font-medium text-right">Action</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {terms.map((t) => (
              <tr key={String(t._id)} className="hover:bg-emerald-50/40">
                <td className="px-4 py-2 font-medium text-gray-800">
                  {t.name}
                </td>
                <td className="px-4 py-2 text-gray-600">
                  {t.academicYear || "—"}
                </td>
                <td className="px-4 py-2 text-gray-600">{fmt(t.startDate)}</td>
                <td className="px-4 py-2 text-gray-600">{fmt(t.endDate)}</td>
                <td className="px-4 py-2">
                  {t.active ? (
                    <span className="rounded-full bg-emerald-100 px-2 py-1 text-xs font-medium text-emerald-800">
                      Active
                    </span>
                  ) : (
                    <span className="text-xs text-gray-400">—</span>
                  )}
                </td>
                <td className="px-4 py-2 text-right">
                  <div className="flex items-center justify-end gap-2">
                    {!t.active ? (
                      <form action={setActiveTerm}>
                        <input
                          type="hidden"
                          name="termId"
                          value={String(t._id)}
                        />
                        <button
                          type="submit"
                          className="rounded-md border border-emerald-300 px-2.5 py-1 text-sm font-medium text-emerald-700 hover:bg-emerald-50"
                        >
                          Set active
                        </button>
                      </form>
                    ) : null}
                    <Link
                      href={`/admin/terms/${String(t._id)}`}
                      className="rounded-md border border-gray-300 px-2.5 py-1 text-sm font-medium text-gray-700 hover:bg-gray-100"
                    >
                      Edit
                    </Link>
                    <form action={deleteTerm}>
                      <input
                        type="hidden"
                        name="termId"
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
            {terms.length === 0 ? (
              <tr>
                <td
                  colSpan={6}
                  className="px-4 py-6 text-center text-gray-400"
                >
                  No terms yet.
                </td>
              </tr>
            ) : null}
          </tbody>
        </table>
      </div>

      <div className="mt-8 rounded-xl border border-gray-200 bg-white p-6">
        <h2 className="text-sm font-semibold text-emerald-900">Add a term</h2>
        <div className="mt-4">
          <TermForm />
        </div>
      </div>
    </div>
  );
}
