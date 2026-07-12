import mongoose, {
  Schema,
  model,
  models,
  type InferSchemaType,
} from "mongoose";

const studentSchema = new Schema(
  {
    // Human-friendly unique code, e.g. "S-001". Optional on input — when left
    // blank it is auto-generated (see createStudent). sparse allows the
    // (brief) window before generation without violating uniqueness.
    studentCode: { type: String, unique: true, trim: true, sparse: true },
    name: { type: String, required: true, trim: true },
    // Programme / year group, e.g. "Hifz Year 1", "Alim Year 3".
    grade: { type: String, default: "" },
    section: { type: String, default: "" },
    // Assigned teacher who enters marks.
    teacher: { type: Schema.Types.ObjectId, ref: "Teacher", default: null },
    // Optional linked login account.
    userId: { type: Schema.Types.ObjectId, ref: "User", default: null },
    active: { type: Boolean, default: true },
  },
  { timestamps: true },
);

export const StudentModel = models.Student || model("Student", studentSchema);

export type StudentType = InferSchemaType<typeof studentSchema> & {
  _id: mongoose.Types.ObjectId;
};
