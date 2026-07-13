"use client";

import { useActionState, useState } from "react";
import {
  createSubject,
  updateSubject,
  type AdminActionState,
} from "@/app/admin/actions";

const field =
  "w-full rounded-md border border-gray-300 px-3 py-2 text-sm text-gray-900";
const label = "block text-sm font-medium text-gray-700";

const YEARS = [1, 2, 3, 4, 5, 6];

export interface TeacherOption {
  _id: string;
  name: string;
}

export default function SubjectForm({
  id,
  name = "",
  type: initialType = "aalim",
  year,
  teacher = "",
  teachers = [],
}: {
  id?: string;
  name?: string;
  type?: "hifz" | "aalim";
  year?: number | null;
  teacher?: string;
  teachers?: TeacherOption[];
}) {
  const action = id ? updateSubject : createSubject;
  const [state, formAction, pending] = useActionState<AdminActionState, FormData>(
    action,
    {},
  );
  const [type, setType] = useState<"hifz" | "aalim">(
    initialType as "hifz" | "aalim",
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

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className={label}>
            Type <span className="text-red-500">*</span>
          </label>
          <select
            name="type"
            value={type}
            onChange={(e) => setType(e.target.value as "hifz" | "aalim")}
            className={field}
          >
            <option value="aalim">Aalim</option>
            <option value="hifz">Hifz</option>
          </select>
        </div>
        <div>
          <label className={label}>
            Year / class <span className="text-red-500">*</span>
          </label>
          <select
            name="year"
            defaultValue={year ? String(year) : ""}
            required
            className={field}
          >
            <option value="">— select —</option>
            {YEARS.map((y) => (
              <option key={y} value={y}>
                Year {y}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div>
        <label className={label}>Teacher</label>
        <select name="teacher" defaultValue={teacher} className={field}>
          <option value="">— unassigned —</option>
          {teachers.map((t) => (
            <option key={t._id} value={t._id}>
              {t.name}
            </option>
          ))}
        </select>
        <p className="mt-1 text-xs text-gray-400">
          Assigned by admin. The teacher sees every student in this
          subject&apos;s year.
        </p>
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
