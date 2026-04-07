import * as React from "react"
import { motion, AnimatePresence, PanInfo } from "motion/react"
import { cn } from "@/src/lib/utils"
import { SPRINGS } from "@/src/lib/constants"

interface BottomSheetProps {
  isOpen: boolean
  onClose: () => void
  children: React.ReactNode
  className?: string
}

export function BottomSheet({ isOpen, onClose, children, className }: BottomSheetProps) {
  const handleDragEnd = (event: MouseEvent | TouchEvent | PointerEvent, info: PanInfo) => {
    if (info.offset.y > 100 || info.velocity.y > 500) {
      onClose()
    }
  }

  // Prevent body scroll when open
  React.useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = "hidden"
    } else {
      document.body.style.overflow = ""
    }
    return () => {
      document.body.style.overflow = ""
    }
  }, [isOpen])

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="fixed inset-0 z-50 bg-black/70 backdrop-blur-[4px]"
            onClick={onClose}
          />
          <motion.div
            initial={{ y: "100%" }}
            animate={{ y: 0 }}
            exit={{ y: "100%" }}
            transition={SPRINGS.smooth} // Using smooth spring with slight overshoot
            drag="y"
            dragConstraints={{ top: 0 }}
            dragElastic={0.2}
            onDragEnd={handleDragEnd}
            className={cn(
              "fixed bottom-0 left-0 right-0 z-50 flex flex-col rounded-t-[24px] bg-[var(--bg-surface)] glass-panel max-h-[90vh] pb-safe",
              className
            )}
            style={{ borderBottom: "none", borderBottomLeftRadius: 0, borderBottomRightRadius: 0 }}
          >
            <div className="flex w-full items-center justify-center pt-3 pb-2 cursor-grab active:cursor-grabbing">
              <div className="h-1 w-9 rounded-full bg-white/15" />
            </div>
            <div className="flex-1 overflow-y-auto px-4 pb-6 hide-scrollbar">
              {children}
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  )
}
