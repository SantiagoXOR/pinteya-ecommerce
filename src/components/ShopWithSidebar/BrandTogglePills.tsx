"use client"

import React from 'react'
import Image from 'next/image'
import { Button } from '@/components/ui/button'

export interface BrandTogglePillsProps {
  brands?: { name: string; slug: string; logo?: string }[]
  selectedBrands: string[]
  onChange: (selected: string[]) => void
}

const DEFAULT_BRANDS: { name: string; slug: string; logo?: string }[] = [
  { name: 'Alba', slug: 'alba', logo: '/images/marks/alba.png' },
  { name: 'Cetol', slug: 'cetol', logo: '/images/marks/cetol.png' },
  { name: 'El Galgo', slug: 'el-galgo', logo: '/images/marks/elgalgo.png' },
  { name: 'Petrilac', slug: 'petrilac', logo: '/images/marks/petrilac.png' },
  { name: 'Plavicon', slug: 'plavicon', logo: '/images/marks/plavicon.png' },
  { name: 'Rust-Oleum', slug: 'rust-oleum', logo: '/images/marks/rustoleum.png' },
  { name: 'Sherwin Williams', slug: 'sherwin-williams', logo: '/images/marks/sherwin.png' },
  { name: 'Sinteplast', slug: 'sinteplast', logo: '/images/marks/sinteplast.png' },
  { name: 'Tersuave', slug: 'tersuave', logo: '/images/marks/tersuave.png' },
]

export const BrandTogglePills: React.FC<BrandTogglePillsProps> = ({
  brands = DEFAULT_BRANDS,
  selectedBrands,
  onChange,
}) => {
  const toggle = (slug: string) => {
    const isSelected = selectedBrands.includes(slug)
    const next = isSelected ? selectedBrands.filter(s => s !== slug) : [...selectedBrands, slug]
    onChange(next)
  }

  if (!brands || brands.length === 0) return null

  return (
    <div className="flex items-center gap-2 overflow-x-auto py-1">
      {brands.map(({ name, slug, logo }) => {
        const isSelected = selectedBrands.includes(slug)
        return (
          <Button
            key={slug}
            variant={isSelected ? 'default' : 'outline'}
            size="sm"
            onClick={() => toggle(slug)}
            className={`rounded-full h-10 px-3 flex items-center justify-center border ${
              isSelected
                ? 'bg-white border-[#D9D9D9] shadow-sm'
                : 'bg-white hover:bg-[#FFF5CC] border-[#E6E6E6]'
            }`}
            title={name}
            aria-label={`Marca ${name}`}
          >
            {logo && (
              <span className="relative w-16 h-6">
                <Image src={logo} alt={name} fill sizes="64px" className="object-contain" />
              </span>
            )}
          </Button>
        )
      })}
    </div>
  )
}

export default BrandTogglePills