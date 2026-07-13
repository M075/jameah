"use client";

import { useEffect, useState } from "react";
import { redeemMagicLink, type RedeemState } from "./actions";

export default function MagicSignIn({ token }: { token: string }) {
  const [state, setState] = useState<RedeemState>({});

  useEffect(() => {
    let active = true;
    (async () => {
      const res = await redeemMagicLink(token);
      if (!active) return;
      // On success the server action triggers a redirect, so reaching here
      // with no error means the link was rejected.
      if (res.error) setState(res);
    })();
    return () => {
      active = false;
    };
  }, [token]);

  if (state.error) {
    return (
      <>
        <h1 className="text-lg font-semibold text-red-800">Sign-in failed</h1>
        <p className="mt-2 text-sm text-gray-600">{state.error}</p>
        <a
          href="/login"
          className="mt-4 inline-block rounded-md bg-emerald-700 px-4 py-2 text-sm font-medium text-white hover:bg-emerald-800"
        >
          Back to sign in
        </a>
      </>
    );
  }

  return (
    <>
      <h1 className="text-lg font-semibold text-emerald-900">
        Signing you in…
      </h1>
      <p className="mt-2 text-sm text-gray-600">
        Please wait while we verify your link.
      </p>
      <div className="mt-4 flex justify-center">
        <div className="h-6 w-6 animate-spin rounded-full border-2 border-emerald-700 border-t-transparent" />
      </div>
    </>
  );
}
