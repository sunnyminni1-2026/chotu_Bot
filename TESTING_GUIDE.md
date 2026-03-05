# ChotuBot — Testing Guide & Sample Data

## 🔐 Admin Credentials
| Field | Value |
|-------|-------|
| **URL** | https://chotubot.vercel.app/admin/login |
| **Username** | `admin` |
| **Password** | `ChotuBot@2026` |

---

## 🧪 Step-by-Step Testing

### Test 1: Landing Page
1. Go to **https://chotubot.vercel.app**
2. ✅ Verify: animated SVG paths in hero background
3. ✅ Verify: "Your AI. Your Data. Your Rules." headline
4. ✅ Verify: scroll down to see Features, How It Works, Pricing, Testimonials, FAQ, Footer
5. ✅ Verify: all "Get Started" buttons link to `/auth/signin`

### Test 2: Auth Enforcement
1. Try visiting **https://chotubot.vercel.app/chat** directly
2. ✅ Verify: you are redirected to `/auth/signin` (not allowed without login)
3. Click "Continue with Google" — sign in with your Google account
4. ✅ Verify: after sign-in, you're taken to `/chat`
5. ✅ Verify: sign-in page has NO "skip" option

### Test 3: User Chat (Streaming)
1. After signing in, you're on `/chat`
2. Type: **"What is ChotuBot?"**
3. ✅ Verify: response streams word-by-word in real-time (SSE)
4. Type: **"Explain RAG in simple terms"**
5. ✅ Verify: AI responds intelligently using LLaMA 3.3 70B
6. Try sending 21+ messages quickly → ✅ Verify: rate limit message appears

### Test 4: Admin Login
1. Go to **https://chotubot.vercel.app/admin/login**
2. Enter: Username = `admin`, Password = `ChotuBot@2026`
3. ✅ Verify: redirected to admin dashboard
4. ✅ Verify: three tabs visible — Chat, Knowledge Base, Analytics

### Test 5: Knowledge Base (RAG Upload)
1. In admin panel, click **Knowledge Base** tab
2. Click **Add Document**
3. Use this sample data:

**Title:** `Product FAQ - ChotuBot`

**Content:**
```
Q: What is ChotuBot?
A: ChotuBot is an AI-powered customer support platform for small businesses. It uses Groq's LLaMA 3.3 70B model for real-time chat and Google Gemini for document embeddings.

Q: How much does ChotuBot cost?
A: ChotuBot is completely free. It runs on free tiers of Vercel, MongoDB Atlas, Groq, and Google Gemini. The Starter plan is $0 forever.

Q: What is RAG?
A: RAG stands for Retrieval-Augmented Generation. When a user asks a question, ChotuBot first searches your uploaded documents for relevant information, then uses that context to generate an accurate answer. This prevents hallucination.

Q: How do I add my business knowledge?
A: Go to the Admin Panel → Knowledge Base tab → Click "Add Document" → Paste your FAQ, product info, return policy, or any text content. ChotuBot will chunk it, embed it using Gemini, and use it to answer customer questions.

Q: Is ChotuBot secure?
A: Yes. ChotuBot uses JWT authentication, Google OAuth, rate limiting (20 messages/minute), XSS sanitization, timing-safe password comparison, and hashed IP tracking. All cookies are httpOnly and Secure.

Q: What AI models does ChotuBot use?
A: Chat: Groq's LLaMA 3.3 70B Versatile (70 billion parameters, fast inference). Embeddings: Google Gemini text-embedding-004 (768-dimensional vectors). Both are free tier.

Q: What is the AI Agent?
A: The AI Agent is an admin-only feature with 8 function-calling tools. You can ask natural language questions like "how many users today?" and it will query your live MongoDB database and return results.

Q: Can I track user conversations?
A: Yes. Every message (user + AI) is logged to MongoDB with timestamps, session IDs, and source tags. The admin analytics dashboard shows 24h/7d/30d trends.
```

4. Click **Upload & Embed**
5. ✅ Verify: success message with chunk count (should be ~4-5 chunks)
6. ✅ Verify: document appears in the list below

### Test 6: Admin AI Agent Chat
1. Click **Chat** tab in admin panel
2. Type: **"How many users do we have today?"**
3. ✅ Verify: AI uses the `count_users` tool and returns a number
4. Type: **"What does our knowledge base say about RAG?"**
5. ✅ Verify: AI uses `search_knowledge` tool and answers from the FAQ you uploaded
6. Type: **"Give me a system health report"**
7. ✅ Verify: AI uses `system_health` tool and shows DB stats

### Test 7: Analytics Dashboard
1. Click **Analytics & Billing** tab
2. ✅ Verify: stats cards show Users (24h), Messages (24h), Errors (24h), Knowledge Docs
3. ✅ Verify: usage bars show Free Tier usage percentages
4. ✅ Verify: chat volume bar chart (may be empty if no chat data yet)
5. ✅ Verify: plans section shows Free/Pro/Enterprise

### Test 8: Google OAuth Flow
1. Open an incognito window
2. Go to **https://chotubot.vercel.app**
3. Click "Get Started" → directed to sign-in page
4. Click "Continue with Google"
5. ✅ Verify: Google consent screen appears with your app name
6. ✅ Verify: after sign-in, redirected to `/chat`
7. ✅ Verify: chat history is saved (close tab, reopen, history persists)

