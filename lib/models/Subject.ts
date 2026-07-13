import mongoose, {
  Schema,
  model,
  models,
  type InferSchemaType,
} from "mongoose";

/** The two programmes a subject, teacher, or student belongs to. */
export const PROGRAMMES = ["hifz", "aalim"] as const;
export type ProgrammeKey = (typeof PROGRAMMES)[number];

const subjectSchema = new Schema(
  {
    name: { type: String, required: true, trim: true },
    // Which programme this subject belongs to. In practice subjects are
    // Aalim-only (Hifz has no subjects), but the field is kept for clarity.
    type: {
      type: String,
      enum: PROGRAMMES,
      required: true,
    },
    // The Aalim year this subject is taught in (1–6). One class per year.
    year: { type: Number, required: true, min: 1, max: 6 },
    // The single teacher assigned to this subject (set by admin).
    teacher: {
      type: Schema.Types.ObjectId,
      ref: "Teacher",
      default: null,
    },
    active: { type: Boolean, default: true },
  },
  { timestamps: true },
);

// A subject is unique per (name, year, type). Since subjects are Aalim-only
// in practice, this is effectively (name, year).
subjectSchema.index({ name: 1, year: 1, type: 1 }, { unique: true });

export const SubjectModel = models.Subject || model("Subject", subjectSchema);

export type SubjectType = InferSchemaType<typeof subjectSchema> & {
  _id: mongoose.Types.ObjectId;
  type: ProgrammeKey;
};
