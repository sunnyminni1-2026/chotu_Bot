import Groq from "groq-sdk";
// eslint-disable-next-line @typescript-eslint/no-explicit-any
type GroqTool = any;
import { NextRequest } from "next/server";
import { verifyToken, getAuthCookieOptions } from "@/lib/auth";
import { generateEmbedding, ragSearch } from "@/lib/embeddings";
import { getDatabase, COLLECTIONS } from "@/lib/mongodb";
import {
    countSessions,
    countChats,
    getTopUsers,
    searchUserSession,
    getRecentErrors,
    getSystemHealth,
    getChatHistory,
    logChat,
} from "@/lib/tracking";
import { cookies } from "next/headers";

// Rate limiter
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
        return { allowed: true };
    }
    if (record.count >= MAX_REQUESTS) {
        const resetIn = Math.ceil((record.firstRequestTime + WINDOW_MS - now) / 1000);
        return { allowed: false, resetIn };
    }
    record.count++;
    return { allowed: true };
}

function sanitizeInput(text: string): string {
    if (typeof text !== "string") return "";
    return text.trim().slice(0, 4000).replace(/\0/g, "");
}

interface ChatMessage { role: string; content: string; }

function validateMessages(messages: unknown): messages is ChatMessage[] {
    if (!Array.isArray(messages)) return false;
    if (messages.length === 0 || messages.length > 100) return false;
    return messages.every(
        (msg) => msg && typeof msg.role === "string" && typeof msg.content === "string" &&
            ["user", "assistant"].includes(msg.role) && msg.content.length > 0 && msg.content.length <= 4000
    );
}

// ============================
// AI AGENT TOOL DEFINITIONS
// ============================
const AGENT_TOOLS: GroqTool[] = [
    {
        type: "function",
        function: {
            name: "count_users",
            description: "Count unique user sessions in a time range. Use for questions like 'how many users today', 'active users this week'.",
            parameters: {
                type: "object",
                properties: {
                    hours_back: { type: "number", description: "Number of hours to look back. Default 24 for 'today', 168 for 'week', 720 for 'month'." },
                },
                required: [],
            },
        },
    },
    {
        type: "function",
        function: {
            name: "count_chats",
            description: "Count total chat messages in a time range. Use for 'how many messages', 'chat volume'.",
            parameters: {
                type: "object",
                properties: {
                    hours_back: { type: "number", description: "Hours to look back." },
                    source: { type: "string", enum: ["user_chat", "admin_chat"], description: "Filter by chat source." },
                },
                required: [],
            },
        },
    },
    {
        type: "function",
        function: {
            name: "top_users",
            description: "Get most active users by message count. Use for 'most active users', 'top chatters', 'who messages the most'.",
            parameters: {
                type: "object",
                properties: {
                    limit: { type: "number", description: "Number of top users to return. Default 5." },
                    hours_back: { type: "number", description: "Hours to look back. Default 24." },
                },
                required: [],
            },
        },
    },
    {
        type: "function",
        function: {
            name: "search_user",
            description: "Search for a user session by ID or partial match. Use for 'tell me about user X', 'find user'.",
            parameters: {
                type: "object",
                properties: {
                    query: { type: "string", description: "Session ID or partial match to search for." },
                },
                required: ["query"],
            },
        },
    },
    {
        type: "function",
        function: {
            name: "get_errors",
            description: "Get recent error logs. Use for 'any errors?', 'what went wrong', 'show me errors'.",
            parameters: {
                type: "object",
                properties: {
                    limit: { type: "number", description: "Number of errors to return. Default 10." },
                    hours_back: { type: "number", description: "Hours to look back. Default 24." },
                },
                required: [],
            },
        },
    },
    {
        type: "function",
        function: {
            name: "system_health",
            description: "Get system health stats: total sessions, chats, errors, knowledge docs, DB status. Use for 'system status', 'health check', 'how is the system'.",
            parameters: { type: "object", properties: {}, required: [] },
        },
    },
    {
        type: "function",
        function: {
            name: "search_knowledge",
            description: "Search the knowledge base using RAG. Use for questions about uploaded documents, FAQs, or company info.",
            parameters: {
                type: "object",
                properties: {
                    query: { type: "string", description: "The search query." },
                },
                required: ["query"],
            },
        },
    },
    {
        type: "function",
        function: {
            name: "chat_history",
            description: "Get chat history for a specific user session. Use for 'what did user X say', 'show me their conversation'.",
            parameters: {
                type: "object",
                properties: {
                    session_id: { type: "string", description: "The session ID to get history for." },
                    limit: { type: "number", description: "Number of messages. Default 20." },
                },
                required: ["session_id"],
            },
        },
    },
];

