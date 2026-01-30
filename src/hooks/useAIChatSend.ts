'use client'

import { useState, useMemo, useCallback, useEffect } from 'react'
import { adaptApiProductsToComponents } from '@/lib/adapters/product-adapter'
import {
  EXCLUDE_PRODUCT_KEYWORDS,
  isAerosolContext,
  normalizeSuggestedSearch,
  getFallbackSuggestedSearch,
  AEROSOL_PRODUCT_REGEX,
  PRODUCTS_LIMIT,
  PRODUCTS_CAROUSEL_MAX,
  APPLICATIONS,
} from '@/lib/ai-chat/search-intent-config'

export interface AIChatMessage {
  role: 'user' | 'assistant'
  content: string
  products?: Record<string, unknown>[]
}

export interface LastResponseDebug {
  suggestedSearch?: string | null
  suggestedCategory?: string | null
  durationMs?: number
  modelUsed?: string | null
  contextProvided?: {
    knowledgeBase: boolean
    catalogIncluded: boolean
    catalogProductCount?: number
  }
}

export interface UseAIChatSendOptions {
  initialBotMessage: string
  adminDebug?: boolean
  getPayloadExtras?: () => { chatSessionId?: string; visitorId?: string }
}

export function useAIChatSend(options: UseAIChatSendOptions) {
  const { initialBotMessage, adminDebug = false, getPayloadExtras } = options
  const [messages, setMessages] = useState<AIChatMessage[]>([])
  const [inputValue, setInputValue] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [lastResponseDebug, setLastResponseDebug] = useState<LastResponseDebug | null>(null)
  const [chatSessionId, setChatSessionId] = useState<string | null>(() => {
    if (typeof window === 'undefined') return null
    return localStorage.getItem('ai_chat_session_id')
  })

  useEffect(() => {
    if (typeof window === 'undefined' || !chatSessionId) return
    localStorage.setItem('ai_chat_session_id', chatSessionId)
  }, [chatSessionId])

  const handleSend = useCallback(
    async (text: string) => {
      const trimmed = text.trim()
      if (!trimmed || isLoading) return

      setMessages((prev) => [...prev, { role: 'user', content: trimmed }])
      setInputValue('')
      setIsLoading(true)
      setLastResponseDebug(null)

      const nextMessages = [...messages, { role: 'user', content: trimmed }]
      const body: Record<string, unknown> = {
        messages: nextMessages.map((m) => ({ role: m.role, content: m.content })),
      }
      if (chatSessionId) body.chatSessionId = chatSessionId
      if (getPayloadExtras) {
        const extras = getPayloadExtras()
        if (extras.visitorId) body.visitorId = extras.visitorId
        if (extras.chatSessionId && !body.chatSessionId) body.chatSessionId = extras.chatSessionId
      }

      const headers: Record<string, string> = { 'Content-Type': 'application/json' }
      if (adminDebug) headers['X-Admin-Debug'] = 'true'

      try {
        const res = await fetch('/api/ai-chat/respond', {
          method: 'POST',
          headers,
          body: JSON.stringify(body),
        })
        const data = await res.json()

        if (data.chatSessionId) setChatSessionId(data.chatSessionId)

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

        let suggestedCategory = data?.suggestedCategory ?? null
        let suggestedSearch = data?.suggestedSearch ?? null
        const currentLower = trimmed.toLowerCase()
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

        if (isAerosolContext(contextText)) suggestedSearch = 'aerosol'
        suggestedSearch = normalizeSuggestedSearch(suggestedSearch)

        if (!suggestedCategory && !suggestedSearch) {
          const fallback = getFallbackSuggestedSearch(contextText, currentLower)
          if (fallback) suggestedSearch = fallback
        }

        if ((suggestedCategory || suggestedSearch) && !products?.length) {
          const params = new URLSearchParams()
          if (suggestedCategory) params.set('category', suggestedCategory)
          if (suggestedSearch) params.set('search', suggestedSearch)
          params.set('limit', String(PRODUCTS_LIMIT))
          try {
            const productsRes = await fetch(`/api/products?${params.toString()}`)
            const productsData = await productsRes.json()
            const raw = (productsData?.data ?? productsData?.products ?? [])
            const rawSlice = Array.isArray(raw) ? raw.slice(0, PRODUCTS_LIMIT) : []
            const adapted = adaptApiProductsToComponents(rawSlice as Record<string, unknown>[])
            let filtered = adapted.filter(
              (p) =>
                !EXCLUDE_PRODUCT_KEYWORDS.test(String(p.name ?? p.title ?? '')) &&
                !EXCLUDE_PRODUCT_KEYWORDS.test(String((p as Record<string, unknown>).slug ?? ''))
            )
            const userWantsAerosol =
              (suggestedSearch && /aerosol|spray/i.test(suggestedSearch)) ||
              isAerosolContext(contextText)
            const isInteriorOrExterior =
              (suggestedSearch && /látex\s+(interior|exterior)/i.test(suggestedSearch)) ||
              (contextText && /\b(interior|exterior|frente|fachada)\b/.test(contextText))
            if (userWantsAerosol && filtered.length > 0) {
              const withAerosol = filtered.filter((p) =>
                AEROSOL_PRODUCT_REGEX.test(String(p.name ?? p.title ?? ''))
              )
              filtered =
                withAerosol.length > 0
                  ? withAerosol.slice(0, PRODUCTS_CAROUSEL_MAX)
                  : filtered.slice(0, PRODUCTS_CAROUSEL_MAX)
            } else if (isInteriorOrExterior && filtered.length > 0) {
              const withAerosol = filtered.filter((p) =>
                AEROSOL_PRODUCT_REGEX.test(String(p.name ?? p.title ?? ''))
              )
              const withoutAerosol = filtered.filter(
                (p) => !AEROSOL_PRODUCT_REGEX.test(String(p.name ?? p.title ?? ''))
              )
              filtered =
                withoutAerosol.length >= 8
                  ? withoutAerosol.slice(0, PRODUCTS_CAROUSEL_MAX)
                  : [...withoutAerosol, ...withAerosol].slice(0, PRODUCTS_CAROUSEL_MAX)
            } else {
              filtered = filtered.slice(0, PRODUCTS_CAROUSEL_MAX)
            }
            products = filtered
            // Si categoría + búsqueda no devolvieron nada, intentar solo búsqueda (ej. esmalte metal)
            if ((!products || products.length === 0) && suggestedSearch) {
              try {
                const paramsFallback = new URLSearchParams()
                paramsFallback.set('search', suggestedSearch)
                paramsFallback.set('limit', String(PRODUCTS_LIMIT))
                const resFallback = await fetch(`/api/products?${paramsFallback.toString()}`)
                const dataFallback = await resFallback.json()
                const rawFallback = (dataFallback?.data ?? dataFallback?.products ?? []) as unknown[]
                const sliceFallback = Array.isArray(rawFallback) ? rawFallback.slice(0, PRODUCTS_LIMIT) : []
                const adaptedFallback = adaptApiProductsToComponents(sliceFallback as Record<string, unknown>[])
                const filteredFallback = adaptedFallback
                  .filter(
                    (p) =>
                      !EXCLUDE_PRODUCT_KEYWORDS.test(String(p.name ?? p.title ?? '')) &&
                      !EXCLUDE_PRODUCT_KEYWORDS.test(String((p as Record<string, unknown>).slug ?? ''))
                  )
                  .slice(0, PRODUCTS_CAROUSEL_MAX)
                if (filteredFallback.length > 0) products = filteredFallback
              } catch (e) {
                if (process.env.NODE_ENV === 'development') {
                  console.warn('[AIChat] Fallback products fetch:', e)
                }
              }
            }
          } catch (e) {
            if (process.env.NODE_ENV === 'development') {
              console.warn('[AIChat] Error fetching products:', e)
            }
          }
        }

        if (adminDebug && data._debug) {
          setLastResponseDebug({
            suggestedSearch: data.suggestedSearch ?? null,
            suggestedCategory: data.suggestedCategory ?? null,
            durationMs: data._debug.durationMs,
            modelUsed: data._debug.modelUsed ?? null,
            contextProvided: data._debug.contextProvided,
          })
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
            content: 'Hubo un error. Escribinos por WhatsApp y te ayudamos.',
          },
        ])
      } finally {
        setIsLoading(false)
      }
    },
    [messages, isLoading, adminDebug, getPayloadExtras, chatSessionId]
  )

  const handleApplicationClick = useCallback(
    (app: string) => {
      handleSend(`Quiero pintar ${app.toLowerCase()}.`)
    },
    [handleSend]
  )

  const resetChat = useCallback(() => {
    setMessages([])
    setChatSessionId(null)
    setLastResponseDebug(null)
    if (typeof window !== 'undefined') {
      localStorage.removeItem('ai_chat_session_id')
    }
  }, [])

  const displayMessages = useMemo(() => {
    if (messages.length === 0) {
      return [
        {
          role: 'assistant' as const,
          content: initialBotMessage,
          products: undefined as AIChatMessage['products'],
        },
      ]
    }
    return messages
  }, [messages, initialBotMessage])

  return {
    messages,
    inputValue,
    setInputValue,
    isLoading,
    handleSend,
    handleApplicationClick,
    displayMessages,
    initialBotMessage,
    lastResponseDebug,
    chatSessionId,
    resetChat,
    applications: APPLICATIONS,
  }
}
