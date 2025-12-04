"use client"

import React from 'react'
import { Button } from '@/components/ui/button'

export interface ColorTogglePillsProps {
  colors?: { name: string; hex: string }[]
  selectedColors: string[] // names
  onChange: (selected: string[]) => void
}

const DEFAULT_COLORS: { name: string; hex: string }[] = [
  { name: 'Rojo', hex: '#EF4444' },
  { name: 'Azul', hex: '#2563EB' },
  { name: 'Naranja', hex: '#F59E0B' },
  { name: 'Rosa', hex: '#F472B6' },
  { name: 'Violeta', hex: '#7C3AED' },
]

export const ColorTogglePills: React.FC<ColorTogglePillsProps> = ({
  colors = DEFAULT_COLORS,
  selectedColors,
  onChange,
}) => {
  const toggle = (name: string) => {
    const isSelected = selectedColors.includes(name)
    const next = isSelected ? selectedColors.filter(c => c !== name) : [...selectedColors, name]
    onChange(next)
  }

  if (!colors || colors.length === 0) return null

  return (
    <div className="flex items-center gap-2 overflow-x-auto py-1">
      {colors.map(({ name, hex }) => {
        const isSelected = selectedColors.includes(name)
        return (
          <button
            key={name}
            type="button"
            onClick={() => toggle(name)}
            className={`${isSelected ? 'ring-2 ring-[#EB6313]' : ''} rounded-full p-1 bg-transparent`}
            aria-label={`Color ${name}`}
            title={name}
          >
            <span
              className="inline-block w-5 h-5 rounded-full border-2 border-white"
              style={{ backgroundColor: hex }}
            />
          </button>
        )
      })}
    </div>
  )
}

export default ColorTogglePills