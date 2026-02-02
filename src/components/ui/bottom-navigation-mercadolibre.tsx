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

    // Función para abrir WhatsApp
    const handleWhatsAppClick = (e: React.MouseEvent) => {
      e.preventDefault()
      const whatsappUrl = `https://wa.me/${whatsappNumber}`
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

    // ⚡ FASE 11-16: Código de debugging deshabilitado en producción
// Los requests a 127.0.0.1:7242 estaban causando timeouts y bloqueando la carga
    return (
      <>
        {/* Mobile: full width */}
        <nav
          ref={ref}
          className={cn(
            'fixed left-0 right-0 z-bottom-nav border-t shadow-lg lg:hidden',
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
          <div className='flex items-center justify-around max-w-md mx-auto w-full h-14 sm:h-16'>
          {navItems.map((item) => {
            const Icon = item.icon
            const isItemActive = item.active
            const hasBadge = item.id === 'cart' && item.badge !== undefined && item.badge > 0
            const showBadge = item.id === 'cart' && item.badge !== undefined

            return (
              <div key={item.id} className='flex-1 flex flex-col items-center justify-center relative'>
                {/* Link o botón según el tipo */}
                {item.id === 'cart' || item.id === 'back' || item.id === 'whatsapp' || item.id === 'search' ? (
                  <button
                    onClick={item.onClick}
                    className={cn(
                      'flex flex-col items-center justify-center w-full py-1 transition-all duration-200',
                      isItemActive ? 'text-blaze-orange-600' : 'text-gray-600',
                      'hover:text-blaze-orange-600 active:scale-95'
                    )}
                    aria-label={item.label}
                  >
                    {/* Botón de carrito con estilo similar al ProductCard */}
                    {item.id === 'cart' ? (
                      <div className='relative mb-1 flex items-center justify-center'>
                        <div className='relative w-9 h-9 sm:w-10 sm:h-10 flex items-center justify-center'>
                          {/* Fondo amarillo circular como ProductCard */}
                          <div 
                            className={cn(
                              'absolute inset-0 rounded-full transition-all duration-300 shadow-md',
                              isAnimating && 'animate-pulse scale-110'
                            )}
                            style={{
                              backgroundColor: accentColor,
                            }}
                          />
                          {/* Icono del carrito */}
                          <div
                            className={cn(
                              'relative w-full h-full rounded-full flex items-center justify-center transition-all duration-300',
                              'hover:scale-110 active:scale-95 transform-gpu will-change-transform',
                              isAnimating && 'scale-110'
                            )}
                          >
                            <Icon 
                              className={cn(
                                'w-4 h-4 sm:w-5 sm:h-5 transition-colors duration-200'
                              )}
                              style={{ color: primaryColor }}
                            />
                          </div>
                          {/* Badge del carrito */}
                          {showBadge && (
                            <span
                              className={cn(
                                'absolute -top-1 -right-1 rounded-full min-w-[18px] h-[18px] sm:min-w-[20px] sm:h-[20px]',
                                'flex items-center justify-center shadow-lg ring-2 ring-white z-10',
                                'text-[10px] sm:text-xs font-bold px-1',
                                isAnimating && 'animate-bounce'
                              )}
                              style={{ 
                                backgroundColor: primaryColor,
                                color: accentColor
                              }}
                            >
                              {item.badge && item.badge > 99 ? '99+' : item.badge}
                            </span>
                          )}
                        </div>
                      </div>
                    ) : item.id === 'whatsapp' ? (
                      <div className='relative mb-1 flex items-center justify-center'>
                        <div className='relative w-9 h-9 sm:w-10 sm:h-10 flex items-center justify-center'>
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
                              className='w-4 h-4 sm:w-5 sm:h-5 transition-colors duration-200 text-white'
                              style={{ color: 'white' }}
                            />
                          </div>
                        </div>
                      </div>
                    ) : (
                      <div className='relative'>
                        <Icon className={cn('w-5 h-5 sm:w-6 sm:h-6', isItemActive && 'text-blaze-orange-600')} />
                      </div>
                    )}
                    <span
                      className={cn(
                        'text-[10px] sm:text-xs mt-0.5 font-medium',
                        item.id === 'whatsapp' ? 'text-green-600' : isItemActive && 'text-blaze-orange-600'
                      )}
                    >
                      {item.label}
                    </span>
                  </button>
                ) : (
                  <Link
                    href={item.href}
                    className={cn(
                      'flex flex-col items-center justify-center w-full py-1 transition-all duration-200',
                      isItemActive ? 'text-blaze-orange-600' : 'text-gray-600',
                      'hover:text-blaze-orange-600 active:scale-95'
                    )}
                    aria-label={item.label}
                  >
                    <div className='relative'>
                      <Icon className={cn('w-5 h-5 sm:w-6 sm:h-6', isItemActive && 'text-blaze-orange-600')} />
                      {showBadge && (
                        <span className='absolute -top-1 -right-1 bg-red-500 text-white text-[10px] font-bold rounded-full min-w-[16px] h-4 px-1 flex items-center justify-center'>
                          {item.badge}
                        </span>
                      )}
                    </div>
                    <span className={cn('text-[10px] sm:text-xs mt-0.5 font-medium', isItemActive && 'text-blaze-orange-600')}>
                      {item.label}
                    </span>
                  </Link>
                )}
              </div>
            )
          })}
        </div>
        
        {/* Desktop: con márgenes */}
        <div className='hidden lg:flex items-center justify-around max-w-[1170px] mx-auto w-full h-14 lg:px-8 xl:px-8'>
          {navItems.map((item) => {
            const Icon = item.icon
            const isItemActive = item.active
            const hasBadge = item.id === 'cart' && item.badge !== undefined && item.badge > 0
            const showBadge = item.id === 'cart' && item.badge !== undefined

            return (
              <div key={item.id} className='flex-1 flex flex-col items-center justify-center relative'>
                {/* Link o botón según el tipo */}
                {item.id === 'cart' || item.id === 'back' || item.id === 'whatsapp' || item.id === 'search' ? (
                  <button
                      onClick={(e) => {
                      // ⚡ FASE 11-16: Código de debugging deshabilitado en producción
// Los requests a 127.0.0.1:7242 estaban causando timeouts y bloqueando la carga
                      item.onClick?.(e);
                    }}
                    onPointerDown={(e) => {
                      // ⚡ FASE 11-16: Código de debugging deshabilitado en producción
// Los requests a 127.0.0.1:7242 estaban causando timeouts y bloqueando la carga
                      if (item.id === 'cart') setIsCartPressed(true);
                    }}
                    onMouseDown={() => item.id === 'cart' && setIsCartPressed(true)}
                    onMouseUp={() => item.id === 'cart' && setTimeout(() => setIsCartPressed(false), 200)}
                    onMouseLeave={() => item.id === 'cart' && setIsCartPressed(false)}
                    onTouchStart={() => item.id === 'cart' && setIsCartPressed(true)}
                    onTouchEnd={() => item.id === 'cart' && setTimeout(() => setIsCartPressed(false), 200)}
                    className={cn(
                      'flex flex-col items-center justify-center w-full py-1.5 sm:py-2 transition-all duration-200',
                      'focus:outline-none focus:ring-2 focus:ring-blaze-orange-500 focus:ring-offset-2 rounded-lg',
                      'active:scale-95'
                    )}
                    aria-label={item.label}
                  >
                    {/* Contenedor del icono con fondo circular estilo ProductCard */}
                    {item.id === 'cart' && (
                      <div className='relative mb-1 h-6 sm:h-7 flex items-center justify-center'>
                        <div className='relative w-9 h-9 sm:w-10 sm:h-10 flex items-center justify-center'>
                          {/* Fondo amarillo circular como ProductCard */}
                          <div 
                            className={cn(
                              'absolute inset-0 rounded-full transition-all duration-300 shadow-md',
                              isAnimating && 'animate-pulse scale-110',
                              isCartPressed && 'scale-95'
                            )}
                            style={{
                              background: 'var(--tenant-accent)e6',
                            }}
                          />
                          {/* Icono del carrito */}
                          <div
                            className={cn(
                              'relative w-full h-full rounded-full flex items-center justify-center transition-all duration-300',
                              'hover:scale-110 active:scale-95 transform-gpu will-change-transform',
                              isAnimating && 'scale-110'
                            )}
                          >
                            <Icon
                              className={cn(
                                'w-4 h-4 sm:w-5 sm:h-5 transition-colors duration-200'
                              )}
                              style={{ color: 'var(--tenant-primary, #EA5A17)' }}
                            />
                          </div>
                          {/* Badge del carrito */}
                          {showBadge && (
                            <span
                              className={cn(
                                'absolute -top-1 -right-1 rounded-full min-w-[18px] h-[18px] sm:min-w-[20px] sm:h-[20px]',
                                'flex items-center justify-center shadow-lg ring-2 ring-white z-10',
                                'text-[10px] sm:text-xs font-bold px-1',
                                isAnimating && 'animate-bounce'
                              )}
                              style={{ 
                                backgroundColor: 'var(--tenant-primary, #EA5A17)',
                                color: 'var(--tenant-accent, #facc15)'
                              }}
                            >
                              {item.badge && item.badge > 99 ? '99+' : item.badge}
                            </span>
                          )}
                        </div>
                      </div>
                    )}

                    {/* Icono para botón de buscar */}
                    {item.id === 'search' && (
                      <div className='mb-1 h-6 sm:h-7 flex items-center justify-center'>
                        <Icon
                          className={cn(
                            'w-5 h-5 sm:w-6 sm:h-6 transition-colors duration-200',
                            'text-gray-600 hover:text-blaze-orange-600'
                          )}
                          strokeWidth={1.5}
                        />
                      </div>
                    )}

                    {/* Icono para botón de volver */}
                    {item.id === 'back' && (
                      <div className='mb-1 h-6 sm:h-7 flex items-center justify-center'>
                        <Icon
                          className={cn(
                            'w-5 h-5 sm:w-6 sm:h-6 transition-colors duration-200',
                            'text-gray-600 hover:text-blaze-orange-600'
                          )}
                          strokeWidth={1.5}
                        />
                      </div>
                    )}

                    {/* Icono para WhatsApp: círculo verde + BrandWhatsapp */}
                    {item.id === 'whatsapp' && (
                      <div className='relative mb-1 h-6 sm:h-7 flex items-center justify-center'>
                        <div className='relative w-9 h-9 sm:w-10 sm:h-10 flex items-center justify-center'>
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
                              className='w-4 h-4 sm:w-5 sm:h-5 transition-colors duration-200 text-white'
                              style={{ color: 'white' }}
                              strokeWidth={1.5}
                            />
                          </div>
                        </div>
                      </div>
                    )}

                    {/* Label */}
                    <span
                      className={cn(
                        'text-[10px] sm:text-xs font-medium transition-colors duration-200',
                        item.id === 'cart' && (hasBadge || isCartPressed)
                          ? 'text-blaze-orange-600'
                          : item.id === 'whatsapp'
                          ? 'text-green-600'
                          : 'text-gray-600'
                      )}
                    >
                      {item.id === 'cart' && cartItemCount > 0 
                        ? `${item.label} (${cartItemCount})` 
                        : item.label}
                    </span>
                  </button>
                ) : (
                  <Link
                    href={item.href}
                    className={cn(
                      'flex flex-col items-center justify-center w-full py-1.5 sm:py-2 transition-all duration-200',
                      'focus:outline-none focus:ring-2 focus:ring-blaze-orange-500 focus:ring-offset-2 rounded-lg'
                    )}
                    aria-label={item.label}
                  >
                    {/* Línea naranja arriba cuando está activo (colores Pinteya) */}
                    {isItemActive && (
                      <div className='absolute top-0 left-1/2 transform -translate-x-1/2 w-12 h-0.5 bg-blaze-orange-600 rounded-full' />
                    )}

                    {/* Icono */}
                    <div className='mb-1 h-6 sm:h-7 flex items-center justify-center'>
                      <Icon
                        className={cn(
                          'w-5 h-5 sm:w-6 sm:h-6 transition-colors duration-200',
                          isItemActive
                            ? 'text-blaze-orange-600 fill-blaze-orange-600'
                            : 'text-gray-600'
                        )}
                        strokeWidth={isItemActive ? 2 : 1.5}
                        fill={isItemActive && item.id === 'home' ? 'currentColor' : 'none'}
                      />
                    </div>

                    {/* Label */}
                    <span
                      className={cn(
                        'text-[10px] sm:text-xs font-medium transition-colors duration-200',
                        isItemActive
                          ? 'text-blaze-orange-600 font-semibold'
                          : 'text-gray-600'
                      )}
                    >
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
            'fixed left-0 right-0 z-bottom-nav hidden lg:block',
            'safe-area-bottom',
            className
          )}
          style={{
            bottom: 'env(safe-area-inset-bottom, 0px)',
          }}
          {...props}
        >
          <div className='max-w-[1170px] mx-auto lg:px-8 xl:px-8'>
            <div
              className='border-t shadow-lg'
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
              <div className='flex items-center justify-around w-full h-14'>
                {navItems.map((item) => {
                  const Icon = item.icon
                  const isItemActive = item.active
                  const hasBadge = item.id === 'cart' && item.badge !== undefined && item.badge > 0
                  const showBadge = item.id === 'cart' && item.badge !== undefined

                  return (
                    <div key={item.id} className='flex-1 flex flex-col items-center justify-center relative'>
                      {/* Desktop navigation items - mismo código que mobile pero sin max-w-md */}
                      {item.id === 'cart' || item.id === 'back' || item.id === 'whatsapp' || item.id === 'search' ? (
                        <button
                          onClick={item.onClick}
                          className={cn(
                            'flex flex-col items-center justify-center w-full py-1 transition-all duration-200',
                            isItemActive ? 'text-blaze-orange-600' : 'text-gray-600',
                            'hover:text-blaze-orange-600 active:scale-95'
                          )}
                          aria-label={item.label}
                        >
                          {/* Botón de carrito con estilo similar al ProductCard */}
                          {item.id === 'cart' ? (
                            <div className='relative mb-1 flex items-center justify-center'>
                              <div className='relative w-9 h-9 sm:w-10 sm:h-10 flex items-center justify-center'>
                                {/* Fondo amarillo circular como ProductCard */}
                                <div 
                                  className={cn(
                                    'absolute inset-0 rounded-full transition-all duration-300 shadow-md',
                                    isAnimating && 'animate-pulse scale-110'
                                  )}
                                  style={{
                                    background: 'var(--tenant-accent)e6',
                                  }}
                                />
                                {/* Icono del carrito */}
                                <div
                                  className={cn(
                                    'relative w-full h-full rounded-full flex items-center justify-center transition-all duration-300',
                                    'hover:scale-110 active:scale-95 transform-gpu will-change-transform',
                                    isAnimating && 'scale-110'
                                  )}
                                >
                                  <Icon 
                                    className={cn(
                                      'w-4 h-4 sm:w-5 sm:h-5 transition-colors duration-200'
                                    )}
                                    style={{ color: 'var(--tenant-primary, #EA5A17)' }}
                                  />
                                </div>
                                {/* Badge del carrito */}
                                {showBadge && (
                                  <span
                                    className={cn(
                                      'absolute -top-1 -right-1 rounded-full min-w-[18px] h-[18px] sm:min-w-[20px] sm:h-[20px]',
                                      'flex items-center justify-center shadow-lg ring-2 ring-white z-10',
                                      'text-[10px] sm:text-xs font-bold px-1',
                                      isAnimating && 'animate-bounce'
                                    )}
                                    style={{ 
                                      backgroundColor: 'var(--tenant-primary, #EA5A17)',
                                      color: 'var(--tenant-accent, #facc15)'
                                    }}
                                  >
                                    {item.badge && item.badge > 99 ? '99+' : item.badge}
                                  </span>
                                )}
                              </div>
                            </div>
                          ) : item.id === 'whatsapp' ? (
                            <div className='relative mb-1 flex items-center justify-center'>
                              <div className='relative w-9 h-9 sm:w-10 sm:h-10 flex items-center justify-center'>
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
                                    className='w-4 h-4 sm:w-5 sm:h-5 transition-colors duration-200 text-white'
                                    style={{ color: 'white' }}
                                  />
                                </div>
                              </div>
                            </div>
                          ) : (
                            <div className='relative'>
                              <Icon className={cn('w-5 h-5 sm:w-6 sm:h-6', isItemActive && 'text-blaze-orange-600')} />
                            </div>
                          )}
                          <span
                            className={cn(
                              'text-[10px] sm:text-xs mt-0.5 font-medium',
                              item.id === 'whatsapp' ? 'text-green-600' : isItemActive && 'text-blaze-orange-600'
                            )}
                          >
                            {item.label}
                          </span>
                        </button>
                      ) : (
                        <Link
                          href={item.href}
                          className={cn(
                            'flex flex-col items-center justify-center w-full py-1 transition-all duration-200',
                            isItemActive ? 'text-blaze-orange-600' : 'text-gray-600',
                            'hover:text-blaze-orange-600 active:scale-95'
                          )}
                          aria-label={item.label}
                        >
                          <div className='relative'>
                            <Icon className={cn('w-5 h-5 sm:w-6 sm:h-6', isItemActive && 'text-blaze-orange-600')} />
                            {showBadge && (
                              <span className='absolute -top-1 -right-1 bg-red-500 text-white text-[10px] font-bold rounded-full min-w-[16px] h-4 px-1 flex items-center justify-center'>
                                {item.badge}
                              </span>
                            )}
                          </div>
                          <span className={cn('text-[10px] sm:text-xs mt-0.5 font-medium', isItemActive && 'text-blaze-orange-600')}>
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

