import type { GradeOption } from "./types";

/**
 * Shared 4-point grade scale (out of 10) reused by both templates so that
 * qualitative subjects normalise against quantitative score fields.
 */
export const GRADE_SCALE: GradeOption[] = [
  { value: "excellent", label: "Excellent", points: 10, max: 10 },
  { value: "good", label: "Good", points: 8, max: 10 },
  { value: "satisfactory", label: "Satisfactory", points: 6, max: 10 },
  { value: "needs_improvement", label: "Needs Improvement", points: 4, max: 10 },
];

/** Look up a single grade option by its value. */
export function gradeOption(value: string | undefined): GradeOption | undefined {
  if (!value) return undefined;
  return GRADE_SCALE.find((o) => o.value === value);
}
