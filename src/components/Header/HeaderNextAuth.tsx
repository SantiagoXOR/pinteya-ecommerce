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
                  <Link
                    href="/api/auth/signin"
                    className="w-10 h-10 bg-white rounded-full flex items-center justify-center shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-110 active:scale-95 border-2 border-white hover:border-yellow-400"
                  >
                    <svg className="w-5 h-5" viewBox="0 0 24 24">
                      <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                      <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                      <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                      <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                    </svg>
                  </Link>
                )}
              </div>


            </div>
          </div>
        </div>
      </header>
    </>
  );
};

export default HeaderNextAuth;









