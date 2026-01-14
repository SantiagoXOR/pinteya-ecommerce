/**
 * Hook compartido para manejar scroll horizontal con indicadores de gradiente
 * Extrae lógica común de los selectores de pills
 */

import React from 'react'

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
 * Hook para manejar scroll horizontal con indicadores de gradiente
 * Optimizado usando requestAnimationFrame para agrupar lecturas de geometría
 */
export function useHorizontalScroll(
  options: UseHorizontalScrollOptions = {}
): UseHorizontalScrollResult {
  const { deps = [] } = options

  const scrollContainerRef = React.useRef<HTMLDivElement>(null)
  const [canScrollLeft, setCanScrollLeft] = React.useState(false)
  const [canScrollRight, setCanScrollRight] = React.useState(false)

  React.useEffect(() => {
    const container = scrollContainerRef.current
    if (!container) return

    // Optimizado - agrupar lecturas de geometría en requestAnimationFrame
    const checkScroll = () => {
      requestAnimationFrame(() => {
        if (!container) return
        // Agrupar todas las lecturas de geometría
        const scrollLeft = container.scrollLeft
        const scrollWidth = container.scrollWidth
        const clientWidth = container.clientWidth

        // Actualizar estado en el siguiente frame
        requestAnimationFrame(() => {
          setCanScrollLeft(scrollLeft > 0)
          setCanScrollRight(scrollLeft < scrollWidth - clientWidth - 1)
        })
      })
    }

    checkScroll()
    container.addEventListener('scroll', checkScroll, { passive: true })
    window.addEventListener('resize', checkScroll, { passive: true })

    return () => {
      container.removeEventListener('scroll', checkScroll)
      window.removeEventListener('resize', checkScroll)
    }
  }, deps)

  return {
    scrollContainerRef,
    canScrollLeft,
    canScrollRight
  }
}
