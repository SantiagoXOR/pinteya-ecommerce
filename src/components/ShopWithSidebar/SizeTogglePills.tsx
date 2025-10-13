"use client"

import React from 'react'
import { Button } from '@/components/ui/button'

export interface SizeTogglePillsProps {
  sizes?: string[]
  selectedSizes: string[]
  onChange: (selected: string[]) => void
}

const DEFAULT_SIZES = ['L', 'XL', 'XXL']

export const SizeTogglePills: React.FC<SizeTogglePillsProps> = ({
  sizes = DEFAULT_SIZES,
  selectedSizes,
  onChange,
}) => {
  const toggle = (size: string) => {
    const isSelected = selectedSizes.includes(size)
    const next = isSelected ? selectedSizes.filter(s => s !== size) : [...selectedSizes, size]
    onChange(next)
  }

  if (!sizes || sizes.length === 0) return null

  return (
    <div className="flex items-center gap-2 overflow-x-auto py-1">
      {sizes.map(size => {
        const isSelected = selectedSizes.includes(size)
        return (
          <Button
            key={size}
            variant={isSelected ? 'default' : 'outline'}
            size="sm"
            onClick={() => toggle(size)}
            className={`rounded-full h-8 px-3 text-xs border-2 ${
              isSelected
                ? 'bg-[#009e44] text-white border-[#eb6313]'
                : 'bg-[#007639] hover:bg-[#009e44] text-white border-[#007639]'
            }`}
          >
            {size}
          </Button>
        )
      })}
    </div>
  )
}

export default SizeTogglePills