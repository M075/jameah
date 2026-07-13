import mongoose from "mongoose";

type MongooseCache = {
  conn: typeof mongoose | null;
  promise: Promise<typeof mongoose> | null;
};

// Persist the connection across hot reloads in development so we don't
// open a new socket on every change / request.
const globalForMongoose = globalThis as unknown as {
  mongooseCache?: MongooseCache;
};

const cache: MongooseCache =
  globalForMongoose.mongooseCache ??
  (globalForMongoose.mongooseCache = { conn: null, promise: null });

/**
 * Connect to MongoDB. Returns the shared mongoose instance.
 * Throws if MONGODB_URI is not configured.
 */
export async function connectDB(): Promise<typeof mongoose> {
  const MONGODB_URI = process.env.MONGODB_URI;
  if (!MONGODB_URI) {
    throw new Error(
      "MONGODB_URI is not set. Add it to .env.local (see .env.example).",
    );
  }

  if (cache.conn) {
    return cache.conn;
  }

  if (!cache.promise) {
    cache.promise = mongoose
      .connect(MONGODB_URI, {
        // Require an explicit connection before issuing commands so we fail
        // loudly instead of silently buffering forever.
        bufferCommands: false,
        appName: "jameah",
      })
      .then((m) => m);
  }

  cache.conn = await cache.promise;
  // Remove any indexes left over from older schemas so inserts don't trip on
  // them (e.g. the old non-sparse unique index on the removed `teacherCode`).
  await repairLegacyIndexes().catch(() => {});
  return cache.conn;
}

/**
 * Drop indexes that belonged to fields which no longer exist in the schemas.
 * Older versions of this app defined a unique (non-sparse) `teacherCode` on
 * teachers; once the field was removed the index lingered in the collection
 * and blocked every insert (duplicate `null` key). This runs once per
 * connection and is a no-op when the index is already gone.
 */
async function repairLegacyIndexes() {
  const db = mongoose.connection;
  if (!db || !db.db) return;
  await db.collection("teachers").dropIndex("teacherCode_1").catch(() => {});
}

/** Convenience: the default mongoose connection (after connectDB). */
export function getConnection() {
  return mongoose.connection;
}
