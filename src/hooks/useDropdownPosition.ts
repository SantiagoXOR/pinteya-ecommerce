'use client'

import { useState, useEffect, useCallback, useRef, type RefObject } from 'react'

// ===================================
// HOOK: useDropdownPosition
// ===================================
// Hook reutilizable para manejar el cálculo y actualización de posición
// del dropdown de forma optimizada y correcta para position: fixed

export interface UseDropdownPositionOptions {
  inputRef: RefObject<HTMLInputElement>
  isOpen: boolean
  offset?: number // default: 4
}

export interface UseDropdownPositionReturn {
  position: { top: number; left: number; width: number } | null
  updatePosition: () => void
}

export function useDropdownPosition({
  inputRef,
  isOpen,
  offset = 4,
}: UseDropdownPositionOptions): UseDropdownPositionReturn {
  const [position, setPosition] = useState<{ top: number; left: number; width: number } | null>(null)
  const rafIdRef = useRef<number | null>(null)

  // Función para calcular y actualizar la posición del dropdown
  const updatePosition = useCallback(() => {
    if (!inputRef.current) {
      setPosition(null)
      return
    }

    // Usar requestAnimationFrame para evitar forced reflow y sincronizar con el render
    if (rafIdRef.current !== null) {
      cancelAnimationFrame(rafIdRef.current)
    }

    rafIdRef.current = requestAnimationFrame(() => {
      if (!inputRef.current) {
        setPosition(null)
        return
      }

      const rect = inputRef.current.getBoundingClientRect()
      
      // Validar que el rect tenga dimensiones válidas y esté visible
      if (
        rect.width <= 0 || 
        rect.height <= 0 || 
        rect.top < -1000 || 
        rect.left < -1000 ||
        rect.width > window.innerWidth * 2 // Sanity check: width no puede ser más del doble del viewport
      ) {
        setPosition(null)
        return
      }
      
      // ⚡ FIX: Para position: fixed, NO sumar window.scrollY
      // getBoundingClientRect() ya devuelve coordenadas relativas al viewport
      // y position: fixed también es relativo al viewport
      setPosition({
        top: rect.bottom + offset,
        left: rect.left,
        width: rect.width,
      })
    })
  }, [inputRef, offset])

  // Actualizar posición cuando se abre el dropdown o cambia el tamaño de la ventana
  useEffect(() => {
    if (!isOpen) {
      setPosition(null)
      return
    }

    // Verificar que el input esté visible antes de calcular posición
    if (!inputRef.current || inputRef.current.offsetParent === null) {
      setPosition(null)
      return
    }

    // Esperar un frame para asegurar que el input esté completamente renderizado
    const timeoutId = setTimeout(() => {
      // Verificar nuevamente que el input siga visible
      if (inputRef.current && inputRef.current.offsetParent !== null) {
        updatePosition()
      }
    }, 0)

    // Handlers para scroll y resize
    const handleScroll = () => {
      // Verificar que el input siga visible antes de actualizar
      if (inputRef.current && inputRef.current.offsetParent !== null) {
        updatePosition()
      } else {
        setPosition(null)
      }
    }

    const handleResize = () => {
      // Verificar que el input siga visible antes de actualizar
      if (inputRef.current && inputRef.current.offsetParent !== null) {
        updatePosition()
      } else {
        setPosition(null)
      }
    }

    // ⚡ OPTIMIZACIÓN: Usar passive: true para mejor performance
    // No necesitamos preventDefault, así que podemos usar passive
    window.addEventListener('scroll', handleScroll, { passive: true })
    window.addEventListener('resize', handleResize, { passive: true })

    return () => {
      clearTimeout(timeoutId)
      window.removeEventListener('scroll', handleScroll)
      window.removeEventListener('resize', handleResize)
      
      // Limpiar requestAnimationFrame pendiente
      if (rafIdRef.current !== null) {
        cancelAnimationFrame(rafIdRef.current)
        rafIdRef.current = null
      }
    }
  }, [isOpen, updatePosition])

  return {
    position,
    updatePosition,
  }
}
