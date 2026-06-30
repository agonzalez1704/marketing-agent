import { cn } from "@/lib/utils"

/** Brand avatar used inside the platform mockups — client logo, or initial fallback. */
export function BrandAvatar({
  name,
  logo,
  className,
  textClassName,
}: {
  name: string
  logo: string | null
  className?: string
  textClassName?: string
}) {
  const initial = name?.trim()?.[0]?.toUpperCase() ?? "B"
  return (
    <div
      className={cn(
        "flex shrink-0 items-center justify-center overflow-hidden rounded-full bg-primary font-bold text-white",
        className,
        textClassName,
      )}
    >
      {logo ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={logo} alt="" className="size-full object-cover" />
      ) : (
        initial
      )}
    </div>
  )
}
