'use client'
import React, { createContext, useContext, useState, useCallback, useMemo } from 'react'

interface CartModalContextType {
  isCartModalOpen: boolean
  openCartModal: () => void
  closeCartModal: () => void
}

const CartModalContext = createContext<CartModalContextType | undefined>(undefined)

export const useCartModalContext = () => {
  const context = useContext(CartModalContext)
  if (!context) {
    throw new Error('useModalContext must be used within a ModalProvider')
  }
  return context
}

export const CartModalProvider = ({ children }: { children: React.ReactNode }) => {
  const [isCartModalOpen, setIsCartModalOpen] = useState(false)

  // ⚡ OPTIMIZACIÓN: Memoizar callbacks para evitar rerenders innecesarios
  const openCartModal = useCallback(() => {
    setIsCartModalOpen(true)
  }, [])

  const closeCartModal = useCallback(() => {
    setIsCartModalOpen(false)
  }, [])

  // ⚡ OPTIMIZACIÓN: Memoizar el value del contexto para evitar rerenders en todos los consumidores
  const value = useMemo(
    () => ({
      isCartModalOpen,
      openCartModal,
      closeCartModal,
    }),
    [isCartModalOpen, openCartModal, closeCartModal]
  )

  return (
    <CartModalContext.Provider value={value}>
      {children}
    </CartModalContext.Provider>
  )
}
