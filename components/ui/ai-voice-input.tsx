"use client";

import { Mic } from "lucide-react";
import { useState, useEffect } from "react";
import { cn } from "@/lib/utils";

interface AIVoiceInputProps {
    onStart?: () => void;
    onStop?: (duration: number) => void;
    visualizerBars?: number;
    className?: string;
}

export function AIVoiceInput({
    onStart,
    onStop,
    visualizerBars = 32,
    className,
}: AIVoiceInputProps) {
    const [submitted, setSubmitted] = useState(false);
    const [time, setTime] = useState(0);
    const [isClient, setIsClient] = useState(false);

    useEffect(() => {
        setIsClient(true);
    }, []);

    useEffect(() => {
        let intervalId: NodeJS.Timeout;

        if (submitted) {
            onStart?.();
            intervalId = setInterval(() => {
                setTime((t) => t + 1);
            }, 1000);
        } else {
            if (time > 0) onStop?.(time);
            setTime(0);
        }

        return () => clearInterval(intervalId);
    }, [submitted]);

    const formatTime = (seconds: number) => {
        const mins = Math.floor(seconds / 60);
        const secs = seconds % 60;
        return `${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
    };

    return (
        <div className={cn("flex items-center gap-2", className)}>
            <button
                className={cn(
                    "group w-9 h-9 rounded-lg flex items-center justify-center transition-all",
                    submitted
                        ? "bg-red-500/20 text-red-400"
                        : "text-white/40 hover:text-white/80 hover:bg-white/5"
                )}
                type="button"
                onClick={() => setSubmitted((prev) => !prev)}
            >
                {submitted ? (
                    <div
                        className="w-4 h-4 rounded-sm animate-spin bg-red-400"
                        style={{ animationDuration: "3s" }}
                    />
                ) : (
                    <Mic className="w-4 h-4" />
                )}
            </button>

            {submitted && (
                <div className="flex items-center gap-2">
                    <span className="font-mono text-xs text-white/60">
                        {formatTime(time)}
                    </span>
                    <div className="h-4 flex items-center gap-0.5">
                        {[...Array(visualizerBars)].map((_, i) => (
                            <div
                                key={i}
                                className="w-0.5 rounded-full bg-white/40 animate-pulse"
                                style={
                                    isClient
                                        ? {
                                            height: `${20 + Math.random() * 80}%`,
                                            animationDelay: `${i * 0.05}s`,
                                        }
                                        : { height: "20%" }
                                }
                            />
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
}
