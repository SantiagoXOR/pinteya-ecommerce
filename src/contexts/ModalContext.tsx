'use client'

import React, { createContext, useContext, useState, useCallback, useEffect } from 'react'

export type ModalType =
  | 'navigation-instructions'
  | 'route-info'
  | 'real-time-tracker'
  | 'advanced-controls'
  | 'delivery-details'
  | 'gps-debug'
  | 'emergency-options'
  | null

interface ModalState {
  activeModal: ModalType
  modalData?: any
  isTransitioning: boolean
  modalHistory: ModalType[]
}

interface ModalContextType {
  modalState: ModalState
  openModal: (type: ModalType, data?: any) => void
  closeModal: () => void
  closeAllModals: () => void
  goBack: () => void
  isModalOpen: (type: ModalType) => boolean
  canGoBack: boolean
}

const ModalContext = createContext<ModalContextType | undefined>(undefined)

export function useModal() {
  const context = useContext(ModalContext)
  if (!context) {
    throw new Error('useModal must be used within a ModalProvider')
  }
  return context
}

interface ModalProviderProps {
  children: React.ReactNode
}

export function ModalProvider({ children }: ModalProviderProps) {
  const [modalState, setModalState] = useState<ModalState>({
    activeModal: null,
    modalData: undefined,
    isTransitioning: false,
    modalHistory: [],
  })

  // Función para abrir un modal
  const openModal = useCallback(
    (type: ModalType, data?: any) => {
      if (type === modalState.activeModal) return

      setModalState(prev => ({
        ...prev,
        isTransitioning: true,
      }))

      // Pequeño delay para animación
      setTimeout(() => {
        setModalState(prev => ({
          activeModal: type,
          modalData: data,
          isTransitioning: false,
          modalHistory: prev.activeModal
            ? [...prev.modalHistory, prev.activeModal]
            : prev.modalHistory,
        }))
      }, 150)
    },
    [modalState.activeModal]
  )

  // Función para cerrar el modal actual
  const closeModal = useCallback(() => {
    setModalState(prev => ({
      ...prev,
      isTransitioning: true,
    }))

    setTimeout(() => {
      setModalState(prev => ({
        activeModal: null,
        modalData: undefined,
        isTransitioning: false,
        modalHistory: prev.modalHistory,
      }))
    }, 150)
  }, [])

  // Función para cerrar todos los modales
  const closeAllModals = useCallback(() => {
    setModalState({
      activeModal: null,
      modalData: undefined,
      isTransitioning: false,
      modalHistory: [],
    })
  }, [])

  // Función para volver al modal anterior
  const goBack = useCallback(() => {
    if (modalState.modalHistory.length === 0) {
      closeModal()
      return
    }

    const previousModal = modalState.modalHistory[modalState.modalHistory.length - 1]
    const newHistory = modalState.modalHistory.slice(0, -1)

    setModalState(prev => ({
      ...prev,
      isTransitioning: true,
    }))

    setTimeout(() => {
      setModalState({
        activeModal: previousModal,
        modalData: undefined,
        isTransitioning: false,
        modalHistory: newHistory,
      })
    }, 150)
  }, [modalState.modalHistory, closeModal])

  // Función para verificar si un modal específico está abierto
  const isModalOpen = useCallback(
    (type: ModalType) => {
      return modalState.activeModal === type
    },
    [modalState.activeModal]
  )

  // Verificar si se puede volver atrás
  const canGoBack = modalState.modalHistory.length > 0

  // Manejar tecla Escape
  useEffect(() => {
    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape' && modalState.activeModal) {
        if (canGoBack) {
          goBack()
        } else {
          closeModal()
        }
      }
    }

    document.addEventListener('keydown', handleEscape)
    return () => document.removeEventListener('keydown', handleEscape)
  }, [modalState.activeModal, canGoBack, goBack, closeModal])

  // Prevenir scroll del body cuando hay modal activo
  useEffect(() => {
    if (modalState.activeModal) {
      document.body.style.overflow = 'hidden'
    } else {
      document.body.style.overflow = 'unset'
    }

    return () => {
      document.body.style.overflow = 'unset'
    }
  }, [modalState.activeModal])

  const contextValue: ModalContextType = {
    modalState,
    openModal,
    closeModal,
    closeAllModals,
    goBack,
    isModalOpen,
    canGoBack,
  }

  return <ModalContext.Provider value={contextValue}>{children}</ModalContext.Provider>
}

// Hook para gestionar modales específicos
export function useModalActions() {
  const { openModal, closeModal, isModalOpen } = useModal()

  return {
    openNavigationInstructions: (data?: any) => openModal('navigation-instructions', data),
    openRouteInfo: (data?: any) => openModal('route-info', data),
    openRealTimeTracker: (data?: any) => openModal('real-time-tracker', data),
    openAdvancedControls: (data?: any) => openModal('advanced-controls', data),
    openDeliveryDetails: (data?: any) => openModal('delivery-details', data),
    openGPSDebug: (data?: any) => openModal('gps-debug', data),
    openEmergencyOptions: (data?: any) => openModal('emergency-options', data),
    closeModal,
    isNavigationInstructionsOpen: () => isModalOpen('navigation-instructions'),
    isRouteInfoOpen: () => isModalOpen('route-info'),
    isRealTimeTrackerOpen: () => isModalOpen('real-time-tracker'),
    isAdvancedControlsOpen: () => isModalOpen('advanced-controls'),
    isDeliveryDetailsOpen: () => isModalOpen('delivery-details'),
    isGPSDebugOpen: () => isModalOpen('gps-debug'),
    isEmergencyOptionsOpen: () => isModalOpen('emergency-options'),
  }
}
