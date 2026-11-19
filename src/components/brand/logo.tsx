import { cn } from "@/lib/utils/cn";

/** Lumora Studio mark: a prism-like spark built from three overlapping petals. */
export function LogoMark({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 40 40" className={cn("h-8 w-8", className)} aria-hidden="true">
      <defs>
        <linearGradient id="lm-a" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="#7444ff" />
          <stop offset="1" stopColor="#b14dff" />
        </linearGradient>
        <linearGradient id="lm-b" x1="0" y1="1" x2="1" y2="0">
          <stop offset="0" stopColor="#ff6b5a" />
          <stop offset="1" stopColor="#ff9f6b" />
        </linearGradient>
      </defs>
      <rect width="40" height="40" rx="11" fill="url(#lm-a)" />
      <path d="M20 7c2.6 5.8 7.2 10.4 13 13-5.8 2.6-10.4 7.2-13 13-2.6-5.8-7.2-10.4-13-13 5.8-2.6 10.4-7.2 13-13Z" fill="#fff" />
      <circle cx="29.5" cy="10.5" r="3.5" fill="url(#lm-b)" />
    </svg>
  );
}

export function Logo({ className, compact }: { className?: string; compact?: boolean }) {
  return (
    <span className={cn("inline-flex items-center gap-2", className)}>
      <LogoMark />
      {!compact && (
        <span className="font-display text-[17px] font-bold tracking-tight">
          Lumora<span className="text-gradient"> Studio</span>
        </span>
      )}
    </span>
  );
}
