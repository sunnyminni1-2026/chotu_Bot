"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { SendIcon, Sparkles, Bot, User } from "lucide-react";
import { cn } from "@/lib/utils";
import { TextShimmer } from "@/components/ui/text-shimmer";
import { AIVoiceInput } from "@/components/ui/ai-voice-input";

interface Message {
    id: number;
    role: "user" | "assistant";
    content: string;
    time: string;
}

export default function Home() {
    const [messages, setMessages] = useState<Message[]>([]);
    const [input, setInput] = useState("");
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const chatWindowRef = useRef<HTMLDivElement>(null);
    const textareaRef = useRef<HTMLTextAreaElement>(null);

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
            const newHeight = Math.min(textarea.scrollHeight, 150);
            textarea.style.height = `${newHeight}px`;
        }
    }, [input]);

    const getTime = () =>
        new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });

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
            const res = await fetch("/api/chat", {
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
                if (res.status === 429) {
                    setError("Rate limit reached. Please wait a moment.");
                } else {
                    setError(data.error || "Something went wrong.");
                }
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
            setError("Network error. Please check your connection.");
        } finally {
            setIsLoading(false);
            textareaRef.current?.focus();
        }
    }, [input, isLoading, messages]);

    const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
        if (e.key === "Enter" && !e.shiftKey) {
            e.preventDefault();
            sendMessage();
        }
    };

    return (
        <div className="relative flex flex-col h-screen max-w-[900px] mx-auto overflow-hidden">
            {/* Ambient background blobs */}
            <div className="fixed inset-0 overflow-hidden pointer-events-none z-0">
                <div className="absolute top-0 left-1/4 w-96 h-96 bg-violet-500/10 rounded-full mix-blend-normal filter blur-[128px] animate-pulse" />
                <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-indigo-500/10 rounded-full mix-blend-normal filter blur-[128px] animate-pulse delay-700" />
                <div className="absolute top-1/3 right-1/3 w-64 h-64 bg-fuchsia-500/10 rounded-full mix-blend-normal filter blur-[96px] animate-pulse delay-1000" />
            </div>

            {/* Error toast */}
            <AnimatePresence>
                {error && (
                    <motion.div
                        className="fixed top-4 left-1/2 -translate-x-1/2 z-50 bg-red-500/10 border border-red-500/20 text-red-300 px-5 py-2.5 rounded-xl text-sm backdrop-blur-xl"
                        initial={{ opacity: 0, y: -10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -10 }}
                    >
                        {error}
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Header */}
            <header className="relative z-10 flex items-center justify-between px-6 py-4 border-b border-white/[0.05] backdrop-blur-xl bg-white/[0.02]">
                <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-violet-500 to-indigo-600 flex items-center justify-center shadow-lg shadow-violet-500/20">
                        <Bot className="w-5 h-5 text-white" />
                    </div>
                    <h1 className="text-lg font-semibold bg-gradient-to-r from-white/90 to-white/50 bg-clip-text text-transparent">
                        ChotuBot
                    </h1>
                </div>
                <div className="flex items-center gap-2 text-xs text-white/40">
                    <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse shadow-sm shadow-emerald-400/50" />
                    Online
                </div>
            </header>

            {/* Chat area */}
            <div
                ref={chatWindowRef}
                className="relative z-10 flex-1 overflow-y-auto px-6 py-6 space-y-4 chat-scrollbar"
            >
                {messages.length === 0 && !isLoading ? (
                    <motion.div
                        className="flex flex-col items-center justify-center h-full text-center"
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.6, ease: "easeOut" }}
                    >
                        <motion.div
                            className="text-6xl mb-6"
                            animate={{ y: [0, -8, 0] }}
                            transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
                        >
                            <Sparkles className="w-16 h-16 text-violet-400/60" />
                        </motion.div>
                        <h2 className="text-2xl font-semibold bg-gradient-to-r from-white/90 to-violet-300/60 bg-clip-text text-transparent mb-2">
                            Hey! I&apos;m ChotuBot
                        </h2>
                        <p className="text-sm text-white/30 max-w-sm leading-relaxed">
                            Your AI assistant powered by cutting-edge language models. Type a
                            message below to start chatting!
                        </p>
                    </motion.div>
                ) : (
                    <>
                        {messages.map((msg) => (
                            <motion.div
                                key={msg.id}
                                className={cn(
                                    "flex gap-3 max-w-[85%]",
                                    msg.role === "user"
                                        ? "ml-auto flex-row-reverse"
                                        : "mr-auto"
                                )}
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ duration: 0.25 }}
                            >
                                {/* Avatar */}
                                <div
                                    className={cn(
                                        "w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 mt-0.5",
                                        msg.role === "user"
                                            ? "bg-gradient-to-br from-violet-500 to-indigo-600 shadow-md shadow-violet-500/20"
                                            : "bg-white/[0.05] border border-white/[0.08]"
                                    )}
                                >
                                    {msg.role === "user" ? (
                                        <User className="w-4 h-4 text-white" />
                                    ) : (
                                        <Bot className="w-4 h-4 text-white/70" />
                                    )}
                                </div>

                                {/* Bubble */}
                                <div className="flex flex-col gap-1">
                                    <div
                                        className={cn(
                                            "px-4 py-3 text-sm leading-relaxed whitespace-pre-wrap break-words",
                                            msg.role === "user"
                                                ? "bg-gradient-to-br from-violet-500 to-indigo-600 text-white rounded-2xl rounded-br-sm"
                                                : "bg-white/[0.04] border border-white/[0.06] text-white/85 rounded-2xl rounded-bl-sm"
                                        )}
                                    >
                                        {msg.content}
                                    </div>
                                    <span
                                        className={cn(
                                            "text-[10px] text-white/25 px-1",
                                            msg.role === "user" ? "text-right" : "text-left"
                                        )}
                                    >
                                        {msg.time}
                                    </span>
                                </div>
                            </motion.div>
                        ))}

                        {/* Typing indicator with shimmer */}
                        {isLoading && (
                            <motion.div
                                className="flex gap-3 mr-auto"
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                            >
                                <div className="w-8 h-8 rounded-lg bg-white/[0.05] border border-white/[0.08] flex items-center justify-center flex-shrink-0">
                                    <Bot className="w-4 h-4 text-white/70" />
                                </div>
                                <div className="px-4 py-3 bg-white/[0.04] border border-white/[0.06] rounded-2xl rounded-bl-sm">
                                    <TextShimmer
                                        className="text-sm font-medium [--base-color:theme(colors.violet.400)] [--base-gradient-color:theme(colors.white)] dark:[--base-color:theme(colors.violet.400)] dark:[--base-gradient-color:theme(colors.white)]"
                                        duration={1.5}
                                    >
                                        ChotuBot is thinking...
                                    </TextShimmer>
                                </div>
                            </motion.div>
                        )}
                    </>
                )}
            </div>

            {/* Input area */}
            <div className="relative z-10 px-6 pb-6 pt-3 border-t border-white/[0.04] backdrop-blur-xl bg-white/[0.01]">
                <motion.div
                    className={cn(
                        "flex items-end gap-2 bg-white/[0.03] border rounded-2xl p-2 transition-all duration-200",
                        input
                            ? "border-violet-500/30 shadow-[0_0_0_3px_rgba(139,92,246,0.1)]"
                            : "border-white/[0.06]"
                    )}
                    initial={{ scale: 0.98 }}
                    animate={{ scale: 1 }}
                >
                    {/* Voice input */}
                    <AIVoiceInput className="pl-1" />

                    {/* Text input */}
                    <textarea
                        ref={textareaRef}
                        className="flex-1 bg-transparent border-none outline-none text-white/90 text-sm resize-none placeholder:text-white/20 py-2 px-1 min-h-[44px] max-h-[150px]"
                        placeholder="Ask ChotuBot a question..."
                        value={input}
                        onChange={(e) => setInput(e.target.value)}
                        onKeyDown={handleKeyDown}
                        disabled={isLoading}
                        rows={1}
                        autoFocus
                    />

                    {/* Send button */}
                    <motion.button
                        onClick={sendMessage}
                        disabled={!input.trim() || isLoading}
                        whileHover={{ scale: 1.03 }}
                        whileTap={{ scale: 0.97 }}
                        className={cn(
                            "flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium transition-all",
                            input.trim()
                                ? "bg-gradient-to-r from-violet-500 to-indigo-600 text-white shadow-lg shadow-violet-500/20"
                                : "bg-white/[0.05] text-white/30"
                        )}
                    >
                        <SendIcon className="w-4 h-4" />
                        <span className="hidden sm:inline">Send</span>
                    </motion.button>
                </motion.div>

                <p className="text-center text-[10px] text-white/20 mt-2">
                    ChotuBot can make mistakes. Verify important info.
                </p>
            </div>
        </div>
    );
}
