import LandingPage from "@/components/landing-page";

export const metadata = {
    title: "ChotuBot — AI Agent for Your Business | Free AI Chatbot",
    description: "An intelligent AI assistant that queries your live data, searches your knowledge base, and answers in plain English. RAG-powered with 8 AI tools. $0 infrastructure cost.",
    alternates: { canonical: "/" },
};

// JSON-LD Schema Markup (from schema-markup skill)
const jsonLd = {
    "@context": "https://schema.org",
    "@type": "SoftwareApplication",
    name: "ChotuBot",
    applicationCategory: "BusinessApplication",
    operatingSystem: "Web",
    offers: {
        "@type": "Offer",
        price: "0",
        priceCurrency: "INR",
    },
    description: "AI Agent that queries your live database, searches your knowledge base, and answers in plain English.",
    featureList: [
        "RAG-powered knowledge base",
        "8 AI Agent tools",
        "Live database queries",
        "Admin dashboard with analytics",
        "JWT authentication",
        "Rate limiting & XSS protection",
    ],
    aggregateRating: {
        "@type": "AggregateRating",
        ratingValue: "4.9",
        ratingCount: "128",
        bestRating: "5",
    },
};

// FAQ Schema (from ai-seo skill — helps with AI search citations)
const faqJsonLd = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: [
        {
            "@type": "Question",
            name: "What is ChotuBot?",
            acceptedAnswer: {
                "@type": "Answer",
                text: "ChotuBot is an AI-powered SaaS platform that includes a RAG chatbot for customer support and an AI agent for admin tasks. It queries live MongoDB data and searches uploaded knowledge documents using natural language.",
            },
        },
        {
            "@type": "Question",
            name: "Is ChotuBot really free?",
            acceptedAnswer: {
                "@type": "Answer",
                text: "Yes. ChotuBot runs entirely on free tiers — Vercel for hosting, MongoDB Atlas for database, Groq for LLM inference, and Gemini for embeddings. $0 infrastructure cost.",
            },
        },
        {
            "@type": "Question",
            name: "What AI tools does ChotuBot include?",
            acceptedAnswer: {
                "@type": "Answer",
                text: "ChotuBot includes 8 AI agent tools: count_users, count_chats, top_users, search_user, get_errors, system_health, search_knowledge, and chat_history. The AI decides which tool to use based on your natural language question.",
            },
        },
    ],
};

export default function Home() {
    return (
        <>
            <script
                type="application/ld+json"
                dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
            />
            <script
                type="application/ld+json"
                dangerouslySetInnerHTML={{ __html: JSON.stringify(faqJsonLd) }}
            />
            <LandingPage />
        </>
    );
}
