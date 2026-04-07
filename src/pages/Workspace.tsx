import * as React from "react"
import { useParams, useNavigate } from "react-router-dom"
import { motion, AnimatePresence } from "motion/react"
import { auth, db } from "@/src/firebase"
import { doc, onSnapshot, updateDoc } from "firebase/firestore"
import { ArrowLeft, Activity, Folder } from "lucide-react"

import { PipelineProgressBar } from "@/src/components/ui/PipelineProgressBar"
import { SPRINGS } from "@/src/lib/constants"
import { useToast } from "@/src/components/ui/Toast"
import { AgentLog } from "@/src/components/AgentLog"
import { FileSearch } from "@/src/components/FileSearch"

// Import Stage Components
import Stage1Script from "./stages/Stage1Script"
import Stage2Images from "./stages/Stage2Images"
import Stage3Video from "./stages/Stage3Video"
import Stage4Assembly from "./stages/Stage4Assembly"

export default function Workspace() {
  const { projectId } = useParams()
  const navigate = useNavigate()
  const { toast } = useToast()
  
  const [project, setProject] = React.useState<any>(null)
  const [loading, setLoading] = React.useState(true)
  const [isLogOpen, setIsLogOpen] = React.useState(false)
  const [isFilesOpen, setIsFilesOpen] = React.useState(false)

  React.useEffect(() => {
    if (!projectId) return

    const unsub = onSnapshot(doc(db, "projects", projectId), (docSnap) => {
      if (docSnap.exists()) {
        setProject({ id: docSnap.id, ...docSnap.data() })
      } else {
        toast("Project not found", "error")
        navigate("/dashboard")
      }
      setLoading(false)
    }, (error) => {
      console.error("Error fetching project:", error)
      toast("Failed to load project", "error")
      setLoading(false)
    })

    return () => unsub()
  }, [projectId, navigate, toast])

  const handleBack = () => {
    navigate("/dashboard")
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-[var(--bg-base)] flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-[var(--amber-500)] border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }

  if (!project) return null

  return (
    <div className="min-h-screen bg-[var(--bg-base)] flex flex-col pt-safe pb-safe overflow-hidden">
      {/* Header */}
      <header className="shrink-0 h-[64px] bg-[var(--bg-surface)]/80 backdrop-blur-[20px] border-b border-[var(--border-subtle)] px-4 flex items-center justify-between z-30">
        <button 
          onClick={handleBack}
          className="w-10 h-10 flex items-center justify-center text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-colors -ml-2"
        >
          <ArrowLeft size={24} />
        </button>
        
        <div className="flex-1 px-2 text-center">
          <h1 className="font-display font-semibold text-[15px] text-[var(--text-primary)] truncate max-w-[180px] mx-auto">
            {project.title}
          </h1>
        </div>
        
        <div className="flex items-center -mr-2">
          <button 
            onClick={() => setIsFilesOpen(true)}
            className="w-10 h-10 flex items-center justify-center text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-colors"
          >
            <Folder size={20} />
          </button>
          <button 
            onClick={() => setIsLogOpen(true)}
            className="w-10 h-10 flex items-center justify-center text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-colors"
          >
            <Activity size={20} />
          </button>
        </div>
      </header>

      {/* Pipeline Progress Bar */}
      <PipelineProgressBar currentStage={project.stage} />

      {/* Stage Workspace Area */}
      <main className="flex-1 relative overflow-hidden">
        <AnimatePresence mode="wait">
          <motion.div
            key={project.stage}
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            transition={SPRINGS.smooth}
            className="absolute inset-0 overflow-y-auto hide-scrollbar"
          >
            {project.stage === 1 && <Stage1Script project={project} />}
            {project.stage === 2 && <Stage2Images project={project} />}
            {project.stage === 3 && <Stage3Video project={project} />}
            {project.stage === 4 && <Stage4Assembly project={project} />}
          </motion.div>
        </AnimatePresence>
      </main>

      <AgentLog isOpen={isLogOpen} onClose={() => setIsLogOpen(false)} />
      <FileSearch isOpen={isFilesOpen} onClose={() => setIsFilesOpen(false)} />
    </div>
  )
}
