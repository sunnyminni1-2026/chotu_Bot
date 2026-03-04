import Groq from "groq-sdk";
import { NextRequest } from "next/server";
import { verifyToken, getAuthCookieOptions } from "@/lib/auth";
import { getDatabase, COLLECTIONS } from "@/lib/mongodb";
import { generateEmbedding } from "@/lib/embeddings";
import { cookies } from "next/headers";

// Rate limiter for admin chat
const rateLimitStore = new Map<string, { count: number; firstRequestTime: number }>();
const MAX_REQUESTS = 30;
const WINDOW_MS = 60 * 1000;

function checkRateLimit(ip: string) {
    const now = Date.now();
    const record = rateLimitStore.get(ip);

    if (rateLimitStore.size > 50) {
        for (const [key, val] of rateLimitStore) {
            if (now - val.firstRequestTime > WINDOW_MS) rateLimitStore.delete(key);
        }
    }

    if (!record || now - record.firstRequestTime > WINDOW_MS) {
        rateLimitStore.set(ip, { count: 1, firstRequestTime: now });
        return { allowed: true, remaining: MAX_REQUESTS - 1 };
    }

    if (record.count >= MAX_REQUESTS) {
        const resetIn = Math.ceil((record.firstRequestTime + WINDOW_MS - now) / 1000);
        return { allowed: false, remaining: 0, resetIn };
    }

    record.count++;
    return { allowed: true, remaining: MAX_REQUESTS - record.count };
}

function sanitizeInput(text: string): string {
    if (typeof text !== "string") return "";
    return text.trim().slice(0, 4000).replace(/\0/g, "");
}

interface ChatMessage {
    role: string;
    content: string;
}

function validateMessages(messages: unknown): messages is ChatMessage[] {
    if (!Array.isArray(messages)) return false;
    if (messages.length === 0 || messages.length > 100) return false;
    return messages.every(
        (msg) =>
            msg &&
            typeof msg.role === "string" &&
            typeof msg.content === "string" &&
            ["user", "assistant"].includes(msg.role) &&
            msg.content.length > 0 &&
            msg.content.length <= 4000
    );
}

// ============================
// RAG: Retrieve relevant knowledge
// ============================
async function retrieveKnowledge(query: string): Promise<string> {
    try {
        const db = await getDatabase();
        const chunksCollection = db.collection(COLLECTIONS.CHUNKS);

        // Check if there are any chunks
        const count = await chunksCollection.countDocuments();
        if (count === 0) return "";

        // Generate embedding for the query
        const queryEmbedding = await generateEmbedding(query);

        // Try vector search first (requires Atlas Search index)
        try {
            const results = await chunksCollection
                .aggregate([
                    {
                        $vectorSearch: {
                            index: "vector_index",
                            path: "embedding",
                            queryVector: queryEmbedding,
                            numCandidates: 20,
                            limit: 5,
                        },
                    },
                    {
                        $project: {
                            content: 1,
                            documentTitle: 1,
                            score: { $meta: "vectorSearchScore" },
                        },
                    },
                ])
                .toArray();

            if (results.length > 0) {
                return results
                    .map((r) => r.content)
                    .join("\n\n---\n\n");
            }
        } catch {
            // Vector search index not set up yet, fall back to text search
            console.log("Vector search not available, using fallback text search");
        }

        // Fallback: simple text search
        const textResults = await chunksCollection
            .find(
                { $text: { $search: query } },
                { projection: { content: 1, score: { $meta: "textScore" } } }
            )
            .sort({ score: { $meta: "textScore" } })
            .limit(5)
            .toArray();

        if (textResults.length > 0) {
            return textResults.map((r) => r.content).join("\n\n---\n\n");
        }

        // Last fallback: return recent chunks
        const recentChunks = await chunksCollection
            .find({})
            .sort({ createdAt: -1 })
            .limit(3)
            .toArray();

        return recentChunks.map((r) => r.content).join("\n\n---\n\n");
    } catch (error) {
        console.error("RAG retrieval error:", error);
        return "";
    }
}

export async function POST(request: NextRequest) {
    try {
        // --- Auth Check ---
        const cookieStore = await cookies();
        const token = cookieStore.get(getAuthCookieOptions().name)?.value;

        if (!token) {
            return Response.json({ error: "Unauthorized." }, { status: 401 });
        }

        const payload = await verifyToken(token);
        if (!payload || payload.role !== "admin") {
            return Response.json({ error: "Unauthorized." }, { status: 401 });
        }

        // --- API Key ---
        const apiKey = process.env.GROQ_API_KEY?.trim();
        if (!apiKey || apiKey === "your_groq_api_key_here") {
            return Response.json({ error: "Server misconfiguration." }, { status: 500 });
        }

        // --- Rate Limiting ---
        const forwarded = request.headers.get("x-forwarded-for");
        const ip = forwarded ? forwarded.split(",")[0].trim() : "unknown";
        const rateCheck = checkRateLimit(ip);

        if (!rateCheck.allowed) {
            return Response.json(
                { error: `Rate limit exceeded. Wait ${rateCheck.resetIn}s.` },
                { status: 429 }
            );
        }

        // --- Parse & Validate ---
        let body: { messages?: unknown };
        try {
            body = await request.json();
        } catch {
            return Response.json({ error: "Invalid JSON." }, { status: 400 });
        }

        if (!validateMessages(body.messages)) {
            return Response.json({ error: "Invalid messages." }, { status: 400 });
        }

        const sanitizedMessages = body.messages.map((msg) => ({
            role: msg.role as "user" | "assistant",
            content: sanitizeInput(msg.content),
        }));

        // --- RAG: Get relevant knowledge ---
        const lastUserMessage = sanitizedMessages[sanitizedMessages.length - 1]?.content || "";
        const knowledge = await retrieveKnowledge(lastUserMessage);

        // --- Build system prompt with RAG context ---
        let systemPrompt =
            "You are ChotuBot Admin Assistant — an advanced AI for the admin of ChotuBot. " +
            "You have deeper knowledge and provide detailed, technical responses. " +
            "Be thorough, precise, and professional.";

        if (knowledge) {
            systemPrompt +=
                "\n\n## Knowledge Base Context\n" +
                "Use the following knowledge base information to answer the admin's question. " +
                "If the information below is relevant, base your answer on it. " +
                "If it's not relevant to the question, you can ignore it and answer from your general knowledge. " +
                "Always be transparent about whether your answer comes from the knowledge base or general knowledge.\n\n" +
                knowledge;
        }

        // --- Call Groq API ---
        const groq = new Groq({ apiKey });

        const chatCompletion = await groq.chat.completions.create({
            messages: [
                { role: "system", content: systemPrompt },
                ...sanitizedMessages,
            ],
            model: "llama-3.3-70b-versatile",
            temperature: 0.6,
            max_tokens: 2048,
            top_p: 1,
        });

        const aiResponse =
            chatCompletion.choices[0]?.message?.content ||
            "Sorry, I could not generate a response.";

        return Response.json({
            message: aiResponse,
            ragUsed: !!knowledge,
        });
    } catch (error: unknown) {
        console.error("Admin chat error:", error);
        const statusError = error as { status?: number };
        if (statusError?.status === 429) {
            return Response.json({ error: "AI service busy. Try again." }, { status: 429 });
        }
        return Response.json({ error: "Something went wrong." }, { status: 500 });
    }
}
