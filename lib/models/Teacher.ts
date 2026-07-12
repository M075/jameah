import mongoose, {
  Schema,
  model,
  models,
  type InferSchemaType,
} from "mongoose";

const teacherSchema = new Schema(
  {
    teacherCode: { type: String, required: true, unique: true, trim: true },
    name: { type: String, required: true, trim: true },
    // Subjects this teacher can report on, e.g. "hifz", "islamic".
    subjects: { type: [String], default: [] },
    userId: { type: Schema.Types.ObjectId, ref: "User", default: null },
    active: { type: Boolean, default: true },
  },
  { timestamps: true },
);

export const TeacherModel = models.Teacher || model("Teacher", teacherSchema);

export type TeacherType = InferSchemaType<typeof teacherSchema> & {
  _id: mongoose.Types.ObjectId;
};
