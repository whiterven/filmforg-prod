import * as React from "react"
import { motion } from "motion/react"
import { Link } from "react-router-dom"
import { Button } from "@/src/components/ui/Button"
import { Input } from "@/src/components/ui/Input"
import { Card } from "@/src/components/ui/Card"
import { SPRINGS } from "@/src/lib/constants"
import { auth } from "@/src/firebase"
import { sendPasswordResetEmail } from "firebase/auth"
import { useToast } from "@/src/components/ui/Toast"

export default function ForgotPassword() {
  const { toast } = useToast()
  const [isLoading, setIsLoading] = React.useState(false)
  const [isSuccess, setIsSuccess] = React.useState(false)
  const [email, setEmail] = React.useState("")
  const [error, setError] = React.useState("")

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!email) {
      setError("Email is required")
      return
    }

    setIsLoading(true)
    try {
      await sendPasswordResetEmail(auth, email)
      setIsSuccess(true)
    } catch (error: any) {
      toast(error.message || "Failed to send reset email", "error")
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-center px-4 bg-[var(--bg-base)] pt-safe pb-safe">
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -8 }}
        transition={SPRINGS.smooth}
        className="w-full max-w-[430px]"
      >
        {isSuccess ? (
          <Card className="p-6 w-full" glow="teal">
            <div className="mb-6 text-center">
              <div className="w-12 h-12 rounded-full bg-[var(--teal-500)]/20 text-[var(--teal-500)] flex items-center justify-center mx-auto mb-4">
                <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              </div>
              <h1 className="font-display font-bold text-[22px] text-[var(--text-primary)] mb-2">Check your inbox</h1>
              <p className="font-sans text-[14px] text-[var(--text-secondary)]">
                We've sent a reset link to {email}
              </p>
            </div>
            <div className="text-center">
              <Link to="/signin" className="font-sans text-[14px] font-semibold text-[var(--amber-500)] hover:text-[var(--amber-400)] transition-colors">
                Back to sign in
              </Link>
            </div>
          </Card>
        ) : (
          <Card className="p-6 w-full">
            <div className="mb-8">
              <h1 className="font-display font-bold text-[22px] text-[var(--text-primary)] mb-1">Reset password</h1>
              <p className="font-sans text-[13px] text-[var(--text-secondary)]">Enter your email to receive a reset link.</p>
            </div>

            <form onSubmit={handleSubmit} className="flex flex-col gap-4 mb-6">
              <Input
                label="Email Address"
                type="email"
                placeholder="director@example.com"
                value={email}
                onChange={(e) => { setEmail(e.target.value); setError("") }}
                error={error}
              />
              
              <Button type="submit" variant="primary" className="mt-2" isLoading={isLoading}>
                Send reset link
              </Button>
            </form>

            <div className="text-center">
              <Link to="/signin" className="font-sans text-[14px] font-semibold text-[var(--amber-500)] hover:text-[var(--amber-400)] transition-colors">
                Back to sign in
              </Link>
            </div>
          </Card>
        )}
      </motion.div>
    </div>
  )
}
