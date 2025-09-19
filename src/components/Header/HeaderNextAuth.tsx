"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import Image from "next/image";
import { OptimizedCartIcon } from "@/components/ui/optimized-cart-icon";
import { useAppSelector } from "@/redux/store";
import { useSelector } from "react-redux";
import { selectTotalPrice } from "@/redux/features/cart-slice";
import { useCartModalContext } from "@/app/context/CartSidebarModalContext";
import { SearchAutocompleteIntegrated } from "@/components/ui/SearchAutocompleteIntegrated";
import { useCartAnimation } from "@/hooks/useCartAnimation";
import { MapPin, Loader2, ShoppingCart, LogIn } from "lucide-react";
import { useGeolocation } from "@/hooks/useGeolocation";
import { HeaderLogo } from "@/components/ui/OptimizedLogo";
import { UserAvatarDropdown, LoginButton } from "./UserAvatarDropdown";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";

const HeaderNextAuth = () => {
  const [cartShake, setCartShake] = useState(false);
  const [isSticky, setIsSticky] = useState(false);
  const [isScrollingUp, setIsScrollingUp] = useState(true);
  const [lastScrollY, setLastScrollY] = useState(0);
  const { openCartModal } = useCartModalContext();
  const { isAnimating } = useCartAnimation();
  const { isSignedIn } = useAuth();

  // Hook de geolocalización para detectar ubicación
  const { detectedZone, requestLocation, permissionStatus, isLoading, error, location, testLocation } = useGeolocation();

  // Selectors de Redux para el carrito con fallback
  const cartItems = useAppSelector((state) => state.cartReducer?.items || []);
  const totalPrice = useSelector(selectTotalPrice);
  const totalQuantity = cartItems.reduce((total, item) => total + item.quantity, 0);

  // Efecto para el comportamiento sticky del header
  useEffect(() => {
    const handleScroll = () => {
      const currentScrollY = window.scrollY;
      
      // Determinar si está haciendo scroll hacia arriba o abajo
      setIsScrollingUp(currentScrollY < lastScrollY || currentScrollY < 10);
      
      // Determinar si debe ser sticky
      setIsSticky(currentScrollY > 100);
      
      setLastScrollY(currentScrollY);
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, [lastScrollY]);

  // Efecto para animación del carrito
  useEffect(() => {
    if (isAnimating) {
      setCartShake(true);
      const timer = setTimeout(() => setCartShake(false), 600);
      return () => clearTimeout(timer);
    }
  }, [isAnimating]);

  // Función para manejar click en ubicación
  const handleLocationClick = () => {
    if (permissionStatus === 'prompt' || permissionStatus === 'denied') {
      requestLocation();
    }
  };

  // Función para formatear precio
  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('es-AR', {
      style: 'currency',
      currency: 'ARS',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(price);
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
        {/* Topbar con ubicación y promociones */}
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
                    <Loader2 className="w-3 h-3 animate-spin" />
                    Detectando...
                  </span>
                ) : detectedZone ? (
                  `Envíos en ${detectedZone}`
                ) : (
                  "Envíos en Córdoba Capital"
                )}
              </span>
            </div>

            <div className="text-yellow-400 font-light">|</div>

            {/* Envío gratis */}
            <div className="flex items-center gap-1" style={{ color: '#fff3c5' }}>
              <ShoppingCart className="w-3 h-3 text-yellow-400" />
              <span className="font-medium text-xs">Envío gratis desde $15.000</span>
            </div>

            <div className="hidden lg:block text-yellow-400 font-light">|</div>

            {/* Teléfono */}
            <div className="hidden lg:flex items-center gap-1" style={{ color: '#fff3c5' }}>
              <svg className="w-3 h-3 text-yellow-400" fill="currentColor" viewBox="0 0 20 20">
                <path d="M2 3a1 1 0 011-1h2.153a1 1 0 01.986.836l.74 4.435a1 1 0 01-.54 1.06l-1.548.773a11.037 11.037 0 006.105 6.105l.774-1.548a1 1 0 011.059-.54l4.435.774a1 1 0 01.836.986V17a1 1 0 01-1 1h-2C7.82 18 2 12.18 2 5V3z" />
              </svg>
              <span className="text-xs">+54 351 341 1796</span>
            </div>
          </div>
        </div>

        {/* Header principal */}
        <div className="max-w-[1200px] mx-auto px-2 sm:px-4 py-3">
          <div className="flex items-center justify-center gap-1 sm:gap-4 min-h-[60px]">
            {/* Logo */}
            <Link href="/" className="flex-shrink-0 group focus-ring">
              <HeaderLogo />
            </Link>

            {/* Buscador */}
            <div className="flex-1 mx-1 sm:mx-4 max-w-none sm:max-w-2xl flex items-center">
              <form className="relative w-full">
                <div 
                  className="flex items-center transition-all duration-300 hover:shadow-lg hover:scale-[1.02] search-focus-ring"
                  style={{ backgroundColor: '#fff3c5', borderRadius: '8px', padding: '1px' }}
                >
                  <SearchAutocompleteIntegrated
                    placeholder="latex interior blanco 20lts"
                    showTrendingSearches={true}
                  />
                </div>
              </form>
            </div>

            {/* Sección derecha - Autenticación y Carrito */}
            <div className="flex items-center gap-1 sm:gap-3">
              {/* Autenticación - Responsive */}
              <div className="hidden sm:block">
                {/* Desktop Auth */}
                {isSignedIn ? (
                  <UserAvatarDropdown />
                ) : (
                  <LoginButton />
                )}
              </div>

              <div className="sm:hidden">
                {/* Mobile Auth */}
                {isSignedIn ? (
                  <UserAvatarDropdown />
                ) : (
                  <Button
                    variant="outline"
                    size="sm"
                    asChild
                    className="border-white text-white hover:bg-white hover:text-blaze-orange-600 text-xs px-3 py-1"
                  >
                    <Link href="/api/auth/signin">
                      <LogIn className="w-4 h-4 mr-1" />
                      Iniciar Sesión
                    </Link>
                  </Button>
                )}
              </div>

              {/* Carrito */}
              <button
                onClick={openCartModal}
                className={`
                  hidden sm:flex relative bg-yellow-400 hover:bg-yellow-500 text-black font-bold px-2 py-1
                  rounded-full shadow-lg hover:shadow-xl transition-all duration-300 ease-in-out
                  transform hover:scale-110 active:scale-95 border-2 border-yellow-500 hover:border-yellow-600
                  items-center gap-2 group floating-button focus-ring
                  ${cartShake ? 'animate-bounce' : ''}
                  ${isAnimating ? 'scale-100' : 'scale-100'}
                  hover:rotate-3 hover:shadow-2xl
                `}
                data-testid="cart-icon"
              >
                <div className="relative">
                  <OptimizedCartIcon />
                  {totalQuantity > 0 && (
                    <span className="absolute -top-2 -right-2 bg-red-500 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center font-bold animate-pulse">
                      {totalQuantity}
                    </span>
                  )}
                </div>
                <span className="text-sm font-semibold text-blaze-orange-600" style={{ color: '#ea5a17' }}>
                  Carrito
                </span>
              </button>

              {/* Carrito Mobile */}
              <button
                onClick={openCartModal}
                className={`
                  sm:hidden relative bg-yellow-400 hover:bg-yellow-500 text-black font-bold p-2
                  rounded-full shadow-lg hover:shadow-xl transition-all duration-300 ease-in-out
                  transform hover:scale-110 active:scale-95 border-2 border-yellow-500 hover:border-yellow-600
                  floating-button focus-ring
                  ${cartShake ? 'animate-bounce' : ''}
                `}
                data-testid="cart-icon-mobile"
              >
                <div className="relative">
                  <OptimizedCartIcon />
                  {totalQuantity > 0 && (
                    <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full h-4 w-4 flex items-center justify-center font-bold animate-pulse">
                      {totalQuantity > 9 ? '9+' : totalQuantity}
                    </span>
                  )}
                </div>
              </button>
            </div>
          </div>
        </div>
      </header>
    </>
  );
};

export default HeaderNextAuth;









