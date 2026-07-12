import mongoose, {
  Schema,
  model,
  models,
  type InferSchemaType,
} from "mongoose";

const termSchema = new Schema(
  {
    name: { type: String, required: true, trim: true }, // e.g. "Term 1"
    academicYear: { type: String, default: "" }, // e.g. "1447H"
    startDate: { type: Date, default: null },
    endDate: { type: Date, default: null },
    // Exactly one term should be active so the UI knows the default.
    active: { type: Boolean, default: false },
  },
  { timestamps: true },
);

export const TermModel = models.Term || model("Term", termSchema);

export type TermType = InferSchemaType<typeof termSchema> & {
  _id: mongoose.Types.ObjectId;
};
