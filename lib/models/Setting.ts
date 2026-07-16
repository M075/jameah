import mongoose, {
  Schema,
  model,
  models,
  type InferSchemaType,
} from "mongoose";

/**
 * Singleton settings document (always _id = SETTINGS_ID). Holds the principal's
 * signature used on every generated report. `signatureDataUrl` is a data: URL
 * (e.g. "data:image/png;base64,....") so it renders directly in the HTML report
 * and the @react-pdf Image component without any extra storage layer.
 */
export const SETTINGS_ID = "000000000000000000000001";

const settingSchema = new Schema(
  {
    _id: { type: String, default: SETTINGS_ID },
    signatureDataUrl: { type: String, default: "" },
  },
  { timestamps: true },
);

export const SettingModel =
  models.Setting || model("Setting", settingSchema);

export type SettingType = InferSchemaType<typeof settingSchema> & {
  _id: string;
};

/** Load the singleton settings doc, creating an empty one on first use. */
export async function getSettings(): Promise<SettingType> {
  const doc = await SettingModel.findById(SETTINGS_ID).lean<SettingType>();
  if (doc) return doc;
  return { _id: SETTINGS_ID, signatureDataUrl: "" } as SettingType;
}
