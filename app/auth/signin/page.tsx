"use client";

import { signIn } from "next-auth/react";
import { motion } from "framer-motion";
import { Bot, Shield, MessageSquare, Database, BarChart3 } from "lucide-react";

export default function SignInPage() {
    return (
        <div className="min-h-screen flex items-center justify-center relative overflow-hidden bg-[#050510]">
            {/* Background effects */}
            <div className="fixed inset-0 overflow-hidden pointer-events-none z-0">
                <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-violet-500/15 rounded-full blur-[128px] animate-pulse" />
                <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-indigo-500/15 rounded-full blur-[128px] animate-pulse" style={{ animationDelay: "700ms" }} />
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
                            Sign in to start chatting with your AI assistant
                        </p>
                    </div>

                    {/* Google Sign In — Primary CTA */}
                    <motion.button
                        onClick={() => signIn("google", { callbackUrl: "/chat" })}
                        whileHover={{ scale: 1.02, boxShadow: "0 0 30px rgba(139,92,246,0.2)" }}
                        whileTap={{ scale: 0.98 }}
                        className="w-full flex items-center justify-center gap-3 px-6 py-4 bg-gradient-to-r from-violet-500 to-indigo-600 hover:from-violet-400 hover:to-indigo-500 border border-violet-500/30 rounded-xl text-white font-semibold transition-all duration-200 shadow-lg shadow-violet-500/20"
                    >
                        <svg className="w-5 h-5" viewBox="0 0 24 24">
                            <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#ffffff" />
                            <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#ffffff" fillOpacity="0.8" />
                            <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#ffffff" fillOpacity="0.6" />
                            <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#ffffff" fillOpacity="0.9" />
                        </svg>
                        Continue with Google
                    </motion.button>

                    {/* What you get */}
                    <div className="mt-8 space-y-3">
                        <p className="text-[10px] text-white/20 uppercase tracking-widest font-medium mb-3">What you get</p>
                        {[
                            { icon: MessageSquare, text: "AI chat powered by LLaMA 3.3 70B" },
                            { icon: Database, text: "Chat history saved across sessions" },
                            { icon: BarChart3, text: "Personalized AI responses" },
                            { icon: Shield, text: "Secure Google authentication" },
                        ].map((feature, i) => (
                            <motion.div
                                key={i}
                                className="flex items-center gap-3 text-sm text-white/40"
                                initial={{ opacity: 0, x: -10 }}
                                animate={{ opacity: 1, x: 0 }}
                                transition={{ delay: 0.3 + i * 0.1 }}
                            >
                                <div className="w-7 h-7 rounded-lg bg-white/[0.04] flex items-center justify-center">
                                    <feature.icon className="w-3.5 h-3.5 text-violet-400" />
                                </div>
                                <span className="text-xs">{feature.text}</span>
                            </motion.div>
                        ))}
                    </div>

                    {/* Back to home */}
                    <div className="mt-6 text-center">
                        <a
                            href="/"
                            className="text-xs text-white/25 hover:text-white/40 transition-colors"
                        >
                            ← Back to homepage
                        </a>
                    </div>
                </div>
            </motion.div>
        </div>
    );
}
