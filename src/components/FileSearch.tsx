import * as React from "react"
import { motion, AnimatePresence } from "motion/react"
import { X, Search, FileText, Image as ImageIcon, Video, Download } from "lucide-react"
import { SPRINGS } from "@/src/lib/constants"
import { Input } from "./ui/Input"
import { Card } from "./ui/Card"

// Mock files for demonstration
const MOCK_FILES = [
  { id: "1", name: "Script.pdf", type: "document", size: "2.4 MB", date: "Today" },
  { id: "2", name: "Shot_1_Reference.jpg", type: "image", size: "1.1 MB", date: "Today" },
  { id: "3", name: "Shot_2_Reference.jpg", type: "image", size: "1.2 MB", date: "Today" },
  { id: "4", name: "Shot_1_Clip.mp4", type: "video", size: "8.4 MB", date: "Today" },
]

export function FileSearch({ isOpen, onClose }: { isOpen: boolean, onClose: () => void }) {
  const [searchQuery, setSearchQuery] = React.useState("")

  const filteredFiles = MOCK_FILES.filter(f => 
    f.name.toLowerCase().includes(searchQuery.toLowerCase())
  )

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
              <h2 className="font-display font-semibold text-[17px] text-[var(--text-primary)]">Files</h2>
              <button onClick={onClose} className="p-2 text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-colors">
                <X size={20} />
              </button>
            </div>

            <div className="p-4 border-b border-[var(--border-subtle)]">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--text-muted)]" size={18} />
                <Input 
                  placeholder="Search files, prompts, tags..." 
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10 h-[44px]"
                />
              </div>
            </div>

            <div className="flex-1 overflow-y-auto p-4 flex flex-col gap-3">
              {filteredFiles.map((file) => (
                <Card key={file.id} className="p-3 flex items-center gap-3 hoverable cursor-pointer">
                  <div className={`w-10 h-10 rounded-[8px] flex items-center justify-center shrink-0 ${
                    file.type === 'document' ? 'bg-[var(--slate-600)]/20 text-[var(--slate-400)]' :
                    file.type === 'image' ? 'bg-[var(--amber-500)]/20 text-[var(--amber-500)]' :
                    'bg-[var(--teal-500)]/20 text-[var(--teal-500)]'
                  }`}>
                    {file.type === 'document' && <FileText size={20} />}
                    {file.type === 'image' && <ImageIcon size={20} />}
                    {file.type === 'video' && <Video size={20} />}
                  </div>
                  <div className="flex-1 min-w-0">
                    <h4 className="font-sans font-medium text-[13px] text-[var(--text-primary)] truncate">
                      {file.name}
                    </h4>
                    <p className="font-sans text-[11px] text-[var(--text-muted)]">
                      {file.size} · {file.date}
                    </p>
                  </div>
                  <button className="p-2 text-[var(--text-secondary)] hover:text-[var(--amber-500)] transition-colors">
                    <Download size={16} />
                  </button>
                </Card>
              ))}
              
              {filteredFiles.length === 0 && (
                <div className="text-center py-12">
                  <p className="font-sans text-[13px] text-[var(--text-secondary)]">No files found</p>
                </div>
              )}
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  )
}
