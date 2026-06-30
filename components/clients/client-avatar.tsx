import { cn } from "@/lib/utils"

const SIZES = {
  sm: "size-10 text-sm rounded-xl",
  md: "size-12 text-base rounded-2xl",
  lg: "size-14 text-lg rounded-2xl",
} as const

export function ClientAvatar({
  name,
  logoUrl,
  size = "md",
  className,
}: {
  name: string
  logoUrl: string | null
  size?: keyof typeof SIZES
  className?: string
}) {
  const initials =
    name
      .split(" ")
      .slice(0, 2)
      .map((w) => w[0]?.toUpperCase())
      .join("") || "?"

  return (
    <span
      className={cn(
        "relative flex shrink-0 items-center justify-center overflow-hidden font-semibold ring-1 ring-border/70 shadow-sm shadow-primary/10",
        SIZES[size],
        logoUrl
          ? "bg-muted"
          : "bg-gradient-to-br from-primary/20 to-primary/5 text-primary",
        className,
      )}
    >
      {logoUrl ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={logoUrl} alt={`${name} logo`} className="size-full object-cover" />
      ) : (
        initials
      )}
    </span>
  )
}
