"use server";

import { signIn } from "@/auth";
import { AuthError } from "next-auth";
import { headers } from "next/headers";
import { connectDB } from "@/lib/db";
import { UserModel, type Role } from "@/lib/models";
import { signMagicToken } from "@/lib/auth/magicToken";
import { sendLoginEmail } from "@/lib/email/sendEmail";

export interface LoginState {
  error?: string;
}

export interface MagicLinkState {
  error?: string;
  sent?: boolean;
  email?: string;
}

const EMAIL_RE = /^[^@\s]+@[^@\s]+\.[^@\s]+$/;

/**
 * Server action for the "email me a sign-in link" flow. Looks up the user,
 * mints a short-lived magic token, and emails it. Responds generically
 * (always "sent") so the form can't be used to enumerate which emails have
 * accounts.
 */
export async function requestMagicLink(
  _prev: MagicLinkState,
  formData: FormData,
): Promise<MagicLinkState> {
  const email = String(formData.get("email") ?? "").trim().toLowerCase();
  if (!EMAIL_RE.test(email)) {
    return { error: "Please enter a valid email address." };
  }

  await connectDB();
  const user = await UserModel.findOne({ email }).lean();

  // Always report success to avoid leaking account existence.
  if (!user) {
    return { sent: true, email };
  }

  try {
    const token = await signMagicToken({
      sub: user._id.toString(),
      email,
      role: user.role as Role,
    });
    const h = await headers();
    const host = h.get("x-forwarded-host") ?? h.get("host") ?? "localhost:3000";
    const proto =
      h.get("x-forwarded-proto") ?? (host.startsWith("localhost") ? "http" : "https");
    const url = `${proto}://${host}/login/magic?token=${encodeURIComponent(token)}`;
    await sendLoginEmail({ to: email, name: user.name, url });
  } catch (err) {
    console.error("Failed to send magic login email:", err);
    return {
      error:
        "We couldn't send the sign-in email right now. Please try again or use your password.",
    };
  }

  return { sent: true, email };
}

/**
 * Server action invoked by the password login form. On success NextAuth
 * throws a redirect (re-thrown so navigation happens); on failure we surface
 * a message.
 */
export async function authenticate(
  _prev: LoginState,
  formData: FormData,
): Promise<LoginState> {
  const email = String(formData.get("email") ?? "").trim();
  const password = String(formData.get("password") ?? "");
  const redirectTo = String(formData.get("redirectTo") ?? "/");

  try {
    await signIn("credentials", { email, password, redirectTo });
  } catch (error) {
    if (error instanceof AuthError) {
      return { error: "Invalid email or password." };
    }
    // Redirect errors must propagate for NextAuth to perform the navigation.
    throw error;
  }
  return { error: undefined };
}
