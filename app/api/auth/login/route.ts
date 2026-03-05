import { NextRequest } from "next/server";
import { createToken, verifyCredentials, getAuthCookieOptions } from "@/lib/auth";
import { cookies } from "next/headers";

// Login rate limiter — 5 attempts per minute per IP
const loginRateLimit = new Map<string, { count: number; firstAttempt: number }>();
const MAX_LOGIN_ATTEMPTS = 5;
const LOGIN_WINDOW_MS = 60 * 1000;

function checkLoginRateLimit(ip: string): { allowed: boolean; resetIn?: number } {
    const now = Date.now();
    const record = loginRateLimit.get(ip);

    if (loginRateLimit.size > 50) {
        for (const [key, val] of loginRateLimit) {
            if (now - val.firstAttempt > LOGIN_WINDOW_MS) loginRateLimit.delete(key);
        }
    }

    if (!record || now - record.firstAttempt > LOGIN_WINDOW_MS) {
        loginRateLimit.set(ip, { count: 1, firstAttempt: now });
        return { allowed: true };
    }

    if (record.count >= MAX_LOGIN_ATTEMPTS) {
        const resetIn = Math.ceil((record.firstAttempt + LOGIN_WINDOW_MS - now) / 1000);
        return { allowed: false, resetIn };
    }

    record.count++;
    return { allowed: true };
}

export async function POST(request: NextRequest) {
    try {
        // Rate limit
        const forwarded = request.headers.get("x-forwarded-for");
        const ip = forwarded ? forwarded.split(",")[0].trim() : "unknown";
        const rateCheck = checkLoginRateLimit(ip);

        if (!rateCheck.allowed) {
            return Response.json(
                { error: `Too many attempts. Try again in ${rateCheck.resetIn}s.` },
                { status: 429 }
            );
        }

        // Parse body
        let body: { username?: string; password?: string };
        try {
            body = await request.json();
        } catch {
            return Response.json({ error: "Invalid request." }, { status: 400 });
        }

        const { username, password } = body;
        if (!username || !password || typeof username !== "string" || typeof password !== "string") {
            return Response.json({ error: "Username and password are required." }, { status: 400 });
        }

        // Verify credentials
        const valid = await verifyCredentials(username.trim(), password);
        if (!valid) {
            return Response.json({ error: "Invalid credentials." }, { status: 401 });
        }

        // Create JWT and set cookie
        const token = await createToken({ role: "admin", username: username.trim() });
        const cookieOptions = getAuthCookieOptions();
        const cookieStore = await cookies();

        cookieStore.set(cookieOptions.name, token, {
            httpOnly: cookieOptions.httpOnly,
            secure: cookieOptions.secure,
            sameSite: cookieOptions.sameSite,
            path: cookieOptions.path,
            maxAge: cookieOptions.maxAge,
        });

        return Response.json({ success: true, message: "Login successful." });
    } catch (error) {
        console.error("Login error:", error);
        return Response.json({ error: "Internal server error." }, { status: 500 });
    }
}
