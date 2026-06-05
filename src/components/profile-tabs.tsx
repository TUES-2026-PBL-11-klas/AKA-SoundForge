"use client";

import { useState } from "react";
import { EmptyState } from "@/components/empty-state";
import { TracksList, type TrackRow } from "@/components/tracks-list";

const TABS = [
  { id: "tracks", label: "Tracks", emptyTitle: "No tracks yet", emptyDesc: "Create your first track from the Create page." },
  { id: "remixes", label: "Remixes", emptyTitle: "No remixes yet", emptyDesc: "Remixes you make will show up here." },
  { id: "liked", label: "Liked", emptyTitle: "Nothing liked yet", emptyDesc: "Tracks you like will show up here." },
  { id: "playlists", label: "Playlists", emptyTitle: "No playlists yet", emptyDesc: "Your playlists will show up here." },
] as const;

export function ProfileTabs({ tracks = [] }: { tracks?: TrackRow[] }) {
  const [active, setActive] = useState<(typeof TABS)[number]["id"]>("tracks");
  const current = TABS.find((t) => t.id === active)!;

  const body =
    active === "tracks" && tracks.length > 0 ? (
      <TracksList tracks={tracks} />
    ) : (
      <EmptyState title={current.emptyTitle} description={current.emptyDesc} />
    );

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
