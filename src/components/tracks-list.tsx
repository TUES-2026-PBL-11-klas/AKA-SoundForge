export type TrackRow = {
  id: string;
  prompt: string;
  genre: string | null;
  mood: string | null;
  audio_url: string;
  created_at: string;
};

export function TracksList({ tracks }: { tracks: TrackRow[] }) {
  return (
    <div className="flex flex-col">
      {tracks.map((t, i) => (
        <article
          key={t.id}
          className={`flex flex-col gap-3 py-5 ${
            i > 0 ? "border-t border-zinc-200 dark:border-zinc-800" : ""
          }`}
        >
          <div className="flex flex-col gap-1">
            <p className="text-sm font-medium line-clamp-2">{t.prompt}</p>
            <p className="text-xs text-zinc-500">
              {[t.genre, t.mood].filter(Boolean).join(" · ")}
              {t.genre || t.mood ? " · " : ""}
              {new Date(t.created_at).toLocaleString()}
            </p>
          </div>
          {/* eslint-disable-next-line jsx-a11y/media-has-caption */}
          <audio controls src={t.audio_url} className="w-full" />
        </article>
      ))}
    </div>
  );
}
