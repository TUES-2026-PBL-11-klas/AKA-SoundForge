"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { CommentsDrawer } from "@/components/comments-drawer";
import type { FeedTrack } from "@/app/api/feed/route";

// ─── Disc palettes — deterministic from track id ─────────────────────────────
const DISC_PALETTES: [string, string][] = [
  ["#22d3ee", "#6366f1"],
  ["#f59e0b", "#ef4444"],
  ["#10b981", "#3b82f6"],
  ["#ec4899", "#8b5cf6"],
  ["#f97316", "#eab308"],
  ["#06b6d4", "#8b5cf6"],
  ["#a78bfa", "#ec4899"],
  ["#34d399", "#60a5fa"],
  ["#fb7185", "#fbbf24"],
  ["#818cf8", "#34d399"],
];

function discColors(id: string): [string, string] {
  const hash = id.split("").reduce((acc, c) => acc + c.charCodeAt(0), 0);
  return DISC_PALETTES[hash % DISC_PALETTES.length];
}

// ─── Spinning vinyl disc ──────────────────────────────────────────────────────
function Disc({ playing, trackId, coverUrl }: { playing: boolean; trackId: string; coverUrl?: string | null }) {
  const [c1, c2] = discColors(trackId);
  const size = 240;

  return (
    <div style={{ position: "relative", width: size, height: size }}>
      {/* glow behind disc */}
      <div
        style={{
          position: "absolute",
          inset: -32,
          borderRadius: "50%",
          background: `radial-gradient(circle, ${c1}55 0%, ${c2}33 50%, transparent 70%)`,
          filter: "blur(24px)",
          opacity: playing ? 1 : 0.35,
          transform: `scale(${playing ? 1.15 : 1})`,
          transition: "opacity 0.7s, transform 0.7s",
        }}
      />

      {/* spinning part */}
      <div
        style={{
          position: "absolute",
          inset: 0,
          borderRadius: "50%",
          animation: "discSpin 4s linear infinite",
          animationPlayState: playing ? "running" : "paused",
        }}
      >
        {/* vinyl body */}
        <div
          style={{
            position: "absolute",
            inset: 0,
            borderRadius: "50%",
            background: "linear-gradient(145deg, #1c1c2e 0%, #0d0d1a 100%)",
          }}
        />

        {/* groove rings */}
        <div
          style={{
            position: "absolute",
            inset: 0,
            borderRadius: "50%",
            background: `repeating-radial-gradient(
              circle at center,
              transparent 0px,
              transparent 5px,
              rgba(255,255,255,0.035) 5px,
              rgba(255,255,255,0.035) 6px
            )`,
          }}
        />

        {/* center label */}
        {coverUrl ? (
          <div
            style={{
              position: "absolute",
              inset: "28%",
              borderRadius: "50%",
              overflow: "hidden",
              boxShadow: `0 0 24px ${c1}88`,
            }}
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={coverUrl} alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
          </div>
        ) : (
          <div
            style={{
              position: "absolute",
              inset: "28%",
              borderRadius: "50%",
              background: `linear-gradient(135deg, ${c1} 0%, ${c2} 100%)`,
              boxShadow: `0 0 24px ${c1}88`,
            }}
          />
        )}

        {/* center hole */}
        <div
          style={{
            position: "absolute",
            width: 14,
            height: 14,
            top: "50%",
            left: "50%",
            transform: "translate(-50%, -50%)",
            borderRadius: "50%",
            background: "#060608",
            boxShadow: "inset 0 0 4px rgba(0,0,0,0.9)",
          }}
        />
      </div>

      {/* static shine — doesn't spin */}
      <div
        style={{
          position: "absolute",
          inset: 0,
          borderRadius: "50%",
          background:
            "radial-gradient(circle at 35% 28%, rgba(255,255,255,0.13) 0%, transparent 55%)",
          pointerEvents: "none",
        }}
      />

      {/* outer ring border */}
      <div
        style={{
          position: "absolute",
          inset: 0,
          borderRadius: "50%",
          boxShadow: `inset 0 0 0 1px rgba(255,255,255,0.07), 0 0 0 1px rgba(0,0,0,0.5)`,
          pointerEvents: "none",
        }}
      />
    </div>
  );
}

