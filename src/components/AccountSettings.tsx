import * as React from "react"
import { motion, AnimatePresence } from "motion/react"
import { useNavigate } from "react-router-dom"
import { auth, db } from "@/src/firebase"
import { updateProfile, signOut, deleteUser } from "firebase/auth"
import { collection, query, where, getDocs, deleteDoc, doc } from "firebase/firestore"

import { BottomSheet } from "@/src/components/ui/BottomSheet"
import { Input } from "@/src/components/ui/Input"
import { Button } from "@/src/components/ui/Button"
import { useToast } from "@/src/components/ui/Toast"
import { SPRINGS } from "@/src/lib/constants"

interface AccountSettingsProps {
  isOpen: boolean
  onClose: () => void
}

export function AccountSettings({ isOpen, onClose }: AccountSettingsProps) {
  const navigate = useNavigate()
  const { toast } = useToast()
  
  const [displayName, setDisplayName] = React.useState(auth.currentUser?.displayName || "")
  const [isSaving, setIsSaving] = React.useState(false)
  const [isDeleting, setIsDeleting] = React.useState(false)
  const [deleteConfirmStep, setDeleteConfirmStep] = React.useState(false)

  React.useEffect(() => {
    if (isOpen && auth.currentUser) {
      setDisplayName(auth.currentUser.displayName || "")
      setDeleteConfirmStep(false)
    }
  }, [isOpen])

  const handleSaveProfile = async () => {
    if (!auth.currentUser) return
    setIsSaving(true)
    try {
      await updateProfile(auth.currentUser, { displayName })
      toast("Profile updated", "success")
    } catch (error: any) {
      toast(error.message || "Failed to update profile", "error")
    } finally {
      setIsSaving(false)
    }
  }

  const handleSignOut = async () => {
    try {
      await signOut(auth)
      onClose()
      navigate("/")
    } catch (error: any) {
      toast(error.message || "Failed to sign out", "error")
    }
  }

  const handleDeleteAccount = async () => {
    if (!auth.currentUser) return
    setIsDeleting(true)
    try {
      // Delete user's projects first
      const q = query(collection(db, "projects"), where("ownerId", "==", auth.currentUser.uid))
      const snapshot = await getDocs(q)
      const deletePromises = snapshot.docs.map(d => deleteDoc(doc(db, "projects", d.id)))
      await Promise.all(deletePromises)
      
      // Delete user account
      await deleteUser(auth.currentUser)
      onClose()
      navigate("/")
      toast("Account deleted", "success")
    } catch (error: any) {
      if (error.code === 'auth/requires-recent-login') {
        toast("Please sign in again to delete your account", "error")
        await signOut(auth)
        onClose()
        navigate("/")
      } else {
        toast(error.message || "Failed to delete account", "error")
      }
    } finally {
      setIsDeleting(false)
    }
  }

  return (
    <BottomSheet isOpen={isOpen} onClose={onClose}>
      <div className="flex flex-col h-full min-h-[400px]">
        <h2 className="font-display font-semibold text-[17px] text-[var(--text-primary)] mb-6">Account Settings</h2>
        
        <AnimatePresence mode="wait">
          {!deleteConfirmStep ? (
            <motion.div
              key="main"
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={SPRINGS.smooth}
              className="flex flex-col flex-1"
            >
              <div className="mb-6">
                <Input
                  label="Display Name"
                  placeholder="Your Name"
                  value={displayName}
                  onChange={(e) => setDisplayName(e.target.value)}
                  className="mb-2"
                />
                <Button 
                  variant="primary" 
                  onClick={handleSaveProfile} 
                  disabled={isSaving || displayName === auth.currentUser?.displayName}
                >
                  {isSaving ? "Saving..." : "Save Profile"}
                </Button>
              </div>

              <div className="mb-8">
                <label className="text-[12px] font-medium text-[var(--text-secondary)] mb-[6px] block font-sans">
                  Email Address
                </label>
                <div className="h-[52px] px-4 rounded-[12px] bg-[var(--bg-void)] border-[1.5px] border-[var(--border-subtle)] flex items-center text-[var(--text-muted)] font-sans text-[14px]">
                  {auth.currentUser?.email}
                </div>
              </div>
              
              <div className="mt-auto flex flex-col gap-4">
                <Button variant="secondary" onClick={handleSignOut}>
                  Sign out
                </Button>
                <Button variant="ghost" className="text-[var(--rose-500)]" onClick={() => setDeleteConfirmStep(true)}>
                  Delete account
                </Button>
              </div>
            </motion.div>
          ) : (
            <motion.div
              key="delete"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 20 }}
              transition={SPRINGS.smooth}
              className="flex flex-col flex-1"
            >
              <div className="flex-1 flex flex-col items-center justify-center text-center">
                <div className="w-16 h-16 rounded-full bg-[var(--rose-500)]/10 flex items-center justify-center text-[var(--rose-500)] mb-4">
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M3 6h18"></path>
                    <path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6"></path>
                    <path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2"></path>
                  </svg>
                </div>
                <h3 className="font-display font-semibold text-[17px] text-[var(--text-primary)] mb-2">Delete Account?</h3>
                <p className="font-sans text-[14px] text-[var(--text-secondary)] mb-8">
                  This will permanently delete your account and all your productions. This action cannot be undone.
                </p>
              </div>
              
              <div className="mt-auto flex flex-col gap-4">
                <Button 
                  className="bg-[var(--rose-500)] text-white hover:brightness-110" 
                  onClick={handleDeleteAccount}
                  disabled={isDeleting}
                >
                  {isDeleting ? "Deleting..." : "Yes, delete my account"}
                </Button>
                <Button variant="ghost" onClick={() => setDeleteConfirmStep(false)} disabled={isDeleting}>
                  Cancel
                </Button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </BottomSheet>
  )
}
