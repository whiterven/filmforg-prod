import * as React from "react"
import { motion } from "motion/react"
import { FileText } from "lucide-react"
import { db, auth } from "@/src/firebase"
import { collection, query, where, onSnapshot, updateDoc, doc, addDoc, serverTimestamp, writeBatch } from "firebase/firestore"
import { GoogleGenAI } from "@google/genai"

import { AgentStatusCard } from "@/src/components/ui/AgentStatusCard"
import { Card } from "@/src/components/ui/Card"
import { Badge } from "@/src/components/ui/Badge"
import { Button } from "@/src/components/ui/Button"
import { BottomSheet } from "@/src/components/ui/BottomSheet"
import { Input } from "@/src/components/ui/Input"
import { SPRINGS } from "@/src/lib/constants"
import { useToast } from "@/src/components/ui/Toast"

export default function Stage1Script({ project }: { project: any }) {
  const { toast } = useToast()
  const [shots, setShots] = React.useState<any[]>([])
  const [agentState, setAgentState] = React.useState<"working" | "complete" | "error">("working")
  const [agentStatusText, setAgentStatusText] = React.useState("Reading your script…")
  
  const [selectedShot, setSelectedShot] = React.useState<any>(null)
  const [isEditSheetOpen, setIsEditSheetOpen] = React.useState(false)

  // Listen to shots
  React.useEffect(() => {
    if (!project?.id) return
    const q = query(collection(db, "projects", project.id, "shots"))
    const unsub = onSnapshot(q, (snap) => {
      const shotsData: any[] = []
      snap.forEach(d => shotsData.push({ id: d.id, ...d.data() }))
      shotsData.sort((a, b) => a.shotNumber - b.shotNumber)
      setShots(shotsData)
      
      if (shotsData.length > 0) {
        setAgentState("complete")
        setAgentStatusText(`Extracted ${shotsData.length} shots`)
      }
    })
    return () => unsub()
  }, [project?.id])

  // Process script if no shots exist
  React.useEffect(() => {
    if (project && shots.length === 0 && agentState === "working") {
      processScript()
    }
  }, [project, shots.length])

  const processScript = async () => {
    try {
      setAgentStatusText("Analyzing scenes and characters with File Search…")
      
      const payload = { 
        fileSearchStoreName: project.scriptContent,
        apiKey: process.env.GEMINI_API_KEY
      }

      const response = await fetch("/api/analyze-script", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || "Failed to analyze script")
      }

      const data = await response.json()
      const resultText = data.result
      
      // Clean up markdown formatting if present
      const cleanJson = resultText.replace(/```json\n?|\n?```/g, '').trim()
      const extractedShots = JSON.parse(cleanJson)
      
      setAgentStatusText("Saving shot list…")
      
      // Save to Firestore using batch
      const batch = writeBatch(db)
      extractedShots.forEach((shot: any, index: number) => {
        const shotRef = doc(collection(db, "projects", project.id, "shots"))
        batch.set(shotRef, {
          projectId: project.id,
          ownerId: auth.currentUser?.uid,
          shotNumber: index + 1,
          sceneReference: shot.sceneReference || `Scene ${index + 1}`,
          description: shot.description || "",
          characters: shot.characters || [],
          location: shot.location || "",
          imagePrompt: shot.imagePrompt || "",
          videoPrompt: shot.videoPrompt || "",
          durationEstimate: shot.durationEstimate || "~4 sec",
          status: "pending",
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp()
        })
      })
      
      await batch.commit()
      
      // Update project stats
      await updateDoc(doc(db, "projects", project.id), {
        "stats.totalShots": extractedShots.length,
        updatedAt: serverTimestamp()
      })
      
    } catch (error: any) {
      console.error("Error processing script:", error)
      setAgentState("error")
      setAgentStatusText(error.message || "Failed to analyze script")
    }
  }

  const handleApproveShotList = async () => {
    try {
      await updateDoc(doc(db, "projects", project.id), {
        stage: 2,
        updatedAt: serverTimestamp()
      })
      toast("Shot list approved. Image generation unlocked.", "success")
    } catch (error: any) {
      toast("Failed to approve shot list", "error")
    }
  }

  const handleSaveShotEdits = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!selectedShot) return
    
    try {
      await updateDoc(doc(db, "projects", project.id, "shots", selectedShot.id), {
        imagePrompt: selectedShot.imagePrompt,
        videoPrompt: selectedShot.videoPrompt,
        updatedAt: serverTimestamp()
      })
      setIsEditSheetOpen(false)
      toast("Shot prompts updated", "success")
    } catch (error) {
      toast("Failed to update shot", "error")
    }
  }

  const getStatusBadge = (status: string) => {
    if (status.includes("approved") || status.includes("ready")) return <Badge variant="completed">Approved</Badge>
    if (status === "skipped") return <Badge variant="error">Skipped</Badge>
    return <Badge variant="draft">Pending</Badge>
  }

  return (
    <div className="flex flex-col min-h-full pb-24">
      <div className="p-4">
        <AgentStatusCard
          agentName="Script Agent"
          statusText={agentStatusText}
          state={agentState}
          icon={<FileText size={20} />}
          onRetry={processScript}
        />
      </div>

      {agentState === "complete" && shots.length > 0 && (
        <div className="px-4 flex-1">
          <div className="text-micro text-[var(--text-muted)] mb-4">
            SHOT LIST — {shots.length} SHOTS
          </div>
          
          <div className="flex flex-col gap-3">
            {shots.map((shot, index) => (
              <motion.div
                key={shot.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ ...SPRINGS.gentle, delay: index * 0.05 }}
              >
                <Card className="p-4 border-l-[3px] border-l-[var(--amber-500)]">
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex items-center gap-2">
                      <Badge variant="amber" className="shrink-0">Shot {shot.shotNumber}</Badge>
                      {getStatusBadge(shot.status)}
                    </div>
                    <span className="font-sans text-[12px] text-[var(--text-muted)] truncate ml-2">
                      {shot.sceneReference}
                    </span>
                  </div>
                  
                  <div className="flex flex-wrap gap-1.5 mb-3">
                    {shot.characters?.map((char: string, i: number) => (
                      <span key={i} className="inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-bold uppercase tracking-[1.2px] bg-[var(--amber-500)]/12 text-[var(--amber-500)]">
                        {char}
                      </span>
                    ))}
                    {shot.location && (
                      <span className="inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-bold uppercase tracking-[1.2px] bg-[var(--teal-500)]/12 text-[var(--teal-500)]">
                        {shot.location}
                      </span>
                    )}
                  </div>
                  
                  <p className="font-sans text-[13px] text-[var(--text-secondary)] line-clamp-2 mb-3">
                    {shot.imagePrompt}
                  </p>
                  
                  <div className="flex items-center justify-between">
                    <button 
                      onClick={() => {
                        setSelectedShot(shot)
                        setIsEditSheetOpen(true)
                      }}
                      className="font-sans text-[13px] font-semibold text-[var(--amber-500)] hover:text-[var(--amber-400)] transition-colors"
                    >
                      Edit prompts
                    </button>
                    <span className="font-sans text-[11px] text-[var(--text-muted)]">
                      {shot.durationEstimate}
                    </span>
                  </div>
                </Card>
              </motion.div>
            ))}
          </div>
        </div>
      )}

      {/* Bottom Action Bar */}
      {agentState === "complete" && shots.length > 0 && (
        <div className="fixed bottom-0 left-0 right-0 p-4 bg-[var(--bg-base)]/90 backdrop-blur-[20px] border-t border-[var(--border-subtle)] z-20 pb-safe">
          <Button onClick={handleApproveShotList} variant="primary" className="mb-1 shadow-[var(--shadow-amber-glow)]">
            Approve shot list — begin imaging
          </Button>
          <p className="text-center font-sans text-[11px] text-[var(--text-muted)] mt-2">
            {shots.length} shots ready to generate
          </p>
        </div>
      )}

      {/* Edit Sheet */}
      <BottomSheet isOpen={isEditSheetOpen} onClose={() => setIsEditSheetOpen(false)}>
        {selectedShot && (
          <form onSubmit={handleSaveShotEdits} className="flex flex-col h-full">
            <div className="flex items-center justify-between mb-6">
              <h2 className="font-display font-semibold text-[17px] text-[var(--text-primary)]">
                Edit Shot {selectedShot.shotNumber}
              </h2>
              <Badge variant="amber">{selectedShot.durationEstimate}</Badge>
            </div>
            
            <div className="flex flex-col gap-6 mb-8">
              <div>
                <label className="text-[12px] font-medium text-[var(--text-secondary)] mb-[6px] block font-sans">
                  Image Prompt (Reference Frame)
                </label>
                <textarea
                  className="w-full rounded-[12px] border border-[var(--border-subtle)] bg-[var(--bg-void)] px-4 py-3 text-[14px] text-[var(--text-primary)] font-sans min-h-[120px] focus-visible:outline-none focus-visible:border-[var(--border-glow)] focus-visible:shadow-[0_0_0_3px_rgba(245,158,11,0.12)] transition-all resize-none"
                  value={selectedShot.imagePrompt}
                  onChange={(e) => setSelectedShot({...selectedShot, imagePrompt: e.target.value})}
                />
              </div>
              
              <div>
                <label className="text-[12px] font-medium text-[var(--text-secondary)] mb-[6px] block font-sans">
                  Video Prompt (Motion & Action)
                </label>
                <textarea
                  className="w-full rounded-[12px] border border-[var(--border-subtle)] bg-[var(--bg-void)] px-4 py-3 text-[14px] text-[var(--text-primary)] font-sans min-h-[120px] focus-visible:outline-none focus-visible:border-[var(--border-glow)] focus-visible:shadow-[0_0_0_3px_rgba(245,158,11,0.12)] transition-all resize-none"
                  value={selectedShot.videoPrompt}
                  onChange={(e) => setSelectedShot({...selectedShot, videoPrompt: e.target.value})}
                />
              </div>
            </div>
            
            <div className="mt-auto">
              <Button type="submit" variant="primary">
                Save changes
              </Button>
            </div>
          </form>
        )}
      </BottomSheet>
    </div>
  )
}
