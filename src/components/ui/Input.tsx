import * as React from "react"
import { cn } from "@/src/lib/utils"

export interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string
  error?: string
}

const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ className, type, label, error, ...props }, ref) => {
    return (
      <div className="w-full flex flex-col">
        {label && (
          <label className="text-[12px] font-medium text-[var(--text-secondary)] mb-[6px] font-sans">
            {label}
          </label>
        )}
        <input
          type={type}
          className={cn(
            "flex h-[52px] w-full rounded-[12px] border border-[var(--border-subtle)] bg-[var(--bg-void)] px-4 py-2 text-[14px] text-[var(--text-primary)] font-sans transition-all duration-200",
            "file:border-0 file:bg-transparent file:text-sm file:font-medium",
            "placeholder:text-[var(--text-muted)]",
            "focus-visible:outline-none focus-visible:border-[var(--border-glow)] focus-visible:shadow-[0_0_0_3px_rgba(245,158,11,0.12)]",
            "disabled:cursor-not-allowed disabled:opacity-50",
            error && "border-[var(--rose-500)] focus-visible:border-[var(--rose-500)] focus-visible:shadow-[0_0_0_3px_rgba(244,63,94,0.12)]",
            className
          )}
          ref={ref}
          {...props}
        />
        {error && (
          <span className="text-[12px] text-[var(--rose-500)] mt-2 font-sans">
            {error}
          </span>
        )}
      </div>
    )
  }
)
Input.displayName = "Input"

export { Input }
