'use client';

import { useState, useRef, useEffect, useCallback } from 'react';

export default function Home() {
    const [messages, setMessages] = useState([]);
    const [input, setInput] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState(null);
    const chatWindowRef = useRef(null);
    const inputRef = useRef(null);

    // Auto-scroll to bottom when new messages arrive
    useEffect(() => {
        if (chatWindowRef.current) {
            chatWindowRef.current.scrollTop = chatWindowRef.current.scrollHeight;
        }
    }, [messages, isLoading]);

    // Auto-dismiss error after 4 seconds
    useEffect(() => {
        if (error) {
            const timer = setTimeout(() => setError(null), 4000);
            return () => clearTimeout(timer);
        }
    }, [error]);

    // Get current time as HH:MM
    const getTime = () => {
        return new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    };

    // Send message
    const sendMessage = useCallback(async () => {
        const trimmed = input.trim();
        if (!trimmed || isLoading) return;

        const userMessage = {
            id: Date.now(),
            role: 'user',
            content: trimmed,
            time: getTime(),
        };

        setMessages(prev => [...prev, userMessage]);
        setInput('');
        setIsLoading(true);
        setError(null);

        try {
            const res = await fetch('/api/chat', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    messages: [...messages, userMessage].map(m => ({
                        role: m.role,
                        content: m.content,
                    })),
                }),
            });

            const data = await res.json();

            if (!res.ok) {
                // Handle rate limit
                if (res.status === 429) {
                    setError('Rate limit reached. Please wait a moment before sending another message.');
                } else {
                    setError(data.error || 'Something went wrong. Please try again.');
                }
                return;
            }

            const aiMessage = {
                id: Date.now() + 1,
                role: 'assistant',
                content: data.message,
                time: getTime(),
            };

            setMessages(prev => [...prev, aiMessage]);
        } catch (err) {
            setError('Network error. Please check your connection.');
        } finally {
            setIsLoading(false);
            inputRef.current?.focus();
        }
    }, [input, isLoading, messages]);

    // Handle Enter key
    const handleKeyDown = (e) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            sendMessage();
        }
    };

    return (
        <div className="app">
            {/* Error Toast */}
            {error && <div className="error-toast" id="error-toast">{error}</div>}

            {/* Header */}
            <header className="header" id="header">
                <div className="header__brand">
                    <div className="header__logo">🤖</div>
                    <h1 className="header__title">ChotuBot</h1>
                </div>
                <div className="header__status">
                    <span className="header__status-dot"></span>
                    <span>Online</span>
                </div>
            </header>

            {/* Chat Window */}
            <div className="chat-window" id="chat-window" ref={chatWindowRef}>
                {messages.length === 0 && !isLoading ? (
                    <div className="welcome" id="welcome-screen">
                        <div className="welcome__icon">🤖</div>
                        <h2 className="welcome__title">Hey! I&apos;m ChotuBot</h2>
                        <p className="welcome__subtitle">
                            Your AI assistant powered by cutting-edge language models.
                            Type a message below to start chatting!
                        </p>
                    </div>
                ) : (
                    <>
                        {messages.map((msg) => (
                            <div
                                key={msg.id}
                                className={`message message--${msg.role === 'user' ? 'user' : 'ai'}`}
                                id={`message-${msg.id}`}
                            >
                                <div className="message__avatar">
                                    {msg.role === 'user' ? '👤' : '🤖'}
                                </div>
                                <div className="message__content">
                                    <div className="message__bubble">{msg.content}</div>
                                    <span className="message__time">{msg.time}</span>
                                </div>
                            </div>
                        ))}

                        {/* Typing Indicator */}
                        {isLoading && (
                            <div className="typing-indicator" id="typing-indicator">
                                <div className="typing-indicator__avatar">🤖</div>
                                <div className="typing-indicator__dots">
                                    <span className="typing-indicator__dot"></span>
                                    <span className="typing-indicator__dot"></span>
                                    <span className="typing-indicator__dot"></span>
                                </div>
                            </div>
                        )}
                    </>
                )}
            </div>

            {/* Input Area */}
            <div className="input-area" id="input-area">
                <div className="input-wrapper">
                    <textarea
                        ref={inputRef}
                        className="input-wrapper__input"
                        id="message-input"
                        placeholder="Type your message..."
                        value={input}
                        onChange={(e) => setInput(e.target.value)}
                        onKeyDown={handleKeyDown}
                        disabled={isLoading}
                        rows={1}
                        autoFocus
                    />
                    <button
                        className="input-wrapper__send"
                        id="send-button"
                        onClick={sendMessage}
                        disabled={!input.trim() || isLoading}
                        aria-label="Send message"
                    >
                        ➤
                    </button>
                </div>
                <p className="input-area__info">
                    ChotuBot can make mistakes. Verify important info.
                </p>
            </div>
        </div>
    );
}
