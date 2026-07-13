import { getRequestContext } from "@/lib/auth/context";
import Sidebar, { type IconName, type SidebarNavItem } from "@/components/Sidebar";

const NAV: Record<string, SidebarNavItem[]> = {
  teacher: [{ href: "/teacher", label: "My Students", icon: "students" }],
  student: [{ href: "/student", label: "My Reports", icon: "reports" }],
  admin: [
    { href: "/admin", label: "Dashboard", icon: "dashboard" },
    { href: "/admin/students", label: "Students", icon: "students" },
    { href: "/admin/teachers", label: "Teachers", icon: "teachers" },
    { href: "/admin/subjects", label: "Subjects", icon: "subjects" },
    { href: "/admin/terms", label: "Terms", icon: "terms" },
    { href: "/admin/reports", label: "Reports", icon: "reports" },
    { href: "/admin/backup", label: "Backup", icon: "backup" },
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
    <div className="min-h-screen bg-gray-50">
      <Sidebar nav={nav} userName={name} isAdmin={isAdmin} />
      <div className="md:pl-64">
        <main className="mx-auto w-full max-w-5xl flex-1 px-4 py-8">
          {children}
        </main>
      </div>
    </div>
  );
}
