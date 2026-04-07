import * as React from "react"
import { motion } from "motion/react"
import { cn } from "@/src/lib/utils"
import { SPRINGS } from "@/src/lib/constants"
import { Check } from "lucide-react"

export interface PipelineProgressBarProps {
  currentStage: number // 1 to 4
}

const STAGES = [
  { id: 1, label: "Script" },
  { id: 2, label: "Images" },
  { id: 3, label: "Video" },
  { id: 4, label: "Assemble" },
]

export function PipelineProgressBar({ currentStage }: PipelineProgressBarProps) {
  return (
    <div className="w-full flex items-center h-[40px] bg-[var(--bg-surface)] border-b border-[var(--border-subtle)]">
      {STAGES.map((stage, index) => {
        const isActive = stage.id === currentStage
        const isCompleted = stage.id < currentStage
        const isLocked = stage.id > currentStage

        return (
          <React.Fragment key={stage.id}>
            <div className="flex-1 relative h-full flex items-center justify-center overflow-hidden">
              {/* Background fills */}
              {isCompleted && (
                <motion.div
                  layoutId={`stage-fill-${stage.id}`}
                  className="absolute inset-0 bg-[var(--teal-500)]"
                  initial={false}
                  transition={SPRINGS.smooth}
                />
              )}
              {isActive && (
                <motion.div
                  layoutId={`stage-fill-${stage.id}`}
                  className="absolute inset-0 bg-amber-gradient shadow-[var(--shadow-amber-glow)]"
                  initial={false}
                  transition={SPRINGS.smooth}
                />
              )}
              {isLocked && (
                <div className="absolute inset-0 bg-[var(--bg-overlay)]" />
              )}

              {/* Content */}
              <div className="relative z-10 flex items-center gap-1.5 px-2">
                {isCompleted ? (
                  <motion.div
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={SPRINGS.bouncy}
                  >
                    <Check className="w-3 h-3 text-[var(--text-inverse)]" strokeWidth={3} />
                  </motion.div>
                ) : (
                  <span className={cn(
                    "text-micro",
                    (isActive || isCompleted) ? "text-[var(--text-inverse)]" : "text-[var(--text-muted)]"
                  )}>
                    {stage.id}
                  </span>
                )}
                <span className={cn(
                  "text-micro hidden sm:inline-block",
                  (isActive || isCompleted) ? "text-[var(--text-inverse)]" : "text-[var(--text-muted)]"
                )}>
                  {stage.label}
                </span>
              </div>
            </div>
            {index < STAGES.length - 1 && (
              <div className="w-px h-full bg-[var(--border-subtle)] z-20 relative" />
            )}
          </React.Fragment>
        )
      })}
    </div>
  )
}
