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
    name: { type: String, required: true, unique: true, trim: true },
    // Which programme this subject belongs to: "hifz" or "aalim".
    type: {
      type: String,
      enum: PROGRAMMES,
      required: true,
    },
    active: { type: Boolean, default: true },
  },
  { timestamps: true },
);

export const SubjectModel = models.Subject || model("Subject", subjectSchema);

export type SubjectType = InferSchemaType<typeof subjectSchema> & {
  _id: mongoose.Types.ObjectId;
};
