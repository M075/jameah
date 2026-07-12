import { auth } from "@/auth";
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import type { Role } from "@/lib/models";

// Routes that require a specific role (or admin, which can access anything).
const ROLE_GUARDS: { prefix: string; roles: Role[] }[] = [
  { prefix: "/admin", roles: ["admin"] },
  { prefix: "/teacher", roles: ["teacher", "admin"] },
  { prefix: "/student", roles: ["student", "admin"] },
];

export default auth((req: NextRequest & { auth?: any }) => {
  const { nextUrl } = req;
  const path = nextUrl.pathname;
  const session = req.auth;
  const role = session?.user?.role as Role | undefined;
  const isLoggedIn = !!session;

  // Login page: bounce already-authenticated users to home.
  if (path.startsWith("/login")) {
    if (isLoggedIn) return NextResponse.redirect(new URL("/", nextUrl));
    return;
  }

  // Apply role guards.
  for (const guard of ROLE_GUARDS) {
    if (path.startsWith(guard.prefix)) {
      if (!isLoggedIn) {
        const url = new URL("/login", nextUrl);
        url.searchParams.set("redirectTo", path);
        return NextResponse.redirect(url);
      }
      if (!role || !guard.roles.includes(role)) {
        return NextResponse.redirect(new URL("/unauthorized", nextUrl));
      }
      return;
    }
  }

  // Any other non-public path requires authentication.
  if (!isLoggedIn && path !== "/") {
    const url = new URL("/login", nextUrl);
    url.searchParams.set("redirectTo", path);
    return NextResponse.redirect(url);
  }

  return;
});

export const config = {
  matcher: ["/((?!api/auth|_next/static|_next/image|favicon.ico).*)"],
};
