import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { FeedContainer } from "@/components/feed-container";
import type { FeedTrack } from "@/app/api/feed/route";

export default async function HomePage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return (
      <div className="mx-auto flex max-w-2xl flex-col items-center justify-center px-6 py-32 text-center">
        <h1 className="text-3xl font-semibold tracking-tight">SoundForge</h1>
        <p className="mt-3 text-sm text-zinc-500 dark:text-zinc-400 max-w-md">
          AI-generated music, social. Create tracks from a prompt, share them, remix others.
        </p>
        <Link
          href="/login"
          className="mt-8 rounded-full bg-foreground px-5 py-2 text-sm font-medium text-background"
        >
          Sign in
        </Link>
      </div>
    );
  }

  // fetch first page of feed directly (no extra HTTP round-trip)
  const { data: rawTracks } = await supabase
    .from("tracks")
    .select(
      `id, prompt, genre, mood, audio_url, cover_url, duration_seconds,
       like_count, comment_count, created_at,
       creator:profiles!tracks_creator_id_fkey(id, username, display_name, avatar_url)`
    )
    .eq("is_published", true)
    .order("created_at", { ascending: false })
    .limit(10);

  // resolve viewer likes
  let likedIds = new Set<string>();
  if (rawTracks && rawTracks.length > 0) {
    const ids = rawTracks.map((t) => t.id);
    const { data: likes } = await supabase
      .from("likes")
      .select("track_id")
      .eq("user_id", user.id)
      .in("track_id", ids);
    if (likes) likedIds = new Set(likes.map((l) => l.track_id));
  }

  const tracks: FeedTrack[] = (rawTracks ?? []).map((t) => ({
    id: t.id,
    prompt: t.prompt,
    genre: t.genre,
    mood: t.mood,
    audio_url: t.audio_url,
    cover_url: t.cover_url ?? null,
    duration_seconds: t.duration_seconds,
    like_count: t.like_count ?? 0,
    comment_count: t.comment_count ?? 0,
    created_at: t.created_at,
    viewer_has_liked: likedIds.has(t.id),
    creator: Array.isArray(t.creator) ? t.creator[0] : t.creator,
  }));

  return <FeedContainer initial={tracks} />;
}
