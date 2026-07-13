"use client";

import { useState } from "react";
import { saveReport, type SaveResult } from "@/app/teacher/actions";
import { computeResult, type ReportData, type ReportTemplate } from "@/lib/reports";

interface Props {
  template: ReportTemplate;
  initialData: ReportData;
  studentId: string;
  termId: string;
  subjectId: string;
}

export default function MarkEntryForm({
  template,
  initialData,
  studentId,
  termId,
  subjectId,
}: Props) {
  const [data, setData] = useState<ReportData>(initialData ?? {});
  const [pending, setPending] = useState(false);
  const [result, setResult] = useState<SaveResult | null>(null);

  const preview = computeResult(template, data);

  function setField(id: string, value: string | number) {
    setData((prev) => ({ ...prev, [id]: value }));
    setResult(null);
  }

  async function handleSave(status: "draft" | "published") {
    setPending(true);
    setResult(null);
    try {
      const res = await saveReport({
        studentId,
        termId,
        subjectId,
        status,
        data,
      });
      setResult(res);
    } catch {
      setResult({ ok: false, errors: ["Something went wrong. Please retry."] });
    } finally {
      setPending(false);
    }
  }

  return (
    <div className="grid gap-6 lg:grid-cols-[1fr_18rem]">
      <div className="space-y-6">
        {template.sections.map((section) => (
          <section
            key={section.id}
            className="rounded-xl border border-gray-200 bg-white p-4"
          >
            <h3 className="mb-3 font-semibold text-gray-800">
              {section.title}
            </h3>
            <div className="space-y-4">
              {section.fields.map((field) => (
                <div key={field.id}>
                  <label className="block text-sm font-medium text-gray-700">
                    {field.label}
                    {field.type === "score" && field.max ? (
                      <span className="ml-1 text-xs font-normal text-gray-400">
                        / {field.max}
                      </span>
                    ) : null}
                  </label>
                  {field.hint ? (
                    <p className="mb-1 text-xs text-gray-400">{field.hint}</p>
                  ) : null}

                  {field.type === "score" ? (
                    <input
                      type="number"
                      min={0}
                      max={field.max ?? undefined}
                      value={
                        data[field.id] === undefined ? "" : String(data[field.id])
                      }
                      onChange={(e) =>
                        setField(
                          field.id,
                          e.target.value === ""
                            ? ""
                            : Number(e.target.value),
                        )
                      }
                      className="w-32 rounded-md border border-gray-300 px-2 py-1.5 text-sm"
                    />
                  ) : field.type === "grade" ? (
                    <select
                      value={String(data[field.id] ?? "")}
                      onChange={(e) => setField(field.id, e.target.value)}
                      className="rounded-md border border-gray-300 px-2 py-1.5 text-sm"
                    >
                      <option value="">— select —</option>
                      {field.options?.map((o) => (
                        <option key={o.value} value={o.value}>
                          {o.label}
                        </option>
                      ))}
                    </select>
                  ) : (
                    <textarea
                      rows={3}
                      value={String(data[field.id] ?? "")}
                      onChange={(e) => setField(field.id, e.target.value)}
                      className="w-full rounded-md border border-gray-300 px-2 py-1.5 text-sm"
                    />
                  )}
                </div>
              ))}
            </div>
          </section>
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
          <div className="text-sm text-gray-500">
            Grade {preview.grade}
          </div>
        </div>

        {result?.ok ? (
          <div className="rounded-md bg-emerald-50 px-3 py-2 text-sm text-emerald-800">
            Saved as <strong>{result.status}</strong>.
          </div>
        ) : null}
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
            onClick={() => handleSave("draft")}
            className="rounded-md border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-100 disabled:opacity-60"
          >
            {pending ? "Saving…" : "Save as draft"}
          </button>
          <button
            type="button"
            disabled={pending}
            onClick={() => handleSave("published")}
            className="rounded-md bg-emerald-700 px-4 py-2 text-sm font-medium text-white hover:bg-emerald-800 disabled:opacity-60"
          >
            {pending ? "Publishing…" : "Publish"}
          </button>
        </div>
      </aside>
    </div>
  );
}
