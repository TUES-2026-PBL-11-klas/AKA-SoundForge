import { Nav } from "@/components/nav";

export default function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <Nav />
      <main className="flex-1 bg-zinc-50 dark:bg-zinc-950">{children}</main>
    </>
  );
}
