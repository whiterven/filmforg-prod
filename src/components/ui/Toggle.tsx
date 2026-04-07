import * as React from "react"
import { motion } from "motion/react"
import { cn } from "@/src/lib/utils"
import { SPRINGS } from "@/src/lib/constants"

export interface ToggleProps {
  checked: boolean
  onChange: (checked: boolean) => void
  className?: string
}

export function Toggle({ checked, onChange, className }: ToggleProps) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      onClick={() => onChange(!checked)}
      className={cn(
        "relative inline-flex h-[32px] w-[60px] shrink-0 cursor-pointer items-center rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--amber-500)] focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--bg-base)]",
        checked ? "bg-[var(--teal-500)]" : "bg-[var(--bg-raised)]",
        className
      )}
    >
      <span className="sr-only">Toggle</span>
      <motion.span
        layout
        transition={SPRINGS.snappy}
        className={cn(
          "pointer-events-none inline-block h-[28px] w-[28px] rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out",
          checked ? "translate-x-[28px]" : "translate-x-0"
        )}
      />
    </button>
  )
}