// ─── Small waveform below disc ────────────────────────────────────────────────
const BAR_COUNT = 36;
const BAR_HEIGHTS = Array.from({ length: BAR_COUNT }, (_, i) =>
  Math.max(4, Math.round(
    12 + Math.sin(i * 0.6) * 8 + Math.sin(i * 1.4) * 5
  ))
);

function Waveform({ playing }: { playing: boolean }) {
  return (
    <div className="flex flex-col gap-[2px]">
      <div className="flex items-end justify-center gap-[2px]" style={{ height: 28 }}>
        {BAR_HEIGHTS.map((h, i) => (
          <div
            key={i}
            style={{
              width: 2.5,
              height: h,
              borderRadius: 2,
              background: "linear-gradient(to top, #22d3ee, #a78bfa)",
              boxShadow: playing ? "0 0 4px #22d3eeaa" : "none",
              animation: playing
                ? `waveBar 0.${5 + (i % 6)}s ease-in-out ${(i * 0.04).toFixed(2)}s infinite alternate`
                : "none",
              transition: "box-shadow 0.4s",
            }}
          />
        ))}
      </div>
      {/* reflection */}
      <div
        className="flex items-start justify-center gap-[2px]"
        style={{ height: 10, transform: "scaleY(-1)", opacity: 0.15 }}
      >
        {BAR_HEIGHTS.map((h, i) => (
          <div
            key={i}
            style={{
              width: 2.5,
              height: Math.round(h * 0.5),
              borderRadius: 2,
              background: "linear-gradient(to top, #22d3ee, #a78bfa)",
            }}
          />
        ))}
      </div>
    </div>
  );
}

// ─── Icons ────────────────────────────────────────────────────────────────────
function HeartIcon({ filled }: { filled: boolean }) {
  return filled ? (
    <svg viewBox="0 0 24 24" fill="currentColor" className="h-7 w-7">
      <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z" />
    </svg>
  ) : (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="h-7 w-7">
      <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
    </svg>
  );
}

function CommentIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="h-7 w-7">
      <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
    </svg>
  );
}

