// Admin analytics API
import { verifyToken, getAuthCookieOptions } from "@/lib/auth";
import { cookies } from "next/headers";
import { getDatabase } from "@/lib/mongodb";

export async function GET() {
    try {
        // Auth check
        const cookieStore = await cookies();
        const token = cookieStore.get(getAuthCookieOptions().name)?.value;
        if (!token) return Response.json({ error: "Unauthorized." }, { status: 401 });
        const payload = await verifyToken(token);
        if (!payload || payload.role !== "admin") return Response.json({ error: "Unauthorized." }, { status: 401 });

        const db = await getDatabase();
        const now = new Date();

        // Time ranges
        const last24h = new Date(now.getTime() - 24 * 60 * 60 * 1000);
        const last7d = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
        const last30d = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);

        // Parallel queries for speed
        const [
            totalSessions,
            sessions24h,
            sessions7d,
            totalChats,
            chats24h,
            chats7d,
            totalErrors,
            errors24h,
            knowledgeDocs,
            knowledgeChunks,
            chatsByDay,
        ] = await Promise.all([
            db.collection("sessions").estimatedDocumentCount(),
            db.collection("sessions").countDocuments({ lastSeen: { $gte: last24h } }),
            db.collection("sessions").countDocuments({ lastSeen: { $gte: last7d } }),
            db.collection("chat_logs").estimatedDocumentCount(),
            db.collection("chat_logs").countDocuments({ timestamp: { $gte: last24h } }),
            db.collection("chat_logs").countDocuments({ timestamp: { $gte: last7d } }),
            db.collection("error_logs").estimatedDocumentCount(),
            db.collection("error_logs").countDocuments({ timestamp: { $gte: last24h } }),
            db.collection("documents").estimatedDocumentCount(),
            db.collection("chunks").estimatedDocumentCount(),
            // Chat volume by day (last 7 days)
            db.collection("chat_logs").aggregate([
                { $match: { timestamp: { $gte: last7d } } },
                {
                    $group: {
                        _id: { $dateToString: { format: "%Y-%m-%d", date: "$timestamp" } },
                        count: { $sum: 1 },
                    },
                },
                { $sort: { _id: 1 } },
            ]).toArray(),
        ]);

        // Estimate usage as percentage of free tier limits
        const freeTierLimits = {
            sessions: 500,
            messages: 5000,
            knowledgeDocs: 10,
            storage: 512, // MB
        };

        return Response.json({
            overview: {
                totalSessions,
                sessions24h,
                sessions7d,
                totalChats,
                chats24h,
                chats7d,
                totalErrors,
                errors24h,
                knowledgeDocs,
                knowledgeChunks,
            },
            usage: {
                sessionsUsed: Math.round((totalSessions / freeTierLimits.sessions) * 100),
                messagesUsed: Math.round((totalChats / freeTierLimits.messages) * 100),
                docsUsed: Math.round((knowledgeDocs / freeTierLimits.knowledgeDocs) * 100),
            },
            chartData: chatsByDay,
            limits: freeTierLimits,
            plan: "free",
        }, {
            headers: {
                "Cache-Control": "s-maxage=30, stale-while-revalidate=60",
            },
        });
    } catch (error) {
        console.error("Analytics error:", error);
        return Response.json({ error: "Failed to fetch analytics." }, { status: 500 });
    }
}
