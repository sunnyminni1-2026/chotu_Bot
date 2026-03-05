"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
    SendIcon, Bot, User, LogOut, MessageSquare, Database, Shield, Menu, X,
    Plus, Trash2, FileText, BarChart3, Check, Users, AlertTriangle,
    TrendingUp, Zap, Home, RefreshCw, ChevronDown, BookOpen, Upload,
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

// Skeleton loader
function Skeleton({ className }: { className?: string }) {
    return <div className={cn("animate-pulse bg-white/[0.04] rounded-xl", className)} />;
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
        if (chatWindowRef.current) chatWindowRef.current.scrollTop = chatWindowRef.current.scrollHeight;
    }, [messages, isLoading]);

    // Dismiss messages
    useEffect(() => { if (error) { const t = setTimeout(() => setError(null), 4000); return () => clearTimeout(t); } }, [error]);
    useEffect(() => { if (kbMessage) { const t = setTimeout(() => setKbMessage(null), 3000); return () => clearTimeout(t); } }, [kbMessage]);

    // Auto-resize textarea
    useEffect(() => { const ta = textareaRef.current; if (ta) { ta.style.height = "44px"; ta.style.height = `${Math.min(ta.scrollHeight, 150)}px`; } }, [input]);

    // Load data on tab switch
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
            else setError(data.error || "Failed to load analytics.");
        } catch { setError("Failed to load analytics."); }
        finally { setAnalyticsLoading(false); }
    };

    const getTime = () => new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });

    const handleLogout = async () => {
        await fetch("/api/auth/logout", { method: "POST" });
        router.push("/admin/login");
    };

    // ===== Chat =====
    const sendMessage = useCallback(async () => {
        const trimmed = input.trim();
        if (!trimmed || isLoading) return;
        const userMsg: Message = { id: Date.now(), role: "user", content: trimmed, time: getTime() };
        setMessages(p => [...p, userMsg]);
        setInput("");
        setIsLoading(true);
        setError(null);
        try {
            const res = await fetch("/api/admin/chat", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ messages: [...messages, userMsg].map(m => ({ role: m.role, content: m.content })) }),
            });
            const data = await res.json();
            if (!res.ok) {
                if (res.status === 401) { router.push("/admin/login"); return; }
                setError(data.error || "Something went wrong.");
                return;
            }
            setMessages(p => [...p, { id: Date.now() + 1, role: "assistant", content: data.message, time: getTime(), ragUsed: data.ragUsed }]);
        } catch { setError("Network error."); }
        finally { setIsLoading(false); textareaRef.current?.focus(); }
    }, [input, isLoading, messages, router]);

    const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
        if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); sendMessage(); }
    };

    // ===== Knowledge Base =====
    const loadDocuments = async () => {
        setKbLoading(true);
        try {
            const res = await fetch("/api/admin/knowledge");
            const data = await res.json();
            if (res.ok) setDocuments(data.documents || []);
            else if (res.status === 401) router.push("/admin/login");
        } catch { setError("Failed to load documents."); }
        finally { setKbLoading(false); }
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
                setKbMessage(data.message || "Document added!");
                setDocTitle(""); setDocContent(""); setShowAddDoc(false);
                loadDocuments();
            } else {
                setError(data.error || "Failed to add document.");
            }
        } catch { setError("Network error."); }
        finally { setAddingDoc(false); }
    };

    const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;
        const maxSize = 5 * 1024 * 1024; // 5MB
        if (file.size > maxSize) { setError("File too large (max 5MB)."); return; }
        try {
            const text = await file.text();
            setDocTitle(file.name.replace(/\.[^/.]+$/, ""));
            setDocContent(text);
            setShowAddDoc(true);
        } catch { setError("Could not read file."); }
    };

    const deleteDocument = async (id: string) => {
        try {
            const res = await fetch(`/api/admin/knowledge?id=${id}`, { method: "DELETE" });
            if (res.ok) { setKbMessage("Document deleted."); loadDocuments(); }
        } catch { setError("Failed to delete."); }
    };

    const tabs: { id: Tab; label: string; icon: typeof MessageSquare; color: string; gradient: string }[] = [
        { id: "chat", label: "AI Agent", icon: MessageSquare, color: "text-violet-400", gradient: "from-violet-500 to-indigo-600" },
        { id: "knowledge", label: "Knowledge", icon: Database, color: "text-emerald-400", gradient: "from-emerald-500 to-teal-600" },
        { id: "analytics", label: "Analytics", icon: BarChart3, color: "text-amber-400", gradient: "from-amber-500 to-orange-600" },
    ];

    return (
        <div className="flex h-screen bg-[#050510] relative">
            {/* Ambient background */}
            <div className="fixed inset-0 overflow-hidden pointer-events-none z-0">
                <div className="absolute top-[-10%] left-[15%] w-[500px] h-[500px] bg-violet-600/[0.04] rounded-full blur-[120px]" />
                <div className="absolute bottom-[-10%] right-[10%] w-[400px] h-[400px] bg-indigo-600/[0.03] rounded-full blur-[120px]" />
                <div className="absolute top-[40%] right-[30%] w-[300px] h-[300px] bg-fuchsia-600/[0.02] rounded-full blur-[100px]" />
            </div>

            {sidebarOpen && <div className="fixed inset-0 bg-black/60 z-40 md:hidden" onClick={() => setSidebarOpen(false)} />}

            {/* ===== SIDEBAR ===== */}
            <aside className={cn(
                "fixed md:relative z-50 md:z-10 h-full w-[240px] bg-[#080818]/90 backdrop-blur-2xl border-r border-white/[0.03] flex flex-col transition-transform duration-300",
                sidebarOpen ? "translate-x-0" : "-translate-x-full md:translate-x-0"
            )}>
                {/* Logo */}
                <div className="p-4 border-b border-white/[0.03]">
                    <div className="flex items-center gap-3">
                        <div className="relative">
                            <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-violet-500 to-indigo-600 flex items-center justify-center shadow-xl shadow-violet-500/20">
                                <Shield className="w-5 h-5 text-white" />
                            </div>
                            <div className="absolute -bottom-0.5 -right-0.5 w-3 h-3 bg-emerald-400 rounded-full border-2 border-[#080818]" />
                        </div>
                        <div>
                            <h2 className="text-sm font-bold text-white/90 tracking-tight">ChotuBot</h2>
                            <p className="text-[9px] text-white/25 tracking-wide uppercase">Admin Console</p>
                        </div>
                        <button onClick={() => setSidebarOpen(false)} className="ml-auto md:hidden text-white/40 hover:text-white/80">
                            <X className="w-5 h-5" />
                        </button>
                    </div>
                </div>

                {/* Nav */}
                <nav className="flex-1 p-3 space-y-1">
                    {tabs.map(tab => (
                        <motion.button key={tab.id}
                            onClick={() => { setActiveTab(tab.id); setSidebarOpen(false); }}
                            whileHover={{ x: 2 }}
                            className={cn(
                                "w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-[13px] font-medium transition-all relative group",
                                activeTab === tab.id
                                    ? "bg-white/[0.06] text-white/90"
                                    : "text-white/35 hover:bg-white/[0.02] hover:text-white/60"
                            )}>
                            {activeTab === tab.id && (
                                <motion.div className="absolute left-0 top-1/2 -translate-y-1/2 w-[3px] h-5 rounded-full bg-gradient-to-b from-violet-400 to-indigo-500"
                                    layoutId="activeTab" transition={{ type: "spring", stiffness: 500, damping: 30 }} />
                            )}
                            <tab.icon className={cn("w-4 h-4", tab.color)} />
                            {tab.label}
                            {tab.id === "knowledge" && documents.length > 0 && (
                                <span className="ml-auto text-[8px] bg-emerald-500/15 text-emerald-300 px-1.5 py-0.5 rounded-full">{documents.length}</span>
                            )}
                        </motion.button>
                    ))}
                </nav>

                {/* Bottom nav */}
                <div className="p-3 border-t border-white/[0.03] space-y-1">
                    <a href="/" className="w-full flex items-center gap-3 px-3 py-2 rounded-xl text-white/30 text-[12px] hover:bg-white/[0.02] hover:text-white/50 transition-all">
                        <Home className="w-3.5 h-3.5" />Back to Site
                    </a>
                    <button onClick={handleLogout} className="w-full flex items-center gap-3 px-3 py-2 rounded-xl text-red-400/50 text-[12px] hover:bg-red-500/10 hover:text-red-400 transition-all">
                        <LogOut className="w-3.5 h-3.5" />Sign Out
                    </button>
                </div>
            </aside>

            {/* ===== MAIN ===== */}
            <main className="flex-1 flex flex-col relative z-10 min-w-0">
                {/* Header */}
                <header className="flex items-center justify-between px-4 md:px-6 py-3 border-b border-white/[0.03] backdrop-blur-xl bg-white/[0.005]">
                    <div className="flex items-center gap-3">
                        <button onClick={() => setSidebarOpen(true)} className="md:hidden text-white/50 hover:text-white/80"><Menu className="w-5 h-5" /></button>
                        {tabs.find(t => t.id === activeTab)?.icon && (() => {
                            const t = tabs.find(t2 => t2.id === activeTab)!;
                            return <t.icon className={cn("w-4 h-4", t.color)} />;
                        })()}
                        <h1 className="text-sm font-semibold text-white/80">{tabs.find(t => t.id === activeTab)?.label}</h1>
                        <span className="text-[8px] bg-white/[0.04] text-white/25 px-2 py-0.5 rounded-full font-medium tracking-wider uppercase">Admin</span>
                    </div>
                    <div className="flex items-center gap-2 text-[10px] text-white/25">
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />Connected
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
                            <Check className="w-3 h-3 inline mr-1.5" />{kbMessage}
                        </motion.div>
                    )}
                </AnimatePresence>

                {/* ===== CHAT TAB ===== */}
                {activeTab === "chat" && (
                    <>
                        <div ref={chatWindowRef} className="flex-1 overflow-y-auto px-4 md:px-6 py-4 space-y-4 chat-scrollbar">
                            {messages.length === 0 && !isLoading ? (
                                <motion.div className="flex flex-col items-center justify-center h-full text-center" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
                                    <div className="relative mb-6">
                                        <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-violet-500/20 to-indigo-600/20 flex items-center justify-center border border-white/[0.06]">
                                            <Zap className="w-8 h-8 text-violet-400/60" />
                                        </div>
                                        <div className="absolute -top-1 -right-1 w-4 h-4 bg-gradient-to-br from-violet-500 to-indigo-600 rounded-full flex items-center justify-center">
                                            <span className="text-[6px] text-white font-bold">AI</span>
                                        </div>
                                    </div>
                                    <h2 className="text-lg font-semibold text-white/60 mb-1">Admin AI Agent</h2>
                                    <p className="text-xs text-white/20 max-w-sm mb-6">Ask questions about your data. I can query users, chats, errors, and search your knowledge base in real-time.</p>
                                    <div className="grid grid-cols-2 gap-2 max-w-md">
                                        {["How many users today?", "Any errors recently?", "System health check", "Search knowledge base"].map(q => (
                                            <button key={q} onClick={() => { setInput(q); textareaRef.current?.focus(); }}
                                                className="px-3 py-2 bg-white/[0.02] border border-white/[0.04] rounded-xl text-[10px] text-white/30 hover:text-white/60 hover:bg-white/[0.04] hover:border-white/[0.08] transition-all text-left">
                                                {q}
                                            </button>
                                        ))}
                                    </div>
                                </motion.div>
                            ) : (
                                <>
                                    {messages.map(msg => (
                                        <motion.div key={msg.id} className={cn("flex gap-3 max-w-[85%]", msg.role === "user" ? "ml-auto flex-row-reverse" : "mr-auto")} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}>
                                            <div className={cn("w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0 mt-0.5", msg.role === "user" ? "bg-gradient-to-br from-violet-500 to-indigo-600" : "bg-white/[0.04] border border-white/[0.06]")}>
                                                {msg.role === "user" ? <User className="w-3.5 h-3.5 text-white" /> : <Bot className="w-3.5 h-3.5 text-white/60" />}
                                            </div>
                                            <div className="flex flex-col gap-0.5">
                                                <div className={cn("px-3.5 py-2.5 text-sm leading-relaxed whitespace-pre-wrap break-words", msg.role === "user" ? "bg-gradient-to-br from-violet-500 to-indigo-600 text-white rounded-2xl rounded-br-sm" : "bg-white/[0.03] border border-white/[0.05] text-white/80 rounded-2xl rounded-bl-sm")}>
                                                    {msg.content}
                                                </div>
                                                <div className={cn("flex items-center gap-2 px-1", msg.role === "user" ? "justify-end" : "")}>
                                                    <span className="text-[8px] text-white/15">{msg.time}</span>
                                                    {msg.ragUsed && msg.role === "assistant" && <span className="text-[7px] bg-emerald-500/10 text-emerald-400/80 px-1.5 py-0.5 rounded-full">🔧 Tools</span>}
                                                </div>
                                            </div>
                                        </motion.div>
                                    ))}
                                    {isLoading && (
                                        <motion.div className="flex gap-3 mr-auto" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}>
                                            <div className="w-7 h-7 rounded-lg bg-white/[0.04] border border-white/[0.06] flex items-center justify-center flex-shrink-0">
                                                <Bot className="w-3.5 h-3.5 text-white/60" />
                                            </div>
                                            <div className="px-3.5 py-2.5 bg-white/[0.03] border border-white/[0.05] rounded-2xl rounded-bl-sm">
                                                <TextShimmer className="text-sm font-medium [--base-color:theme(colors.violet.400)] [--base-gradient-color:theme(colors.white)]" duration={1.5}>Querying your data...</TextShimmer>
                                            </div>
                                        </motion.div>
                                    )}
                                </>
                            )}
                        </div>
                        <div className="px-4 md:px-6 pb-4 pt-2 border-t border-white/[0.03] backdrop-blur-xl bg-white/[0.005]">
                            <div className={cn("flex items-end gap-2 bg-white/[0.02] border rounded-xl p-2 transition-all", input ? "border-violet-500/20 shadow-[0_0_0_2px_rgba(139,92,246,0.05)]" : "border-white/[0.04]")}>
                                <textarea ref={textareaRef} className="flex-1 bg-transparent border-none outline-none text-white/90 text-sm resize-none placeholder:text-white/15 py-2 px-2 min-h-[44px] max-h-[150px]" placeholder="Ask about your data..." value={input} onChange={e => setInput(e.target.value)} onKeyDown={handleKeyDown} disabled={isLoading} rows={1} autoFocus />
                                <motion.button onClick={sendMessage} disabled={!input.trim() || isLoading} whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }}
                                    className={cn("flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-medium transition-all", input.trim() ? "bg-gradient-to-r from-violet-500 to-indigo-600 text-white shadow-lg shadow-violet-500/15" : "bg-white/[0.03] text-white/20")}>
                                    <SendIcon className="w-3.5 h-3.5" /><span className="hidden sm:inline">Send</span>
                                </motion.button>
                            </div>
                        </div>
                    </>
                )}

                {/* ===== KNOWLEDGE BASE TAB ===== */}
                {activeTab === "knowledge" && (
                    <div className="flex-1 overflow-y-auto px-4 md:px-6 py-6 chat-scrollbar">
                        {/* Header section */}
                        <div className="flex items-center justify-between mb-6">
                            <div>
                                <h2 className="text-base font-semibold text-white/80 flex items-center gap-2">
                                    <BookOpen className="w-4 h-4 text-emerald-400" />Knowledge Base
                                </h2>
                                <p className="text-[10px] text-white/25 mt-0.5">Upload documents to teach ChotuBot. It will use this data to answer queries via RAG.</p>
                            </div>
                            <div className="flex gap-2">
                                {/* File upload button */}
                                <label className="flex items-center gap-2 px-3 py-2 bg-white/[0.03] hover:bg-white/[0.06] border border-white/[0.05] text-white/50 hover:text-white/70 text-xs font-medium rounded-xl cursor-pointer transition-all">
                                    <Upload className="w-3.5 h-3.5" />Upload File
                                    <input type="file" accept=".txt,.md,.csv,.json,.html,.xml" onChange={handleFileUpload} className="hidden" />
                                </label>
                                <motion.button onClick={() => setShowAddDoc(!showAddDoc)} whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}
                                    className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-emerald-500 to-teal-600 text-white text-xs font-medium rounded-xl shadow-lg shadow-emerald-500/15">
                                    <Plus className="w-3.5 h-3.5" />Add Text
                                </motion.button>
                            </div>
                        </div>

                        {/* Add document form */}
                        <AnimatePresence>
                            {showAddDoc && (
                                <motion.div className="mb-6 p-5 bg-white/[0.02] border border-white/[0.04] rounded-2xl space-y-4" initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} exit={{ opacity: 0, height: 0 }}>
                                    <div className="flex items-center gap-2 mb-1">
                                        <FileText className="w-4 h-4 text-emerald-400" />
                                        <h3 className="text-xs font-semibold text-white/60">New Document</h3>
                                    </div>
                                    <input type="text" value={docTitle} onChange={e => setDocTitle(e.target.value)}
                                        placeholder="Document title (e.g. Product FAQ)" maxLength={200}
                                        className="w-full bg-white/[0.02] border border-white/[0.05] rounded-xl px-4 py-3 text-sm text-white/90 placeholder:text-white/15 focus:outline-none focus:border-emerald-500/30 transition-colors" />
                                    <textarea value={docContent} onChange={e => setDocContent(e.target.value)}
                                        placeholder="Paste your document content here... (FAQ answers, product info, company docs, etc.)"
                                        className="w-full bg-white/[0.02] border border-white/[0.05] rounded-xl px-4 py-3 text-sm text-white/90 placeholder:text-white/15 focus:outline-none focus:border-emerald-500/30 min-h-[180px] resize-y transition-colors" maxLength={50000} />
                                    <div className="flex items-center justify-between">
                                        <span className="text-[9px] text-white/15">{docContent.length.toLocaleString()}/50,000 chars</span>
                                        <div className="flex gap-2">
                                            <button onClick={() => setShowAddDoc(false)} className="px-4 py-2 text-xs text-white/30 hover:text-white/60 transition-colors">Cancel</button>
                                            <motion.button onClick={addDocument} disabled={!docTitle.trim() || !docContent.trim() || addingDoc} whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}
                                                className={cn("flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-medium transition-all",
                                                    docTitle.trim() && docContent.trim() ? "bg-gradient-to-r from-emerald-500 to-teal-600 text-white" : "bg-white/[0.03] text-white/20")}>
                                                {addingDoc ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Plus className="w-3.5 h-3.5" />}
                                                {addingDoc ? "Processing..." : "Upload & Embed"}
                                            </motion.button>
                                        </div>
                                    </div>
                                </motion.div>
                            )}
                        </AnimatePresence>

                        {/* Document list */}
                        {kbLoading ? (
                            <div className="space-y-3">{[1, 2, 3].map(i => <Skeleton key={i} className="h-20" />)}</div>
                        ) : documents.length === 0 ? (
                            <div className="flex flex-col items-center justify-center py-16 text-center">
                                <div className="w-16 h-16 rounded-2xl bg-white/[0.02] border border-white/[0.04] flex items-center justify-center mb-4">
                                    <Database className="w-8 h-8 text-white/[0.08]" />
                                </div>
                                <h3 className="text-sm font-medium text-white/30 mb-1">No documents yet</h3>
                                <p className="text-[10px] text-white/15 max-w-xs">Upload text documents or paste content. ChotuBot will chunk, embed, and use it to answer questions via RAG.</p>
                            </div>
                        ) : (
                            <div className="space-y-2">
                                {documents.map((doc, i) => (
                                    <motion.div key={doc.id}
                                        className="flex items-start gap-3 p-4 bg-white/[0.015] border border-white/[0.03] rounded-xl group hover:bg-white/[0.03] hover:border-white/[0.06] transition-all"
                                        initial={{ opacity: 0, y: 5 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}>
                                        <div className="w-9 h-9 rounded-lg bg-gradient-to-br from-emerald-500/10 to-teal-500/10 border border-emerald-500/10 flex items-center justify-center flex-shrink-0">
                                            <FileText className="w-4 h-4 text-emerald-400/80" />
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <h3 className="text-sm font-medium text-white/75 truncate">{doc.title}</h3>
                                            <p className="text-[10px] text-white/25 mt-0.5 line-clamp-2">{doc.preview}</p>
                                            <div className="flex items-center gap-3 mt-2">
                                                <span className="text-[9px] text-violet-400/60 bg-violet-500/5 px-1.5 py-0.5 rounded">{doc.chunksCount} chunks</span>
                                                <span className="text-[9px] text-white/15">{new Date(doc.createdAt).toLocaleDateString()}</span>
                                            </div>
                                        </div>
                                        <button onClick={() => deleteDocument(doc.id)} className="text-white/[0.06] hover:text-red-400 transition-colors p-1.5 rounded-lg hover:bg-red-500/10" title="Delete">
                                            <Trash2 className="w-3.5 h-3.5" />
                                        </button>
                                    </motion.div>
                                ))}
                            </div>
                        )}
                    </div>
                )}

                {/* ===== ANALYTICS TAB ===== */}
                {activeTab === "analytics" && (
                    <div className="flex-1 overflow-y-auto px-4 md:px-6 py-6 chat-scrollbar">
                        {analyticsLoading ? (
                            <div className="space-y-4">
                                <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">{[1, 2, 3, 4].map(i => <Skeleton key={i} className="h-24" />)}</div>
                                <Skeleton className="h-40" />
                                <Skeleton className="h-48" />
                            </div>
                        ) : analytics ? (
                            <div className="space-y-6">
                                {/* Stat cards */}
                                <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
                                    {[
                                        { label: "Users", sub: "24h", value: analytics.overview.sessions24h, total: analytics.overview.totalSessions, icon: Users, color: "text-violet-400", bg: "from-violet-500/10 to-indigo-500/5", border: "border-violet-500/10" },
                                        { label: "Messages", sub: "24h", value: analytics.overview.chats24h, total: analytics.overview.totalChats, icon: MessageSquare, color: "text-emerald-400", bg: "from-emerald-500/10 to-teal-500/5", border: "border-emerald-500/10" },
                                        { label: "Errors", sub: "24h", value: analytics.overview.errors24h, total: analytics.overview.totalErrors, icon: AlertTriangle, color: "text-rose-400", bg: "from-rose-500/10 to-red-500/5", border: "border-rose-500/10" },
                                        { label: "KB Docs", sub: "", value: analytics.overview.knowledgeDocs, total: analytics.overview.knowledgeChunks, icon: Database, color: "text-blue-400", bg: "from-blue-500/10 to-cyan-500/5", border: "border-blue-500/10" },
                                    ].map(stat => (
                                        <motion.div key={stat.label} className={cn("p-4 bg-gradient-to-br rounded-xl border", stat.bg, stat.border)}
                                            initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }}>
                                            <div className="flex items-center gap-2 mb-3">
                                                <stat.icon className={cn("w-3.5 h-3.5", stat.color)} />
                                                <span className="text-[10px] text-white/30 font-medium">{stat.label} {stat.sub}</span>
                                            </div>
                                            <div className="text-2xl font-bold text-white/90 tracking-tight">{stat.value}</div>
                                            <div className="text-[9px] text-white/15 mt-0.5">Total: {stat.total.toLocaleString()}</div>
                                        </motion.div>
                                    ))}
                                </div>

                                {/* Usage bars */}
                                <div className="p-5 bg-white/[0.015] border border-white/[0.03] rounded-xl">
                                    <h3 className="text-xs font-semibold text-white/50 mb-4 flex items-center gap-2">
                                        <TrendingUp className="w-3.5 h-3.5 text-amber-400" />Free Tier Usage
                                    </h3>
                                    <div className="space-y-4">
                                        {[
                                            { label: "Sessions", pct: analytics.usage.sessionsUsed, color: "bg-gradient-to-r from-violet-500 to-indigo-500" },
                                            { label: "Messages", pct: analytics.usage.messagesUsed, color: "bg-gradient-to-r from-emerald-500 to-teal-500" },
                                            { label: "Documents", pct: analytics.usage.docsUsed, color: "bg-gradient-to-r from-blue-500 to-cyan-500" },
                                        ].map(bar => (
                                            <div key={bar.label}>
                                                <div className="flex justify-between text-[10px] text-white/30 mb-1.5">
                                                    <span>{bar.label}</span>
                                                    <span className={cn(bar.pct > 80 ? "text-rose-400" : "")}>{Math.min(bar.pct, 100)}%</span>
                                                </div>
                                                <div className="h-1.5 bg-white/[0.03] rounded-full overflow-hidden">
                                                    <motion.div className={cn("h-full rounded-full", bar.color)}
                                                        initial={{ width: 0 }} animate={{ width: `${Math.min(bar.pct, 100)}%` }} transition={{ duration: 0.8, ease: "easeOut" }} />
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>

                                {/* Chart */}
                                {analytics.chartData.length > 0 && (
                                    <div className="p-5 bg-white/[0.015] border border-white/[0.03] rounded-xl">
                                        <h3 className="text-xs font-semibold text-white/50 mb-4">Chat Volume (7 days)</h3>
                                        <div className="flex items-end gap-2 h-28">
                                            {analytics.chartData.map((day, i) => {
                                                const max = Math.max(...analytics.chartData.map(d => d.count), 1);
                                                const pct = (day.count / max) * 100;
                                                return (
                                                    <motion.div key={day._id} className="flex-1 flex flex-col items-center gap-1"
                                                        initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}>
                                                        <span className="text-[8px] text-white/20">{day.count}</span>
                                                        <div className="w-full bg-white/[0.02] rounded-t overflow-hidden" style={{ height: '80px' }}>
                                                            <div className="w-full bg-gradient-to-t from-violet-500 to-indigo-400 rounded-t transition-all" style={{ height: `${pct}%`, marginTop: `${100 - pct}%` }} />
                                                        </div>
                                                        <span className="text-[7px] text-white/15">{day._id.slice(5)}</span>
                                                    </motion.div>
                                                );
                                            })}
                                        </div>
                                    </div>
                                )}

                                {/* Plans */}
                                <div>
                                    <h3 className="text-xs font-semibold text-white/50 mb-4">Current Plan</h3>
                                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                                        {[
                                            { name: "Free", price: "₹0", features: ["100 msgs/day", "1 doc", "Basic analytics"], current: true },
                                            { name: "Pro", price: "₹499/mo", features: ["Unlimited msgs", "50 docs", "AI tools", "Priority"], current: false },
                                            { name: "Enterprise", price: "Custom", features: ["Everything", "API", "SLA", "White-label"], current: false },
                                        ].map(plan => (
                                            <motion.div key={plan.name} className={cn("p-4 rounded-xl border transition-all", plan.current ? "bg-gradient-to-br from-violet-500/5 to-indigo-500/5 border-violet-500/15" : "bg-white/[0.01] border-white/[0.03] hover:border-white/[0.06]")}
                                                whileHover={{ y: -2 }}>
                                                <div className="flex items-center gap-2 mb-2">
                                                    <span className="text-xs font-semibold text-white/70">{plan.name}</span>
                                                    {plan.current && <span className="text-[7px] bg-violet-500/15 text-violet-300 px-1.5 py-0.5 rounded-full font-medium">ACTIVE</span>}
                                                </div>
                                                <div className="text-xl font-bold text-white/85 mb-3">{plan.price}</div>
                                                <ul className="space-y-1.5">
                                                    {plan.features.map(f => (
                                                        <li key={f} className="flex items-center gap-1.5 text-[10px] text-white/30"><Check className="w-2.5 h-2.5 text-emerald-400" />{f}</li>
                                                    ))}
                                                </ul>
                                                {!plan.current && (
                                                    <button className="w-full mt-3 py-2 text-[10px] font-medium rounded-lg bg-white/[0.03] text-white/30 hover:bg-white/[0.06] border border-white/[0.04] transition-all">
                                                        {plan.price === "Custom" ? "Contact Us" : "Upgrade"}
                                                    </button>
                                                )}
                                            </motion.div>
                                        ))}
                                    </div>
                                </div>
                            </div>
                        ) : (
                            <div className="flex flex-col items-center justify-center py-16 text-center">
                                <BarChart3 className="w-12 h-12 text-white/[0.06] mb-4" />
                                <h3 className="text-sm font-medium text-white/30">No analytics data</h3>
                                <p className="text-[10px] text-white/15 mt-1">Start chatting to generate data</p>
                            </div>
                        )}
                    </div>
                )}
            </main>
        </div>
    );
}
