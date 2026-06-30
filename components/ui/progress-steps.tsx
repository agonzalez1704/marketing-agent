"use client"

import { Check, Loader2 } from "lucide-react"
import { cn } from "@/lib/utils"

export type StepState = "pending" | "active" | "done" | "error"

export interface Step {
  key: string
  label: string
  state: StepState
}

/**
 * Inline async-progress indicator. Reused for scrape, generate, and publish —
 * so nothing ever looks hung (UX principle #4).
 */
export function ProgressSteps({ steps, className }: { steps: Step[]; className?: string }) {
  return (
    <ol className={cn("flex flex-col gap-3", className)}>
      {steps.map((step) => (
        <li key={step.key} className="flex items-center gap-3 text-sm">
          <span
            className={cn(
              "flex size-6 shrink-0 items-center justify-center rounded-full border",
              step.state === "done" && "border-green-500 bg-green-500 text-white",
              step.state === "active" && "border-blue-500 text-blue-500",
              step.state === "error" && "border-red-500 bg-red-500 text-white",
              step.state === "pending" && "border-border text-muted-foreground",
            )}
          >
            {step.state === "done" && <Check className="size-3.5" />}
            {step.state === "active" && <Loader2 className="size-3.5 animate-spin" />}
            {step.state === "error" && <span className="text-xs font-bold">!</span>}
            {step.state === "pending" && <span className="size-1.5 rounded-full bg-current" />}
          </span>
          <span
            className={cn(
              step.state === "pending" && "text-muted-foreground",
              step.state === "error" && "text-red-600",
              step.state === "active" && "font-medium",
            )}
          >
            {step.label}
          </span>
        </li>
      ))}
    </ol>
  )
}
