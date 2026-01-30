'use client'

import React, { useMemo } from 'react'
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet'
import { useAIChatPopupContext } from '@/app/context/AIChatPopupContext'
import { useTenantSafe, useTenantTheme } from '@/contexts/TenantContext'
import { getTenantWhatsAppNumber } from '@/lib/tenant/tenant-whatsapp'
import { MessageCircle, ShoppingCart } from '@/lib/optimized-imports'
import { useCartModalContext } from '@/app/context/CartSidebarModalContext'
import { useAppSelector } from '@/redux/store'
import { useAIChatSend } from '@/hooks/useAIChatSend'
import { AIChatConversationUI } from '@/components/Common/AIChatConversation/AIChatConversationUI'
import { getAIChatVisitorId } from '@/lib/ai-chat/visitor-id'

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

export default function AIChatPopup() {
  const { isChatOpen, closeChat } = useAIChatPopupContext()
  const tenant = useTenantSafe()
  const theme = useTenantTheme()
  const { openCartModal } = useCartModalContext()
  const cartItems = useAppSelector((state) => state.cartReducer.items)
  const cartCount = cartItems?.length ?? 0

  const initialBotMessage = useMemo(() => {
    const greeting = getGreeting()
    const agentName = getAgentName(tenant?.slug, tenant?.name ?? null)
    return `${greeting}, soy ${agentName}. ¿Qué vas a pintar hoy? Elegí una opción o escribime.`
  }, [tenant?.slug, tenant?.name])

  const {
    displayMessages,
    inputValue,
    setInputValue,
    isLoading,
    handleSend,
    handleApplicationClick,
    applications,
  } = useAIChatSend({
    initialBotMessage,
    adminDebug: false,
    getPayloadExtras: () => ({ visitorId: getAIChatVisitorId() }),
  })

  const whatsappNumber = getTenantWhatsAppNumber(tenant)
  const whatsappUrl = `https://wa.me/${whatsappNumber}`

  const handleOpenChange = (open: boolean) => {
    if (!open) closeChat()
  }

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

        <AIChatConversationUI
          displayMessages={displayMessages}
          inputValue={inputValue}
          setInputValue={setInputValue}
          isLoading={isLoading}
          handleSend={handleSend}
          handleApplicationClick={handleApplicationClick}
          applications={applications}
          theme={theme}
          className="flex-1 min-h-0"
        />
      </SheetContent>
    </Sheet>
  )
}
