import * as React from "react"
import { motion, AnimatePresence } from "motion/react"
import { useNavigate } from "react-router-dom"
import { auth, db } from "@/src/firebase"
import { collection, query, where, onSnapshot, orderBy } from "firebase/firestore"
import { Bell, Film, Plus, FileText, Upload, ChevronRight } from "lucide-react"

import { Card } from "@/src/components/ui/Card"
import { Badge } from "@/src/components/ui/Badge"
import { Avatar } from "@/src/components/ui/Avatar"
import { EmptyState } from "@/src/components/ui/EmptyState"
import { BottomSheet } from "@/src/components/ui/BottomSheet"
import { Input } from "@/src/components/ui/Input"
import { Chip } from "@/src/components/ui/Chip"
import { Button } from "@/src/components/ui/Button"
import { SPRINGS } from "@/src/lib/constants"
import { useStore } from "@/src/store/useStore"
import { useToast } from "@/src/components/ui/Toast"
import { cn } from "@/src/lib/utils"
import { AccountSettings } from "@/src/components/AccountSettings"

// Types
interface Project {
  id: string
  title: string
  type: string
  status: "draft" | "in_production" | "completed" | "error"
  stage: number
  updatedAt: any
  stats: {
    totalShots: number
    approvedImages: number
    approvedClips: number
  }
}

