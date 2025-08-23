"use client";
import React, { useState, useEffect } from "react";
import Link from "next/link";
import Image from "next/image";
import { OptimizedCartIcon } from "@/components/ui/optimized-cart-icon";
import { useAppSelector } from "@/redux/store";
import { useSelector } from "react-redux";
import { selectTotalPrice } from "@/redux/features/cart-slice";
import { useCartModalContext } from "@/app/context/CartSidebarModalContext";
import AuthSectionSimple from "./AuthSectionSimple";
import { SearchAutocompleteIntegrated } from "@/components/ui/SearchAutocompleteIntegrated";
import { useCartAnimation } from "@/hooks/useCartAnimation";
import { MapPin, Loader2, ShoppingCart } from "lucide-react";
import { useGeolocation } from "@/hooks/useGeolocation";
import { HeaderLogo } from "@/components/ui/OptimizedLogo";
// import GeolocationDebugger from "./GeolocationDebugger"; // Componente de debugging desactivado

const Header = () => {
  const [cartShake, setCartShake] = useState(false);
  const [isSticky, setIsSticky] = useState(false);
  const [isScrollingUp, setIsScrollingUp] = useState(true);
  const [lastScrollY, setLastScrollY] = useState(0);
  const { openCartModal } = useCartModalContext();
  const { isAnimating } = useCartAnimation();

  // Hook de geolocalización para detectar ubicación
  const { detectedZone, requestLocation, permissionStatus, isLoading, error, location, testLocation } = useGeolocation();

  // Sticky header logic con detección de dirección de scroll
  useEffect(() => {
    const handleScroll = () => {
      const currentScrollY = window.scrollY;

      // Determinar si el header debe ser sticky
      setIsSticky(currentScrollY > 100);

      // Determinar dirección del scroll para animaciones
      setIsScrollingUp(currentScrollY < lastScrollY || currentScrollY < 10);
      setLastScrollY(currentScrollY);
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, [lastScrollY]);

  // Log para debugging del estado de geolocalización (solo cuando cambia la zona)
  useEffect(() => {
  }, [detectedZone?.name]); // Solo depender del nombre de la zona

  const product = useAppSelector((state) => state.cartReducer.items);
  const totalPrice = useSelector(selectTotalPrice);

  // Efecto para animar el carrito cuando se agregan productos
  useEffect(() => {
    if (product.length > 0) {
      setCartShake(true);
      setTimeout(() => setCartShake(false), 500);
    }
  }, [product.length]);

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

  const handleOpenCartModal = () => {
    openCartModal();
  };

  const handleLocationClick = () => {

    // Siempre intentar solicitar ubicación cuando se hace click
    if (permissionStatus === 'denied') {
      alert('Para detectar tu ubicación automáticamente, permite el acceso a la ubicación en la configuración de tu navegador.');
    } else if (permissionStatus === 'granted' && detectedZone && detectedZone.name !== "Córdoba Capital") {
      requestLocation();
    } else {
      requestLocation();
    }

  };

  const handleSearchSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    // El SearchAutocomplete maneja su propia lógica de búsqueda
    // Este handler previene el comportamiento por defecto del form
  };

  return (
    <>
      <header className={`
        fixed left-0 top-0 w-full z-header
        bg-blaze-orange-600 rounded-b-3xl shadow-lg
        header-sticky-transition
        ${isSticky ? 'shadow-2xl backdrop-blur-sm' : 'shadow-lg'}
        ${isScrollingUp ? 'translate-y-0' : isSticky ? '-translate-y-2' : 'translate-y-0'}
        transition-all duration-300 ease-in-out
      `}>
        {/* Topbar con ubicación y promociones - Estilo ML */}
        <div className="bg-blaze-orange-700 py-1">
          <div className="max-w-[1200px] mx-auto px-4 flex items-center justify-center text-xs min-h-[24px] gap-6">
            {/* Ubicación compacta */}
            <div
              onClick={handleLocationClick}
              className="flex items-center gap-1 cursor-pointer transition-all duration-200 hover:scale-105 hover:text-yellow-300 group"
              style={{ color: '#fff3c5' }}
            >
              <MapPin className="w-3 h-3 text-yellow-400 transition-all duration-200 group-hover:scale-110 group-hover:text-yellow-300" />
              <span className="font-medium text-xs transition-colors duration-200">
                {isLoading ? (
                  <span className="flex items-center gap-1">
                    <Loader2 className="w-3 h-3 animate-spin text-yellow-400" />
                    <span className="animate-pulse">Detectando...</span>
                  </span>
                ) : (
                  `Envíos en ${detectedZone?.name || "Córdoba Capital"}`
                )}
              </span>
            </div>

            {/* Separador */}
            <div className="text-yellow-400 font-light">|</div>

            {/* Promoción central */}
            <div className="flex items-center gap-1" style={{ color: '#fff3c5' }}>
              <svg className="w-3 h-3 text-yellow-400" fill="currentColor" viewBox="0 0 20 20">
                <path d="M8 16.5a1.5 1.5 0 11-3 0 1.5 1.5 0 013 0zM15 16.5a1.5 1.5 0 11-3 0 1.5 1.5 0 013 0z"/>
                <path d="M3 4a1 1 0 00-1 1v1a1 1 0 001 1h1l1.68 5.39A3 3 0 008.62 15h5.76a3 3 0 002.94-2.61L18 7H6.41l-.77-3H3z"/>
              </svg>
              <span className="font-medium text-xs">Envío gratis desde $15.000</span>
            </div>

            {/* Separador */}
            <div className="hidden lg:block text-yellow-400 font-light">|</div>

            {/* Contacto compacto */}
            <div className="hidden lg:flex items-center gap-1" style={{ color: '#fff3c5' }}>
              <svg className="w-3 h-3 text-yellow-400" fill="currentColor" viewBox="0 0 20 20">
                <path d="M2 3a1 1 0 011-1h2.153a1 1 0 01.986.836l.74 4.435a1 1 0 01-.54 1.06l-1.548.773a11.037 11.037 0 006.105 6.105l.774-1.548a1 1 0 011.059-.54l4.435.74a1 1 0 01.836.986V17a1 1 0 01-1 1h-2C7.82 18 2 12.18 2 5V3z"/>
              </svg>
              <span className="text-xs">+54 351 341 1796</span>
            </div>
          </div>
        </div>

        {/* Header principal - Layout optimizado mobile-first */}
        <div className="max-w-[1200px] mx-auto px-2 sm:px-4 py-3">
          <div className="flex items-center justify-center gap-1 sm:gap-4 min-h-[60px]">
            {/* Logo compacto - Optimizado para mobile */}
            <Link href="/" className="flex-shrink-0 group focus-ring">
              <HeaderLogo
                isMobile={false}
                className={`
                  hidden sm:block w-28 h-auto transition-all duration-300 ease-out
                  group-hover:scale-110 group-hover:drop-shadow-lg
                  ${isSticky ? 'logo-sticky-scale scale-95' : 'scale-100'}
                `}
              />
              <HeaderLogo
                isMobile={true}
                className={`
                  sm:hidden w-12 h-auto transition-all duration-300 ease-out
                  group-hover:scale-110 group-hover:drop-shadow-lg
                  ${isSticky ? 'logo-sticky-scale scale-90' : 'scale-100'}
                `}
              />
            </Link>

            {/* Buscador expandido - Máximo espacio en mobile */}
            <div className="flex-1 mx-1 sm:mx-4 max-w-none sm:max-w-2xl flex items-center">
              <form onSubmit={handleSearchSubmit} className="relative w-full">
                <div style={{ backgroundColor: '#fff3c5', borderRadius: '8px', padding: '1px' }} className="flex items-center transition-all duration-300 hover:shadow-lg hover:scale-[1.02] search-focus-ring">
                  <SearchAutocompleteIntegrated
                    placeholder="Buscar productos..."
                    className="[&>div>div>input]:w-full [&>div>div>input]:border-2 [&>div>div>input]:border-orange-300 [&>div>div>input]:rounded-lg [&>div>div>input]:pl-4 [&>div>div>input]:pr-12 [&>div>div>input]:py-2.5 [&>div>div>input]:text-blaze-orange-600 [&>div>div>input]:text-sm [&>div>div>input]:sm:text-base [&>div>div>input]:font-medium [&>div>div>input]:shadow-sm [&>div>div>input]:focus:border-orange-500 [&>div>div>input]:focus:ring-2 [&>div>div>input]:focus:ring-orange-200 [&>div>div>input]:transition-all [&>div>div>input]:duration-300 [&>div>div>input]:hover:border-orange-400 [&>div>div>input]:!bg-transparent"
                    style={{
                      backgroundColor: 'transparent'
                    } as React.CSSProperties}
                    size="lg"
                    debounceMs={100}
                    maxSuggestions={6}
                    showRecentSearches={true}
                    showTrendingSearches={true}
                  />
                </div>
              </form>
            </div>

            {/* Sección derecha - Solo autenticación en mobile */}
            <div className="flex items-center gap-1 sm:gap-3">
              {/* Autenticación - Responsive */}
              <div className="hidden sm:block">
                <AuthSectionSimple variant="desktop" />
              </div>
              <div className="sm:hidden">
                <AuthSectionSimple variant="mobile" />
              </div>

              {/* Carrito - Solo visible en desktop */}
              <button
                onClick={handleOpenCartModal}
                data-testid="cart-icon"
                className={`
                  hidden sm:flex relative bg-yellow-400 hover:bg-yellow-500 text-black font-bold px-2 py-1
                  rounded-full shadow-lg hover:shadow-xl transition-all duration-300 ease-in-out
                  transform hover:scale-110 active:scale-95 border-2 border-yellow-500 hover:border-yellow-600
                  items-center gap-2 group floating-button focus-ring
                  ${cartShake ? 'animate-bounce cart-badge-animate' : ''}
                  ${isAnimating ? 'scale-110 cart-badge-animate' : 'scale-100'}
                  hover:rotate-3 hover:shadow-2xl
                `}
              >
                <div className="relative">
                  <OptimizedCartIcon
                    width={32}
                    height={32}
                    className="w-8 h-8 transition-transform duration-200 group-hover:scale-110"
                    alt="Carrito de compras"
                  />
                  {product.length > 0 && (
                    <span
                      className="absolute -top-1 -right-1 text-xs font-bold rounded-full w-5 h-5 flex items-center justify-center z-badge shadow-lg transition-all duration-200 group-hover:scale-125 animate-pulse"
                      style={{ backgroundColor: '#007639', color: '#fbbf24' }}
                    >
                      {product.length > 99 ? '99+' : product.length}
                    </span>
                  )}
                </div>
                <span className="text-sm font-semibold text-blaze-orange-600" style={{ color: '#ea5a17' }}>Carrito</span>
              </button>
            </div>
          </div>
        </div>
      </header>
    </>
  );
};

export default Header;
