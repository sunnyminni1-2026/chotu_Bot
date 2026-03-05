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
    Plus,
    Trash2,
    FileText,
    Loader2,
    BarChart3,
    Check,
    Star,
    Users,
    AlertTriangle,
    TrendingUp,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { TextShimmer } from "@/components/ui/text-shimmer";
import { useRouter } from "next/navigation";

interface Message {
    id: number;
    role: "user" | "assistant";
    content: string;
    time: string;
    ragUsed?: boolean;
}

interface KBDocument {
    id: string;
    title: string;
    preview: string;
    chunksCount: number;
    createdAt: string;
}

type Tab = "chat" | "knowledge" | "analytics";

interface AnalyticsData {
    overview: {
        totalSessions: number; sessions24h: number; sessions7d: number;
        totalChats: number; chats24h: number; chats7d: number;
        totalErrors: number; errors24h: number;
        knowledgeDocs: number; knowledgeChunks: number;
    };
    usage: { sessionsUsed: number; messagesUsed: number; docsUsed: number };
    chartData: { _id: string; count: number }[];
    plan: string;
}

export default function AdminDashboard() {
    const [activeTab, setActiveTab] = useState<Tab>("chat");
    const [messages, setMessages] = useState<Message[]>([]);
    const [input, setInput] = useState("");
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [sidebarOpen, setSidebarOpen] = useState(false);
    const chatWindowRef = useRef<HTMLDivElement>(null);
    const textareaRef = useRef<HTMLTextAreaElement>(null);
    const router = useRouter();

    // Knowledge base state
    const [documents, setDocuments] = useState<KBDocument[]>([]);
    const [kbLoading, setKbLoading] = useState(false);
    const [showAddDoc, setShowAddDoc] = useState(false);
    const [docTitle, setDocTitle] = useState("");
    const [docContent, setDocContent] = useState("");
    const [addingDoc, setAddingDoc] = useState(false);
    const [kbMessage, setKbMessage] = useState<string | null>(null);

    // Analytics state
    const [analytics, setAnalytics] = useState<AnalyticsData | null>(null);
    const [analyticsLoading, setAnalyticsLoading] = useState(false);

    // Auto-scroll
    useEffect(() => {
        if (chatWindowRef.current) {
            chatWindowRef.current.scrollTop = chatWindowRef.current.scrollHeight;
        }
    }, [messages, isLoading]);

    // Dismiss messages
    useEffect(() => {
        if (error) {
            const t = setTimeout(() => setError(null), 4000);
            return () => clearTimeout(t);
        }
    }, [error]);

    useEffect(() => {
        if (kbMessage) {
            const t = setTimeout(() => setKbMessage(null), 3000);
            return () => clearTimeout(t);
        }
    }, [kbMessage]);

    // Auto-resize textarea
    useEffect(() => {
        const ta = textareaRef.current;
        if (ta) {
            ta.style.height = "44px";
            ta.style.height = `${Math.min(ta.scrollHeight, 150)}px`;
        }
    }, [input]);

    // Load KB documents / analytics when tab switches
    useEffect(() => {
        if (activeTab === "knowledge") loadDocuments();
        if (activeTab === "analytics") loadAnalytics();
    }, [activeTab]);

    const loadAnalytics = async () => {
        setAnalyticsLoading(true);
        try {
            const res = await fetch("/api/admin/analytics");
            const data = await res.json();
            if (res.ok) setAnalytics(data);
        } catch { setError("Failed to load analytics."); }
        finally { setAnalyticsLoading(false); }
    };

    const getTime = () =>
        new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });

    const handleLogout = async () => {
        await fetch("/api/auth/logout", { method: "POST" });
        router.push("/admin/login");
    };

    // ===== Chat Functions =====
    const sendMessage = useCallback(async () => {
        const trimmed = input.trim();
        if (!trimmed || isLoading) return;

        const userMsg: Message = { id: Date.now(), role: "user", content: trimmed, time: getTime() };
        setMessages((p) => [...p, userMsg]);
        setInput("");
        setIsLoading(true);
        setError(null);

        try {
            const res = await fetch("/api/admin/chat", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    messages: [...messages, userMsg].map((m) => ({ role: m.role, content: m.content })),
                }),
            });
            const data = await res.json();
            if (!res.ok) {
                if (res.status === 401) { router.push("/admin/login"); return; }
                setError(data.error || "Something went wrong.");
                return;
            }
            setMessages((p) => [
                ...p,
                { id: Date.now() + 1, role: "assistant", content: data.message, time: getTime(), ragUsed: data.ragUsed },
            ]);
        } catch {
            setError("Network error.");
        } finally {
            setIsLoading(false);
            textareaRef.current?.focus();
        }
    }, [input, isLoading, messages, router]);

    const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
        if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); sendMessage(); }
    };

    // ===== Knowledge Base Functions =====
    const loadDocuments = async () => {
        setKbLoading(true);
        try {
            const res = await fetch("/api/admin/knowledge");
            const data = await res.json();
            if (res.ok) setDocuments(data.documents || []);
        } catch {
            setError("Failed to load documents.");
        } finally {
            setKbLoading(false);
        }
    };

    const addDocument = async () => {
        if (!docTitle.trim() || !docContent.trim() || addingDoc) return;
        setAddingDoc(true);
        try {
            const res = await fetch("/api/admin/knowledge", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ title: docTitle.trim(), content: docContent.trim() }),
            });
            const data = await res.json();
            if (res.ok) {
                setKbMessage(data.message);
                setDocTitle("");
                setDocContent("");
                setShowAddDoc(false);
                loadDocuments();
            } else {
                setError(data.error || "Failed to add document.");
            }
        } catch {
            setError("Network error.");
        } finally {
            setAddingDoc(false);
        }
    };

    const deleteDocument = async (id: string) => {
        try {
            const res = await fetch(`/api/admin/knowledge?id=${id}`, { method: "DELETE" });
            if (res.ok) {
                setKbMessage("Document deleted.");
                loadDocuments();
            }
        } catch {
            setError("Failed to delete.");
        }
    };

    return (
        <div className="flex h-screen relative">
            {/* Background */}
            <div className="fixed inset-0 overflow-hidden pointer-events-none z-0">
                <div className="absolute top-0 left-1/3 w-96 h-96 bg-violet-500/8 rounded-full filter blur-[128px] animate-pulse" />
                <div className="absolute bottom-0 right-1/4 w-80 h-80 bg-indigo-500/6 rounded-full filter blur-[128px] animate-pulse delay-700" />
            </div>

            {sidebarOpen && (
                <div className="fixed inset-0 bg-black/50 z-40 md:hidden" onClick={() => setSidebarOpen(false)} />
            )}

            {/* Sidebar */}
            <aside className={cn(
                "fixed md:relative z-50 md:z-10 h-full w-64 bg-black/40 backdrop-blur-xl border-r border-white/[0.05] flex flex-col transition-transform duration-300",
                sidebarOpen ? "translate-x-0" : "-translate-x-full md:translate-x-0"
            )}>
                <div className="p-4 border-b border-white/[0.05]">
                    <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-violet-500 to-indigo-600 flex items-center justify-center shadow-lg shadow-violet-500/20">
                            <Shield className="w-5 h-5 text-white" />
                        </div>
                        <div>
                            <h2 className="text-sm font-semibold text-white/90">Admin Panel</h2>
                            <p className="text-[10px] text-white/30">ChotuBot Dashboard</p>
                        </div>
                        <button onClick={() => setSidebarOpen(false)} className="ml-auto md:hidden text-white/40 hover:text-white/80">
                            <X className="w-5 h-5" />
                        </button>
                    </div>
                </div>

                <nav className="flex-1 p-3 space-y-1">
                    <button
                        onClick={() => { setActiveTab("chat"); setSidebarOpen(false); }}
                        className={cn(
                            "w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all",
                            activeTab === "chat" ? "bg-white/[0.06] text-white/90" : "text-white/40 hover:bg-white/[0.03] hover:text-white/60"
                        )}
                    >
                        <MessageSquare className="w-4 h-4 text-violet-400" />
                        Chat
                    </button>
                    <button
                        onClick={() => { setActiveTab("knowledge"); setSidebarOpen(false); }}
                        className={cn(
                            "w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all",
                            activeTab === "knowledge" ? "bg-white/[0.06] text-white/90" : "text-white/40 hover:bg-white/[0.03] hover:text-white/60"
                        )}
                    >
                        <Database className="w-4 h-4 text-emerald-400" />
                        Knowledge Base
                        {documents.length > 0 && (
                            <span className="ml-auto text-[9px] bg-emerald-500/20 text-emerald-300 px-1.5 py-0.5 rounded-full">
                                {documents.length}
                            </span>
                        )}
                    </button>
                    <button
                        onClick={() => { setActiveTab("analytics"); setSidebarOpen(false); }}
                        className={cn(
                            "w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all",
                            activeTab === "analytics" ? "bg-white/[0.06] text-white/90" : "text-white/40 hover:bg-white/[0.03] hover:text-white/60"
                        )}
                    >
                        <BarChart3 className="w-4 h-4 text-amber-400" />
                        Analytics & Billing
                    </button>
                </nav>

                <div className="p-3 border-t border-white/[0.05]">
                    <button onClick={handleLogout} className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-red-400/70 text-sm transition-all hover:bg-red-500/10 hover:text-red-400">
                        <LogOut className="w-4 h-4" />
                        Sign Out
                    </button>
                </div>
            </aside>

            {/* Main */}
            <main className="flex-1 flex flex-col relative z-10 min-w-0">
                {/* Header */}
                <header className="flex items-center justify-between px-4 md:px-6 py-3 border-b border-white/[0.04] backdrop-blur-xl bg-white/[0.01]">
                    <div className="flex items-center gap-3">
                        <button onClick={() => setSidebarOpen(true)} className="md:hidden text-white/50 hover:text-white/80">
                            <Menu className="w-5 h-5" />
                        </button>
                        {activeTab === "chat" ? <Bot className="w-5 h-5 text-violet-400" /> : activeTab === "knowledge" ? <Database className="w-5 h-5 text-emerald-400" /> : <BarChart3 className="w-5 h-5 text-amber-400" />}
                        <h1 className="text-sm font-semibold text-white/80">
                            {activeTab === "chat" ? "Admin Assistant" : activeTab === "knowledge" ? "Knowledge Base" : "Analytics & Billing"}
                        </h1>
                        <span className="text-[9px] bg-violet-500/15 text-violet-300 px-2 py-0.5 rounded-full">ADMIN</span>
                    </div>
                    <div className="flex items-center gap-2 text-[10px] text-white/30">
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                        Connected
                    </div>
                </header>

                {/* Toasts */}
                <AnimatePresence>
                    {error && (
                        <motion.div className="absolute top-16 left-1/2 -translate-x-1/2 z-50 bg-red-500/10 border border-red-500/20 text-red-300 px-4 py-2 rounded-xl text-xs backdrop-blur-xl" initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }}>
                            {error}
                        </motion.div>
                    )}
                    {kbMessage && (
                        <motion.div className="absolute top-16 left-1/2 -translate-x-1/2 z-50 bg-emerald-500/10 border border-emerald-500/20 text-emerald-300 px-4 py-2 rounded-xl text-xs backdrop-blur-xl" initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }}>
                            {kbMessage}
                        </motion.div>
                    )}
                </AnimatePresence>

                {/* ===== CHAT TAB ===== */}
                {activeTab === "chat" && (
                    <>
                        <div ref={chatWindowRef} className="flex-1 overflow-y-auto px-4 md:px-6 py-4 space-y-4 chat-scrollbar">
                            {messages.length === 0 && !isLoading ? (
                                <motion.div className="flex flex-col items-center justify-center h-full text-center" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
                                    <Shield className="w-12 h-12 text-violet-400/40 mb-4" />
                                    <h2 className="text-lg font-semibold text-white/60 mb-1">Admin Assistant</h2>
                                    <p className="text-xs text-white/25 max-w-sm">
                                        RAG-powered AI. Upload documents in the Knowledge Base tab, then ask questions here — the AI will answer from your data.
                                    </p>
                                </motion.div>
                            ) : (
                                <>
                                    {messages.map((msg) => (
                                        <motion.div key={msg.id} className={cn("flex gap-3 max-w-[85%]", msg.role === "user" ? "ml-auto flex-row-reverse" : "mr-auto")} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}>
                                            <div className={cn("w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0 mt-0.5", msg.role === "user" ? "bg-gradient-to-br from-violet-500 to-indigo-600" : "bg-white/[0.05] border border-white/[0.08]")}>
                                                {msg.role === "user" ? <User className="w-3.5 h-3.5 text-white" /> : <Bot className="w-3.5 h-3.5 text-white/70" />}
                                            </div>
                                            <div className="flex flex-col gap-0.5">
                                                <div className={cn("px-3.5 py-2.5 text-sm leading-relaxed whitespace-pre-wrap break-words", msg.role === "user" ? "bg-gradient-to-br from-violet-500 to-indigo-600 text-white rounded-2xl rounded-br-sm" : "bg-white/[0.04] border border-white/[0.06] text-white/85 rounded-2xl rounded-bl-sm")}>
                                                    {msg.content}
                                                </div>
                                                <div className={cn("flex items-center gap-2 px-1", msg.role === "user" ? "justify-end" : "")}>
                                                    <span className="text-[9px] text-white/20">{msg.time}</span>
                                                    {msg.ragUsed && msg.role === "assistant" && (
                                                        <span className="text-[8px] bg-emerald-500/15 text-emerald-400 px-1.5 py-0.5 rounded-full">📚 RAG</span>
                                                    )}
                                                </div>
                                            </div>
                                        </motion.div>
                                    ))}
                                    {isLoading && (
                                        <motion.div className="flex gap-3 mr-auto" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}>
                                            <div className="w-7 h-7 rounded-lg bg-white/[0.05] border border-white/[0.08] flex items-center justify-center flex-shrink-0">
                                                <Bot className="w-3.5 h-3.5 text-white/70" />
                                            </div>
                                            <div className="px-3.5 py-2.5 bg-white/[0.04] border border-white/[0.06] rounded-2xl rounded-bl-sm">
                                                <TextShimmer className="text-sm font-medium [--base-color:theme(colors.violet.400)] [--base-gradient-color:theme(colors.white)] dark:[--base-color:theme(colors.violet.400)] dark:[--base-gradient-color:theme(colors.white)]" duration={1.5}>
                                                    Searching knowledge base...
                                                </TextShimmer>
                                            </div>
                                        </motion.div>
                                    )}
                                </>
                            )}
                        </div>
                        <div className="px-4 md:px-6 pb-4 pt-2 border-t border-white/[0.04] backdrop-blur-xl bg-white/[0.01]">
                            <div className={cn("flex items-end gap-2 bg-white/[0.03] border rounded-xl p-2 transition-all", input ? "border-violet-500/30 shadow-[0_0_0_3px_rgba(139,92,246,0.08)]" : "border-white/[0.06]")}>
                                <textarea ref={textareaRef} className="flex-1 bg-transparent border-none outline-none text-white/90 text-sm resize-none placeholder:text-white/20 py-2 px-2 min-h-[44px] max-h-[150px]" placeholder="Ask about your knowledge base..." value={input} onChange={(e) => setInput(e.target.value)} onKeyDown={handleKeyDown} disabled={isLoading} rows={1} autoFocus />
                                <motion.button onClick={sendMessage} disabled={!input.trim() || isLoading} whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }} className={cn("flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-medium transition-all", input.trim() ? "bg-gradient-to-r from-violet-500 to-indigo-600 text-white shadow-lg shadow-violet-500/20" : "bg-white/[0.05] text-white/30")}>
                                    <SendIcon className="w-3.5 h-3.5" />
                                    <span className="hidden sm:inline">Send</span>
                                </motion.button>
                            </div>
                        </div>
                    </>
                )}

                {/* ===== KNOWLEDGE BASE TAB ===== */}
                {activeTab === "knowledge" && (
                    <div className="flex-1 overflow-y-auto px-4 md:px-6 py-6 chat-scrollbar">
                        {/* Add document button */}
                        <div className="flex items-center justify-between mb-6">
                            <div>
                                <h2 className="text-lg font-semibold text-white/80">Your Documents</h2>
                                <p className="text-xs text-white/30">Upload text to teach ChotuBot your knowledge</p>
                            </div>
                            <motion.button
                                onClick={() => setShowAddDoc(!showAddDoc)}
                                whileHover={{ scale: 1.02 }}
                                whileTap={{ scale: 0.98 }}
                                className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-emerald-500 to-teal-600 text-white text-sm font-medium rounded-xl shadow-lg shadow-emerald-500/20"
                            >
                                <Plus className="w-4 h-4" />
                                Add Document
                            </motion.button>
                        </div>

                        {/* Add document form */}
                        <AnimatePresence>
                            {showAddDoc && (
                                <motion.div
                                    className="mb-6 p-4 bg-white/[0.03] border border-white/[0.06] rounded-2xl space-y-4"
                                    initial={{ opacity: 0, height: 0 }}
                                    animate={{ opacity: 1, height: "auto" }}
                                    exit={{ opacity: 0, height: 0 }}
                                >
                                    <input
                                        type="text"
                                        value={docTitle}
                                        onChange={(e) => setDocTitle(e.target.value)}
                                        placeholder="Document title (e.g. Product FAQ)"
                                        className="w-full bg-white/[0.03] border border-white/[0.08] rounded-xl px-4 py-3 text-sm text-white/90 placeholder:text-white/20 focus:outline-none focus:border-emerald-500/40"
                                        maxLength={200}
                                    />
                                    <textarea
                                        value={docContent}
                                        onChange={(e) => setDocContent(e.target.value)}
                                        placeholder="Paste your document content here... (FAQ answers, product info, company docs, etc.)"
                                        className="w-full bg-white/[0.03] border border-white/[0.08] rounded-xl px-4 py-3 text-sm text-white/90 placeholder:text-white/20 focus:outline-none focus:border-emerald-500/40 min-h-[150px] resize-y"
                                        maxLength={50000}
                                    />
                                    <div className="flex items-center justify-between">
                                        <span className="text-[10px] text-white/20">{docContent.length}/50,000 chars</span>
                                        <div className="flex gap-2">
                                            <button onClick={() => setShowAddDoc(false)} className="px-4 py-2 text-sm text-white/40 hover:text-white/60">Cancel</button>
                                            <motion.button
                                                onClick={addDocument}
                                                disabled={!docTitle.trim() || !docContent.trim() || addingDoc}
                                                whileHover={{ scale: 1.02 }}
                                                whileTap={{ scale: 0.98 }}
                                                className={cn(
                                                    "flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium transition-all",
                                                    docTitle.trim() && docContent.trim()
                                                        ? "bg-gradient-to-r from-emerald-500 to-teal-600 text-white"
                                                        : "bg-white/[0.05] text-white/30"
                                                )}
                                            >
                                                {addingDoc ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />}
                                                {addingDoc ? "Processing..." : "Upload & Embed"}
                                            </motion.button>
                                        </div>
                                    </div>
                                </motion.div>
                            )}
                        </AnimatePresence>

                        {/* Document list */}
                        {kbLoading ? (
                            <div className="flex items-center justify-center py-12">
                                <Loader2 className="w-6 h-6 text-white/30 animate-spin" />
                            </div>
                        ) : documents.length === 0 ? (
                            <div className="flex flex-col items-center justify-center py-16 text-center">
                                <Database className="w-12 h-12 text-white/10 mb-4" />
                                <h3 className="text-sm font-medium text-white/40 mb-1">No documents yet</h3>
                                <p className="text-xs text-white/20 max-w-sm">
                                    Add documents to teach ChotuBot your knowledge. It will use this data to answer admin questions.
                                </p>
                            </div>
                        ) : (
                            <div className="space-y-3">
                                {documents.map((doc) => (
                                    <motion.div
                                        key={doc.id}
                                        className="flex items-start gap-3 p-4 bg-white/[0.02] border border-white/[0.05] rounded-xl group hover:bg-white/[0.04] transition-all"
                                        initial={{ opacity: 0, y: 5 }}
                                        animate={{ opacity: 1, y: 0 }}
                                    >
                                        <div className="w-9 h-9 rounded-lg bg-emerald-500/10 flex items-center justify-center flex-shrink-0">
                                            <FileText className="w-4 h-4 text-emerald-400" />
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <h3 className="text-sm font-medium text-white/80 truncate">{doc.title}</h3>
                                            <p className="text-xs text-white/30 mt-0.5 line-clamp-2">{doc.preview}</p>
                                            <div className="flex items-center gap-3 mt-2">
                                                <span className="text-[10px] text-white/20">{doc.chunksCount} chunks</span>
                                                <span className="text-[10px] text-white/20">{new Date(doc.createdAt).toLocaleDateString()}</span>
                                            </div>
                                        </div>
                                        <button
                                            onClick={() => deleteDocument(doc.id)}
                                            className="text-white/10 hover:text-red-400 transition-colors p-1"
                                            title="Delete document"
                                        >
                                            <Trash2 className="w-4 h-4" />
                                        </button>
                                    </motion.div>
                                ))}
                            </div>
                        )}
                    </div>
                )}

                {/* ===== ANALYTICS & BILLING TAB ===== */}
                {activeTab === "analytics" && (
                    <div className="flex-1 overflow-y-auto px-4 md:px-6 py-6 chat-scrollbar">
                        {analyticsLoading ? (
                            <div className="flex items-center justify-center py-12">
                                <Loader2 className="w-6 h-6 text-white/30 animate-spin" />
                            </div>
                        ) : analytics ? (
                            <div className="space-y-6">
                                {/* Stats Grid */}
                                <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
                                    {[
                                        { label: "Users (24h)", value: analytics.overview.sessions24h, total: analytics.overview.totalSessions, icon: Users, color: "violet" },
                                        { label: "Messages (24h)", value: analytics.overview.chats24h, total: analytics.overview.totalChats, icon: MessageSquare, color: "emerald" },
                                        { label: "Errors (24h)", value: analytics.overview.errors24h, total: analytics.overview.totalErrors, icon: AlertTriangle, color: "rose" },
                                        { label: "Knowledge Docs", value: analytics.overview.knowledgeDocs, total: analytics.overview.knowledgeChunks, icon: Database, color: "blue" },
                                    ].map((stat) => (
                                        <div key={stat.label} className="p-4 bg-white/[0.02] border border-white/[0.05] rounded-xl">
                                            <div className="flex items-center gap-2 mb-2">
                                                <stat.icon className={`w-4 h-4 text-${stat.color}-400`} />
                                                <span className="text-[10px] text-white/30">{stat.label}</span>
                                            </div>
                                            <div className="text-2xl font-bold text-white/90">{stat.value}</div>
                                            <div className="text-[10px] text-white/20 mt-0.5">Total: {stat.total}</div>
                                        </div>
                                    ))}
                                </div>

                                {/* Usage Bars */}
                                <div className="p-5 bg-white/[0.02] border border-white/[0.05] rounded-xl">
                                    <h3 className="text-sm font-semibold text-white/70 mb-4 flex items-center gap-2">
                                        <TrendingUp className="w-4 h-4 text-amber-400" />Free Tier Usage
                                    </h3>
                                    <div className="space-y-4">
                                        {[
                                            { label: "Sessions", pct: analytics.usage.sessionsUsed, color: "bg-violet-500" },
                                            { label: "Messages", pct: analytics.usage.messagesUsed, color: "bg-emerald-500" },
                                            { label: "Documents", pct: analytics.usage.docsUsed, color: "bg-blue-500" },
                                        ].map((bar) => (
                                            <div key={bar.label}>
                                                <div className="flex justify-between text-xs text-white/40 mb-1">
                                                    <span>{bar.label}</span>
                                                    <span>{Math.min(bar.pct, 100)}%</span>
                                                </div>
                                                <div className="h-2 bg-white/[0.04] rounded-full overflow-hidden">
                                                    <div className={`h-full ${bar.color} rounded-full transition-all duration-700`} style={{ width: `${Math.min(bar.pct, 100)}%` }} />
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>

                                {/* Chat Volume Chart (simple bars) */}
                                {analytics.chartData.length > 0 && (
                                    <div className="p-5 bg-white/[0.02] border border-white/[0.05] rounded-xl">
                                        <h3 className="text-sm font-semibold text-white/70 mb-4">Chat Volume (7 days)</h3>
                                        <div className="flex items-end gap-2 h-32">
                                            {analytics.chartData.map((day) => {
                                                const maxCount = Math.max(...analytics.chartData.map((d) => d.count), 1);
                                                const heightPct = (day.count / maxCount) * 100;
                                                return (
                                                    <div key={day._id} className="flex-1 flex flex-col items-center gap-1">
                                                        <span className="text-[9px] text-white/30">{day.count}</span>
                                                        <div className="w-full bg-white/[0.04] rounded-t-md overflow-hidden" style={{ height: '100px' }}>
                                                            <div className="w-full bg-gradient-to-t from-violet-500 to-indigo-500 rounded-t-md transition-all" style={{ height: `${heightPct}%`, marginTop: `${100 - heightPct}%` }} />
                                                        </div>
                                                        <span className="text-[8px] text-white/20">{day._id.slice(5)}</span>
                                                    </div>
                                                );
                                            })}
                                        </div>
                                    </div>
                                )}

                                {/* Plans */}
                                <div>
                                    <h3 className="text-sm font-semibold text-white/70 mb-4">Your Plan</h3>
                                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                                        {[
                                            { name: "Free", price: "₹0", features: ["100 msgs/day", "1 doc", "Basic analytics"], current: true },
                                            { name: "Pro", price: "₹499/mo", features: ["Unlimited msgs", "50 docs", "AI tools", "Priority"], current: false },
                                            { name: "Enterprise", price: "Custom", features: ["Everything", "API", "SLA", "White-label"], current: false },
                                        ].map((plan) => (
                                            <div key={plan.name} className={cn("p-4 rounded-xl border", plan.current ? "bg-violet-500/5 border-violet-500/20" : "bg-white/[0.02] border-white/[0.05]")}>
                                                <div className="flex items-center gap-2 mb-2">
                                                    <span className="text-sm font-semibold text-white/80">{plan.name}</span>
                                                    {plan.current && <span className="text-[8px] bg-violet-500/20 text-violet-300 px-1.5 py-0.5 rounded-full">CURRENT</span>}
                                                </div>
                                                <div className="text-xl font-bold text-white/90 mb-3">{plan.price}</div>
                                                <ul className="space-y-1.5">
                                                    {plan.features.map((f) => (
                                                        <li key={f} className="flex items-center gap-1.5 text-[11px] text-white/40">
                                                            <Check className="w-3 h-3 text-emerald-400" />{f}
                                                        </li>
                                                    ))}
                                                </ul>
                                                {!plan.current && (
                                                    <button className="w-full mt-3 py-2 text-[11px] font-medium rounded-lg bg-white/[0.04] text-white/40 hover:bg-white/[0.08] border border-white/[0.06]">
                                                        {plan.price === "Custom" ? "Contact Us" : "Upgrade"}
                                                    </button>
                                                )}
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            </div>
                        ) : (
                            <div className="flex flex-col items-center justify-center py-16 text-center">
                                <BarChart3 className="w-12 h-12 text-white/10 mb-4" />
                                <h3 className="text-sm font-medium text-white/40">No analytics data yet</h3>
                                <p className="text-xs text-white/20 mt-1">Start chatting to generate data</p>
                            </div>
                        )}
                    </div>
                )}
            </main>
        </div>
    );
}
