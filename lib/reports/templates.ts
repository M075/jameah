import type { ProgrammeKey } from "@/lib/models";
import type { ReportField, ReportTemplate } from "./types";

/** A subject as needed to build a report template. */
export interface SubjectRef {
  id: string;
  name: string;
}

/**
 * Build a report template for a student's programme out of their assigned
 * subjects. Each subject contributes two fields:
 *   - `${subjectId}__mark`     : numeric mark out of 100 (score)
 *   - `${subjectId}__remarks`  : free-text teacher remark
 * The single builder serves both the teacher's per-term mark entry (pass the
 * subjects they teach) and the student's combined term view (pass all subjects).
 */
export function buildReportTemplate(
  programme: ProgrammeKey,
  subjects: SubjectRef[],
): ReportTemplate {
  const fields: ReportField[] = [];
  for (const s of subjects) {
    fields.push({
      id: `${s.id}__mark`,
      label: s.name,
      type: "score",
      max: 100,
      weight: 2,
      hint: "Mark out of 100.",
    });
    fields.push({
      id: `${s.id}__remarks`,
      label: `${s.name} remark`,
      type: "text",
      hint: "Teacher's remark for this subject.",
    });
  }

  return {
    key: programme,
    label: programme === "hifz" ? "Hifz Report" : "Aalim Report",
    description: "Term progress across assigned subjects.",
    sections: [
      {
        id: "subjects",
        title: "Subjects",
        fields,
      },
    ],
  };
}

/** Field-id helpers for the `${subjectId}__mark` / `${subjectId}__remarks` scheme. */
export function markFieldId(subjectId: string): string {
  return `${subjectId}__mark`;
}
export function remarksFieldId(subjectId: string): string {
  return `${subjectId}__remarks`;
}
