import * as React from "react"
import { cn } from "@/src/lib/utils"

export interface AvatarProps extends React.HTMLAttributes<HTMLDivElement> {
  src?: string | null
  fallback?: string
  size?: number
  isWorking?: boolean
  isComplete?: boolean
  isError?: boolean
  icon?: React.ReactNode
}

export const Avatar = React.forwardRef<HTMLDivElement, AvatarProps>(
  ({ className, src, fallback, size = 36, isWorking, isComplete, isError, icon, ...props }, ref) => {
    return (
      <div
        ref={ref}
        className={cn(
          "relative flex shrink-0 overflow-hidden rounded-full items-center justify-center bg-[var(--bg-raised)] border border-[var(--border-subtle)]",
          isWorking && "animate-[agent-pulse_2s_ease-out_infinite]",
          isComplete && "border-[var(--teal-500)] shadow-[0_0_0_2px_rgba(20,184,166,0.2)]",
          isError && "border-[var(--rose-500)] shadow-[0_0_0_2px_rgba(244,63,94,0.2)]",
          className
        )}
        style={{ width: size, height: size }}
        {...props}
      >
        {src ? (
          <img
            src={src}
            alt="Avatar"
            className="aspect-square h-full w-full object-cover"
            referrerPolicy="no-referrer"
          />
        ) : icon ? (
          <div className="text-[var(--text-primary)] flex items-center justify-center">
            {icon}
          </div>
        ) : (
          <span className="font-sans font-medium text-[var(--text-secondary)] uppercase" style={{ fontSize: size * 0.4 }}>
            {fallback?.slice(0, 2) || "FF"}
          </span>
        )}
      </div>
    )
  }
)
Avatar.displayName = "Avatar"
