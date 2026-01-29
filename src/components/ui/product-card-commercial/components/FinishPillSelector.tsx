'use client'

import React from 'react'
import { FinishPill } from './FinishPill'
import { useHorizontalScroll } from '../hooks/useHorizontalScroll'

interface FinishPillSelectorProps {
  finishes: string[]
  availableFinishes: string[]
  selectedFinish: string | null
  onFinishSelect: (finish: string) => void
  /** Activa scroll automático tipo marquee cuando el card está hover/touch (solo si hay overflow) */
  autoScroll?: boolean
}

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
 * Selector de finishes (terminaciones) con scroll horizontal
 * Con autoScroll: efecto marquee (scroll automático) al hover/touch en el card cuando hay overflow
 */
export const FinishPillSelector = React.memo(function FinishPillSelector({
  finishes,
  availableFinishes,
  selectedFinish,
  onFinishSelect,
  autoScroll = false
}: FinishPillSelectorProps) {
  if (!finishes || finishes.length === 0) return null

  const { scrollContainerRef, canScrollLeft, canScrollRight } = useHorizontalScroll({
    deps: [finishes]
  })

  const hasOverflow = canScrollLeft || canScrollRight
  const useMarquee = autoScroll && hasOverflow

  const renderPills = () =>
    finishes.map((finish, index) => {
      const isAvailable = availableFinishes.includes(finish)
      return (
        <FinishPill
          key={`${finish}-${index}`}
          finish={finish}
          isSelected={selectedFinish === finish}
          isAvailable={isAvailable}
          onSelect={onFinishSelect}
        />
      )
    })

  if (useMarquee) {
    return (
      <div className='relative w-full overflow-hidden'>
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
  const prevFinishesLength = prevProps.finishes?.length || 0
  const nextFinishesLength = nextProps.finishes?.length || 0
  const prevAvailableLength = prevProps.availableFinishes?.length || 0
  const nextAvailableLength = nextProps.availableFinishes?.length || 0
  if (prevFinishesLength !== nextFinishesLength || prevAvailableLength !== nextAvailableLength) {
    return false
  }
  const finishesEqual = prevProps.finishes.every((finish, idx) => finish === nextProps.finishes?.[idx])
  const availableEqual = prevProps.availableFinishes.every(
    (finish, idx) => finish === nextProps.availableFinishes?.[idx]
  )
  return (
    finishesEqual &&
    availableEqual &&
    prevProps.selectedFinish === nextProps.selectedFinish &&
    prevProps.autoScroll === nextProps.autoScroll &&
    prevProps.onFinishSelect === nextProps.onFinishSelect
  )
})

FinishPillSelector.displayName = 'FinishPillSelector'
