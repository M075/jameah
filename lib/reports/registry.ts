import type { TemplateKey } from "@/lib/models";
import type {
  ReportData,
  ReportField,
  ReportResult,
  ReportSection,
  ReportTemplate,
  SectionResult,
} from "./types";
import { gradeOption } from "./gradeScale";
import { hifzTemplate } from "./templates/hifz";
import { islamicTemplate } from "./templates/islamic";

/** All available report templates keyed by their template key. */
export const reportRegistry: Record<TemplateKey, ReportTemplate> = {
  hifz: hifzTemplate,
  islamic: islamicTemplate,
};

/** List of templates (for dropdowns / iteration). */
export const reportTemplates: ReportTemplate[] = Object.values(reportRegistry);

/** Get a template definition by key. Throws on unknown key. */
export function getTemplate(key: TemplateKey): ReportTemplate {
  const t = reportRegistry[key];
  if (!t) throw new Error(`Unknown report template: ${String(key)}`);
  return t;
}

/** All fields across all sections of a template, in order. */
export function getFields(template: ReportTemplate): ReportField[] {
  return template.sections.flatMap((s) => s.fields);
}

/** Find a single field definition by id within a template. */
export function getField(
  template: ReportTemplate,
  fieldId: string,
): ReportField | undefined {
  return getFields(template).find((f) => f.id === fieldId);
}

/**
 * Map a raw field value to earned/max points for score/grade fields.
 * Returns null for text fields or when no value is present.
 */
function scoreField(
  field: ReportField,
  value: string | number | undefined,
): { earned: number; max: number } | null {
  if (value === undefined || value === "" || value === null) return null;

  if (field.type === "score") {
    const max = field.max ?? 100;
    const earned = typeof value === "number" ? value : Number(value);
    if (Number.isNaN(earned)) return null;
    return { earned, max };
  }

  if (field.type === "grade") {
    const opt = gradeOption(String(value));
    if (!opt) return null;
    return { earned: opt.points, max: opt.max };
  }

  return null; // text fields are not scored
}

/**
 * Compute weighted per-section and overall results from stored Report.data.
 * Section percentage is null when it has no scored fields (e.g. remarks).
 */
export function computeResult(
  template: ReportTemplate,
  data: ReportData,
): ReportResult {
  const sections: SectionResult[] = template.sections.map(
    (section: ReportSection) => {
      let earned = 0;
      let total = 0;
      for (const field of section.fields) {
        const scored = scoreField(field, data[field.id]);
        if (scored) {
          const w = field.weight ?? 1;
          earned += scored.earned * w;
          total += scored.max * w;
        }
      }
      return {
        id: section.id,
        title: section.title,
        earned,
        total,
        percent: total > 0 ? Math.round((earned / total) * 1000) / 10 : null,
      };
    },
  );

  let earned = 0;
  let total = 0;
  for (const s of sections) {
    earned += s.earned;
    total += s.total;
  }

  const percent = total > 0 ? Math.round((earned / total) * 1000) / 10 : null;

  return {
    sections,
    earned,
    total,
    percent,
    grade: percent === null ? "—" : letterGrade(percent),
  };
}

/** Convert an overall percentage to a letter grade. */
export function letterGrade(percent: number): string {
  if (percent >= 90) return "A";
  if (percent >= 80) return "B";
  if (percent >= 70) return "C";
  if (percent >= 60) return "D";
  return "E";
}
