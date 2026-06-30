import { cn } from "@/lib/utils"

// Post lifecycle states — mirrors Prisma PostStatus.
export type PostStatusValue =
  | "DRAFT"
  | "SCHEDULED"
  | "PUBLISHING"
  | "PUBLISHED"
  | "FAILED"

const STYLES: Record<PostStatusValue, { label: string; className: string }> = {
  DRAFT: { label: "Draft", className: "bg-muted text-muted-foreground" },
  SCHEDULED: { label: "Scheduled", className: "bg-blue-100 text-blue-700 dark:bg-blue-950 dark:text-blue-300" },
  PUBLISHING: { label: "Publishing", className: "bg-amber-100 text-amber-700 dark:bg-amber-950 dark:text-amber-300" },
  PUBLISHED: { label: "Live", className: "bg-green-100 text-green-700 dark:bg-green-950 dark:text-green-300" },
  FAILED: { label: "Failed", className: "bg-red-100 text-red-700 dark:bg-red-950 dark:text-red-300" },
}

export function StatusChip({
  status,
  className,
}: {
  status: PostStatusValue
  className?: string
}) {
  const s = STYLES[status]
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium",
        s.className,
        className,
      )}
    >
      {s.label}
    </span>
  )
}
