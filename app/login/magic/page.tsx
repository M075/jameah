import Link from "next/link";
import MagicSignIn from "./MagicSignIn";

export const dynamic = "force-dynamic";

export default async function MagicLoginPage({
  searchParams,
}: {
  searchParams: Promise<{ token?: string }>;
}) {
  const { token } = await searchParams;

  if (!token) {
    return (
      <div
        className="relative flex min-h-screen items-center justify-center px-4 py-10"
        style={{
          backgroundImage: "url('https://www.advantour.com/img/uzbekistan/bukhara/kosh-madrasah/kosh-madrasah.jpg')",
          backgroundSize: "cover",
          backgroundPosition: "center",
          backgroundRepeat: "no-repeat",
        }}
      >
        <div className="absolute inset-0 bg-gradient-to-b from-emerald-900/70 via-emerald-900/50 to-emerald-950/80" />
        <main className="relative z-10 mx-auto w-full max-w-md">
          <div className="rounded-xl border border-gray-200 bg-white p-6 text-center shadow-sm">
            <h1 className="text-lg font-semibold text-emerald-900">
              Invalid sign-in link
            </h1>
            <p className="mt-2 text-sm text-gray-600">
              This link is missing its token. Please request a new sign-in email.
            </p>
            <Link
              href="/login"
              className="mt-4 inline-block rounded-md bg-emerald-700 px-4 py-2 text-sm font-medium text-white hover:bg-emerald-800"
            >
              Back to sign in
            </Link>
          </div>
        </main>
      </div>
    );
  }

  return (
    <div
      className="relative flex min-h-screen items-center justify-center px-4 py-10"
      style={{
        backgroundImage: "url('https://www.advantour.com/img/uzbekistan/bukhara/kosh-madrasah/kosh-madrasah.jpg')",
        backgroundSize: "cover",
        backgroundPosition: "center",
        backgroundRepeat: "no-repeat",
      }}
    >
      <div className="absolute inset-0 bg-gradient-to-b from-emerald-900/70 via-emerald-900/50 to-emerald-950/80" />
      <main className="relative z-10 mx-auto w-full max-w-md">
        <div className="rounded-xl border border-gray-200 bg-white p-6 text-center shadow-sm">
          <MagicSignIn token={token} />
        </div>
      </main>
    </div>
  );
}
