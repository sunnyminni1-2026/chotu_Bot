# ChotuBot — Product Requirements Document (PRD)

## 1. Product Overview

**ChotuBot** is a $0-cost, AI-powered SaaS platform with two surfaces:
- **User Chat** (`/`) — A public-facing AI chatbot for end-users
- **Admin Panel** (`/admin`) — An AI Agent dashboard for the business owner

The admin AI is NOT a basic chatbot. It's a **Rufus-like AI Agent** that can:
- Query live MongoDB data ("how many users today?")
- Search uploaded knowledge base via RAG
- Analyze user behavior and chat patterns
- Answer in natural English from broken/informal questions

**Live URL**: https://chotubot.vercel.app
**GitHub**: https://github.com/sunnyminni1-2026/chotu_Bot

---

## 2. Tech Stack

| Layer | Technology | Why |
|---|---|---|
| Framework | Next.js 14 (App Router) + TypeScript | SSR, API routes, free Vercel deploy |
| Styling | Tailwind CSS + Framer Motion | Premium animations |
| LLM | Groq API (Llama 3.3 70B) | Free tier, fast inference |
| Embeddings | Gemini API (text-embedding-004) | Free tier, 768-dim vectors |
| Database | MongoDB Atlas (M0 free) | Vector search, flexible schema |
| Auth | Custom JWT via Web Crypto API | Zero dependencies, httpOnly cookies |
| Deployment | Vercel (Hobby) | Free, auto-deploy from GitHub |
| 3D/Visuals | Three.js / React Three Fiber | Landing page wow factor |

---

## 3. Architecture

```
┌─────────────────────────────────────────────────┐
│                   VERCEL                         │
│                                                  │
│  Landing Page (/)          Admin Panel (/admin)  │
│  ├── Three.js hero         ├── Login (JWT)       │
│  ├── Features + scroll     ├── AI Agent Chat     │
│  ├── Pricing cards         ├── Knowledge Base    │
│  └── Chat widget           └── Usage Dashboard   │
│                                                  │
│  API Routes:                                     │
│  ├── /api/chat          → Groq (user chat)       │
│  ├── /api/admin/chat    → Groq + RAG + Tools     │
│  ├── /api/admin/knowledge → CRUD knowledge base  │
│  ├── /api/auth/*        → JWT auth               │
│  └── /api/admin/analytics → User data queries    │
│                                                  │
│  Middleware: JWT check on /admin/*                │
└──────────┬──────────────────┬────────────────────┘
           │                  │
    ┌──────┴──────┐   ┌──────┴──────┐
    │  Groq API   │   │ Gemini API  │
    │ (chat LLM)  │   │ (embeddings)│
    └─────────────┘   └─────────────┘
           │
    ┌──────┴──────┐
    │  MongoDB    │
    │  Atlas      │
    │ ├── users   │  ← session tracking
    │ ├── chats   │  ← chat history
    │ ├── documents│ ← knowledge base
    │ └── chunks  │  ← embeddings
    └─────────────┘
```

---

## 4. Security (Non-Negotiable)

