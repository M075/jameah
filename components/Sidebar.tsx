"use client";

import Link from "next/link";
import Image from "next/image";
import { useState, type ReactNode } from "react";
import { usePathname } from "next/navigation";
import SignOutButton from "@/components/SignOutButton";

export type IconName =
  | "dashboard"
  | "students"
  | "teachers"
  | "subjects"
  | "terms"
  | "reports"
  | "backup"
  | "settings";

const ICONS: Record<IconName, ReactNode> = {
  dashboard: (
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6"
    />
  ),
  students: (
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"
    />
  ),
  teachers: (
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      d="M12 3L2 8l10 5 10-5-10-5zM6 10.5V16c0 1.1 2.7 2.5 6 2.5s6-1.4 6-2.5v-5.5M22 8v6"
    />
  ),
  subjects: (
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      d="M12 6.042A8.967 8.967 0 006 3.75c-1.052 0-2.062.18-3 .512v14.25A8.987 8.987 0 016 18c2.305 0 4.408.867 6 2.292m0-14.25a8.966 8.966 0 016-2.292c1.052 0 2.062.18 3 .512v14.25A8.987 8.987 0 0018 18a8.967 8.967 0 00-6 2.292m0-14.25v14.25"
    />
  ),
  terms: (
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      d="M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 012.25-2.25h13.5A2.25 2.25 0 0121 7.5v11.25m-18 0A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75m-18 0V11.25c0-.621.504-1.125 1.125-1.125h17.25c.621 0 1.125.504 1.125 1.125V18.75m-18 0h18"
    />
  ),
  reports: (
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m0 12.75h7.5m-7.5 3H12M10.5 2.25H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z"
    />
  ),
  backup: (
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5M16.5 12L12 16.5m0 0L7.5 12m4.5 4.5V3"
    />
  ),
  settings: (
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      d="M9.594 3.94c.09-.542.56-.94 1.11-.94h2.593c.55 0 1.02.398 1.11.94l.213 1.281c.063.374.313.686.645.87.074.04.147.083.22.127.325.196.72.257 1.075.124l1.217-.456a1.125 1.125 0 011.37.49l1.296 2.247a1.125 1.125 0 01-.26 1.431l-1.003.827c-.293.241-.438.613-.43.992a7.03 7.03 0 010 .255c-.008.378.137.75.43.991l1.004.827c.424.35.534.955.26 1.43l-1.298 2.247a1.125 1.125 0 01-1.369.491l-1.217-.456c-.355-.133-.75-.072-1.076.124a6.47 6.47 0 01-.22.128c-.331.183-.581.495-.644.869l-.213 1.281c-.09.542-.56.94-1.11.94h-2.594c-.55 0-1.02-.398-1.11-.94l-.213-1.281c-.062-.374-.312-.686-.644-.87a6.52 6.52 0 01-.22-.127c-.325-.196-.72-.257-1.076-.124l-1.217.456a1.125 1.125 0 01-1.369-.49l-1.297-2.247a1.125 1.125 0 01.26-1.431l1.004-.827c.292-.24.437-.613.43-.991a6.932 6.932 0 010-.255c.007-.38-.138-.751-.43-.992l-1.004-.827a1.125 1.125 0 01-.26-1.43l1.297-2.247a1.125 1.125 0 011.37-.491l1.216.456c.356.133.751.072 1.076-.124.072-.044.146-.086.22-.128.332-.183.582-.495.644-.869l.214-1.28z"
    />
  ),
};

const MENU_ICON = (
  <path
    strokeLinecap="round"
    strokeLinejoin="round"
    d="M3.75 6.75h16.5M3.75 12h16.5m-16.5 5.25h16.5"
  />
);

const CLOSE_ICON = (
  <path
    strokeLinecap="round"
    strokeLinejoin="round"
    d="M6 18L18 6M6 6l12 12"
  />
);

export interface SidebarNavItem {
  href: string;
  label: string;
  icon: IconName;
}

export default function Sidebar({
  nav,
  userName,
  isAdmin,
}: {
  nav: SidebarNavItem[];
  userName: string;
  isAdmin: boolean;
}) {
  const [open, setOpen] = useState(false);
  const pathname = usePathname();

  const content = (
    <div className="flex h-full flex-col">
      <div className="flex items-center gap-2 px-5 py-5">
        <Image
          src="/logo.png"
          width={36}
          height={36}
          alt="Jameah Mahmoodiyah logo"
          className="h-9 w-9 rounded-md"
        />
        <span className="text-lg font-semibold text-emerald-900">Jameah</span>
      </div>

      <nav className="flex-1 space-y-1 px-3">
        {nav.map((item) => {
          const active =
            item.href === "/admin"
              ? pathname === "/admin"
              : pathname === item.href || pathname.startsWith(item.href + "/");
          return (
            <Link
              key={item.href}
              href={item.href}
              onClick={() => setOpen(false)}
              aria-current={active ? "page" : undefined}
              className={`flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium ${
                active
                  ? "bg-emerald-100 text-emerald-800"
                  : "text-gray-700 hover:bg-emerald-50 hover:text-emerald-800"
              }`}
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
                strokeWidth={1.5}
                stroke="currentColor"
                className="h-5 w-5"
                aria-hidden
              >
                {ICONS[item.icon]}
              </svg>
              {item.label}
            </Link>
          );
        })}
      </nav>

      <div className="border-t border-gray-200 p-3">
        <div className="px-3 py-2 text-sm text-gray-500">
          {userName}
          {isAdmin ? " (admin)" : ""}
        </div>
        <div className="px-3">
          <SignOutButton />
        </div>
      </div>
    </div>
  );

  return (
    <>
      {/* Desktop persistent sidebar */}
      <aside className="no-print fixed inset-y-0 left-0 z-30 hidden w-64 flex-col border-r border-gray-200 bg-white md:flex">
        {content}
      </aside>

      {/* Mobile top bar */}
      <header className="no-print sticky top-0 z-30 flex items-center gap-2 border-b border-gray-200 bg-white px-4 py-3 md:hidden">
        <button
          type="button"
          onClick={() => setOpen(true)}
          aria-label="Open menu"
          className="rounded-md p-1 text-gray-700 hover:bg-gray-100"
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 24 24"
            strokeWidth={1.5}
            stroke="currentColor"
            className="h-6 w-6"
            aria-hidden
          >
            {MENU_ICON}
          </svg>
        </button>
        <span className="font-semibold text-emerald-900">
          Jameah Mahmoodiyah
        </span>
      </header>

      {/* Mobile drawer */}
      {open ? (
        <div className="no-print fixed inset-0 z-40 md:hidden">
          <div
            className="absolute inset-0 bg-black/40"
            onClick={() => setOpen(false)}
            aria-hidden
          />
          <aside className="absolute inset-y-0 left-0 flex w-64 flex-col bg-white shadow-xl">
            <button
              type="button"
              onClick={() => setOpen(false)}
              aria-label="Close menu"
              className="absolute right-3 top-4 rounded-md p-1 text-gray-500 hover:bg-gray-100"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
                strokeWidth={1.5}
                stroke="currentColor"
                className="h-6 w-6"
                aria-hidden
              >
                {CLOSE_ICON}
              </svg>
            </button>
            {content}
          </aside>
        </div>
      ) : null}
    </>
  );
}
