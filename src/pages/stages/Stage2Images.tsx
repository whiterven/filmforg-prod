import * as React from "react"
import { motion, AnimatePresence } from "motion/react"
import { Camera } from "lucide-react"
import { db, auth } from "@/src/firebase"
import { collection, query, where, onSnapshot, updateDoc, doc, serverTimestamp } from "firebase/firestore"
import { GoogleGenAI } from "@google/genai"

import { AgentStatusCard } from "@/src/components/ui/AgentStatusCard"
import { Card } from "@/src/components/ui/Card"
import { Button } from "@/src/components/ui/Button"
import { Badge } from "@/src/components/ui/Badge"
import { Input } from "@/src/components/ui/Input"
import { Skeleton } from "@/src/components/ui/Skeleton"
import { Toggle } from "@/src/components/ui/Toggle"
import { Chip } from "@/src/components/ui/Chip"
import { SPRINGS } from "@/src/lib/constants"
import { useToast } from "@/src/components/ui/Toast"
import { cn } from "@/src/lib/utils"

export default function Stage2Images({ project }: { project: any }) {
  const { toast } = useToast()
  const [shots, setShots] = React.useState<any[]>([])
  const [agentState, setAgentState] = React.useState<"working" | "complete" | "error">("working")
  const [agentStatusText, setAgentStatusText] = React.useState("Initializing Image Agent…")
  
  const [currentShotIndex, setCurrentShotIndex] = React.useState(0)
  const [isGenerating, setIsGenerating] = React.useState(false)
  const [showRegenInput, setShowRegenInput] = React.useState(false)
  const [regenNote, setRegenNote] = React.useState("")
  const [isApprovedAnimation, setIsApprovedAnimation] = React.useState(false)
  const [aspectRatio, setAspectRatio] = React.useState("16:9")

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

  const pendingShots = shots.filter(s => s.status === "pending" || s.status === "generating_image" || s.status === "image_ready")
  const approvedShots = shots.filter(s => s.status === "image_approved" || s.status === "video_ready" || s.status === "video_approved" || s.status === "generating_video")
  const skippedShots = shots.filter(s => s.status === "skipped")
  
  const currentShot = pendingShots[0]

  React.useEffect(() => {
    if (currentShot && currentShot.status === "pending" && !isGenerating) {
      generateImage(currentShot)
    } else if (!currentShot && shots.length > 0 && pendingShots.length === 0) {
      setAgentState("complete")
      setAgentStatusText("All images processed")
    }
  }, [currentShot, isGenerating, shots.length])

  const generateImage = async (shot: any, note?: string) => {
    setIsGenerating(true)
    setAgentState("working")
    setAgentStatusText(`Generating image ${shot.shotNumber} of ${shots.length}…`)
    
    try {
      await updateDoc(doc(db, "projects", project.id, "shots", shot.id), {
        status: "generating_image",
        updatedAt: serverTimestamp()
      })

      const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY })
      
      let prompt = shot.imagePrompt
      if (note) {
        prompt += `\n\nAdditional instructions: ${note}`
      }

      // Using gemini-3.1-flash-image-preview as per instructions
      const response = await ai.models.generateImages({
        model: "gemini-3.1-flash-image-preview",
        prompt: prompt,
        config: {
          numberOfImages: 1,
          aspectRatio: aspectRatio,
          outputMimeType: "image/jpeg"
        }
      })

      const base64Image = response.generatedImages[0].image.imageBytes
      const imageUrl = `data:image/jpeg;base64,${base64Image}`

      await updateDoc(doc(db, "projects", project.id, "shots", shot.id), {
        status: "image_ready",
        imageUrl: imageUrl,
        updatedAt: serverTimestamp()
      })
      
      setAgentState("complete")
      setAgentStatusText("Waiting for approval")
    } catch (error: any) {
      console.error("Error generating image:", error)
      setAgentState("error")
      setAgentStatusText("Failed to generate image")
      toast(error.message || "Failed to generate image", "error")
    } finally {
      setIsGenerating(false)
      setShowRegenInput(false)
      setRegenNote("")
    }
  }

  const handleApprove = async () => {
    if (!currentShot) return
    setIsApprovedAnimation(true)
    
    // Wait for animation
    setTimeout(async () => {
      try {
        await updateDoc(doc(db, "projects", project.id, "shots", currentShot.id), {
          status: "image_approved",
          updatedAt: serverTimestamp()
        })
        
        // Update project stats
        await updateDoc(doc(db, "projects", project.id), {
          "stats.approvedImages": approvedShots.length + 1,
          updatedAt: serverTimestamp()
        })
      } catch (error) {
        toast("Failed to approve image", "error")
      } finally {
        setIsApprovedAnimation(false)
      }
    }, 700)
  }

  const handleSkip = async () => {
    if (!currentShot) return
    try {
      await updateDoc(doc(db, "projects", project.id, "shots", currentShot.id), {
        status: "skipped",
        updatedAt: serverTimestamp()
      })
      await updateDoc(doc(db, "projects", project.id), {
        "stats.skippedShots": skippedShots.length + 1,
        updatedAt: serverTimestamp()
      })
    } catch (error) {
      toast("Failed to skip shot", "error")
    }
  }

  const handleAdvanceToVideo = async () => {
    try {
      await updateDoc(doc(db, "projects", project.id), {
        stage: 3,
        updatedAt: serverTimestamp()
      })
      toast("Video generation unlocked.", "success")
    } catch (error) {
      toast("Failed to advance stage", "error")
    }
  }

  return (
    <div className="flex flex-col min-h-full pb-24">
      <div className="p-4 shrink-0">
        <AgentStatusCard
          agentName="Image Agent"
          statusText={agentStatusText}
          state={agentState}
          icon={<Camera size={20} />}
          onRetry={() => currentShot && generateImage(currentShot)}
        />
        
        <div className="mt-4 flex items-center justify-between bg-[var(--bg-surface)] p-3 rounded-[12px] border border-[var(--border-subtle)]">
          <span className="font-sans text-[12px] font-medium text-[var(--text-secondary)]">Aspect Ratio</span>
          <div className="flex gap-2">
            {["16:9", "1:1", "9:16"].map(ratio => (
              <Chip 
                key={ratio} 
                selected={aspectRatio === ratio} 
                onClick={() => setAspectRatio(ratio)}
              >
                {ratio}
              </Chip>
            ))}
          </div>
        </div>

        <div className="mt-6 mb-2 text-center">
          <p className="font-sans text-[13px] text-[var(--text-secondary)]">
            {approvedShots.length} approved · {skippedShots.length} skipped · {pendingShots.length} remaining
          </p>
          <div className="h-1 bg-[var(--bg-surface)] rounded-full mt-3 overflow-hidden">
            <motion.div 
              className="h-full bg-amber-gradient"
              initial={{ width: 0 }}
              animate={{ width: `${(approvedShots.length / Math.max(1, shots.length)) * 100}%` }}
              transition={SPRINGS.smooth}
            />
          </div>
        </div>
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
                  <Badge variant="amber">Shot {currentShot.shotNumber} of {shots.length}</Badge>
                </div>
                
                <p className="font-sans text-[14px] text-[var(--text-secondary)] line-clamp-2 mb-2 relative z-20">
                  {currentShot.description}
                </p>
                <p className="font-sans text-[12px] text-[var(--text-muted)] truncate mb-4 relative z-20">
                  {currentShot.imagePrompt}
                </p>

                <div className="w-full aspect-video rounded-[12px] overflow-hidden bg-[var(--bg-void)] relative z-20 mb-6">
                  {currentShot.status === "generating_image" || !currentShot.imageUrl ? (
                    <Skeleton className="w-full h-full" />
                  ) : (
                    <img 
                      src={currentShot.imageUrl} 
                      alt={`Shot ${currentShot.shotNumber}`}
                      className="w-full h-full object-cover"
                      referrerPolicy="no-referrer"
                    />
                  )}
                </div>

                <div className="mt-auto relative z-20 flex flex-col gap-2">
                  {currentShot.status === "generating_image" ? (
                    <div className="text-center py-4">
                      <p className="font-sans text-[13px] text-[var(--text-secondary)] mb-2">Image Agent is working…</p>
                      <div className="w-8 h-8 rounded-full bg-[var(--amber-500)]/20 text-[var(--amber-500)] flex items-center justify-center mx-auto animate-[agent-pulse_2s_ease-out_infinite]">
                        <Camera size={16} />
                      </div>
                    </div>
                  ) : (
                    <>
                      <Button onClick={handleApprove} variant="approve" className="w-full shadow-[0_0_0_1px_rgba(20,184,166,0.3),0_8px_32px_rgba(20,184,166,0.15)]">
                        Approve this image
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
                            <Button onClick={() => generateImage(currentShot, regenNote)} variant="primary" className="flex-1">
                              Regenerate
                            </Button>
                          </div>
                        </div>
                      )}
                      
                      <Button onClick={handleSkip} variant="ghost" className="w-full text-[var(--rose-500)] hover:bg-[var(--rose-500)]/10">
                        Skip this shot
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
                  {approvedShots.length} images approved
                </h2>
                <p className="font-sans text-[14px] text-[var(--text-secondary)] mb-8">
                  {skippedShots.length} shots skipped
                </p>
                <Button onClick={handleAdvanceToVideo} variant="primary" className="w-full shadow-[var(--shadow-amber-glow)]">
                  Begin video generation
                </Button>
              </Card>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Approved Images Strip */}
      {approvedShots.length > 0 && (
        <div className="fixed bottom-0 left-0 right-0 h-[80px] bg-[var(--bg-surface)]/90 backdrop-blur-[20px] border-t border-[var(--border-subtle)] z-20 pb-safe px-4 flex items-center overflow-x-auto hide-scrollbar gap-3">
          {approvedShots.map(shot => (
            <div key={shot.id} className="shrink-0 flex flex-col items-center gap-1">
              <div className="w-[56px] h-[40px] rounded-[8px] overflow-hidden border-[1.5px] border-[var(--teal-500)]">
                <img src={shot.imageUrl} alt="" className="w-full h-full object-cover" />
              </div>
              <span className="font-sans text-[10px] text-[var(--text-muted)]">Shot {shot.shotNumber}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
