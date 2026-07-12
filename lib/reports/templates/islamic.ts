import type { ReportTemplate } from "../types";
import { GRADE_SCALE } from "../gradeScale";

/**
 * Islamic Studies report. Core subjects are graded qualitatively; conduct and
 * attendance are quantitative. computeResult blends both into one percentage.
 */
export const islamicTemplate: ReportTemplate = {
  key: "islamic",
  label: "Islamic Studies Report",
  description: "Subject performance, conduct, and attendance for the term.",
  sections: [
    {
      id: "subjects",
      title: "Core Subjects",
      fields: [
        {
          id: "quran_recitation",
          label: "Quran recitation",
          type: "grade",
          options: GRADE_SCALE,
          weight: 2,
        },
        {
          id: "arabic",
          label: "Arabic",
          type: "grade",
          options: GRADE_SCALE,
          weight: 1,
        },
        {
          id: "fiqh",
          label: "Fiqh",
          type: "grade",
          options: GRADE_SCALE,
          weight: 1,
        },
        {
          id: "aqeedah",
          label: "Aqeedah",
          type: "grade",
          options: GRADE_SCALE,
          weight: 1,
        },
        {
          id: "hadith",
          label: "Hadith",
          type: "grade",
          options: GRADE_SCALE,
          weight: 1,
        },
        {
          id: "seerah",
          label: "Seerah",
          type: "grade",
          options: GRADE_SCALE,
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
          id: "adab",
          label: "Adab & manners",
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
