import mongoose, {
  Schema,
  model,
  models,
  type InferSchemaType,
} from "mongoose";
import { PROGRAMMES, type ProgrammeKey } from "./Subject";

const teacherSchema = new Schema(
  {
    name: { type: String, required: true, trim: true },
    // A teacher is of exactly one programme — Hifz or Aalim, never both.
    type: {
      type: String,
      enum: PROGRAMMES,
      required: true,
    },
    userId: { type: Schema.Types.ObjectId, ref: "User", default: null },
    active: { type: Boolean, default: true },
  },
  { timestamps: true },
);

export const TeacherModel = models.Teacher || model("Teacher", teacherSchema);

export type TeacherType = InferSchemaType<typeof teacherSchema> & {
  _id: mongoose.Types.ObjectId;
  type: ProgrammeKey;
};

