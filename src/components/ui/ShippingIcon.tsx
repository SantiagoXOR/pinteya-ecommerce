'use client'

import React from 'react'
import { useTenantAssets } from '@/contexts/TenantContext'

const FALLBACK_SHIPPING_ICON = '/images/icons/icon-envio.svg'

export interface ShippingIconProps extends Omit<React.ImgHTMLAttributes<HTMLImageElement>, 'src' | 'alt'> {
  /** Clase CSS adicional */
  className?: string
  /** Texto alternativo (default: "Envío gratis") */
  alt?: string
  /** loading: lazy por defecto para no competir con LCP; "eager" para above-the-fold (ej. header carrusel) */
  loading?: 'lazy' | 'eager'
  /** Ancho en px (default 36) para reservar espacio y evitar colapso si la imagen tarda o falla */
  width?: number
  /** Alto en px (default 36) */
  height?: number
}

/**
 * Icono de envío gratis compartido. Usa useTenantAssets().shippingIcon (URL canónica)
 * y <img> nativo (no Next/Image) para evitar duplicados y competencia con LCP.
 * Fallback a /images/icons/icon-envio.svg en onError.
 */
export function ShippingIcon({
  className,
  alt = 'Envío gratis',
  loading = 'lazy',
  width = 36,
  height = 36,
  onError,
  ...rest
}: ShippingIconProps) {
  const { shippingIcon } = useTenantAssets()

  const handleError = React.useCallback(
    (e: React.SyntheticEvent<HTMLImageElement, Event>) => {
      const target = e.target as HTMLImageElement
      const isAlreadyFallback =
        target.src === FALLBACK_SHIPPING_ICON ||
        target.src.endsWith('/images/icons/icon-envio.svg')
      if (!isAlreadyFallback) {
        target.src = FALLBACK_SHIPPING_ICON
      }
      onError?.(e)
    },
    [onError]
  )

  return (
    <img
      src={shippingIcon}
      alt={alt}
      width={width}
      height={height}
      loading={loading}
      className={className}
      onError={handleError}
      decoding='async'
      {...rest}
    />
  )
}
