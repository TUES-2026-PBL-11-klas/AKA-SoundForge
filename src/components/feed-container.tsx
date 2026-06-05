"use client";

import { useEffect, useRef, useState } from "react";
import { FeedCard } from "@/components/feed-card";
import type { FeedTrack } from "@/app/api/feed/route";

export function FeedContainer({ initial }: { initial: FeedTrack[] }) {
  const [tracks, setTracks] = useState<FeedTrack[]>(initial);
  const [loading, setLoading] = useState(false);
  const [exhausted, setExhausted] = useState(initial.length < 10);
  // browsers block autoplay until a user gesture — show overlay until first tap
  const [unlocked, setUnlocked] = useState(false);
  const sentinelRef = useRef<HTMLDivElement>(null);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const sentinel = sentinelRef.current;
    if (!sentinel || exhausted) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting && !loading) loadMore();
      },
      { threshold: 0.1 }
    );

    observer.observe(sentinel);
    return () => observer.disconnect();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tracks, loading, exhausted]);

  async function loadMore() {
    if (loading || exhausted) return;
    const last = tracks[tracks.length - 1];
    if (!last) return;
    setLoading(true);
    try {
      const res = await fetch(`/api/feed?cursor=${encodeURIComponent(last.created_at)}`);
      if (!res.ok) return;
      const next: FeedTrack[] = await res.json();
      if (next.length === 0) {
        setExhausted(true);
      } else {
        setTracks((prev) => [...prev, ...next]);
        if (next.length < 10) setExhausted(true);
      }
    } finally {
      setLoading(false);
    }
  }

  function handleUnlock() {
    setUnlocked(true);
    // find the first audio element in the feed and play it
    const audio = scrollRef.current?.querySelector("audio");
    audio?.play().catch(() => {});
  }

  if (tracks.length === 0) {
    return (
      <div className="flex h-[calc(100vh-3.5rem)] items-center justify-center text-zinc-400 text-sm">
        No tracks yet.{" "}
        <a href="/create" className="ml-1 underline">
          Create one!
        </a>
      </div>
    );
  }

  return (
    <div className="relative">
      <div
        ref={scrollRef}
        className="h-[calc(100vh-3.5rem)] overflow-y-scroll snap-y snap-mandatory"
      >
        {tracks.map((track) => (
          <FeedCard key={track.id} track={track} />
        ))}

        {!exhausted && (
          <div
            ref={sentinelRef}
            className="flex h-[calc(100vh-3.5rem)] snap-start items-center justify-center bg-zinc-950"
          >
            {loading && (
              <div className="h-8 w-8 animate-spin rounded-full border-2 border-white/20 border-t-white" />
            )}
          </div>
        )}
      </div>

      {/* one-time autoplay unlock overlay */}
      {!unlocked && (
        <div
          className="absolute inset-0 z-50 flex cursor-pointer flex-col items-center justify-center bg-black/60 backdrop-blur-sm"
          onClick={handleUnlock}
        >
          <div className="flex flex-col items-center gap-4">
            <div className="flex h-16 w-16 items-center justify-center rounded-full bg-white/10 ring-1 ring-white/20">
              <svg viewBox="0 0 24 24" fill="currentColor" className="h-7 w-7 translate-x-0.5 text-white">
                <polygon points="5,3 19,12 5,21" />
              </svg>
            </div>
            <p className="text-sm font-medium text-white/80">Tap to start listening</p>
          </div>
        </div>
      )}
    </div>
  );
}
