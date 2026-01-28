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
  onError,
  ...rest
}: ShippingIconProps) {
  const { shippingIcon } = useTenantAssets()

  const handleError = React.useCallback(
    (e: React.SyntheticEvent<HTMLImageElement, Event>) => {
      const target = e.target as HTMLImageElement
      if (target.src !== FALLBACK_SHIPPING_ICON) {
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
      loading={loading}
      className={className}
      onError={handleError}
      {...rest}
    />
  )
}
