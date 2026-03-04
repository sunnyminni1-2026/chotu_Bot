"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
    SendIcon,
    Bot,
    User,
    LogOut,
    MessageSquare,
    Database,
    Shield,
    Menu,
    X,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { TextShimmer } from "@/components/ui/text-shimmer";
import { useRouter } from "next/navigation";

interface Message {
    id: number;
    role: "user" | "assistant";
    content: string;
    time: string;
}

export default function AdminDashboard() {
    const [messages, setMessages] = useState<Message[]>([]);
    const [input, setInput] = useState("");
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [sidebarOpen, setSidebarOpen] = useState(false);
    const chatWindowRef = useRef<HTMLDivElement>(null);
    const textareaRef = useRef<HTMLTextAreaElement>(null);
    const router = useRouter();

    // Auto-scroll
    useEffect(() => {
        if (chatWindowRef.current) {
            chatWindowRef.current.scrollTop = chatWindowRef.current.scrollHeight;
        }
    }, [messages, isLoading]);

    // Auto-dismiss error
    useEffect(() => {
        if (error) {
            const timer = setTimeout(() => setError(null), 4000);
            return () => clearTimeout(timer);
        }
    }, [error]);

    // Auto-resize textarea
    useEffect(() => {
        const textarea = textareaRef.current;
        if (textarea) {
            textarea.style.height = "44px";
            textarea.style.height = `${Math.min(textarea.scrollHeight, 150)}px`;
        }
    }, [input]);

    const getTime = () =>
        new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });

    const handleLogout = async () => {
        await fetch("/api/auth/logout", { method: "POST" });
        router.push("/admin/login");
    };

    const sendMessage = useCallback(async () => {
        const trimmed = input.trim();
        if (!trimmed || isLoading) return;

        const userMessage: Message = {
            id: Date.now(),
            role: "user",
            content: trimmed,
            time: getTime(),
        };

        setMessages((prev) => [...prev, userMessage]);
        setInput("");
        setIsLoading(true);
        setError(null);

        try {
            const res = await fetch("/api/admin/chat", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    messages: [...messages, userMessage].map((m) => ({
                        role: m.role,
                        content: m.content,
                    })),
                }),
            });

            const data = await res.json();

            if (!res.ok) {
                if (res.status === 401) {
                    router.push("/admin/login");
                    return;
                }
                setError(data.error || "Something went wrong.");
                return;
            }

            const aiMessage: Message = {
                id: Date.now() + 1,
                role: "assistant",
                content: data.message,
                time: getTime(),
            };

            setMessages((prev) => [...prev, aiMessage]);
        } catch {
            setError("Network error.");
        } finally {
            setIsLoading(false);
            textareaRef.current?.focus();
        }
    }, [input, isLoading, messages, router]);

    const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
        if (e.key === "Enter" && !e.shiftKey) {
            e.preventDefault();
            sendMessage();
        }
    };

    return (
        <div className="flex h-screen relative">
            {/* Background */}
            <div className="fixed inset-0 overflow-hidden pointer-events-none z-0">
                <div className="absolute top-0 left-1/3 w-96 h-96 bg-violet-500/8 rounded-full filter blur-[128px] animate-pulse" />
                <div className="absolute bottom-0 right-1/4 w-80 h-80 bg-indigo-500/6 rounded-full filter blur-[128px] animate-pulse delay-700" />
            </div>

            {/* Mobile sidebar overlay */}
            {sidebarOpen && (
                <div
                    className="fixed inset-0 bg-black/50 z-40 md:hidden"
                    onClick={() => setSidebarOpen(false)}
                />
            )}

            {/* Sidebar */}
            <aside
                className={cn(
                    "fixed md:relative z-50 md:z-10 h-full w-64 bg-black/40 backdrop-blur-xl border-r border-white/[0.05] flex flex-col transition-transform duration-300",
                    sidebarOpen ? "translate-x-0" : "-translate-x-full md:translate-x-0"
                )}
            >
                {/* Sidebar header */}
                <div className="p-4 border-b border-white/[0.05]">
                    <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-violet-500 to-indigo-600 flex items-center justify-center shadow-lg shadow-violet-500/20">
                            <Shield className="w-5 h-5 text-white" />
                        </div>
                        <div>
                            <h2 className="text-sm font-semibold text-white/90">Admin Panel</h2>
                            <p className="text-[10px] text-white/30">ChotuBot Dashboard</p>
                        </div>
                        <button
                            onClick={() => setSidebarOpen(false)}
                            className="ml-auto md:hidden text-white/40 hover:text-white/80"
                        >
                            <X className="w-5 h-5" />
                        </button>
                    </div>
                </div>

                {/* Nav */}
                <nav className="flex-1 p-3 space-y-1">
                    <button className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl bg-white/[0.06] text-white/90 text-sm font-medium transition-all">
                        <MessageSquare className="w-4 h-4 text-violet-400" />
                        Chat
                    </button>
                    <button
                        className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-white/40 text-sm transition-all hover:bg-white/[0.03] hover:text-white/60 cursor-not-allowed"
                        title="Coming in Phase 3"
                    >
                        <Database className="w-4 h-4" />
                        Knowledge Base
                        <span className="ml-auto text-[9px] bg-violet-500/20 text-violet-300 px-1.5 py-0.5 rounded-full">
                            Soon
                        </span>
                    </button>
                </nav>

                {/* Logout */}
                <div className="p-3 border-t border-white/[0.05]">
                    <button
                        onClick={handleLogout}
                        className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-red-400/70 text-sm transition-all hover:bg-red-500/10 hover:text-red-400"
                    >
                        <LogOut className="w-4 h-4" />
                        Sign Out
                    </button>
                </div>
            </aside>

            {/* Main content */}
            <main className="flex-1 flex flex-col relative z-10 min-w-0">
                {/* Header */}
                <header className="flex items-center justify-between px-4 md:px-6 py-3 border-b border-white/[0.04] backdrop-blur-xl bg-white/[0.01]">
                    <div className="flex items-center gap-3">
                        <button
                            onClick={() => setSidebarOpen(true)}
                            className="md:hidden text-white/50 hover:text-white/80"
                        >
                            <Menu className="w-5 h-5" />
                        </button>
                        <Bot className="w-5 h-5 text-violet-400" />
                        <h1 className="text-sm font-semibold text-white/80">
                            Admin Assistant
                        </h1>
                        <span className="text-[9px] bg-violet-500/15 text-violet-300 px-2 py-0.5 rounded-full">
                            ADMIN
                        </span>
                    </div>
                    <div className="flex items-center gap-2 text-[10px] text-white/30">
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                        Connected
                    </div>
                </header>

                {/* Error toast */}
                <AnimatePresence>
                    {error && (
                        <motion.div
                            className="absolute top-16 left-1/2 -translate-x-1/2 z-50 bg-red-500/10 border border-red-500/20 text-red-300 px-4 py-2 rounded-xl text-xs backdrop-blur-xl"
                            initial={{ opacity: 0, y: -10 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -10 }}
                        >
                            {error}
                        </motion.div>
                    )}
                </AnimatePresence>

                {/* Chat area */}
                <div
                    ref={chatWindowRef}
                    className="flex-1 overflow-y-auto px-4 md:px-6 py-4 space-y-4 chat-scrollbar"
                >
                    {messages.length === 0 && !isLoading ? (
                        <motion.div
                            className="flex flex-col items-center justify-center h-full text-center"
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                        >
                            <Shield className="w-12 h-12 text-violet-400/40 mb-4" />
                            <h2 className="text-lg font-semibold text-white/60 mb-1">
                                Admin Assistant
                            </h2>
                            <p className="text-xs text-white/25 max-w-sm">
                                Enhanced AI with admin-level access. In Phase 3, this will be
                                connected to your RAG knowledge base for Rufus-like responses.
                            </p>
                        </motion.div>
                    ) : (
                        <>
                            {messages.map((msg) => (
                                <motion.div
                                    key={msg.id}
                                    className={cn(
                                        "flex gap-3 max-w-[85%]",
                                        msg.role === "user" ? "ml-auto flex-row-reverse" : "mr-auto"
                                    )}
                                    initial={{ opacity: 0, y: 8 }}
                                    animate={{ opacity: 1, y: 0 }}
                                >
                                    <div
                                        className={cn(
                                            "w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0 mt-0.5",
                                            msg.role === "user"
                                                ? "bg-gradient-to-br from-violet-500 to-indigo-600"
                                                : "bg-white/[0.05] border border-white/[0.08]"
                                        )}
                                    >
                                        {msg.role === "user" ? (
                                            <User className="w-3.5 h-3.5 text-white" />
                                        ) : (
                                            <Bot className="w-3.5 h-3.5 text-white/70" />
                                        )}
                                    </div>
                                    <div className="flex flex-col gap-0.5">
                                        <div
                                            className={cn(
                                                "px-3.5 py-2.5 text-sm leading-relaxed whitespace-pre-wrap break-words",
                                                msg.role === "user"
                                                    ? "bg-gradient-to-br from-violet-500 to-indigo-600 text-white rounded-2xl rounded-br-sm"
                                                    : "bg-white/[0.04] border border-white/[0.06] text-white/85 rounded-2xl rounded-bl-sm"
                                            )}
                                        >
                                            {msg.content}
                                        </div>
                                        <span
                                            className={cn(
                                                "text-[9px] text-white/20 px-1",
                                                msg.role === "user" ? "text-right" : ""
                                            )}
                                        >
                                            {msg.time}
                                        </span>
                                    </div>
                                </motion.div>
                            ))}

                            {isLoading && (
                                <motion.div
                                    className="flex gap-3 mr-auto"
                                    initial={{ opacity: 0, y: 8 }}
                                    animate={{ opacity: 1, y: 0 }}
                                >
                                    <div className="w-7 h-7 rounded-lg bg-white/[0.05] border border-white/[0.08] flex items-center justify-center flex-shrink-0">
                                        <Bot className="w-3.5 h-3.5 text-white/70" />
                                    </div>
                                    <div className="px-3.5 py-2.5 bg-white/[0.04] border border-white/[0.06] rounded-2xl rounded-bl-sm">
                                        <TextShimmer
                                            className="text-sm font-medium [--base-color:theme(colors.violet.400)] [--base-gradient-color:theme(colors.white)] dark:[--base-color:theme(colors.violet.400)] dark:[--base-gradient-color:theme(colors.white)]"
                                            duration={1.5}
                                        >
                                            Admin AI is thinking...
                                        </TextShimmer>
                                    </div>
                                </motion.div>
                            )}
                        </>
                    )}
                </div>

                {/* Input */}
                <div className="px-4 md:px-6 pb-4 pt-2 border-t border-white/[0.04] backdrop-blur-xl bg-white/[0.01]">
                    <div
                        className={cn(
                            "flex items-end gap-2 bg-white/[0.03] border rounded-xl p-2 transition-all",
                            input
                                ? "border-violet-500/30 shadow-[0_0_0_3px_rgba(139,92,246,0.08)]"
                                : "border-white/[0.06]"
                        )}
                    >
                        <textarea
                            ref={textareaRef}
                            className="flex-1 bg-transparent border-none outline-none text-white/90 text-sm resize-none placeholder:text-white/20 py-2 px-2 min-h-[44px] max-h-[150px]"
                            placeholder="Ask the admin assistant..."
                            value={input}
                            onChange={(e) => setInput(e.target.value)}
                            onKeyDown={handleKeyDown}
                            disabled={isLoading}
                            rows={1}
                            autoFocus
                        />
                        <motion.button
                            onClick={sendMessage}
                            disabled={!input.trim() || isLoading}
                            whileHover={{ scale: 1.03 }}
                            whileTap={{ scale: 0.97 }}
                            className={cn(
                                "flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-medium transition-all",
                                input.trim()
                                    ? "bg-gradient-to-r from-violet-500 to-indigo-600 text-white shadow-lg shadow-violet-500/20"
                                    : "bg-white/[0.05] text-white/30"
                            )}
                        >
                            <SendIcon className="w-3.5 h-3.5" />
                            <span className="hidden sm:inline">Send</span>
                        </motion.button>
                    </div>
                </div>
            </main>
        </div>
    );
}
