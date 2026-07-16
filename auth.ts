import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";
import bcrypt from "bcryptjs";
import { z } from "zod";
// Type-only import — erased at compile time, so mongoose is NOT pulled into
// the edge middleware that imports this module.
import type { Role } from "@/lib/models";
import { verifyMagicToken } from "@/lib/auth/magicToken";

const credentialsSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
});

/**
 * NextAuth v5 configuration with a single credentials provider that verifies
 * the user against the MongoDB `User` collection (bcrypt-hashed password).
 * The user's role and id are embedded in the JWT and exposed on the session.
 *
 * The Mongoose models / connection are imported lazily inside `authorize` so
 * that this module can be safely imported from edge middleware (which only
 * reads the session JWT) without loading mongoose at module-eval time.
 */
export const { handlers, auth, signIn, signOut } = NextAuth({
  trustHost: true,
  secret: process.env.AUTH_SECRET,
  session: { strategy: "jwt" },
  pages: {
    signIn: "/login",
  },
  providers: [
    Credentials({
      name: "Credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      authorize: async (raw) => {
        const parsed = credentialsSchema.safeParse(raw);
        if (!parsed.success) return null;

        const email = parsed.data.email.toLowerCase();
        const password = parsed.data.password;

        const { connectDB } = await import("@/lib/db");
        const { UserModel } = await import("@/lib/models");

        await connectDB();
        // Create the .env admin on demand if it doesn't exist yet. Loaded
        // lazily (dynamic import) so mongoose is NOT pulled into the edge
        // middleware that imports this module.
        const { bootstrapAdminFromEnv } = await import(
          "@/lib/settings/bootstrap"
        );
        await bootstrapAdminFromEnv();
        const user = await UserModel.findOne({ email })
          .select("+passwordHash")
          .lean();

        if (!user) return null;
        // Passwordless (magic-link) accounts have no passwordHash.
        if (!user.passwordHash) return null;

        const valid = await bcrypt.compare(password, user.passwordHash);
        if (!valid) return null;

        const role = user.role as Role;
        return {
          id: user._id.toString(),
          email: user.email,
          name: user.name,
          role,
        };
      },
    }),
    Credentials({
      id: "magic",
      name: "Magic Link",
      credentials: {
        token: { label: "Token", type: "text" },
      },
      authorize: async (raw) => {
        const token = typeof raw?.token === "string" ? raw.token : "";
        if (!token) return null;

        const claims = await verifyMagicToken(token);
        if (!claims) return null;

        const { connectDB } = await import("@/lib/db");
        const { UserModel } = await import("@/lib/models");

        await connectDB();
        const user = await UserModel.findById(claims.sub).lean();
        if (!user) return null;

        const role = user.role as Role;
        return {
          id: user._id.toString(),
          email: user.email,
          name: user.name,
          role,
        };
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id;
        token.role = (user as { role?: Role }).role;
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        session.user.id = token.id as string;
        session.user.role = token.role as Role;
      }
      return session;
    },
  },
});
