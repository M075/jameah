import type { Session } from "next-auth";
import { auth } from "@/auth";
import { connectDB } from "@/lib/db";
import { TeacherModel, type TeacherType } from "@/lib/models";

export interface RequestContext {
  session: Session | null;
  teacher: TeacherType | null;
  isAdmin: boolean;
}

/**
 * Resolve the current request's user into a useful context: the session, the
 * linked Teacher profile (null for admins / non-teachers), and an admin flag.
 * Returns all-nulls when unauthenticated.
 */
export async function getRequestContext(): Promise<RequestContext> {
  const session = await auth();
  if (!session?.user) {
    return { session: null, teacher: null, isAdmin: false };
  }

  await connectDB();

  if (session.user.role === "admin") {
    return { session, teacher: null, isAdmin: true };
  }

  const teacher = await TeacherModel.findOne({ userId: session.user.id })
    .lean<TeacherType>()
    .exec();

  return { session, teacher, isAdmin: false };
}
