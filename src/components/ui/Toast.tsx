import * as React from "react"
import { motion, AnimatePresence } from "motion/react"
import { cn } from "@/src/lib/utils"
import { SPRINGS } from "@/src/lib/constants"
import { CheckCircle, AlertCircle, Info, AlertTriangle } from "lucide-react"

export type ToastType = "success" | "error" | "warning" | "info"

export interface ToastProps {
  id: string
  message: string
  type?: ToastType
  onClose: (id: string) => void
}

export function Toast({ id, message, type = "info", onClose }: ToastProps) {
  React.useEffect(() => {
    const timer = setTimeout(() => {
      onClose(id)
    }, 3500)
    return () => clearTimeout(timer)
  }, [id, onClose])

  const icons = {
    success: <CheckCircle className="w-5 h-5 text-[var(--teal-500)]" />,
    error: <AlertCircle className="w-5 h-5 text-[var(--rose-500)]" />,
    warning: <AlertTriangle className="w-5 h-5 text-[var(--amber-500)]" />,
    info: <Info className="w-5 h-5 text-[var(--slate-400)]" />
  }

  const borders = {
    success: "border-l-[var(--teal-500)]",
    error: "border-l-[var(--rose-500)]",
    warning: "border-l-[var(--amber-500)]",
    info: "border-l-[var(--slate-400)]"
  }

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: -20, scale: 0.95 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, y: -20, scale: 0.95 }}
      transition={SPRINGS.snappy}
      className={cn(
        "flex items-center gap-3 w-full max-w-[320px] rounded-[12px] p-3 shadow-lg border-l-[3px]",
        "bg-[var(--bg-surface)] backdrop-blur-[24px] border-y border-r border-[var(--border-subtle)]",
        borders[type]
      )}
    >
      {icons[type]}
      <p className="text-[13px] font-medium font-sans text-[var(--text-primary)] leading-tight">
        {message}
      </p>
    </motion.div>
  )
}

// Toast Provider and Hook
interface ToastContextType {
  toast: (message: string, type?: ToastType) => void
}

const ToastContext = React.createContext<ToastContextType | null>(null)

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = React.useState<Omit<ToastProps, "onClose">[]>([])

  const toast = React.useCallback((message: string, type: ToastType = "info") => {
    setToasts((prev) => {
      // Only keep one toast at a time as per spec
      return [{ id: Math.random().toString(36).substr(2, 9), message, type }]
    })
  }, [])

  const removeToast = React.useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id))
  }, [])

  return (
    <ToastContext.Provider value={{ toast }}>
      {children}
      <div className="fixed top-safe pt-4 left-0 right-0 z-[100] flex flex-col items-center pointer-events-none px-4">
        <AnimatePresence mode="popLayout">
          {toasts.map((t) => (
            <Toast key={t.id} {...t} onClose={removeToast} />
          ))}
        </AnimatePresence>
      </div>
    </ToastContext.Provider>
  )
}

export const useToast = () => {
  const context = React.useContext(ToastContext)
  if (!context) throw new Error("useToast must be used within ToastProvider")
  return context
}
