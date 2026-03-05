"use client";

import { useState } from "react";
import { motion, useInView } from "framer-motion";
import { useRef } from "react";
import {
    Bot, ArrowRight, Sparkles, Shield, Database, MessageSquare,
    BarChart3, Zap, Lock, Check, Star, Brain, Globe, Clock
} from "lucide-react";
import dynamic from "next/dynamic";
import { cn } from "@/lib/utils";

const BackgroundPaths = dynamic(() => import("@/components/ui/background-paths"), { ssr: false });

// ===== SCROLL REVEAL =====
function Reveal({ children, delay = 0 }: { children: React.ReactNode; delay?: number }) {
    const ref = useRef(null);
    const isInView = useInView(ref, { once: true, margin: "-50px" });
    return (
        <motion.div
            ref={ref}
            initial={{ opacity: 0, y: 30 }}
            animate={isInView ? { opacity: 1, y: 0 } : {}}
            transition={{ duration: 0.6, delay, ease: "easeOut" }}
        >
            {children}
        </motion.div>
    );
}

// ===== FEATURES DATA =====
const features = [
    { icon: Brain, title: "AI-Powered Chat", desc: "Groq's LLaMA 3.3 70B answers customer questions in real-time with streaming responses.", color: "violet" },
    { icon: Database, title: "RAG Knowledge Base", desc: "Upload docs — the AI answers from YOUR data, not hallucinations. Gemini embeddings + vector search.", color: "emerald" },
    { icon: BarChart3, title: "8 AI Agent Tools", desc: "Natural language database queries. Ask 'how many users today?' and get live MongoDB results.", color: "blue" },
    { icon: Shield, title: "Production Security", desc: "JWT auth, rate limiting, XSS sanitization, timing-safe comparison, hashed IPs.", color: "amber" },
    { icon: Globe, title: "Google OAuth", desc: "One-click sign-in. Chat history persists across sessions. Track every user.", color: "rose" },
    { icon: Clock, title: "Streaming SSE", desc: "Words appear in real-time like ChatGPT. No more waiting for complete responses.", color: "cyan" },
];

const iconBg: Record<string, string> = {
    violet: "bg-violet-500/10 text-violet-400",
    emerald: "bg-emerald-500/10 text-emerald-400",
    blue: "bg-blue-500/10 text-blue-400",
    amber: "bg-amber-500/10 text-amber-400",
    rose: "bg-rose-500/10 text-rose-400",
    cyan: "bg-cyan-500/10 text-cyan-400",
};

// ===== PRICING DATA =====
const plans = [
    {
        name: "Starter",
        price: "$0",
        period: "/forever",
        desc: "Perfect for solo founders and small projects.",
        features: ["500 messages/month", "1 knowledge doc", "Google OAuth", "Streaming chat", "Basic admin panel"],
        highlight: false,
        cta: "Get Started Free",
    },
    {
        name: "Growth",
        price: "$29",
        period: "/month",
        desc: "For growing businesses with real customer volume.",
        features: ["Unlimited messages", "25 knowledge docs", "Priority support", "Advanced analytics", "Custom branding", "WhatsApp integration"],
        highlight: true,
        cta: "Start Growing",
    },
    {
        name: "Enterprise",
        price: "Custom",
        period: "",
        desc: "For organizations needing full control and scale.",
        features: ["Unlimited everything", "SLA guarantee", "Dedicated support", "Custom AI training", "API access", "SSO/SAML", "Onboarding call"],
        highlight: false,
        cta: "Contact Sales",
    },
];

