import type { ProgrammeKey } from "@/lib/models";
import type { ReportField, ReportTemplate } from "./types";
import { GRADE_SCALE } from "./gradeScale";

/** A subject as needed to build a report template. */
export interface SubjectRef {
  id: string;
  name: string;
}

/**
 * Build a report template for a student's programme out of their assigned
 * subjects. Each subject contributes two fields:
 *   - `${subjectId}__mark`    : numeric mark out of 100 (score)
 *   - `${subjectId}__conduct` : qualitative conduct grade (dropdown)
 * plus a free-text remarks field. This single builder serves both the
 * teacher's per-subject mark entry (pass one subject) and the student's
 * combined term view (pass all subjects).
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
      id: `${s.id}__conduct`,
      label: `${s.name} (conduct)`,
      type: "grade",
      options: GRADE_SCALE,
      weight: 1,
    });
  }

  return {
    key: programme,
    label: programme === "hifz" ? "Hifz Report" : "Aalim Report",
    description: "Term progress across assigned subjects.",
    sections: [
      {
        id: "subjects",
        title: "Subjects & Conduct",
        fields,
      },
      {
        id: "remarks",
        title: "Remarks",
        fields: [
          {
            id: "remarks",
            label: "Teacher's remarks",
            type: "text",
            hint: "General feedback for the student and parents.",
          },
        ],
      },
    ],
  };
}

/** Field-id helpers for the `${subjectId}__mark` / `${subjectId}__conduct` scheme. */
export function markFieldId(subjectId: string): string {
  return `${subjectId}__mark`;
}
export function conductFieldId(subjectId: string): string {
  return `${subjectId}__conduct`;
}
