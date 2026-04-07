import { create } from 'zustand'

interface AppState {
  isNewProjectSheetOpen: boolean
  setNewProjectSheetOpen: (isOpen: boolean) => void
}

export const useStore = create<AppState>((set) => ({
  isNewProjectSheetOpen: false,
  setNewProjectSheetOpen: (isOpen) => set({ isNewProjectSheetOpen: isOpen }),
}))
