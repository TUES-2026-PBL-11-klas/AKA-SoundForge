"use client";

import { useState } from "react";
import { EmptyState } from "@/components/empty-state";
import { TracksList, type TrackRow } from "@/components/tracks-list";
import { PlaylistsPanel, type PlaylistRow } from "@/components/playlists-panel";

const TABS = [
  { id: "tracks",    label: "Tracks" },
  { id: "remixes",   label: "Remixes" },
  { id: "liked",     label: "Liked" },
  { id: "playlists", label: "Playlists" },
] as const;

type TabId = (typeof TABS)[number]["id"];

export function ProfileTabs({
  tracks = [],
  likedTracks = [],
  likedIds = [],
  playlists = [],
  userId,
}: {
  tracks?: TrackRow[];
  likedTracks?: TrackRow[];
  likedIds?: string[];
  playlists?: PlaylistRow[];
  userId?: string;
}) {
  const [active, setActive] = useState<TabId>("tracks");

  let body: React.ReactNode;

  if (active === "tracks") {
    body =
      tracks.length > 0 ? (
        <TracksList tracks={tracks} likedIds={likedIds} userId={userId} canEditCovers />
      ) : (
        <EmptyState title="No tracks yet" description="Create your first track from the Create page." />
      );
  } else if (active === "liked") {
    body =
      likedTracks.length > 0 ? (
        <TracksList tracks={likedTracks} likedIds={likedIds} userId={userId} />
      ) : (
        <EmptyState title="Nothing liked yet" description="Tracks you like will show up here." />
      );
  } else if (active === "playlists") {
    body = <PlaylistsPanel playlists={playlists} userId={userId ?? ""} />;
  } else {
    body = <EmptyState title="No remixes yet" description="Remixes you make will show up here." />;
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="flex gap-1 border-b border-zinc-200 dark:border-zinc-800">
        {TABS.map((t) => (
          <button
            key={t.id}
            onClick={() => setActive(t.id)}
            className={`px-3 py-2 text-xs font-medium -mb-px border-b-2 transition ${
              active === t.id
                ? "border-zinc-900 dark:border-zinc-100 text-zinc-900 dark:text-zinc-100"
                : "border-transparent text-zinc-500 hover:text-zinc-700 dark:hover:text-zinc-300"
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {body}
    </div>
  );
}
