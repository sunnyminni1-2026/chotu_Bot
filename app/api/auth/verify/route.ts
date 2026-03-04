import { verifyToken, getAuthCookieOptions } from "@/lib/auth";
import { cookies } from "next/headers";

export async function GET() {
    try {
        const cookieStore = await cookies();
        const token = cookieStore.get(getAuthCookieOptions().name)?.value;

        if (!token) {
            return Response.json({ authenticated: false }, { status: 401 });
        }

        const payload = await verifyToken(token);
        if (!payload) {
            return Response.json({ authenticated: false }, { status: 401 });
        }

        return Response.json({
            authenticated: true,
            user: { role: payload.role, username: payload.username },
        });
    } catch {
        return Response.json({ authenticated: false }, { status: 401 });
    }
}
