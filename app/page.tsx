import Link from "next/link";
import { redirect } from "next/navigation";
import { getRequestContext } from "@/lib/auth/context";

const HUB: Record<string, { href: string; title: string; desc: string }[]> = {
  teacher: [
    {
      href: "/teacher",
      title: "My Students",
      desc: "View your class and enter term marks.",
    },
  ],
  student: [
    {
      href: "/student",
      title: "My Reports",
      desc: "View and download your term reports.",
    },
  ],
  admin: [
    {
      href: "/admin",
      title: "Admin Dashboard",
      desc: "Manage students, teachers, and backups.",
    },
    {
      href: "/admin/backup",
      title: "CSV Backup",
      desc: "Export all reports to CSV.",
    },
  ],
};

export default async function HomePage() {
  const { session } = await getRequestContext();
  if (!session?.user) redirect("/login");

  const cards = HUB[session.user.role] ?? HUB.teacher;

  return (
    <main className="mx-auto max-w-3xl px-4 py-12">
      <h1 className="text-2xl font-semibold text-emerald-900">
        أهلا وسهلا, {session.user.name}
      </h1>
      <p className="mt-1 text-gray-600">Choose where to go:</p>
      <div className="mt-6 grid gap-4 sm:grid-cols-2">
        {cards.map((c) => (
          <Link
            key={c.href}
            href={c.href}
            className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm transition hover:border-emerald-400 hover:shadow"
          >
            <div className="font-medium text-emerald-800">{c.title}</div>
            <div className="mt-1 text-sm text-gray-600">{c.desc}</div>
          </Link>
        ))}
      </div>
    </main>
  );
}
