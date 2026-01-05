'use client'

import { useState, useEffect, useRef } from 'react'

/**
 * ⚡ OPTIMIZACIÓN: Hook para detectar cuando el usuario está haciendo scroll activo
 * 
 * Deshabilita animaciones y efectos costosos durante el scroll para mejorar FPS.
 * 
 * @param debounceMs - Tiempo en ms después del último scroll para considerar que el scroll terminó (default: 150ms)
 * @returns true si el usuario está haciendo scroll activo, false si está estático
 * 
 * Impacto esperado: Reducción de 30-50% en jank durante scroll
 */
export function useScrollActive(debounceMs: number = 150): boolean {
  const [isScrolling, setIsScrolling] = useState(false)
  const scrollTimeoutRef = useRef<NodeJS.Timeout>()
  const rafIdRef = useRef<number | null>(null)

  useEffect(() => {
    // No hacer nada en servidor
    if (typeof window === 'undefined') {
      return
    }

    let ticking = false

    const handleScroll = () => {
      if (!ticking) {
        // Usar requestAnimationFrame para sincronizar con el render del navegador
        rafIdRef.current = window.requestAnimationFrame(() => {
          setIsScrolling(true)
          ticking = false

          // Limpiar timeout anterior
          if (scrollTimeoutRef.current) {
            clearTimeout(scrollTimeoutRef.current)
          }

          // Desactivar después de debounceMs sin scroll
          scrollTimeoutRef.current = setTimeout(() => {
            setIsScrolling(false)
          }, debounceMs)
        })

        ticking = true
      }
    }

    // ⚡ CRITICAL: Agregar passive: true para no bloquear el scroll
    window.addEventListener('scroll', handleScroll, { passive: true })

    return () => {
      window.removeEventListener('scroll', handleScroll)
      if (scrollTimeoutRef.current) {
        clearTimeout(scrollTimeoutRef.current)
      }
      if (rafIdRef.current !== null) {
        window.cancelAnimationFrame(rafIdRef.current)
      }
    }
  }, [debounceMs])

  return isScrolling
}

