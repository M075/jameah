"use client";

import { useActionState } from "react";
import {
  createSubject,
  updateSubject,
  type AdminActionState,
} from "@/app/admin/actions";

const field =
  "w-full rounded-md border border-gray-300 px-3 py-2 text-sm text-gray-900";
const label = "block text-sm font-medium text-gray-700";

export default function SubjectForm({
  id,
  name = "",
  type = "aalim",
}: {
  id?: string;
  name?: string;
  type?: "hifz" | "aalim";
}) {
  const action = id ? updateSubject : createSubject;
  const [state, formAction, pending] = useActionState<AdminActionState, FormData>(
    action,
    {},
  );

  return (
    <form action={formAction} className="max-w-lg space-y-4">
      {id ? <input type="hidden" name="subjectId" value={id} /> : null}

      <div>
        <label className={label}>
          Subject name <span className="text-red-500">*</span>
        </label>
        <input
          name="name"
          required
          defaultValue={name}
          className={field}
          placeholder="e.g. Al-Nahw Al-Wadih"
        />
      </div>

      <div>
        <label className={label}>
          Type <span className="text-red-500">*</span>
        </label>
        <select name="type" defaultValue={type} className={field}>
          <option value="aalim">Aalim</option>
          <option value="hifz">Hifz</option>
        </select>
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
        {pending ? "Saving…" : id ? "Save changes" : "Add subject"}
      </button>
    </form>
  );
}
