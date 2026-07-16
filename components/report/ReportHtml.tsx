import type { ReportContext } from "@/lib/reports/loadReport";
import { markFieldId, remarksFieldId } from "@/lib/reports";

function markDisplay(value: unknown): string {
  if (value === undefined || value === null || value === "") return "—";
  return `${value} / 100`;
}

export default function ReportHtml({ ctx }: { ctx: ReportContext }) {
  const { student, term, template, result, data, subjects, signature } = ctx;

  return (
    <div className="rounded-xl border border-gray-200 bg-white p-8 print:border-0 print:p-0">
      <header className="border-b border-gray-200 pb-4">
        <h1 className="text-2xl font-bold text-emerald-900">
          Jameah Mahmoodiyah Progress Report
        </h1>
        <p className="text-sm text-gray-500">
          {template.label} — {term?.name} {term?.academicYear}
        </p>
      </header>

      <dl className="mt-4 grid grid-cols-2 gap-x-6 gap-y-2 text-sm sm:grid-cols-3">
        <div>
          <dt className="text-gray-400">Student</dt>
          <dd className="font-medium text-gray-800">{student?.name}</dd>
        </div>
        <div>
          <dt className="text-gray-400">Grade</dt>
          <dd className="font-medium text-gray-800">{student?.grade}</dd>
        </div>
        
      </dl>

      {/* Overall summary */}
      <div className="mt-6 flex items-center gap-6 rounded-lg bg-emerald-50 px-5 py-4">
        <div>
          <div className="text-xs uppercase tracking-wide text-emerald-700">
            Overall
          </div>
          <div className="text-3xl font-bold text-emerald-900">
            {result.percent === null ? "—" : `${result.percent}%`}
          </div>
        </div>
        <div className="text-center">
          <div className="text-xs uppercase tracking-wide text-emerald-700">
            Grade
          </div>
          <div className="text-3xl font-bold text-emerald-900">
            {result.grade}
          </div>
        </div>
      </div>

      {/* Subjects: name left, mark right, remark below */}
      <div className="mt-6">
        <h2 className="font-semibold text-gray-800">Subjects</h2>
        <div className="mt-2 divide-y divide-gray-100">
          {subjects.map((s) => {
            const mark = data[markFieldId(s.id)];
            const remark = data[remarksFieldId(s.id)];
            return (
              <div key={s.id} className="py-2.5">
                <div className="flex items-baseline justify-between gap-4">
                  <span className="font-medium text-gray-800">
                    {s.teacher ? `${s.name} — ${s.teacher}` : s.name}
                  </span>
                  <span className="font-medium text-gray-800">
                    {markDisplay(mark)}
                  </span>
                </div>
                {remark ? (
                  <p className="mt-1 text-sm text-gray-600">{remark}</p>
                ) : null}
              </div>
            );
          })}
          {subjects.length === 0 ? (
            <p className="py-3 text-sm text-gray-400">
              No subjects assigned to this student.
            </p>
          ) : null}
        </div>
      </div>

      <footer className="mt-8 border-t border-gray-200 pt-3 text-xs text-gray-400">
        <div className="flex items-end justify-between gap-6">
          <div>
            <div className="mb-1 text-[10px] uppercase tracking-wide text-gray-400">
              Principal&apos;s signature
            </div>
            {signature ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={signature}
                alt="Principal's signature"
                className="h-14 max-w-[180px] object-contain"
              />
            ) : (
              <div className="h-14 w-44 border-b border-gray-300" />
            )}
          </div>
          <div className="shrink-0 text-right">
            Generated on {new Date().toLocaleDateString()} · Jameah Mahmoodiyah
          </div>
        </div>
      </footer>
    </div>
  );
}
