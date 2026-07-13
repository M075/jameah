import { redirect } from "next/navigation";
import { auth } from "@/auth";
import LoginForm from "./login-form";

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ redirectTo?: string }>;
}) {
  const session = await auth();
  if (session?.user) redirect("/");

  const { redirectTo } = await searchParams;
  const target = redirectTo && redirectTo.startsWith("/") ? redirectTo : "/";

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
      {/* Overlay for contrast */}
      <div className="absolute inset-0 bg-gradient-to-b from-white/70 to-black/80" />

      <main className="relative z-10 mx-auto w-full max-w-md">
        <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
          <h1 className="mb-1 text-2xl font-semibold text-emerald-900">
            Jameah Mahmoodiyah
          </h1>
          <p className="mb-6 text-sm text-gray-600">
            Sign in to enter marks and view reports.
          </p>
          <LoginForm redirectTo={target} />
        </div>
      </main>
    </div>
  );
}
