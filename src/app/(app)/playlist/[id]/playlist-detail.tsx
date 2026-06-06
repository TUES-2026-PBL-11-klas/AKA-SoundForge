"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import type { TrackRow } from "@/components/tracks-list";

type Playlist = {
  id: string;
  name: string;
  cover_url: string | null;
  creator_id: string;
};

function MusicNoteIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" className="h-10 w-10 text-zinc-400">
      <path d="M9 3v10.55A4 4 0 1 0 11 17V7h4V3H9z" />
    </svg>
  );
}

function PlusIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="h-4 w-4">
      <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
    </svg>
  );
}

function TrashIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} className="h-4 w-4">
      <path strokeLinecap="round" strokeLinejoin="round" d="M3 6h18M8 6V4h8v2M19 6l-1 14H6L5 6" />
    </svg>
  );
}

export function PlaylistDetail({
  playlist,
  playlistTracks: initial,
  myTracks,
  isOwner,
}: {
  playlist: Playlist;
  playlistTracks: TrackRow[];
  myTracks: TrackRow[];
  isOwner: boolean;
}) {
  const supabase = createClient();
  const router = useRouter();

  const [tracks, setTracks] = useState<TrackRow[]>(initial);
  const [addOpen, setAddOpen] = useState(false);
  const [adding, setAdding] = useState<string | null>(null);
  const [removing, setRemoving] = useState<string | null>(null);

  const inPlaylistIds = new Set(tracks.map((t) => t.id));
  const available = myTracks.filter((t) => !inPlaylistIds.has(t.id));

  async function addTrack(track: TrackRow) {
    setAdding(track.id);
    const position = tracks.length;
    const { error } = await supabase
      .from("playlist_tracks")
      .insert({ playlist_id: playlist.id, track_id: track.id, position });
    if (!error) {
      setTracks((prev) => [...prev, track]);
    }
    setAdding(null);
  }

  async function removeTrack(trackId: string) {
    setRemoving(trackId);
    await supabase
      .from("playlist_tracks")
      .delete()
      .match({ playlist_id: playlist.id, track_id: trackId });
    setTracks((prev) => prev.filter((t) => t.id !== trackId));
    setRemoving(null);
  }

  return (
    <div className="mx-auto max-w-2xl px-6 py-10">
      {/* Back */}
      <Link
        href="/profile"
        className="mb-6 inline-flex items-center gap-1.5 text-xs text-zinc-500 hover:text-zinc-800 dark:hover:text-zinc-200"
      >
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="h-3.5 w-3.5">
          <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
        </svg>
        Back to profile
      </Link>

      {/* Header */}
      <div className="flex items-center gap-5 mb-8">
        <div className="h-24 w-24 flex-shrink-0 rounded-xl overflow-hidden bg-zinc-100 dark:bg-zinc-900 flex items-center justify-center">
          {playlist.cover_url ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={playlist.cover_url} alt={playlist.name} className="h-full w-full object-cover" />
          ) : (
            <MusicNoteIcon />
          )}
        </div>
        <div className="flex flex-col gap-1">
          <h1 className="text-xl font-semibold">{playlist.name}</h1>
          <p className="text-sm text-zinc-500">{tracks.length} {tracks.length === 1 ? "song" : "songs"}</p>
        </div>
      </div>

      {/* Add songs button */}
      {isOwner && (
        <div className="mb-6">
          <button
            onClick={() => setAddOpen((o) => !o)}
            className="flex items-center gap-2 rounded-full border border-zinc-300 dark:border-zinc-700 px-4 py-1.5 text-xs font-medium hover:bg-zinc-100 dark:hover:bg-zinc-900"
          >
            <PlusIcon />
            Add songs
          </button>
        </div>
      )}

      {/* Add songs picker */}
      {addOpen && (
        <div className="mb-6 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 overflow-hidden">
          <div className="px-4 py-3 border-b border-zinc-100 dark:border-zinc-800 flex items-center justify-between">
            <p className="text-xs font-medium text-zinc-500">Your tracks</p>
            <button
              onClick={() => setAddOpen(false)}
              className="text-xs text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-200"
            >
              Close
            </button>
          </div>
          {available.length === 0 ? (
            <p className="px-4 py-8 text-center text-xs text-zinc-400">
              All your tracks are already in this playlist.
            </p>
          ) : (
            <ul className="divide-y divide-zinc-100 dark:divide-zinc-800">
              {available.map((t) => (
                <li key={t.id} className="flex items-center gap-3 px-4 py-3">
                  {t.cover_url && (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={t.cover_url} alt="" className="h-9 w-9 flex-shrink-0 rounded-md object-cover" />
                  )}
                  <div className="min-w-0 flex-1">
                    <p className="text-xs font-medium line-clamp-1">{t.prompt}</p>
                    <p className="text-[10px] text-zinc-400">{[t.genre, t.mood].filter(Boolean).join(" · ")}</p>
                  </div>
                  <button
                    onClick={() => addTrack(t)}
                    disabled={adding === t.id}
                    className="flex-shrink-0 flex items-center gap-1 rounded-full bg-zinc-900 dark:bg-zinc-100 px-3 py-1 text-[10px] font-medium text-zinc-100 dark:text-zinc-900 disabled:opacity-50"
                  >
                    {adding === t.id ? "Adding…" : <><PlusIcon /> Add</>}
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>
      )}

      {/* Track list */}
      {tracks.length === 0 ? (
        <div className="rounded-xl border border-dashed border-zinc-300 dark:border-zinc-700 flex flex-col items-center justify-center gap-2 py-16 text-center">
          <MusicNoteIcon />
          <p className="text-sm font-medium text-zinc-700 dark:text-zinc-300">No songs yet</p>
          {isOwner && (
            <p className="text-xs text-zinc-500">Hit &ldquo;Add songs&rdquo; to fill this playlist.</p>
          )}
        </div>
      ) : (
        <div className="flex flex-col">
          {tracks.map((t, i) => (
            <article
              key={t.id}
              className={`flex flex-col gap-3 py-5 ${i > 0 ? "border-t border-zinc-200 dark:border-zinc-800" : ""}`}
            >
              <div className="flex items-start gap-3">
                {t.cover_url && (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={t.cover_url} alt="" className="h-12 w-12 flex-shrink-0 rounded-lg object-cover" />
                )}
                <div className="min-w-0 flex flex-col gap-0.5 flex-1">
                  <p className="text-sm font-medium line-clamp-2">{t.prompt}</p>
                  <p className="text-xs text-zinc-500">
                    {[t.genre, t.mood].filter(Boolean).join(" · ")}
                  </p>
                </div>
                {isOwner && (
                  <button
                    onClick={() => removeTrack(t.id)}
                    disabled={removing === t.id}
                    aria-label="Remove from playlist"
                    className="mt-0.5 flex-shrink-0 p-1.5 rounded-full text-zinc-400 hover:text-red-500 hover:bg-zinc-100 dark:hover:bg-zinc-900 transition-colors disabled:opacity-40"
                  >
                    <TrashIcon />
                  </button>
                )}
              </div>
              {/* eslint-disable-next-line jsx-a11y/media-has-caption */}
              <audio controls src={t.audio_url} className="w-full" />
            </article>
          ))}
        </div>
      )}
    </div>
  );
}
