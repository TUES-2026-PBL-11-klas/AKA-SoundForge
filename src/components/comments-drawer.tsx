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
  onCommentPosted,
  onCommentDeleted,
  onCountSync,
}: {
  trackId: string;
  isOpen: boolean;
  onClose: () => void;
  onCommentPosted?: () => void;
  onCommentDeleted?: () => void;
  onCountSync?: (count: number) => void;
}) {
  const [comments, setComments] = useState<CommentRow[]>([]);
  const [loading, setLoading] = useState(false);
  const [body, setBody] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [deleting, setDeleting] = useState<string | null>(null);
  const listRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    if (!isOpen) return;
    setLoading(true);
    fetch(`/api/tracks/${trackId}/comments`)
      .then((r) => r.json())
      .then((data: CommentRow[]) => {
        const list = Array.isArray(data) ? data : [];
        setComments(list);
        onCountSync?.(list.length);
      })
      .finally(() => setLoading(false));
  // onCountSync is intentionally excluded — it would loop if the parent recreates it
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen, trackId]);

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
        onCommentPosted?.();
      }
    } finally {
      setSubmitting(false);
      textareaRef.current?.focus();
    }
  }

  async function handleDelete(commentId: string) {
    setDeleting(commentId);
    try {
      const res = await fetch(
        `/api/tracks/${trackId}/comments/${commentId}`,
        { method: "DELETE" }
      );
      if (res.ok || res.status === 204) {
        setComments((prev) => prev.filter((c) => c.id !== commentId));
        onCommentDeleted?.();
      }
    } finally {
      setDeleting(null);
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
          <h2 className="text-sm font-semibold">
            Comments{comments.length > 0 ? ` (${comments.length})` : ""}
          </h2>
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
              <div className="flex flex-1 flex-col gap-0.5">
                <span className="text-xs font-semibold">{c.user.username}</span>
                <p className="text-sm leading-snug">{c.body}</p>
                <span className="text-xs text-zinc-400">
                  {new Date(c.created_at).toLocaleString()}
                </span>
              </div>
              {c.is_mine && (
                <button
                  onClick={() => handleDelete(c.id)}
                  disabled={deleting === c.id}
                  aria-label="Delete comment"
                  className="flex-shrink-0 self-start rounded-full p-1 text-zinc-400 hover:bg-zinc-100 hover:text-red-500 disabled:opacity-40 dark:hover:bg-zinc-800"
                >
                  {deleting === c.id ? (
                    <span className="block h-4 w-4 animate-spin rounded-full border border-zinc-300 border-t-zinc-600" />
                  ) : (
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="h-4 w-4">
                      <polyline points="3 6 5 6 21 6" />
                      <path d="M19 6l-1 14H6L5 6" />
                      <path d="M10 11v6M14 11v6" />
                      <path d="M9 6V4h6v2" />
                    </svg>
                  )}
                </button>
              )}
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
