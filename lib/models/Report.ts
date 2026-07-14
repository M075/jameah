import mongoose, {
  Schema,
  model,
  models,
  type InferSchemaType,
} from "mongoose";

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
      default: null,
    },
    term: { type: Schema.Types.ObjectId, ref: "Term", required: true },
    status: {
      type: String,
      enum: REPORT_STATUSES,
      default: "draft",
    },
    // Scored values keyed by field ids derived from buildReportTemplate.
    // Each assigned subject contributes `${subjectId}__mark` (score) and
    // `${subjectId}__remarks` (text). One document holds the whole term.
    data: { type: Schema.Types.Mixed, default: {} },
    publishedAt: { type: Date, default: null },
  },
  { timestamps: true },
);

// One report per student + term, consolidating every subject.
reportSchema.index({ student: 1, term: 1 }, { unique: true });

export const ReportModel = models.Report || model("Report", reportSchema);

export type ReportType = InferSchemaType<typeof reportSchema> & {
  _id: mongoose.Types.ObjectId;
};

