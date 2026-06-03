import Link from "next/link";
import { createClient } from "@/lib/supabase/server";

export async function Nav() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  let avatarUrl: string | null = null;
  let initial = "?";
  if (user) {
    const { data: profile } = await supabase
      .from("profiles")
      .select("avatar_url, username")
      .eq("id", user.id)
      .maybeSingle();
    avatarUrl = profile?.avatar_url ?? null;
    initial = (profile?.username ?? user.email ?? "?")[0]?.toUpperCase() ?? "?";
  }

  return (
    <header className="sticky top-0 z-40 w-full border-b border-zinc-200 dark:border-zinc-800 bg-white/80 dark:bg-zinc-950/80 backdrop-blur">
      <nav className="mx-auto flex h-14 max-w-5xl items-center justify-between px-4">
        <Link href="/" className="text-sm font-semibold tracking-tight">
          SoundForge
        </Link>

        {user ? (
          <div className="flex items-center gap-1">
            <NavLink href="/" label="Home">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
                <path d="M3 11l9-8 9 8" />
                <path d="M5 10v10h14V10" />
              </svg>
            </NavLink>
            <NavLink href="/create" label="Create">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
                <path d="M12 5v14" />
                <path d="M5 12h14" />
              </svg>
            </NavLink>
            <Link
              href="/profile"
              className="ml-2 flex items-center gap-2 rounded-full px-2 py-1 text-xs hover:bg-zinc-100 dark:hover:bg-zinc-900"
            >
              {avatarUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={avatarUrl} alt="" className="h-7 w-7 rounded-full object-cover" />
              ) : (
                <span className="flex h-7 w-7 items-center justify-center rounded-full bg-zinc-200 dark:bg-zinc-800 text-xs font-medium text-zinc-700 dark:text-zinc-300">
                  {initial}
                </span>
              )}
            </Link>
          </div>
        ) : (
          <Link
            href="/login"
            className="rounded-full bg-foreground px-4 py-1.5 text-xs font-medium text-background"
          >
            Sign in
          </Link>
        )}
      </nav>
    </header>
  );
}

function NavLink({
  href,
  label,
  children,
}: {
  href: string;
  label: string;
  children: React.ReactNode;
}) {
  return (
    <Link
      href={href}
      className="flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-medium text-zinc-700 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-900"
    >
      {children}
      <span>{label}</span>
    </Link>
  );
}