// ===== MAIN LANDING PAGE =====
export default function LandingPage() {
    const [mobileMenu, setMobileMenu] = useState(false);

    return (
        <div className="min-h-screen relative overflow-x-hidden bg-[#050510]">
            {/* ===== NAVBAR ===== */}
            <nav className="fixed top-0 left-0 right-0 z-50 backdrop-blur-2xl bg-[#050510]/70 border-b border-white/[0.04]">
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
                        <a href="#pricing" className="hover:text-white/80 transition-colors">Pricing</a>
                        <a href="#faq" className="hover:text-white/80 transition-colors">FAQ</a>
                    </div>

                    <div className="flex items-center gap-2">
                        <a href="/admin/login" className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 text-xs text-white/50 hover:text-white/80 transition-colors">
                            <Shield className="w-3 h-3" />Admin
                        </a>
                        <motion.a
                            href="/auth/signin"
                            whileHover={{ scale: 1.03 }}
                            whileTap={{ scale: 0.97 }}
                            className="flex items-center gap-1.5 px-4 py-2 bg-gradient-to-r from-violet-500 to-indigo-600 text-white text-xs font-medium rounded-xl shadow-lg shadow-violet-500/20"
                        >
                            Get Started <ArrowRight className="w-3 h-3" />
                        </motion.a>
                        <button onClick={() => setMobileMenu(!mobileMenu)} className="md:hidden text-white/50 p-1">
                            <MessageSquare className="w-4 h-4" />
                        </button>
                    </div>
                </div>
                {mobileMenu && (
                    <div className="md:hidden px-4 pb-3 pt-1 border-t border-white/[0.04] flex flex-col gap-2 text-xs text-white/50">
                        <a href="#features" onClick={() => setMobileMenu(false)}>Features</a>
                        <a href="#pricing" onClick={() => setMobileMenu(false)}>Pricing</a>
                        <a href="#faq" onClick={() => setMobileMenu(false)}>FAQ</a>
                    </div>
                )}
            </nav>

            {/* ===== HERO ===== */}
            <section className="relative z-10 min-h-screen flex items-center justify-center px-4 sm:px-6 pt-14">
                <BackgroundPaths />
                <div className="relative z-10 text-center max-w-3xl mx-auto">
                    <motion.div initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.8 }}>
                        <div className="inline-flex items-center gap-2 px-3 py-1 bg-white/[0.04] border border-white/[0.06] rounded-full mb-6">
                            <Sparkles className="w-3 h-3 text-violet-400" />
                            <span className="text-[10px] text-white/50 font-medium">Powered by Groq + Gemini + MongoDB • $0 Cost</span>
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
                        Train an AI on your business docs. It answers customer questions 24/7.
                        You see what they ask. $0 infrastructure cost.
                    </motion.p>

                    <motion.div
                        className="flex flex-col sm:flex-row items-center justify-center gap-3"
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.8, delay: 0.3 }}
                    >
                        <motion.a
                            href="/auth/signin"
                            whileHover={{ scale: 1.04, boxShadow: "0 0 30px rgba(139,92,246,0.3)" }}
                            whileTap={{ scale: 0.97 }}
                            className="flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-violet-500 to-indigo-600 text-white text-sm font-semibold rounded-xl shadow-xl shadow-violet-500/20"
                        >
                            <Bot className="w-4 h-4" />Start Free — Sign In with Google
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
                                    <div className={cn("w-10 h-10 rounded-xl flex items-center justify-center mb-3", iconBg[feat.color])}>
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

            {/* ===== HOW IT WORKS ===== */}
            <section className="relative z-10 py-24 px-4 sm:px-6">
                <div className="max-w-4xl mx-auto">
                    <Reveal>
                        <div className="text-center mb-16">
                            <span className="text-[10px] text-emerald-400 font-semibold tracking-widest uppercase">How It Works</span>
                            <h2 className="text-3xl sm:text-4xl font-bold text-white/90 mt-2">Three Steps to AI Support</h2>
                        </div>
                    </Reveal>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        {[
                            { step: "01", title: "Sign In", desc: "One-click Google sign-in. Your account is created instantly.", icon: Globe },
                            { step: "02", title: "Upload Docs", desc: "Add your FAQs, return policies, product info. AI learns from YOUR data.", icon: Database },
                            { step: "03", title: "Go Live", desc: "Your AI agent starts answering. Track every conversation in the admin panel.", icon: Zap },
                        ].map((item, i) => (
                            <Reveal key={item.step} delay={i * 0.15}>
                                <div className="relative p-6 bg-white/[0.02] border border-white/[0.05] rounded-2xl text-center">
                                    <div className="text-5xl font-black text-white/[0.03] absolute top-3 right-4">{item.step}</div>
                                    <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-violet-500/20 to-indigo-500/10 flex items-center justify-center mx-auto mb-4">
                                        <item.icon className="w-6 h-6 text-violet-400" />
                                    </div>
                                    <h3 className="text-sm font-semibold text-white/80 mb-2">{item.title}</h3>
                                    <p className="text-xs text-white/30 leading-relaxed">{item.desc}</p>
                                </div>
                            </Reveal>
                        ))}
                    </div>
                </div>
            </section>

            {/* ===== PRICING ===== */}
            <section id="pricing" className="relative z-10 py-24 px-4 sm:px-6">
                <div className="max-w-5xl mx-auto">
                    <Reveal>
                        <div className="text-center mb-12">
                            <span className="text-[10px] text-amber-400 font-semibold tracking-widest uppercase">Pricing</span>
                            <h2 className="text-3xl sm:text-4xl font-bold text-white/90 mt-2">Prices That Make Sense</h2>
                            <p className="text-sm text-white/30 mt-3">Start free. Scale when you need to.</p>
                        </div>
                    </Reveal>

                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                        {plans.map((plan, i) => (
                            <Reveal key={plan.name} delay={i * 0.1}>
                                <motion.div
                                    whileHover={{ y: -6 }}
                                    className={cn(
                                        "p-6 rounded-2xl border transition-all relative flex flex-col",
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
                                    <p className="text-xs text-white/30 mt-1 mb-4">{plan.desc}</p>
                                    <div className="mb-5">
                                        <span className="text-3xl font-bold text-white/90">{plan.price}</span>
                                        <span className="text-xs text-white/30">{plan.period}</span>
                                    </div>
                                    <ul className="space-y-2.5 flex-1">
                                        {plan.features.map((f) => (
                                            <li key={f} className="flex items-center gap-2 text-xs text-white/40">
                                                <Check className="w-3 h-3 text-emerald-400 flex-shrink-0" />
                                                {f}
                                            </li>
                                        ))}
                                    </ul>
                                    <motion.a
                                        href="/auth/signin"
                                        whileHover={{ scale: 1.02 }}
                                        whileTap={{ scale: 0.98 }}
                                        className={cn(
                                            "w-full mt-6 py-2.5 rounded-xl text-xs font-semibold transition-all block text-center",
                                            plan.highlight
                                                ? "bg-gradient-to-r from-violet-500 to-indigo-600 text-white shadow-lg shadow-violet-500/20"
                                                : "bg-white/[0.04] text-white/50 hover:bg-white/[0.08] border border-white/[0.06]"
                                        )}
                                    >
                                        {plan.cta}
                                    </motion.a>
                                </motion.div>
                            </Reveal>
                        ))}
                    </div>
                </div>
            </section>

            {/* ===== TESTIMONIALS ===== */}
            <section className="relative z-10 py-20 px-4 sm:px-6">
                <div className="max-w-5xl mx-auto">
                    <Reveal>
                        <div className="text-center mb-12">
                            <span className="text-[10px] text-rose-400 font-semibold tracking-widest uppercase">Testimonials</span>
                            <h2 className="text-3xl sm:text-4xl font-bold text-white/90 mt-2">Loved by Builders</h2>
                        </div>
                    </Reveal>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        {[
                            { name: "Arjun M.", role: "Full-Stack Developer", text: "The AI Agent is insane — I just ask 'how many users today?' and it queries MongoDB live. No dashboard needed." },
                            { name: "Priya S.", role: "Startup Founder", text: "Deployed in 10 minutes with zero cost. The RAG knowledge base actually works — my support load dropped 40%." },
                            { name: "Rahul K.", role: "Senior Engineer", text: "Function calling with 8 tools, JWT auth, rate limiting, XSS protection — this is production-grade, not a toy." },
                        ].map((t, i) => (
                            <Reveal key={t.name} delay={i * 0.1}>
                                <div className="p-5 bg-white/[0.02] border border-white/[0.05] rounded-2xl hover:bg-white/[0.04] transition-all">
                                    <div className="flex gap-0.5 mb-3">
                                        {Array.from({ length: 5 }).map((_, j) => (
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

                    {/* Trust Badges */}
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

            {/* ===== FAQ ===== */}
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
                            { q: "Is ChotuBot really free?", a: "Yes — the Starter plan is $0 forever. ChotuBot runs on free tiers of Vercel (hosting), MongoDB Atlas (database), Groq (LLM), and Gemini (embeddings)." },
                            { q: "Do I need to sign in?", a: "Yes — Google sign-in is required to use the chat. This ensures your conversations are saved, you get personalized AI responses, and you can access your chat history anytime." },
                            { q: "How does the knowledge base work?", a: "Upload any text document. ChotuBot chunks it, generates Gemini embeddings, stores them in MongoDB, and uses RAG (Retrieval-Augmented Generation) to answer from YOUR data." },
                            { q: "Is it secure?", a: "Yes. JWT authentication, Google OAuth, rate limiting, XSS sanitization, timing-safe password comparison, and hashed IP tracking." },
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

            {/* ===== FINAL CTA ===== */}
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
                                    No credit card. No setup fees. Sign in with Google and deploy your AI agent in under 10 minutes.
                                </p>
                                <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
                                    <motion.a
                                        href="/auth/signin"
                                        whileHover={{ scale: 1.04, boxShadow: "0 0 40px rgba(139,92,246,0.3)" }}
                                        whileTap={{ scale: 0.97 }}
                                        className="flex items-center gap-2 px-8 py-3.5 bg-gradient-to-r from-violet-500 to-indigo-600 text-white text-sm font-semibold rounded-xl shadow-xl shadow-violet-500/25"
                                    >
                                        <Bot className="w-4 h-4" />Sign In & Get Started
                                    </motion.a>
                                    <a href="/admin/login" className="text-xs text-white/30 hover:text-white/60 transition-colors">
                                        Admin Login →
                                    </a>
                                </div>
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
