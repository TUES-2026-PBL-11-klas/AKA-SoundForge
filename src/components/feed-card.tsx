"use client";

import { useEffect, useRef, useState } from "react";
import { CommentsDrawer } from "@/components/comments-drawer";
import type { FeedTrack } from "@/app/api/feed/route";

// animated waveform bars using pure CSS
function Waveform({ playing }: { playing: boolean }) {
  return (
    <div className="flex items-end gap-[3px] h-10">
      {Array.from({ length: 28 }).map((_, i) => (
        <div
          key={i}
          className="w-[3px] rounded-full bg-white/70"
          style={{
            height: `${20 + Math.sin(i * 0.8) * 14}px`,
            animation: playing
              ? `waveBar 0.${6 + (i % 4)}s ease-in-out infinite alternate`
              : "none",
            animationDelay: `${(i * 0.05).toFixed(2)}s`,
          }}
        />
      ))}
    </div>
  );
}

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

function PlayIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" className="h-10 w-10">
      <polygon points="5,3 19,12 5,21" />
    </svg>
  );
}

function PauseIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" className="h-10 w-10">
      <rect x="6" y="4" width="4" height="16" />
      <rect x="14" y="4" width="4" height="16" />
    </svg>
  );
}

export function FeedCard({ track }: { track: FeedTrack }) {
  const audioRef = useRef<HTMLAudioElement>(null);
  const cardRef = useRef<HTMLDivElement>(null);
  const [playing, setPlaying] = useState(false);
  const [liked, setLiked] = useState(track.viewer_has_liked);
  const [likeCount, setLikeCount] = useState(track.like_count);
  const [commentCount, setCommentCount] = useState(track.comment_count);
  const [commentsOpen, setCommentsOpen] = useState(false);

  // auto-play/pause via IntersectionObserver
  useEffect(() => {
    const card = cardRef.current;
    const audio = audioRef.current;
    if (!card || !audio) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          audio.play().catch(() => {});
        } else {
          audio.pause();
        }
      },
      { threshold: 0.7 }
    );

    observer.observe(card);
    return () => observer.disconnect();
  }, []);

  function togglePlay() {
    const audio = audioRef.current;
    if (!audio) return;
    if (audio.paused) {
      audio.play().catch(() => {});
    } else {
      audio.pause();
    }
  }

  async function toggleLike() {
    const wasLiked = liked;
    // optimistic update
    setLiked(!wasLiked);
    setLikeCount((n) => (wasLiked ? Math.max(0, n - 1) : n + 1));

    try {
      const res = await fetch(`/api/tracks/${track.id}/like`, { method: "POST" });
      if (res.ok) {
        const data = await res.json();
        setLiked(data.liked);
        setLikeCount(data.like_count);
      } else {
        // rollback
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
      className="relative flex h-[calc(100vh-3.5rem)] w-full snap-start flex-col items-center justify-center overflow-hidden bg-zinc-950"
    >
      {/* background gradient */}
      <div className="absolute inset-0 bg-gradient-to-br from-zinc-800 via-zinc-900 to-zinc-950" />

      {/* genre color accent */}
      {track.genre && (
        <div className="absolute inset-0 opacity-20"
          style={{ background: genreGradient(track.genre) }} />
      )}

      {/* bottom fade for readability */}
      <div className="absolute bottom-0 left-0 right-0 h-2/3 bg-gradient-to-t from-black/80 to-transparent" />

      {/* audio element */}
      {/* eslint-disable-next-line jsx-a11y/media-has-caption */}
      <audio
        ref={audioRef}
        src={track.audio_url}
        loop
        onPlay={() => setPlaying(true)}
        onPause={() => setPlaying(false)}
      />

      {/* play/pause tap zone (center) */}
      <button
        onClick={togglePlay}
        aria-label={playing ? "Pause" : "Play"}
        className="absolute inset-0 z-10 flex items-center justify-center"
      >
        <div
          className={`text-white/80 transition-opacity duration-200 ${
            playing ? "opacity-0" : "opacity-100"
          }`}
        >
          {playing ? <PauseIcon /> : <PlayIcon />}
        </div>
      </button>

      {/* bottom info */}
      <div className="absolute bottom-24 left-4 right-16 z-20 flex flex-col gap-2">
        <Waveform playing={playing} />
        <p className="line-clamp-2 text-sm font-medium text-white">{track.prompt}</p>
        <div className="flex items-center gap-2">
          {creator.avatar_url ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={creator.avatar_url}
              alt={creatorName}
              className="h-6 w-6 rounded-full object-cover"
            />
          ) : (
            <div className="flex h-6 w-6 items-center justify-center rounded-full bg-zinc-600 text-[10px] font-bold text-white">
              {creatorName.slice(0, 2).toUpperCase()}
            </div>
          )}
          <span className="text-xs font-semibold text-white/90">@{creator.username}</span>
          {(track.genre || track.mood) && (
            <span className="text-xs text-white/60">
              {[track.genre, track.mood].filter(Boolean).join(" · ")}
            </span>
          )}
        </div>
      </div>

      {/* right action buttons */}
      <div className="absolute bottom-24 right-3 z-20 flex flex-col items-center gap-6">
        {/* like */}
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

        {/* comment */}
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
      />

      {/* waveform keyframes injected once globally */}
      <style>{`
        @keyframes waveBar {
          from { transform: scaleY(0.4); }
          to   { transform: scaleY(1); }
        }
      `}</style>
    </div>
  );
}

function genreGradient(genre: string): string {
  const map: Record<string, string> = {
    "Lo-fi": "linear-gradient(135deg, #6366f1, #a78bfa)",
    "House": "linear-gradient(135deg, #f59e0b, #ef4444)",
    "Techno": "linear-gradient(135deg, #06b6d4, #6366f1)",
    "Jazz": "linear-gradient(135deg, #d97706, #b45309)",
    "Classical": "linear-gradient(135deg, #8b5cf6, #ec4899)",
    "Hip-Hop": "linear-gradient(135deg, #10b981, #3b82f6)",
    "Pop": "linear-gradient(135deg, #ec4899, #f43f5e)",
    "Ambient": "linear-gradient(135deg, #0ea5e9, #6366f1)",
  };
  return map[genre] ?? "linear-gradient(135deg, #52525b, #27272a)";
}
