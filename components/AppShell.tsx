import Link from "next/link";
import { getRequestContext } from "@/lib/auth/context";
import SignOutButton from "@/components/SignOutButton";

const NAV: Record<string, { href: string; label: string }[]> = {
  teacher: [{ href: "/teacher", label: "My Students" }],
  student: [{ href: "/student", label: "My Reports" }],
  admin: [
    { href: "/admin", label: "Dashboard" },
    { href: "/admin/students", label: "Students" },
    { href: "/admin/teachers", label: "Teachers" },
    { href: "/admin/backup", label: "Backup" },
  ],
};

export default async function AppShell({
  children,
}: {
  children: React.ReactNode;
}) {
  const { session, isAdmin } = await getRequestContext();
  const role = session?.user?.role ?? "teacher";
  const nav = NAV[role] ?? NAV.teacher;
  const name = session?.user?.name ?? "User";

  return (
    <div className="flex min-h-screen flex-col bg-gray-50">
      <header className="no-print border-b border-gray-200 bg-white">
        <div className="mx-auto flex max-w-5xl flex-wrap items-center gap-4 px-4 py-3">
          <Link href="/" className="font-semibold text-emerald-900">
            Jameah · Islamic Institute
          </Link>
          <nav className="flex flex-1 flex-wrap gap-1">
            {nav.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className="rounded-md px-3 py-1.5 text-sm font-medium text-gray-700 hover:bg-emerald-50 hover:text-emerald-800"
              >
                {item.label}
              </Link>
            ))}
          </nav>
          <span className="text-sm text-gray-500">
            {name}
            {isAdmin ? " (admin)" : ""}
          </span>
          <SignOutButton />
        </div>
      </header>
      <main className="mx-auto w-full max-w-5xl flex-1 px-4 py-8">
        {children}
      </main>
    </div>
  );
}
