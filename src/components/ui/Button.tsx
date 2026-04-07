import * as React from "react"
import { motion, HTMLMotionProps } from "motion/react"
import { cn } from "@/src/lib/utils"
import { SPRINGS } from "@/src/lib/constants"

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "primary" | "approve" | "destructive" | "secondary" | "ghost"
  isLoading?: boolean
  asChild?: boolean
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = "primary", isLoading, children, ...props }, ref) => {
    const baseStyles = "relative inline-flex items-center justify-center whitespace-nowrap rounded-[12px] text-[14px] font-semibold transition-all duration-150 ease-in-out disabled:pointer-events-none disabled:opacity-50 min-h-[52px] px-6 w-full sm:w-auto"
    
    const variants = {
      primary: "bg-amber-gradient text-[var(--text-inverse)] shadow-[inset_0_1px_0_rgba(255,255,255,0.15)] hover:brightness-108 active:brightness-95",
      approve: "bg-[var(--teal-500)] text-white hover:brightness-108 active:brightness-95",
      destructive: "bg-[var(--rose-500)] text-white hover:brightness-108 active:brightness-95",
      secondary: "bg-[rgba(255,255,255,0.06)] border border-[var(--border-soft)] text-[var(--text-primary)] hover:bg-[rgba(255,255,255,0.1)]",
      ghost: "bg-transparent text-[var(--amber-500)] hover:bg-[rgba(245,158,11,0.1)] min-h-[44px]",
    }

    return (
      <motion.button
        ref={ref}
        whileTap={{ scale: 0.96 }}
        transition={SPRINGS.snappy}
        className={cn(baseStyles, variants[variant], className)}
        disabled={isLoading || props.disabled}
        {...(props as HTMLMotionProps<"button">)}
      >
        {isLoading ? (
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="w-5 h-5 border-2 border-current border-t-transparent rounded-full animate-spin" />
          </div>
        ) : null}
        <span className={cn(isLoading && "opacity-0")}>{children}</span>
      </motion.button>
    )
  }
)
Button.displayName = "Button"

export { Button }
