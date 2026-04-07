import * as React from "react"
import { Button } from "./Button"

export interface EmptyStateProps {
  title: string
  description: string
  actionLabel?: string
  onAction?: () => void
}

export function EmptyState({ title, description, actionLabel, onAction }: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center text-center px-6 py-12 min-h-[50vh]">
      <div className="text-[var(--amber-500)] opacity-80 mb-6">
        <span className="font-display font-bold text-[64px] tracking-tighter leading-none">FF</span>
      </div>
      <h2 className="font-display font-bold text-[20px] text-[var(--text-primary)] mb-2">
        {title}
      </h2>
      <p className="font-sans text-[14px] text-[var(--text-secondary)] max-w-[200px] mb-8">
        {description}
      </p>
      {actionLabel && onAction && (
        <Button onClick={onAction} className="w-[200px]">
          {actionLabel}
        </Button>
      )}
    </div>
  )
}
