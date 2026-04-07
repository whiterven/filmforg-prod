import * as React from "react"
import { motion } from "motion/react"
import { useNavigate, Link } from "react-router-dom"
import { Button } from "@/src/components/ui/Button"
import { Input } from "@/src/components/ui/Input"
import { Card } from "@/src/components/ui/Card"
import { SPRINGS } from "@/src/lib/constants"
import { Eye, EyeOff } from "lucide-react"
import { auth } from "@/src/firebase"
import { createUserWithEmailAndPassword, updateProfile, signInWithPopup, GoogleAuthProvider } from "firebase/auth"
import { useToast } from "@/src/components/ui/Toast"

export default function SignUp() {
  const navigate = useNavigate()
  const { toast } = useToast()
  const [showPassword, setShowPassword] = React.useState(false)
  const [isLoading, setIsLoading] = React.useState(false)
  
  const [formData, setFormData] = React.useState({
    displayName: "",
    email: "",
    password: "",
    confirmPassword: ""
  })
  const [errors, setErrors] = React.useState<Record<string, string>>({})

  const handleGoogleSignIn = async () => {
    try {
      const provider = new GoogleAuthProvider()
      await signInWithPopup(auth, provider)
      navigate("/dashboard")
    } catch (error: any) {
      toast(error.message || "Failed to sign in with Google", "error")
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    const newErrors: Record<string, string> = {}
    if (!formData.displayName) newErrors.displayName = "Display name is required"
    if (!formData.email) newErrors.email = "Email is required"
    if (!formData.password) newErrors.password = "Password is required"
    if (formData.password !== formData.confirmPassword) newErrors.confirmPassword = "Passwords do not match"
    
    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors)
      return
    }

    setIsLoading(true)
    try {
      const userCredential = await createUserWithEmailAndPassword(auth, formData.email, formData.password)
      await updateProfile(userCredential.user, { displayName: formData.displayName })
      navigate("/dashboard")
    } catch (error: any) {
      toast(error.message || "Failed to create account", "error")
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
        <Card className="p-6 w-full">
          <div className="mb-8">
            <h1 className="font-display font-bold text-[22px] text-[var(--text-primary)] mb-1">Create account</h1>
            <p className="font-sans text-[13px] text-[var(--text-secondary)]">Join FilmForge to start directing.</p>
          </div>

          <form onSubmit={handleSubmit} className="flex flex-col gap-4 mb-6">
            <Input
              label="Display Name"
              placeholder="Christopher Nolan"
              value={formData.displayName}
              onChange={(e) => { setFormData({...formData, displayName: e.target.value}); setErrors({...errors, displayName: ""}) }}
              error={errors.displayName}
            />
            <Input
              label="Email Address"
              type="email"
              placeholder="director@example.com"
              value={formData.email}
              onChange={(e) => { setFormData({...formData, email: e.target.value}); setErrors({...errors, email: ""}) }}
              error={errors.email}
            />
            <div className="relative">
              <Input
                label="Password"
                type={showPassword ? "text" : "password"}
                placeholder="••••••••"
                value={formData.password}
                onChange={(e) => { setFormData({...formData, password: e.target.value}); setErrors({...errors, password: ""}) }}
                error={errors.password}
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-4 top-[34px] text-[var(--text-secondary)] hover:text-[var(--amber-500)] transition-colors"
              >
                {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>
            <Input
              label="Confirm Password"
              type={showPassword ? "text" : "password"}
              placeholder="••••••••"
              value={formData.confirmPassword}
              onChange={(e) => { setFormData({...formData, confirmPassword: e.target.value}); setErrors({...errors, confirmPassword: ""}) }}
              error={errors.confirmPassword}
            />
            
            <Button type="submit" variant="primary" className="mt-2" isLoading={isLoading}>
              Create account
            </Button>
          </form>

          <div className="flex items-center gap-4 mb-6">
            <div className="flex-1 h-px bg-[var(--border-subtle)]" />
            <span className="font-sans text-[12px] text-[var(--text-muted)] uppercase">or</span>
            <div className="flex-1 h-px bg-[var(--border-subtle)]" />
          </div>

          <Button type="button" variant="secondary" onClick={handleGoogleSignIn} className="w-full mb-6">
            <svg className="w-5 h-5 mr-2" viewBox="0 0 24 24">
              <path fill="currentColor" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
              <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
              <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
              <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
            </svg>
            Continue with Google
          </Button>

          <div className="text-center">
            <Link to="/signin" className="font-sans text-[14px] font-semibold text-[var(--amber-500)] hover:text-[var(--amber-400)] transition-colors">
              Already have an account? Sign in
            </Link>
          </div>
        </Card>
      </motion.div>
    </div>
  )
}
