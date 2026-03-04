// Gemini Embedding API + Text Chunking

const GEMINI_API_KEY = () => process.env.GEMINI_API_KEY?.trim() || "";
const EMBEDDING_MODEL = "text-embedding-004";
const EMBEDDING_URL = `https://generativelanguage.googleapis.com/v1beta/models/${EMBEDDING_MODEL}:embedContent`;

// ============================
// Generate Embedding via Gemini
// ============================
export async function generateEmbedding(text: string): Promise<number[]> {
    const apiKey = GEMINI_API_KEY();
    if (!apiKey) throw new Error("GEMINI_API_KEY is not set");

    const res = await fetch(`${EMBEDDING_URL}?key=${apiKey}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
            model: `models/${EMBEDDING_MODEL}`,
            content: {
                parts: [{ text }],
            },
        }),
    });

    if (!res.ok) {
        const errText = await res.text();
        throw new Error(`Gemini embedding failed: ${res.status} - ${errText}`);
    }

    const data = await res.json();
    return data.embedding.values;
}

// ============================
// Text Chunking
// ============================
const CHUNK_SIZE = 500;     // characters per chunk
const CHUNK_OVERLAP = 50;   // overlap between chunks

export function chunkText(text: string, title: string): { content: string; index: number }[] {
    const cleaned = text.replace(/\n{3,}/g, "\n\n").trim();

    if (cleaned.length <= CHUNK_SIZE) {
        return [{ content: `[${title}] ${cleaned}`, index: 0 }];
    }

    const chunks: { content: string; index: number }[] = [];
    let start = 0;
    let index = 0;

    while (start < cleaned.length) {
        let end = start + CHUNK_SIZE;

        // Try to break at a sentence boundary
        if (end < cleaned.length) {
            const lastPeriod = cleaned.lastIndexOf(".", end);
            const lastNewline = cleaned.lastIndexOf("\n", end);
            const breakPoint = Math.max(lastPeriod, lastNewline);
            if (breakPoint > start + CHUNK_SIZE * 0.5) {
                end = breakPoint + 1;
            }
        } else {
            end = cleaned.length;
        }

        const chunk = cleaned.slice(start, end).trim();
        if (chunk.length > 10) {
            chunks.push({
                content: `[${title}] ${chunk}`,
                index,
            });
            index++;
        }

        start = end - CHUNK_OVERLAP;
        if (start >= cleaned.length) break;
    }

    return chunks;
}

// ============================
// Batch Embed Chunks
// ============================
export async function embedChunks(
    chunks: { content: string; index: number }[]
): Promise<{ content: string; index: number; embedding: number[] }[]> {
    const results = [];

    for (const chunk of chunks) {
        const embedding = await generateEmbedding(chunk.content);
        results.push({ ...chunk, embedding });
        // Small delay to respect Gemini rate limits
        await new Promise((r) => setTimeout(r, 100));
    }

    return results;
}
