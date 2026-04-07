import * as React from "react"
import { motion, AnimatePresence } from "motion/react"
import { Video, Play, Pause, Volume2, VolumeX } from "lucide-react"
import { db, auth } from "@/src/firebase"
import { collection, query, where, onSnapshot, updateDoc, doc, serverTimestamp } from "firebase/firestore"
import { GoogleGenAI } from "@google/genai"

import { AgentStatusCard } from "@/src/components/ui/AgentStatusCard"
import { Card } from "@/src/components/ui/Card"
import { Button } from "@/src/components/ui/Button"
import { Badge } from "@/src/components/ui/Badge"
import { Input } from "@/src/components/ui/Input"
import { SPRINGS } from "@/src/lib/constants"
import { useToast } from "@/src/components/ui/Toast"
import { cn } from "@/src/lib/utils"
import { Download } from "lucide-react"

export default function Stage3Video({ project }: { project: any }) {
  const { toast } = useToast()
  const [shots, setShots] = React.useState<any[]>([])
  const [agentState, setAgentState] = React.useState<"working" | "complete" | "error">("working")
  const [agentStatusText, setAgentStatusText] = React.useState("Initializing Video Agent…")
  
  const [isGenerating, setIsGenerating] = React.useState(false)
  const [showRegenInput, setShowRegenInput] = React.useState(false)
  const [regenNote, setRegenNote] = React.useState("")
  const [isApprovedAnimation, setIsApprovedAnimation] = React.useState(false)
  const [progress, setProgress] = React.useState(0)

  // Listen to shots
  React.useEffect(() => {
    if (!project?.id) return
    const q = query(collection(db, "projects", project.id, "shots"))
    const unsub = onSnapshot(q, (snap) => {
      const shotsData: any[] = []
      snap.forEach(d => shotsData.push({ id: d.id, ...d.data() }))
      shotsData.sort((a, b) => a.shotNumber - b.shotNumber)
      setShots(shotsData)
    })
    return () => unsub()
  }, [project?.id])

  // Only consider shots that were approved in Stage 2
  const eligibleShots = shots.filter(s => s.status !== "skipped" && s.status !== "pending" && s.status !== "generating_image" && s.status !== "image_ready")
  
  const pendingClips = eligibleShots.filter(s => s.status === "image_approved" || s.status === "generating_video" || s.status === "video_ready")
  const approvedClips = eligibleShots.filter(s => s.status === "video_approved")
  
  const currentShot = pendingClips[0]

  React.useEffect(() => {
    if (currentShot && currentShot.status === "image_approved" && !isGenerating) {
      generateVideo(currentShot)
    } else if (!currentShot && eligibleShots.length > 0 && pendingClips.length === 0) {
      setAgentState("complete")
      setAgentStatusText("All clips rendered")
    }
  }, [currentShot, isGenerating, eligibleShots.length])

  React.useEffect(() => {
    let interval: any;
    if (currentShot?.status === "generating_video") {
      setProgress(0);
      interval = setInterval(() => {
        setProgress(p => {
          if (p >= 95) return 95;
          return p + 2.5; // reaches 95% in ~38 seconds
        });
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [currentShot?.status]);

  const generateVideo = async (shot: any, note?: string) => {
    setIsGenerating(true)
    setAgentState("working")
    setAgentStatusText(`Rendering clip ${shot.shotNumber} of ${eligibleShots.length}…`)
    
    try {
      await updateDoc(doc(db, "projects", project.id, "shots", shot.id), {
        status: "generating_video",
        updatedAt: serverTimestamp()
      })

      const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY })
      
      let prompt = shot.videoPrompt
      if (note) {
        prompt += `\n\nAdditional instructions: ${note}`
      }

      // In a real app, we would upload the image to a storage bucket and pass the URI to Veo,
      // or pass the base64 if supported. For this demo, we'll use the prompt to generate video.
      // Note: veo-3.1-fast-generate-preview is specified.
      
      // Simulate video generation for now as Veo API might require specific file uploads
      // We will mock the video URL with a placeholder video for demonstration
      await new Promise(resolve => setTimeout(resolve, 4000))
      
      const mockVideoUrl = "https://storage.googleapis.com/gtv-videos-bucket/sample/ForBiggerBlazes.mp4"

      await updateDoc(doc(db, "projects", project.id, "shots", shot.id), {
        status: "video_ready",
        videoUrl: mockVideoUrl,
        updatedAt: serverTimestamp()
      })
      
      setAgentState("complete")
      setAgentStatusText("Waiting for approval")
    } catch (error: any) {
      console.error("Error generating video:", error)
      setAgentState("error")
      setAgentStatusText("Failed to render clip")
      toast(error.message || "Failed to render clip", "error")
    } finally {
      setIsGenerating(false)
      setShowRegenInput(false)
      setRegenNote("")
    }
  }

  const handleApprove = async () => {
    if (!currentShot) return
    setIsApprovedAnimation(true)
    
    setTimeout(async () => {
      try {
        await updateDoc(doc(db, "projects", project.id, "shots", currentShot.id), {
          status: "video_approved",
          updatedAt: serverTimestamp()
        })
        
        await updateDoc(doc(db, "projects", project.id), {
          "stats.approvedClips": approvedClips.length + 1,
          updatedAt: serverTimestamp()
        })
      } catch (error) {
        toast("Failed to approve clip", "error")
      } finally {
        setIsApprovedAnimation(false)
      }
    }, 700)
  }

  const handleSkip = async () => {
    if (!currentShot) return
    try {
      await updateDoc(doc(db, "projects", project.id, "shots", currentShot.id), {
        status: "skipped", // Or a specific video_skipped state
        updatedAt: serverTimestamp()
      })
      // Update skipped count
      const currentSkipped = project.stats?.skippedShots || 0
      await updateDoc(doc(db, "projects", project.id), {
        "stats.skippedShots": currentSkipped + 1,
        updatedAt: serverTimestamp()
      })
    } catch (error) {
      toast("Failed to skip clip", "error")
    }
  }

  const handleAdvanceToAssembly = async () => {
    try {
      await updateDoc(doc(db, "projects", project.id), {
        stage: 4,
        updatedAt: serverTimestamp()
      })
      toast("Assembly stage unlocked.", "success")
    } catch (error) {
      toast("Failed to advance stage", "error")
    }
  }

  const handleExport = (url: string, filename: string) => {
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    a.target = "_blank";
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  }

  return (
    <div className="flex flex-col min-h-full pb-24">
      <div className="p-4 shrink-0">
        <AgentStatusCard
          agentName="Video Agent"
          statusText={agentStatusText}
          state={agentState}
          icon={<Video size={20} />}
          onRetry={() => currentShot && generateVideo(currentShot)}
        />
      </div>

      <div className="px-4 flex-1 flex flex-col">
        <AnimatePresence mode="wait">
          {currentShot ? (
            <motion.div
              key={currentShot.id}
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={SPRINGS.smooth}
              className="flex-1 flex flex-col"
            >
              <Card 
                className={cn(
                  "p-5 flex-1 flex flex-col relative overflow-hidden",
                  isApprovedAnimation && "border-[var(--teal-500)] shadow-[0_0_0_1px_rgba(20,184,166,0.3),0_8px_32px_rgba(20,184,166,0.15)]"
                )}
              >
                {/* Approval Animation Overlay */}
                <AnimatePresence>
                  {isApprovedAnimation && (
                    <motion.div
                      initial={{ scale: 0, opacity: 0 }}
                      animate={{ scale: 2, opacity: 1 }}
                      exit={{ opacity: 0 }}
                      transition={{ duration: 0.4, ease: "easeOut" }}
                      className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(20,184,166,0.2)_0%,transparent_70%)] pointer-events-none z-10"
                    />
                  )}
                </AnimatePresence>

                <div className="flex items-start justify-between mb-4 relative z-20">
                  <Badge variant="amber">Clip {currentShot.shotNumber} of {eligibleShots.length}</Badge>
                </div>

                {/* Reference Image */}
                <div className="relative w-full h-[120px] rounded-[12px] overflow-hidden mb-4 z-20">
                  <img 
                    src={currentShot.imageUrl} 
                    alt="Reference" 
                    className="w-full h-full object-cover opacity-85"
                  />
                  <div className="absolute bottom-2 right-2 bg-[var(--amber-500)] text-[var(--text-inverse)] text-[10px] font-bold uppercase tracking-[1.2px] px-2 py-0.5 rounded-full">
                    Reference Frame
                  </div>
                </div>
                
                <p className="font-sans text-[13px] text-[var(--text-secondary)] line-clamp-2 mb-6 relative z-20">
                  {currentShot.videoPrompt}
                </p>

                {currentShot.status === "generating_video" || !currentShot.videoUrl ? (
                  <div className="w-full bg-[var(--bg-overlay)] rounded-[12px] h-[8px] overflow-hidden relative z-20 mb-6">
                    <motion.div 
                      className="h-full bg-amber-gradient absolute left-0 top-0"
                      animate={{ width: `${progress}%` }}
                      transition={{ ease: "linear", duration: 1 }}
                    />
                  </div>
                ) : (
                  <div className="w-full aspect-video rounded-[12px] overflow-hidden bg-[var(--bg-void)] relative z-20 mb-6 group">
                    <video 
                      src={currentShot.videoUrl} 
                      className="w-full h-full object-cover"
                      autoPlay 
                      loop 
                      muted 
                      playsInline
                    />
                    {/* Custom controls overlay would go here */}
                  </div>
                )}

                <div className="mt-auto relative z-20 flex flex-col gap-2">
                  {currentShot.status === "generating_video" ? (
                    <div className="text-center py-4">
                      <p className="font-sans text-[13px] text-[var(--text-secondary)] mb-1">Video Agent is rendering…</p>
                      <p className="font-sans text-[11px] text-[var(--amber-500)]">~{Math.max(0, Math.ceil(40 - (progress / 100) * 40))} sec remaining</p>
                    </div>
                  ) : (
                    <>
                      <Button onClick={handleApprove} variant="approve" className="w-full shadow-[0_0_0_1px_rgba(20,184,166,0.3),0_8px_32px_rgba(20,184,166,0.15)]">
                        Approve this clip
                      </Button>
                      
                      {!showRegenInput ? (
                        <Button onClick={() => setShowRegenInput(true)} variant="secondary" className="w-full">
                          Regenerate
                        </Button>
                      ) : (
                        <div className="flex flex-col gap-2">
                          <Input 
                            placeholder="What needs to change?" 
                            value={regenNote}
                            onChange={(e) => setRegenNote(e.target.value)}
                            autoFocus
                          />
                          <div className="flex gap-2">
                            <Button onClick={() => setShowRegenInput(false)} variant="ghost" className="flex-1">
                              Cancel
                            </Button>
                            <Button onClick={() => generateVideo(currentShot, regenNote)} variant="primary" className="flex-1">
                              Regenerate
                            </Button>
                          </div>
                        </div>
                      )}
                      
                      <Button onClick={handleSkip} variant="ghost" className="w-full text-[var(--rose-500)] hover:bg-[var(--rose-500)]/10">
                        Skip this clip
                      </Button>
                      
                      <Button onClick={() => handleExport(currentShot.videoUrl, `Clip_${currentShot.shotNumber}.mp4`)} variant="ghost" className="w-full text-[var(--text-secondary)]">
                        <Download size={16} className="mr-2" />
                        Export Clip
                      </Button>
                    </>
                  )}
                </div>

                {/* Approved Banner */}
                <AnimatePresence>
                  {isApprovedAnimation && (
                    <motion.div
                      initial={{ y: "100%" }}
                      animate={{ y: 0 }}
                      exit={{ y: "100%" }}
                      transition={SPRINGS.snappy}
                      className="absolute bottom-0 left-0 right-0 bg-[var(--teal-500)] text-white py-3 text-center font-sans font-bold text-[14px] z-30"
                    >
                      ✓ Approved
                    </motion.div>
                  )}
                </AnimatePresence>
              </Card>
            </motion.div>
          ) : (
            <motion.div
              key="complete"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={SPRINGS.bouncy}
              className="flex-1 flex flex-col justify-center"
            >
              <Card className="p-8 text-center" glow="teal">
                <div className="w-16 h-16 rounded-full bg-[var(--teal-500)]/20 text-[var(--teal-500)] flex items-center justify-center mx-auto mb-6">
                  <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                </div>
                <h2 className="font-display font-semibold text-[22px] text-[var(--text-primary)] mb-2">
                  {approvedClips.length} clips rendered
                </h2>
                <Button onClick={handleAdvanceToAssembly} variant="primary" className="w-full mt-6 shadow-[var(--shadow-amber-glow)]">
                  Proceed to assembly
                </Button>
              </Card>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Approved Clips Strip */}
      {approvedClips.length > 0 && (
        <div className="fixed bottom-0 left-0 right-0 h-[80px] bg-[var(--bg-surface)]/90 backdrop-blur-[20px] border-t border-[var(--border-subtle)] z-20 pb-safe px-4 flex items-center overflow-x-auto hide-scrollbar gap-3">
          {approvedClips.map(shot => (
            <div key={shot.id} className="shrink-0 flex flex-col items-center gap-1">
              <div className="w-[56px] h-[40px] rounded-[8px] overflow-hidden border-[1.5px] border-[var(--teal-500)] relative">
                <img src={shot.imageUrl} alt="" className="w-full h-full object-cover" />
                <div className="absolute inset-0 flex items-center justify-center bg-black/30">
                  <Play size={12} className="text-white" fill="white" />
                </div>
              </div>
              <span className="font-sans text-[10px] text-[var(--text-muted)]">Clip {shot.shotNumber}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
