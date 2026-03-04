import { MongoClient, Db } from "mongodb";

const MONGODB_URI = process.env.MONGODB_URI?.trim() || "";
const DB_NAME = "chotubot";

let cachedClient: MongoClient | null = null;
let cachedDb: Db | null = null;

export async function getDatabase(): Promise<Db> {
    if (cachedDb) return cachedDb;

    if (!MONGODB_URI) {
        throw new Error("MONGODB_URI is not set");
    }

    const client = new MongoClient(MONGODB_URI);
    await client.connect();

    cachedClient = client;
    cachedDb = client.db(DB_NAME);

    return cachedDb;
}

// Collection names
export const COLLECTIONS = {
    DOCUMENTS: "documents",    // Original uploaded docs
    CHUNKS: "chunks",          // Chunked + embedded text
} as const;
