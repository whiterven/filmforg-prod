import * as React from "react"
import { cn } from "@/src/lib/utils"

export interface BadgeProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: "draft" | "in_production" | "completed" | "error" | "amber"
}

function Badge({ className, variant = "draft", ...props }: BadgeProps) {
  const variants = {
    draft: "bg-[var(--slate-400)]/12 text-[var(--slate-400)]",
    in_production: "bg-[var(--amber-500)]/12 text-[var(--amber-500)]",
    completed: "bg-[var(--teal-500)]/12 text-[var(--teal-500)]",
    error: "bg-[var(--rose-500)]/12 text-[var(--rose-500)]",
    amber: "bg-[var(--amber-500)] text-[var(--text-inverse)]", // solid amber
  }

  return (
    <div
      className={cn(
        "inline-flex items-center rounded-full px-[6px] py-[2px] text-[10px] font-bold uppercase tracking-[1.2px] font-sans",
        variants[variant],
        className
      )}
      {...props}
    />
  )
}

export { Badge }
