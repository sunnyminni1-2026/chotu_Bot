import { NextRequest, NextResponse } from "next/server";

export async function middleware(request: NextRequest) {
    const { pathname } = request.nextUrl;

    // Only protect /admin routes (except /admin/login)
    if (pathname.startsWith("/admin") && !pathname.startsWith("/admin/login")) {
        const token = request.cookies.get("chotubot-auth")?.value;

        if (!token) {
            return NextResponse.redirect(new URL("/admin/login", request.url));
        }

        // Basic token structure check (full verification happens in API routes)
        const parts = token.split(".");
        if (parts.length !== 3) {
            return NextResponse.redirect(new URL("/admin/login", request.url));
        }

        // Check token expiry from payload
        try {
            const payload = JSON.parse(atob(parts[1]));
            if (payload.exp && payload.exp < Math.floor(Date.now() / 1000)) {
                const response = NextResponse.redirect(new URL("/admin/login", request.url));
                response.cookies.delete("chotubot-auth");
                return response;
            }
        } catch {
            return NextResponse.redirect(new URL("/admin/login", request.url));
        }
    }

    return NextResponse.next();
}

export const config = {
    matcher: ["/admin/:path*"],
};
