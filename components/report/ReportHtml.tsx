import type { ReportContext } from "@/lib/reports/loadReport";
import type { ReportField } from "@/lib/reports";

function displayValue(field: ReportField, value: unknown): string {
  if (value === undefined || value === null || value === "") return "—";
  if (field.type === "score") {
    return `${value} / ${field.max ?? 100}`;
  }
  if (field.type === "grade") {
    const opt = field.options?.find((o) => o.value === String(value));
    return opt ? opt.label : String(value);
  }
  return String(value);
}

export default function ReportHtml({ ctx }: { ctx: ReportContext }) {
  const { report, student, term, teacher, subject, template, result, data } =
    ctx;

  return (
    <div className="rounded-xl border border-gray-200 bg-white p-8 print:border-0 print:p-0">
      <header className="border-b border-gray-200 pb-4">
        <h1 className="text-2xl font-bold text-emerald-900">
          Jameah Mahmoodiyah Progress Report
        </h1>
        <p className="text-sm text-gray-500">
          {subject?.name ?? template.label} — {term?.name}{" "}
          {term?.academicYear}
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
        <div>
          <dt className="text-gray-400">Teacher</dt>
          <dd className="font-medium text-gray-800">{teacher?.name}</dd>
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

      {/* Sections */}
      <div className="mt-6 space-y-5">
        {template.sections.map((section) => {
          const sectionResult = result.sections.find(
            (s) => s.id === section.id,
          );
          const visibleFields = section.fields.filter(
            (f) => f.type !== "text" || (data[f.id] && String(data[f.id]).trim()),
          );
          return (
            <section key={section.id}>
              <div className="flex items-center justify-between border-b border-gray-100 pb-1">
                <h2 className="font-semibold text-gray-800">
                  {section.title}
                </h2>
                {sectionResult?.percent !== null ? (
                  <span className="text-sm font-medium text-gray-500">
                    {sectionResult?.percent}%
                  </span>
                ) : null}
              </div>
              <table className="mt-2 w-full text-sm">
                <tbody>
                  {visibleFields.map((field) => (
                    <tr key={field.id} className="border-b border-gray-50">
                      <td className="py-1.5 pr-4 text-gray-600">
                        {field.label}
                      </td>
                      <td className="py-1.5 text-right font-medium text-gray-800">
                        {displayValue(field, data[field.id])}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </section>
          );
        })}
      </div>

      <footer className="mt-8 border-t border-gray-200 pt-3 text-xs text-gray-400">
        Generated on {new Date().toLocaleDateString()} · Jameah Islamic Institute
      </footer>
    </div>
  );
}
