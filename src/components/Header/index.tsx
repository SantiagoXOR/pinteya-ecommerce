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
import { MapPin, Loader2, ShoppingCart, MessageCircle, Search, X } from '@/lib/optimized-imports'
import { useGeolocation } from '@/hooks/useGeolocation'
import { HeaderLogo } from '@/components/ui/OptimizedLogo'
import ScrollingBanner from './ScrollingBanner'
// import GeolocationDebugger from "./GeolocationDebugger"; // Componente de debugging desactivado

const Header = () => {
  const [cartShake, setCartShake] = useState(false)
  const [isSticky, setIsSticky] = useState(false)
  const [isScrollingUp, setIsScrollingUp] = useState(true)
  const [lastScrollY, setLastScrollY] = useState(0)
  const [isSearchExpanded, setIsSearchExpanded] = useState(false)
  const [isMounted, setIsMounted] = useState(false) // Para evitar hydration mismatch
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

  // Marcar como montado para evitar hydration mismatch
  useEffect(() => {
    setIsMounted(true)
  }, [])

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

  // Handlers para expansión del searchbar en mobile
  const handleSearchClick = useCallback(() => {
    setIsSearchExpanded(true)
  }, [])

  const handleSearchCollapse = useCallback(() => {
    setIsSearchExpanded(false)
  }, [])

  const handleSearchBlur = useCallback(() => {
    // Delay para permitir clicks en sugerencias
    setTimeout(() => {
      setIsSearchExpanded(false)
    }, 200)
  }, [])

  // Handlers para botones de acción mobile
  const handleWhatsAppClick = useCallback(() => {
    const whatsappNumber = '+5493513411796'
    const whatsappUrl = `https://wa.me/${whatsappNumber}`
    window.open(whatsappUrl, '_blank', 'noopener,noreferrer')
  }, [])

  const handleCartClick = useCallback(() => {
    openCartModal()
  }, [openCartModal])

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
        {/* Header principal - Con expansión de búsqueda al hacer click */}
        <div className='max-w-[1200px] mx-auto px-3 sm:px-4 py-2 sm:py-3'>
          <div className='flex items-center gap-4 sm:gap-6 min-h-[60px]'>
            {/* 1. Logo - Ocultar cuando search está expandido */}
            <Link 
              href='/' 
              className={`
                flex-shrink-0 overflow-visible logo-container transition-all duration-300
                ${isSearchExpanded ? 'hidden sm:hidden' : 'flex'}
                ml-2 sm:ml-8 md:ml-12
              `}
            >
              <HeaderLogo
                isMobile={false}
                className={`
                  w-16 sm:w-24 md:w-32 h-auto transition-all duration-300 ease-out
                  hover:scale-110 cursor-pointer
                  ${isSticky ? 'logo-sticky-scale scale-95' : 'scale-100'}
                `}
              />
            </Link>
            
            {/* 2. Search Expandido - Ocupa TODO el ancho cuando está activo */}
            {isSearchExpanded && (
              <div className='flex-1'>
                <div className='relative w-full'>
                  <div
                    style={{ backgroundColor: '#fff3c5', borderRadius: '9999px', padding: '1px' }}
                    className='flex items-center transition-all duration-300 hover:shadow-lg hover:scale-[1.01] search-focus-ring'
                  >
                    <SearchAutocompleteIntegrated
                      placeholder='Buscar productos...'
                      className='[&>div>div>input]:w-full [&>div>div>input]:border-2 [&>div>div>input]:border-orange-300 [&>div>div>input]:rounded-full [&>div>div>input]:pl-4 [&>div>div>input]:pr-12 [&>div>div>input]:py-2.5 [&>div>div>input]:text-blaze-orange-600 [&>div>div>input]:text-sm [&>div>div>input]:sm:text-base [&>div>div>input]:font-medium [&>div>div>input]:shadow-sm [&>div>div>input]:focus:border-orange-500 [&>div>div>input]:focus:ring-2 [&>div>div>input]:focus:ring-orange-200 [&>div>div>input]:transition-all [&>div>div>input]:duration-300 [&>div>div>input]:hover:border-orange-400 [&>div>div>input]:!bg-transparent'
                      debounceMs={100}
                      maxSuggestions={6}
                      showRecentSearches={true}
                      showTrendingSearches={true}
                    />
                    
                    {/* Botón X para cerrar */}
                    <button
                      onClick={handleSearchCollapse}
                      className='absolute right-2 w-8 h-8 rounded-full bg-orange-500 hover:bg-orange-600 flex items-center justify-center transition-all duration-200 hover:scale-110 active:scale-95 shadow-lg z-10'
                      aria-label='Cerrar búsqueda'
                    >
                      <X className='w-4 h-4 text-white' strokeWidth={2.5} />
                    </button>
                  </div>
                </div>
              </div>
            )}
            
            {/* 3. Search Normal - Cuando NO está expandido */}
            {!isSearchExpanded && (
              <div 
                className='flex-1 max-w-xl sm:max-w-2xl mx-4 sm:mx-8 cursor-pointer'
                onClick={handleSearchClick}
              >
                <div className='relative w-full'>
                  <div
                    style={{ backgroundColor: '#fff3c5', borderRadius: '9999px', padding: '1px' }}
                    className='flex items-center transition-all duration-300 hover:shadow-lg hover:scale-[1.01] sm:hover:scale-[1.02] search-focus-ring'
                  >
                    <SearchAutocompleteIntegrated
                      placeholder='Buscar productos...'
                      className='[&>div>div>input]:w-full [&>div>div>input]:border-2 [&>div>div>input]:border-orange-300 [&>div>div>input]:rounded-full [&>div>div>input]:pl-3 [&>div>div>input]:sm:pl-4 [&>div>div>input]:pr-3 [&>div>div>input]:sm:pr-4 [&>div>div>input]:py-2 [&>div>div>input]:sm:py-2.5 [&>div>div>input]:text-blaze-orange-600 [&>div>div>input]:text-xs [&>div>div>input]:sm:text-sm [&>div>div>input]:md:text-base [&>div>div>input]:font-medium [&>div>div>input]:shadow-sm [&>div>div>input]:focus:border-orange-500 [&>div>div>input]:focus:ring-2 [&>div>div>input]:focus:ring-orange-200 [&>div>div>input]:transition-all [&>div>div>input]:duration-300 [&>div>div>input]:hover:border-orange-400 [&>div>div>input]:!bg-transparent'
                      debounceMs={100}
                      maxSuggestions={6}
                      showRecentSearches={true}
                      showTrendingSearches={true}
                    />
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </header>
    </>
  )
}

export default Header
