'use client'

import React, { useState, useMemo, useCallback } from 'react'
import dynamic from 'next/dynamic'
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet'
import { useAIChatPopupContext } from '@/app/context/AIChatPopupContext'
import { useTenantSafe, useTenantTheme } from '@/contexts/TenantContext'
import { getTenantWhatsAppNumber } from '@/lib/tenant/tenant-whatsapp'
import { cn } from '@/lib/utils'
import { MessageCircle, ShoppingCart } from '@/lib/optimized-imports'
import { adaptApiProductsToComponents } from '@/lib/adapters/product-adapter'
import { useCartModalContext } from '@/app/context/CartSidebarModalContext'
import { useAppSelector } from '@/redux/store'

const ProductItem = dynamic(
  () => import('@/components/Common/ProductItem').then((m) => ({ default: m.default })),
  { ssr: false, loading: () => <div className="w-[180px] h-[280px] rounded-lg bg-muted animate-pulse" /> }
)

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
  if (tenantSlug === 'pintemas') return 'Luis'
  return tenantName ? `asistente de ${tenantName}` : 'tu asistente'
}

export interface ChatMessage {
  role: 'user' | 'assistant'
  content: string
  /** Productos completos de la API (con variants, etc.) para ProductItem */
  products?: Record<string, unknown>[]
}

