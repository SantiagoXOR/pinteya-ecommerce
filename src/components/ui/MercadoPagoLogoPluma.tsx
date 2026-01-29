'use client'

/**
 * Logo Mercado Pago "pluma vertical" (MP_RGB_HANDSHAKE_pluma_vertical.svg)
 * Pintado con el color del tenant (accentColor) usando CSS mask.
 * Solo para Footer / secciones generales; en carrito y checkout se usa el logo horizontal.
 */
import React from 'react'

const PLUMA_SVG = '/images/logo/MercadoPagoLogos/SVGs/MP_RGB_HANDSHAKE_pluma_vertical.svg'

interface MercadoPagoLogoPlumaProps {
  /** Color del logo (p. ej. tenant.accentColor) */
  color?: string
  /** Ancho en px; altura proporcional (SVG es cuadrado 700x700) */
  width?: number
  className?: string
  alt?: string
}

export function MercadoPagoLogoPluma({
  color = '#ffd549',
  width = 48,
  className = '',
  alt = 'Mercado Pago',
}: MercadoPagoLogoPlumaProps) {
  const height = width

  return (
    <div
      className={className}
      role="img"
      aria-label={alt}
      style={{
        width,
        height,
        backgroundColor: color,
        maskImage: `url(${PLUMA_SVG})`,
        WebkitMaskImage: `url(${PLUMA_SVG})`,
        maskSize: 'contain',
        maskRepeat: 'no-repeat',
        maskPosition: 'center',
        WebkitMaskSize: 'contain',
        WebkitMaskRepeat: 'no-repeat',
        WebkitMaskPosition: 'center',
        flexShrink: 0,
        filter: 'drop-shadow(0 8px 25px rgba(0,0,0,0.25))',
      }}
    />
  )
}
