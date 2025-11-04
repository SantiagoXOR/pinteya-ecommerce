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

// ⚡ PERFORMANCE: Memoizar SearchAutocomplete para evitar re-renders innecesarios
const MemoizedSearchAutocomplete = React.memo(SearchAutocompleteIntegrated)
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

  // ⚡ PERFORMANCE: Hook de geolocalización diferido (no bloquea FCP)
  // Solo se inicializa después de 2 segundos del mount
  const [geoEnabled, setGeoEnabled] = useState(false)
  
  useEffect(() => {
    // Defer geolocalización para no bloquear el FCP
    const timer = setTimeout(() => {
      setGeoEnabled(true)
    }, 2000) // 2s después del mount
    
    return () => clearTimeout(timer)
  }, [])

  const {
    detectedZone,
    requestLocation,
    permissionStatus,
    isLoading,
    error,
    location,
    testLocation,
  } = useGeolocation(geoEnabled ? undefined : { skip: true })

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
      <header
        className={`
        fixed top-0 left-0 w-full z-header
        bg-blaze-orange-600 rounded-b-3xl shadow-lg
        header-sticky-transition
        ${isSticky ? 'shadow-2xl backdrop-blur-sm' : 'shadow-lg'}
        ${isScrollingUp ? 'translate-y-0' : isSticky ? '-translate-y-2' : 'translate-y-0'}
        transition-all duration-300 ease-in-out
      `}
      >
        {/* ScrollingBanner integrado en la parte superior del header */}
        <div className='w-full'>
          <ScrollingBanner />
        </div>
        {/* Header principal - Con expansión de búsqueda al hacer click */}
        <div className='max-w-[1200px] mx-auto px-3 sm:px-4 py-2 sm:py-2.5'>
          <div className='flex items-center gap-3 sm:gap-4 min-h-[52px]'>
            {/* 1. Logo - Ocultar cuando search está expandido */}
            <Link 
              href='/' 
              className={`
                flex-shrink-0 overflow-visible logo-container transition-all duration-300
                ${isSearchExpanded ? 'hidden sm:hidden' : 'flex'}
                ml-3 sm:ml-8 md:ml-12
              `}
            >
              <HeaderLogo
                isMobile={false}
                className={`
                  w-20 sm:w-28 md:w-36 h-auto transition-all duration-300 ease-out
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
                    className='flex items-center transition-all duration-300 hover:shadow-md search-focus-ring bg-bright-sun-100 rounded-full'
                  >
                    <MemoizedSearchAutocomplete
                      placeholder='Buscar productos...'
                      className='[&>div>div>input]:w-full [&>div>div>input]:border [&>div>div>input]:border-bright-sun-200 [&>div>div>input]:rounded-full [&>div>div>input]:pl-3 [&>div>div>input]:sm:pl-4 [&>div>div>input]:pr-10 [&>div>div>input]:py-1 [&>div>div>input]:text-blaze-orange-600 [&>div>div>input]:text-sm [&>div>div>input]:font-normal [&>div>div>input]:shadow-sm [&>div>div>input]:focus:border-bright-sun-300 [&>div>div>input]:focus:ring-1 [&>div>div>input]:focus:ring-bright-sun-200 [&>div>div>input]:transition-all [&>div>div>input]:duration-200 [&>div>div>input]:hover:border-bright-sun-300 [&>div>div>input]:!bg-white'
                      debounceMs={100}
                      maxSuggestions={6}
                      showRecentSearches={true}
                      showTrendingSearches={true}
                    />
                    
                    {/* Botón X para cerrar */}
                    <button
                      onClick={handleSearchCollapse}
                      className='absolute right-2 w-7 h-7 rounded-full bg-orange-500 hover:bg-orange-600 flex items-center justify-center transition-all duration-200 hover:scale-110 active:scale-95 shadow-lg z-10'
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
                    className='flex items-center transition-all duration-300 hover:shadow-md search-focus-ring bg-bright-sun-100 rounded-full'
                  >
                    <MemoizedSearchAutocomplete
                      placeholder='Buscar productos...'
                      className='[&>div>div>input]:w-full [&>div>div>input]:border [&>div>div>input]:border-bright-sun-200 [&>div>div>input]:rounded-full [&>div>div>input]:pl-3 [&>div>div>input]:sm:pl-4 [&>div>div>input]:pr-3 [&>div>div>input]:sm:pr-4 [&>div>div>input]:py-1 [&>div>div>input]:text-blaze-orange-600 [&>div>div>input]:text-xs [&>div>div>input]:sm:text-sm [&>div>div>input]:font-normal [&>div>div>input]:shadow-sm [&>div>div>input]:focus:border-bright-sun-300 [&>div>div>input]:focus:ring-1 [&>div>div>input]:focus:ring-bright-sun-200 [&>div>div>input]:transition-all [&>div>div>input]:duration-200 [&>div>div>input]:hover:border-bright-sun-300 [&>div>div>input]:!bg-white'
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
