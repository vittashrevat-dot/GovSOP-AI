"use client";

import { useEffect, useRef, useState } from "react";
import { ApiError, search } from "@/lib/api";
import type { Citation } from "@/lib/types";
import { CitationChip } from "@/components/CitationChip";

interface ChatMessage {
  id: number;
  role: "user" | "assistant";
  text: string;
  citations?: Citation[];
  error?: boolean;
}

const SUGGESTIONS = [
  "What is the procurement approval threshold?",
  "Summarize the data retention rules.",
  "How do I report a security incident?",
];

let nextId = 1;

export function AssistantView() {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState("");
  const [busy, setBusy] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = scrollRef.current;
    // scrollTo is unavailable in jsdom; guard so tests and SSR don't throw.
    if (el && typeof el.scrollTo === "function") {
      el.scrollTo({ top: el.scrollHeight, behavior: "smooth" });
    }
  }, [messages, busy]);

  async function ask(prompt: string) {
    const trimmed = prompt.trim();
    if (!trimmed || busy) return;

    setInput("");
    setMessages((m) => [
      ...m,
      { id: nextId++, role: "user", text: trimmed },
    ]);
    setBusy(true);

    try {
      const resp = await search(trimmed);
      const answer =
        resp.results.length === 0
          ? `I couldn't find anything in the document library about "${trimmed}". Try rephrasing or using different keywords.`
          : // Strip the backend's "(Source: …)" trailer; we render chips instead.
            (resp.answer ?? resp.results[0].snippet).replace(
              /\n*\(Source:[^)]*\)\s*$/,
              "",
            );
      setMessages((m) => [
        ...m,
        {
          id: nextId++,
          role: "assistant",
          text: answer,
          citations: resp.results.slice(0, 4).map((r) => r.citation),
        },
      ]);
    } catch (err) {
      setMessages((m) => [
        ...m,
        {
          id: nextId++,
          role: "assistant",
          text:
            err instanceof ApiError
              ? err.message
              : "Something went wrong reaching the knowledge base.",
          error: true,
        },
      ]);
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="flex h-[calc(100vh-3rem-5.25rem)] flex-col">
      <div ref={scrollRef} className="flex-1 overflow-y-auto px-8 py-6">
        {messages.length === 0 ? (
          <div className="mx-auto max-w-2xl pt-6 text-center">
            <div className="mb-2 text-2xl">🤖</div>
            <h2 className="text-lg font-semibold text-slate-100">
              Ask the knowledge base
            </h2>
            <p className="mt-1 text-sm text-slate-500">
              I answer from your local documents and cite every source.
            </p>
            <div className="mt-6 flex flex-col items-stretch gap-2">
              {SUGGESTIONS.map((s) => (
                <button
                  key={s}
                  onClick={() => ask(s)}
                  className="rounded-md border border-base-700 bg-base-900 px-4 py-2.5 text-left text-sm text-slate-300 transition hover:border-accent/50 hover:bg-base-850 hover:text-accent"
                >
                  {s}
                </button>
              ))}
            </div>
          </div>
        ) : (
          <div className="mx-auto max-w-3xl space-y-4">
            {messages.map((m) => (
              <MessageBubble key={m.id} message={m} />
            ))}
            {busy && (
              <div className="flex items-center gap-2 text-sm text-slate-500">
                <span className="h-3 w-3 animate-spin rounded-full border-2 border-base-600 border-t-accent" />
                Searching the knowledge base…
              </div>
            )}
          </div>
        )}
      </div>

      <form
        onSubmit={(e) => {
          e.preventDefault();
          ask(input);
        }}
        className="border-t border-base-700 bg-base-900/60 px-8 py-4"
      >
        <div className="mx-auto flex max-w-3xl items-center gap-3">
          <input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Ask a question about your documents…"
            aria-label="Message the AI assistant"
            className="flex-1 rounded-md border border-base-700 bg-base-900 px-4 py-3 text-sm text-slate-100 placeholder:text-slate-600 focus:border-accent/60 focus:outline-none focus:ring-1 focus:ring-accent/40"
          />
          <button
            type="submit"
            disabled={busy || !input.trim()}
            className="rounded-md border border-accent/50 bg-base-800 px-4 py-3 text-sm font-medium text-accent transition hover:bg-base-700 disabled:cursor-not-allowed disabled:opacity-40"
          >
            Send
          </button>
        </div>
      </form>
    </div>
  );
}

function MessageBubble({ message }: { message: ChatMessage }) {
  const isUser = message.role === "user";
  return (
    <div className={`flex ${isUser ? "justify-end" : "justify-start"}`}>
      <div
        className={`max-w-[85%] rounded-lg px-4 py-3 text-sm leading-relaxed ${
          isUser
            ? "bg-accent/15 text-slate-100"
            : message.error
              ? "border border-red-900/60 bg-red-950/40 text-red-300"
              : "border border-base-700 bg-base-900 text-slate-200"
        }`}
      >
        <p className="whitespace-pre-line">{message.text}</p>
        {message.citations && message.citations.length > 0 && (
          <div className="mt-3 border-t border-base-700 pt-3">
            <div className="mb-2 text-[11px] font-semibold uppercase tracking-wider text-slate-500">
              Sources
            </div>
            <div className="flex flex-wrap gap-2">
              {message.citations.map((c, i) => (
                <CitationChip key={`${c.doc_id}-${c.order}-${i}`} citation={c} />
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
