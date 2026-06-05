import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { TracksList } from "@/components/tracks-list";

export default async function PublicProfilePage({
  params,
}: {
  params: Promise<{ username: string }>;
}) {
  const { username } = await params;
  const supabase = await createClient();

  const { data: profile } = await supabase
    .from("profiles")
    .select("id, username, display_name, bio, avatar_url")
    .eq("username", username)
    .maybeSingle();

  if (!profile) notFound();

  const { data: tracks } = await supabase
    .from("tracks")
    .select("id, prompt, genre, mood, audio_url, created_at")
    .eq("creator_id", profile.id)
    .eq("is_published", true)
    .order("created_at", { ascending: false });

  const initial = (profile.display_name ?? profile.username)[0]?.toUpperCase() ?? "?";

  return (
    <div className="mx-auto max-w-3xl px-6 py-12">
      {/* Header */}
      <div className="flex items-start gap-5">
        {profile.avatar_url ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={profile.avatar_url}
            alt={profile.username}
            className="h-24 w-24 rounded-full object-cover border border-zinc-200 dark:border-zinc-800"
          />
        ) : (
          <div className="flex h-24 w-24 items-center justify-center rounded-full bg-zinc-200 dark:bg-zinc-800 text-2xl font-medium text-zinc-700 dark:text-zinc-300">
            {initial}
          </div>
        )}

        <div className="flex-1 flex flex-col gap-1 pt-1">
          <h1 className="text-xl font-semibold">
            {profile.display_name || profile.username}
          </h1>
          <span className="text-sm text-zinc-500">@{profile.username}</span>
        </div>
      </div>

      {/* Stats */}
      <div className="mt-8 flex gap-8 text-sm">
        <Stat label="tracks" value={tracks?.length ?? 0} />
      </div>

      {/* Bio */}
      {profile.bio && (
        <p className="mt-4 text-sm text-zinc-700 dark:text-zinc-300 whitespace-pre-line">
          {profile.bio}
        </p>
      )}

      {/* Tracks */}
      <div className="mt-10">
        <h2 className="mb-4 text-sm font-semibold text-zinc-500 uppercase tracking-wider">
          Tracks
        </h2>
        {tracks && tracks.length > 0 ? (
          <TracksList tracks={tracks} />
        ) : (
          <p className="text-sm text-zinc-400">No published tracks yet.</p>
        )}
      </div>
    </div>
  );
}

function Stat({ label, value }: { label: string; value: number }) {
  return (
    <div className="flex items-baseline gap-1.5">
      <span className="text-base font-semibold">{value}</span>
      <span className="text-xs text-zinc-500">{label}</span>
    </div>
  );
}
