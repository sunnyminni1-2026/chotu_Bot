import Groq from "groq-sdk";
import { NextRequest } from "next/server";
import { verifyToken, getAuthCookieOptions } from "@/lib/auth";
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

        // --- Rate Limiting (more generous for admin) ---
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

        // --- Call Groq API (admin system prompt) ---
        const groq = new Groq({ apiKey });

        const chatCompletion = await groq.chat.completions.create({
            messages: [
                {
                    role: "system",
                    content:
                        "You are ChotuBot Admin Assistant — an advanced AI for the admin of ChotuBot. " +
                        "You have deeper knowledge and provide detailed, technical responses. " +
                        "You can help with system management, data analysis, and technical queries. " +
                        "Be thorough, precise, and professional. " +
                        "In the future, you will have access to the admin's knowledge base via RAG.",
                },
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

        return Response.json({ message: aiResponse });
    } catch (error: unknown) {
        console.error("Admin chat error:", error);
        const statusError = error as { status?: number };
        if (statusError?.status === 429) {
            return Response.json({ error: "AI service busy. Try again." }, { status: 429 });
        }
        return Response.json({ error: "Something went wrong." }, { status: 500 });
    }
}
