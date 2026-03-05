import GoogleProvider from "next-auth/providers/google";
import { getDatabase } from "@/lib/mongodb";
import { NextAuthOptions } from "next-auth";

// ============================
// PART 1: NextAuth Configuration (for Chat/User auth)
// ============================
export const authOptions: NextAuthOptions = {
    providers: [
        GoogleProvider({
            clientId: (process.env.GOOGLE_CLIENT_ID || "").trim(),
            clientSecret: (process.env.GOOGLE_CLIENT_SECRET || "").trim(),
        }),
    ],
    session: {
        strategy: "jwt",
        maxAge: 30 * 24 * 60 * 60, // 30 days
    },
    callbacks: {
        async signIn({ user }: { user: any }) {
            try {
                const db = await getDatabase();
                const usersCollection = db.collection("users");

                // Upsert user on sign-in
                await usersCollection.updateOne(
                    { email: user.email || "" },
                    {
                        $set: {
                            name: user.name,
                            email: user.email,
                            image: user.image,
                            lastLogin: new Date(),
                        },
                        $setOnInsert: {
                            createdAt: new Date(),
                            plan: "free",
                        },
                    },
                    { upsert: true }
                );

                return true;
            } catch (error) {
                console.error("Sign-in error:", error);
                return true; // Still allow sign-in even if DB fails
            }
        },
        async jwt({ token, user }: { token: any; user?: any }) {
            if (user) {
                token.id = user.id;
            }
            return token;
        },
        async session({ session, token }: { session: any; token: any }) {
            if (session?.user) {
                session.user.id = token.id;
            }
            return session;
        },
    },
    pages: {
        signIn: "/auth/signin",
    },
    secret: process.env.NEXTAUTH_SECRET,
};

// ============================
// PART 2: Custom JWT Auth (for Admin Panel)
// ============================
const JWT_SECRET = new TextEncoder().encode(
    process.env.JWT_SECRET || "chotubot-default-secret-change-me"
);
const TOKEN_EXPIRY = 24 * 60 * 60; // 24 hours in seconds

export async function createToken(payload: Record<string, unknown>): Promise<string> {
    const header = { alg: "HS256", typ: "JWT" };
    const now = Math.floor(Date.now() / 1000);
    const fullPayload = { ...payload, iat: now, exp: now + TOKEN_EXPIRY };

    const encodedHeader = base64url(JSON.stringify(header));
    const encodedPayload = base64url(JSON.stringify(fullPayload));
    const data = `${encodedHeader}.${encodedPayload}`;

    const key = await crypto.subtle.importKey(
        "raw",
        JWT_SECRET,
        { name: "HMAC", hash: "SHA-256" },
        false,
        ["sign"]
    );

    const signature = await crypto.subtle.sign(
        "HMAC",
        key,
        new TextEncoder().encode(data)
    );

    return `${data}.${base64url(signature)}`;
}

export async function verifyToken(token: string): Promise<Record<string, unknown> | null> {
    try {
        const parts = token.split(".");
        if (parts.length !== 3) return null;

        const [header, payload, sig] = parts;
        const data = `${header}.${payload}`;

        const key = await crypto.subtle.importKey(
            "raw",
            JWT_SECRET,
            { name: "HMAC", hash: "SHA-256" },
            false,
            ["verify"]
        );

        const signatureBytes = base64urlDecode(sig);
        const valid = await crypto.subtle.verify(
            "HMAC",
            key,
            signatureBytes.buffer as ArrayBuffer,
            new TextEncoder().encode(data)
        );

        if (!valid) return null;

        const decoded = JSON.parse(
            new TextDecoder().decode(base64urlDecode(payload))
        );

        if (decoded.exp && decoded.exp < Math.floor(Date.now() / 1000)) {
            return null;
        }

        return decoded;
    } catch {
        return null;
    }
}

export async function verifyCredentials(username: string, password: string): Promise<boolean> {
    const adminUser = (process.env.ADMIN_USERNAME || "").trim();
    const adminPass = (process.env.ADMIN_PASSWORD || "").trim();

    if (!adminUser || !adminPass) return false;

    const { secureCompare } = await import("./security");
    const userMatch = await secureCompare(username, adminUser);
    const passMatch = await secureCompare(password, adminPass);

    return userMatch && passMatch;
}

export function getAuthCookieOptions() {
    return {
        name: "chotubot-auth",
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "lax" as const,
        path: "/",
        maxAge: TOKEN_EXPIRY,
    };
}

// Utilities
function base64url(input: string | ArrayBuffer): string {
    let str: string;
    if (typeof input === "string") {
        str = btoa(input);
    } else {
        str = btoa(String.fromCharCode(...new Uint8Array(input)));
    }
    return str.replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

function base64urlDecode(input: string): Uint8Array {
    let str = input.replace(/-/g, "+").replace(/_/g, "/");
    while (str.length % 4) str += "=";
    const binary = atob(str);
    const bytes = new Uint8Array(binary.length);
    for (let i = 0; i < binary.length; i++) {
        bytes[i] = binary.charCodeAt(i);
    }
    return bytes;
}
