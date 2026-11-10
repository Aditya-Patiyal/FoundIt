"use client";

import { useEffect, useRef, useState, type FormEvent } from "react";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import type { ChatMessage, ReturnState } from "@/lib/chat";
import ReturnControls from "./ReturnControls";

const MEETING_SPOTS = ["Cafeteria", "Library", "Main gate"];

export default function ChatRoom({
  claimId,
  userId,
  isFinder,
  otherName,
  itemId,
  itemTitle,
  initialMessages,
  returnState,
}: {
  claimId: string;
  userId: string;
  isFinder: boolean;
  otherName: string;
  itemId: string;
  itemTitle: string;
  initialMessages: ChatMessage[];
  returnState: ReturnState;
}) {
  const [supabase] = useState(() => createClient());
  const [messages, setMessages] = useState<ChatMessage[]>(initialMessages);
  const [input, setInput] = useState("");
  const [sending, setSending] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);

  function addMessage(msg: ChatMessage) {
    setMessages((prev) => (prev.some((m) => m.id === msg.id) ? prev : [...prev, msg]));
  }

  // Live updates: new messages for this claim arrive via Supabase Realtime.
  // RLS ensures only the two parties receive them.
  useEffect(() => {
    const channel = supabase
      .channel(`chat-${claimId}`)
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "messages",
          filter: `claim_id=eq.${claimId}`,
        },
        (payload) => addMessage(payload.new as ChatMessage),
      )
      .subscribe();
    return () => {
      supabase.removeChannel(channel);
    };
  }, [supabase, claimId]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  async function send(e: FormEvent) {
    e.preventDefault();
    const body = input.trim();
    if (!body || sending) return;
    setSending(true);
    setInput("");
    const { data, error } = await supabase
      .from("messages")
      .insert({ claim_id: claimId, sender_id: userId, body })
      .select("id, sender_id, body, created_at")
      .single();
    setSending(false);
    if (error) {
      setInput(body); // restore so the user can retry
      return;
    }
    if (data) addMessage(data as ChatMessage);
  }

  return (
    <div className="mx-auto flex w-full max-w-md flex-1 flex-col">
      {/* Header */}
      <header className="sticky top-0 z-10 flex items-center gap-3 border-b border-black/10 bg-surface px-4 py-3">
        <Link href={`/item/${itemId}`} aria-label="Back" className="text-muted">
          ←
        </Link>
        <div className="min-w-0">
          <p className="truncate font-semibold text-ink">{otherName}</p>
          <p className="truncate text-xs text-muted">{itemTitle}</p>
        </div>
      </header>

      {/* Safety banner */}
      <div className="bg-warning-bg px-4 py-2 text-center text-xs text-warning">
        Meet in a public place in daytime (cafeteria, library, main gate) — never in
        rooms. Don&apos;t share card or ID numbers.
      </div>

      {/* Messages */}
      <div className="flex-1 space-y-2 px-4 py-4 pb-40">
        {messages.length === 0 ? (
          <p className="mt-6 text-center text-sm text-muted">
            Say hello and arrange a safe place to meet.
          </p>
        ) : (
          messages.map((m) => {
            const mine = m.sender_id === userId;
            return (
              <div
                key={m.id}
                className={`flex ${mine ? "justify-end" : "justify-start"}`}
              >
                <div
                  className={`max-w-[80%] rounded-card px-3 py-2 text-sm ${
                    mine
                      ? "bg-primary text-white"
                      : "bg-surface text-ink ring-1 ring-black/5"
                  }`}
                >
                  {m.body}
                </div>
              </div>
            );
          })
        )}
        <div ref={bottomRef} />
      </div>

      {/* Composer (fixed above the bottom tab bar) */}
      <div className="fixed inset-x-0 bottom-16 z-10 mx-auto w-full max-w-md border-t border-black/10 bg-surface px-3 py-2">
        <div className="mb-2 flex gap-2 overflow-x-auto">
          {MEETING_SPOTS.map((spot) => (
            <button
              key={spot}
              type="button"
              onClick={() => setInput(`Let's meet at the ${spot}.`)}
              className="shrink-0 rounded-full bg-primary-soft px-3 py-1 text-xs font-medium text-primary-on-soft"
            >
              {spot}
            </button>
          ))}
        </div>
        <form onSubmit={send} className="flex items-center gap-2">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Message…"
            aria-label="Message"
            className="flex-1 rounded-btn border border-black/10 bg-white px-3 py-2.5 text-ink outline-none focus:border-primary focus:ring-2 focus:ring-primary/30"
          />
          <button
            type="submit"
            disabled={sending || !input.trim()}
            className="rounded-btn bg-primary px-4 py-2.5 font-semibold text-white disabled:opacity-50"
          >
            Send
          </button>
        </form>
        <ReturnControls
          claimId={claimId}
          isFinder={isFinder}
          otherName={otherName}
          returnState={returnState}
        />
      </div>
    </div>
  );
}
