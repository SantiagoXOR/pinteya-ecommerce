'use client'

import React from 'react'
import { ColorPill } from './ColorPill'
import { useHorizontalScroll } from '../hooks/useHorizontalScroll'
import type { ColorPillSelectorProps } from '../types'

const pillRowStyles: React.CSSProperties = {
  scrollbarWidth: 'none',
  msOverflowStyle: 'none',
  WebkitOverflowScrolling: 'touch',
  gap: 'clamp(0.25rem, 1vw, 0.375rem)',
  paddingTop: 'clamp(0.125rem, 0.5vw, 0.25rem)',
  paddingBottom: 'clamp(0.125rem, 0.5vw, 0.25rem)',
  paddingLeft: 'clamp(0.75rem, 2vw, 1rem)',
  paddingRight: 'clamp(0.75rem, 2vw, 1rem)',
}

/**
 * Selector de colores con scroll horizontal
 * Con autoScroll: efecto marquee (scroll automático) al hover/touch en el card cuando hay overflow
 */
export const ColorPillSelector = React.memo(function ColorPillSelector({
  colors,
  selectedColor,
  onColorSelect,
  isImpregnante,
  selectedFinish,
  autoScroll = false
}: ColorPillSelectorProps) {
  if (colors.length === 0) {
    return null
  }

  const { scrollContainerRef, canScrollLeft, canScrollRight } = useHorizontalScroll({
    deps: [colors]
  })

  const hasOverflow = canScrollLeft || canScrollRight
  const useMarquee = autoScroll && hasOverflow

  const renderPills = () =>
    colors.map((colorData, index) => (
      <ColorPill
        key={`${colorData.hex}-${index}`}
        colorData={colorData}
        isSelected={selectedColor === colorData.hex}
        onSelect={onColorSelect}
        isImpregnante={isImpregnante}
        selectedFinish={selectedFinish}
      />
    ))

  if (useMarquee) {
    return (
      <div className='relative w-full overflow-hidden'>
        {/* Contenedor oculto para medir overflow (misma geometría que la fila visible) */}
        <div
          className='absolute inset-0 overflow-hidden'
          style={{ visibility: 'hidden', pointerEvents: 'none' }}
          aria-hidden
        >
          <div
            ref={scrollContainerRef}
            className='flex items-center overflow-x-auto overflow-y-hidden w-full h-full scrollbar-hide'
            style={pillRowStyles}
          >
            {renderPills()}
          </div>
        </div>
        {/* Marquee visible: contenido duplicado + animación */}
        <div
          className='flex items-center overflow-x-hidden w-full'
          style={{
            paddingTop: pillRowStyles.paddingTop,
            paddingBottom: pillRowStyles.paddingBottom,
            paddingLeft: pillRowStyles.paddingLeft,
            paddingRight: pillRowStyles.paddingRight
          }}
        >
          <div className='flex items-center whitespace-nowrap animate-pills-scroll-infinite' style={{ gap: pillRowStyles.gap }}>
            {renderPills()}
            {renderPills()}
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className='relative w-full overflow-hidden'>
      {canScrollLeft && (
        <div
          className='absolute left-0 inset-y-0 w-8 z-10 pointer-events-none'
          style={{ background: 'linear-gradient(to right, rgba(255, 255, 255, 0.95), transparent)' }}
        />
      )}
      <div
        ref={scrollContainerRef}
        className='flex items-center overflow-x-auto overflow-y-hidden scroll-smooth w-full scrollbar-hide'
        style={pillRowStyles}
      >
        {renderPills()}
      </div>
      {canScrollRight && (
        <div
          className='absolute right-0 inset-y-0 w-8 z-10 pointer-events-none'
          style={{ background: 'linear-gradient(to left, rgba(255, 255, 255, 0.95), transparent)' }}
        />
      )}
    </div>
  )
}, (prevProps, nextProps) => {
  const prevColorsLength = prevProps.colors?.length || 0
  const nextColorsLength = nextProps.colors?.length || 0
  if (prevColorsLength !== nextColorsLength) return false
  const colorsEqual = prevProps.colors.every((color, idx) =>
    color.hex === nextProps.colors?.[idx]?.hex && color.name === nextProps.colors?.[idx]?.name
  )
  return (
    colorsEqual &&
    prevProps.selectedColor === nextProps.selectedColor &&
    prevProps.isImpregnante === nextProps.isImpregnante &&
    prevProps.selectedFinish === nextProps.selectedFinish &&
    prevProps.autoScroll === nextProps.autoScroll &&
    prevProps.onColorSelect === nextProps.onColorSelect
  )
})

ColorPillSelector.displayName = 'ColorPillSelector'
