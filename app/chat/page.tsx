"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { SendIcon, Sparkles, Bot, User, Plus, Clock, LogOut, Home, Menu, X, Trash2, MessageSquare } from "lucide-react";
import { cn } from "@/lib/utils";
import { TextShimmer } from "@/components/ui/text-shimmer";
import { useSession, signOut } from "next-auth/react";

interface Message {
    id: number;
    role: "user" | "assistant";
    content: string;
    time: string;
}

interface Conversation {
    id: string;
    title: string;
    messages: { role: string; content: string }[];
    updatedAt: string;
}

export default function ChatPage() {
    const { data: session } = useSession();
    const [messages, setMessages] = useState<Message[]>([]);
    const [input, setInput] = useState("");
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [sidebarOpen, setSidebarOpen] = useState(false);
    const [conversations, setConversations] = useState<Conversation[]>([]);
    const [activeConvoId, setActiveConvoId] = useState<string | null>(null);
    const [profileOpen, setProfileOpen] = useState(false);
    const [showMemoryLimit, setShowMemoryLimit] = useState(false);
    const [stats, setStats] = useState({ size: 0, limit: 50 * 1024 * 1024 }); // 50MB
    const chatWindowRef = useRef<HTMLDivElement>(null);
    const textareaRef = useRef<HTMLTextAreaElement>(null);

    // Load conversation history on mount or session change
    useEffect(() => {
        if (session) {
            loadHistory(true); // Load and hydrate active
        }
    }, [session]);

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
        const ta = textareaRef.current;
        if (ta) {
            ta.style.height = "44px";
            ta.style.height = `${Math.min(ta.scrollHeight, 150)}px`;
        }
    }, [input]);

    // Auto-save conversation
    useEffect(() => {
        if (messages.length >= 2) {
            const timer = setTimeout(() => saveConversation(), 1500);
            return () => clearTimeout(timer);
        }
    }, [messages]);

    const loadHistory = async (hydrateActive = false) => {
        try {
            const res = await fetch("/api/chat/history");
            const data = await res.json();
            if (data.conversations) {
                setConversations(data.conversations);

                // If hydrating and no active convo, pick the latest one
                if (hydrateActive && !activeConvoId && data.conversations.length > 0) {
                    loadConversation(data.conversations[0]);
                }
            }
        } catch { /* silent */ }
    };

    const saveConversation = async () => {
        if (messages.length < 2) return;

        // Calculate size
        const currentSize = JSON.stringify(messages).length;
        setStats((prev: { size: number; limit: number }) => ({ ...prev, size: currentSize }));

        if (currentSize > stats.limit) {
            setShowMemoryLimit(true);
            return;
        }

        try {
            const res = await fetch("/api/chat/history", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    conversationId: activeConvoId,
                    messages: messages.map(m => ({ role: m.role, content: m.content })),
                    title: messages[0]?.role === "user" ? messages[0].content.slice(0, 50) : "New Conversation",
                }),
            });
            const data = await res.json();
            if (data.conversationId && !activeConvoId) {
                setActiveConvoId(data.conversationId);
            }
            loadHistory();
        } catch { /* silent */ }
    };

    const loadConversation = (convo: Conversation) => {
        setActiveConvoId(convo.id);
        setMessages(convo.messages.map((m: { role: string; content: string }, i: number) => ({
            id: i,
            role: m.role as "user" | "assistant",
            content: m.content,
            time: "",
        })));
        setSidebarOpen(false);
    };

    const newChat = () => {
        setMessages([]);
        setActiveConvoId(null);
        setInput("");
        setSidebarOpen(false);
    };

    const getTime = () =>
        new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });

    const sendMessage = useCallback(async () => {
        const trimmed = input.trim();
        if (!trimmed || isLoading) return;

        const userMsg: Message = { id: Date.now(), role: "user", content: trimmed, time: getTime() };
        setMessages((prev: Message[]) => [...prev, userMsg]);
        setInput("");
        setIsLoading(true);
        setError(null);

        const aiId = Date.now() + 1;
        const aiMsg: Message = { id: aiId, role: "assistant", content: "", time: getTime() };
        setMessages((prev: Message[]) => [...prev, aiMsg]);

        try {
            const res = await fetch("/api/chat", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    messages: [...messages, userMsg].map((m: Message) => ({ role: m.role, content: m.content })),
                }),
            });

            if (!res.ok) {
                const ct = res.headers.get("content-type") || "";
                if (ct.includes("application/json")) {
                    const data = await res.json();
                    setError(res.status === 429 ? "Rate limit reached. Wait a moment." : data.error || "Something went wrong.");
                } else {
                    setError("Something went wrong.");
                }
                setMessages((prev: Message[]) => prev.filter((m: Message) => m.id !== aiId));
                return;
            }

            const reader = res.body?.getReader();
            if (!reader) { setError("Streaming not supported."); setMessages((prev: Message[]) => prev.filter((m: Message) => m.id !== aiId)); return; }

            const decoder = new TextDecoder();
            let buffer = "";

            while (true) {
                const { done, value } = await reader.read();
                if (done) break;
                buffer += decoder.decode(value, { stream: true });
                const lines = buffer.split("\n");
                buffer = lines.pop() || "";
                for (const line of lines) {
                    if (line.startsWith("data: ")) {
                        const data = line.slice(6).trim();
                        if (data === "[DONE]") break;
                        try {
                            const parsed = JSON.parse(data);
                            if (parsed.content) {
                                setMessages((prev: Message[]) => prev.map((m: Message) => m.id === aiId ? { ...m, content: m.content + parsed.content } : m));
                            }
                        } catch { /* skip */ }
                    }
                }
            }
        } catch {
            setError("Network error.");
            setMessages((prev: Message[]) => prev.filter((m: Message) => m.id !== aiId));
        } finally {
            setIsLoading(false);
            textareaRef.current?.focus();
        }
    }, [input, isLoading, messages]);

    const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
        if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); sendMessage(); }
    };

    const userAvatar = session?.user?.image;
    const userName = session?.user?.name || "User";

    return (
        <div className="flex h-screen bg-[#050510]">
            {/* Memory Limit Dialog */}
            <AnimatePresence>
                {showMemoryLimit && (
                    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
                        <motion.div
                            initial={{ scale: 0.9, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            className="bg-[#0a0a1a] border border-white/10 rounded-2xl p-6 max-w-md w-full shadow-2xl"
                        >
                            <div className="flex items-center gap-3 text-red-400 mb-4">
                                <div className="p-2 bg-red-500/10 rounded-lg">
                                    <X className="w-6 h-6" />
                                </div>
                                <h2 className="text-xl font-bold">Memory Limit Reached</h2>
                            </div>
                            <p className="text-white/60 text-sm mb-6 leading-relaxed">
                                This conversation has exceeded the **50MB memory limit**.
                                To maintain peak performance and engagement, please start a new session or clear your history.
                            </p>
                            <div className="flex gap-3">
                                <button
                                    onClick={() => { newChat(); setShowMemoryLimit(false); }}
                                    className="flex-1 py-3 bg-white/5 hover:bg-white/10 border border-white/10 rounded-xl text-sm font-medium transition-all"
                                >
                                    Start New Chat
                                </button>
                                <button
                                    onClick={() => { /* Potential delete all logic */ newChat(); setShowMemoryLimit(false); }}
                                    className="flex-1 py-3 bg-red-500 hover:bg-red-600 rounded-xl text-sm font-medium transition-all"
                                >
                                    Clear History
                                </button>
                            </div>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>

            {/* Mobile overlay */}
            {sidebarOpen && <div className="fixed inset-0 bg-black/60 z-40 md:hidden" onClick={() => setSidebarOpen(false)} />}

            {/* ===== SIDEBAR ===== */}
            <aside className={cn(
                "fixed md:relative z-50 md:z-10 h-full w-72 bg-[#0a0a1a]/95 backdrop-blur-2xl border-r border-white/[0.04] flex flex-col transition-transform duration-300",
                sidebarOpen ? "translate-x-0" : "-translate-x-full md:translate-x-0"
            )}>
                {/* Sidebar header */}
                <div className="p-3 border-b border-white/[0.04]">
                    <div className="flex items-center gap-2 mb-3">
                        <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-violet-500 to-indigo-600 flex items-center justify-center shadow-lg shadow-violet-500/20">
                            <Bot className="w-4 h-4 text-white" />
                        </div>
                        <span className="text-sm font-semibold text-white/80">ChotuBot</span>
                        <button onClick={() => setSidebarOpen(false)} className="ml-auto md:hidden text-white/40 hover:text-white/80">
                            <X className="w-5 h-5" />
                        </button>
                    </div>
                    <motion.button
                        onClick={newChat}
                        whileHover={{ scale: 1.01 }}
                        whileTap={{ scale: 0.99 }}
                        className="w-full flex items-center gap-2 px-3 py-2.5 bg-white/[0.04] hover:bg-white/[0.08] border border-white/[0.06] rounded-xl text-xs text-white/60 font-medium transition-all"
                    >
                        <Plus className="w-3.5 h-3.5" />New Chat
                    </motion.button>
                </div>

                {/* Conversation list */}
                <div className="flex-1 overflow-y-auto p-2 space-y-0.5 chat-scrollbar">
                    {conversations.length === 0 ? (
                        <div className="text-center py-8">
                            <MessageSquare className="w-8 h-8 text-white/[0.06] mx-auto mb-2" />
                            <p className="text-[10px] text-white/15">No conversations yet</p>
                        </div>
                    ) : (
                        <>
                            <p className="text-[9px] text-white/20 uppercase tracking-widest font-medium px-3 py-2">Recent</p>
                            {conversations.map((convo: Conversation) => (
                                <button
                                    key={convo.id}
                                    onClick={() => loadConversation(convo)}
                                    className={cn(
                                        "w-full text-left px-3 py-2.5 rounded-xl text-xs transition-all group flex items-center gap-2",
                                        activeConvoId === convo.id
                                            ? "bg-white/[0.06] text-white/80"
                                            : "text-white/35 hover:bg-white/[0.03] hover:text-white/60"
                                    )}
                                >
                                    <Clock className="w-3 h-3 flex-shrink-0 opacity-40" />
                                    <span className="truncate flex-1">{convo.title}</span>
                                </button>
                            ))}
                        </>
                    )}
                </div>

                {/* User profile section */}
                <div className="p-3 border-t border-white/[0.04] relative">
                    <button
                        onClick={() => setProfileOpen(!profileOpen)}
                        className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl hover:bg-white/[0.04] transition-all"
                    >
                        {userAvatar ? (
                            <img src={userAvatar} alt="" className="w-8 h-8 rounded-full" />
                        ) : (
                            <div className="w-8 h-8 rounded-full bg-gradient-to-br from-violet-500 to-indigo-600 flex items-center justify-center text-white text-xs font-bold">
                                {userName.charAt(0)}
                            </div>
                        )}
                        <div className="text-left flex-1 min-w-0">
                            <p className="text-xs font-medium text-white/70 truncate">{userName}</p>
                            <p className="text-[9px] text-white/25 truncate">{session?.user?.email}</p>
                        </div>
                    </button>

                    {/* Profile dropdown */}
                    <AnimatePresence>
                        {profileOpen && (
                            <motion.div
                                className="absolute bottom-full left-3 right-3 mb-1 bg-[#0a0a1a] border border-white/[0.08] rounded-xl p-1.5 shadow-2xl"
                                initial={{ opacity: 0, y: 5 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0, y: 5 }}
                            >
                                <a href="/" className="flex items-center gap-2 px-3 py-2 rounded-lg text-xs text-white/50 hover:bg-white/[0.04] hover:text-white/80 transition-all">
                                    <Home className="w-3.5 h-3.5" />Back to Home
                                </a>
                                <button
                                    onClick={() => signOut({ callbackUrl: "/" })}
                                    className="w-full flex items-center gap-2 px-3 py-2 rounded-lg text-xs text-red-400/70 hover:bg-red-500/10 hover:text-red-400 transition-all"
                                >
                                    <LogOut className="w-3.5 h-3.5" />Sign Out
                                </button>
                            </motion.div>
                        )}
                    </AnimatePresence>
                </div>
            </aside>

            {/* ===== MAIN CHAT ===== */}
            <main className="flex-1 flex flex-col min-w-0 relative">
                {/* Background */}
                <div className="fixed inset-0 overflow-hidden pointer-events-none z-0">
                    <div className="absolute top-0 left-1/4 w-96 h-96 bg-violet-500/8 rounded-full blur-[128px] animate-pulse" />
                    <div className="absolute bottom-0 right-1/4 w-80 h-80 bg-indigo-500/6 rounded-full blur-[128px] animate-pulse" style={{ animationDelay: "700ms" }} />
                </div>

                {/* Error toast */}
                <AnimatePresence>
                    {error && (
                        <motion.div className="fixed top-4 left-1/2 -translate-x-1/2 z-50 bg-red-500/10 border border-red-500/20 text-red-300 px-5 py-2.5 rounded-xl text-sm backdrop-blur-xl"
                            initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }}>
                            {error}
                        </motion.div>
                    )}
                </AnimatePresence>

                {/* Header */}
                <header className="relative z-10 flex items-center justify-between px-4 md:px-6 py-3 border-b border-white/[0.04] backdrop-blur-xl bg-white/[0.01]">
                    <div className="flex items-center gap-3">
                        <button onClick={() => setSidebarOpen(true)} className="md:hidden text-white/50 hover:text-white/80">
                            <Menu className="w-5 h-5" />
                        </button>
                        <Bot className="w-5 h-5 text-violet-400" />
                        <h1 className="text-sm font-semibold text-white/80">ChotuBot</h1>
                        <span className="text-[9px] bg-violet-500/15 text-violet-300 px-2 py-0.5 rounded-full">AI</span>
                    </div>
                    <div className="flex items-center gap-3">
                        <motion.button onClick={newChat} whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}
                            className="flex items-center gap-1.5 px-3 py-1.5 text-[10px] text-white/40 hover:text-white/70 hover:bg-white/[0.04] rounded-lg transition-all">
                            <Plus className="w-3 h-3" />New
                        </motion.button>
                        <div className="flex items-center gap-1.5 text-[10px] text-white/30">
                            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />Online
                        </div>
                    </div>
                </header>

                {/* Chat area */}
                <div ref={chatWindowRef} className="relative z-10 flex-1 overflow-y-auto px-4 md:px-6 py-6 space-y-4 chat-scrollbar">
                    {messages.length === 0 && !isLoading ? (
                        <motion.div className="flex flex-col items-center justify-center h-full text-center" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
                            <motion.div animate={{ y: [0, -8, 0] }} transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}>
                                <Sparkles className="w-14 h-14 text-violet-400/50 mb-4" />
                            </motion.div>
                            <h2 className="text-xl font-semibold bg-gradient-to-r from-white/80 to-violet-300/50 bg-clip-text text-transparent mb-2">
                                What can I help you with?
                            </h2>
                            <p className="text-xs text-white/25 max-w-sm">I&apos;m powered by LLaMA 3.3 70B. Ask me anything.</p>
                            <div className="flex flex-wrap gap-2 mt-6 justify-center max-w-md">
                                {["What is ChotuBot?", "Explain RAG simply", "How does AI work?"].map((q: string) => (
                                    <button key={q} onClick={() => { setInput(q); textareaRef.current?.focus(); }}
                                        className="px-3 py-1.5 bg-white/[0.03] border border-white/[0.06] rounded-full text-[10px] text-white/35 hover:text-white/60 hover:bg-white/[0.06] transition-all">
                                        {q}
                                    </button>
                                ))}
                            </div>
                        </motion.div>
                    ) : (
                        <>
                            {messages.map((msg: Message) => (
                                <motion.div key={msg.id}
                                    className={cn("flex gap-3 max-w-[85%]", msg.role === "user" ? "ml-auto flex-row-reverse" : "mr-auto")}
                                    initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}>
                                    <div className={cn("w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0 mt-0.5",
                                        msg.role === "user"
                                            ? "bg-gradient-to-br from-violet-500 to-indigo-600 shadow-md shadow-violet-500/20"
                                            : "bg-white/[0.05] border border-white/[0.08]")}>
                                        {msg.role === "user" ? (
                                            userAvatar ? <img src={userAvatar} alt="" className="w-7 h-7 rounded-lg" /> : <User className="w-3.5 h-3.5 text-white" />
                                        ) : (
                                            <Bot className="w-3.5 h-3.5 text-white/70" />
                                        )}
                                    </div>
                                    <div className="flex flex-col gap-0.5">
                                        <div className={cn("px-3.5 py-2.5 text-sm leading-relaxed whitespace-pre-wrap break-words",
                                            msg.role === "user"
                                                ? "bg-gradient-to-br from-violet-500 to-indigo-600 text-white rounded-2xl rounded-br-sm"
                                                : "bg-white/[0.04] border border-white/[0.06] text-white/85 rounded-2xl rounded-bl-sm")}>
                                            {msg.content || (
                                                <TextShimmer className="text-sm font-medium [--base-color:theme(colors.violet.400)] [--base-gradient-color:theme(colors.white)]" duration={1.5}>
                                                    ChotuBot is thinking...
                                                </TextShimmer>
                                            )}
                                        </div>
                                        {msg.time && <span className={cn("text-[9px] text-white/20 px-1", msg.role === "user" ? "text-right" : "")}>{msg.time}</span>}
                                    </div>
                                </motion.div>
                            ))}
                        </>
                    )}
                </div>

                {/* Input area */}
                <div className="relative z-10 px-4 md:px-6 pb-4 pt-2 border-t border-white/[0.04] backdrop-blur-xl bg-white/[0.01]">
                    <div className={cn("flex items-end gap-2 bg-white/[0.03] border rounded-2xl p-2 transition-all",
                        input ? "border-violet-500/30 shadow-[0_0_0_3px_rgba(139,92,246,0.08)]" : "border-white/[0.06]")}>
                        <textarea ref={textareaRef}
                            className="flex-1 bg-transparent border-none outline-none text-white/90 text-sm resize-none placeholder:text-white/20 py-2 px-2 min-h-[44px] max-h-[150px]"
                            placeholder="Message ChotuBot..."
                            value={input} onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => setInput(e.target.value)} onKeyDown={handleKeyDown}
                            disabled={isLoading} rows={1} autoFocus />
                        <motion.button onClick={sendMessage} disabled={!input.trim() || isLoading}
                            whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }}
                            className={cn("flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-medium transition-all",
                                input.trim() ? "bg-gradient-to-r from-violet-500 to-indigo-600 text-white shadow-lg shadow-violet-500/20" : "bg-white/[0.05] text-white/30")}>
                            <SendIcon className="w-3.5 h-3.5" />
                            <span className="hidden sm:inline">Send</span>
                        </motion.button>
                    </div>
                    <p className="text-center text-[9px] text-white/15 mt-1.5">ChotuBot can make mistakes. Verify important info.</p>
                </div>
            </main>
        </div>
    );
}
