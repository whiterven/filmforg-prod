import * as React from "react"
import { motion } from "motion/react"
import { cn } from "@/src/lib/utils"
import { SPRINGS } from "@/src/lib/constants"

export interface ChipProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  selected?: boolean
}

const Chip = React.forwardRef<HTMLButtonElement, ChipProps>(
  ({ className, selected, children, ...props }, ref) => {
    return (
      <motion.button
        ref={ref}
        whileTap={{ scale: 0.94 }}
        transition={SPRINGS.bouncy}
        className={cn(
          "inline-flex items-center justify-center rounded-full px-4 py-2 text-[12px] font-semibold transition-colors duration-200 font-sans whitespace-nowrap",
          selected
            ? "bg-amber-gradient text-[var(--text-inverse)]"
            : "glass-panel text-[var(--text-secondary)] border-[var(--border-subtle)] hover:border-[var(--border-soft)]",
          className
        )}
        {...props}
      >
        {children}
      </motion.button>
    )
  }
)
Chip.displayName = "Chip"

export { Chip }
