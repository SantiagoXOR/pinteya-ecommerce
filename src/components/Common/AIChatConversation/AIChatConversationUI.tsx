'use client'

import React, { useCallback } from 'react'
import dynamic from 'next/dynamic'
import { cn } from '@/lib/utils'
import type { AIChatMessage } from '@/hooks/useAIChatSend'

const ProductItem = dynamic(
  () => import('@/components/Common/ProductItem').then((m) => ({ default: m.default })),
  { ssr: false, loading: () => <div className="w-[180px] h-[280px] rounded-lg bg-muted animate-pulse" /> }
)

export interface AIChatConversationUIProps {
  displayMessages: AIChatMessage[]
  inputValue: string
  setInputValue: (value: string) => void
  isLoading: boolean
  handleSend: (text: string) => void
  handleApplicationClick: (app: string) => void
  applications: readonly string[]
  theme?: { primaryColor?: string; accentColor?: string } | null
  debugSlot?: React.ReactNode
  className?: string
}

export function AIChatConversationUI({
  displayMessages,
  inputValue,
  setInputValue,
  isLoading,
  handleSend,
  handleApplicationClick,
  applications,
  theme,
  debugSlot,
  className,
}: AIChatConversationUIProps) {
  const handleSubmit = useCallback(
    (e: React.FormEvent) => {
      e.preventDefault()
      handleSend(inputValue)
    },
    [inputValue, handleSend]
  )

  return (
    <div className={cn('flex flex-col min-h-0', className)}>
      <div className="flex-1 overflow-y-auto space-y-4 min-h-0">
        {displayMessages.map((msg, i) => (
          <div
            key={i}
            className={cn(
              'flex flex-col',
              msg.role === 'user' ? 'items-end' : 'items-start'
            )}
          >
            <div
              className={cn(
                'max-w-[85%] rounded-2xl px-4 py-2.5 text-sm',
                msg.role === 'user'
                  ? 'text-white'
                  : 'bg-muted text-foreground'
              )}
              style={
                msg.role === 'user' && theme?.primaryColor
                  ? { backgroundColor: theme.primaryColor }
                  : undefined
              }
            >
              <p className="whitespace-pre-wrap">{msg.content}</p>
            </div>
            {msg.role === 'assistant' && msg.products && msg.products.length > 0 && (
              <div
                className="w-full mt-2 -mx-2 px-2 flex gap-2 sm:gap-4 md:gap-6 overflow-x-auto scrollbar-hide scroll-smooth pb-4 pr-2"
                style={{
                  scrollbarWidth: 'none',
                  msOverflowStyle: 'none',
                  WebkitOverflowScrolling: 'touch',
                  willChange: 'scroll-position',
                  transform: 'translateZ(0)',
                }}
              >
                {msg.products.map((p) => (
                  <div
                    key={String((p as Record<string, unknown>).id)}
                    className="flex-shrink-0 w-[calc(50vw-1.5rem)] min-w-[168px] sm:w-[calc(50%-0.5rem)] md:w-[calc(50%-0.75rem)] max-w-[240px]"
                  >
                    <ProductItem product={p as Record<string, unknown>} />
                  </div>
                ))}
              </div>
            )}
          </div>
        ))}
        {isLoading && (
          <div className="flex justify-start">
            <div className="rounded-2xl bg-muted px-4 py-2.5 text-sm text-muted-foreground">
              Escribiendo...
            </div>
          </div>
        )}
      </div>

      {debugSlot && <div className="flex-shrink-0 mt-2">{debugSlot}</div>}

      {displayMessages.length <= 1 && (
        <div className="flex flex-wrap gap-2 mb-3 flex-shrink-0">
          {applications.map((app) => (
            <button
              key={app}
              type="button"
              onClick={() => handleApplicationClick(app)}
              className="rounded-full border border-gray-300 bg-gray-50 px-3 py-2 text-xs font-medium text-gray-800 hover:bg-gray-100 hover:border-gray-400 transition-colors"
              style={
                theme?.accentColor
                  ? { borderColor: theme.accentColor, color: theme.primaryColor }
                  : undefined
              }
            >
              {app}
            </button>
          ))}
        </div>
      )}

      <form onSubmit={handleSubmit} className="flex gap-2 pt-2 border-t flex-shrink-0">
        <input
          type="text"
          value={inputValue}
          onChange={(e) => setInputValue(e.target.value)}
          placeholder="Escribí tu mensaje..."
          className="flex-1 rounded-lg border border-input bg-background px-4 py-2.5 text-sm outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 text-foreground placeholder:text-muted-foreground"
          disabled={isLoading}
        />
        <button
          type="submit"
          disabled={!inputValue.trim() || isLoading}
          className="rounded-lg px-4 py-2.5 text-sm font-medium text-white disabled:opacity-50 disabled:pointer-events-none transition-opacity hover:opacity-90 bg-primary"
          style={
            theme?.primaryColor
              ? { backgroundColor: theme.primaryColor }
              : undefined
          }
        >
          Enviar
        </button>
      </form>
    </div>
  )
}
