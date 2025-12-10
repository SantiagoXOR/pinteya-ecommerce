'use client'

import * as React from 'react'
import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { Home, ArrowLeft, ShoppingCart, Search, MessageCircle } from '@/lib/optimized-imports'
import { cn } from '@/lib/utils'
import { useAppSelector } from '@/redux/store'
import { useCartModalContext } from '@/app/context/CartSidebarModalContext'

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
      const whatsappNumber = '5493513411796'
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
        icon: MessageCircle,
        active: false,
        onClick: handleWhatsAppClick,
      },
    ]

    return (
      <nav
        ref={ref}
        className={cn(
          'fixed bottom-0 left-0 right-0 z-bottom-nav bg-white border-t border-gray-200 shadow-lg',
          'safe-area-bottom', // Para dispositivos con notch
          className
        )}
        {...props}
      >
        <div className='flex items-center justify-around max-w-md mx-auto w-full h-16'>
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
                    onMouseDown={() => item.id === 'cart' && setIsCartPressed(true)}
                    onMouseUp={() => item.id === 'cart' && setTimeout(() => setIsCartPressed(false), 200)}
                    onMouseLeave={() => item.id === 'cart' && setIsCartPressed(false)}
                    onTouchStart={() => item.id === 'cart' && setIsCartPressed(true)}
                    onTouchEnd={() => item.id === 'cart' && setTimeout(() => setIsCartPressed(false), 200)}
                    className={cn(
                      'flex flex-col items-center justify-center w-full py-2 transition-all duration-200',
                      'focus:outline-none focus:ring-2 focus:ring-blaze-orange-500 focus:ring-offset-2 rounded-lg',
                      'active:scale-95'
                    )}
                    aria-label={item.label}
                  >
                    {/* Contenedor del icono con fondo circular mejorado para el carrito */}
                    {item.id === 'cart' && (
                      <div className='relative mb-1'>
                        <div
                          className={cn(
                            'w-11 h-11 rounded-full flex items-center justify-center transition-all duration-200',
                            isCartPressed
                              ? 'bg-blaze-orange-600 border-2 border-blaze-orange-700 shadow-md'
                              : hasBadge
                              ? 'bg-blaze-orange-50 border-2 border-blaze-orange-200 shadow-sm'
                              : 'bg-gray-50 border border-gray-200 hover:bg-gray-100'
                          )}
                        >
                          <Icon
                            className={cn(
                              'w-6 h-6 transition-colors duration-200',
                              isCartPressed
                                ? 'text-white fill-white'
                                : hasBadge
                                ? 'text-blaze-orange-600 fill-blaze-orange-600'
                                : 'text-gray-600'
                            )}
                            strokeWidth={isCartPressed || hasBadge ? 2 : 1.5}
                            fill={isCartPressed || hasBadge ? 'currentColor' : 'none'}
                          />
                        </div>

                        {/* Badge del carrito encima del círculo con color naranja Pinteya - Posicionado más arriba para alinear títulos */}
                        {showBadge && (
                          <span
                            className={cn(
                              'absolute -top-2.5 left-1/2 transform -translate-x-1/2 text-white text-[10px] font-bold',
                              'rounded-full min-w-[20px] h-[20px] flex items-center justify-center px-1.5',
                              'shadow-lg border-2 border-white ring-2 ring-blaze-orange-100 z-10',
                              item.badge && item.badge > 0
                                ? 'bg-blaze-orange-600'
                                : 'bg-gray-400'
                            )}
                          >
                            {item.badge && item.badge > 99 ? '99+' : item.badge}
                          </span>
                        )}
                      </div>
                    )}

                    {/* Icono para botón de buscar */}
                    {item.id === 'search' && (
                      <div className='mb-1'>
                        <Icon
                          className={cn(
                            'w-6 h-6 transition-colors duration-200',
                            'text-gray-600 hover:text-blaze-orange-600'
                          )}
                          strokeWidth={1.5}
                        />
                      </div>
                    )}

                    {/* Icono para botón de volver */}
                    {item.id === 'back' && (
                      <div className='mb-1'>
                        <Icon
                          className={cn(
                            'w-6 h-6 transition-colors duration-200',
                            'text-gray-600 hover:text-blaze-orange-600'
                          )}
                          strokeWidth={1.5}
                        />
                      </div>
                    )}

                    {/* Icono para WhatsApp */}
                    {item.id === 'whatsapp' && (
                      <div className='mb-1'>
                        <Icon
                          className={cn(
                            'w-6 h-6 transition-colors duration-200',
                            'text-green-600 hover:text-green-700'
                          )}
                          strokeWidth={1.5}
                        />
                      </div>
                    )}

                    {/* Label */}
                    <span
                      className={cn(
                        'text-xs font-medium transition-colors duration-200',
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
                      'flex flex-col items-center justify-center w-full py-2 transition-all duration-200',
                      'focus:outline-none focus:ring-2 focus:ring-blaze-orange-500 focus:ring-offset-2 rounded-lg'
                    )}
                    aria-label={item.label}
                  >
                    {/* Línea naranja arriba cuando está activo (colores Pinteya) */}
                    {isItemActive && (
                      <div className='absolute top-0 left-1/2 transform -translate-x-1/2 w-12 h-0.5 bg-blaze-orange-600 rounded-full' />
                    )}

                    {/* Icono */}
                    <div className='mb-1'>
                      <Icon
                        className={cn(
                          'w-6 h-6 transition-colors duration-200',
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
                        'text-xs font-medium transition-colors duration-200',
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
    )
  }
)

MercadoLibreBottomNav.displayName = 'MercadoLibreBottomNav'

export { MercadoLibreBottomNav }

