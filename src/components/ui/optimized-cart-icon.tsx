'use client'

import Image from 'next/image'
import { useState } from 'react'

interface OptimizedCartIconProps {
  width?: number
  height?: number
  className?: string
  alt?: string
  style?: React.CSSProperties
  color?: string
}

export const OptimizedCartIcon = ({
  width = 32,
  height = 32,
  className = 'w-8 h-8',
  alt = 'Carrito',
  style,
  color,
}: OptimizedCartIconProps) => {
  // ⚡ MULTITENANT: Usar color del prop o del style, o fallback
  const iconColor = color || (style?.color as string) || '#ea5a17'

  // ⚡ OPTIMIZACIÓN: Usar SVG directamente para iconos pequeños (evita cargar 512x512px para mostrar 32x32px)
  // Esto elimina el desperdicio de 45.4 KiB según Lighthouse
  return (
    <svg
      width={width}
      height={height}
      className={className}
      viewBox='0 0 24 24'
      fill='none'
      stroke={iconColor}
      strokeWidth='2'
      strokeLinecap='round'
      strokeLinejoin='round'
      aria-label={alt}
      style={style}
    >
      <circle cx='9' cy='21' r='1'></circle>
      <circle cx='20' cy='21' r='1'></circle>
      <path d='m1 1 4 4 2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6'></path>
    </svg>
  )
}
