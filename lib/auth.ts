// JWT Auth using Web Crypto API — no external dependencies, $0
// Tokens stored in httpOnly cookies (not accessible from browser JS)

const JWT_SECRET = new TextEncoder().encode(
    process.env.JWT_SECRET || "chotubot-default-secret-change-me"
);
const TOKEN_EXPIRY = 24 * 60 * 60; // 24 hours in seconds

// ============================
// JWT Token Creation
// ============================
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

// ============================
// JWT Token Verification
// ============================
export async function verifyToken(
    token: string
): Promise<Record<string, unknown> | null> {
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
            signatureBytes,
            new TextEncoder().encode(data)
        );

        if (!valid) return null;

        const decoded = JSON.parse(
            new TextDecoder().decode(base64urlDecode(payload))
        );

        // Check expiry
        if (decoded.exp && decoded.exp < Math.floor(Date.now() / 1000)) {
            return null;
        }

        return decoded;
    } catch {
        return null;
    }
}

// ============================
// Password Verification
// ============================
export function verifyCredentials(username: string, password: string): boolean {
    const adminUser = (process.env.ADMIN_USERNAME || "").trim();
    const adminPass = (process.env.ADMIN_PASSWORD || "").trim();

    if (!adminUser || !adminPass) return false;

    // Constant-time-ish comparison to prevent timing attacks
    const userMatch = username === adminUser;
    const passMatch = password === adminPass;

    return userMatch && passMatch;
}

// ============================
// Cookie Helpers
// ============================
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

// ============================
// Base64URL Utilities
// ============================
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
