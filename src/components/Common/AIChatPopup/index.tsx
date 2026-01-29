'use client'

import React, { useState, useMemo, useCallback } from 'react'
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet'
import { useAIChatPopupContext } from '@/app/context/AIChatPopupContext'
import { useTenantSafe } from '@/contexts/TenantContext'
import { getTenantWhatsAppNumber } from '@/lib/tenant/tenant-whatsapp'
import { useCartUnified } from '@/hooks/useCartUnified'
import { useCartModalContext } from '@/app/context/CartSidebarModalContext'
import { cn } from '@/lib/utils'
import { MessageCircle } from '@/lib/optimized-imports'

const APPLICATIONS = [
  'Interior',
  'Exterior',
  'Madera',
  'Metal',
  'Paredes',
  'Techos',
  'Muebles',
  'Automotor',
] as const

function getGreeting(): string {
  const hour = new Date().getHours()
  if (hour >= 5 && hour < 12) return 'Buen día'
  if (hour >= 12 && hour < 20) return 'Buenas tardes'
  return 'Buenas noches'
}

function getAgentName(tenantSlug: string | undefined, tenantName: string | null): string {
  if (tenantSlug === 'pintemas') return 'Luis de Pintemas'
  return tenantName ? `asistente de ${tenantName}` : 'tu asistente'
}

export interface ChatMessage {
  role: 'user' | 'assistant'
  content: string
  products?: Array<{
    id: number
    name: string
    slug: string
    price?: number
    discounted_price?: number
    images?: string[]
    [key: string]: unknown
  }>
}

