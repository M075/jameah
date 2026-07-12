import type { ReportTemplate } from "../types";
import { GRADE_SCALE } from "../gradeScale";

/**
 * Hifz (Quran memorisation) report. Mixes quantitative score fields
 * (pages, targets, attendance) with qualitative grade fields (tajweed,
 * retention, conduct) so computeResult normalises across scales.
 */
export const hifzTemplate: ReportTemplate = {
  key: "hifz",
  label: "Hifz Report",
  description: "Memorisation progress, retention, and conduct for the term.",
  sections: [
    {
      id: "memorization",
      title: "Memorisation",
      fields: [
        {
          id: "pages_memorized",
          label: "Pages memorised this term",
          type: "score",
          max: 30,
          weight: 2,
          hint: "Number of new pages committed to memory.",
        },
        {
          id: "weekly_target",
          label: "% of weekly target met",
          type: "score",
          max: 100,
          weight: 2,
          hint: "How consistently the weekly page target was achieved.",
        },
        {
          id: "tajweed",
          label: "Tajweed quality",
          type: "grade",
          options: GRADE_SCALE,
          weight: 2,
          hint: "Correctness of pronunciation and rules.",
        },
      ],
    },
    {
      id: "revision",
      title: "Revision & Retention",
      fields: [
        {
          id: "retention",
          label: "Retention of past portions",
          type: "grade",
          options: GRADE_SCALE,
          weight: 2,
        },
        {
          id: "revision_consistency",
          label: "Revision consistency (%)",
          type: "score",
          max: 100,
          weight: 1,
        },
      ],
    },
    {
      id: "conduct",
      title: "Conduct & Attendance",
      fields: [
        {
          id: "attendance",
          label: "Attendance (%)",
          type: "score",
          max: 100,
          weight: 1,
        },
        {
          id: "conduct",
          label: "Conduct & discipline",
          type: "grade",
          options: GRADE_SCALE,
          weight: 1,
        },
      ],
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
