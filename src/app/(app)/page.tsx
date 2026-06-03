import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { EmptyState } from "@/components/empty-state";

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

  return (
    <div className="mx-auto max-w-2xl px-6 py-16">
      <EmptyState
        title="Your feed is empty"
        description="Follow people or create a track to see something here."
        action={
          <Link
            href="/create"
            className="rounded-full bg-foreground px-4 py-2 text-xs font-medium text-background"
          >
            Create a track
          </Link>
        }
      />
    </div>
  );
}