export default function AIChatPopup() {
  const { isChatOpen, closeChat } = useAIChatPopupContext()
  const tenant = useTenantSafe()
  const [messages, setMessages] = useState<ChatMessage[]>([])
  const [inputValue, setInputValue] = useState('')
  const [isLoading, setIsLoading] = useState(false)

  const greeting = useMemo(() => getGreeting(), [])
  const agentName = useMemo(
    () => getAgentName(tenant?.slug, tenant?.name ?? null),
    [tenant?.slug, tenant?.name]
  )
  const initialBotMessage = useMemo(
    () =>
      `${greeting}, soy ${agentName}. ¿Qué vas a pintar hoy? Elegí una opción o escribime.`,
    [greeting, agentName]
  )

  const whatsappNumber = getTenantWhatsAppNumber(tenant)
  const whatsappUrl = `https://wa.me/${whatsappNumber}`

  const handleOpenChange = useCallback(
    (open: boolean) => {
      if (!open) closeChat()
    },
    [closeChat]
  )

  const handleSend = useCallback(
    async (text: string) => {
      const trimmed = text.trim()
      if (!trimmed || isLoading) return

      setMessages((prev) => [...prev, { role: 'user', content: trimmed }])
      setInputValue('')
      setIsLoading(true)

      try {
        const res = await fetch('/api/ai-chat/respond', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            messages: [...messages, { role: 'user', content: trimmed }].map(
              (m) => ({ role: m.role, content: m.content })
            ),
          }),
        })
        const data = await res.json()

        if (!res.ok) {
          setMessages((prev) => [
            ...prev,
            {
              role: 'assistant',
              content:
                data?.error ||
                'No pude procesar tu mensaje. Probá de nuevo o escribinos por WhatsApp.',
            },
          ])
          return
        }

        const reply = data?.reply ?? 'No pude generar una respuesta.'
        let products = data?.products ?? null

        if (
          (data?.suggestedCategory || data?.suggestedSearch) &&
          !products?.length
        ) {
          const params = new URLSearchParams()
          if (data.suggestedCategory)
            params.set('category', data.suggestedCategory)
          if (data.suggestedSearch) params.set('search', data.suggestedSearch)
          params.set('limit', '6')
          const productsRes = await fetch(`/api/products?${params.toString()}`)
          const productsData = await productsRes.json()
          const raw = productsData?.data?.slice?.(0, 6) ?? []
          products = raw.map((p: Record<string, unknown>) => ({
            id: p.id,
            name: p.name,
            slug: p.slug,
            price: p.price,
            discounted_price: p.discounted_price ?? p.price,
            images: Array.isArray(p.images)
              ? p.images
              : p.image_url
                ? [p.image_url]
                : [],
          }))
        }

        setMessages((prev) => [
          ...prev,
          {
            role: 'assistant',
            content: reply,
            products: products ?? undefined,
          },
        ])
      } catch {
        setMessages((prev) => [
          ...prev,
          {
            role: 'assistant',
            content:
              'Hubo un error. Escribinos por WhatsApp y te ayudamos.',
          },
        ])
      } finally {
        setIsLoading(false)
      }
    },
    [messages, isLoading]
  )

  const handleApplicationClick = useCallback(
    (app: string) => {
      handleSend(`Quiero pintar ${app.toLowerCase()}.`)
    },
    [handleSend]
  )

  const handleSubmit = useCallback(
    (e: React.FormEvent) => {
      e.preventDefault()
      handleSend(inputValue)
    },
    [inputValue, handleSend]
  )

  const displayMessages = useMemo(() => {
    if (messages.length === 0) {
      return [
        {
          role: 'assistant' as const,
          content: initialBotMessage,
          products: undefined as ChatMessage['products'],
        },
      ]
    }
    return messages
  }, [messages, initialBotMessage])

  return (
    <Sheet open={isChatOpen} onOpenChange={handleOpenChange}>
      <SheetContent
        side="bottom"
        className="flex h-[85vh] max-h-[85vh] flex-col !bottom-0 rounded-t-2xl border-t pt-12 pb-8"
      >
        <SheetHeader className="sr-only">
          <SheetTitle>
            Chat con {tenant?.name ?? 'tienda'}
          </SheetTitle>
        </SheetHeader>

        {/* Header visible */}
        <div className="flex items-center justify-between border-b pb-3 mb-3">
          <div className="flex items-center gap-2">
            <span className="relative flex h-2 w-2">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75" />
              <span className="relative inline-flex h-2 w-2 rounded-full bg-emerald-500" />
            </span>
            <h2 className="font-semibold text-foreground">
              Luis | {tenant?.name ?? 'Pintemas'}
            </h2>
          </div>
          <a
            href={whatsappUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1.5 rounded-lg bg-[#25D366] px-3 py-1.5 text-sm font-medium text-white hover:bg-[#20BD5A]"
          >
            <MessageCircle className="h-4 w-4" />
            Ir a WhatsApp
          </a>
        </div>

        {/* Mensajes */}
        <div className="flex-1 overflow-y-auto space-y-4 min-h-0">
          {displayMessages.map((msg, i) => (
            <div
              key={i}
              className={cn(
                'flex',
                msg.role === 'user' ? 'justify-end' : 'justify-start'
              )}
            >
              <div
                className={cn(
                  'max-w-[85%] rounded-2xl px-4 py-2.5 text-sm',
                  msg.role === 'user'
                    ? 'bg-primary text-primary-foreground'
                    : 'bg-muted text-foreground'
                )}
              >
                <p className="whitespace-pre-wrap">{msg.content}</p>
                {msg.role === 'assistant' && msg.products && msg.products.length > 0 && (
                  <div className="mt-3 grid grid-cols-2 gap-2">
                    {msg.products.map((p) => (
                      <ProductCardChat key={p.id} product={p} />
                    ))}
                  </div>
                )}
              </div>
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

        {/* Chips de aplicación (solo al inicio) */}
        {messages.length === 0 && (
          <div className="flex flex-wrap gap-2 mb-3">
            {APPLICATIONS.map((app) => (
              <button
                key={app}
                type="button"
                onClick={() => handleApplicationClick(app)}
                className="rounded-full border border-input bg-background px-3 py-1.5 text-xs font-medium hover:bg-accent hover:text-accent-foreground transition-colors"
              >
                {app}
              </button>
            ))}
          </div>
        )}

        {/* Input */}
        <form onSubmit={handleSubmit} className="flex gap-2 pt-2 border-t">
          <input
            type="text"
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            placeholder="Escribí tu mensaje..."
            className="flex-1 rounded-lg border border-input bg-background px-4 py-2.5 text-sm outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2"
            disabled={isLoading}
          />
          <button
            type="submit"
            disabled={!inputValue.trim() || isLoading}
            className="rounded-lg bg-primary px-4 py-2.5 text-sm font-medium text-primary-foreground hover:bg-primary/90 disabled:opacity-50 disabled:pointer-events-none"
          >
            Enviar
          </button>
        </form>
      </SheetContent>
    </Sheet>
  )
}

function ProductCardChat({
  product,
}: {
  product: {
    id: number
    name: string
    slug: string
    price?: number
    discounted_price?: number
    images?: string[]
    [key: string]: unknown
  }
}) {
  const { addProduct } = useCartUnified()
  const { openCartModal } = useCartModalContext()
  const price = product.discounted_price ?? product.price ?? 0

  const handleAddToCart = () => {
    addProduct({
      id: product.id,
      title: product.name,
      name: product.name,
      slug: product.slug,
      price,
      discountedPrice: price,
      images: product.images,
      quantity: 1,
    })
    openCartModal()
  }

  const img =
    Array.isArray(product.images) && product.images[0]
      ? String(product.images[0])
      : (product as Record<string, unknown>).image_url
        ? String((product as Record<string, unknown>).image_url)
        : null

  return (
    <div className="rounded-lg border bg-card overflow-hidden">
      {img && (
        <div className="relative aspect-square bg-muted">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={img}
            alt={product.name}
            className="object-cover w-full h-full"
          />
        </div>
      )}
      <div className="p-2">
        <p className="text-xs font-medium line-clamp-2">{product.name}</p>
        <p className="text-xs text-muted-foreground mt-0.5">
          ${typeof price === 'number' ? price.toLocaleString('es-AR') : ''}
        </p>
        <button
          type="button"
          onClick={handleAddToCart}
          className="mt-1 w-full rounded bg-primary py-1 text-xs font-medium text-primary-foreground hover:bg-primary/90"
        >
          Agregar al carrito
        </button>
      </div>
    </div>
  )
}
