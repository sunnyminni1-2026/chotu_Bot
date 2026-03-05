import { MongoClient, Db } from "mongodb";

const DB_NAME = "chotubot";

// -- globalThis caching for serverless (survives warm invocations) --
/* eslint-disable no-var */
declare global {
    var _mongoClient: MongoClient | undefined;
    var _mongoDb: Db | undefined;
}
/* eslint-enable no-var */

export async function getDatabase(): Promise<Db> {
    // Return cached DB if available and client is connected
    if (global._mongoDb && global._mongoClient) {
        try {
            // Ping to verify connection is alive
            await global._mongoClient.db("admin").command({ ping: 1 });
            return global._mongoDb;
        } catch {
            // Connection died — reset and reconnect
            global._mongoClient = undefined;
            global._mongoDb = undefined;
        }
    }

    const uri = (process.env.MONGODB_URI || "").trim();
    if (!uri) {
        throw new Error("MONGODB_URI is not configured. Add it to Vercel Environment Variables.");
    }

    // Connect with retry
    let lastError: Error | null = null;
    for (let attempt = 1; attempt <= 3; attempt++) {
        try {
            const client = new MongoClient(uri, {
                serverSelectionTimeoutMS: 10000,
                connectTimeoutMS: 10000,
                socketTimeoutMS: 30000,
                maxPoolSize: 10,
                retryWrites: true,
                retryReads: true,
            });
            await client.connect();
            await client.db("admin").command({ ping: 1 }); // Verify it actually works
            global._mongoClient = client;
            global._mongoDb = client.db(DB_NAME);
            console.log(`MongoDB connected on attempt ${attempt}`);
            return global._mongoDb;
        } catch (error) {
            lastError = error instanceof Error ? error : new Error(String(error));
            console.error(`MongoDB connection attempt ${attempt} failed:`, lastError.message);
            if (attempt < 3) {
                await new Promise(r => setTimeout(r, 1000 * attempt)); // Backoff
            }
        }
    }

    throw new Error(`MongoDB connection failed after 3 attempts: ${lastError?.message}`);
}

// Collection names
export const COLLECTIONS = {
    DOCUMENTS: "documents",    // Original uploaded docs
    CHUNKS: "chunks",          // Chunked + embedded text
} as const;