| Feature | Implementation |
|---|---|
| API keys | Server-side only, `.trim()` on read, never exposed to client |
| Auth | JWT in httpOnly cookies, not localStorage |
| Rate limiting | Per-IP, in-memory (20 req/min users, 30 admin, 5 login) |
| Input sanitization | Max length, null byte removal, role validation |
| Route protection | Next.js middleware checks JWT on all /admin/* |
| CORS | Restrict to own domain in production |
| MongoDB | Connection string URL-encoded, env var only |

---

## 5. Current Status (Completed)

### Phase 1 ✅ — User Chat
- Premium dark-themed chat UI (Tailwind + Framer Motion)
- Groq API integration with system prompt
- Rate limiting, input sanitization, error handling

### Phase 2 ✅ — Admin Panel & Auth
- JWT auth (Web Crypto API, zero dependencies)
- Admin login page with glassmorphism
- Admin dashboard with sidebar + chat
- Middleware route protection

### Phase 3 ✅ — RAG Pipeline
- MongoDB Atlas connection (cached for serverless)
- Gemini text-embedding-004 for embeddings
- Text chunking (500 chars, sentence boundaries, overlap)
- Knowledge base CRUD UI
- RAG-augmented admin chat with fallback chain

---

## 6. Remaining Phases

### Phase 4 — AI Agent with Function Calling
**Objective**: Make admin AI an intelligent agent that queries live data.

**User tracking** (store in MongoDB):
- Anonymous sessions (IP hash, user agent, timestamps)
- Chat messages (role, content, timestamp, session ID)
- Page visits (route, timestamp)

**Agent tools** (Groq function calling):
| Tool | Input | Action |
|---|---|---|
| `count_users` | time range | Count unique sessions |
| `count_chats` | time range | Count messages |
| `search_user` | query string | Find user by session/IP |
| `top_users` | limit, time range | Most active users |
| `search_knowledge` | query | RAG vector search |
| `error_logs` | time range | Recent errors |
| `system_health` | none | Uptime, memory, DB stats |

**Example queries the admin can ask:**
- "how many users today" → calls `count_users`
- "show me top 5 chatters this week" → calls `top_users`
- "what does our FAQ say about pricing" → calls `search_knowledge`
- "any errors recently" → calls `error_logs`

### Phase 5 — Ultra Premium Frontend
**Objective**: Landing page that looks like $50K SaaS product.

- Three.js particle/wave hero background
- Scroll-triggered animations (Framer Motion)
- Feature sections with parallax effects
- Live chat demo widget
- Pricing cards with hover animations
- Responsive (mobile-first)
- Dark mode with violet/indigo palette

### Phase 6 — Billing & Usage Dashboard
**Objective**: Track usage and display plans.

- Usage tracking (messages, tokens, documents)
- Billing dashboard in admin panel
- Plan cards (Free / Pro / Enterprise)
- Usage charts and limits
- Ready for Razorpay/Stripe integration

---

## 7. Environment Variables (Vercel)

| Variable | Purpose | Set? |
|---|---|---|
| `GROQ_API_KEY` | Chat LLM API | ✅ |
| `GEMINI_API_KEY` | Embedding API | ✅ |
| `MONGODB_URI` | Database connection | ✅ |
| `ADMIN_USERNAME` | Admin login | ✅ (`chotubot_admin`) |
| `ADMIN_PASSWORD` | Admin login | ✅ (`Chotu@2026`) |
| `JWT_SECRET` | Token signing | ✅ |

---

## 8. File Structure

```
CHOTUBOT/
├── app/
│   ├── globals.css
│   ├── layout.tsx
│   ├── page.tsx                    ← User chat
│   ├── admin/
│   │   ├── login/page.tsx          ← Admin login
│   │   └── page.tsx                ← Admin dashboard
│   └── api/
│       ├── chat/route.ts           ← User chat API
│       ├── auth/
│       │   ├── login/route.ts
│       │   ├── logout/route.ts
│       │   └── verify/route.ts
│       └── admin/
│           ├── chat/route.ts       ← RAG + Agent chat API
│           └── knowledge/route.ts  ← Knowledge CRUD
├── components/ui/
│   ├── text-shimmer.tsx
│   ├── ai-voice-input.tsx
│   └── interactive-hover-button.tsx
├── lib/
│   ├── utils.ts                    ← cn() utility
│   ├── auth.ts                     ← JWT auth
│   ├── mongodb.ts                  ← DB connection
│   └── embeddings.ts               ← Gemini + chunking
├── middleware.ts                    ← Route protection
├── tailwind.config.ts
├── tsconfig.json
├── postcss.config.mjs
└── package.json
```

---

## 9. Design System

- **Font**: Inter (Google Fonts)
- **Colors**: Violet/Indigo primary, dark background (hsl 240 10% 4%)
- **Effects**: Glassmorphism, gradient blobs, shimmer text
- **Animations**: Framer Motion for all transitions
- **Theme**: Dark mode only (class-based via Tailwind)

---

## 10. For Future Agents

If you're an AI agent reading this in a new conversation:
1. Read this PRD first for full context
2. Check `task.md` in the brain directory for current progress
3. All env vars are already set on Vercel
4. The MongoDB password has `@` — URL-encoded as `%40` in connection string
5. Always `.trim()` env vars to avoid newline bugs
6. Deploy via `npx vercel --prod --yes`
7. Test at https://chotubot.vercel.app
