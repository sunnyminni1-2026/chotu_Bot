import { NextRequest } from "next/server";
import { verifyToken, getAuthCookieOptions } from "@/lib/auth";
import { getDatabase, COLLECTIONS } from "@/lib/mongodb";
import { chunkText, embedChunks } from "@/lib/embeddings";
import { ObjectId } from "mongodb";
import { cookies } from "next/headers";

// Auth check helper — returns true/false, never throws
async function checkAdmin(): Promise<boolean> {
    try {
        const cookieStore = await cookies();
        const token = cookieStore.get(getAuthCookieOptions().name)?.value;
        if (!token) return false;
        const payload = await verifyToken(token);
        return !!(payload && payload.role === "admin");
    } catch {
        return false;
    }
}

// ============================
// GET — List all documents
// ============================
export async function GET() {
    try {
        if (!(await checkAdmin())) {
            return Response.json({ error: "Unauthorized." }, { status: 401 });
        }

        const db = await getDatabase();
        const documents = await db
            .collection(COLLECTIONS.DOCUMENTS)
            .find({})
            .sort({ createdAt: -1 })
            .toArray();

        return Response.json({
            documents: documents.map((doc: any) => ({
                id: doc._id.toString(),
                title: doc.title,
                preview: (doc.content || "").slice(0, 150) + ((doc.content || "").length > 150 ? "..." : ""),
                chunksCount: doc.chunksCount || 0,
                createdAt: doc.createdAt,
            })),
        });
    } catch (error) {
        console.error("Knowledge GET error:", error);
        return Response.json({ error: "Failed to load documents." }, { status: 500 });
    }
}

// ============================
// POST — Add document to knowledge base
// ============================
export async function POST(request: NextRequest) {
    try {
        if (!(await checkAdmin())) {
            return Response.json({ error: "Unauthorized." }, { status: 401 });
        }

        // Check GEMINI_API_KEY before attempting embeddings
        const geminiKey = (process.env.GEMINI_API_KEY || "").trim();
        if (!geminiKey) {
            return Response.json({
                error: "GEMINI_API_KEY is not configured. Add it to Vercel Environment Variables.",
            }, { status: 500 });
        }

        let body: { title?: string; content?: string };
        try {
            body = await request.json();
        } catch {
            return Response.json({ error: "Invalid JSON." }, { status: 400 });
        }

        const { title, content } = body;

        if (!title || !content || typeof title !== "string" || typeof content !== "string") {
            return Response.json({ error: "Title and content are required." }, { status: 400 });
        }

        if (title.length > 200) {
            return Response.json({ error: "Title too long (max 200 chars)." }, { status: 400 });
        }

        if (content.length > 50000) {
            return Response.json({ error: "Content too long (max 50,000 chars)." }, { status: 400 });
        }

        const db = await getDatabase();

        // 1. Store original document
        const docResult = await db.collection(COLLECTIONS.DOCUMENTS).insertOne({
            title: title.trim(),
            content: content.trim(),
            createdAt: new Date(),
        });

        const docId = docResult.insertedId;

        // 2. Chunk the text
        const chunks = chunkText(content.trim(), title.trim());

        // 3. Generate embeddings for each chunk
        let embeddedChunks: { content: string; index: number; embedding: number[] }[] = [];
        try {
            embeddedChunks = await embedChunks(chunks);
        } catch (embedError) {
            console.error("Embedding error:", embedError);
            // Document was saved — update with 0 chunks and return partial success
            await db.collection(COLLECTIONS.DOCUMENTS).updateOne(
                { _id: docId },
                { $set: { chunksCount: 0 } }
            );
            return Response.json({
                success: true,
                message: `Document "${title}" saved but embedding failed. It will be available for text search only.`,
                documentId: docId.toString(),
                chunksCount: 0,
            });
        }

        // 4. Store chunks with embeddings
        if (embeddedChunks.length > 0) {
            await db.collection(COLLECTIONS.CHUNKS).insertMany(
                embeddedChunks.map((chunk) => ({
                    documentId: docId,
                    documentTitle: title.trim(),
                    content: chunk.content,
                    chunkIndex: chunk.index,
                    embedding: chunk.embedding,
                    createdAt: new Date(),
                }))
            );
        }

        // 5. Update document with chunk count
        await db.collection(COLLECTIONS.DOCUMENTS).updateOne(
            { _id: docId },
            { $set: { chunksCount: embeddedChunks.length } }
        );

        return Response.json({
            success: true,
            message: `Document "${title}" added with ${embeddedChunks.length} chunks.`,
            documentId: docId.toString(),
            chunksCount: embeddedChunks.length,
        });
    } catch (error) {
        console.error("Knowledge POST error:", error);
        return Response.json({ error: "Failed to add document. Check server logs." }, { status: 500 });
    }
}

// ============================
// DELETE — Remove document and its chunks
// ============================
export async function DELETE(request: NextRequest) {
    try {
        if (!(await checkAdmin())) {
            return Response.json({ error: "Unauthorized." }, { status: 401 });
        }

        const { searchParams } = new URL(request.url);
        const docId = searchParams.get("id");

        if (!docId) {
            return Response.json({ error: "Document ID is required." }, { status: 400 });
        }

        let objectId: ObjectId;
        try {
            objectId = new ObjectId(docId);
        } catch {
            return Response.json({ error: "Invalid document ID." }, { status: 400 });
        }

        const db = await getDatabase();

        // Delete chunks
        await db.collection(COLLECTIONS.CHUNKS).deleteMany({ documentId: objectId });

        // Delete document
        const result = await db.collection(COLLECTIONS.DOCUMENTS).deleteOne({ _id: objectId });

        if (result.deletedCount === 0) {
            return Response.json({ error: "Document not found." }, { status: 404 });
        }

        return Response.json({ success: true, message: "Document deleted." });
    } catch (error) {
        console.error("Knowledge DELETE error:", error);
        return Response.json({ error: "Failed to delete document." }, { status: 500 });
    }
}
