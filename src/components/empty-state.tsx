import type { ReactNode } from "react";

export function EmptyState({
  title,
  description,
  action,
}: {
  title: string;
  description?: string;
  action?: ReactNode;
}) {
  return (
    <div className="flex flex-col items-center justify-center gap-3 rounded-lg border border-dashed border-zinc-300 dark:border-zinc-700 px-6 py-16 text-center">
      <div className="flex h-10 w-10 items-center justify-center rounded-full bg-zinc-100 dark:bg-zinc-900 text-zinc-400">
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
          <circle cx="12" cy="12" r="9" />
          <path d="M12 8v4" />
          <path d="M12 16h.01" />
        </svg>
      </div>
      <div className="text-sm font-medium text-zinc-900 dark:text-zinc-100">{title}</div>
      {description && (
        <div className="text-xs text-zinc-500 dark:text-zinc-400 max-w-xs">{description}</div>
      )}
      {action && <div className="mt-2">{action}</div>}
    </div>
  );
}
