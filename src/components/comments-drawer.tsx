"use client";

import { useEffect, useRef, useState } from "react";
import type { CommentRow } from "@/app/api/tracks/[id]/comments/route";

function Avatar({ username, avatarUrl }: { username: string; avatarUrl: string | null }) {
  if (avatarUrl) {
    return (
      // eslint-disable-next-line @next/next/no-img-element
      <img
        src={avatarUrl}
        alt={username}
        className="h-8 w-8 rounded-full object-cover flex-shrink-0"
      />
    );
  }
  return (
    <div className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full bg-zinc-200 text-xs font-semibold text-zinc-600 dark:bg-zinc-700 dark:text-zinc-300">
      {username.slice(0, 2).toUpperCase()}
    </div>
  );
}

export function CommentsDrawer({
  trackId,
  isOpen,
  onClose,
}: {
  trackId: string;
  isOpen: boolean;
  onClose: () => void;
}) {
  const [comments, setComments] = useState<CommentRow[]>([]);
  const [loading, setLoading] = useState(false);
  const [body, setBody] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const listRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    if (!isOpen) return;
    setLoading(true);
    fetch(`/api/tracks/${trackId}/comments`)
      .then((r) => r.json())
      .then((data) => setComments(Array.isArray(data) ? data : []))
      .finally(() => setLoading(false));
  }, [isOpen, trackId]);

  // scroll comments to bottom when new ones arrive
  useEffect(() => {
    if (listRef.current) {
      listRef.current.scrollTop = listRef.current.scrollHeight;
    }
  }, [comments]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const text = body.trim();
    if (!text || submitting) return;
    setSubmitting(true);
    try {
      const res = await fetch(`/api/tracks/${trackId}/comments`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ body: text }),
      });
      if (res.ok) {
        const newComment: CommentRow = await res.json();
        setComments((prev) => [...prev, newComment]);
        setBody("");
      }
    } finally {
      setSubmitting(false);
      textareaRef.current?.focus();
    }
  }

  return (
    <>
      {/* backdrop */}
      <div
        onClick={onClose}
        className={`fixed inset-0 z-40 bg-black/40 transition-opacity duration-300 ${
          isOpen ? "opacity-100" : "pointer-events-none opacity-0"
        }`}
      />

      {/* drawer */}
      <div
        className={`fixed bottom-0 left-0 right-0 z-50 flex max-h-[70vh] flex-col rounded-t-2xl bg-white shadow-2xl transition-transform duration-300 dark:bg-zinc-900 ${
          isOpen ? "translate-y-0" : "translate-y-full"
        }`}
      >
        {/* handle */}
        <div className="flex justify-center pt-3 pb-1">
          <div className="h-1 w-10 rounded-full bg-zinc-300 dark:bg-zinc-600" />
        </div>

        <div className="flex items-center justify-between px-4 py-2">
          <h2 className="text-sm font-semibold">Comments</h2>
          <button
            onClick={onClose}
            className="rounded-full p-1 text-zinc-500 hover:bg-zinc-100 dark:hover:bg-zinc-800"
            aria-label="Close"
          >
            ✕
          </button>
        </div>

        {/* comment list */}
        <div ref={listRef} className="flex-1 overflow-y-auto px-4 pb-2">
          {loading && (
            <p className="py-8 text-center text-sm text-zinc-400">Loading…</p>
          )}
          {!loading && comments.length === 0 && (
            <p className="py-8 text-center text-sm text-zinc-400">
              No comments yet. Be the first!
            </p>
          )}
          {comments.map((c) => (
            <div key={c.id} className="flex gap-3 py-3">
              <Avatar username={c.user.username} avatarUrl={c.user.avatar_url} />
              <div className="flex flex-col gap-0.5">
                <span className="text-xs font-semibold">{c.user.username}</span>
                <p className="text-sm leading-snug">{c.body}</p>
                <span className="text-xs text-zinc-400">
                  {new Date(c.created_at).toLocaleString()}
                </span>
              </div>
            </div>
          ))}
        </div>

        {/* input */}
        <form
          onSubmit={handleSubmit}
          className="flex items-end gap-2 border-t border-zinc-200 px-4 py-3 dark:border-zinc-800"
        >
          <textarea
            ref={textareaRef}
            value={body}
            onChange={(e) => setBody(e.target.value)}
            rows={1}
            maxLength={500}
            placeholder="Add a comment…"
            className="flex-1 resize-none rounded-xl border border-zinc-200 bg-zinc-50 px-3 py-2 text-sm outline-none focus:border-zinc-400 dark:border-zinc-700 dark:bg-zinc-800 dark:focus:border-zinc-500"
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault();
                handleSubmit(e as unknown as React.FormEvent);
              }
            }}
          />
          <button
            type="submit"
            disabled={!body.trim() || submitting}
            className="rounded-full bg-foreground px-4 py-2 text-xs font-semibold text-background disabled:opacity-40"
          >
            Post
          </button>
        </form>
      </div>
    </>
  );
}
