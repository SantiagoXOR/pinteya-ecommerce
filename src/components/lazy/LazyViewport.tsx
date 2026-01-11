/**
 * Componente genérico para lazy loading basado en viewport (alias de LazySection)
 * 
 * Este componente es un alias de LazySection para mantener compatibilidad
 * y claridad semántica cuando se quiere enfatizar que es viewport-based.
 */

'use client'

import { LazySection, type LazySectionProps } from './LazySection'

/**
 * Componente genérico para lazy loading basado en viewport
 * 
 * Alias de LazySection para claridad semántica.
 * Carga el contenido cuando el elemento entra al viewport.
 * 
 * @example
 * <LazyViewport 
 *   configKey="trendingSearches" 
 *   skeleton={<TrendingSearchesSkeleton />}
 * >
 *   <TrendingSearches />
 * </LazyViewport>
 */
export const LazyViewport = LazySection

export type { LazySectionProps as LazyViewportProps }
