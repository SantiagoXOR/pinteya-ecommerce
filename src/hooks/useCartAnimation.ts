"use client";

import { useState, useCallback } from 'react';
import { useCartModalContext } from '@/app/context/CartSidebarModalContext';

export interface CartAnimationOptions {
  showSuccessMessage?: boolean;
  autoOpenCart?: boolean;
  animationDuration?: number;
}

export const useCartAnimation = (options: CartAnimationOptions = {}) => {
  const {
    showSuccessMessage = true,
    autoOpenCart = false,
    animationDuration = 1000,
  } = options;

  const [isAnimating, setIsAnimating] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const { openCartModal } = useCartModalContext();

  const triggerCartAnimation = useCallback(async () => {
    setIsAnimating(true);
    
    // Mostrar animación de éxito si está habilitada
    if (showSuccessMessage) {
      setTimeout(() => {
        setShowSuccess(true);
      }, 200);
    }

    // Abrir carrito automáticamente si está habilitado
    if (autoOpenCart) {
      setTimeout(() => {
        openCartModal();
      }, 600);
    }

    // Resetear estados después de la animación
    setTimeout(() => {
      setIsAnimating(false);
      setShowSuccess(false);
    }, animationDuration);

  }, [showSuccessMessage, autoOpenCart, animationDuration, openCartModal]);

  return {
    isAnimating,
    showSuccess,
    triggerCartAnimation,
  };
};

// Hook para animaciones de productos específicas
export const useProductAnimation = () => {
  const [animatingProducts, setAnimatingProducts] = useState<Set<string>>(new Set());

  const animateProduct = useCallback((productId: string, duration = 1000) => {
    setAnimatingProducts(prev => new Set(prev).add(productId));
    
    setTimeout(() => {
      setAnimatingProducts(prev => {
        const newSet = new Set(prev);
        newSet.delete(productId);
        return newSet;
      });
    }, duration);
  }, []);

  const isProductAnimating = useCallback((productId: string) => {
    return animatingProducts.has(productId);
  }, [animatingProducts]);

  return {
    animateProduct,
    isProductAnimating,
  };
};

// Tipos para la notificación del carrito
export interface CartNotificationData {
  show: boolean;
  productName?: string;
  productImage?: string;
}

// Constantes para las animaciones
export const ANIMATION_DURATIONS = {
  CART_SHAKE: 500,
  NOTIFICATION: 4000,
  BUTTON_ANIMATION: 1000,
} as const;









