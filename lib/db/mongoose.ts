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
  return cache.conn;
}

/** Convenience: the default mongoose connection (after connectDB). */
export function getConnection() {
  return mongoose.connection;
}
