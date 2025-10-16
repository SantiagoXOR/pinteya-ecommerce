'use client'
import React, { useState, useEffect, useCallback } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { OptimizedCartIcon } from '@/components/ui/optimized-cart-icon'
import { useAppSelector } from '@/redux/store'
import { useSelector } from 'react-redux'
import { selectTotalPrice } from '@/redux/features/cart-slice'
import { useCartModalContext } from '@/app/context/CartSidebarModalContext'
import { UserAvatarDropdown, LoginButton } from './UserAvatarDropdown'
import { useAuth } from '@/hooks/useAuth'
import ActionButtons from './ActionButtons'
import { SearchAutocompleteIntegrated } from '@/components/ui/SearchAutocompleteIntegrated'
import { useCartAnimation } from '@/hooks/useCartAnimation'
import { MapPin, Loader2, ShoppingCart } from '@/lib/optimized-imports'
import { useGeolocation } from '@/hooks/useGeolocation'
import { HeaderLogo } from '@/components/ui/OptimizedLogo'
import ScrollingBanner from './ScrollingBanner'
// import GeolocationDebugger from "./GeolocationDebugger"; // Componente de debugging desactivado

const Header = () => {
  const [cartShake, setCartShake] = useState(false)
  const [isSticky, setIsSticky] = useState(false)
  const [isScrollingUp, setIsScrollingUp] = useState(true)
  const [lastScrollY, setLastScrollY] = useState(0)
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

  // Sticky header logic con detección de dirección de scroll
  useEffect(() => {
    const handleScroll = () => {
      const currentScrollY = window.scrollY

      // Determinar si el header debe ser sticky
      setIsSticky(currentScrollY > 100)

      // Determinar dirección del scroll para animaciones
      setIsScrollingUp(currentScrollY < lastScrollY || currentScrollY < 10)
      setLastScrollY(currentScrollY)
    }

    window.addEventListener('scroll', handleScroll, { passive: true })
    return () => window.removeEventListener('scroll', handleScroll)
  }, [lastScrollY])

  // Log para debugging del estado de geolocalización (solo cuando cambia la zona)
  useEffect(() => {}, [detectedZone?.name]) // Solo depender del nombre de la zona

  const product = useAppSelector(state => state.cartReducer.items)
  const totalPrice = useSelector(selectTotalPrice)

  // Efecto para animar el carrito cuando se agregan productos
  useEffect(() => {
    if (product.length > 0) {
      setCartShake(true)
      setTimeout(() => setCartShake(false), 500)
    }
  }, [product.length])

  // Geolocalización automática desactivada por ser intrusiva
  // Los usuarios pueden activar manualmente la ubicación desde el TopBar
  // useEffect(() => {
  //   // Solicitar ubicación automáticamente si no se ha detectado
  //   if (permissionStatus === 'unknown' || permissionStatus === 'prompt') {
  //     setTimeout(() => {
  //       requestLocation();
  //     }, 1000); // Delay de 1 segundo para evitar conflictos
  //   }
  // }, [permissionStatus, requestLocation]);

  const handleOpenCartModal = useCallback(() => {
    openCartModal()
  }, [openCartModal])

  const handleLocationClick = useCallback(() => {
    // Siempre intentar solicitar ubicación cuando se hace click
    if (permissionStatus === 'denied') {
      alert(
        'Para detectar tu ubicación automáticamente, permite el acceso a la ubicación en la configuración de tu navegador.'
      )
    } else if (
      permissionStatus === 'granted' &&
      detectedZone &&
      detectedZone.name !== 'Córdoba Capital'
    ) {
      requestLocation()
    } else {
      requestLocation()
    }
  }, [permissionStatus, detectedZone, requestLocation])

  const handleSearchSubmit = useCallback((e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    // El SearchAutocomplete maneja su propia lógica de búsqueda
    // Este handler previene el comportamiento por defecto del form
  }, [])

  return (
    <>
      {/* Banner deslizante arriba del header */}
      <div className='fixed top-0 left-0 w-full z-[99999] bg-blaze-orange-600'>
        <ScrollingBanner />
      </div>

      <header
        className={`
        fixed left-0 w-full z-header
        bg-blaze-orange-600 rounded-b-3xl shadow-lg
        header-sticky-transition
        ${isSticky ? 'shadow-2xl backdrop-blur-sm' : 'shadow-lg'}
        ${isScrollingUp ? 'translate-y-0' : isSticky ? '-translate-y-2' : 'translate-y-0'}
        transition-all duration-300 ease-in-out
      `}
        style={{ top: '34px' }}
      >
        {/* Header principal - Layout optimizado mobile-first */}
        <div className='max-w-[1200px] mx-auto px-2 sm:px-4 py-3'>
          <div className='flex items-center justify-center gap-1 sm:gap-4 min-h-[60px]'>
            {/* Logo compacto - Optimizado para mobile */}
            <Link href='/' className='group'>
              <HeaderLogo
                isMobile={false}
                className={`
                  hidden sm:block w-28 h-auto transition-all duration-300 ease-out
                  hover:scale-110 cursor-pointer
                  ${isSticky ? 'logo-sticky-scale scale-95' : 'scale-100'}
                `}
              />
            </Link>
            <Link href='/' className='group'>
              <HeaderLogo
                isMobile={true}
                className={`
                  sm:hidden w-20 h-auto transition-all duration-300 ease-out
                  hover:scale-110 cursor-pointer
                  ${isSticky ? 'logo-sticky-scale scale-90' : 'scale-100'}
                `}
              />
            </Link>

            {/* Buscador expandido - Máximo espacio en mobile */}
            <div className='flex-1 mx-1 sm:mx-4 max-w-none sm:max-w-2xl flex items-center'>
              <div className='relative w-full'>
                <div
                  style={{ backgroundColor: '#fff3c5', borderRadius: '8px', padding: '1px' }}
                  className='flex items-center transition-all duration-300 hover:shadow-lg hover:scale-[1.02] search-focus-ring'
                >
                  <SearchAutocompleteIntegrated
                    placeholder='Buscar productos...'
                    className='[&>div>div>input]:w-full [&>div>div>input]:border-2 [&>div>div>input]:border-orange-300 [&>div>div>input]:rounded-lg [&>div>div>input]:pl-4 [&>div>div>input]:pr-12 [&>div>div>input]:py-2.5 [&>div>div>input]:text-blaze-orange-600 [&>div>div>input]:text-sm [&>div>div>input]:sm:text-base [&>div>div>input]:font-medium [&>div>div>input]:shadow-sm [&>div>div>input]:focus:border-orange-500 [&>div>div>input]:focus:ring-2 [&>div>div>input]:focus:ring-orange-200 [&>div>div>input]:transition-all [&>div>div>input]:duration-300 [&>div>div>input]:hover:border-orange-400 [&>div>div>input]:!bg-transparent'
                    style={
                      {
                        backgroundColor: 'transparent',
                      } as React.CSSProperties
                    }
                    size='lg'
                    debounceMs={100}
                    maxSuggestions={6}
                    showRecentSearches={true}
                    showTrendingSearches={true}
                  />
                </div>
              </div>
            </div>

            {/* Sección derecha - Carrito y autenticación */}
            <div className='flex items-center gap-1 sm:gap-3'>
              {/* Autenticación - Desktop */}
              <div className='hidden sm:block'>
                {isSignedIn ? <UserAvatarDropdown /> : <LoginButton />}
              </div>
              {/* Autenticación - Mobile */}
              <div className='sm:hidden'>
                {isSignedIn ? <UserAvatarDropdown /> : <LoginButton />}
              </div>
            </div>
          </div>
        </div>
      </header>
    </>
  )
}

export default Header
