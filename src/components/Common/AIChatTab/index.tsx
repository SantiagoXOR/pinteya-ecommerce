'use client'

import React from 'react'
import { cn } from '@/lib/utils'
import { useAIChatPopupContext } from '@/app/context/AIChatPopupContext'
import { useTenantSafe } from '@/contexts/TenantContext'

/**
 * Pestaña "Luis | Pintemas" con punto verde (en línea).
 * Al hacer click abre el popup del chat con IA.
 * Se muestra encima del bottom bar; el botón WhatsApp sigue redirigiendo a wa.me.
 */
export function AIChatTab() {
  const { openChat } = useAIChatPopupContext()
  const tenant = useTenantSafe()

  const label =
    tenant?.slug === 'pintemas'
      ? 'Luis | Pintemas'
      : `Asistente | ${tenant?.name ?? 'Tienda'}`

  return (
    <button
      type="button"
      onClick={openChat}
      className={cn(
        'fixed left-0 right-0 z-bottom-nav flex items-center justify-center gap-2',
        'h-10 safe-area-bottom border-t border-b bg-white/95 backdrop-blur-sm',
        'shadow-[0_-2px_8px_rgba(0,0,0,0.08)]',
        'text-gray-800 font-medium text-sm',
        'active:scale-[0.98] transition-transform'
      )}
      style={{
        bottom: 'calc(3.5rem + env(safe-area-inset-bottom, 0px))',
      }}
      aria-label={`Abrir chat con ${label}`}
    >
      <span className="relative flex h-2 w-2" aria-hidden>
        <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75" />
        <span className="relative inline-flex h-2 w-2 rounded-full bg-emerald-500" />
      </span>
      <span>{label}</span>
    </button>
  )
}
