import { getAuthCookieOptions } from "@/lib/auth";
import { cookies } from "next/headers";

export async function POST() {
    const cookieOptions = getAuthCookieOptions();
    const cookieStore = await cookies();

    cookieStore.set(cookieOptions.name, "", {
        httpOnly: cookieOptions.httpOnly,
        secure: cookieOptions.secure,
        sameSite: cookieOptions.sameSite,
        path: cookieOptions.path,
        maxAge: 0, // expire immediately
    });

    return Response.json({ success: true, message: "Logged out." });
}
