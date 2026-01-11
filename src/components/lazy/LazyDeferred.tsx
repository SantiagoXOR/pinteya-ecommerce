/**
 * Componente genérico para lazy loading con delay
 * 
 * Carga el contenido después de un delay (fijo o adaptativo según rendimiento).
 * Útil para componentes que no son críticos pero deben cargarse después del render inicial.
 */

'use client'

import React, { memo, useMemo } from 'react'
import { useUnifiedLazyLoading } from '@/hooks/useUnifiedLazyLoading'
import { getLazySectionConfig, getLazyDelay } from '@/config/lazy-loading.config'
import { useDevicePerformance } from '@/hooks/useDevicePerformance'

export interface LazyDeferredProps {
  /** Clave de configuración de la sección */
  configKey: string
  /** Skeleton a mostrar mientras carga */
  skeleton?: React.ReactNode
  /** Contenido a cargar */
  children: React.ReactNode
  /** Clases CSS adicionales */
  className?: string
  /** Estilos inline adicionales */
  style?: React.CSSProperties
  /** Si está deshabilitado */
  disabled?: boolean
  /** Delay key para estrategia adaptativa */
  delayKey?: string
  /** Override de delay (ms) */
  delayOverride?: number
}

/**
 * Componente genérico para lazy loading con delay
 * 
 * @example
 * <LazyDeferred 
 *   configKey="categoryToggle" 
 *   delayKey="categoryToggle"
 *   skeleton={<CategoryPillsSkeleton />}
 * >
 *   <CategoryTogglePillsWithSearch />
 * </LazyDeferred>
 */
export const LazyDeferred = memo<LazyDeferredProps>(({
  configKey,
  skeleton,
  children,
  className,
  style,
  disabled = false,
  delayKey,
  delayOverride,
}) => {
  const performanceLevel = useDevicePerformance()
  
  // Obtener configuración de la sección
  const config = getLazySectionConfig(configKey)
  
  // Si no hay configuración, renderizar inmediatamente
  if (!config) {
    console.warn(`LazyDeferred: No se encontró configuración para "${configKey}". Renderizando inmediatamente.`)
    return <div className={className} style={style}>{children}</div>
  }
  
  // Calcular delay
  const delay = delayOverride !== undefined
    ? delayOverride
    : delayKey
      ? getLazyDelay(delayKey, performanceLevel)
      : config.delay || 0
  
  // Usar hook unificado de lazy loading
  const { ref, isVisible } = useUnifiedLazyLoading<HTMLDivElement>({
    strategy: config.strategy === 'adaptive' ? 'adaptive' : 'delay',
    delay,
    respectPerformance: config.respectPerformance,
    delayKey: delayKey || configKey,
    disabled,
  })
  
  // Memoizar contenido para evitar re-renders innecesarios
  const content = useMemo(() => {
    return isVisible ? children : (skeleton || null)
  }, [isVisible, children, skeleton])
  
  // Calcular minHeight para prevenir CLS
  const minHeightStyle = useMemo(() => {
    return {
      ...style,
      minHeight: isVisible ? 'auto' : config.minHeight,
    }
  }, [isVisible, config.minHeight, style])
  
  return (
    <div 
      ref={ref}
      className={className}
      style={minHeightStyle}
    >
      {content}
    </div>
  )
})

LazyDeferred.displayName = 'LazyDeferred'
