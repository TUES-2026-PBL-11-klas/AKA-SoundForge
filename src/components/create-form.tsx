"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

const GENRES = [
  "Lo-fi",
  "House",
  "Ambient",
  "Hip-Hop",
  "Trap",
  "Jazz",
  "Classical",
  "EDM",
  "Rock",
  "Pop",
];

const MOODS = ["Chill", "Energetic", "Dark", "Happy", "Sad", "Dreamy"];

const DURATIONS = [
  { value: 20, label: "20s" },
  { value: 30, label: "30s" },
  { value: 45, label: "45s" },
  { value: 60, label: "1m" },
];

export function CreateForm() {
  const router = useRouter();
  const [prompt, setPrompt] = useState("");
  const [genre, setGenre] = useState("");
  const [genreOther, setGenreOther] = useState("");
  const [moods, setMoods] = useState<string[]>([]);
  const [hasVocals, setHasVocals] = useState(false);
  const [durationSeconds, setDurationSeconds] = useState<number>(60);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function toggleMood(m: string) {
    setMoods((cur) => (cur.includes(m) ? cur.filter((x) => x !== m) : [...cur, m]));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    if (!prompt.trim()) return setError("Enter a prompt.");
    setLoading(true);

    const finalGenre = genre === "Other" ? genreOther.trim() : genre;

    try {
      const res = await fetch("/api/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          prompt: prompt.trim(),
          genre: finalGenre || null,
          mood: moods.join(", ") || null,
          hasVocals,
          durationSeconds,
        }),
      });

      if (!res.ok) {
        const { error } = await res.json().catch(() => ({ error: "request failed" }));
        setLoading(false);
        return setError(error || `request failed (${res.status})`);
      }

      router.push("/profile");
      router.refresh();
    } catch (err) {
      setLoading(false);
      setError((err as Error).message);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-5">
      <div>
        <h1 className="text-xl font-semibold">Create a track</h1>
        <p className="text-xs text-zinc-500 mt-1">
          AI-generated audio from a text prompt.
        </p>
      </div>

      <label className="flex flex-col gap-1">
        <div className="flex justify-between">
          <span className="text-xs text-zinc-600 dark:text-zinc-400">Prompt</span>
          <span
            className={`text-[10px] ${
              prompt.length > 500 ? "text-red-600" : "text-zinc-400"
            }`}
          >
            {prompt.length}/500
          </span>
        </div>
        <textarea
          value={prompt}
          onChange={(e) => setPrompt(e.target.value)}
          maxLength={500}
          rows={3}
          placeholder="lo-fi study beat with mellow piano"
          className="rounded-md border border-zinc-300 dark:border-zinc-700 bg-transparent px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-zinc-900 dark:focus:ring-zinc-100 resize-none"
        />
      </label>

      <div className="flex flex-col gap-1">
        <span className="text-xs text-zinc-600 dark:text-zinc-400">Genre</span>
        <select
          value={genre}
          onChange={(e) => setGenre(e.target.value)}
          className="rounded-md border border-zinc-300 dark:border-zinc-700 bg-transparent px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-zinc-900 dark:focus:ring-zinc-100"
        >
          <option value="">— none —</option>
          {GENRES.map((g) => (
            <option key={g} value={g}>
              {g}
            </option>
          ))}
          <option value="Other">Other…</option>
        </select>
        {genre === "Other" && (
          <input
            type="text"
            value={genreOther}
            onChange={(e) => setGenreOther(e.target.value)}
            placeholder="Custom genre"
            className="mt-1 rounded-md border border-zinc-300 dark:border-zinc-700 bg-transparent px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-zinc-900 dark:focus:ring-zinc-100"
          />
        )}
      </div>

      <div className="flex flex-col gap-2">
        <span className="text-xs text-zinc-600 dark:text-zinc-400">Mood</span>
        <div className="flex flex-wrap gap-2">
          {MOODS.map((m) => {
            const active = moods.includes(m);
            return (
              <button
                key={m}
                type="button"
                onClick={() => toggleMood(m)}
                className={`rounded-full border px-3 py-1 text-xs ${
                  active
                    ? "border-zinc-900 bg-zinc-900 text-white dark:border-zinc-100 dark:bg-zinc-100 dark:text-zinc-900"
                    : "border-zinc-300 dark:border-zinc-700 text-zinc-700 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-900"
                }`}
              >
                {m}
              </button>
            );
          })}
        </div>
      </div>

      <div className="flex flex-col gap-2">
        <span className="text-xs text-zinc-600 dark:text-zinc-400">Length</span>
        <div className="flex gap-2">
          {DURATIONS.map((d) => (
            <button
              key={d.value}
              type="button"
              onClick={() => setDurationSeconds(d.value)}
              className={`flex-1 rounded-md border px-3 py-2 text-xs ${
                durationSeconds === d.value
                  ? "border-zinc-900 bg-zinc-900 text-white dark:border-zinc-100 dark:bg-zinc-100 dark:text-zinc-900"
                  : "border-zinc-300 dark:border-zinc-700 text-zinc-700 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-900"
              }`}
            >
              {d.label}
            </button>
          ))}
        </div>
      </div>

      <label className="flex items-center justify-between rounded-md border border-zinc-200 dark:border-zinc-800 px-3 py-2">
        <span className="text-sm">Vocals</span>
        <input
          type="checkbox"
          checked={hasVocals}
          onChange={(e) => setHasVocals(e.target.checked)}
          className="h-4 w-4"
        />
      </label>

      {error && <div className="text-xs text-red-600">{error}</div>}

      <button
        type="submit"
        disabled={loading || !prompt.trim()}
        className="h-10 rounded-full bg-foreground text-background text-sm font-medium disabled:opacity-50"
      >
        {loading ? `Generating… ~${durationSeconds + 5}s` : "Generate"}
      </button>
    </form>
  );
}
