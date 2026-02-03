/**
 * Hook compartido para manejar scroll horizontal con indicadores de gradiente
 * Extrae lógica común de los selectores de pills
 */

import React from 'react'

const THROTTLE_MS = 100

export interface UseHorizontalScrollResult {
  scrollContainerRef: React.RefObject<HTMLDivElement>
  canScrollLeft: boolean
  canScrollRight: boolean
}

export interface UseHorizontalScrollOptions {
  /**
   * Dependencias que deberían triggerar un re-check del scroll
   * Por defecto: []
   */
  deps?: React.DependencyList
}

/**
 * Hook para manejar scroll horizontal con indicadores de gradiente.
 * Lecturas de geometría en un rAF, setState en el siguiente; throttle en scroll/resize para evitar forced reflow.
 */
export function useHorizontalScroll(
  options: UseHorizontalScrollOptions = {}
): UseHorizontalScrollResult {
  const { deps = [] } = options

  const scrollContainerRef = React.useRef<HTMLDivElement>(null)
  const [canScrollLeft, setCanScrollLeft] = React.useState(false)
  const [canScrollRight, setCanScrollRight] = React.useState(false)
  const lastRunRef = React.useRef(0)
  const timeoutRef = React.useRef<ReturnType<typeof setTimeout> | null>(null)

  React.useEffect(() => {
    const container = scrollContainerRef.current
    if (!container) return

    const checkScroll = () => {
      requestAnimationFrame(() => {
        if (!container) return
        const scrollLeft = container.scrollLeft
        const scrollWidth = container.scrollWidth
        const clientWidth = container.clientWidth
        requestAnimationFrame(() => {
          setCanScrollLeft(scrollLeft > 0)
          setCanScrollRight(scrollLeft < scrollWidth - clientWidth - 1)
        })
      })
    }

    const throttledCheckScroll = () => {
      const now = Date.now()
      if (now - lastRunRef.current >= THROTTLE_MS) {
        lastRunRef.current = now
        checkScroll()
      } else if (timeoutRef.current === null) {
        timeoutRef.current = setTimeout(() => {
          timeoutRef.current = null
          lastRunRef.current = Date.now()
          checkScroll()
        }, THROTTLE_MS - (now - lastRunRef.current))
      }
    }

    checkScroll()
    container.addEventListener('scroll', throttledCheckScroll, { passive: true })
    window.addEventListener('resize', throttledCheckScroll, { passive: true })

    return () => {
      container.removeEventListener('scroll', throttledCheckScroll)
      window.removeEventListener('resize', throttledCheckScroll)
      if (timeoutRef.current !== null) {
        clearTimeout(timeoutRef.current)
        timeoutRef.current = null
      }
    }
  }, deps)

  return {
    scrollContainerRef,
    canScrollLeft,
    canScrollRight
  }
}
