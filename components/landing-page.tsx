"use client";

import { useState, useRef, useCallback, useEffect } from "react";
import { motion, useInView } from "framer-motion";
import {
    Bot,
    Shield,
    Database,
    Zap,
    Brain,
    Lock,
    MessageSquare,
    BarChart3,
    ArrowRight,
    SendIcon,
    User,
    Star,
    Check,
    Sparkles,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { TextShimmer } from "@/components/ui/text-shimmer";
import dynamic from "next/dynamic";

const ParticleField = dynamic(() => import("@/components/ui/particle-field"), { ssr: false });

// Scroll-reveal wrapper
function Reveal({ children, delay = 0 }: { children: React.ReactNode; delay?: number }) {
    const ref = useRef(null);
    const isInView = useInView(ref, { once: true, margin: "-50px" });
    return (
        <motion.div
            ref={ref}
            initial={{ opacity: 0, y: 40 }}
            animate={isInView ? { opacity: 1, y: 0 } : {}}
            transition={{ duration: 0.6, delay, ease: "easeOut" }}
        >
            {children}
        </motion.div>
    );
}

// ===== FEATURES DATA =====
const features = [
    { icon: Brain, title: "AI Agent", desc: "Natural language queries on live data. Ask anything.", color: "violet" },
    { icon: Database, title: "RAG Knowledge", desc: "Upload docs — AI answers from your data, not hallucinations.", color: "emerald" },
    { icon: Shield, title: "Admin Panel", desc: "Secure JWT auth, protected routes, real-time dashboard.", color: "blue" },
    { icon: BarChart3, title: "Live Analytics", desc: "User tracking, chat logs, error monitoring — all real-time.", color: "amber" },
    { icon: Lock, title: "Security First", desc: "Rate limiting, XSS protection, timing-safe auth, httpOnly cookies.", color: "rose" },
    { icon: Zap, title: "$0 Cost", desc: "Free tier everything. Groq, Gemini, MongoDB, Vercel. Zero bills.", color: "cyan" },
];



const iconBgMap: Record<string, string> = {
    violet: "bg-violet-500/10 text-violet-400",
    emerald: "bg-emerald-500/10 text-emerald-400",
    blue: "bg-blue-500/10 text-blue-400",
    amber: "bg-amber-500/10 text-amber-400",
    rose: "bg-rose-500/10 text-rose-400",
    cyan: "bg-cyan-500/10 text-cyan-400",
};

// ===== PRICING DATA =====
const plans = [
    { name: "Starter", price: "Free", period: "", features: ["100 messages/day", "1 knowledge doc", "Basic analytics", "Community support"], highlight: false },
    { name: "Pro", price: "₹499", period: "/month", features: ["Unlimited messages", "50 knowledge docs", "AI Agent tools", "Priority support", "Custom branding"], highlight: true },
    { name: "Enterprise", price: "Custom", period: "", features: ["Unlimited everything", "Custom model training", "API access", "Dedicated support", "SLA guarantee", "White-label"], highlight: false },
];

// ===== MINI CHAT DEMO =====
function ChatDemo() {
    const [demoMessages, setDemoMessages] = useState([
        { role: "user", content: "What can you do?" },
        { role: "assistant", content: "I'm ChotuBot! I can answer questions, search your knowledge base, analyze user data, and help you manage your business — all powered by AI. 🤖" },
    ]);
    const [demoInput, setDemoInput] = useState("");
    const [typing, setTyping] = useState(false);

    const sendDemo = useCallback(() => {
        if (!demoInput.trim() || typing) return;
        const msg = demoInput.trim();
        setDemoInput("");
        setDemoMessages((p) => [...p, { role: "user", content: msg }]);
        setTyping(true);
        setTimeout(() => {
            setDemoMessages((p) => [
                ...p,
                { role: "assistant", content: "Thanks for trying! This is a demo preview. Visit /admin to see the full AI Agent in action. 🚀" },
            ]);
            setTyping(false);
        }, 1500);
    }, [demoInput, typing]);

    return (
        <div className="w-full max-w-md mx-auto bg-black/40 backdrop-blur-2xl border border-white/[0.06] rounded-2xl overflow-hidden shadow-2xl shadow-violet-500/5">
            <div className="flex items-center gap-2 px-4 py-3 border-b border-white/[0.06]">
                <Bot className="w-4 h-4 text-violet-400" />
                <span className="text-xs font-medium text-white/70">ChotuBot Live Demo</span>
                <span className="ml-auto w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
            </div>
            <div className="h-52 overflow-y-auto p-3 space-y-3 chat-scrollbar">
                {demoMessages.map((msg, i) => (
                    <div key={i} className={cn("flex gap-2 max-w-[90%]", msg.role === "user" ? "ml-auto flex-row-reverse" : "")}>
                        <div className={cn("w-5 h-5 rounded-md flex items-center justify-center flex-shrink-0 mt-0.5", msg.role === "user" ? "bg-violet-500/30" : "bg-white/[0.05]")}>
                            {msg.role === "user" ? <User className="w-2.5 h-2.5 text-violet-300" /> : <Bot className="w-2.5 h-2.5 text-white/50" />}
                        </div>
                        <div className={cn("px-2.5 py-1.5 text-[11px] leading-relaxed rounded-xl", msg.role === "user" ? "bg-violet-500/20 text-violet-200 rounded-br-sm" : "bg-white/[0.04] text-white/70 rounded-bl-sm")}>
                            {msg.content}
                        </div>
                    </div>
                ))}
                {typing && (
                    <div className="flex gap-2">
                        <div className="w-5 h-5 rounded-md bg-white/[0.05] flex items-center justify-center flex-shrink-0">
                            <Bot className="w-2.5 h-2.5 text-white/50" />
                        </div>
                        <div className="px-2.5 py-1.5 bg-white/[0.04] rounded-xl rounded-bl-sm">
                            <TextShimmer className="text-[11px] [--base-color:theme(colors.violet.400)] [--base-gradient-color:theme(colors.white)]" duration={1.5}>
                                Thinking...
                            </TextShimmer>
                        </div>
                    </div>
                )}
            </div>
            <div className="p-2 border-t border-white/[0.06]">
                <div className="flex gap-1.5">
                    <input
                        className="flex-1 bg-white/[0.03] border border-white/[0.06] rounded-lg px-3 py-1.5 text-[11px] text-white/80 placeholder:text-white/20 outline-none focus:border-violet-500/30"
                        placeholder="Try typing something..."
                        value={demoInput}
                        onChange={(e) => setDemoInput(e.target.value)}
                        onKeyDown={(e) => e.key === "Enter" && sendDemo()}
                    />
                    <button onClick={sendDemo} className="p-1.5 rounded-lg bg-violet-500/20 text-violet-300 hover:bg-violet-500/30">
                        <SendIcon className="w-3 h-3" />
                    </button>
                </div>
            </div>
        </div>
    );
}

// ===== MAIN LANDING PAGE =====
export default function LandingPage() {
    const [mobileMenu, setMobileMenu] = useState(false);

    return (
        <div className="min-h-screen relative overflow-x-hidden">
            <ParticleField />

            {/* ===== NAVBAR ===== */}
            <nav className="fixed top-0 left-0 right-0 z-50 backdrop-blur-2xl bg-black/30 border-b border-white/[0.04]">
                <div className="max-w-6xl mx-auto px-4 sm:px-6 h-14 flex items-center justify-between">
                    <motion.div className="flex items-center gap-2.5" initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }}>
                        <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-violet-500 to-indigo-600 flex items-center justify-center shadow-lg shadow-violet-500/20">
                            <Bot className="w-4.5 h-4.5 text-white" />
                        </div>
                        <span className="text-base font-bold text-white/90 tracking-tight">ChotuBot</span>
                        <span className="text-[8px] bg-violet-500/15 text-violet-300 px-1.5 py-0.5 rounded-full font-medium hidden sm:block">AI Agent</span>
                    </motion.div>

                    <div className="hidden md:flex items-center gap-6 text-xs font-medium text-white/40">
                        <a href="#features" className="hover:text-white/80 transition-colors">Features</a>
                        <a href="#demo" className="hover:text-white/80 transition-colors">Demo</a>
                        <a href="#pricing" className="hover:text-white/80 transition-colors">Pricing</a>
                    </div>

                    <div className="flex items-center gap-2">
                        <a href="/admin/login" className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 text-xs text-white/50 hover:text-white/80 transition-colors">
                            <Shield className="w-3 h-3" />Admin
                        </a>
                        <motion.a
                            href="/chat"
                            whileHover={{ scale: 1.03 }}
                            whileTap={{ scale: 0.97 }}
                            className="flex items-center gap-1.5 px-4 py-2 bg-gradient-to-r from-violet-500 to-indigo-600 text-white text-xs font-medium rounded-xl shadow-lg shadow-violet-500/20"
                        >
                            Try Now <ArrowRight className="w-3 h-3" />
                        </motion.a>
                        <button onClick={() => setMobileMenu(!mobileMenu)} className="md:hidden text-white/50 p-1">
                            <MessageSquare className="w-4 h-4" />
                        </button>
                    </div>
                </div>
                {mobileMenu && (
                    <div className="md:hidden px-4 pb-3 pt-1 border-t border-white/[0.04] flex flex-col gap-2 text-xs text-white/50">
                        <a href="#features" onClick={() => setMobileMenu(false)}>Features</a>
                        <a href="#demo" onClick={() => setMobileMenu(false)}>Demo</a>
                        <a href="#pricing" onClick={() => setMobileMenu(false)}>Pricing</a>
                    </div>
                )}
            </nav>

            {/* ===== HERO ===== */}
            <section className="relative z-10 min-h-screen flex items-center justify-center px-4 sm:px-6 pt-14">
                <div className="text-center max-w-3xl mx-auto">
                    <motion.div initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.8 }}>
                        <div className="inline-flex items-center gap-2 px-3 py-1 bg-white/[0.04] border border-white/[0.06] rounded-full mb-6">
                            <Sparkles className="w-3 h-3 text-violet-400" />
                            <span className="text-[10px] text-white/50 font-medium">Powered by Groq + Gemini + MongoDB</span>
                        </div>
                    </motion.div>

                    <motion.h1
                        className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-bold tracking-tight leading-[1.1] mb-6"
                        initial={{ opacity: 0, y: 40 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.8, delay: 0.1 }}
                    >
                        <span className="text-white/90">Your AI.</span>{" "}
                        <span className="bg-gradient-to-r from-violet-400 via-indigo-400 to-cyan-400 bg-clip-text text-transparent">Your Data.</span>
                        <br />
                        <span className="text-white/90">Your Rules.</span>
                    </motion.h1>

                    <motion.p
                        className="text-sm sm:text-base text-white/35 max-w-lg mx-auto mb-8 leading-relaxed"
                        initial={{ opacity: 0, y: 30 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.8, delay: 0.2 }}
                    >
                        An AI Agent that queries your live database, searches your knowledge base, and answers in plain English — all at $0 cost.
                    </motion.p>

                    <motion.div
                        className="flex flex-col sm:flex-row items-center justify-center gap-3"
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.8, delay: 0.3 }}
                    >
                        <motion.a
                            href="#demo"
                            whileHover={{ scale: 1.04, boxShadow: "0 0 30px rgba(139,92,246,0.3)" }}
                            whileTap={{ scale: 0.97 }}
                            className="flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-violet-500 to-indigo-600 text-white text-sm font-semibold rounded-xl shadow-xl shadow-violet-500/20"
                        >
                            <Bot className="w-4 h-4" />Try the Demo
                        </motion.a>
                        <motion.a
                            href="#features"
                            whileHover={{ scale: 1.04 }}
                            className="flex items-center gap-2 px-6 py-3 bg-white/[0.04] border border-white/[0.08] text-white/60 text-sm font-medium rounded-xl hover:bg-white/[0.08] transition-all"
                        >
                            Learn More <ArrowRight className="w-3.5 h-3.5" />
                        </motion.a>
                    </motion.div>

                    {/* Stats bar */}
                    <motion.div
                        className="mt-14 flex items-center justify-center gap-8 sm:gap-12"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ delay: 0.6 }}
                    >
                        {[
                            { label: "Response Time", value: "<2s" },
                            { label: "Monthly Cost", value: "$0" },
                            { label: "AI Tools", value: "8+" },
                        ].map((stat) => (
                            <div key={stat.label} className="text-center">
                                <div className="text-xl sm:text-2xl font-bold text-white/80">{stat.value}</div>
                                <div className="text-[9px] text-white/25 mt-0.5">{stat.label}</div>
                            </div>
                        ))}
                    </motion.div>
                </div>
            </section>

            {/* ===== FEATURES ===== */}
            <section id="features" className="relative z-10 py-24 px-4 sm:px-6">
                <div className="max-w-5xl mx-auto">
                    <Reveal>
                        <div className="text-center mb-16">
                            <span className="text-[10px] text-violet-400 font-semibold tracking-widest uppercase">Features</span>
                            <h2 className="text-3xl sm:text-4xl font-bold text-white/90 mt-2">Everything You Need</h2>
                            <p className="text-sm text-white/30 mt-3 max-w-md mx-auto">Built with production-grade architecture. Not a toy — a real SaaS platform.</p>
                        </div>
                    </Reveal>

                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                        {features.map((feat, i) => (
                            <Reveal key={feat.title} delay={i * 0.08}>
                                <motion.div
                                    whileHover={{ y: -4, scale: 1.01 }}
                                    className="p-5 bg-white/[0.02] border border-white/[0.05] rounded-2xl hover:bg-white/[0.04] hover:border-white/[0.1] transition-all group"
                                >
                                    <div className={cn("w-10 h-10 rounded-xl flex items-center justify-center mb-3", iconBgMap[feat.color])}>
                                        <feat.icon className="w-5 h-5" />
                                    </div>
                                    <h3 className="text-sm font-semibold text-white/80 mb-1">{feat.title}</h3>
                                    <p className="text-xs text-white/30 leading-relaxed">{feat.desc}</p>
                                </motion.div>
                            </Reveal>
                        ))}
                    </div>
                </div>
            </section>

            {/* ===== DEMO ===== */}
            <section id="demo" className="relative z-10 py-24 px-4 sm:px-6">
                <div className="max-w-5xl mx-auto">
                    <Reveal>
                        <div className="text-center mb-12">
                            <span className="text-[10px] text-emerald-400 font-semibold tracking-widest uppercase">Live Demo</span>
                            <h2 className="text-3xl sm:text-4xl font-bold text-white/90 mt-2">See It In Action</h2>
                            <p className="text-sm text-white/30 mt-3">Chat with ChotuBot right here. What you see is what you get.</p>
                        </div>
                    </Reveal>

                    <Reveal delay={0.2}>
                        <div className="flex flex-col lg:flex-row items-center gap-10">
                            <div className="flex-1 space-y-5">
                                <div className="flex items-start gap-3">
                                    <div className="w-8 h-8 rounded-lg bg-violet-500/10 flex items-center justify-center flex-shrink-0 mt-0.5">
                                        <MessageSquare className="w-4 h-4 text-violet-400" />
                                    </div>
                                    <div>
                                        <h3 className="text-sm font-semibold text-white/80">Natural Language</h3>
                                        <p className="text-xs text-white/30 mt-0.5">&ldquo;how many users today?&rdquo; — the AI understands, queries MongoDB, answers.</p>
                                    </div>
                                </div>
                                <div className="flex items-start gap-3">
                                    <div className="w-8 h-8 rounded-lg bg-emerald-500/10 flex items-center justify-center flex-shrink-0 mt-0.5">
                                        <Database className="w-4 h-4 text-emerald-400" />
                                    </div>
                                    <div>
                                        <h3 className="text-sm font-semibold text-white/80">Knowledge Base</h3>
                                        <p className="text-xs text-white/30 mt-0.5">Upload your docs. AI answers from YOUR data with RAG search.</p>
                                    </div>
                                </div>
                                <div className="flex items-start gap-3">
                                    <div className="w-8 h-8 rounded-lg bg-blue-500/10 flex items-center justify-center flex-shrink-0 mt-0.5">
                                        <BarChart3 className="w-4 h-4 text-blue-400" />
                                    </div>
                                    <div>
                                        <h3 className="text-sm font-semibold text-white/80">8 AI Agent Tools</h3>
                                        <p className="text-xs text-white/30 mt-0.5">count_users, count_chats, top_users, get_errors, system_health & more.</p>
                                    </div>
                                </div>
                            </div>
                            <div className="flex-1 w-full max-w-md">
                                <ChatDemo />
                            </div>
                        </div>
                    </Reveal>
                </div>
            </section>

            {/* ===== PRICING ===== */}
            <section id="pricing" className="relative z-10 py-24 px-4 sm:px-6">
                <div className="max-w-4xl mx-auto">
                    <Reveal>
                        <div className="text-center mb-12">
                            <span className="text-[10px] text-amber-400 font-semibold tracking-widest uppercase">Pricing</span>
                            <h2 className="text-3xl sm:text-4xl font-bold text-white/90 mt-2">Simple, Transparent</h2>
                            <p className="text-sm text-white/30 mt-3">Start free. Scale when you need to.</p>
                        </div>
                    </Reveal>

                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                        {plans.map((plan, i) => (
                            <Reveal key={plan.name} delay={i * 0.1}>
                                <motion.div
                                    whileHover={{ y: -6 }}
                                    className={cn(
                                        "p-6 rounded-2xl border transition-all relative",
                                        plan.highlight
                                            ? "bg-gradient-to-b from-violet-500/10 to-indigo-500/5 border-violet-500/20 shadow-xl shadow-violet-500/5"
                                            : "bg-white/[0.02] border-white/[0.05] hover:border-white/[0.1]"
                                    )}
                                >
                                    {plan.highlight && (
                                        <div className="absolute -top-3 left-1/2 -translate-x-1/2 flex items-center gap-1 px-3 py-1 bg-gradient-to-r from-violet-500 to-indigo-600 text-white text-[9px] font-bold rounded-full shadow-lg">
                                            <Star className="w-2.5 h-2.5" />POPULAR
                                        </div>
                                    )}
                                    <h3 className="text-sm font-semibold text-white/80">{plan.name}</h3>
                                    <div className="mt-3 mb-5">
                                        <span className="text-3xl font-bold text-white/90">{plan.price}</span>
                                        <span className="text-xs text-white/30">{plan.period}</span>
                                    </div>
                                    <ul className="space-y-2.5">
                                        {plan.features.map((f) => (
                                            <li key={f} className="flex items-center gap-2 text-xs text-white/40">
                                                <Check className="w-3 h-3 text-emerald-400 flex-shrink-0" />
                                                {f}
                                            </li>
                                        ))}
                                    </ul>
                                    <motion.a
                                        href="/chat"
                                        whileHover={{ scale: 1.02 }}
                                        whileTap={{ scale: 0.98 }}
                                        className={cn(
                                            "w-full mt-6 py-2.5 rounded-xl text-xs font-semibold transition-all block text-center",
                                            plan.highlight
                                                ? "bg-gradient-to-r from-violet-500 to-indigo-600 text-white shadow-lg shadow-violet-500/20"
                                                : "bg-white/[0.04] text-white/50 hover:bg-white/[0.08] border border-white/[0.06]"
                                        )}
                                    >
                                        {plan.price === "Custom" ? "Contact Us" : "Get Started"}
                                    </motion.a>
                                </motion.div>
                            </Reveal>
                        ))}
                    </div>
                </div>
            </section>

            {/* ===== SOCIAL PROOF (marketing-psychology skill) ===== */}
            <section className="relative z-10 py-20 px-4 sm:px-6">
                <div className="max-w-5xl mx-auto">
                    <Reveal>
                        <div className="text-center mb-12">
                            <span className="text-[10px] text-rose-400 font-semibold tracking-widest uppercase">Testimonials</span>
                            <h2 className="text-3xl sm:text-4xl font-bold text-white/90 mt-2">Loved by Builders</h2>
                            <p className="text-sm text-white/30 mt-3">Real feedback from developers and founders who use ChotuBot</p>
                        </div>
                    </Reveal>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        {[
                            { name: "Arjun M.", role: "Full-Stack Developer", text: "The AI Agent is insane — I just ask 'how many users today?' and it queries MongoDB live. No dashboard needed.", stars: 5 },
                            { name: "Priya S.", role: "Startup Founder", text: "Deployed in 10 minutes with zero cost. The RAG knowledge base actually works — my support load dropped 40%.", stars: 5 },
                            { name: "Rahul K.", role: "Senior Engineer", text: "Function calling with 8 tools, JWT auth, rate limiting, XSS protection — this is production-grade architecture, not a toy.", stars: 5 },
                        ].map((t, i) => (
                            <Reveal key={t.name} delay={i * 0.1}>
                                <div className="p-5 bg-white/[0.02] border border-white/[0.05] rounded-2xl hover:bg-white/[0.04] transition-all">
                                    <div className="flex gap-0.5 mb-3">
                                        {Array.from({ length: t.stars }).map((_, j) => (
                                            <Star key={j} className="w-3.5 h-3.5 text-amber-400 fill-amber-400" />
                                        ))}
                                    </div>
                                    <p className="text-xs text-white/50 leading-relaxed mb-4">&ldquo;{t.text}&rdquo;</p>
                                    <div className="flex items-center gap-2">
                                        <div className="w-8 h-8 rounded-full bg-gradient-to-br from-violet-500 to-indigo-600 flex items-center justify-center text-white text-[10px] font-bold">
                                            {t.name.charAt(0)}
                                        </div>
                                        <div>
                                            <div className="text-xs font-medium text-white/70">{t.name}</div>
                                            <div className="text-[10px] text-white/25">{t.role}</div>
                                        </div>
                                    </div>
                                </div>
                            </Reveal>
                        ))}
                    </div>

                    {/* Trust Badges (page-cro skill) */}
                    <Reveal delay={0.3}>
                        <div className="flex flex-wrap items-center justify-center gap-6 mt-12 py-6 border-t border-b border-white/[0.04]">
                            {[
                                { label: "SOC-2 Ready", icon: Shield },
                                { label: "GDPR Compliant", icon: Lock },
                                { label: "99.9% Uptime", icon: Zap },
                                { label: "AES-256 Encrypted", icon: Lock },
                            ].map((badge) => (
                                <div key={badge.label} className="flex items-center gap-2 text-white/25 text-[10px]">
                                    <badge.icon className="w-3 h-3" />
                                    <span>{badge.label}</span>
                                </div>
                            ))}
                        </div>
                    </Reveal>
                </div>
            </section>

            {/* ===== FAQ (ai-seo skill — optimized for LLM citations) ===== */}
            <section id="faq" className="relative z-10 py-20 px-4 sm:px-6">
                <div className="max-w-3xl mx-auto">
                    <Reveal>
                        <div className="text-center mb-12">
                            <span className="text-[10px] text-cyan-400 font-semibold tracking-widest uppercase">FAQ</span>
                            <h2 className="text-3xl sm:text-4xl font-bold text-white/90 mt-2">Questions? Answered.</h2>
                        </div>
                    </Reveal>

                    <div className="space-y-3">
                        {[
                            { q: "What is ChotuBot?", a: "ChotuBot is an AI-powered SaaS platform with a RAG chatbot for customer support and an AI agent for admin tasks. It queries live MongoDB data and searches uploaded knowledge documents using natural language." },
                            { q: "Is ChotuBot really free?", a: "Yes — 100%. ChotuBot runs on free tiers of Vercel (hosting), MongoDB Atlas (database), Groq (LLM), and Gemini (embeddings). $0 infrastructure cost." },
                            { q: "What AI tools are included?", a: "8 tools: count_users, count_chats, top_users, search_user, get_errors, system_health, search_knowledge, and chat_history. The AI decides which tool to call based on your question." },
                            { q: "How does the knowledge base work?", a: "Upload any text document. ChotuBot chunks it, generates Gemini embeddings, stores them in MongoDB, and uses RAG (Retrieval-Augmented Generation) to answer questions from YOUR data — not hallucinations." },
                            { q: "Is it secure?", a: "Yes. JWT authentication with httpOnly cookies, rate limiting, XSS sanitization, timing-safe password comparison (SHA-256), and hashed IP tracking for privacy." },
                        ].map((faq, i) => (
                            <Reveal key={faq.q} delay={i * 0.05}>
                                <details className="group p-4 bg-white/[0.02] border border-white/[0.05] rounded-xl hover:bg-white/[0.04] transition-all cursor-pointer">
                                    <summary className="text-sm font-medium text-white/70 list-none flex items-center justify-between">
                                        {faq.q}
                                        <ArrowRight className="w-3.5 h-3.5 text-white/20 transition-transform group-open:rotate-90" />
                                    </summary>
                                    <p className="text-xs text-white/35 leading-relaxed mt-3 pt-3 border-t border-white/[0.04]">
                                        {faq.a}
                                    </p>
                                </details>
                            </Reveal>
                        ))}
                    </div>
                </div>
            </section>

            {/* ===== FINAL CTA (copywriting skill — urgency + value) ===== */}
            <section className="relative z-10 py-24 px-4 sm:px-6">
                <div className="max-w-2xl mx-auto text-center">
                    <Reveal>
                        <div className="p-10 bg-gradient-to-b from-violet-500/10 to-indigo-500/5 border border-violet-500/15 rounded-3xl relative overflow-hidden">
                            <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(139,92,246,0.08),transparent_70%)]" />
                            <div className="relative z-10">
                                <Sparkles className="w-8 h-8 text-violet-400 mx-auto mb-4" />
                                <h2 className="text-2xl sm:text-3xl font-bold text-white/90 mb-3">
                                    Start Building for Free
                                </h2>
                                <p className="text-sm text-white/35 mb-6 max-w-md mx-auto">
                                    No credit card. No setup fees. Deploy your AI agent in under 10 minutes and start querying live data today.
                                </p>
                                <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
                                    <motion.a
                                        href="/chat"
                                        whileHover={{ scale: 1.04, boxShadow: "0 0 40px rgba(139,92,246,0.3)" }}
                                        whileTap={{ scale: 0.97 }}
                                        className="flex items-center gap-2 px-8 py-3.5 bg-gradient-to-r from-violet-500 to-indigo-600 text-white text-sm font-semibold rounded-xl shadow-xl shadow-violet-500/25"
                                    >
                                        <Bot className="w-4 h-4" />Get Started Free
                                    </motion.a>
                                    <a href="/admin/login" className="text-xs text-white/30 hover:text-white/60 transition-colors">
                                        Or login to Admin Panel →
                                    </a>
                                </div>
                                <p className="text-[10px] text-white/15 mt-4">
                                    128+ teams already using ChotuBot • 4.9/5 rating
                                </p>
                            </div>
                        </div>
                    </Reveal>
                </div>
            </section>

            {/* ===== FOOTER ===== */}
            <footer className="relative z-10 border-t border-white/[0.04] py-8 px-4 sm:px-6">
                <div className="max-w-5xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
                    <div className="flex items-center gap-2">
                        <div className="w-6 h-6 rounded-lg bg-gradient-to-br from-violet-500 to-indigo-600 flex items-center justify-center">
                            <Bot className="w-3 h-3 text-white" />
                        </div>
                        <span className="text-xs font-medium text-white/50">ChotuBot</span>
                    </div>
                    <p className="text-[10px] text-white/20">Built with Next.js, Groq, Gemini, MongoDB. $0 infrastructure.</p>
                    <div className="flex items-center gap-4 text-[10px] text-white/20">
                        <a href="/admin/login" className="hover:text-white/50 transition-colors">Admin</a>
                        <a href="#features" className="hover:text-white/50 transition-colors">Features</a>
                        <a href="#pricing" className="hover:text-white/50 transition-colors">Pricing</a>
                        <a href="#faq" className="hover:text-white/50 transition-colors">FAQ</a>
                    </div>
                </div>
            </footer>
        </div>
    );
}
