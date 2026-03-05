import { MongoClient, Db } from "mongodb";

const MONGODB_URI = process.env.MONGODB_URI?.trim() || "";
const DB_NAME = "chotubot";

// -- globalThis caching for serverless (survives warm invocations) --
/* eslint-disable no-var */
declare global {
    var _mongoClientPromise: Promise<MongoClient> | undefined;
}
/* eslint-enable no-var */

if (!MONGODB_URI) {
    throw new Error("MONGODB_URI is not set");
}

if (!global._mongoClientPromise) {
    const client = new MongoClient(MONGODB_URI);
    global._mongoClientPromise = client.connect();
}

const clientPromise: Promise<MongoClient> = global._mongoClientPromise;

export async function getDatabase(): Promise<Db> {
    const client = await clientPromise;
    return client.db(DB_NAME);
}

// Collection names
export const COLLECTIONS = {
    DOCUMENTS: "documents",    // Original uploaded docs
    CHUNKS: "chunks",          // Chunked + embedded text
} as const;
