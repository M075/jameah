import Link from "next/link";

export default function UnauthorizedPage() {
  return (
    <main className="mx-auto flex min-h-screen max-w-md flex-col justify-center px-4 py-10 text-center">
      <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
        <h1 className="text-2xl font-semibold text-red-800">Not authorised</h1>
        <p className="mt-2 text-sm text-gray-600">
          You don&apos;t have permission to view this page.
        </p>
        <Link
          href="/"
          className="mt-6 inline-block rounded-md bg-emerald-700 px-4 py-2 text-white hover:bg-emerald-800"
        >
          Back to home
        </Link>
      </div>
    </main>
  );
}
