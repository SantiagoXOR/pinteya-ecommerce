'use client'

import * as React from 'react'
import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { Home, ArrowLeft, ShoppingCart, Search, BrandWhatsapp } from '@/lib/optimized-imports'
import { cn } from '@/lib/utils'
import { useAppSelector } from '@/redux/store'
import { useCartModalContext } from '@/app/context/CartSidebarModalContext'
import { useTenantSafe } from '@/contexts/TenantContext'
import { getTenantWhatsAppNumber } from '@/lib/tenant/tenant-whatsapp'

interface MercadoLibreBottomNavProps {
  className?: string
}

const MercadoLibreBottomNav = React.forwardRef<HTMLDivElement, MercadoLibreBottomNavProps>(
  ({ className, ...props }, ref) => {
    const pathname = usePathname()
    const router = useRouter()
    const cartItems = useAppSelector(state => state.cartReducer.items)
    const { openCartModal } = useCartModalContext()
    const cartItemCount = cartItems.length
    const [isCartPressed, setIsCartPressed] = React.useState(false)
    const [isAnimating, setIsAnimating] = React.useState(false)
    const prevCartCountRef = React.useRef(cartItemCount)
    // Índice del mensaje actual en la burbuja de WhatsApp (rotación secuencial)
    const [whatsAppBubbleIndex, setWhatsAppBubbleIndex] = React.useState(0)
    // Mostrar la burbuja después de 3 segundos
    const [whatsAppBubbleVisible, setWhatsAppBubbleVisible] = React.useState(false)
    // Cerrar al deslizar izquierda o derecha
    const [whatsAppBubbleDismissed, setWhatsAppBubbleDismissed] = React.useState(false)
    const swipeStartX = React.useRef<number>(0)

    const handleBubbleTouchStart = (e: React.TouchEvent) => {
      swipeStartX.current = e.touches[0].clientX
    }
    const handleBubbleTouchEnd = (e: React.TouchEvent) => {
      const endX = e.changedTouches[0].clientX
      const delta = Math.abs(endX - swipeStartX.current)
      if (delta > 50) setWhatsAppBubbleDismissed(true)
    }

    React.useEffect(() => {
      const timer = setTimeout(() => setWhatsAppBubbleVisible(true), 3000)
      return () => clearTimeout(timer)
    }, [])

    const whatsAppBubbleMessages = [
      'Hola! Soy Santi, te ayudo con tu pedido?',
      '¿No sabés cuántos litros necesitás? Te ayudo a calcular.',
      '¿Dudas con el color? Te asesoramos.',
    ]

    // Rotar el texto de la burbuja cada 10 segundos (3 mensajes en secuencia)
    React.useEffect(() => {
      const interval = setInterval(() => {
        setWhatsAppBubbleIndex(prev => (prev + 1) % 3)
      }, 10000)
      return () => clearInterval(interval)
    }, [])

    // Obtener número de WhatsApp del tenant
    const tenant = useTenantSafe()
    const whatsappNumber = getTenantWhatsAppNumber(tenant)
    
    // ⚡ MULTITENANT: Colores del tenant para el botón de carrito
    const accentColor = tenant?.accentColor || '#ffd549' // Amarillo por defecto
    const primaryColor = tenant?.primaryColor || '#f27a1d' // Naranja por defecto

    // Detectar cuando se agrega un producto al carrito para activar la microinteracción
    React.useEffect(() => {
      if (cartItemCount > prevCartCountRef.current) {
        // Se agregó un producto, activar animación
        setIsAnimating(true)
        setTimeout(() => setIsAnimating(false), 600)
      }
      prevCartCountRef.current = cartItemCount
    }, [cartItemCount])

    // Determinar si una ruta está activa
    const isActive = (href: string) => {
      if (href === '/') {
        return pathname === '/'
      }
      if (href === '/menu') {
        return pathname === '/menu'
      }
      if (href === '/search') {
        return pathname === '/search'
      }
      return pathname.startsWith(href)
    }

    // Función para volver atrás
    const handleGoBack = (e: React.MouseEvent) => {
      e.preventDefault()
      if (window.history.length > 1) {
        router.back()
      } else {
        // Si no hay historial, ir al inicio
        router.push('/')
      }
    }

    // Función para hacer focus en el searchbar del header
    const handleSearchClick = (e: React.MouseEvent) => {
      e.preventDefault()
      // Buscar el input del searchbar en el header y hacerle focus
      const searchInput = document.querySelector('input[type="text"][role="searchbox"]') as HTMLInputElement
      if (searchInput) {
        // Scroll al top para que el header sea visible
        window.scrollTo({ top: 0, behavior: 'smooth' })
        // Pequeño delay para asegurar que el scroll termine
        setTimeout(() => {
          searchInput.focus()
          searchInput.click()
        }, 300)
      } else {
        // Si no encuentra el input, intentar expandir el searchbar del header
        // Disparar evento personalizado que el Header puede escuchar
        window.dispatchEvent(new CustomEvent('focus-searchbar'))
      }
    }

    // Función para abrir WhatsApp con mensaje inicial (tooltip o botón)
    const defaultWhatsAppMessage = tenant?.whatsappMessageTemplate || 'Hola! Necesito ayuda con mi pedido'
    const handleWhatsAppClick = (e: React.MouseEvent) => {
      e.preventDefault()
      const whatsappUrl = `https://wa.me/${whatsappNumber}?text=${encodeURIComponent(defaultWhatsAppMessage)}`
      window.open(whatsappUrl, '_blank', 'noopener,noreferrer')
    }

    // Función para manejar el click del carrito con estado pressed
    const handleCartClick = (e: React.MouseEvent) => {
      e.preventDefault()
      setIsCartPressed(true)
      openCartModal()
      // Resetear el estado después de un tiempo
      setTimeout(() => setIsCartPressed(false), 200)
    }

    // Items del bottom navigation estilo MercadoLibre con colores Pinteya
    // Orden: Volver | Buscar | Carrito | Inicio | WhatsApp
    const navItems = [
      {
        id: 'back',
        label: 'Volver',
        href: '#',
        icon: ArrowLeft,
        active: false,
        onClick: handleGoBack,
      },
      {
        id: 'search',
        label: 'Buscar',
        href: '#',
        icon: Search,
        active: false,
        onClick: handleSearchClick,
      },
      {
        id: 'cart',
        label: 'Carrito',
        href: '#',
        icon: ShoppingCart,
        active: false,
        badge: cartItemCount,
        onClick: handleCartClick,
      },
      {
        id: 'home',
        label: 'Inicio',
        href: '/',
        icon: Home,
        active: isActive('/'),
      },
      {
        id: 'whatsapp',
        label: 'WhatsApp',
        href: '#',
        icon: BrandWhatsapp,
        active: false,
        onClick: handleWhatsAppClick,
      },
    ]

    // Burbuja de chat (tooltip) clicable para WhatsApp - texto de Santi. Deslizar izquierda/derecha para cerrar.
    // En móvil: alineada a la derecha para no cortarse (right-0). En desktop: centrada.
    const whatsAppBubble = whatsAppBubbleVisible && !whatsAppBubbleDismissed ? (
      <button
        type="button"
        onClick={handleWhatsAppClick}
        onTouchStart={handleBubbleTouchStart}
        onTouchEnd={handleBubbleTouchEnd}
        aria-label="Abrir chat de WhatsApp con Santi. Deslizá para cerrar."
        className={cn(
          'absolute bottom-full z-10 mb-[25px] flex flex-col items-stretch',
          'min-w-[200px] max-w-[280px] sm:min-w-[240px] sm:max-w-[320px]',
          'left-auto right-[5px] sm:right-auto sm:left-1/2 sm:-translate-x-1/2',
          'animate-in fade-in slide-in-from-bottom-3 duration-300'
        )}
      >
        <div className="relative w-full bg-[#25D366] text-white rounded-2xl px-4 py-3 shadow-lg text-left text-sm leading-snug border border-[#1da851] min-h-[2.5rem] flex items-center">
          <p className="line-clamp-2 transition-opacity duration-300" key={whatsAppBubbleIndex}>
            {whatsAppBubbleMessages[whatsAppBubbleIndex]}
          </p>
          {/* Flecha apuntando al círculo de WhatsApp: a la derecha en móvil, centrada en desktop */}
          <div
            className={cn(
              'absolute -bottom-2 w-0 h-0 border-l-[10px] border-r-[10px] border-t-[10px] border-l-transparent border-r-transparent border-t-[#25D366]',
              'right-5 left-auto -translate-x-0 sm:right-auto sm:left-1/2 sm:-translate-x-1/2'
            )}
            aria-hidden
          />
        </div>
      </button>
    ) : null

    // ⚡ FASE 11-16: Código de debugging deshabilitado en producción
// Los requests a 127.0.0.1:7242 estaban causando timeouts y bloqueando la carga
    return (
      <>
        {/* Mobile: full width */}
        <nav
          ref={ref}
          className={cn(
            'fixed left-0 right-0 z-bottom-nav border-t shadow-lg lg:hidden overflow-visible',
            'safe-area-bottom',
            className
          )}
          style={{
            bottom: 'env(safe-area-inset-bottom, 0px)',
            borderRadius: '24px 24px 0px 0px',
            backgroundColor: 'white',
            borderTopColor: 'var(--glass-bg-strong)',
            boxShadow: 'inset 0px 4px 6px 0px rgba(0, 0, 0, 0.15)',
            backdropFilter: 'none',
            letterSpacing: '0px',
            lineHeight: '14px',
            opacity: '1',
          }}
          {...props}
        >
          <div className='flex items-end justify-around max-w-[340px] mx-auto w-full h-14 sm:h-16 sm:max-w-md overflow-visible'>
          {navItems.map((item) => {
            const Icon = item.icon
            const isItemActive = item.active
            const hasBadge = item.id === 'cart' && item.badge !== undefined && item.badge > 0
            const showBadge = item.id === 'cart' && item.badge !== undefined
            const iconSlotHeight = 'h-6 sm:h-7'

            return (
              <div key={item.id} className='flex-1 flex flex-col items-center justify-end relative overflow-visible'>
                {/* Link o botón según el tipo */}
                {item.id === 'cart' || item.id === 'back' || item.id === 'whatsapp' || item.id === 'search' ? (
                  item.id === 'whatsapp' ? (
                    <div className='relative overflow-visible w-full flex flex-col items-center justify-end'>
                      {whatsAppBubble}
                      <button
                        onClick={item.onClick}
                        className={cn(
                          'flex flex-col items-center justify-end w-full min-h-0 py-0 pb-1.5 pt-0 transition-all duration-200 overflow-visible',
                          'text-gray-600 hover:text-blaze-orange-600 active:scale-95'
                        )}
                        aria-label={item.label}
                      >
                        <div className={cn('relative flex items-center justify-center overflow-visible', iconSlotHeight, 'w-full')}>
                          <div className='absolute bottom-0 left-1/2 -translate-x-1/2 w-10 h-10 flex items-center justify-center'>
                            <div
                              className='absolute inset-0 rounded-full transition-all duration-300 shadow-md'
                              style={{ backgroundColor: '#25D366' }}
                            />
                            <div
                              className={cn(
                                'relative w-full h-full rounded-full flex items-center justify-center transition-all duration-300',
                                'hover:scale-110 active:scale-95 transform-gpu will-change-transform'
                              )}
                            >
                              <Icon
                                className='w-5 h-5 transition-colors duration-200 text-white'
                                style={{ color: 'white' }}
                              />
                            </div>
                          </div>
                        </div>
                        <span className={cn('text-[10px] sm:text-xs mt-0.5 font-medium shrink-0', 'text-green-600')}>
                          {item.label}
                        </span>
                      </button>
                    </div>
                  ) : (
                  <button
                    onClick={item.onClick}
                    className={cn(
                      'flex flex-col items-center justify-end w-full min-h-0 py-0 pb-1.5 pt-0 transition-all duration-200 overflow-visible',
                      isItemActive ? 'text-blaze-orange-600' : 'text-gray-600',
                      'hover:text-blaze-orange-600 active:scale-95'
                    )}
                    aria-label={item.label}
                  >
                    {/* Slot de icono fijo: círculos iguales (carrito y WhatsApp) sobresalen hacia arriba, títulos alineados abajo */}
                    {item.id === 'cart' ? (
                      <div className={cn('relative flex items-center justify-center overflow-visible', iconSlotHeight, 'w-full')}>
                        <div className='absolute bottom-0 left-1/2 -translate-x-1/2 w-10 h-10 flex items-center justify-center'>
                          <div 
                            className={cn(
                              'absolute inset-0 rounded-full transition-all duration-300 shadow-md',
                              isAnimating && 'animate-pulse scale-110'
                            )}
                            style={{ backgroundColor: accentColor }}
                          />
                          <div
                            className={cn(
                              'relative w-full h-full rounded-full flex items-center justify-center transition-all duration-300',
                              'hover:scale-110 active:scale-95 transform-gpu will-change-transform',
                              isAnimating && 'scale-110'
                            )}
                          >
                            <Icon
                              className='w-5 h-5 transition-colors duration-200'
                              style={{ color: primaryColor }}
                            />
                          </div>
                          {showBadge && (
                            <span
                              className={cn(
                                'absolute -top-1 -right-1 rounded-full min-w-[18px] h-[18px] sm:min-w-[20px] sm:h-[20px]',
                                'flex items-center justify-center shadow-lg ring-2 ring-white z-10',
                                'text-[10px] sm:text-xs font-bold px-1',
                                isAnimating && 'animate-bounce'
                              )}
                              style={{ backgroundColor: primaryColor, color: accentColor }}
                            >
                              {item.badge && item.badge > 99 ? '99+' : item.badge}
                            </span>
                          )}
                        </div>
                      </div>
                    ) : (
                      <div className={cn('flex items-center justify-center', iconSlotHeight, 'w-full')}>
                        <Icon className={cn('w-5 h-5 sm:w-6 sm:h-6', isItemActive && 'text-blaze-orange-600')} />
                      </div>
                    )}
                    <span
                      className={cn(
                        'text-[10px] sm:text-xs mt-0.5 font-medium shrink-0',
                        isItemActive && 'text-blaze-orange-600'
                      )}
                    >
                      {item.label}
                    </span>
                  </button>
                  )
                ) : (
                  <Link
                    href={item.href}
                    className={cn(
                      'flex flex-col items-center justify-end w-full min-h-0 py-0 pb-1.5 pt-0 transition-all duration-200',
                      isItemActive ? 'text-blaze-orange-600' : 'text-gray-600',
                      'hover:text-blaze-orange-600 active:scale-95'
                    )}
                    aria-label={item.label}
                  >
                    <div className={cn('flex items-center justify-center', iconSlotHeight, 'w-full')}>
                      <Icon className={cn('w-5 h-5 sm:w-6 sm:h-6', isItemActive && 'text-blaze-orange-600')} />
                      {showBadge && (
                        <span className='absolute -top-1 -right-1 bg-red-500 text-white text-[10px] font-bold rounded-full min-w-[16px] h-4 px-1 flex items-center justify-center'>
                          {item.badge}
                        </span>
                      )}
                    </div>
                    <span className={cn('text-[10px] sm:text-xs mt-0.5 font-medium shrink-0', isItemActive && 'text-blaze-orange-600')}>
                      {item.label}
                    </span>
                  </Link>
                )}
              </div>
            )
          })}
        </div>
        
        {/* Desktop: con márgenes - mismos títulos alineados y círculos sobresaliendo */}
        <div className='hidden lg:flex items-end justify-around max-w-[1170px] mx-auto w-full h-14 lg:px-8 xl:px-8 overflow-visible'>
          {navItems.map((item) => {
            const Icon = item.icon
            const isItemActive = item.active
            const hasBadge = item.id === 'cart' && item.badge !== undefined && item.badge > 0
            const showBadge = item.id === 'cart' && item.badge !== undefined
            const iconSlotHeight = 'h-6 sm:h-7'

            return (
              <div key={item.id} className='flex-1 flex flex-col items-center justify-end relative overflow-visible'>
                {item.id === 'cart' || item.id === 'back' || item.id === 'whatsapp' || item.id === 'search' ? (
                  item.id === 'whatsapp' ? (
                    <div className='relative overflow-visible w-full flex flex-col items-center justify-end'>
                      {whatsAppBubble}
                      <button
                        onClick={(e) => item.onClick?.(e)}
                        className={cn(
                          'flex flex-col items-center justify-end w-full min-h-0 py-0 pb-1.5 pt-0 transition-all duration-200 overflow-visible',
                          'focus:outline-none focus:ring-2 focus:ring-blaze-orange-500 focus:ring-offset-2 rounded-lg',
                          'active:scale-95'
                        )}
                        aria-label={item.label}
                      >
                        <div className={cn('relative flex items-center justify-center overflow-visible', iconSlotHeight, 'w-full')}>
                          <div className='absolute bottom-0 left-1/2 -translate-x-1/2 w-10 h-10 flex items-center justify-center'>
                            <div className='absolute inset-0 rounded-full transition-all duration-300 shadow-md' style={{ backgroundColor: '#25D366' }} />
                            <div className={cn('relative w-full h-full rounded-full flex items-center justify-center transition-all duration-300', 'hover:scale-110 active:scale-95 transform-gpu will-change-transform')}>
                              <Icon className='w-5 h-5 transition-colors duration-200 text-white' style={{ color: 'white' }} strokeWidth={1.5} />
                            </div>
                          </div>
                        </div>
                        <span className={cn('text-[10px] sm:text-xs font-medium mt-0.5 shrink-0', 'text-green-600')}>
                          {item.label}
                        </span>
                      </button>
                    </div>
                  ) : (
                  <button
                    onClick={(e) => item.onClick?.(e)}
                    onPointerDown={(e) => { if (item.id === 'cart') setIsCartPressed(true) }}
                    onMouseDown={() => item.id === 'cart' && setIsCartPressed(true)}
                    onMouseUp={() => item.id === 'cart' && setTimeout(() => setIsCartPressed(false), 200)}
                    onMouseLeave={() => item.id === 'cart' && setIsCartPressed(false)}
                    onTouchStart={() => item.id === 'cart' && setIsCartPressed(true)}
                    onTouchEnd={() => item.id === 'cart' && setTimeout(() => setIsCartPressed(false), 200)}
                    className={cn(
                      'flex flex-col items-center justify-end w-full min-h-0 py-0 pb-1.5 pt-0 transition-all duration-200 overflow-visible',
                      'focus:outline-none focus:ring-2 focus:ring-blaze-orange-500 focus:ring-offset-2 rounded-lg',
                      'active:scale-95'
                    )}
                    aria-label={item.label}
                  >
                    {item.id === 'cart' && (
                      <div className={cn('relative flex items-center justify-center overflow-visible', iconSlotHeight, 'w-full')}>
                        <div className='absolute bottom-0 left-1/2 -translate-x-1/2 w-10 h-10 flex items-center justify-center'>
                          <div
                            className={cn(
                              'absolute inset-0 rounded-full transition-all duration-300 shadow-md',
                              isAnimating && 'animate-pulse scale-110',
                              isCartPressed && 'scale-95'
                            )}
                            style={{ backgroundColor: 'var(--tenant-accent, #ffd549)' }}
                          />
                          <div
                            className={cn(
                              'relative w-full h-full rounded-full flex items-center justify-center transition-all duration-300',
                              'hover:scale-110 active:scale-95 transform-gpu will-change-transform',
                              isAnimating && 'scale-110'
                            )}
                          >
                            <Icon className='w-5 h-5 transition-colors duration-200' style={{ color: 'var(--tenant-primary, #EA5A17)' }} />
                          </div>
                          {showBadge && (
                            <span
                              className={cn('absolute -top-1 -right-1 rounded-full min-w-[18px] h-[18px] sm:min-w-[20px] sm:h-[20px] flex items-center justify-center shadow-lg ring-2 ring-white z-10 text-[10px] sm:text-xs font-bold px-1', isAnimating && 'animate-bounce')}
                              style={{ backgroundColor: 'var(--tenant-primary, #EA5A17)', color: 'var(--tenant-accent, #facc15)' }}
                            >
                              {item.badge && item.badge > 99 ? '99+' : item.badge}
                            </span>
                          )}
                        </div>
                      </div>
                    )}
                    {item.id === 'search' && (
                      <div className={cn('flex items-center justify-center', iconSlotHeight, 'w-full')}>
                        <Icon className='w-5 h-5 sm:w-6 sm:h-6 transition-colors duration-200 text-gray-600 hover:text-blaze-orange-600' strokeWidth={1.5} />
                      </div>
                    )}
                    {item.id === 'back' && (
                      <div className={cn('flex items-center justify-center', iconSlotHeight, 'w-full')}>
                        <Icon className='w-5 h-5 sm:w-6 sm:h-6 transition-colors duration-200 text-gray-600 hover:text-blaze-orange-600' strokeWidth={1.5} />
                      </div>
                    )}
                    <span
                      className={cn(
                        'text-[10px] sm:text-xs font-medium mt-0.5 shrink-0',
                        item.id === 'cart' && (hasBadge || isCartPressed) ? 'text-blaze-orange-600' : 'text-gray-600'
                      )}
                    >
                      {item.id === 'cart' && cartItemCount > 0 ? `${item.label} (${cartItemCount})` : item.label}
                    </span>
                  </button>
                  )
                ) : (
                  <Link
                    href={item.href}
                    className={cn(
                      'flex flex-col items-center justify-end w-full min-h-0 py-0 pb-1.5 pt-0 transition-all duration-200',
                      'focus:outline-none focus:ring-2 focus:ring-blaze-orange-500 focus:ring-offset-2 rounded-lg'
                    )}
                    aria-label={item.label}
                  >
                    {isItemActive && (
                      <div className='absolute top-0 left-1/2 transform -translate-x-1/2 w-12 h-0.5 bg-blaze-orange-600 rounded-full' />
                    )}
                    <div className={cn('flex items-center justify-center', iconSlotHeight, 'w-full')}>
                      <Icon
                        className={cn('w-5 h-5 sm:w-6 sm:h-6 transition-colors duration-200', isItemActive ? 'text-blaze-orange-600 fill-blaze-orange-600' : 'text-gray-600')}
                        strokeWidth={isItemActive ? 2 : 1.5}
                        fill={isItemActive && item.id === 'home' ? 'currentColor' : 'none'}
                      />
                    </div>
                    <span className={cn('text-[10px] sm:text-xs font-medium mt-0.5 shrink-0', isItemActive ? 'text-blaze-orange-600 font-semibold' : 'text-gray-600')}>
                      {item.label}
                    </span>
                  </Link>
                )}
              </div>
            )
          })}
          </div>
        </nav>

        {/* Desktop: con márgenes en el fondo también */}
        <nav
          ref={ref}
          className={cn(
            'fixed left-0 right-0 z-bottom-nav hidden lg:block overflow-visible',
            'safe-area-bottom',
            className
          )}
          style={{
            bottom: 'env(safe-area-inset-bottom, 0px)',
          }}
          {...props}
        >
          <div className='max-w-[1170px] mx-auto lg:px-8 xl:px-8 overflow-visible'>
            <div
              className='border-t shadow-lg overflow-visible'
              style={{
                borderRadius: '24px 24px 0px 0px',
                backgroundColor: 'white',
                borderTopColor: 'var(--glass-bg-strong)',
                boxShadow: 'inset 0px 4px 6px 0px rgba(0, 0, 0, 0.15)',
                backdropFilter: 'none',
                letterSpacing: '0px',
                lineHeight: '14px',
                opacity: '1',
              }}
            >
              <div className='flex items-end justify-around w-full h-14 overflow-visible'>
                {navItems.map((item) => {
                  const Icon = item.icon
                  const isItemActive = item.active
                  const hasBadge = item.id === 'cart' && item.badge !== undefined && item.badge > 0
                  const showBadge = item.id === 'cart' && item.badge !== undefined
                  const iconSlotHeight = 'h-6 sm:h-7'

                  return (
                    <div key={item.id} className='flex-1 flex flex-col items-center justify-end relative overflow-visible'>
                      {item.id === 'cart' || item.id === 'back' || item.id === 'whatsapp' || item.id === 'search' ? (
                        item.id === 'whatsapp' ? (
                          <div className='relative overflow-visible w-full flex flex-col items-center justify-end'>
                            {whatsAppBubble}
                            <button
                              onClick={item.onClick}
                              className={cn(
                                'flex flex-col items-center justify-end w-full min-h-0 py-0 pb-1.5 pt-0 transition-all duration-200 overflow-visible',
                                'text-gray-600 hover:text-blaze-orange-600 active:scale-95'
                              )}
                              aria-label={item.label}
                            >
                              <div className={cn('relative flex items-center justify-center overflow-visible', iconSlotHeight, 'w-full')}>
                                <div className='absolute bottom-0 left-1/2 -translate-x-1/2 w-10 h-10 flex items-center justify-center'>
                                  <div className='absolute inset-0 rounded-full transition-all duration-300 shadow-md' style={{ backgroundColor: '#25D366' }} />
                                  <div className={cn('relative w-full h-full rounded-full flex items-center justify-center transition-all duration-300', 'hover:scale-110 active:scale-95 transform-gpu will-change-transform')}>
                                    <Icon className='w-5 h-5 transition-colors duration-200 text-white' style={{ color: 'white' }} />
                                  </div>
                                </div>
                              </div>
                              <span className={cn('text-[10px] sm:text-xs mt-0.5 font-medium shrink-0', 'text-green-600')}>
                                {item.label}
                              </span>
                            </button>
                          </div>
                        ) : (
                        <button
                          onClick={item.onClick}
                          className={cn(
                            'flex flex-col items-center justify-end w-full min-h-0 py-0 pb-1.5 pt-0 transition-all duration-200 overflow-visible',
                            isItemActive ? 'text-blaze-orange-600' : 'text-gray-600',
                            'hover:text-blaze-orange-600 active:scale-95'
                          )}
                          aria-label={item.label}
                        >
                          {item.id === 'cart' ? (
                            <div className={cn('relative flex items-center justify-center overflow-visible', iconSlotHeight, 'w-full')}>
                              <div className='absolute bottom-0 left-1/2 -translate-x-1/2 w-10 h-10 flex items-center justify-center'>
                                <div
                                  className={cn('absolute inset-0 rounded-full transition-all duration-300 shadow-md', isAnimating && 'animate-pulse scale-110')}
                                  style={{ backgroundColor: 'var(--tenant-accent, #ffd549)' }}
                                />
                                <div
                                  className={cn('relative w-full h-full rounded-full flex items-center justify-center transition-all duration-300', 'hover:scale-110 active:scale-95 transform-gpu will-change-transform', isAnimating && 'scale-110')}
                                >
                                  <Icon className='w-5 h-5 transition-colors duration-200' style={{ color: 'var(--tenant-primary, #EA5A17)' }} />
                                </div>
                                {showBadge && (
                                  <span
                                    className={cn('absolute -top-1 -right-1 rounded-full min-w-[18px] h-[18px] sm:min-w-[20px] sm:h-[20px] flex items-center justify-center shadow-lg ring-2 ring-white z-10 text-[10px] sm:text-xs font-bold px-1', isAnimating && 'animate-bounce')}
                                    style={{ backgroundColor: 'var(--tenant-primary, #EA5A17)', color: 'var(--tenant-accent, #facc15)' }}
                                  >
                                    {item.badge && item.badge > 99 ? '99+' : item.badge}
                                  </span>
                                )}
                              </div>
                            </div>
                          ) : (
                            <div className={cn('flex items-center justify-center', iconSlotHeight, 'w-full')}>
                              <Icon className={cn('w-5 h-5 sm:w-6 sm:h-6', isItemActive && 'text-blaze-orange-600')} />
                            </div>
                          )}
                          <span
                            className={cn('text-[10px] sm:text-xs mt-0.5 font-medium shrink-0', isItemActive && 'text-blaze-orange-600')}
                          >
                            {item.label}
                          </span>
                        </button>
                        )
                      ) : (
                        <Link
                          href={item.href}
                          className={cn(
                            'flex flex-col items-center justify-end w-full min-h-0 py-0 pb-1.5 pt-0 transition-all duration-200',
                            isItemActive ? 'text-blaze-orange-600' : 'text-gray-600',
                            'hover:text-blaze-orange-600 active:scale-95'
                          )}
                          aria-label={item.label}
                        >
                          <div className={cn('flex items-center justify-center', iconSlotHeight, 'w-full')}>
                            <Icon className={cn('w-5 h-5 sm:w-6 sm:h-6', isItemActive && 'text-blaze-orange-600')} />
                            {showBadge && (
                              <span className='absolute -top-1 -right-1 bg-red-500 text-white text-[10px] font-bold rounded-full min-w-[16px] h-4 px-1 flex items-center justify-center'>
                                {item.badge}
                              </span>
                            )}
                          </div>
                          <span className={cn('text-[10px] sm:text-xs mt-0.5 font-medium shrink-0', isItemActive && 'text-blaze-orange-600')}>
                            {item.label}
                          </span>
                        </Link>
                      )}
                    </div>
                  )
                })}
              </div>
            </div>
          </div>
        </nav>
      </>
    )
  }
)

MercadoLibreBottomNav.displayName = 'MercadoLibreBottomNav'

export { MercadoLibreBottomNav }

