'use client'

/**
 * Logo de Mercado Pago con color por tenant (accentColor).
 * SVG inline con fill currentColor para poder teñir con el accent del tenant.
 */
import React from 'react'

interface MercadoPagoLogoProps {
  /** Color del logo (p. ej. tenant.accentColor). Default: azul MP */
  color?: string
  /** Ancho en px; altura se escala automáticamente */
  width?: number
  /** Clases adicionales para el contenedor */
  className?: string
  /** Alt para accesibilidad */
  alt?: string
}

export function MercadoPagoLogo({
  color = '#009ee3',
  width = 140,
  className = '',
  alt = 'Mercado Pago',
}: MercadoPagoLogoProps) {
  const height = Math.round((width * 55) / 140)

  return (
    <span
      className={className}
      style={{ color, display: 'inline-block', width, height }}
      role="img"
      aria-label={alt}
    >
      <svg
        viewBox="0 0 140 55"
        fill="currentColor"
        className="w-full h-full drop-shadow-[0_8px_25px_rgba(0,0,0,0.25)]"
        preserveAspectRatio="xMidYMid meet"
      >
        {/* Badge óvalo (icono Mercado Pago) */}
        <ellipse cx="42" cy="27" rx="22" ry="18" fill="currentColor" opacity="0.2" />
        <ellipse cx="42" cy="27" rx="20" ry="16" fill="none" stroke="currentColor" strokeWidth="2.5" />
        {/* Texto "mercado pago" */}
        <text x="70" y="38" fontSize="14" fontWeight="600" fill="currentColor" fontFamily="system-ui, -apple-system, sans-serif" letterSpacing="0.02em">mercado pago</text>
      </svg>
    </span>
  )
}
