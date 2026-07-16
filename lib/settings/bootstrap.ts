import { connectDB } from "@/lib/db";
import { UserModel, type Role } from "@/lib/models";

/**
 * Create (or sync) an admin user from environment variables, driven by
 * ADMIN_EMAIL / ADMIN_NAME / ADMIN_PASSWORD in .env.local.
 *
 * The env values are treated as the source of truth for that login: if the
 * user already exists, its password hash (and name) are updated to match the
 * current env. This means changing ADMIN_PASSWORD in .env.local and
 * restarting always takes effect — without it, an earlier bootstrap would
 * have left a stale hash that no longer matches.
 *
 * No-op when the env vars are unset. Runs once per process (guarded by
 * `bootstrapped`); a server restart re-syncs from the latest .env.local.
 */
let bootstrapped = false;

const EMAIL_RE = /^[^@\s]+@[^@\s]+\.[^@\s]+$/;

/** Strip accidental surrounding quotes/whitespace a value might carry. */
function clean(raw: string | undefined): string {
  return (raw ?? "").replace(/^['"]|['"]$/g, "").trim();
}

export async function bootstrapAdminFromEnv(): Promise<void> {
  if (bootstrapped) return;
  bootstrapped = true;

  const email = clean(process.env.ADMIN_EMAIL);
  if (!email || !EMAIL_RE.test(email)) return;

  try {
    await connectDB();

    const name = clean(process.env.ADMIN_NAME) || "Administrator";
    const password = clean(process.env.ADMIN_PASSWORD);

    if (password.length < 8) {
      console.warn(
        "[bootstrap] ADMIN_PASSWORD must be at least 8 characters; skipping admin sync.",
      );
      return;
    }

    const { default: bcrypt } = await import("bcryptjs");
    const passwordHash = await bcrypt.hash(password, 10);

    // Upsert: create the admin if missing, otherwise keep the env password
    // authoritative so .env.local changes always take effect after a restart.
    await UserModel.findOneAndUpdate(
      { email: email.toLowerCase() },
      {
        $set: {
          name,
          email: email.toLowerCase(),
          passwordHash,
          role: "admin" as Role,
          teacherId: null,
          studentId: null,
        },
      },
      { upsert: true, returnDocument: "after", setDefaultsOnInsert: true },
    );
    console.log(`[bootstrap] Synced admin user from .env: ${email}`);
  } catch (err) {
    console.error("[bootstrap] Failed to sync admin user:", err);
  }
}
