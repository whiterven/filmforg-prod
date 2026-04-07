import * as React from "react"
import { Card } from "./Card"
import { Avatar } from "./Avatar"
import { Button } from "./Button"
import { cn } from "@/src/lib/utils"

export interface AgentStatusCardProps {
  agentName: string
  statusText: string
  state: "working" | "complete" | "error"
  icon: React.ReactNode
  onRetry?: () => void
}

export function AgentStatusCard({ agentName, statusText, state, icon, onRetry }: AgentStatusCardProps) {
  return (
    <Card className="p-5 flex items-center gap-4">
      <Avatar
        size={42}
        icon={icon}
        isWorking={state === "working"}
        isComplete={state === "complete"}
        isError={state === "error"}
        className={cn(
          state === "working" && "bg-[var(--amber-500)]/20 text-[var(--amber-500)]",
          state === "complete" && "bg-[var(--teal-500)]/20 text-[var(--teal-500)]",
          state === "error" && "bg-[var(--rose-500)]/20 text-[var(--rose-500)]"
        )}
      />
      <div className="flex-1 min-w-0">
        <h3 className="font-display font-semibold text-[14px] text-[var(--text-primary)] truncate">
          {agentName}
        </h3>
        <p className={cn(
          "font-sans text-[12px] truncate mt-0.5",
          state === "working" && "text-[var(--text-secondary)] animate-pulse",
          state === "complete" && "text-[var(--teal-500)]",
          state === "error" && "text-[var(--rose-500)]"
        )}>
          {statusText}
        </p>
      </div>
      {state === "error" && onRetry && (
        <Button variant="ghost" onClick={onRetry} className="shrink-0 px-3 min-h-[36px] text-[12px]">
          Retry
        </Button>
      )}
    </Card>
  )
}
