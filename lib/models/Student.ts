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
    // Programme / year group label, e.g. "Year 1", "Year 3".
    grade: { type: String, default: "" },
    section: { type: String, default: "" },
    // Which programme the student belongs to (drives available subjects).
    programme: {
      type: String,
      enum: PROGRAMMES,
      default: "",
    },
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
  subjects: { subject: mongoose.Types.ObjectId; teacher: mongoose.Types.ObjectId | null }[];
};

