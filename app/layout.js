import './globals.css';

export const metadata = {
    title: 'ChotuBot — AI Chat Assistant',
    description: 'A smart AI-powered chat assistant with RAG capabilities. Built with Next.js and Groq.',
    keywords: ['AI', 'chatbot', 'assistant', 'ChotuBot'],
};

export default function RootLayout({ children }) {
    return (
        <html lang="en">
            <body>
                {children}
            </body>
        </html>
    );
}
