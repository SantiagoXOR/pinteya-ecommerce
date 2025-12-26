'use client'
import React, { useState, useEffect, useCallback, useRef } from 'react'
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
import { cn } from '@/lib/core/utils'

// ⚡ PERFORMANCE: Memoizar SearchAutocomplete para evitar re-renders innecesarios
const MemoizedSearchAutocomplete = React.memo(SearchAutocompleteIntegrated)
import { useCartAnimation } from '@/hooks/useCartAnimation'
import { MapPin, Loader2, ShoppingCart, MessageCircle, Search, X } from '@/lib/optimized-imports'
import { useGeolocation } from '@/hooks/useGeolocation'
import { HeaderLogo } from '@/components/ui/OptimizedLogo'
import ScrollingBanner from './ScrollingBanner'
import { useDevicePerformance } from '@/hooks/useDevicePerformance'
import { useScrollActive } from '@/hooks/useScrollActive'
// import GeolocationDebugger from "./GeolocationDebugger"; // Componente de debugging desactivado

const Header = () => {
  const [cartShake, setCartShake] = useState(false)
  const [isSticky, setIsSticky] = useState(false)
  const [isScrollingUp, setIsScrollingUp] = useState(true)
  const [lastScrollY, setLastScrollY] = useState(0)
  const [isSearchExpanded, setIsSearchExpanded] = useState(false)
  const [isMounted, setIsMounted] = useState(false) // Para evitar hydration mismatch
  
  // ⚡ OPTIMIZACIÓN: Detectar nivel de rendimiento del dispositivo
  const performanceLevel = useDevicePerformance()
  const isLowPerformance = performanceLevel === 'low'
  const isMediumPerformance = performanceLevel === 'medium'
  
  // ⚡ OPTIMIZACIÓN: Detectar scroll activo para deshabilitar efectos costosos
  const { isScrolling } = useScrollActive()
  
  // #region agent log
  const cartModalContext = useCartModalContext()
  const { openCartModal } = cartModalContext
  React.useEffect(() => {
    const logData = {
      sessionId: 'debug-session',
      runId: 'run1',
      hypothesisId: 'E',
      location: 'Header.tsx:useCartModalContext',
      message: 'CartModalContext changed',
      data: {
        hasOpenCartModal: !!openCartModal,
        timestamp: Date.now()
      },
      timestamp: Date.now()
    }
    fetch('http://127.0.0.1:7242/ingest/b2bb30a6-4e88-4195-96cd-35106ab29a7d', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(logData)
    }).catch(() => {})
  }, [openCartModal])
  
  const cartAnimation = useCartAnimation()
  const { isAnimating } = cartAnimation
  React.useEffect(() => {
    const logData = {
      sessionId: 'debug-session',
      runId: 'run1',
      hypothesisId: 'F',
      location: 'Header.tsx:useCartAnimation',
      message: 'CartAnimation changed',
      data: {
        isAnimating,
        timestamp: Date.now()
      },
      timestamp: Date.now()
    }
    fetch('http://127.0.0.1:7242/ingest/b2bb30a6-4e88-4195-96cd-35106ab29a7d', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(logData)
    }).catch(() => {})
  }, [isAnimating])
  
  const auth = useAuth()
  const { isSignedIn } = auth
  React.useEffect(() => {
    const logData = {
      sessionId: 'debug-session',
      runId: 'run1',
      hypothesisId: 'G',
      location: 'Header.tsx:useAuth',
      message: 'Auth changed',
      data: {
        isSignedIn,
        timestamp: Date.now()
      },
      timestamp: Date.now()
    }
    fetch('http://127.0.0.1:7242/ingest/b2bb30a6-4e88-4195-96cd-35106ab29a7d', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(logData)
    }).catch(() => {})
  }, [isSignedIn])
  // #endregion

  // #region agent log
  const renderCountRef = useRef(0)
  const prevStateRef = useRef({ isSticky, isScrollingUp, isSearchExpanded, isMounted })
  
  useEffect(() => {
    renderCountRef.current += 1
    const prevState = prevStateRef.current
    
    // Solo loggear si el estado realmente cambió
    const stateChanged = 
      prevState.isSticky !== isSticky ||
      prevState.isScrollingUp !== isScrollingUp ||
      prevState.isSearchExpanded !== isSearchExpanded ||
      prevState.isMounted !== isMounted
    
    if (stateChanged || renderCountRef.current <= 5) {
      const logData = {
        sessionId: 'debug-session',
        runId: 'run1',
        hypothesisId: 'C',
        location: 'Header.tsx:render',
        message: 'Header rendered',
        data: {
          renderCount: renderCountRef.current,
          isSticky,
          isScrollingUp,
          isSearchExpanded,
          isMounted,
          stateChanged,
          timestamp: Date.now()
        },
        timestamp: Date.now()
      }
      fetch('http://127.0.0.1:7242/ingest/b2bb30a6-4e88-4195-96cd-35106ab29a7d', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(logData)
      }).catch(() => {})
      
      prevStateRef.current = { isSticky, isScrollingUp, isSearchExpanded, isMounted }
    }
  }, [isSticky, isScrollingUp, isSearchExpanded, isMounted])
  // #endregion

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

  // ⚡ PERFORMANCE: Sticky header logic optimizado con requestAnimationFrame y throttling
  // ⚡ FIX: Usar useRef para lastScrollY para evitar re-registrar el listener constantemente
  const lastScrollYRef = useRef(0)
  const lastUpdateTimeRef = useRef(0)
  
  useEffect(() => {
    let ticking = false
    let rafId: number | null = null
    const THROTTLE_MS = 16 // ~60fps, actualizar máximo cada 16ms

    const handleScroll = () => {
      if (!ticking) {
        rafId = window.requestAnimationFrame(() => {
          const now = performance.now()
          const timeSinceLastUpdate = now - lastUpdateTimeRef.current

          // ⚡ OPTIMIZACIÓN: Throttle adicional para evitar actualizaciones excesivas
          if (timeSinceLastUpdate >= THROTTLE_MS) {
            const currentScrollY = window.scrollY
            const prevScrollY = lastScrollYRef.current

            // Determinar si el header debe ser sticky
            const newIsSticky = currentScrollY > 100
            const newIsScrollingUp = currentScrollY < prevScrollY || currentScrollY < 10

            // Solo actualizar estado si realmente cambió
            setIsSticky(prev => prev !== newIsSticky ? newIsSticky : prev)
            setIsScrollingUp(prev => prev !== newIsScrollingUp ? newIsScrollingUp : prev)
            
            lastScrollYRef.current = currentScrollY
            lastUpdateTimeRef.current = now
          }

          ticking = false
          rafId = null
        })
        ticking = true
      }
    }

    window.addEventListener('scroll', handleScroll, { passive: true })
    return () => {
      window.removeEventListener('scroll', handleScroll)
      if (rafId !== null) {
        cancelAnimationFrame(rafId)
      }
    }
  }, []) // ⚡ FIX: Sin dependencias para evitar re-registrar el listener

  // Log para debugging del estado de geolocalización (solo cuando cambia la zona)
  useEffect(() => {}, [detectedZone?.name]) // Solo depender del nombre de la zona

  // Marcar como montado para evitar hydration mismatch
  useEffect(() => {
    setIsMounted(true)
  }, [])

  // Escuchar evento personalizado para hacer focus en el searchbar desde el bottom nav
  useEffect(() => {
    const handleFocusSearchbar = () => {
      setIsSearchExpanded(true)
      // Enfocar el input después de la animación
      setTimeout(() => {
        expandedSearchRef.current?.focus()
        expandedSearchRef.current?.click()
      }, 100)
    }

    window.addEventListener('focus-searchbar', handleFocusSearchbar as EventListener)
    return () => {
      window.removeEventListener('focus-searchbar', handleFocusSearchbar as EventListener)
    }
  }, [])

  // ⚡ FIX: Usar selectores memoizados con shallowEqual para evitar re-renders innecesarios
  const product = useAppSelector(state => state.cartReducer.items, (prev, next) => {
    if (prev.length !== next.length) return false
    // Solo re-renderizar si cambió la cantidad de items o sus IDs/cantidades
    return prev.every((item, index) => {
      const nextItem = next[index]
      return nextItem && item.id === nextItem.id && item.quantity === nextItem.quantity
    })
  })
  
  const totalPrice = useSelector(selectTotalPrice, (prev, next) => prev === next)

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

  // Ref para el input del search expandido
  const expandedSearchRef = useRef<HTMLInputElement>(null)

  // Handlers para expansión del searchbar en mobile
  const handleSearchClick = useCallback(() => {
    setIsSearchExpanded(true)
    // Enfocar el input después de la animación de expansión
    setTimeout(() => {
      expandedSearchRef.current?.focus()
      // Simular un clic para abrir el dropdown
      expandedSearchRef.current?.click()
    }, 100)
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
        fixed left-0 right-0 w-full z-header
        rounded-b-3xl
        header-sticky-transition
        ${isSticky ? 'glass-header-sticky' : 'glass-header'}
        ${isScrollingUp ? 'translate-y-0' : isSticky ? '-translate-y-2' : 'translate-y-0'}
        transition-all duration-300 ease-in-out
        max-w-full overflow-x-hidden overflow-y-visible
        safe-area-top
      `}
        style={{
          top: 'env(safe-area-inset-top, 0px)',
          boxShadow: '0px 4px 16px 0px rgba(0, 0, 0, 0.15)',
          // ⚡ OPTIMIZACIÓN: Deshabilitar backdrop-filter durante scroll y en dispositivos de bajo rendimiento
          backdropFilter: (isScrolling || isLowPerformance) ? 'none' : 'blur(2px)',
          WebkitBackdropFilter: (isScrolling || isLowPerformance) ? 'none' : 'blur(2px)',
        }}
      >
        {/* ScrollingBanner integrado en la parte superior del header */}
        <div className='w-full'>
          <ScrollingBanner />
        </div>
        {/* Header principal - Con expansión de búsqueda al hacer click */}
        {/* ⚡ FIX: Usar el mismo ancho que el bottom bar (max-w-md) en móvil, mismo ancho que BestSeller en desktop */}
        <div className='max-w-md md:max-w-[1170px] mx-auto px-3 sm:px-4 md:px-4 lg:px-8 xl:px-0 py-1.5 sm:py-2'>
          <div className='flex items-center justify-between md:justify-start gap-1 sm:gap-2 md:gap-12 min-h-[48px] sm:min-h-[52px]'>
            {/* 1. Logo - Ocultar cuando search está expandido */}
            {/* ⚡ FIX: Remover contenedor innecesario que causa el div rectangular */}
            <Link 
              href='/' 
              className={cn(
                'flex-shrink-0 transition-all duration-300',
                // ⚡ FIX: Solo ocultar en móvil cuando search está expandido, siempre visible en desktop
                isSearchExpanded ? 'hidden sm:flex' : 'flex',
                // ⚡ FIX: En desktop, sin margen izquierdo extra ya que usamos justify-start
                'ml-0 sm:ml-0 md:ml-0',
                // ⚡ FIX: Asegurar que el link no tenga padding/margin que cause el div rectangular
                'p-0 m-0 inline-flex items-center justify-center',
                // ⚡ FIX: Asegurar visibilidad del logo
                'relative z-10'
              )}
              style={{ 
                // ⚡ FIX: Asegurar que el contenedor se ajuste al contenido del logo
                width: 'auto',
                height: 'auto',
                minWidth: 'auto',
                minHeight: 'auto'
              }}
            >
              <HeaderLogo
                isMobile={false}
                className={cn(
                  // ⚡ FIX: Aumentar tamaño del logo para mejor visibilidad
                  'h-16 sm:h-20 md:h-24 lg:h-28 w-auto transition-all duration-300 ease-out',
                  'hover:scale-110 cursor-pointer',
                  isSticky ? 'logo-sticky-scale scale-95' : 'scale-100',
                  // ⚡ FIX: Asegurar que el logo sea visible y se ajuste correctamente
                  'object-contain block',
                  // ⚡ FIX: Asegurar visibilidad explícita
                  'opacity-100 visible'
                )}
                style={{
                  // ⚡ FIX: Aumentar dimensiones mínimas del logo
                  minHeight: '64px',
                  minWidth: '160px',
                }}
              />
            </Link>
            
            {/* 2. Search Expandido - Ocupa TODO el ancho cuando está activo */}
            {isSearchExpanded && (
              <div className='flex-1 animate-in fade-in zoom-in-95 duration-200'>
                <div className='relative w-full'>
                  <div
                    className='flex items-center transition-all duration-300 hover:shadow-md search-focus-ring glass-search-bar rounded-full'
                  >
                    <MemoizedSearchAutocomplete
                      ref={expandedSearchRef}
                      placeholder='Buscar productos...'
                      className='[&>div>div>input]:w-full [&>div>div>input]:border [&>div>div>input]:border-white/35 [&>div>div>input]:rounded-full [&>div>div>input]:pl-4 [&>div>div>input]:sm:pl-4 [&>div>div>input]:pr-10 [&>div>div>input]:py-0.5 [&>div>div>input]:sm:py-1 [&>div>div>input]:text-gray-600 [&>div>div>input]:dark:!text-gray-300 [&>div>div>input]:text-sm [&>div>div>input]:font-normal [&>div>div>input]:shadow-sm [&>div>div>input]:placeholder-gray-600 [&>div>div>input]:placeholder:text-xs [&>div>div>input]:placeholder:font-normal [&>div>div>input]:dark:placeholder-gray-300 [&>div>div>input]:dark:placeholder:text-xs [&>div>div>input]:dark:placeholder:font-normal [&>div>div>input]:focus:border-bright-sun-300/50 [&>div>div>input]:dark:focus:border-blaze-orange-500/50 [&>div>div>input]:focus:ring-1 [&>div>div>input]:focus:ring-bright-sun-200/30 [&>div>div>input]:dark:focus:ring-blaze-orange-500/30 [&>div>div>input]:transition-all [&>div>div>input]:duration-200 [&>div>div>input]:hover:border-bright-sun-300/40 [&>div>div>input]:dark:hover:border-blaze-orange-600/40'
                      style={{
                        '--input-bg': 'rgba(255, 255, 255, 0.3)',
                      } as React.CSSProperties & { '--input-bg'?: string }}
                      debounceMs={100}
                      maxSuggestions={6}
                      showRecentSearches={true}
                      showTrendingSearches={true}
                      autoFocus={true}
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
                className='flex-1 max-w-xl sm:max-w-2xl md:max-w-none md:flex-1 mx-2 sm:mx-4 md:mx-0 cursor-pointer'
                onClick={handleSearchClick}
              >
                <div className='relative w-full'>
                  <div
                    className='flex items-center transition-all duration-300 hover:shadow-md hover:scale-[1.02] active:scale-[0.98] search-focus-ring glass-search-bar rounded-full'
                  >
                    <MemoizedSearchAutocomplete
                      placeholder='Buscar productos...'
                      className='[&>div>div>input]:w-full [&>div>div>input]:border [&>div>div>input]:border-white/35 [&>div>div>input]:rounded-full [&>div>div>input]:pl-4 [&>div>div>input]:sm:pl-4 [&>div>div>input]:pr-10 [&>div>div>input]:py-0.5 [&>div>div>input]:sm:py-1 [&>div>div>input]:text-gray-600 [&>div>div>input]:dark:!text-gray-300 [&>div>div>input]:text-sm [&>div>div>input]:font-normal [&>div>div>input]:shadow-sm [&>div>div>input]:placeholder-gray-600 [&>div>div>input]:placeholder:text-xs [&>div>div>input]:placeholder:font-normal [&>div>div>input]:dark:placeholder-gray-300 [&>div>div>input]:dark:placeholder:text-xs [&>div>div>input]:dark:placeholder:font-normal [&>div>div>input]:focus:border-bright-sun-300/50 [&>div>div>input]:dark:focus:border-blaze-orange-500/50 [&>div>div>input]:focus:ring-1 [&>div>div>input]:focus:ring-bright-sun-200/30 [&>div>div>input]:dark:focus:ring-blaze-orange-500/30 [&>div>div>input]:transition-all [&>div>div>input]:duration-200 [&>div>div>input]:hover:border-bright-sun-300/40 [&>div>div>input]:dark:hover:border-blaze-orange-600/40'
                      style={{
                        '--input-bg': 'rgba(255, 255, 255, 0.3)',
                      } as React.CSSProperties & { '--input-bg'?: string }}
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
