'use client'

import React, { useState, useEffect } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { useRouter } from 'next/navigation'
import { OptimizedCartIcon } from '@/components/ui/optimized-cart-icon'
import { useAppSelector } from '@/redux/store'
import { useSelector } from 'react-redux'
import { selectTotalPrice } from '@/redux/features/cart-slice'
import { useCartModalContext } from '@/app/context/CartSidebarModalContext'
import { SearchAutocompleteIntegrated, SearchSuggestion } from '@/components/ui/SearchAutocompleteIntegrated'
import { useCartAnimation } from '@/hooks/useCartAnimation'
import { MapPin, Loader2, ShoppingCart, LogIn } from '@/lib/optimized-imports'
import { useGeolocation } from '@/hooks/useGeolocation'
import { HeaderLogo } from '@/components/ui/OptimizedLogo'
import { UserAvatarDropdown, LoginButton } from './UserAvatarDropdown'
import { useAuth } from '@/hooks/useAuth'
import { Button } from '@/components/ui/button'
import { ShopDetailModal } from '@/components/ShopDetails/ShopDetailModal'
import { useTenantSafe } from '@/contexts/TenantContext'

const HeaderNextAuth = () => {
  const router = useRouter()
  const tenant = useTenantSafe()
  const [cartShake, setCartShake] = useState(false)
  const [isSticky, setIsSticky] = useState(false)
  const [isScrollingUp, setIsScrollingUp] = useState(true)
  const [lastScrollY, setLastScrollY] = useState(0)

  // Estado para el modal de producto
  const [selectedProduct, setSelectedProduct] = useState<any>(null)
  const [isProductModalOpen, setIsProductModalOpen] = useState(false)

  const { openCartModal } = useCartModalContext()
  const { isAnimating } = useCartAnimation()
  const { isSignedIn } = useAuth()

  // Hook de geolocalización para detectar ubicación
  const {
    detectedZone,
    requestLocation,
    permissionStatus,
    isLoading,
    error,
    location,
    testLocation,
  } = useGeolocation()

  // Selectors de Redux para el carrito con fallback
  const cartItems = useAppSelector(state => state.cartReducer?.items || [])
  const totalPrice = useSelector(selectTotalPrice)
  const totalQuantity = cartItems.reduce((total, item) => total + item.quantity, 0)

  // Función para manejar la selección de sugerencias de búsqueda
  const handleSuggestionSelect = async (suggestion: SearchSuggestion) => {
    console.log('🔍 HeaderNextAuth - handleSuggestionSelect ejecutado:', suggestion)

    if (suggestion.type === 'product' && suggestion.id) {
      // Redirigir directamente al detalle del producto
      router.push(`/products/${suggestion.id}`)
      return
    }

    console.log('🔍 Sugerencia no es de producto o sin id:', suggestion.type)
  }

  // Función para cerrar el modal de producto
  const handleCloseProductModal = () => {
    setIsProductModalOpen(false)
    setSelectedProduct(null)
  }

  // Efecto para el comportamiento sticky del header
  useEffect(() => {
    const handleScroll = () => {
      const currentScrollY = window.scrollY

      // Determinar si está haciendo scroll hacia arriba o abajo
      setIsScrollingUp(currentScrollY < lastScrollY || currentScrollY < 10)

      // Determinar si debe ser sticky
      setIsSticky(currentScrollY > 100)

      setLastScrollY(currentScrollY)
    }

    window.addEventListener('scroll', handleScroll, { passive: true })
    return () => window.removeEventListener('scroll', handleScroll)
  }, [lastScrollY])

  // Efecto para animación del carrito
  useEffect(() => {
    if (isAnimating) {
      setCartShake(true)
      const timer = setTimeout(() => setCartShake(false), 600)
      return () => clearTimeout(timer)
    }
  }, [isAnimating])

  // Función para manejar click en ubicación
  const handleLocationClick = () => {
    if (permissionStatus === 'prompt' || permissionStatus === 'denied') {
      requestLocation()
    }
  }

  // Función para formatear precio
  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('es-AR', {
      style: 'currency',
      currency: 'ARS',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(price)
  }

  return (
    <>
      <header
        className={`
        fixed left-0 top-0 w-full z-header
        rounded-b-3xl shadow-lg
        header-sticky-transition
        ${isSticky ? 'shadow-2xl backdrop-blur-sm' : 'shadow-lg'}
        ${isScrollingUp ? 'translate-y-0' : isSticky ? '-translate-y-2' : 'translate-y-0'}
        transition-all duration-300 ease-in-out
      `}
        style={{ backgroundColor: tenant?.headerBgColor || 'var(--tenant-header-bg)' }}
      >
        {/* Topbar con ubicación y promociones */}
        <div 
          className='py-1'
          style={{ backgroundColor: tenant?.primaryDark || 'var(--tenant-primary-dark)' }}
        >
          <div className='max-w-[1200px] mx-auto px-4 flex items-center justify-center text-xs min-h-[24px] gap-6'>
            {/* Ubicación compacta */}
            <div
              onClick={handleLocationClick}
              className='flex items-center gap-1 cursor-pointer transition-all duration-200 hover:scale-105 group'
              style={{ color: 'var(--tenant-accent, #fff3c5)' }}
            >
              <MapPin 
                className='w-3 h-3 transition-all duration-200 group-hover:scale-110'
                style={{ color: 'var(--tenant-accent, #facc15)' }}
              />
              <span className='font-medium text-xs transition-colors duration-200'>
                {isLoading ? (
                  <span className='flex items-center gap-1'>
                    <Loader2 className='w-3 h-3 animate-spin' />
                    Detectando...
                  </span>
                ) : detectedZone ? (
                  `Envíos en ${detectedZone}`
                ) : (
                  'Envíos en Córdoba Capital'
                )}
              </span>
            </div>

            <div 
              className='font-light'
              style={{ color: 'var(--tenant-accent, #facc15)' }}
            >|</div>

            {/* Envío gratis */}
            <div className='flex items-center gap-1' style={{ color: 'var(--tenant-accent, #fff3c5)' }}>
              <ShoppingCart 
                className='w-3 h-3 transition-all duration-200'
                style={{ color: 'var(--tenant-accent, #facc15)' }}
              />
              <span className='font-medium text-xs'>Envío gratis desde $50.000</span>
            </div>

            <div 
              className='hidden lg:block font-light'
              style={{ color: 'var(--tenant-accent, #facc15)' }}
            >|</div>

            {/* Teléfono */}
            <div className='hidden lg:flex items-center gap-1' style={{ color: 'var(--tenant-accent, #fff3c5)' }}>
              <svg 
                className='w-3 h-3' 
                fill='currentColor' 
                viewBox='0 0 20 20'
                style={{ color: 'var(--tenant-accent, #facc15)' }}
              >
                <path d='M2 3a1 1 0 011-1h2.153a1 1 0 01.986.836l.74 4.435a1 1 0 01-.54 1.06l-1.548.773a11.037 11.037 0 006.105 6.105l.774-1.548a1 1 0 011.059-.54l4.435.774a1 1 0 01.836.986V17a1 1 0 01-1 1h-2C7.82 18 2 12.18 2 5V3z' />
              </svg>
              <span className='text-xs'>+54 351 341 1796</span>
            </div>
          </div>
        </div>

        {/* Header principal - SOLO LOGO Y BÚSQUEDA */}
        <div className='max-w-[1200px] mx-auto px-2 sm:px-4 py-3'>
          <div className='flex items-center gap-2 sm:gap-4 min-h-[60px]'>
            {/* Logo */}
            <Link href='/' className='flex-shrink-0 group focus-ring'>
              <HeaderLogo />
            </Link>

            {/* Buscador - Expandido al máximo */}
            <div className='flex-1 flex items-center'>
              <form className='relative w-full'>
                <div
                  className='flex items-center transition-all duration-300 hover:shadow-lg hover:scale-[1.01] search-focus-ring'
                  style={{ backgroundColor: 'var(--tenant-accent, #fff3c5)', borderRadius: '8px', padding: '1px' }}
                >
                  <SearchAutocompleteIntegrated
                    placeholder='latex interior blanco 20lts'
                    showTrendingSearches={true}
                    onSuggestionSelected={handleSuggestionSelect}
                  />
                </div>
              </form>
            </div>
          </div>
        </div>
      </header>

      {/* Modal de producto */}
      <ShopDetailModal
        product={selectedProduct}
        open={isProductModalOpen}
        onOpenChange={handleCloseProductModal}
      />
    </>
  )
}

export default HeaderNextAuth
