import { cn } from "@/lib/utils"

type AppLogoProps = {
  className?: string
  compact?: boolean
  showTagline?: boolean
}

export function AppLogo({
  className,
  compact = false,
  showTagline = false,
}: AppLogoProps) {
  return (
    <div
      className={cn(
        "inline-flex min-w-0 items-center gap-2 align-middle select-none transition-transform duration-200 hover:scale-[1.01] sm:gap-3",
        className,
      )}
      aria-label="HAGZAYA"
    >
      <div className="relative flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-primary shadow-sm ring-1 ring-primary/25 sm:h-11 sm:w-11">
        <svg
          viewBox="0 0 48 48"
          aria-hidden="true"
          className="h-6 w-6 text-primary-foreground sm:h-7 sm:w-7"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
        >
          <rect x="8" y="9" width="32" height="30" rx="6" stroke="currentColor" strokeWidth="2.4" />
          <path d="M24 9V39" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" />
          <path d="M8 24H40" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" />
          <circle cx="24" cy="24" r="4.6" stroke="currentColor" strokeWidth="2.4" />
          <path d="M24 4L28.6 8.8L24 13.6L19.4 8.8L24 4Z" fill="#B6F09C" />
        </svg>
      </div>

      {!compact && (
        <div className="min-w-0 leading-none">
          <div className="max-w-[7.5rem] truncate text-[0.9rem] font-black uppercase tracking-[0.14em] text-primary sm:max-w-none sm:text-[1.04rem] sm:tracking-[0.2em]">
            HAGZAYA
          </div>

          {showTagline && (
            <div className="mt-1 hidden text-[0.67rem] font-semibold uppercase tracking-[0.18em] text-muted-foreground sm:block">
              Football Booking
            </div>
          )}
        </div>
      )}
    </div>
  )
}