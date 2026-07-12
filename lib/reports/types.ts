import type { TemplateKey } from "@/lib/models";

/**
 * A single selectable option for a "grade" field. Each option carries its own
 * points/max so heterogeneous grade scales (e.g. out of 10) normalise against
 * score fields (e.g. out of 100) inside computeResult().
 */
export interface GradeOption {
  value: string;
  label: string;
  points: number;
  max: number;
}

export type FieldType = "score" | "grade" | "text";

export interface ReportField {
  /** Key used inside Report.data. Must be unique within a template. */
  id: string;
  label: string;
  type: FieldType;
  /** For "score" fields: the maximum mark. */
  max?: number;
  /** For "grade" fields: the selectable options. */
  options?: GradeOption[];
  /** Relative contribution to the overall result (default 1). */
  weight?: number;
  /** Short helper text shown under the field. */
  hint?: string;
}

export interface ReportSection {
  id: string;
  title: string;
  fields: ReportField[];
}

export interface ReportTemplate {
  key: TemplateKey;
  label: string;
  description: string;
  sections: ReportSection[];
}

/** Raw values keyed by field id (what gets stored in Report.data). */
export type ReportData = Record<string, string | number>;

export interface SectionResult {
  id: string;
  title: string;
  earned: number;
  total: number;
  /** 0–100, or null when the section has no scored fields. */
  percent: number | null;
}

export interface ReportResult {
  sections: SectionResult[];
  earned: number;
  total: number;
  /** 0–100 overall, or null when nothing is scored yet. */
  percent: number | null;
  grade: string;
}