// ============================
// TOOL EXECUTOR
// ============================
async function executeTool(name: string, args: Record<string, unknown>): Promise<string> {
    try {
        switch (name) {
            case "count_users": {
                const hours = (args.hours_back as number) || 24;
                const count = await countSessions(hours);
                return JSON.stringify({ users: count, period: `last ${hours} hours` });
            }
            case "count_chats": {
                const hours = (args.hours_back as number) || 24;
                const source = args.source as string | undefined;
                const count = await countChats(hours, source);
                return JSON.stringify({ messages: count, period: `last ${hours} hours`, source: source || "all" });
            }
            case "top_users": {
                const limit = (args.limit as number) || 5;
                const hours = (args.hours_back as number) || 24;
                const users = await getTopUsers(limit, hours);
                return JSON.stringify({ topUsers: users, period: `last ${hours} hours` });
            }
            case "search_user": {
                const sessions = await searchUserSession(args.query as string);
                return JSON.stringify({ sessions, count: sessions.length });
            }
            case "get_errors": {
                const limit = (args.limit as number) || 10;
                const hours = (args.hours_back as number) || 24;
                const errors = await getRecentErrors(limit, hours);
                return JSON.stringify({ errors, count: errors.length, period: `last ${hours} hours` });
            }
            case "system_health": {
                const health = await getSystemHealth();
                return JSON.stringify(health);
            }
            case "search_knowledge": {
                const query = args.query as string;
                const result = await ragSearch(query);
                return result || "No relevant knowledge found.";
            }
            case "chat_history": {
                const sid = args.session_id as string;
                const limit = (args.limit as number) || 20;
                const history = await getChatHistory(sid, limit);
                return JSON.stringify({ messages: history, count: history.length });
            }
            default:
                return JSON.stringify({ error: `Unknown tool: ${name}` });
        }
    } catch (error) {
        return JSON.stringify({ error: `Tool execution failed: ${error}` });
    }
}

// Main handler removed ragSearch local impl

// ============================
// MAIN HANDLER
// ============================
export async function POST(request: NextRequest) {
    try {
        // Auth check
        const cookieStore = await cookies();
        const token = cookieStore.get(getAuthCookieOptions().name)?.value;
        if (!token) return Response.json({ error: "Unauthorized." }, { status: 401 });
        const payload = await verifyToken(token);
        if (!payload || payload.role !== "admin") return Response.json({ error: "Unauthorized." }, { status: 401 });

        // API key
        const apiKey = process.env.GROQ_API_KEY?.trim();
        if (!apiKey) return Response.json({ error: "Server misconfiguration." }, { status: 500 });

        // Rate limit
        const forwarded = request.headers.get("x-forwarded-for");
        const ip = forwarded ? forwarded.split(",")[0].trim() : "unknown";
        const rateCheck = checkRateLimit(ip);
        if (!rateCheck.allowed) {
            return Response.json({ error: `Rate limit. Wait ${rateCheck.resetIn}s.` }, { status: 429 });
        }

        // Parse
        let body: { messages?: unknown };
        try { body = await request.json(); } catch { return Response.json({ error: "Invalid JSON." }, { status: 400 }); }
        if (!validateMessages(body.messages)) return Response.json({ error: "Invalid messages." }, { status: 400 });

        const sanitizedMessages = body.messages.map((msg) => ({
            role: msg.role as "user" | "assistant",
            content: sanitizeInput(msg.content),
        }));

        // Log admin message
        const lastUserMsg = sanitizedMessages[sanitizedMessages.length - 1];
        if (lastUserMsg) await logChat("admin", "user", lastUserMsg.content, "admin_chat");

        // Call Groq with tools (AI Agent)
        const groq = new Groq({ apiKey });

        const systemPrompt =
            "You are ChotuBot Admin Agent — an intelligent AI assistant for the admin of ChotuBot. " +
            "You have access to tools that let you query live data from the system. " +
            "When the admin asks about users, chats, errors, or system health, USE THE TOOLS. Do not guess numbers. " +
            "When asked about knowledge base content, use search_knowledge. " +
            "Always answer in a clear, professional but friendly tone. " +
            "If a question is vague, still try your best — call the most relevant tool. " +
            "After getting tool results, format them nicely in your response with key numbers highlighted. " +
            "If the admin uses broken English or informal language, understand the intent and respond properly.";

        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const allMessages: any[] = [
            { role: "system", content: systemPrompt },
            ...sanitizedMessages,
        ];

        let completion = await groq.chat.completions.create({
            messages: allMessages,
            model: "llama-3.3-70b-versatile",
            temperature: 0.5,
            max_tokens: 2048,
            tools: AGENT_TOOLS,
            tool_choice: "auto",
        });

        let responseMessage = completion.choices[0]?.message;
        let toolsUsed = false;

        // Handle tool calls (iterative — LLM may call multiple tools)
        let iterations = 0;
        while (responseMessage?.tool_calls && responseMessage.tool_calls.length > 0 && iterations < 3) {
            toolsUsed = true;
            iterations++;

            // Add assistant's tool call message
            allMessages.push({
                role: "assistant",
                tool_calls: responseMessage.tool_calls,
                content: responseMessage.content || "",
            });

            // Execute each tool and add results
            for (const toolCall of responseMessage.tool_calls) {
                const args = JSON.parse(toolCall.function.arguments || "{}");
                const result = await executeTool(toolCall.function.name, args);

                allMessages.push({
                    role: "tool",
                    tool_call_id: toolCall.id,
                    content: result,
                });
            }

            // Call LLM again with tool results
            completion = await groq.chat.completions.create({
                messages: allMessages,
                model: "llama-3.3-70b-versatile",
                temperature: 0.5,
                max_tokens: 2048,
                tools: AGENT_TOOLS,
                tool_choice: "auto",
            });

            responseMessage = completion.choices[0]?.message;
        }

        const aiResponse = responseMessage?.content || "Sorry, I could not generate a response.";

        // Log response
        await logChat("admin", "assistant", aiResponse, "admin_chat", toolsUsed);

        return Response.json({
            message: aiResponse,
            ragUsed: toolsUsed,
        });
    } catch (error: unknown) {
        console.error("Admin agent error:", error);
        const statusError = error as { status?: number };
        if (statusError?.status === 429) {
            return Response.json({ error: "AI service busy." }, { status: 429 });
        }
        return Response.json({ error: "Something went wrong." }, { status: 500 });
    }
}

