"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { useRouter } from "next/navigation";
import { Lock, User, AlertCircle, Bot } from "lucide-react";
import { cn } from "@/lib/utils";

export default function AdminLogin() {
    const [username, setUsername] = useState("");
    const [password, setPassword] = useState("");
    const [error, setError] = useState<string | null>(null);
    const [isLoading, setIsLoading] = useState(false);
    const router = useRouter();

    const handleLogin = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!username.trim() || !password.trim() || isLoading) return;

        setIsLoading(true);
        setError(null);

        try {
            const res = await fetch("/api/auth/login", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ username: username.trim(), password }),
            });

            const data = await res.json();

            if (!res.ok) {
                setError(data.error || "Login failed.");
                return;
            }

            router.push("/admin");
        } catch {
            setError("Network error. Please try again.");
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="min-h-screen flex items-center justify-center relative overflow-hidden">
            {/* Background blobs */}
            <div className="fixed inset-0 overflow-hidden pointer-events-none">
                <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-violet-500/8 rounded-full filter blur-[128px] animate-pulse" />
                <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-indigo-500/8 rounded-full filter blur-[128px] animate-pulse delay-700" />
            </div>

            <motion.div
                className="relative z-10 w-full max-w-md mx-4"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5 }}
            >
                {/* Header */}
                <div className="text-center mb-8">
                    <motion.div
                        className="w-16 h-16 rounded-2xl bg-gradient-to-br from-violet-500 to-indigo-600 flex items-center justify-center mx-auto mb-4 shadow-xl shadow-violet-500/20"
                        initial={{ scale: 0.8 }}
                        animate={{ scale: 1 }}
                        transition={{ delay: 0.2, type: "spring" }}
                    >
                        <Bot className="w-8 h-8 text-white" />
                    </motion.div>
                    <h1 className="text-2xl font-semibold bg-gradient-to-r from-white/90 to-white/50 bg-clip-text text-transparent">
                        Admin Panel
                    </h1>
                    <p className="text-sm text-white/30 mt-1">
                        Sign in to access the ChotuBot dashboard
                    </p>
                </div>

                {/* Login Card */}
                <motion.form
                    onSubmit={handleLogin}
                    className="backdrop-blur-2xl bg-white/[0.03] rounded-2xl border border-white/[0.06] p-6 space-y-5 shadow-2xl"
                    initial={{ scale: 0.97 }}
                    animate={{ scale: 1 }}
                    transition={{ delay: 0.1 }}
                >
                    {/* Error */}
                    {error && (
                        <motion.div
                            className="flex items-center gap-2 p-3 bg-red-500/10 border border-red-500/20 rounded-xl text-red-300 text-sm"
                            initial={{ opacity: 0, y: -5 }}
                            animate={{ opacity: 1, y: 0 }}
                        >
                            <AlertCircle className="w-4 h-4 flex-shrink-0" />
                            {error}
                        </motion.div>
                    )}

                    {/* Username */}
                    <div className="space-y-2">
                        <label className="text-sm text-white/50 font-medium">Username</label>
                        <div className="relative">
                            <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/25" />
                            <input
                                type="text"
                                value={username}
                                onChange={(e) => setUsername(e.target.value)}
                                className="w-full bg-white/[0.03] border border-white/[0.08] rounded-xl px-10 py-3 text-sm text-white/90 placeholder:text-white/15 focus:outline-none focus:border-violet-500/40 focus:ring-2 focus:ring-violet-500/10 transition-all"
                                placeholder="Enter username"
                                autoComplete="username"
                                disabled={isLoading}
                            />
                        </div>
                    </div>

                    {/* Password */}
                    <div className="space-y-2">
                        <label className="text-sm text-white/50 font-medium">Password</label>
                        <div className="relative">
                            <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/25" />
                            <input
                                type="password"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                className="w-full bg-white/[0.03] border border-white/[0.08] rounded-xl px-10 py-3 text-sm text-white/90 placeholder:text-white/15 focus:outline-none focus:border-violet-500/40 focus:ring-2 focus:ring-violet-500/10 transition-all"
                                placeholder="Enter password"
                                autoComplete="current-password"
                                disabled={isLoading}
                            />
                        </div>
                    </div>

                    {/* Submit */}
                    <motion.button
                        type="submit"
                        disabled={!username.trim() || !password.trim() || isLoading}
                        whileHover={{ scale: 1.01 }}
                        whileTap={{ scale: 0.99 }}
                        className={cn(
                            "w-full py-3 rounded-xl text-sm font-semibold transition-all",
                            username.trim() && password.trim()
                                ? "bg-gradient-to-r from-violet-500 to-indigo-600 text-white shadow-lg shadow-violet-500/20 hover:shadow-xl hover:shadow-violet-500/30"
                                : "bg-white/[0.05] text-white/30 cursor-not-allowed"
                        )}
                    >
                        {isLoading ? (
                            <span className="flex items-center justify-center gap-2">
                                <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                                Signing in...
                            </span>
                        ) : (
                            "Sign In"
                        )}
                    </motion.button>
                </motion.form>

                <p className="text-center text-[10px] text-white/15 mt-4">
                    Authorized personnel only
                </p>
            </motion.div>
        </div>
    );
}
