import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { ProfileEditor } from "@/components/profile-editor";
import { ProfileTabs } from "@/components/profile-tabs";
import { SignOutButton } from "@/components/sign-out-button";

export default async function ProfilePage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  const { data: profile } = await supabase
    .from("profiles")
    .select("id, username, display_name, bio, avatar_url")
    .eq("id", user.id)
    .maybeSingle();

  const { data: tracks } = await supabase
    .from("tracks")
    .select("id, prompt, genre, mood, audio_url, cover_url, created_at")
    .eq("creator_id", user.id)
    .order("created_at", { ascending: false });

  const { data: likedRows } = await supabase
    .from("likes")
    .select("track:tracks(id, prompt, genre, mood, audio_url, cover_url, created_at)")
    .eq("user_id", user.id)
    .order("created_at", { ascending: false });

  const likedTracks = (likedRows ?? [])
    .map((r) => r.track)
    .filter((t): t is NonNullable<typeof t> => t != null)
    .map((t) => ({ ...t, created_at: t.created_at ?? "" }));

  const likedIds = likedTracks.map((t) => t.id);

  const { data: playlists } = await supabase
    .from("playlists")
    .select("id, name, cover_url, created_at")
    .eq("creator_id", user.id)
    .order("created_at", { ascending: false });

  if (!profile) {
    return (
      <div className="mx-auto max-w-3xl px-6 py-16 text-sm text-zinc-500">
        Profile not found. Run the SQL schema in your Supabase project.
      </div>
    );
  }

  const initial = (profile.username ?? user.email ?? "?")[0]?.toUpperCase() ?? "?";

  return (
    <div className="mx-auto max-w-3xl px-6 py-12">
      {/* Header */}
      <div className="flex items-start gap-5">
        {profile.avatar_url ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={profile.avatar_url}
            alt=""
            className="h-24 w-24 rounded-full object-cover border border-zinc-200 dark:border-zinc-800"
          />
        ) : (
          <div className="flex h-24 w-24 items-center justify-center rounded-full bg-zinc-200 dark:bg-zinc-800 text-2xl font-medium text-zinc-700 dark:text-zinc-300">
            {initial}
          </div>
        )}

        <div className="flex-1 flex flex-col gap-1">
          <h1 className="text-xl font-semibold">
            {profile.display_name || profile.username}
          </h1>
          <span className="text-sm text-zinc-500">@{profile.username}</span>
        </div>

        <div className="flex items-center gap-2">
          <ProfileEditor profile={profile} />
          <SignOutButton />
        </div>
      </div>

      {/* Stats */}
      <div className="mt-8 flex gap-8 text-sm">
        <Stat label="tracks" value={tracks?.length ?? 0} />
        <Stat label="liked" value={likedTracks.length} />
        <Stat label="playlists" value={playlists?.length ?? 0} />
      </div>

      {/* Bio */}
      <p className="mt-6 text-sm text-zinc-700 dark:text-zinc-300 whitespace-pre-line">
        {profile.bio || (
          <span className="text-zinc-400 italic">No bio yet.</span>
        )}
      </p>

      {/* Tabs */}
      <div className="mt-10">
        <ProfileTabs
          tracks={tracks ?? []}
          likedTracks={likedTracks}
          likedIds={likedIds}
          playlists={playlists ?? []}
          userId={user.id}
        />
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
