"use client";

import { useActionState, useState } from "react";
import { updateStudent, type AdminActionState } from "@/app/admin/actions";

const field =
  "w-full rounded-md border border-gray-300 px-3 py-2 text-sm text-gray-900";
const label = "block text-sm font-medium text-gray-700";

const YEARS = [1, 2, 3, 4, 5, 6];

export default function StudentDetailsForm({
  studentId,
  studentCode,
  name,
  year,
  programme,
}: {
  studentId: string;
  studentCode: string;
  name: string;
  year: number | null;
  programme: string;
}) {
  const [state, formAction, pending] = useActionState<
    AdminActionState,
    FormData
  >(updateStudent, {});
  const [prog, setProg] = useState(programme);

  return (
    <form action={formAction} className="mt-4 grid gap-4 sm:grid-cols-2">
      <input type="hidden" name="studentId" value={studentId} />
      <div className="sm:col-span-2">
        <label className={label}>Student code</label>
        <input
          name="studentCode"
          defaultValue={studentCode}
          className="mt-1 w-full rounded-md border border-gray-300 px-3 py-2 text-sm"
          placeholder="auto-generated if left blank"
        />
      </div>
      <div className="sm:col-span-2">
        <label className={label}>
          Name <span className="text-red-500">*</span>
        </label>
        <input
          name="name"
          required
          defaultValue={name}
          className="mt-1 w-full rounded-md border border-gray-300 px-3 py-2 text-sm"
        />
      </div>
      <div>
        <label className={label}>
          Programme <span className="text-red-500">*</span>
        </label>
        <select
          name="programme"
          required
          value={prog}
          onChange={(e) => setProg(e.target.value)}
          className="mt-1 w-full rounded-md border border-gray-300 px-3 py-2 text-sm"
        >
          <option value="">— select —</option>
          <option value="hifz">Hifz</option>
          <option value="aalim">Aalim</option>
        </select>
      </div>
      {prog === "aalim" ? (
        <div>
          <label className={label}>
            Class / year <span className="text-red-500">*</span>
          </label>
          <select
            name="year"
            required
            defaultValue={year ? String(year) : ""}
            className="mt-1 w-full rounded-md border border-gray-300 px-3 py-2 text-sm"
          >
            <option value="">— select —</option>
            {YEARS.map((y) => (
              <option key={y} value={y}>
                Year {y}
              </option>
            ))}
          </select>
        </div>
      ) : null}

      {state.errors ? (
        <ul className="sm:col-span-2 space-y-1 rounded-md bg-red-50 px-3 py-2 text-sm text-red-700">
          {state.errors.map((e, i) => (
            <li key={i}>• {e}</li>
          ))}
        </ul>
      ) : null}

      <div className="sm:col-span-2">
        <button
          type="submit"
          disabled={pending}
          className="rounded-md bg-emerald-700 px-4 py-2 text-sm font-medium text-white hover:bg-emerald-800 disabled:opacity-60"
        >
          {pending ? "Saving…" : "Save details"}
        </button>
      </div>
    </form>
  );
}
