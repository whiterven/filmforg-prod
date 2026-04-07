import * as React from "react"
import { cn } from "@/src/lib/utils"

export interface SkeletonProps extends React.HTMLAttributes<HTMLDivElement> {}

export function Skeleton({ className, ...props }: SkeletonProps) {
  return (
    <div
      className={cn(
        "rounded-[12px] bg-[var(--bg-surface)]",
        className
      )}
      style={{
        background: "linear-gradient(90deg, var(--bg-surface) 25%, rgba(255,255,255,0.05) 50%, var(--bg-surface) 75%)",
        backgroundSize: "200% 100%",
        animation: "shimmer 1.8s ease-in-out infinite"
      }}
      {...props}
    />
  )
}
