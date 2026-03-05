import { NextRequest, NextResponse } from "next/server";

export async function middleware(request: NextRequest) {
    const { pathname } = request.nextUrl;

    // Protect /admin routes (except /admin/login)
    if (pathname.startsWith("/admin") && !pathname.startsWith("/admin/login")) {
        const token = request.cookies.get("chotubot-auth")?.value;

        if (!token) {
            return NextResponse.redirect(new URL("/admin/login", request.url));
        }

        const parts = token.split(".");
        if (parts.length !== 3) {
            return NextResponse.redirect(new URL("/admin/login", request.url));
        }

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

    // Protect /chat — require Google OAuth session
    if (pathname.startsWith("/chat")) {
        // NextAuth stores session in these cookies
        const sessionToken =
            request.cookies.get("next-auth.session-token")?.value ||
            request.cookies.get("__Secure-next-auth.session-token")?.value;

        if (!sessionToken) {
            return NextResponse.redirect(new URL("/auth/signin", request.url));
        }
    }

    return NextResponse.next();
}

export const config = {
    matcher: ["/admin/:path*", "/chat/:path*"],
};
