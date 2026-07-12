import mongoose, {
  Schema,
  model,
  models,
  type InferSchemaType,
} from "mongoose";

export const ROLES = ["admin", "teacher", "student"] as const;
export type Role = (typeof ROLES)[number];

const userSchema = new Schema(
  {
    name: { type: String, required: true, trim: true },
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
    },
    // Hashed with bcryptjs. select:false so it is never returned by default.
    passwordHash: { type: String, required: true, select: false },
    role: { type: String, enum: ROLES, required: true },
    // Links to the person profile this login belongs to (if any).
    studentId: { type: Schema.Types.ObjectId, ref: "Student", default: null },
    teacherId: { type: Schema.Types.ObjectId, ref: "Teacher", default: null },
  },
  { timestamps: true },
);

// Reuse the compiled model across hot reloads.
export const UserModel = models.User || model("User", userSchema);

export type UserType = InferSchemaType<typeof userSchema> & {
  _id: mongoose.Types.ObjectId;
};