---

## 📊 Sample Data for Each Collection

### `documents` Collection (Auto-created by uploading in Test 5)
```json
{
  "title": "Product FAQ - ChotuBot",
  "content": "Q: What is ChotuBot? A: ...",
  "chunksCount": 5,
  "createdAt": "2026-03-05T..."
}
```

### `chunks` Collection (Auto-created by Test 5 upload)
```json
{
  "documentId": "<ObjectId>",
  "documentTitle": "Product FAQ - ChotuBot",
  "content": "[Product FAQ - ChotuBot] Q: What is ChotuBot? A: ...",
  "chunkIndex": 0,
  "embedding": [0.123, -0.456, ...], // 768 dimensions
  "createdAt": "2026-03-05T..."
}
```

### `sessions` Collection (Auto-created when users visit)
```json
{
  "sessionId": "sess_abc123",
  "userAgent": "Mozilla/5.0...",
  "lastSeen": "2026-03-05T...",
  "visitCount": 3,
  "firstSeen": "2026-03-05T..."
}
```

### `chat_logs` Collection (Auto-created when users chat)
```json
{
  "sessionId": "sess_abc123",
  "role": "user",
  "content": "What is ChotuBot?",
  "source": "user_chat",
  "ragUsed": false,
  "timestamp": "2026-03-05T..."
}
```

### `users` Collection (Auto-created on Google sign-in)
```json
{
  "name": "Sunny Minni",
  "email": "sunnyminni1@gmail.com",
  "image": "https://lh3.googleusercontent.com/...",
  "plan": "free",
  "lastLogin": "2026-03-05T...",
  "createdAt": "2026-03-05T..."
}
```

---

## 🏗️ Architecture — Why These Choices?

### Why Groq (not OpenAI)?
- **Free tier**: 14,400 requests/day vs OpenAI's $20/mo minimum
- **Speed**: Groq runs LLaMA on custom LPU chips — 10x faster than OpenAI
- **Open model**: LLaMA 3.3 70B is open-weight, not locked behind a company

### Why MongoDB Atlas (not PostgreSQL)?
- **Free M0 tier**: 512MB storage, no credit card
- **Vector search built-in**: No need for Pinecone/Weaviate ($70+/mo)
- **Document model**: Perfect for chat logs, sessions, flexible schemas
- **Aggregation pipeline**: Powers the AI Agent's database queries

### Why Gemini Embeddings (not OpenAI)?
- **Free**: 1,500 requests/minute, no charge
- **768 dimensions**: MongoDB Atlas vector search works natively
- **Google quality**: Same embeddings behind Google Search

### Why Next.js App Router?
- **Full-stack**: Frontend + API routes in one codebase
- **Vercel-native**: Zero config deployment, edge functions
- **SSR**: SEO-optimized landing page
- **Streaming**: Native support for SSE via ReadableStream

### Why SSE (not WebSockets)?
- **Simpler**: One-way server→client stream is all we need for chat
- **Vercel compatible**: Vercel doesn't support WebSockets on free tier
- **HTTP native**: Works through proxies, CDNs, and firewalls

### Why JWT (not sessions)?
- **Stateless**: No session DB needed — saves MongoDB storage
- **Vercel**: Serverless functions can't share in-memory sessions
- **Speed**: Token verification is a pure crypto operation, no DB query

### Why Not Tailwind UI / Chakra UI?
- **Size**: shadcn/ui components are copy-pasted (no runtime dependency)
- **Custom**: We use CVA (class-variance-authority) for variant system
- **Tree-shakeable**: Only components we use are bundled

---

## ⚠️ Known Edge Cases

| Scenario | What Happens |
|----------|-------------|
| MongoDB Atlas cold start | First request after ~15min idle takes 2-3s (free tier sleep). All subsequent requests are fast. |
| Groq rate limit hit | Error message shown to user with retry guidance. Rate limit resets per-minute. |
| Very large document upload | Max 50,000 chars enforced. Larger docs need to be split manually. |
| Concurrent admin sessions | JWT is stateless — multiple admins can be logged in simultaneously. |
| Google OAuth token expiry | NextAuth handles refresh automatically. User won't notice. |
| Browser without JS | Landing page renders server-side; chat requires JS for SSE streaming. |

---

## 🎯 How to Demo This Project

### 30-Second Pitch
> "ChotuBot is an AI customer support platform that costs $0. Upload your business docs, and it answers customer questions 24/7 using RAG. The admin can query live data in plain English — 'how many users today?' The entire stack runs on free tiers."

### Live Demo Flow (2 minutes)
1. Open landing page → show the design quality
2. Click "Get Started" → show Google OAuth
3. Chat: "What is ChotuBot?" → show streaming
4. Open admin panel → login
5. Upload the sample FAQ document
6. Ask: "What does our KB say about pricing?" → show RAG working
7. Ask: "How many users today?" → show AI Agent querying MongoDB live
8. Open Analytics tab → show dashboard

### Technical Talking Points
- **Zero cost**: Vercel + MongoDB Atlas + Groq + Gemini = $0/month
- **Production security**: JWT, OAuth, rate limiting, XSS protection
- **RAG pipeline**: Gemini embeddings → MongoDB vector search → Groq LLM
- **AI Agent**: 8 function-calling tools connected to live database
- **Streaming**: SSE for real-time word-by-word responses
