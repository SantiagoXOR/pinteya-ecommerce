'use client'

import { useState, useEffect } from 'react'

export type PerformanceLevel = 'high' | 'medium' | 'low'

/**
 * ⚡ OPTIMIZACIÓN: Hook para detectar nivel de rendimiento del dispositivo
 * 
 * Detecta dispositivos de bajo rendimiento usando:
 * - navigator.hardwareConcurrency (núcleos de CPU)
 * - navigator.deviceMemory (RAM disponible)
 * - navigator.connection.effectiveType (tipo de conexión)
 * - prefers-reduced-motion (preferencia del usuario)
 * 
 * Retorna nivel de rendimiento para aplicar optimizaciones adaptativas
 * 
 * Impacto esperado: Base para optimizaciones que reducen lag en móviles de gama baja
 */
export function useDevicePerformance(): PerformanceLevel {
  // ⚡ FIX: Inicializar con 'medium' para consistencia SSR/cliente
  // Solo actualizar después de la hidratación para evitar mismatch
  const [level, setLevel] = useState<PerformanceLevel>('medium')
  const [isHydrated, setIsHydrated] = useState(false)

  useEffect(() => {
    // ⚡ FIX: Marcar como hidratado primero para evitar cambios durante la hidratación
    setIsHydrated(true)
    
    // Detectar preferencia de usuario
    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    
    // Detectar hardware
    const cores = navigator.hardwareConcurrency || 4
    const memory = (navigator as any).deviceMemory || 4 // GB
    const connection = (navigator as any).connection?.effectiveType || '4g'
    
    // Calcular nivel de rendimiento
    let score = 0
    if (cores >= 8) score += 2
    else if (cores >= 4) score += 1
    
    if (memory >= 8) score += 2
    else if (memory >= 4) score += 1
    
    if (connection === '4g') score += 1
    
    // Si el usuario prefiere menos movimiento, considerar como bajo rendimiento
    if (prefersReducedMotion) score -= 2
    
    const performanceLevel: PerformanceLevel = 
      score >= 4 ? 'high' : 
      score >= 2 ? 'medium' : 
      'low'
    
    // ⚡ FIX: Solo actualizar después de la hidratación para evitar mismatch
    setLevel(performanceLevel)
  }, [])

  // ⚡ FIX: Retornar 'medium' hasta que se complete la hidratación para consistencia SSR/cliente
  return isHydrated ? level : 'medium'
}

