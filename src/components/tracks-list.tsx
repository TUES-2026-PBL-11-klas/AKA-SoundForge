"use client";

import { useRef, useState } from "react";
import { createClient } from "@/lib/supabase/client";

export type TrackRow = {
  id: string;
  prompt: string;
  genre: string | null;
  mood: string | null;
  audio_url: string;
  cover_url?: string | null;
  created_at: string;
};

function HeartIcon({ filled }: { filled: boolean }) {
  return filled ? (
    <svg viewBox="0 0 24 24" fill="currentColor" className="h-4 w-4 text-red-500">
      <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z" />
    </svg>
  ) : (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="h-4 w-4 text-zinc-400 hover:text-red-400 transition-colors">
      <path strokeLinecap="round" strokeLinejoin="round" d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
    </svg>
  );
}

function CameraIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} className="h-4 w-4">
      <path strokeLinecap="round" strokeLinejoin="round" d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z" />
      <circle cx="12" cy="13" r="4" />
    </svg>
  );
}

export function TracksList({
  tracks,
  likedIds = [],
  userId,
  canEditCovers,
}: {
  tracks: TrackRow[];
  likedIds?: string[];
  userId?: string;
  canEditCovers?: boolean;
}) {
  const supabase = createClient();
  const [liked, setLiked] = useState<Set<string>>(new Set(likedIds));
  const [covers, setCovers] = useState<Record<string, string>>({});
  const [uploadingId, setUploadingId] = useState<string | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const pendingTrackId = useRef<string | null>(null);

  async function toggleLike(trackId: string) {
    if (!userId) return;
    const isLiked = liked.has(trackId);
    setLiked((prev) => {
      const next = new Set(prev);
      isLiked ? next.delete(trackId) : next.add(trackId);
      return next;
    });
    if (isLiked) {
      await supabase.from("likes").delete().match({ user_id: userId, track_id: trackId });
    } else {
      await supabase.from("likes").insert({ user_id: userId, track_id: trackId });
    }
  }

  function openCoverPicker(trackId: string) {
    pendingTrackId.current = trackId;
    fileInputRef.current?.click();
  }

  async function handleCoverFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    const trackId = pendingTrackId.current;
    if (!file || !trackId || !userId) return;
    e.target.value = "";

    setUploadingId(trackId);
    const ext = file.name.split(".").pop();
    const path = `${userId}/track-cover-${trackId}.${ext}`;
    const { error: uploadErr } = await supabase.storage
      .from("avatars")
      .upload(path, file, { upsert: true });

    if (!uploadErr) {
      const { data: pub } = supabase.storage.from("avatars").getPublicUrl(path);
      await supabase.from("tracks").update({ cover_url: pub.publicUrl }).eq("id", trackId);
      setCovers((prev) => ({ ...prev, [trackId]: pub.publicUrl }));
    }
    setUploadingId(null);
  }

  return (
    <div className="flex flex-col">
      {/* single hidden file input shared across all tracks */}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={handleCoverFile}
      />

      {tracks.map((t, i) => {
        const coverUrl = covers[t.id] ?? t.cover_url;
        const isUploading = uploadingId === t.id;

        return (
          <article
            key={t.id}
            className={`flex flex-col gap-3 py-5 ${
              i > 0 ? "border-t border-zinc-200 dark:border-zinc-800" : ""
            }`}
          >
            <div className="flex items-start gap-3">
              {/* cover area */}
              {canEditCovers ? (
                <button
                  onClick={() => openCoverPicker(t.id)}
                  disabled={isUploading}
                  aria-label="Change cover"
                  className="relative h-12 w-12 flex-shrink-0 rounded-lg overflow-hidden group"
                >
                  {coverUrl ? (
                    <>
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img src={coverUrl} alt="" className="h-full w-full object-cover" />
                      <span className="absolute inset-0 flex items-center justify-center rounded-lg bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity text-white">
                        <CameraIcon />
                      </span>
                    </>
                  ) : (
                    <span className="flex h-full w-full items-center justify-center rounded-lg border border-dashed border-zinc-300 dark:border-zinc-700 text-zinc-400 hover:border-zinc-500 hover:text-zinc-500 transition-colors">
                      {isUploading ? (
                        <svg className="h-3.5 w-3.5 animate-spin" viewBox="0 0 24 24" fill="none">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
                        </svg>
                      ) : (
                        <CameraIcon />
                      )}
                    </span>
                  )}
                </button>
              ) : coverUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={coverUrl} alt="" className="h-12 w-12 flex-shrink-0 rounded-lg object-cover" />
              ) : null}

              <div className="flex flex-col gap-1 min-w-0 flex-1">
                <p className="text-sm font-medium line-clamp-2">{t.prompt}</p>
                <p className="text-xs text-zinc-500">
                  {[t.genre, t.mood].filter(Boolean).join(" · ")}
                  {t.genre || t.mood ? " · " : ""}
                  {new Date(t.created_at).toLocaleString()}
                </p>
              </div>

              {userId && (
                <button
                  onClick={() => toggleLike(t.id)}
                  aria-label={liked.has(t.id) ? "Unlike" : "Like"}
                  className="mt-0.5 flex-shrink-0 p-1 rounded-full hover:bg-zinc-100 dark:hover:bg-zinc-900 transition-colors"
                >
                  <HeartIcon filled={liked.has(t.id)} />
                </button>
              )}
            </div>
            {/* eslint-disable-next-line jsx-a11y/media-has-caption */}
            <audio controls src={t.audio_url} className="w-full" />
          </article>
        );
      })}
    </div>
  );
}
