"use client";

import { useActionState, useState } from "react";
import {
  authenticate,
  requestMagicLink,
  type LoginState,
  type MagicLinkState,
} from "./actions";

const field =
  "w-full rounded-md border border-gray-300 px-3 py-2 text-base text-gray-900";
const label = "block text-sm font-medium text-gray-700";

function EyeIcon({ open }: { open: boolean }) {
  return open ? (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      fill="none"
      viewBox="0 0 24 24"
      strokeWidth={1.5}
      stroke="currentColor"
      className="h-5 w-5"
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M2.036 12.322a1.012 1.012 0 0 1 0-.639C3.423 7.51 7.36 4.5 12 4.5c4.638 0 8.573 3.007 9.963 7.178.07.207.07.431 0 .639C20.577 16.49 16.64 19.5 12 19.5c-4.638 0-8.573-3.007-9.963-7.178Z"
      />
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M15 12a3 3 0 1 1-6 0 3 3 0 0 1 6 0Z"
      />
    </svg>
  ) : (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      fill="none"
      viewBox="0 0 24 24"
      strokeWidth={1.5}
      stroke="currentColor"
      className="h-5 w-5"
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M3.98 8.223A10.477 10.477 0 0 0 1.934 12C3.226 16.338 7.244 19.5 12 19.5c.993 0 1.953-.138 2.863-.395M6.228 6.228A10.451 10.451 0 0 1 12 4.5c4.756 0 8.773 3.162 10.065 7.498a10.523 10.523 0 0 1-4.293 5.774M6.228 6.228 3 3m3.228 3.228 3.65 3.65m7.894 7.894L21 21m-3.228-3.228-3.65-3.65m0 0a3 3 0 1 0-4.243-4.243m4.243 4.243L9.88 9.88"
      />
    </svg>
  );
}

export default function LoginForm({ redirectTo }: { redirectTo: string }) {
  const [mode, setMode] = useState<"magic" | "password">("magic");
  const [magicState, magicAction, magicPending] = useActionState<MagicLinkState, FormData>(
    requestMagicLink,
    {},
  );
  const [pwState, pwAction, pwPending] = useActionState<LoginState, FormData>(
    authenticate,
    {},
  );
  const [showPassword, setShowPassword] = useState(false);

  if (mode === "magic") {
    return (
      <div className="space-y-4">
        <div>
          <h2 className="text-sm font-semibold text-emerald-900">
            Sign in with a link
          </h2>
          <p className="mt-1 text-sm text-gray-600">
            Enter your email and we&apos;ll send you a secure sign-in link. No
            password needed.
          </p>
        </div>

        {magicState.sent ? (
          <div className="rounded-md bg-emerald-50 px-3 py-3 text-sm text-emerald-800">
            If an account exists for{" "}
            <span className="font-medium">{magicState.email}</span>, we&apos;ve
            sent a sign-in link. Check your inbox (and spam folder).
          </div>
        ) : null}
        {magicState.error ? (
          <p className="rounded-md bg-red-50 px-3 py-2 text-sm text-red-700">
            {magicState.error}
          </p>
        ) : null}

        <form action={magicAction} className="flex flex-col gap-4">
          <label className={label}>
            Email
            <input
              name="email"
              type="email"
              required
              autoComplete="email"
              placeholder="you@example.com"
              className={field}
            />
          </label>
          <button
            type="submit"
            disabled={magicPending}
            className="rounded-md bg-emerald-700 px-4 py-2 font-medium text-white hover:bg-emerald-800 disabled:opacity-60"
          >
            {magicPending ? "Sending…" : "Send sign-in link"}
          </button>
        </form>

        <button
          type="button"
          onClick={() => setMode("password")}
          className="text-sm font-medium text-emerald-700 hover:underline"
        >
          Use a password instead
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div>
        <h2 className="text-sm font-semibold text-emerald-900">
          Sign in with password
        </h2>
      </div>

      <form action={pwAction} className="flex flex-col gap-4">
        <input type="hidden" name="redirectTo" value={redirectTo} />
        <label className={label}>
          Email
          <input
            name="email"
            type="email"
            required
            autoComplete="email"
            placeholder="you@example.com"
            className={field}
          />
        </label>
        <label className={label}>
          Password
          <div className="relative">
            <button
              type="button"
              onClick={() => setShowPassword((v) => !v)}
              aria-label={showPassword ? "Hide password" : "Show password"}
              className="absolute inset-y-0 right-0 flex items-center pr-3 text-gray-500 hover:text-gray-700"
            >
              <EyeIcon open={showPassword} />
            </button>
            <input
              name="password"
              type={showPassword ? "text" : "password"}
              required
              autoComplete="current-password"
              placeholder="••••••••"
              className={`${field} pr-10`}
            />
          </div>
        </label>
        {pwState.error ? (
          <p className="rounded-md bg-red-50 px-3 py-2 text-sm text-red-700">
            {pwState.error}
          </p>
        ) : null}
        <button
          type="submit"
          disabled={pwPending}
          className="rounded-md bg-emerald-700 px-4 py-2 font-medium text-white hover:bg-emerald-800 disabled:opacity-60"
        >
          {pwPending ? "Signing in…" : "Sign in"}
        </button>
      </form>

      <button
        type="button"
        onClick={() => setMode("magic")}
        className="text-sm font-medium text-emerald-700 hover:underline"
      >
        Email me a sign-in link instead
      </button>
    </div>
  );
}