export default function Dashboard() {
  const navigate = useNavigate()
  const { toast } = useToast()
  const [projects, setProjects] = React.useState<Project[]>([])
  const [loading, setLoading] = React.useState(true)
  const [isAccountSettingsOpen, setIsAccountSettingsOpen] = React.useState(false)
  
  const isNewProjectSheetOpen = useStore(state => state.isNewProjectSheetOpen)
  const setNewProjectSheetOpen = useStore(state => state.setNewProjectSheetOpen)

  React.useEffect(() => {
    if (!auth.currentUser) return

    const q = query(
      collection(db, "projects"),
      where("ownerId", "==", auth.currentUser.uid),
      orderBy("updatedAt", "desc")
    )

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const projData: Project[] = []
      snapshot.forEach((doc) => {
        projData.push({ id: doc.id, ...doc.data() } as Project)
      })
      setProjects(projData)
      setLoading(false)
    }, (error) => {
      console.error("Error fetching projects:", error)
      toast("Failed to load projects", "error")
      setLoading(false)
    })

    return () => unsubscribe()
  }, [toast])

  return (
    <div className="min-h-screen bg-[var(--bg-base)] flex flex-col pt-safe pb-safe">
      {/* Header */}
      <header className="sticky top-0 z-30 h-[64px] bg-[var(--bg-surface)]/80 backdrop-blur-[20px] border-b border-[var(--border-subtle)] px-4 flex items-center justify-between">
        <div className="font-display font-bold text-[28px] text-[var(--amber-500)] tracking-tighter">
          FF
        </div>
        <div className="flex items-center gap-4">
          <button className="relative text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-colors">
            <Bell size={24} />
            {/* Unread badge example */}
            {/* <span className="absolute top-0 right-0 w-2.5 h-2.5 bg-[var(--amber-500)] rounded-full border-2 border-[var(--bg-surface)]" /> */}
          </button>
          <Avatar 
            src={auth.currentUser?.photoURL} 
            fallback={auth.currentUser?.displayName || auth.currentUser?.email || "FF"} 
            className="cursor-pointer hover:shadow-[0_0_0_2px_rgba(245,158,11,0.3)] transition-shadow"
            onClick={() => setIsAccountSettingsOpen(true)}
          />
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 overflow-y-auto hide-scrollbar px-4 pt-6 pb-24">
        {loading ? (
          <div className="flex justify-center py-12">
            <div className="w-8 h-8 border-2 border-[var(--amber-500)] border-t-transparent rounded-full animate-spin" />
          </div>
        ) : projects.length === 0 ? (
          <EmptyState
            title="No productions yet"
            description="Start your first AI-directed film"
            actionLabel="Create production"
            onAction={() => setNewProjectSheetOpen(true)}
          />
        ) : (
          <div>
            <div className="text-micro text-[var(--text-muted)] mb-4">YOUR PRODUCTIONS</div>
            <div className="flex flex-col gap-3">
              <AnimatePresence>
                {projects.map((project, index) => (
                  <motion.div
                    key={project.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ ...SPRINGS.gentle, delay: index * 0.05 }}
                  >
                    <Card 
                      hoverable 
                      className="p-5 cursor-pointer"
                      onClick={() => navigate(`/workspace/${project.id}`)}
                    >
                      <div className="flex items-start justify-between mb-1">
                        <h3 className="font-display font-semibold text-[15px] text-[var(--text-primary)] truncate pr-4">
                          {project.title}
                        </h3>
                        <Badge variant={project.status} className="shrink-0">
                          {project.status.replace('_', ' ')}
                        </Badge>
                      </div>
                      <p className="font-sans text-[12px] text-[var(--text-muted)] mb-4">
                        {project.type}
                      </p>
                      
                      {/* Pipeline Mini-bar */}
                      <div className="flex h-[4px] gap-1 mb-3">
                        {[1, 2, 3, 4].map((stage) => (
                          <div 
                            key={stage} 
                            className={cn(
                              "flex-1 rounded-full",
                              stage < project.stage ? "bg-[var(--teal-500)]" :
                              stage === project.stage ? "bg-[var(--amber-500)]" :
                              "bg-[var(--bg-overlay)]"
                            )}
                          />
                        ))}
                      </div>
                      
                      <div className="font-sans text-[11px] text-[var(--text-muted)] mb-4">
                        {project.stats?.totalShots || 0} Shots · {project.stats?.approvedImages || 0} Images · {project.stats?.approvedClips || 0} Clips
                      </div>
                      
                      <div className="flex items-center justify-between border-t border-[var(--border-subtle)] pt-3">
                        <span className="font-sans text-[11px] text-[var(--text-muted)]">
                          Last edited {project.updatedAt?.toDate ? project.updatedAt.toDate().toLocaleDateString() : 'recently'}
                        </span>
                        <ChevronRight size={16} className="text-[var(--text-muted)]" />
                      </div>
                    </Card>
                  </motion.div>
                ))}
              </AnimatePresence>
            </div>
          </div>
        )}
      </main>

      {/* FAB */}
      <motion.button
        whileTap={{ scale: 0.9 }}
        transition={SPRINGS.snappy}
        onClick={() => setNewProjectSheetOpen(true)}
        className="fixed bottom-[20px] right-[20px] z-40 w-[56px] h-[56px] rounded-full bg-amber-gradient shadow-[var(--shadow-amber-glow)] flex items-center justify-center text-[var(--text-inverse)]"
      >
        <Film size={22} />
      </motion.button>

      {/* New Project Flow */}
      <NewProjectSheet />

      {/* Account Settings */}
      <AccountSettings 
        isOpen={isAccountSettingsOpen} 
        onClose={() => setIsAccountSettingsOpen(false)} 
      />
    </div>
  )
}

