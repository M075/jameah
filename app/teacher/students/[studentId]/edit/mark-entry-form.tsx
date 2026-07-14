"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { saveReport, type SaveResult } from "@/app/teacher/actions";
import {
  buildReportTemplate,
  computeResult,
  markFieldId,
  remarksFieldId,
  type ReportData,
  type ReportTemplate,
} from "@/lib/reports";
import type { ProgrammeKey } from "@/lib/models";

export interface SubjectInput {
  id: string;
  name: string;
}

interface Props {
  studentId: string;
  termId: string;
  programme: ProgrammeKey;
  subjects: SubjectInput[];
  initialData: ReportData;
  /** Where to send the user after a successful save. */
  returnUrl: string;
}

export default function MarkEntryForm({
  studentId,
  termId,
  programme,
  subjects,
  initialData,
  returnUrl,
}: Props) {
  const router = useRouter();
  const [marks, setMarks] = useState<Record<string, string>>(() => {
    const m: Record<string, string> = {};
    for (const s of subjects) {
      const v = initialData[markFieldId(s.id)];
      m[s.id] = v === undefined || v === null ? "" : String(v);
    }
    return m;
  });
  const [remarks, setRemarks] = useState<Record<string, string>>(() => {
    const r: Record<string, string> = {};
    for (const s of subjects) {
      const v = initialData[remarksFieldId(s.id)];
      r[s.id] = typeof v === "string" ? v : "";
    }
    return r;
  });
  const [pending, setPending] = useState(false);
  const [result, setResult] = useState<SaveResult | null>(null);

  const template: ReportTemplate = buildReportTemplate(programme, subjects);

  // Build the live preview from the current state.
  const previewData: ReportData = {};
  for (const s of subjects) {
    const mk = marks[s.id] ?? "";
    previewData[markFieldId(s.id)] = mk === "" ? "" : Number(mk);
    previewData[remarksFieldId(s.id)] = remarks[s.id] ?? "";
  }
  const preview = computeResult(template, previewData);

  function setMark(id: string, value: string) {
    setMarks((prev) => ({ ...prev, [id]: value }));
    setResult(null);
  }
  function setRemark(id: string, value: string) {
    setRemarks((prev) => ({ ...prev, [id]: value }));
    setResult(null);
  }

  async function handleSave() {
    setPending(true);
    setResult(null);
    try {
      const payload: ReportData = {};
      for (const s of subjects) {
        const mk = marks[s.id] ?? "";
        payload[markFieldId(s.id)] = mk === "" ? "" : Number(mk);
        payload[remarksFieldId(s.id)] = remarks[s.id] ?? "";
      }
      const res = await saveReport({
        studentId,
        termId,
        status: "published",
        data: payload,
      });
      if (res.ok) {
        router.push(returnUrl);
        return;
      }
      setResult(res);
    } catch {
      setResult({ ok: false, errors: ["Something went wrong. Please retry."] });
    } finally {
      setPending(false);
    }
  }

  if (subjects.length === 0) {
    return (
      <p className="rounded-lg bg-gray-50 px-4 py-6 text-center text-sm text-gray-400">
        This student has no subjects assigned.
      </p>
    );
  }

  return (
    <div className="grid gap-6 lg:grid-cols-[1fr_18rem]">
      <div className="space-y-4">
        {subjects.map((s) => (
          <div
            key={s.id}
            className="rounded-xl border border-gray-200 bg-white p-4"
          >
            <div className="flex items-start justify-between gap-4">
              <label
                htmlFor={`mark-${s.id}`}
                className="font-medium text-emerald-900"
              >
                {s.name}
              </label>
              <div className="flex items-center gap-1">
                <input
                  id={`mark-${s.id}`}
                  type="number"
                  min={0}
                  max={100}
                  value={marks[s.id] ?? ""}
                  onChange={(e) => setMark(s.id, e.target.value)}
                  className="w-24 rounded-md border border-gray-300 px-2 py-1.5 text-right text-sm"
                />
                <span className="text-sm text-gray-400">/ 100</span>
              </div>
            </div>
            <textarea
              rows={2}
              placeholder="Teacher's remark"
              value={remarks[s.id] ?? ""}
              onChange={(e) => setRemark(s.id, e.target.value)}
              className="mt-2 w-full rounded-md border border-gray-300 px-2 py-1.5 text-sm"
            />
          </div>
        ))}
      </div>

      {/* Live summary + actions */}
      <aside className="space-y-4 lg:sticky lg:top-4 lg:self-start">
        <div className="rounded-xl border border-gray-200 bg-white p-4">
          <div className="text-xs uppercase tracking-wide text-gray-400">
            Live result
          </div>
          <div className="mt-1 text-3xl font-semibold text-emerald-800">
            {preview.percent === null ? "—" : `${preview.percent}%`}
          </div>
          <div className="text-sm text-gray-500">Grade {preview.grade}</div>
        </div>

        {result && !result.ok && result.errors ? (
          <ul className="space-y-1 rounded-md bg-red-50 px-3 py-2 text-sm text-red-700">
            {result.errors.map((e, i) => (
              <li key={i}>• {e}</li>
            ))}
          </ul>
        ) : null}

        <div className="flex flex-col gap-2">
          <button
            type="button"
            disabled={pending}
            onClick={handleSave}
            className="rounded-md bg-emerald-700 px-4 py-2 text-sm font-medium text-white hover:bg-emerald-800 disabled:opacity-60"
          >
            {pending ? "Publishing…" : "Publish marks"}
          </button>
        </div>
      </aside>
    </div>
  );
}