// ─── Card ─────────────────────────────────────────────────────────────────────
export function FeedCard({ track }: { track: FeedTrack }) {
  const audioRef = useRef<HTMLAudioElement>(null);
  const cardRef = useRef<HTMLDivElement>(null);
  const [playing, setPlaying] = useState(false);
  const [liked, setLiked] = useState(track.viewer_has_liked);
  const [likeCount, setLikeCount] = useState(track.like_count);
  const [commentCount, setCommentCount] = useState(track.comment_count);
  const [commentsOpen, setCommentsOpen] = useState(false);

  useEffect(() => {
    const card = cardRef.current;
    const audio = audioRef.current;
    if (!card || !audio) return;
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) audio.play().catch(() => {});
        else audio.pause();
      },
      { threshold: 0.7 }
    );
    observer.observe(card);
    return () => observer.disconnect();
  }, []);

  function togglePlay() {
    const audio = audioRef.current;
    if (!audio) return;
    audio.paused ? audio.play().catch(() => {}) : audio.pause();
  }

  async function toggleLike() {
    const wasLiked = liked;
    setLiked(!wasLiked);
    setLikeCount((n) => (wasLiked ? Math.max(0, n - 1) : n + 1));
    try {
      const res = await fetch(`/api/tracks/${track.id}/like`, { method: "POST" });
      if (res.ok) {
        const data = await res.json();
        setLiked(data.liked);
        setLikeCount(data.like_count);
      } else {
        setLiked(wasLiked);
        setLikeCount((n) => (wasLiked ? n + 1 : Math.max(0, n - 1)));
      }
    } catch {
      setLiked(wasLiked);
      setLikeCount((n) => (wasLiked ? n + 1 : Math.max(0, n - 1)));
    }
  }

  const { creator } = track;
  const creatorName = creator.display_name ?? creator.username;

  return (
    <div
      ref={cardRef}
      className="relative flex h-[calc(100vh-3.5rem)] w-full snap-start flex-col overflow-hidden bg-zinc-950"
    >
      {/* background */}
      <div className="absolute inset-0 bg-gradient-to-b from-zinc-900 via-zinc-950 to-black" />

      {/* bottom fade */}
      <div className="absolute bottom-0 left-0 right-0 h-52 bg-gradient-to-t from-black/95 to-transparent" />

      {/* audio */}
      { }
      <audio
        ref={audioRef}
        src={track.audio_url}
        loop
        onPlay={() => setPlaying(true)}
        onPause={() => setPlaying(false)}
      />

      {/* tap whole card to play/pause */}
      <button
        onClick={togglePlay}
        aria-label={playing ? "Pause" : "Play"}
        className="absolute inset-0 z-10"
      />

      {/* disc + waveform — centered (pointer-events-none so taps fall through to the play button) */}
      <div className="pointer-events-none absolute inset-x-0 top-1/2 z-20 flex -translate-y-[55%] flex-col items-center gap-6">
        <Disc playing={playing} trackId={track.id} coverUrl={track.cover_url} />
        <Waveform playing={playing} />
      </div>

      {/* bottom-left: track info */}
      <div className="absolute bottom-10 left-4 right-16 z-20 flex flex-col gap-2">
        <p className="line-clamp-2 text-sm font-semibold text-white drop-shadow">
          {track.prompt}
        </p>
        <div className="flex items-center gap-2 flex-wrap">
          <Link
            href={`/u/${creator.username}`}
            onClick={(e) => e.stopPropagation()}
            className="flex items-center gap-2"
          >
            {creator.avatar_url ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={creator.avatar_url}
                alt={creatorName}
                className="h-6 w-6 rounded-full object-cover ring-1 ring-white/30"
              />
            ) : (
              <div className="flex h-6 w-6 items-center justify-center rounded-full bg-zinc-600 text-[10px] font-bold text-white ring-1 ring-white/30">
                {creatorName.slice(0, 2).toUpperCase()}
              </div>
            )}
            <span className="text-xs font-semibold text-white/90 hover:text-white">
              @{creator.username}
            </span>
          </Link>
          {(track.genre || track.mood) && (
            <span className="rounded-full border border-white/20 px-2 py-0.5 text-[10px] text-white/60">
              {[track.genre, track.mood].filter(Boolean).join(" · ")}
            </span>
          )}
        </div>
      </div>

      {/* right: action buttons */}
      <div className="absolute bottom-10 right-3 z-20 flex flex-col items-center gap-6">
        <button
          onClick={(e) => { e.stopPropagation(); toggleLike(); }}
          className="flex flex-col items-center gap-1"
          aria-label="Like"
        >
          <span className={`transition-colors ${liked ? "text-red-500" : "text-white"}`}>
            <HeartIcon filled={liked} />
          </span>
          <span className="text-xs font-semibold text-white">{likeCount}</span>
        </button>

        <button
          onClick={(e) => { e.stopPropagation(); setCommentsOpen(true); }}
          className="flex flex-col items-center gap-1 text-white"
          aria-label="Comments"
        >
          <CommentIcon />
          <span className="text-xs font-semibold">{commentCount}</span>
        </button>
      </div>

      <CommentsDrawer
        trackId={track.id}
        isOpen={commentsOpen}
        onClose={() => setCommentsOpen(false)}
        onCommentPosted={() => setCommentCount((n) => n + 1)}
        onCommentDeleted={() => setCommentCount((n) => Math.max(0, n - 1))}
        onCountSync={(n) => setCommentCount(n)}
      />
    </div>
  );
}
