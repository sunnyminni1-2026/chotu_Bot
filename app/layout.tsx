import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
    title: "ChotuBot — AI Chat Assistant",
    description:
        "A smart AI-powered chat assistant with RAG capabilities. Built with Next.js and Groq.",
    keywords: ["AI", "chatbot", "assistant", "ChotuBot"],
};

export default function RootLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    return (
        <html lang="en" className="dark">
            <body>{children}</body>
        </html>
    );
}
