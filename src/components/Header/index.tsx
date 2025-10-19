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
        {/* Header principal - Layout optimizado mobile-first */}
        <div className='max-w-[1200px] mx-auto px-2 sm:px-4 py-3'>
          <div className='flex items-center justify-between sm:justify-center gap-2 sm:gap-4 min-h-[60px]'>
            {/* 1. Logo - Ocultar mobile cuando search expandido */}
            <Link 
              href='/' 
              className={`
                flex-shrink-0 overflow-visible logo-container transition-all duration-300
                ${isSearchExpanded ? 'hidden sm:flex' : 'flex'}
                ml-4 sm:ml-0
              `}
            >
              <HeaderLogo
                isMobile={false}
                className={`
                  w-20 sm:w-28 h-auto transition-all duration-300 ease-out
                  hover:scale-110 cursor-pointer
                  ${isSticky ? 'logo-sticky-scale scale-95' : 'scale-100'}
                `}
              />
            </Link>
            
            {/* 2. Search Expandido - Con botón de colapso DENTRO */}
            {isSearchExpanded && (
              <div className='flex-1'>
                <div className='relative w-full'>
                  <div
                    style={{ backgroundColor: '#fff3c5', borderRadius: '9999px', padding: '1px' }}
                    className='flex items-center transition-all duration-300 hover:shadow-lg hover:scale-[1.02] search-focus-ring'
                  >
                    <SearchAutocompleteIntegrated
                      placeholder='Buscar productos...'
                      autoFocus={true}
                      onBlur={handleSearchBlur}
                      className='[&>div>div>input]:w-full [&>div>div>input]:border-2 [&>div>div>input]:border-orange-300 [&>div>div>input]:rounded-full [&>div>div>input]:pl-4 [&>div>div>input]:pr-12 [&>div>div>input]:py-2.5 [&>div>div>input]:text-blaze-orange-600 [&>div>div>input]:text-sm [&>div>div>input]:sm:text-base [&>div>div>input]:font-medium [&>div>div>input]:shadow-sm [&>div>div>input]:focus:border-orange-500 [&>div>div>input]:focus:ring-2 [&>div>div>input]:focus:ring-orange-200 [&>div>div>input]:transition-all [&>div>div>input]:duration-300 [&>div>div>input]:hover:border-orange-400 [&>div>div>input]:!bg-transparent'
                      style={{ backgroundColor: 'transparent' } as React.CSSProperties}
                      size='lg'
                      debounceMs={100}
                      maxSuggestions={6}
                      showRecentSearches={true}
                      showTrendingSearches={true}
                    />
                    
                    {/* Botón de colapso - X DENTRO del searchbar */}
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
            
            {/* Desktop searchbar - Siempre expandido */}
            <div className='hidden sm:flex flex-1 mx-8 max-w-2xl'>
              <div className='relative w-full'>
                <div
                  style={{ backgroundColor: '#fff3c5', borderRadius: '9999px', padding: '1px' }}
                  className='flex items-center transition-all duration-300 hover:shadow-lg hover:scale-[1.02] search-focus-ring'
                >
                  <SearchAutocompleteIntegrated
                    placeholder='Buscar productos...'
                    className='[&>div>div>input]:w-full [&>div>div>input]:border-2 [&>div>div>input]:border-orange-300 [&>div>div>input]:rounded-full [&>div>div>input]:pl-4 [&>div>div>input]:pr-12 [&>div>div>input]:py-2.5 [&>div>div>input]:text-blaze-orange-600 [&>div>div>input]:text-base [&>div>div>input]:font-medium [&>div>div>input]:shadow-sm [&>div>div>input]:focus:border-orange-500 [&>div>div>input]:focus:ring-2 [&>div>div>input]:focus:ring-orange-200 [&>div>div>input]:transition-all [&>div>div>input]:duration-300 [&>div>div>input]:hover:border-orange-400 [&>div>div>input]:!bg-transparent'
                    style={{ backgroundColor: 'transparent' } as React.CSSProperties}
                    size='lg'
                    debounceMs={100}
                    maxSuggestions={6}
                    showRecentSearches={true}
                    showTrendingSearches={true}
                  />
                </div>
              </div>
            </div>

            {/* 3. Grupo de botones - Solo visible cuando search NO expandido en mobile */}
            {!isSearchExpanded && (
              <div className='flex items-center gap-3 sm:gap-4 flex-shrink-0'>
                
                {/* 3.1. Search Button - Circular */}
                <button
                  onClick={handleSearchClick}
                  className='w-12 h-12 min-w-[48px] rounded-full bg-[#fff3c5] border-2 border-orange-300 hover:border-orange-400 flex items-center justify-center transition-all duration-200 hover:scale-110 active:scale-95 shadow-md hover:shadow-lg sm:hidden'
                  aria-label='Buscar productos'
                >
                  <Search className='w-5 h-5 sm:w-6 sm:h-6 text-orange-500' strokeWidth={2.5} />
                </button>
                
                {/* 3.2. Carrito Button - Con texto (como estaba antes) */}
                <div className='relative flex-shrink-0'>
                  {/* Liquid Glass Background Effect */}
                  <div className='absolute inset-0 rounded-full bg-gradient-to-r from-yellow-400/80 via-yellow-300/60 to-yellow-500/80 backdrop-blur-xl border border-white/20 shadow-2xl' />
                  <div className='absolute inset-0 rounded-full bg-gradient-to-br from-white/30 via-transparent to-transparent' />
                  <div className='absolute inset-0 rounded-full bg-gradient-to-tl from-yellow-600/20 via-transparent to-white/10' />
                  
                  <button
                    onClick={handleCartClick}
                    className='relative bg-yellow-400/90 hover:bg-yellow-500/90 text-black font-bold h-12 px-2 sm:px-3 min-w-[90px] sm:min-w-[110px] rounded-full shadow-lg hover:shadow-xl transition-all duration-300 ease-in-out hover:scale-110 active:scale-95 border border-white/30 flex items-center gap-1 sm:gap-2 group floating-button focus-ring hover:rotate-3 hover:shadow-2xl backdrop-blur-md bg-gradient-to-r from-yellow-400/80 to-yellow-500/80'
                    aria-label='Ver carrito de compras'
                  >
                    <div className='relative'>
                      <OptimizedCartIcon
                        width={32}
                        height={32}
                        className='w-6 h-6 sm:w-8 sm:h-8 transition-transform duration-200 group-hover:scale-110 drop-shadow-lg'
                        alt='Carrito de compras'
                      />
                      {product.length > 0 && (
                        <span className='absolute -top-1 -right-1 text-xs font-bold rounded-full w-5 h-5 flex items-center justify-center shadow-lg transition-all duration-200 group-hover:scale-125 animate-pulse' style={{ backgroundColor: '#007639', color: '#fbbf24' }}>
                          {product.length > 99 ? '99+' : product.length}
                        </span>
                      )}
                    </div>
                    <span className='text-xs sm:text-sm font-semibold' style={{ color: '#ea5a17' }}>
                      Carrito
                    </span>
                  </button>
                </div>
                
                {/* 3.3. WhatsApp Button - Circular */}
                <div className='relative flex-shrink-0'>
                  {/* Liquid Glass Background Effect */}
                  <div className='absolute inset-0 rounded-full bg-gradient-to-r from-green-500/80 via-green-400/60 to-green-600/80 backdrop-blur-xl border border-white/20 shadow-2xl' />
                  <div className='absolute inset-0 rounded-full bg-gradient-to-br from-white/30 via-transparent to-transparent' />
                  <div className='absolute inset-0 rounded-full bg-gradient-to-tl from-green-700/20 via-transparent to-white/10' />
                  
                  <button
                    onClick={handleWhatsAppClick}
                    className='relative bg-green-500/90 hover:bg-green-600/90 text-white font-bold w-12 h-12 min-w-[48px] rounded-full shadow-lg hover:shadow-xl transition-all duration-300 ease-in-out hover:scale-110 active:scale-95 border border-white/30 flex items-center justify-center group floating-button focus-ring hover:rotate-6 hover:shadow-2xl backdrop-blur-md bg-gradient-to-r from-green-500/80 to-green-600/80'
                    aria-label='Contactar por WhatsApp'
                  >
                    <MessageCircle 
                      className='w-5 h-5 sm:w-6 sm:h-6 transition-transform duration-200 group-hover:scale-110 drop-shadow-lg' 
                      strokeWidth={2.5}
                    />
                    {/* Indicador de pulso */}
                    <span className='absolute -top-0.5 -right-0.5 flex h-2.5 w-2.5'>
                      <span className='animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75' />
                      <span className='relative inline-flex rounded-full h-2.5 w-2.5 bg-green-500' />
                    </span>
                  </button>
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
