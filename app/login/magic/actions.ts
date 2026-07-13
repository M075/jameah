"use server";

import { signIn } from "@/auth";
import { AuthError } from "next-auth";

export interface RedeemState {
  error?: string;
}

/**
 * Server action invoked by the magic-link page. Redeems the signed token
 * through the "magic" credentials provider. On success NextAuth throws a
 * redirect (re-thrown so navigation occurs); on a bad/expired token we
 * surface a message.
 */
export async function redeemMagicLink(token: string): Promise<RedeemState> {
  try {
    await signIn("magic", { token, redirectTo: "/" });
  } catch (error) {
    if (error instanceof AuthError) {
      return {
        error:
          "This sign-in link is invalid or has expired. Please request a new one.",
      };
    }
    // Redirect errors must propagate for NextAuth to perform the navigation.
    throw error;
  }
  return {};
}
