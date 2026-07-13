"use client";

import { useActionState } from "react";
import {
  createTerm,
  updateTerm,
  type AdminActionState,
} from "@/app/admin/actions";

const field =
  "w-full rounded-md border border-gray-300 px-3 py-2 text-sm text-gray-900";
const label = "block text-sm font-medium text-gray-700";

export default function TermForm({
  id,
  name = "",
  academicYear = "",
  startDate = "",
  endDate = "",
  active = false,
}: {
  id?: string;
  name?: string;
  academicYear?: string;
  startDate?: string;
  endDate?: string;
  active?: boolean;
}) {
  const action = id ? updateTerm : createTerm;
  const [state, formAction, pending] = useActionState<
    AdminActionState,
    FormData
  >(action, {});

  return (
    <form action={formAction} className="grid gap-4 sm:grid-cols-2">
      {id ? <input type="hidden" name="termId" value={id} /> : null}

      <div className="sm:col-span-2">
        <label className={label}>
          Name <span className="text-red-500">*</span>
        </label>
        <input
          name="name"
          required
          defaultValue={name}
          className={field}
          placeholder="Term 1"
        />
      </div>

      <div className="sm:col-span-2">
        <label className={label}>Academic year</label>
        <input
          name="academicYear"
          defaultValue={academicYear}
          className={field}
          placeholder="1447H"
        />
      </div>

      <div>
        <label className={label}>Start date</label>
        <input
          type="date"
          name="startDate"
          defaultValue={startDate}
          className={field}
        />
      </div>

      <div>
        <label className={label}>End date</label>
        <input
          type="date"
          name="endDate"
          defaultValue={endDate}
          className={field}
        />
      </div>

      <label className="sm:col-span-2 flex items-center gap-2 text-sm font-medium text-gray-700">
        <input
          type="checkbox"
          name="active"
          value="on"
          defaultChecked={active}
        />
        Set as the active term
      </label>

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
          {pending ? "Saving…" : id ? "Save term" : "Add term"}
        </button>
      </div>
    </form>
  );
}