export default function AIChatPopup() {
  const { isChatOpen, closeChat } = useAIChatPopupContext()
  const tenant = useTenantSafe()
  const theme = useTenantTheme()
  const { openCartModal } = useCartModalContext()
  const cartItems = useAppSelector((state) => state.cartReducer.items)
  const cartCount = cartItems?.length ?? 0
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

        // Fallback: si la IA no devolvió categoría/búsqueda, derivar del mensaje actual y de toda la conversación
        let suggestedCategory = data?.suggestedCategory ?? null
        let suggestedSearch = data?.suggestedSearch ?? null
        const currentLower = trimmed.toLowerCase()
        // Incluir mensajes del usuario Y del asistente para detectar intención (ej. "mostrame" después de "madera")
        const lastUserMessages = [...messages]
          .filter((m) => m.role === 'user')
          .slice(-3)
          .map((m) => m.content)
        const lastAssistantMessages = [...messages]
          .filter((m) => m.role === 'assistant')
          .slice(-2)
          .map((m) => m.content)
        const contextText = [trimmed, ...lastUserMessages, ...lastAssistantMessages]
          .filter(Boolean)
          .join(' ')
          .toLowerCase()

        // Si el usuario pide explícitamente aerosol/spray, priorizar esa búsqueda (la tienda SÍ tiene aerosoles)
        if (/\b(aerosol|aerosoles|spray)\b/.test(contextText) || (/\b(maceta|maseta|masetero)\b/.test(contextText) && /\b(aerosol|spray|pintar)\b/.test(contextText))) {
          suggestedSearch = 'aerosol'
        }

        // Normalizar términos de la IA: madera/techos a búsqueda concreta
        if (suggestedSearch && !/aerosol|spray/i.test(suggestedSearch)) {
          const s = suggestedSearch.toLowerCase()
          if (/interior|interiores/.test(s) && !/látex\s+interior/.test(s)) suggestedSearch = 'látex interior'
          else if (/exterior|exteriores|frente|fachada/.test(s) && !/látex\s+exterior/.test(s)) suggestedSearch = 'látex exterior'
          else if (/madera|muebles?/.test(s) && !/pintura\s+madera/.test(s)) suggestedSearch = 'pintura madera'
          else if (/techo/.test(s) && !/pintura\s+techo/.test(s)) suggestedSearch = 'pintura techo'
        }

        if (!suggestedCategory && !suggestedSearch) {
          // Mensajes cortos de confirmación: usar intención de la conversación (ej. "mostrame" -> último tema)
          const isShowMe = /^(mostrame|mostrá|mostrar|dale|sí|si|ok|okay|ver|muestra?)$/.test(currentLower.trim())
          const conversationForIntent = isShowMe ? contextText : currentLower

          // (Aerosol ya se fijó arriba si el usuario lo pidió; aquí el resto de fallbacks)
          if (/\b(sinteplast|sherwin|sherwin.?williams|plavicon|petrilac|alba)\b/.test(currentLower)) {
            const brand = currentLower.match(/\b(sinteplast|sherwin|sherwin.?williams|plavicon|petrilac|alba)\b/)?.[1] ?? ''
            if (/\b(exterior|exteriores|frente|fachada)\b/.test(contextText)) suggestedSearch = `${brand} látex exterior`
            else if (/\b(interior|interiores)\b/.test(contextText)) suggestedSearch = `${brand} látex interior`
            else suggestedSearch = brand
          } else if (/\b(mas\s+vendidos|más\s+vendidos|mejores|best\s*seller)\b/.test(currentLower)) {
            // "más vendidos" → usar contexto (exterior/interior/madera) para mostrar productos
            if (/\b(exterior|exteriores|frente|fachada)\b/.test(contextText)) suggestedSearch = 'látex exterior'
            else if (/\b(interior|interiores)\b/.test(contextText)) suggestedSearch = 'látex interior'
            else if (/\b(madera|muebles?)\b/.test(contextText)) suggestedSearch = 'pintura madera'
            else suggestedSearch = 'látex'
          } else if (/\b(complementos?|accesorios|rodillos?|pinceles?|brochas?|cintas?|bandejas?|herramientas?)\b/.test(conversationForIntent)) {
            if (/\b(rodillos?|rodillo)\b/.test(conversationForIntent)) suggestedSearch = 'rodillo'
            else if (/\b(pinceles?|pincel)\b/.test(conversationForIntent)) suggestedSearch = 'pincel'
            else if (/\b(brochas?|brocha)\b/.test(conversationForIntent)) suggestedSearch = 'brocha'
            else if (/\b(cintas?|cinta)\b/.test(conversationForIntent)) suggestedSearch = 'cinta'
            else if (/\b(bandejas?|bandeja)\b/.test(conversationForIntent)) suggestedSearch = 'bandeja'
            else suggestedSearch = 'rodillo pincel'
          } else if (/\b(madera|muebles?)\b/.test(contextText)) {
            suggestedSearch = 'pintura madera'
          } else if (/\b(interior(es?)?|habitacion(es?)?|cuarto)\b/.test(contextText)) {
            suggestedSearch = 'látex interior'
          } else if (/\b(exterior(es?)?|frente|fachada|revestimiento)\b/.test(contextText)) {
            suggestedSearch = 'látex exterior'
          } else if (/\bmetal\b/.test(contextText)) {
            suggestedSearch = 'esmalte metal'
          } else if (/\b(techos?|techo)\b/.test(contextText)) {
            suggestedSearch = 'pintura techo'
          } else if (/\bautomotor\b/.test(contextText)) {
            suggestedSearch = 'pintura automotor'
          } else if (/\b(paredes?|muros?)\b/.test(contextText)) {
            suggestedSearch = 'látex'
          } else if (/\b(pintar|pintura)\b/.test(contextText)) {
            suggestedSearch = 'látex'
          }
        }

        if ((suggestedCategory || suggestedSearch) && !products?.length) {
          const params = new URLSearchParams()
          if (suggestedCategory) params.set('category', suggestedCategory)
          if (suggestedSearch) params.set('search', suggestedSearch)
          params.set('limit', '16')
          try {
            const productsRes = await fetch(`/api/products?${params.toString()}`)
            const productsData = await productsRes.json()
            const raw = (productsData?.data ?? productsData?.products ?? [])
            const rawSlice = Array.isArray(raw) ? raw.slice(0, 16) : []
            const adapted = adaptApiProductsToComponents(rawSlice as any[])
            const excludeKeywords = /reparador|enduido|masilla|sellador/i
            let filtered = adapted.filter(
              (p) =>
                !excludeKeywords.test(String(p.name ?? p.title ?? '')) &&
                !excludeKeywords.test(String((p as any).slug ?? ''))
            )
            const userWantsAerosol =
              (suggestedSearch && /aerosol|spray/i.test(suggestedSearch)) ||
              /\b(aerosol|spray)\b/.test(contextText) ||
              (/\b(maceta|maseta)\b/.test(contextText) && /\b(aerosol|spray|pintar)\b/.test(contextText))
            const isInteriorOrExterior =
              (suggestedSearch && /látex\s+(interior|exterior)/i.test(suggestedSearch)) ||
              (contextText && /\b(interior|exterior|frente|fachada)\b/.test(contextText))
            if (userWantsAerosol && filtered.length > 0) {
              const aerosolLike = /aerosol|spray|krylon|tableros y vinilicos|plastico y acrilicos/i
              const withAerosol = filtered.filter((p) => aerosolLike.test(String(p.name ?? p.title ?? '')))
              filtered = withAerosol.length > 0 ? withAerosol.slice(0, 12) : filtered.slice(0, 12)
            } else if (isInteriorOrExterior && filtered.length > 0) {
              const aerosolLike = /aerosol|spray|krylon|tableros y vinilicos|plastico y acrilicos/i
              const withAerosol = filtered.filter((p) => aerosolLike.test(String(p.name ?? p.title ?? '')))
              const withoutAerosol = filtered.filter((p) => !aerosolLike.test(String(p.name ?? p.title ?? '')))
              filtered = withoutAerosol.length >= 8 ? withoutAerosol.slice(0, 12) : [...withoutAerosol, ...withAerosol].slice(0, 12)
            } else {
              filtered = filtered.slice(0, 12)
            }
            products = filtered
          } catch (e) {
            if (process.env.NODE_ENV === 'development') {
              console.warn('[AIChat] Error fetching products:', e)
            }
          }
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

        {/* Header visible: título, carrito (con count), WhatsApp */}
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
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={openCartModal}
              className="relative inline-flex items-center justify-center rounded-lg p-2 text-foreground hover:bg-muted transition-colors"
              style={theme?.primaryColor ? { color: theme.primaryColor } : undefined}
              aria-label={cartCount > 0 ? `Carrito con ${cartCount} productos` : 'Ver carrito'}
            >
              <ShoppingCart className="h-5 w-5" />
              {cartCount > 0 && (
                <span
                  className="absolute -top-0.5 -right-0.5 flex h-4 min-w-[1rem] items-center justify-center rounded-full px-1 text-[10px] font-medium text-white"
                  style={{ backgroundColor: theme?.primaryColor ?? 'hsl(var(--primary))' }}
                >
                  {cartCount > 99 ? '99+' : cartCount}
                </span>
              )}
            </button>
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
        </div>

        {/* Mensajes */}
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
                      key={String(p.id)}
                      className="flex-shrink-0 w-[calc(50vw-1.5rem)] min-w-[168px] sm:w-[calc(50%-0.5rem)] md:w-[calc(50%-0.75rem)] max-w-[240px]"
                    >
                      <ProductItem product={p as any} />
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

        {/* Chips de aplicación (solo al inicio) */}
        {messages.length === 0 && (
          <div className="flex flex-wrap gap-2 mb-3">
            {APPLICATIONS.map((app) => (
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

        {/* Input: texto visible + botón con color del tenant */}
        <form onSubmit={handleSubmit} className="flex gap-2 pt-2 border-t">
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
      </SheetContent>
    </Sheet>
  )
}
