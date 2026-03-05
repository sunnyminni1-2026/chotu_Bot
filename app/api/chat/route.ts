import Groq from "groq-sdk";
import { NextRequest } from "next/server";
import { trackSession, logChat, logError } from "@/lib/tracking";

// ==================================================
// RATE LIMITER — In-memory, per-IP
// ==================================================
const rateLimitStore = new Map<
    string,
    { count: number; firstRequestTime: number }
>();
const MAX_REQUESTS = 20;
const WINDOW_MS = 60 * 1000;

function checkRateLimit(ip: string) {
    const now = Date.now();
    const record = rateLimitStore.get(ip);

    if (rateLimitStore.size > 100) {
        for (const [key, val] of rateLimitStore) {
            if (now - val.firstRequestTime > WINDOW_MS) rateLimitStore.delete(key);
        }
    }

    if (!record || now - record.firstRequestTime > WINDOW_MS) {
        rateLimitStore.set(ip, { count: 1, firstRequestTime: now });
        return { allowed: true, remaining: MAX_REQUESTS - 1 };
    }

    if (record.count >= MAX_REQUESTS) {
        const resetIn = Math.ceil(
            (record.firstRequestTime + WINDOW_MS - now) / 1000
        );
        return { allowed: false, remaining: 0, resetIn };
    }

    record.count++;
    return { allowed: true, remaining: MAX_REQUESTS - record.count };
}

function sanitizeInput(text: string): string {
    if (typeof text !== "string") return "";
    return text.trim().slice(0, 2000).replace(/\0/g, "");
}

interface ChatMessage {
    role: string;
    content: string;
}

function validateMessages(messages: unknown): messages is ChatMessage[] {
    if (!Array.isArray(messages)) return false;
    if (messages.length === 0 || messages.length > 50) return false;
    return messages.every(
        (msg) =>
            msg &&
            typeof msg.role === "string" &&
            typeof msg.content === "string" &&
            ["user", "assistant"].includes(msg.role) &&
            msg.content.length > 0 &&
            msg.content.length <= 2000
    );
}

export async function POST(request: NextRequest) {
    const forwarded = request.headers.get("x-forwarded-for");
    const ip = forwarded ? forwarded.split(",")[0].trim() : "unknown";

    try {
        // --- API Key ---
        const apiKey = process.env.GROQ_API_KEY?.trim();
        if (!apiKey || apiKey === "your_groq_api_key_here") {
            return Response.json(
                { error: "Server misconfiguration. Contact admin." },
                { status: 500 }
            );
        }

        // --- Rate Limiting ---
        const rateCheck = checkRateLimit(ip);
        if (!rateCheck.allowed) {
            return Response.json(
                {
                    error: `Rate limit exceeded. Please wait ${rateCheck.resetIn} seconds.`,
                    retryAfter: rateCheck.resetIn,
                },
                {
                    status: 429,
                    headers: {
                        "Retry-After": String(rateCheck.resetIn),
                        "X-RateLimit-Remaining": "0",
                    },
                }
            );
        }

        // --- Track Session ---
        const userAgent = request.headers.get("user-agent") || "unknown";
        const sessionId = await trackSession(ip, userAgent, "/api/chat");

        // --- Parse & Validate ---
        let body: { messages?: unknown };
        try {
            body = await request.json();
        } catch {
            return Response.json({ error: "Invalid JSON body." }, { status: 400 });
        }

        if (!validateMessages(body.messages)) {
            return Response.json(
                { error: "Invalid messages format." },
                { status: 400 }
            );
        }

        const sanitizedMessages = body.messages.map((msg) => ({
            role: msg.role as "user" | "assistant",
            content: sanitizeInput(msg.content),
        }));

        // --- Log user message ---
        const lastUserMsg = sanitizedMessages[sanitizedMessages.length - 1];
        if (lastUserMsg && sessionId) {
            await logChat(sessionId, "user", lastUserMsg.content, "user_chat");
        }

        // --- Call Groq API ---
        const groq = new Groq({ apiKey });

        const chatCompletion = await groq.chat.completions.create({
            messages: [
                {
                    role: "system",
                    content:
                        "You are ChotuBot, a friendly and helpful AI assistant. " +
                        "Keep responses concise, clear, and helpful. " +
                        "Be conversational but informative. " +
                        "If you don't know something, say so honestly.",
                },
                ...sanitizedMessages,
            ],
            model: "llama-3.3-70b-versatile",
            temperature: 0.7,
            max_tokens: 1024,
            top_p: 1,
        });

        const aiResponse =
            chatCompletion.choices[0]?.message?.content ||
            "Sorry, I could not generate a response.";

        // --- Log AI response ---
        if (sessionId) {
            await logChat(sessionId, "assistant", aiResponse, "user_chat");
        }

        return Response.json(
            { message: aiResponse },
            {
                status: 200,
                headers: {
                    "X-RateLimit-Remaining": String(rateCheck.remaining),
                },
            }
        );
    } catch (error: unknown) {
        console.error("Chat API Error:", error);
        await logError("/api/chat", String(error), 500, ip);

        const statusError = error as { status?: number };
        if (statusError?.status === 429) {
            return Response.json(
                { error: "AI service is busy. Please try again in a moment." },
                { status: 429 }
            );
        }

        return Response.json(
            { error: "Something went wrong. Please try again." },
            { status: 500 }
        );
    }
}

export async function GET() {
    return Response.json({ error: "Method not allowed." }, { status: 405 });
}
