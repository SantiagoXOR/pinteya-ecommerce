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
        'fixed z-bottom-nav flex items-center justify-center gap-1.5',
        'h-8 px-3 rounded-t-xl rounded-b-none',
        'bg-white/95 backdrop-blur-sm border border-b-0 border-gray-200',
        'shadow-[0_-2px_8px_rgba(0,0,0,0.06)]',
        'text-gray-700 font-medium text-xs',
        'active:scale-[0.98] transition-transform',
        'max-w-[140px] min-w-[100px]'
      )}
      style={{
        bottom: 'calc(3.5rem + env(safe-area-inset-bottom, 0px))',
        right: 'max(env(safe-area-inset-right, 0px), 12px)',
      }}
      aria-label={`Abrir chat con ${label}`}
    >
      <span className="relative flex h-1.5 w-1.5 shrink-0" aria-hidden>
        <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75" />
        <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-emerald-500" />
      </span>
      <span className="truncate">{label}</span>
    </button>
  )
}
