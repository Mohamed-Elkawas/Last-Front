import { cn } from "@/lib/utils"

type AppLogoProps = {
  className?: string
  compact?: boolean
  showTagline?: boolean
}

export function AppLogo({ className, compact = false, showTagline = false }: AppLogoProps) {
  return (
    <div
      className={cn(
        "inline-flex items-center gap-3 align-middle select-none transition-transform duration-200 hover:scale-[1.01]",
        className,
      )}
      aria-label="HAGZAYA"
    >
      <div className="relative flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-primary shadow-sm ring-1 ring-primary/25">
        <svg
          viewBox="0 0 48 48"
          aria-hidden="true"
          className="h-7 w-7 text-primary-foreground"
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
        <div className="leading-none">
          <div className="text-[1.04rem] font-black uppercase tracking-[0.2em] text-primary">
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
