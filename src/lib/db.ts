import { MongoClient, Db, ObjectId } from "mongodb";
import {
  User,
  Application,
  Favorite,
  Collection as AppCollection,
  ActivityLog,
  VerificationCode,
} from "@/types";

declare global {
  // eslint-disable-next-line no-var
  var _mongoClientPromise: Promise<MongoClient> | undefined;
}

let client: MongoClient | null = null;
let clientPromise: Promise<MongoClient> | null = null;

export async function getDb(): Promise<Db> {
  const uri = process.env.MONGODB_URI?.trim();

  if (!uri) {
    throw new Error(
      "[DevVerse DB Fatal] MONGODB_URI environment variable is strictly required. No local database fallback is permitted. Please configure MONGODB_URI in your environment."
    );
  }

  if (process.env.NODE_ENV === "development") {
    // In development mode, use a global variable to preserve connection across HMR reloads
    if (!global._mongoClientPromise) {
      client = new MongoClient(uri, {
        serverSelectionTimeoutMS: 8000,
        connectTimeoutMS: 8000,
      });
      global._mongoClientPromise = client.connect();
    }
    clientPromise = global._mongoClientPromise ?? null;
  } else {
    if (!clientPromise) {
      client = new MongoClient(uri, {
        serverSelectionTimeoutMS: 8000,
        connectTimeoutMS: 8000,
      });
      clientPromise = client.connect();
    }
  }

  try {
    const c = await clientPromise;
    if (!c) {
      throw new Error("MongoClient connection promise resolved to null");
    }
    return c.db("devverse");
  } catch (err: any) {
    if (process.env.NODE_ENV === "development") {
      global._mongoClientPromise = undefined;
    }
    clientPromise = null;
    throw new Error(
      `[DevVerse DB Fatal] Failed to connect to MongoDB Atlas (${err.message}). Please verify MONGODB_URI, IP whitelisting in Atlas, and credentials.`
    );
  }
}

export async function getCollections() {
  const db = await getDb();
  return {
    users: db.collection<User>("users"),
    applications: db.collection<Application>("applications"),
    favorites: db.collection<Favorite>("favorites"),
    collections: db.collection<AppCollection>("collections"),
    activityLogs: db.collection<ActivityLog>("activityLogs"),
    verificationCodes: db.collection<VerificationCode>("verificationCodes"),
  };
}

let indexesEnsured = false;
export async function ensureIndexes(): Promise<void> {
  if (indexesEnsured) return;
  try {
    const { users, applications, favorites, collections, activityLogs } = await getCollections();

    await Promise.allSettled([
      users.createIndex({ email: 1 }, { unique: true }),
      users.createIndex({ username: 1 }, { unique: true }),
      applications.createIndex({ slug: 1 }, { unique: true }),
      applications.createIndex({ ownerId: 1 }),
      applications.createIndex({ visibility: 1 }),
      applications.createIndex({ category: 1 }),
      applications.createIndex({ platform: 1 }),
      favorites.createIndex({ userId: 1, applicationId: 1 }, { unique: true }),
      collections.createIndex({ ownerId: 1 }),
      activityLogs.createIndex({ timestamp: -1 }),
      activityLogs.createIndex({ actorId: 1 }),
    ]);
    indexesEnsured = true;
  } catch (err: any) {
    console.warn("[DevVerse DB] Warning: ensureIndexes encountered error:", err.message);
  }
}

// Utility to safely convert string to ObjectId when needed
export function toObjectId(id: string | ObjectId): ObjectId | string {
  if (id instanceof ObjectId) return id;
  if (ObjectId.isValid(id) && id.length === 24) {
    try {
      return new ObjectId(id);
    } catch {
      return id;
    }
  }
  return id;
}
