"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

export type PlaylistRow = {
  id: string;
  name: string;
  cover_url: string | null;
  created_at: string;
};

function MusicNoteIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" className="h-8 w-8 text-zinc-500">
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

export function PlaylistsPanel({
  playlists: initial,
  userId,
}: {
  playlists: PlaylistRow[];
  userId: string;
}) {
  const supabase = createClient();
  const router = useRouter();

  const [playlists, setPlaylists] = useState<PlaylistRow[]>(initial);
  const [creating, setCreating] = useState(false);
  const [name, setName] = useState("");
  const [coverFile, setCoverFile] = useState<File | null>(null);
  const [coverPreview, setCoverPreview] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function handleCoverChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setCoverFile(file);
    setCoverPreview(URL.createObjectURL(file));
  }

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim()) return;
    setUploading(true);
    setError(null);

    let cover_url: string | null = null;

    if (coverFile) {
      const ext = coverFile.name.split(".").pop();
      const path = `${userId}/playlist-cover-${Date.now()}.${ext}`;
      const { error: uploadErr } = await supabase.storage
        .from("avatars")
        .upload(path, coverFile, { upsert: true });

      if (uploadErr) {
        setError(uploadErr.message);
        setUploading(false);
        return;
      }
      cover_url = supabase.storage.from("avatars").getPublicUrl(path).data.publicUrl;
    }

    const { data, error: insertErr } = await supabase
      .from("playlists")
      .insert({ creator_id: userId, name: name.trim(), cover_url })
      .select("id, name, cover_url, created_at")
      .single();

    setUploading(false);
    if (insertErr || !data) {
      setError(insertErr?.message ?? "Failed to create playlist");
      return;
    }

    setPlaylists((prev) => [data, ...prev]);
    setCreating(false);
    setName("");
    setCoverFile(null);
    setCoverPreview(null);
    router.refresh();
  }

  function cancelCreate() {
    setCreating(false);
    setName("");
    setCoverFile(null);
    setCoverPreview(null);
    setError(null);
  }

  return (
    <div className="flex flex-col gap-4">
      {/* Create playlist form */}
      {creating ? (
        <form
          onSubmit={handleCreate}
          className="rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 p-5 flex flex-col gap-4"
        >
          <p className="text-sm font-medium">New playlist</p>

          {/* Cover upload */}
          <div className="flex items-center gap-4">
            <div className="h-16 w-16 flex-shrink-0 rounded-lg overflow-hidden bg-zinc-100 dark:bg-zinc-900 flex items-center justify-center">
              {coverPreview ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={coverPreview} alt="" className="h-full w-full object-cover" />
              ) : (
                <MusicNoteIcon />
              )}
            </div>
            <div className="flex flex-col gap-1">
              <span className="text-xs text-zinc-500">Cover image</span>
              <input
                type="file"
                accept="image/*"
                onChange={handleCoverChange}
                className="text-xs"
              />
            </div>
          </div>

          {/* Name */}
          <label className="flex flex-col gap-1">
            <span className="text-xs text-zinc-500">Playlist name</span>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="My playlist"
              maxLength={80}
              required
              className="rounded-md border border-zinc-300 dark:border-zinc-700 bg-transparent px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-zinc-900 dark:focus:ring-zinc-100"
            />
          </label>

          {error && <p className="text-xs text-red-600">{error}</p>}

          <div className="flex justify-end gap-2">
            <button
              type="button"
              onClick={cancelCreate}
              className="rounded-full px-4 py-1.5 text-xs font-medium text-zinc-600 dark:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-900"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={uploading || !name.trim()}
              className="rounded-full bg-foreground px-4 py-1.5 text-xs font-medium text-background disabled:opacity-50"
            >
              {uploading ? "Creating…" : "Create"}
            </button>
          </div>
        </form>
      ) : (
        <button
          onClick={() => setCreating(true)}
          className="flex items-center gap-2 self-start rounded-full border border-zinc-300 dark:border-zinc-700 px-4 py-1.5 text-xs font-medium hover:bg-zinc-100 dark:hover:bg-zinc-900"
        >
          <PlusIcon />
          New playlist
        </button>
      )}

      {/* Playlist grid */}
      {playlists.length === 0 && !creating ? (
        <div className="rounded-xl border border-dashed border-zinc-300 dark:border-zinc-700 flex flex-col items-center justify-center gap-2 py-16 text-center">
          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-zinc-100 dark:bg-zinc-900">
            <MusicNoteIcon />
          </div>
          <p className="text-sm font-medium text-zinc-700 dark:text-zinc-300">No playlists yet</p>
          <p className="text-xs text-zinc-500">Your playlists will show up here.</p>
        </div>
      ) : (
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
          {playlists.map((pl) => (
            <Link
              key={pl.id}
              href={`/playlist/${pl.id}`}
              className="flex flex-col gap-2 rounded-xl border border-zinc-200 dark:border-zinc-800 overflow-hidden bg-white dark:bg-zinc-950 hover:border-zinc-400 dark:hover:border-zinc-600 transition-colors"
            >
              <div className="aspect-square w-full bg-zinc-100 dark:bg-zinc-900 flex items-center justify-center overflow-hidden">
                {pl.cover_url ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={pl.cover_url} alt={pl.name} className="h-full w-full object-cover" />
                ) : (
                  <MusicNoteIcon />
                )}
              </div>
              <div className="px-3 pb-3">
                <p className="text-xs font-medium line-clamp-2">{pl.name}</p>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
