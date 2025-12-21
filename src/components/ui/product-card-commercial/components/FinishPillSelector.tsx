'use client'

import React from 'react'
import { FinishPill } from './FinishPill'

interface FinishPillSelectorProps {
  finishes: string[]
  availableFinishes: string[]
  selectedFinish: string | null
  onFinishSelect: (finish: string) => void
}

/**
 * Selector de finishes (terminaciones) con scroll horizontal
 * Similar a ColorPillSelector y MeasurePillSelector
 */
export const FinishPillSelector = React.memo(function FinishPillSelector({
  finishes,
  availableFinishes,
  selectedFinish,
  onFinishSelect,
}: FinishPillSelectorProps) {
  if (!finishes || finishes.length === 0) return null

  return (
    <div className='relative flex items-center justify-between gap-2 overflow-visible'>
      <div className='relative flex-1 min-w-0 overflow-visible'>
        <div 
          className='flex items-center gap-1.5 overflow-x-auto overflow-y-visible scrollbar-hide scroll-smooth py-1 pl-0 pr-16' 
          style={{ scrollbarWidth: 'none', msOverflowStyle: 'none', overflowY: 'visible' }}
        >
          {finishes.map((finish, index) => {
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
          })}
        </div>
      </div>
    </div>
  )
})

FinishPillSelector.displayName = 'FinishPillSelector'
