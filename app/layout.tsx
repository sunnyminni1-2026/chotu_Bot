import type { Metadata } from "next";
import "./globals.css";
import { AuthProvider } from "@/components/auth-provider";

export const metadata: Metadata = {
    title: {
        default: "ChotuBot — AI Agent for Your Business",
        template: "%s | ChotuBot",
    },
    description:
        "An AI Agent that queries your live database, searches your knowledge base, and answers in plain English. RAG-powered, $0 infrastructure cost. Built with Next.js, Groq, Gemini & MongoDB.",
    keywords: [
        "AI chatbot", "AI agent", "RAG chatbot", "knowledge base AI",
        "customer support AI", "Groq AI", "free AI chatbot", "SaaS chatbot",
        "business AI assistant", "MongoDB AI", "Next.js chatbot",
    ],
    authors: [{ name: "ChotuBot Team" }],
    creator: "ChotuBot",
    publisher: "ChotuBot",
    robots: { index: true, follow: true },
    openGraph: {
        type: "website",
        locale: "en_US",
        url: "https://chotubot.vercel.app",
        siteName: "ChotuBot",
        title: "ChotuBot — AI Agent for Your Business",
        description: "An AI Agent that queries your live database, searches your knowledge base, and answers in plain English. $0 cost.",
        images: [
            {
                url: "https://chotubot.vercel.app/og-image.png",
                width: 1200,
                height: 630,
                alt: "ChotuBot AI Agent",
            },
        ],
    },
    twitter: {
        card: "summary_large_image",
        title: "ChotuBot — AI Agent for Your Business",
        description: "RAG-powered AI that queries live data & knowledge base. $0 cost.",
        images: ["https://chotubot.vercel.app/og-image.png"],
    },
    metadataBase: new URL("https://chotubot.vercel.app"),
    alternates: { canonical: "/" },
};

export default function RootLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    return (
        <html lang="en" className="dark">
            <head>
                <link rel="preconnect" href="https://fonts.googleapis.com" />
                <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
                <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&display=swap" rel="stylesheet" />
            </head>
            <body style={{ fontFamily: "'Inter', system-ui, sans-serif" }}>
                <AuthProvider>{children}</AuthProvider>
            </body>
        </html>
    );
}
