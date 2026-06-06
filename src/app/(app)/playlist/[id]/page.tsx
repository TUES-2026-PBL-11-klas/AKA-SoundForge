import { notFound, redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { PlaylistDetail } from "./playlist-detail";

export default async function PlaylistPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: playlist } = await supabase
    .from("playlists")
    .select("id, name, cover_url, creator_id, created_at")
    .eq("id", id)
    .maybeSingle();

  if (!playlist) notFound();

  type PlaylistTrack = {
    id: string;
    prompt: string;
    genre: string | null;
    mood: string | null;
    audio_url: string;
    cover_url: string | null;
    created_at: string;
  };

  // tracks already in this playlist
  const { data: playlistTrackRows } = await supabase
    .from("playlist_tracks")
    .select("position, track:tracks(id, prompt, genre, mood, audio_url, cover_url, created_at)")
    .eq("playlist_id", id)
    .order("position", { ascending: true });

  const playlistTracks: PlaylistTrack[] = (playlistTrackRows ?? [])
    .map((r) => r.track as unknown as PlaylistTrack | null)
    .filter((t): t is PlaylistTrack => t != null);

  // user's own tracks (to pick from when adding)
  const { data: myTracks } = await supabase
    .from("tracks")
    .select("id, prompt, genre, mood, audio_url, cover_url, created_at")
    .eq("creator_id", user.id)
    .order("created_at", { ascending: false });

  const isOwner = playlist.creator_id === user.id;

  return (
    <PlaylistDetail
      playlist={playlist}
      playlistTracks={playlistTracks}
      myTracks={myTracks ?? []}
      isOwner={isOwner}
    />
  );
}
