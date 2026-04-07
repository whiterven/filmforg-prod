import * as React from "react"
import { motion, Reorder } from "motion/react"
import { Layers, GripVertical, Download, Play } from "lucide-react"
import { db } from "@/src/firebase"
import { collection, query, onSnapshot, updateDoc, doc, serverTimestamp } from "firebase/firestore"

import { AgentStatusCard } from "@/src/components/ui/AgentStatusCard"
import { Card } from "@/src/components/ui/Card"
import { Button } from "@/src/components/ui/Button"
import { Badge } from "@/src/components/ui/Badge"
import { SPRINGS } from "@/src/lib/constants"
import { useToast } from "@/src/components/ui/Toast"
import { X } from "lucide-react"

export default function Stage4Assembly({ project }: { project: any }) {
  const { toast } = useToast()
  const [shots, setShots] = React.useState<any[]>([])
  const [clips, setClips] = React.useState<any[]>([])
  const [isComplete, setIsComplete] = React.useState(project.status === "completed")
  const [previewClip, setPreviewClip] = React.useState<any | null>(null)

  React.useEffect(() => {
    if (!project?.id) return
    const q = query(collection(db, "projects", project.id, "shots"))
    const unsub = onSnapshot(q, (snap) => {
      const shotsData: any[] = []
      snap.forEach(d => shotsData.push({ id: d.id, ...d.data() }))
      shotsData.sort((a, b) => a.shotNumber - b.shotNumber)
      setShots(shotsData)
      
      // Filter only approved clips
      const approved = shotsData.filter(s => s.status === "video_approved")
      setClips(approved)
    })
    return () => unsub()
  }, [project?.id])

  const handleComplete = async () => {
    try {
      await updateDoc(doc(db, "projects", project.id), {
        status: "completed",
        updatedAt: serverTimestamp()
      })
      setIsComplete(true)
      toast("Production completed!", "success")
    } catch (error) {
      toast("Failed to complete production", "error")
    }
  }

  const handleDownloadManifest = () => {
    const manifest = {
      projectId: project.id,
      title: project.title,
      clips: clips.map(c => ({
        shotNumber: c.shotNumber,
        sceneReference: c.sceneReference,
        videoUrl: c.videoUrl,
        duration: c.durationEstimate
      }))
    }
    
    const blob = new Blob([JSON.stringify(manifest, null, 2)], { type: "application/json" })
    const url = URL.createObjectURL(blob)
    const a = document.createElement("a")
    a.href = url
    a.download = `${project.title.replace(/\s+/g, "_")}_manifest.json`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
  }

  if (isComplete) {
    return (
      <div className="flex flex-col min-h-full items-center justify-center p-6 relative overflow-hidden">
        {/* Confetti effect (simple CSS implementation) */}
        <div className="absolute inset-0 pointer-events-none overflow-hidden">
          {[...Array(20)].map((_, i) => (
            <motion.div
              key={i}
              initial={{ y: "100vh", x: "50vw", opacity: 1 }}
              animate={{ 
                y: "-10vh", 
                x: `${Math.random() * 100}vw`,
                rotate: Math.random() * 360
              }}
              transition={{ 
                duration: 2 + Math.random() * 2, 
                ease: "easeOut",
                delay: Math.random() * 0.5
              }}
              className="absolute w-2 h-2 rounded-full"
              style={{
                backgroundColor: Math.random() > 0.5 ? "var(--amber-500)" : "var(--teal-500)"
              }}
            />
          ))}
        </div>

        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={SPRINGS.bouncy}
          className="text-[var(--amber-500)] opacity-80 mb-6"
        >
          <span className="font-display font-bold text-[80px] tracking-tighter leading-none">FF</span>
        </motion.div>
        
        <motion.h1 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ ...SPRINGS.gentle, delay: 0.2 }}
          className="font-display font-bold text-[28px] text-[var(--text-primary)] mb-4 text-center"
        >
          Production Complete
        </motion.h1>
        
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ ...SPRINGS.bouncy, delay: 0.4 }}
        >
          <Badge variant="completed" className="px-4 py-1 text-[12px]">
            All {clips.length} clips ready
          </Badge>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ ...SPRINGS.gentle, delay: 0.6 }}
          className="w-full max-w-[300px] mt-12 flex flex-col gap-4"
        >
          <Button onClick={handleDownloadManifest} variant="primary" className="w-full">
            Download clip manifest
          </Button>
          <Button variant="secondary" className="w-full">
            Browse all clips
          </Button>
        </motion.div>
      </div>
    )
  }

  return (
    <div className="flex flex-col min-h-full pb-24">
      <div className="p-4 shrink-0">
        <AgentStatusCard
          agentName="Assembly Agent"
          statusText="Ready to compile"
          state="complete"
          icon={<Layers size={20} />}
        />
      </div>

      <div className="px-4 flex-1 flex flex-col">
        <Card className="p-5 mb-6 border-l-[3px] border-l-[var(--teal-500)]" glow="teal">
          <h3 className="font-display font-semibold text-[15px] text-[var(--text-primary)] mb-1">
            {clips.length} clips approved · ~{clips.length * 4} sec total runtime
          </h3>
          <p className="font-sans text-[12px] text-[var(--text-muted)]">
            {shots.filter(s => s.status === "skipped").length} shots skipped · 24 MB storage used
          </p>
        </Card>

        <div className="text-micro text-[var(--text-muted)] mb-4">CLIP MANIFEST</div>
        
        <Reorder.Group axis="y" values={clips} onReorder={setClips} className="flex flex-col gap-3">
          {clips.map((clip) => (
            <Reorder.Item key={clip.id} value={clip}>
              <Card 
                className="p-3 flex items-center gap-3 cursor-grab active:cursor-grabbing hover:border-[var(--border-soft)] transition-colors"
                onClick={() => setPreviewClip(clip)}
              >
                <div className="w-[64px] h-[48px] rounded-[8px] overflow-hidden border-[1.5px] border-[var(--teal-500)] relative shrink-0">
                  <img src={clip.imageUrl} alt="" className="w-full h-full object-cover" />
                  <div className="absolute inset-0 flex items-center justify-center bg-black/30">
                    <Play size={14} className="text-white" fill="white" />
                  </div>
                </div>
                
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <Badge variant="amber" className="shrink-0">Shot {clip.shotNumber}</Badge>
                    <span className="font-sans text-[12px] text-[var(--text-secondary)] truncate">
                      {clip.sceneReference}
                    </span>
                  </div>
                  <p className="font-sans text-[11px] text-[var(--text-muted)]">
                    {clip.durationEstimate}
                  </p>
                </div>
                
                <div className="shrink-0 text-[var(--text-muted)] p-2">
                  <GripVertical size={16} />
                </div>
              </Card>
            </Reorder.Item>
          ))}
        </Reorder.Group>
      </div>

      {/* Video Preview Modal */}
      {previewClip && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
          <div className="w-full max-w-3xl bg-[var(--bg-surface)] rounded-[16px] overflow-hidden border border-[var(--border-subtle)] shadow-2xl">
            <div className="flex items-center justify-between p-4 border-b border-[var(--border-subtle)]">
              <div className="flex items-center gap-2">
                <Badge variant="amber">Shot {previewClip.shotNumber}</Badge>
                <span className="font-sans text-[14px] text-[var(--text-primary)] truncate">
                  {previewClip.sceneReference}
                </span>
              </div>
              <button 
                onClick={() => setPreviewClip(null)}
                className="p-2 text-[var(--text-muted)] hover:text-[var(--text-primary)] transition-colors rounded-full hover:bg-white/5"
              >
                <X size={20} />
              </button>
            </div>
            <div className="w-full aspect-video bg-black">
              <video 
                src={previewClip.videoUrl} 
                className="w-full h-full object-contain"
                controls
                autoPlay
                playsInline
              />
            </div>
          </div>
        </div>
      )}

      <div className="fixed bottom-0 left-0 right-0 p-4 bg-[var(--bg-base)]/90 backdrop-blur-[20px] border-t border-[var(--border-subtle)] z-20 pb-safe">
        <Button onClick={handleComplete} variant="primary" className="w-full shadow-[var(--shadow-amber-glow)]">
          Finalize Production
        </Button>
      </div>
    </div>
  )
}
