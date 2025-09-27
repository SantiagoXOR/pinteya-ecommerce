/**
 * Hook para manejar el estado y comportamiento de sidebars
 * Incluye manejo de eventos para cerrar con click fuera y tecla Escape
 */

import { useState, useCallback, useEffect, useRef } from 'react'

interface UseSidebarReturn {
  isOpen: boolean
  toggle: () => void
  open: () => void
  close: () => void
}

/**
 * Hook que maneja el estado de un sidebar con funcionalidades de apertura/cierre
 * Incluye event listeners para cerrar con click fuera y tecla Escape
 * @param initialState - Estado inicial del sidebar (default: false)
 * @returns objeto con isOpen, toggle, open, close
 */
export const useSidebar = (initialState: boolean = false): UseSidebarReturn => {
  const [isOpen, setIsOpen] = useState(initialState)
  const sidebarRef = useRef<HTMLElement | null>(null)

  // Funciones estables con useCallback para evitar re-renders innecesarios
  const open = useCallback(() => {
    setIsOpen(true)
  }, [])

  const close = useCallback(() => {
    setIsOpen(false)
  }, [])

  const toggle = useCallback(() => {
    setIsOpen(prev => !prev)
  }, [])

  // Manejar click fuera del sidebar
  const handleClickOutside = useCallback(
    (event: MouseEvent) => {
      if (sidebarRef.current && !sidebarRef.current.contains(event.target as Node)) {
        close()
      }
    },
    [close]
  )

  // Manejar tecla Escape
  const handleKeyDown = useCallback(
    (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        close()
      }
    },
    [close]
  )

  // Agregar/remover event listeners cuando el sidebar está abierto
  useEffect(() => {
    if (isOpen) {
      // Agregar event listeners
      document.addEventListener('mousedown', handleClickOutside)
      document.addEventListener('keydown', handleKeyDown)

      // Cleanup function
      return () => {
        document.removeEventListener('mousedown', handleClickOutside)
        document.removeEventListener('keydown', handleKeyDown)
      }
    }
  }, [isOpen, handleClickOutside, handleKeyDown])

  return {
    isOpen,
    toggle,
    open,
    close,
  }
}

export default useSidebar
