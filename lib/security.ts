// XSS protection — sanitize user content before rendering
// and constant-time string comparison for auth

/**
 * Sanitize text for safe HTML rendering.
 * Escapes HTML entities to prevent XSS attacks.
 */
export function sanitizeForDisplay(text: string): string {
    return text
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#x27;");
}

/**
 * Constant-time string comparison to prevent timing attacks.
 * Used for password verification.
 */
export async function secureCompare(a: string, b: string): Promise<boolean> {
    const encoder = new TextEncoder();
    const aBytes = encoder.encode(a);
    const bBytes = encoder.encode(b);

    // Hash both to ensure equal length comparison
    const aHash = await crypto.subtle.digest("SHA-256", aBytes);
    const bHash = await crypto.subtle.digest("SHA-256", bBytes);

    const aArr = new Uint8Array(aHash);
    const bArr = new Uint8Array(bHash);

    if (aArr.length !== bArr.length) return false;

    let result = 0;
    for (let i = 0; i < aArr.length; i++) {
        result |= aArr[i] ^ bArr[i];
    }
    return result === 0;
}
