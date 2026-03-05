"use client";

import { signIn } from "next-auth/react";
import { motion } from "framer-motion";
import { Bot, Chrome } from "lucide-react";

export default function SignInPage() {
    return (
        <div className="min-h-screen flex items-center justify-center relative overflow-hidden">
            {/* Background effects */}
            <div className="fixed inset-0 overflow-hidden pointer-events-none z-0">
                <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-violet-500/15 rounded-full blur-[128px] animate-pulse" />
                <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-indigo-500/15 rounded-full blur-[128px] animate-pulse delay-700" />
            </div>

            <motion.div
                className="relative z-10 w-full max-w-md mx-4"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5 }}
            >
                <div className="bg-white/[0.03] backdrop-blur-xl border border-white/[0.08] rounded-3xl p-8 shadow-2xl">
                    {/* Logo */}
                    <div className="flex flex-col items-center mb-8">
                        <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-violet-500 to-indigo-600 flex items-center justify-center shadow-lg shadow-violet-500/30 mb-4">
                            <Bot className="w-8 h-8 text-white" />
                        </div>
                        <h1 className="text-2xl font-bold bg-gradient-to-r from-white to-white/70 bg-clip-text text-transparent">
                            Welcome to ChotuBot
                        </h1>
                        <p className="text-sm text-white/40 mt-2 text-center">
                            Sign in to save your chats and get personalized AI assistance
                        </p>
                    </div>

                    {/* Google Sign In */}
                    <motion.button
                        onClick={() => signIn("google", { callbackUrl: "/chat" })}
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                        className="w-full flex items-center justify-center gap-3 px-6 py-3.5 bg-white/[0.06] hover:bg-white/[0.1] border border-white/[0.1] rounded-xl text-white/90 font-medium transition-all duration-200"
                    >
                        <Chrome className="w-5 h-5" />
                        Continue with Google
                    </motion.button>

                    {/* Features preview */}
                    <div className="mt-8 space-y-3">
                        {[
                            { emoji: "💬", text: "Chat history saved across sessions" },
                            { emoji: "🧠", text: "AI learns from your conversations" },
                            { emoji: "📊", text: "Track your usage and insights" },
                        ].map((feature, i) => (
                            <motion.div
                                key={i}
                                className="flex items-center gap-3 text-sm text-white/40"
                                initial={{ opacity: 0, x: -10 }}
                                animate={{ opacity: 1, x: 0 }}
                                transition={{ delay: 0.3 + i * 0.1 }}
                            >
                                <span>{feature.emoji}</span>
                                <span>{feature.text}</span>
                            </motion.div>
                        ))}
                    </div>

                    {/* Skip option */}
                    <div className="mt-6 text-center">
                        <a
                            href="/chat"
                            className="text-xs text-white/25 hover:text-white/40 transition-colors"
                        >
                            Continue without signing in →
                        </a>
                    </div>
                </div>
            </motion.div>
        </div>
    );
}
