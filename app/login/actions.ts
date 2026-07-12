"use server";

import { signIn } from "@/auth";
import { AuthError } from "next-auth";

export interface LoginState {
  error?: string;
}

/**
 * Server action invoked by the login form. On success NextAuth throws a
 * redirect (re-thrown so navigation happens); on failure we surface a message.
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
