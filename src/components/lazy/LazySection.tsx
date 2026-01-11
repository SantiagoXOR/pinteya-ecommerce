/**
 * Componente genérico para lazy loading basado en viewport
 * 
 * Carga el contenido cuando el elemento entra al viewport usando IntersectionObserver.
 * Útil para secciones below-the-fold que no son críticas para el render inicial.
 */

'use client'

import React, { memo, useMemo } from 'react'
import { useUnifiedLazyLoading } from '@/hooks/useUnifiedLazyLoading'
import { getLazySectionConfig, type LazySectionConfig } from '@/config/lazy-loading.config'

export interface LazySectionProps {
  /** Clave de configuración de la sección */
  configKey: string
  /** Skeleton a mostrar mientras carga */
  skeleton: React.ReactNode
  /** Contenido a cargar */
  children: React.ReactNode
  /** Clases CSS adicionales */
  className?: string
  /** Estilos inline adicionales */
  style?: React.CSSProperties
  /** Si está deshabilitado */
  disabled?: boolean
  /** Override de configuración (opcional) */
  configOverride?: Partial<LazySectionConfig>
}

/**
 * Componente genérico para lazy loading de secciones
 * 
 * @example
 * <LazySection 
 *   configKey="newArrivals" 
 *   skeleton={<NewArrivalsSkeleton />}
 * >
 *   <NewArrivals />
 * </LazySection>
 */
export const LazySection = memo<LazySectionProps>(({
  configKey,
  skeleton,
  children,
  className,
  style,
  disabled = false,
  configOverride,
}) => {
  // Obtener configuración de la sección
  const baseConfig = getLazySectionConfig(configKey)
  const config = baseConfig 
    ? { ...baseConfig, ...configOverride }
    : undefined
  
  // Si no hay configuración, renderizar inmediatamente
  if (!config) {
    console.warn(`LazySection: No se encontró configuración para "${configKey}". Renderizando inmediatamente.`)
    return <div className={className} style={style}>{children}</div>
  }
  
  // Usar hook unificado de lazy loading
  const { ref, isVisible } = useUnifiedLazyLoading<HTMLDivElement>({
    strategy: config.strategy,
    rootMargin: config.rootMargin,
    threshold: config.threshold,
    disabled,
  })
  
  // Memoizar contenido para evitar re-renders innecesarios
  const content = useMemo(() => {
    return isVisible ? children : skeleton
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

LazySection.displayName = 'LazySection'
