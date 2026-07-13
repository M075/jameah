import mongoose, {
  Schema,
  model,
  models,
  type InferSchemaType,
} from "mongoose";
import { PROGRAMMES, type ProgrammeKey } from "./Subject";

const studentSchema = new Schema(
  {
    // Human-friendly unique code, e.g. "S-001". Optional on input — when left
    // blank it is auto-generated (see createStudent). sparse allows the
    // (brief) window before generation without violating uniqueness.
    studentCode: { type: String, unique: true, trim: true, sparse: true },
    name: { type: String, required: true, trim: true },
    // Programme / year group label, e.g. "Year 1". For Aalim it is
    // auto-derived from `year` (e.g. "Year 3").
    grade: { type: String, default: "" },
    // Which programme the student belongs to (drives available subjects).
    programme: {
      type: String,
      enum: PROGRAMMES,
      default: "",
    },
    // The Aalim class/year this student is in (1–6). Null for Hifz,
    // which has no subjects/classes. Drives automatic subject assignment.
    year: { type: Number, default: null },
    // One teacher per subject. A student may have different teachers for
    // different subjects within their programme.
    subjects: {
      type: [
        {
          subject: { type: Schema.Types.ObjectId, ref: "Subject", required: true },
          teacher: { type: Schema.Types.ObjectId, ref: "Teacher", default: null },
        },
      ],
      default: [],
    },
    // Optional linked login account.
    userId: { type: Schema.Types.ObjectId, ref: "User", default: null },
    active: { type: Boolean, default: true },
  },
  { timestamps: true },
);

export const StudentModel = models.Student || model("Student", studentSchema);

export type StudentType = InferSchemaType<typeof studentSchema> & {
  _id: mongoose.Types.ObjectId;
  programme: ProgrammeKey;
  year: number | null;
  subjects: { subject: mongoose.Types.ObjectId; teacher: mongoose.Types.ObjectId | null }[];
};

