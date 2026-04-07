import * as React from "react"
import { motion, AnimatePresence } from "motion/react"
import { X, Copy, Download } from "lucide-react"
import { SPRINGS } from "@/src/lib/constants"
import { Chip } from "./ui/Chip"
import { useToast } from "./ui/Toast"
import { Button } from "./ui/Button"

// In a real app, this would connect to Firebase Realtime Database
// For this demo, we'll mock some log entries
const MOCK_LOGS = [
  { id: "1", type: "info", agent: "System", action: "Production initialized", time: "10:00 AM" },
  { id: "2", type: "working", agent: "Script Agent", action: "Reading script document", time: "10:01 AM" },
  { id: "3", type: "success", agent: "Script Agent", action: "Extracted 12 shots", time: "10:02 AM" },
  { id: "4", type: "working", agent: "Image Agent", action: "Generating image for Shot 1", shotRef: "Shot 1", time: "10:05 AM" },
  { id: "5", type: "success", agent: "Image Agent", action: "Image generated", shotRef: "Shot 1", time: "10:06 AM" },
]

export function AgentLog({ isOpen, onClose }: { isOpen: boolean, onClose: () => void }) {
  const { toast } = useToast()
  const [filter, setFilter] = React.useState("All")
  
  const filters = ["All", "Script", "Images", "Video", "Errors"]

  const handleCopy = (text: string) => {
    navigator.clipboard.writeText(text)
    toast("Copied to clipboard", "success")
  }

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-40 bg-black/50 backdrop-blur-sm"
            onClick={onClose}
          />
          <motion.div
            initial={{ x: "100%" }}
            animate={{ x: 0 }}
            exit={{ x: "100%" }}
            transition={SPRINGS.smooth}
            className="fixed inset-y-0 right-0 z-50 w-full max-w-[380px] bg-[var(--bg-surface)] glass-panel border-l border-[var(--border-subtle)] flex flex-col pt-safe pb-safe"
          >
            <div className="flex items-center justify-between p-4 border-b border-[var(--border-subtle)]">
              <h2 className="font-display font-semibold text-[17px] text-[var(--text-primary)]">Agent Log</h2>
              <button onClick={onClose} className="p-2 text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-colors">
                <X size={20} />
              </button>
            </div>

            <div className="p-4 border-b border-[var(--border-subtle)]">
              <div className="flex overflow-x-auto hide-scrollbar gap-2">
                {filters.map(f => (
                  <Chip key={f} selected={filter === f} onClick={() => setFilter(f)}>
                    {f}
                  </Chip>
                ))}
              </div>
            </div>

            <div className="flex-1 overflow-y-auto p-4 flex flex-col gap-4">
              {MOCK_LOGS.map((log, i) => (
                <motion.div
                  key={log.id}
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ ...SPRINGS.gentle, delay: i * 0.05 }}
                  className="flex gap-3 group"
                  onContextMenu={(e) => {
                    e.preventDefault()
                    handleCopy(`[${log.time}] ${log.agent}: ${log.action}`)
                  }}
                >
                  <div className="mt-1 shrink-0">
                    <div className={`w-2 h-2 rounded-full ${
                      log.type === 'working' ? 'bg-[var(--amber-500)]' :
                      log.type === 'success' ? 'bg-[var(--teal-500)]' :
                      log.type === 'error' ? 'bg-[var(--rose-500)]' :
                      'bg-[var(--slate-400)]'
                    }`} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-baseline justify-between gap-2 mb-0.5">
                      <span className="font-display font-semibold text-[12px] text-[var(--amber-500)] truncate">
                        {log.agent}
                      </span>
                      <span className="font-sans text-[11px] text-[var(--text-muted)] shrink-0">
                        {log.time}
                      </span>
                    </div>
                    <p className="font-sans text-[13px] text-[var(--text-primary)] leading-snug">
                      {log.action}
                    </p>
                    {log.shotRef && (
                      <p className="font-sans text-[12px] text-[var(--text-muted)] mt-0.5">
                        {log.shotRef}
                      </p>
                    )}
                  </div>
                </motion.div>
              ))}
            </div>

            <div className="p-4 border-t border-[var(--border-subtle)]">
              <Button variant="ghost" className="w-full text-[var(--text-secondary)]">
                <Download size={16} className="mr-2" />
                Export log
              </Button>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  )
}
