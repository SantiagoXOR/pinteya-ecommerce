"use client"

import React from 'react'
import { Button } from '@/components/ui/button'

export interface PriceRangePillsProps {
  selected?: { min?: number; max?: number }
  onSelect: (min?: number, max?: number) => void
  ranges?: { label: string; min?: number; max?: number }[]
}

const DEFAULT_RANGES: { label: string; min?: number; max?: number }[] = [
  { label: 'Todos' },
  { label: '$0 - $1.500', min: 0, max: 1500 },
  { label: '$1.500 - $5.000', min: 1500, max: 5000 },
  { label: '$5.000 - $15.000', min: 5000, max: 15000 },
]

export const PriceRangePills: React.FC<PriceRangePillsProps> = ({ selected, onSelect, ranges = DEFAULT_RANGES }) => {
  const isActive = (min?: number, max?: number) => selected?.min === min && selected?.max === max

  return (
    <div className="flex items-center gap-2 overflow-x-auto py-1">
      {ranges.map(({ label, min, max }) => {
        const active = isActive(min, max)
        return (
          <Button
            key={label}
            variant={active ? 'default' : 'outline'}
            size="sm"
            onClick={() => onSelect(min, max)}
            className={`rounded-full h-8 px-3 text-xs border-2 ${
              active
                ? 'bg-[#009e44] text-white border-[#eb6313]'
                : 'bg-[#007639] hover:bg-[#009e44] text-white border-[#007639]'
            }`}
          >
            {label}
          </Button>
        )
      })}
    </div>
  )
}

export default PriceRangePills