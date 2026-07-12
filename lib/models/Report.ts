import mongoose, {
  Schema,
  model,
  models,
  type InferSchemaType,
} from "mongoose";

// Report templates (see lib/reports/registry in the next step).
export const TEMPLATES = ["hifz", "islamic"] as const;
export type TemplateKey = (typeof TEMPLATES)[number];

export const REPORT_STATUSES = ["draft", "published"] as const;
export type ReportStatus = (typeof REPORT_STATUSES)[number];

const reportSchema = new Schema(
  {
    student: {
      type: Schema.Types.ObjectId,
      ref: "Student",
      required: true,
    },
    teacher: {
      type: Schema.Types.ObjectId,
      ref: "Teacher",
      required: true,
    },
    term: { type: Schema.Types.ObjectId, ref: "Term", required: true },
    // Which report template produced this record.
    template: { type: String, enum: TEMPLATES, required: true },
    status: {
      type: String,
      enum: REPORT_STATUSES,
      default: "draft",
    },
    // Scored values keyed by the template's field ids (see registry).
    data: { type: Schema.Types.Mixed, default: {} },
    comments: { type: String, default: "" },
    publishedAt: { type: Date, default: null },
  },
  { timestamps: true },
);

// One published/draft report per student + term + template combination.
reportSchema.index({ student: 1, term: 1, template: 1 }, { unique: true });

export const ReportModel = models.Report || model("Report", reportSchema);

export type ReportType = InferSchemaType<typeof reportSchema> & {
  _id: mongoose.Types.ObjectId;
};
