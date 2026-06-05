"use client";

import { useEffect, useRef, useState } from "react";
import { FeedCard } from "@/components/feed-card";
import type { FeedTrack } from "@/app/api/feed/route";

export function FeedContainer({ initial }: { initial: FeedTrack[] }) {
  const [tracks, setTracks] = useState<FeedTrack[]>(initial);
  const [loading, setLoading] = useState(false);
  const [exhausted, setExhausted] = useState(initial.length < 10);
  const sentinelRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const sentinel = sentinelRef.current;
    if (!sentinel || exhausted) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting && !loading) {
          loadMore();
        }
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
      const res = await fetch(
        `/api/feed?cursor=${encodeURIComponent(last.created_at)}`
      );
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

  if (tracks.length === 0) {
    return (
      <div className="flex h-screen items-center justify-center text-zinc-400 text-sm">
        No tracks yet. <a href="/create" className="ml-1 underline">Create one!</a>
      </div>
    );
  }

  return (
    <div className="h-[calc(100vh-3.5rem)] overflow-y-scroll snap-y snap-mandatory">
      {tracks.map((track) => (
        <FeedCard key={track.id} track={track} />
      ))}

      {/* load-more sentinel */}
      {!exhausted && (
        <div ref={sentinelRef} className="flex h-[calc(100vh-3.5rem)] snap-start items-center justify-center bg-zinc-950">
          {loading && (
            <div className="h-8 w-8 animate-spin rounded-full border-2 border-white/20 border-t-white" />
          )}
        </div>
      )}
    </div>
  );
}