function NewProjectSheet() {
  const navigate = useNavigate()
  const { toast } = useToast()
  const isOpen = useStore(state => state.isNewProjectSheetOpen)
  const setOpen = useStore(state => state.setNewProjectSheetOpen)
  
  const [step, setStep] = React.useState(1)
  const [title, setTitle] = React.useState("")
  const [type, setType] = React.useState("Short Film")
  const [scriptText, setScriptText] = React.useState("")
  const [isUploading, setIsUploading] = React.useState(false)
  const [isSubmitting, setIsSubmitting] = React.useState(false)
  
  const types = ["Short Film", "Animation", "Music Video", "Commercial", "Documentary", "Other"]

  // Reset state when closed
  React.useEffect(() => {
    if (!isOpen) {
      setTimeout(() => {
        setStep(1)
        setTitle("")
        setType("Short Film")
        setScriptText("")
      }, 300)
    }
  }, [isOpen])

  const handleContinue = () => {
    if (!title.trim()) {
      toast("Please enter a production name", "error")
      return
    }
    setStep(2)
  }

  const handleCreateProject = async (scriptContent: string, isFile: boolean = false) => {
    if (!auth.currentUser) return
    setIsSubmitting(true)
    
    try {
      // Create project in Firestore
      const { addDoc, collection, serverTimestamp } = await import("firebase/firestore")
      const docRef = await addDoc(collection(db, "projects"), {
        ownerId: auth.currentUser.uid,
        title,
        type,
        status: "in_production",
        stage: 1,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
        stats: {
          totalShots: 0,
          approvedImages: 0,
          approvedClips: 0,
          skippedShots: 0
        },
        scriptContent,
        scriptIsFile: isFile
      })
      
      toast("Production created — analysing your script…", "success")
      setOpen(false)
      navigate(`/workspace/${docRef.id}`)
    } catch (error: any) {
      console.error("Error creating project:", error)
      toast(error.message || "Failed to create project", "error")
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    
    setIsUploading(true)
    try {
      if (!auth.currentUser) throw new Error("Not authenticated")

      let fileData: string;
      let isFile = false;
      let mimeType = file.type;

      if (file.type === "application/pdf" || file.name.toLowerCase().endsWith('.pdf')) {
        isFile = true;
        mimeType = "application/pdf";
        // Read as base64
        const getBase64 = (f: File): Promise<string> => {
          return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.readAsDataURL(f);
            reader.onload = () => {
              let encoded = reader.result?.toString().replace(/^data:(.*,)?/, '');
              if ((encoded?.length ?? 0) % 4 > 0) {
                encoded += '='.repeat(4 - (encoded?.length ?? 0) % 4);
              }
              resolve(encoded || '');
            };
            reader.onerror = error => reject(error);
          });
        }
        fileData = await getBase64(file);
      } else {
        isFile = false;
        mimeType = "text/plain";
        fileData = await file.text();
      }

      // Upload to our backend which uploads to Gemini File Search
      const response = await fetch("/api/upload-script", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          fileName: file.name,
          mimeType: mimeType,
          fileData: fileData,
          isFile: isFile,
          apiKey: process.env.GEMINI_API_KEY
        })
      });

      if (!response.ok) {
        const err = await response.json();
        throw new Error(err.error || "Failed to upload to File Search");
      }

      const data = await response.json();
      const fileSearchStoreName = data.fileSearchStoreName;

      await handleCreateProject(fileSearchStoreName, true);
    } catch (error: any) {
      console.error("Upload error:", error)
      toast(error.message || "Failed to upload file", "error")
    } finally {
      setIsUploading(false)
    }
  }

  return (
    <BottomSheet isOpen={isOpen} onClose={() => setOpen(false)}>
      <div className="flex flex-col h-full min-h-[300px]">
        {/* Step Indicator */}
        <div className="flex justify-center gap-2 mb-6">
          <div className={cn("w-2 h-2 rounded-full transition-all", step === 1 ? "w-4 bg-[var(--amber-500)]" : "bg-transparent border border-[var(--amber-500)]")} />
          <div className={cn("w-2 h-2 rounded-full transition-all", step === 2 ? "w-4 bg-[var(--amber-500)]" : "bg-transparent border border-[var(--amber-500)]")} />
        </div>

        <AnimatePresence mode="wait">
          {step === 1 ? (
            <motion.div
              key="step1"
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={SPRINGS.smooth}
              className="flex flex-col flex-1"
            >
              <h2 className="font-display font-semibold text-[17px] text-[var(--text-primary)] mb-6">New production</h2>
              
              <div className="mb-6">
                <Input
                  placeholder="Project Name"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className="h-[52px] text-[16px]"
                  autoFocus
                />
              </div>
              
              <div className="mb-8">
                <label className="text-[12px] font-medium text-[var(--text-secondary)] mb-[6px] block font-sans">
                  Project Type
                </label>
                <div className="flex overflow-x-auto hide-scrollbar gap-2 pb-2 -mx-4 px-4">
                  {types.map(t => (
                    <Chip
                      key={t}
                      selected={type === t}
                      onClick={() => setType(t)}
                    >
                      {t}
                    </Chip>
                  ))}
                </div>
              </div>
              
              <div className="mt-auto">
                <Button onClick={handleContinue} variant="primary">
                  Continue
                </Button>
              </div>
            </motion.div>
          ) : (
            <motion.div
              key="step2"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 20 }}
              transition={SPRINGS.smooth}
              className="flex flex-col flex-1"
            >
              <h2 className="font-display font-semibold text-[17px] text-[var(--text-primary)] mb-6">Load your script</h2>
              
              <div className="flex flex-col gap-4 mb-6">
                {/* Option A */}
                <Card className="relative overflow-hidden p-0 h-[100px] flex items-center hoverable cursor-pointer">
                  <input 
                    type="file" 
                    accept=".pdf,.txt,.md" 
                    className="absolute inset-0 opacity-0 cursor-pointer z-10"
                    onChange={handleFileUpload}
                    disabled={isUploading || isSubmitting}
                  />
                  <div className="flex items-center gap-4 px-5 w-full">
                    <div className="w-10 h-10 rounded-full bg-[var(--amber-500)]/10 flex items-center justify-center text-[var(--amber-500)]">
                      <Upload size={20} />
                    </div>
                    <div>
                      <h3 className="font-display font-semibold text-[14px] text-[var(--text-primary)]">Upload document</h3>
                      <p className="font-sans text-[12px] text-[var(--text-muted)]">PDF, TXT, or MD</p>
                    </div>
                  </div>
                  {isUploading && (
                    <div className="absolute inset-0 bg-[var(--bg-surface)]/80 backdrop-blur-sm flex items-center justify-center z-20">
                      <div className="w-6 h-6 border-2 border-[var(--amber-500)] border-t-transparent rounded-full animate-spin" />
                    </div>
                  )}
                </Card>

                {/* Option B */}
                <Card 
                  className="p-5 h-[100px] flex items-center hoverable cursor-pointer"
                  onClick={async () => {
                    const text = window.prompt("Paste your script here:")
                    if (text) {
                      setIsUploading(true);
                      try {
                        const response = await fetch("/api/upload-script", {
                          method: "POST",
                          headers: { "Content-Type": "application/json" },
                          body: JSON.stringify({
                            fileName: "pasted-script.txt",
                            mimeType: "text/plain",
                            fileData: text,
                            isFile: false,
                            apiKey: process.env.GEMINI_API_KEY
                          })
                        });
                        if (!response.ok) throw new Error("Upload failed");
                        const data = await response.json();
                        await handleCreateProject(data.fileSearchStoreName, true);
                      } catch (err: any) {
                        toast(err.message, "error");
                      } finally {
                        setIsUploading(false);
                      }
                    }
                  }}
                >
                  <div className="flex items-center gap-4 w-full">
                    <div className="w-10 h-10 rounded-full bg-[var(--amber-500)]/10 flex items-center justify-center text-[var(--amber-500)]">
                      <FileText size={20} />
                    </div>
                    <div>
                      <h3 className="font-display font-semibold text-[14px] text-[var(--text-primary)]">Write or paste script</h3>
                      <p className="font-sans text-[12px] text-[var(--text-muted)]">Paste your full prompt or describe scenes</p>
                    </div>
                  </div>
                </Card>
              </div>
              
              <div className="mt-auto">
                <Button onClick={() => setStep(1)} variant="ghost">
                  Back
                </Button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </BottomSheet>
  )
}
