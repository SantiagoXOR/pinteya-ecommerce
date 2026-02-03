'use client'

import { useState, useEffect, useCallback, useRef, type RefObject } from 'react'

const THROTTLE_MS = 120

// Throttle para reducir reflows en scroll/resize
function useThrottledCallback<T extends (...args: unknown[]) => void>(
  callback: T,
  delayMs: number
): T {
  const lastRun = useRef(0)
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const callbackRef = useRef(callback)
  callbackRef.current = callback

  return useCallback(
    ((...args: unknown[]) => {
      const now = Date.now()
      const elapsed = now - lastRun.current
      const run = () => {
        lastRun.current = Date.now()
        callbackRef.current(...args)
      }
      if (elapsed >= delayMs) {
        run()
      } else if (timeoutRef.current === null) {
        timeoutRef.current = setTimeout(() => {
          timeoutRef.current = null
          run()
        }, delayMs - elapsed)
      }
    }) as T,
    [delayMs]
  )
}

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

  // Función para calcular y actualizar la posición del dropdown (solo getBoundingClientRect en rAF)
  const updatePosition = useCallback(() => {
    if (!inputRef.current) {
      setPosition(null)
      return
    }

    if (rafIdRef.current !== null) {
      cancelAnimationFrame(rafIdRef.current)
    }

    rafIdRef.current = requestAnimationFrame(() => {
      if (!inputRef.current) {
        setPosition(null)
        return
      }

      const rect = inputRef.current.getBoundingClientRect()

      if (
        rect.width <= 0 ||
        rect.height <= 0 ||
        rect.top < -1000 ||
        rect.left < -1000 ||
        rect.width > window.innerWidth * 2
      ) {
        setPosition(null)
        return
      }

      setPosition({
        top: rect.bottom + offset,
        left: rect.left,
        width: rect.width,
      })
    })
  }, [inputRef, offset])

  const throttledUpdate = useThrottledCallback(updatePosition, THROTTLE_MS)

  useEffect(() => {
    if (!isOpen) {
      setPosition(null)
      return
    }

    if (!inputRef.current) {
      setPosition(null)
      return
    }

    const timeoutId = setTimeout(() => {
      if (inputRef.current) updatePosition()
    }, 0)

    const handleScroll = () => {
      if (inputRef.current) throttledUpdate()
      else setPosition(null)
    }

    const handleResize = () => {
      if (inputRef.current) throttledUpdate()
      else setPosition(null)
    }

    let resizeObserver: ResizeObserver | null = null
    if (inputRef.current && typeof ResizeObserver !== 'undefined') {
      resizeObserver = new ResizeObserver(() => {
        if (inputRef.current) throttledUpdate()
        else setPosition(null)
      })
      resizeObserver.observe(inputRef.current)
    }

    window.addEventListener('scroll', handleScroll, { passive: true })
    window.addEventListener('resize', handleResize, { passive: true })

    return () => {
      clearTimeout(timeoutId)
      resizeObserver?.disconnect()
      window.removeEventListener('scroll', handleScroll)
      window.removeEventListener('resize', handleResize)
      if (rafIdRef.current !== null) {
        cancelAnimationFrame(rafIdRef.current)
        rafIdRef.current = null
      }
    }
  }, [isOpen, updatePosition, throttledUpdate])

  return {
    position,
    updatePosition,
  }
}
