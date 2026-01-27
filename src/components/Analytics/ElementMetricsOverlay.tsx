/**
 * Componente que posiciona badges sobre elementos interactuados
 * Usado en RouteVisualizer para mostrar métricas sobre la página
 */

'use client'

import React from 'react'
import { ElementBadge } from './ElementBadge'

interface ElementMetrics {
  elementSelector: string
  elementPosition: { x: number; y: number }
  elementDimensions: { width: number; height: number }
  interactions: {
    clicks: number
    hovers: number
    scrolls: number
    conversions: number
  }
  metrics: {
    totalInteractions: number
    uniqueUsers: number
    averageHoverTime: number
    conversionRate: number
    clickThroughRate: number
  }
  deviceBreakdown: {
    mobile: { interactions: number; users: number }
    desktop: { interactions: number; users: number }
  }
}

interface ElementMetricsOverlayProps {
  elements: ElementMetrics[]
  device: 'mobile' | 'desktop' | 'all'
  onElementClick: (element: ElementMetrics) => void
  interactionFilter?: ('click' | 'hover' | 'scroll')[]
}

export const ElementMetricsOverlay: React.FC<ElementMetricsOverlayProps> = ({
  elements,
  device,
  onElementClick,
  interactionFilter = ['click', 'hover', 'scroll'],
}) => {
  // Filtrar elementos según tipo de interacción
  const filteredElements = elements.filter(element => {
    if (interactionFilter.includes('click') && element.interactions.clicks > 0) return true
    if (interactionFilter.includes('hover') && element.interactions.hovers > 0) return true
    if (interactionFilter.includes('scroll') && element.interactions.scrolls > 0) return true
    return false
  })

  return (
    <div className='absolute inset-0 pointer-events-none z-10'>
      {filteredElements.map((element, index) => (
        <ElementBadge
          key={`${element.elementSelector}-${index}`}
          element={element}
          position={element.elementPosition}
          device={device}
          onClick={() => onElementClick(element)}
        />
      ))}
    </div>
  )
}

export default ElementMetricsOverlay
