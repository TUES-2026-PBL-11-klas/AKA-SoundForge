import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export type FeedTrack = {
  id: string;
  prompt: string;
  genre: string | null;
  mood: string | null;
  audio_url: string;
  duration_seconds: number;
  like_count: number;
  comment_count: number;
  created_at: string;
  viewer_has_liked: boolean;
  creator: {
    id: string;
    username: string;
    display_name: string | null;
    avatar_url: string | null;
  };
};

export async function GET(req: NextRequest) {
  const supabase = await createClient();
  const { searchParams } = new URL(req.url);
  const cursor = searchParams.get("cursor");
  const limit = 10;

  const {
    data: { user },
  } = await supabase.auth.getUser();

  let query = supabase
    .from("tracks")
    .select(
      `id, prompt, genre, mood, audio_url, duration_seconds,
       like_count, comment_count, created_at,
       creator:profiles!tracks_creator_id_fkey(id, username, display_name, avatar_url)`
    )
    .eq("is_published", true)
    .order("created_at", { ascending: false })
    .limit(limit);

  if (cursor) {
    query = query.lt("created_at", cursor);
  }

  const { data: tracks, error } = await query;

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  // resolve which tracks the current viewer has liked
  let likedIds = new Set<string>();
  if (user && tracks && tracks.length > 0) {
    const ids = tracks.map((t) => t.id);
    const { data: likes } = await supabase
      .from("likes")
      .select("track_id")
      .eq("user_id", user.id)
      .in("track_id", ids);
    if (likes) likedIds = new Set(likes.map((l) => l.track_id));
  }

  const feed: FeedTrack[] = (tracks ?? []).map((t) => ({
    id: t.id,
    prompt: t.prompt,
    genre: t.genre,
    mood: t.mood,
    audio_url: t.audio_url,
    duration_seconds: t.duration_seconds,
    like_count: t.like_count ?? 0,
    comment_count: t.comment_count ?? 0,
    created_at: t.created_at,
    viewer_has_liked: likedIds.has(t.id),
    creator: Array.isArray(t.creator) ? t.creator[0] : t.creator,
  }));

  return NextResponse.json(feed);
}
