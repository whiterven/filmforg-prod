import * as React from "react"
import { cn } from "@/src/lib/utils"
import { motion, HTMLMotionProps } from "motion/react"

export interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  hoverable?: boolean
  glow?: "amber" | "teal" | "none"
}

const Card = React.forwardRef<HTMLDivElement, CardProps>(
  ({ className, hoverable, glow = "none", ...props }, ref) => {
    return (
      <motion.div
        ref={ref}
        className={cn(
          "glass-panel rounded-[20px] overflow-hidden",
          hoverable && "transition-all duration-200 hover:border-[var(--border-soft)] hover:shadow-[var(--shadow-card-hover)]",
          !hoverable && "shadow-[var(--shadow-card-default)]",
          glow === "amber" && "shadow-[var(--shadow-amber-glow)] border-[var(--border-glow)]",
          glow === "teal" && "shadow-[0_0_0_1px_rgba(20,184,166,0.3),0_8px_32px_rgba(20,184,166,0.15)] border-[rgba(20,184,166,0.35)]",
          className
        )}
        {...(props as any)}
      />
    )
  }
)
Card.displayName = "Card"

export { Card }
