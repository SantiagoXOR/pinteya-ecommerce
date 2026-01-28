'use client'

import { useState, useEffect } from 'react'

/**
 * Deriva el slug del tenant desde el hostname (solo cliente).
 * Evita mostrar fallbacks genéricos (p. ej. Pinteya) en dominios de otro tenant (p. ej. pintemas.com).
 */
export function useSlugFromHostname(): string | null {
  const [slug, setSlug] = useState<string | null>(null)

  useEffect(() => {
    if (typeof window === 'undefined') return
    const h = window.location.hostname.toLowerCase()
    if (h.includes('pintemas')) setSlug('pintemas')
    else if (h.includes('pinteya')) setSlug('pinteya')
    else setSlug(null)
  }, [])

  return slug
}
