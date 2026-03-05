import { NextRequest, NextResponse } from "next/server";
import { getDatabase } from "@/lib/mongodb";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { ObjectId } from "mongodb";

// GET /api/chat/history — get chat history for current user
export async function GET(request: NextRequest) {
    try {
        const session = await getServerSession(authOptions);
        if (!session?.user?.email) {
            return NextResponse.json({ conversations: [] });
        }

        const db = await getDatabase();
        const convos = await db
            .collection("conversations")
            .find({ userEmail: session.user.email })
            .sort({ updatedAt: -1 })
            .limit(20)
            .toArray();

        return NextResponse.json({
            conversations: convos.map((c: any) => ({
                id: c._id.toString(),
                title: c.title || "New Chat",
                messages: c.messages || [],
                createdAt: c.createdAt,
                updatedAt: c.updatedAt,
            })),
        });
    } catch (error) {
        console.error("History GET error:", error);
        return NextResponse.json({ conversations: [] });
    }
}

// POST /api/chat/history — save/update a conversation
export async function POST(request: NextRequest) {
    try {
        const session = await getServerSession(authOptions);
        if (!session?.user?.email) {
            return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
        }

        const body = await request.json();
        const { conversationId, messages, title } = body;

        if (!messages || !Array.isArray(messages)) {
            return NextResponse.json({ error: "Invalid messages" }, { status: 400 });
        }

        const db = await getDatabase();
        const collection = db.collection("conversations");

        if (conversationId && conversationId !== "null") {
            // Update existing conversation
            const updateResult = await collection.updateOne(
                { _id: new ObjectId(conversationId), userEmail: session.user.email },
                {
                    $set: {
                        messages,
                        title: title || messages[0]?.content?.slice(0, 50) || "Chat",
                        updatedAt: new Date(),
                    },
                }
            );

            if (updateResult.matchedCount === 0) {
                // If ID didn't match (e.g. invalid type or not found), create new
                const result = await collection.insertOne({
                    userEmail: session.user.email,
                    userName: session.user.name,
                    messages,
                    title: title || messages[0]?.content?.slice(0, 50) || "New Chat",
                    createdAt: new Date(),
                    updatedAt: new Date(),
                });
                return NextResponse.json({ conversationId: result.insertedId.toString() });
            }

            return NextResponse.json({ conversationId });
        } else {
            // Create new conversation
            const result = await collection.insertOne({
                userEmail: session.user.email,
                userName: session.user.name,
                messages,
                title: title || messages[0]?.content?.slice(0, 50) || "New Chat",
                createdAt: new Date(),
                updatedAt: new Date(),
            });
            return NextResponse.json({ conversationId: result.insertedId.toString() });
        }
    } catch (error) {
        console.error("History POST error:", error);
        return NextResponse.json({ error: "Failed to save" }, { status: 500 });
    }
}
