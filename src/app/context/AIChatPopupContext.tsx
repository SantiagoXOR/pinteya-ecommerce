'use client'

import React, { createContext, useContext, useState, useCallback, useMemo } from 'react'

interface AIChatPopupContextType {
  isChatOpen: boolean
  openChat: () => void
  closeChat: () => void
}

const AIChatPopupContext = createContext<AIChatPopupContextType | undefined>(undefined)

export function useAIChatPopupContext() {
  const context = useContext(AIChatPopupContext)
  if (!context) {
    throw new Error('useAIChatPopupContext must be used within AIChatPopupProvider')
  }
  return context
}

export function AIChatPopupProvider({ children }: { children: React.ReactNode }) {
  const [isChatOpen, setIsChatOpen] = useState(false)

  const openChat = useCallback(() => {
    setIsChatOpen(true)
  }, [])

  const closeChat = useCallback(() => {
    setIsChatOpen(false)
  }, [])

  const value = useMemo(
    () => ({
      isChatOpen,
      openChat,
      closeChat,
    }),
    [isChatOpen, openChat, closeChat]
  )

  return (
    <AIChatPopupContext.Provider value={value}>
      {children}
    </AIChatPopupContext.Provider>
  )
}
