// User tracking — sessions, chats, visits → MongoDB
import { getDatabase } from "./mongodb";

const COLLECTIONS = {
    SESSIONS: "sessions",
    CHAT_LOGS: "chat_logs",
    ERROR_LOGS: "error_logs",
};

// ============================
// Session Tracking
// ============================
function hashIP(ip: string): string {
    // Simple hash for privacy — don't store raw IPs
    let hash = 0;
    for (let i = 0; i < ip.length; i++) {
        const chr = ip.charCodeAt(i);
        hash = ((hash << 5) - hash) + chr;
        hash |= 0;
    }
    return "sess_" + Math.abs(hash).toString(36);
}

export async function trackSession(ip: string, userAgent: string, path: string) {
    try {
        const db = await getDatabase();
        const sessionId = hashIP(ip);

        await db.collection(COLLECTIONS.SESSIONS).updateOne(
            { sessionId },
            {
                $set: {
                    sessionId,
                    userAgent: userAgent.slice(0, 200),
                    lastSeen: new Date(),
                },
                $inc: { visitCount: 1 },
                $push: {
                    visits: {
                        $each: [{ path, timestamp: new Date() }],
                        $slice: -50, // Keep last 50 visits
                    },
                } as Record<string, unknown>,
                $setOnInsert: {
                    firstSeen: new Date(),
                },
            },
            { upsert: true }
        );

        return sessionId;
    } catch (error) {
        console.error("Track session error:", error);
        return null;
    }
}

// ============================
// Chat Logging
// ============================
export async function logChat(
    sessionId: string,
    role: "user" | "assistant",
    content: string,
    source: "user_chat" | "admin_chat" = "user_chat",
    ragUsed: boolean = false
) {
    try {
        const db = await getDatabase();
        await db.collection(COLLECTIONS.CHAT_LOGS).insertOne({
            sessionId,
            role,
            content: content.slice(0, 2000),
            source,
            ragUsed,
            timestamp: new Date(),
        });
    } catch (error) {
        console.error("Log chat error:", error);
    }
}

// ============================
// Error Logging
// ============================
export async function logError(
    route: string,
    errorMessage: string,
    statusCode: number,
    ip?: string
) {
    try {
        const db = await getDatabase();
        await db.collection(COLLECTIONS.ERROR_LOGS).insertOne({
            route,
            error: errorMessage.slice(0, 500),
            statusCode,
            sessionId: ip ? hashIP(ip) : "unknown",
            timestamp: new Date(),
        });
    } catch (error) {
        console.error("Log error error:", error);
    }
}

// ============================
// Query Functions (for AI Agent tools)
// ============================
export async function countSessions(hoursBack: number = 24): Promise<number> {
    const db = await getDatabase();
    const since = new Date(Date.now() - hoursBack * 60 * 60 * 1000);
    return db.collection(COLLECTIONS.SESSIONS).countDocuments({
        lastSeen: { $gte: since },
    });
}

export async function countChats(hoursBack: number = 24, source?: string): Promise<number> {
    const db = await getDatabase();
    const since = new Date(Date.now() - hoursBack * 60 * 60 * 1000);
    const filter: Record<string, unknown> = { timestamp: { $gte: since } };
    if (source) filter.source = source;
    return db.collection(COLLECTIONS.CHAT_LOGS).countDocuments(filter);
}

export async function getTopUsers(limit: number = 5, hoursBack: number = 24) {
    const db = await getDatabase();
    const since = new Date(Date.now() - hoursBack * 60 * 60 * 1000);
    return db.collection(COLLECTIONS.CHAT_LOGS).aggregate([
        { $match: { timestamp: { $gte: since }, role: "user" } },
        { $group: { _id: "$sessionId", messageCount: { $sum: 1 }, lastMessage: { $max: "$timestamp" } } },
        { $sort: { messageCount: -1 } },
        { $limit: limit },
    ]).toArray();
}

export async function searchUserSession(query: string) {
    const db = await getDatabase();
    return db.collection(COLLECTIONS.SESSIONS).find({
        sessionId: { $regex: query, $options: "i" },
    }).limit(10).toArray();
}

export async function getRecentErrors(limit: number = 10, hoursBack: number = 24) {
    const db = await getDatabase();
    const since = new Date(Date.now() - hoursBack * 60 * 60 * 1000);
    return db.collection(COLLECTIONS.ERROR_LOGS)
        .find({ timestamp: { $gte: since } })
        .sort({ timestamp: -1 })
        .limit(limit)
        .toArray();
}

export async function getSystemHealth() {
    const db = await getDatabase();
    const [sessions, chats, errors, documents, chunks] = await Promise.all([
        db.collection(COLLECTIONS.SESSIONS).estimatedDocumentCount(),
        db.collection(COLLECTIONS.CHAT_LOGS).estimatedDocumentCount(),
        db.collection(COLLECTIONS.ERROR_LOGS).estimatedDocumentCount(),
        db.collection("documents").estimatedDocumentCount(),
        db.collection("chunks").estimatedDocumentCount(),
    ]);
    return {
        totalSessions: sessions,
        totalChats: chats,
        totalErrors: errors,
        knowledgeDocs: documents,
        knowledgeChunks: chunks,
        dbStatus: "connected",
        timestamp: new Date().toISOString(),
    };
}

export async function getChatHistory(sessionId: string, limit: number = 20) {
    const db = await getDatabase();
    return db.collection(COLLECTIONS.CHAT_LOGS)
        .find({ sessionId })
        .sort({ timestamp: -1 })
        .limit(limit)
        .toArray();
}
