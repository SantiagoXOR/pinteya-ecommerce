'use client'

import { useState, useEffect } from 'react'

function getSlugFromHost(): string | null {
  if (typeof window === 'undefined') return null
  const h = window.location.hostname.toLowerCase()
  if (h.includes('pintemas')) return 'pintemas'
  if (h.includes('pinteya')) return 'pinteya'
  return null
}

/**
 * Deriva el slug del tenant desde el hostname (solo cliente).
 * Evita mostrar fallbacks genéricos (p. ej. Pinteya) en dominios de otro tenant (p. ej. pintemas.com).
 * Inicializa en el primer render con el hostname actual para no depender de useEffect y reducir
 * parpadeos de fallback al refrescar.
 */
export function useSlugFromHostname(): string | null {
  const [slug, setSlug] = useState<string | null>(getSlugFromHost)

  useEffect(() => {
    const next = getSlugFromHost()
    setSlug((prev) => (prev !== next ? next : prev))
  }, [])

  return slug
}
