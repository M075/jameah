"use client";

import { useActionState, useState } from "react";
import {
  createTeacher,
  updateTeacher,
  type AdminActionState,
} from "@/app/admin/actions";

const field =
  "w-full rounded-md border border-gray-300 px-3 py-2 text-sm text-gray-900";
const label = "block text-sm font-medium text-gray-700";

export default function TeacherForm({
  id,
  name = "",
  type: initialType = "Aalim",
  email = "",
}: {
  id?: string;
  name?: string;
  type?: "Hifz" | "Aalim";
  email?: string;
}) {
  const action = id ? updateTeacher : createTeacher;
  const [state, formAction, pending] = useActionState<
    AdminActionState,
    FormData
  >(action, {});
  const [type, setType] = useState<"Hifz" | "Aalim">(initialType);
  const [createLogin, setCreateLogin] = useState<boolean>(Boolean(email));
  // Default to "password" so the password field is visible out of the box — the
  // user can switch to a magic link if they prefer. This avoids the case where
  // someone opens the edit page to add a password but sees no password field.
  const [loginMethod, setLoginMethod] =
    useState<"magic" | "password">("password");
  const [showPassword, setShowPassword] = useState(false);

  return (
    <form action={formAction} className="max-w-lg space-y-4">
      {id ? <input type="hidden" name="teacherId" value={id} /> : null}

      <div>
        <label className={label}>
          Name <span className="text-red-500">*</span>
        </label>
        <input
          name="name"
          required
          defaultValue={name}
          className={field}
          placeholder="Full name"
        />
      </div>

      <div>
        <label className={label}>
          Type <span className="text-red-500">*</span>
        </label>
        <select
          name="type"
          value={type}
          onChange={(e) => setType(e.target.value as "Hifz" | "Aalim")}
          className={field}
        >
          <option value="Hifz">Hifz</option>
          <option value="Aalim">Aalim</option>
        </select>
      </div>

      <div className="rounded-md border border-gray-200 p-3">
        <label className="flex items-center gap-2 text-sm font-medium text-gray-700">
          <input
            type="checkbox"
            name="createLogin"
            value="on"
            checked={createLogin}
            onChange={(e) => setCreateLogin(e.target.checked)}
          />
          Create a login account for this teacher
        </label>

        {createLogin ? (
          <div className="mt-3 grid gap-3">
            {email ? (
              <p className="text-xs text-gray-500">
                This teacher has a login. 
              </p>
            ) : null}
            <div>
              <label className={label}>Email</label>
              <input
                type="email"
                name="email"
                defaultValue={email}
                className={field}
                placeholder="teacher@gmail.com"
              />

            </div>
            <fieldset className="border-0 p-0">
              <legend className={`${label} mb-1`}>Sign-in method</legend>
              <label className="flex items-center gap-2 text-sm text-gray-700">
                <input
                  type="radio"
                  name="loginMethod"
                  value="magic"
                  checked={loginMethod === "magic"}
                  onChange={() => setLoginMethod("magic")}
                />
                Email a sign-in link (no password required)
              </label>
              <label className="mt-1 flex items-center gap-2 text-sm text-gray-700">
                <input
                  type="radio"
                  name="loginMethod"
                  value="password"
                  checked={loginMethod === "password"}
                  onChange={() => setLoginMethod("password")}
                />
                Set a password now
              </label>
            </fieldset>
            {loginMethod === "password" ? (
              <div>
                <label className={label}>Password (min 8 chars)</label>
                <div className="relative">
                  <button
                    type="button"
                    onClick={() => setShowPassword((v) => !v)}
                    aria-label={showPassword ? "Hide password" : "Show password"}
                    className="absolute inset-y-0 right-0 flex items-center pr-3 text-gray-500 hover:text-gray-700"
                  >
                    {showPassword ? (
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
                          d="M3.98 8.223A10.477 10.477 0 0 0 1.934 12C3.226 16.338 7.244 19.5 12 19.5c.993 0 1.953-.138 2.863-.395M6.228 6.228A10.451 10.451 0 0 1 12 4.5c4.756 0 8.773 3.162 10.065 7.498a10.522 10.522 0 0 1-4.293 5.774M6.228 6.228 3 3m3.228 3.228 3.65 3.65m7.894 7.894L21 21m-3.228-3.228-3.65-3.65m0 0a3 3 0 1 0-4.243-4.243m4.243 4.243-4.243-4.243"
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
                          d="M2.036 12.322a1.012 1.012 0 0 1 0-.639C3.423 7.51 7.36 4.5 12 4.5c4.638 0 8.573 3.007 9.963 7.178.07.207.07.431 0 .639C20.577 16.49 16.64 19.5 12 19.5c-4.638 0-8.573-3.007-9.963-7.178Z"
                        />
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          d="M15 12a3 3 0 1 1-6 0 3 3 0 0 1 6 0Z"
                        />
                      </svg>
                    )}
                  </button>
                  <input
                    type={showPassword ? "text" : "password"}
                    name="password"
                    className={`${field} pr-10`}
                    placeholder="••••••••"
                  />
                </div>
              </div>
            ) : (
              <p className="text-xs text-gray-500">
                We&apos;ll email a secure sign-in link. It expires after 15 minutes
                and can only be used once per request.
              </p>
            )}
          </div>
        ) : null}
      </div>

      {state.errors ? (
        <ul className="space-y-1 rounded-md bg-red-50 px-3 py-2 text-sm text-red-700">
          {state.errors.map((e, i) => (
            <li key={i}>• {e}</li>
          ))}
        </ul>
      ) : null}

      <button
        type="submit"
        disabled={pending}
        className="rounded-md bg-emerald-700 px-4 py-2 text-sm font-medium text-white hover:bg-emerald-800 disabled:opacity-60"
      >
        {pending ? "Saving…" : id ? "Save changes" : "Add teacher"}
      </button>
    </form>
  );
}
