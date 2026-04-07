import * as React from "react"
import { motion } from "motion/react"
import { useNavigate } from "react-router-dom"
import { Button } from "@/src/components/ui/Button"
import { SPRINGS } from "@/src/lib/constants"

export default function Welcome() {
  const navigate = useNavigate()

  const titleText = "FilmForge"
  const tagline = "Your AI film crew. You direct."

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.05,
      },
    },
  }

  const itemVariants = {
    hidden: { opacity: 0, y: 8 },
    visible: { opacity: 1, y: 0, transition: SPRINGS.gentle },
  }

  return (
    <div className="relative min-h-screen flex flex-col items-center justify-center px-6 bg-[var(--bg-void)] overflow-hidden">
      {/* Decorative amber glow */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[600px] h-[600px] bg-[radial-gradient(ellipse_at_top,rgba(245,158,11,0.15)_0%,transparent_70%)] pointer-events-none" />

      <motion.div
        variants={containerVariants}
        initial="hidden"
        animate="visible"
        className="relative z-10 flex flex-col items-center w-full max-w-[430px]"
      >
        <motion.div variants={itemVariants} className="mb-6">
          <span className="font-display font-bold text-[40px] text-[var(--amber-500)] tracking-tighter">
            FF
          </span>
        </motion.div>

        <motion.h1 variants={itemVariants} className="font-display font-extrabold text-[36px] flex mb-3">
          <span className="text-[var(--text-primary)]">Film</span>
          <span className="text-[var(--amber-500)]">Forge</span>
        </motion.h1>

        <motion.p variants={itemVariants} className="font-sans text-[15px] text-[var(--text-secondary)] mb-12 text-center">
          {tagline}
        </motion.p>

        <motion.div variants={itemVariants} className="w-full flex flex-col gap-4">
          <Button onClick={() => navigate("/signup")} variant="primary">
            Start a new production
          </Button>
          <Button onClick={() => navigate("/signin")} variant="ghost">
            Sign in
          </Button>
        </motion.div>

        <motion.p variants={itemVariants} className="mt-8 font-sans text-[11px] text-[var(--text-muted)] text-center">
          By continuing, you agree to our Terms of Service and Privacy Policy.
        </motion.p>
      </motion.div>
    </div>
  )
}
