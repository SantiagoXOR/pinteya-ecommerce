// ===================================
// PINTEYA E-COMMERCE - CART PERSISTENCE PROVIDER
// ===================================

"use client";

import React, { useEffect } from 'react';
import { useAppDispatch, useAppSelector } from '@/redux/store';
import { selectCartItems, hydrateCart } from '@/redux/features/cart-slice';
import { loadCartFromStorage } from '@/redux/middleware/cartPersistence';

interface CartPersistenceProviderProps {
  children: React.ReactNode;
}

// Provider simplificado para manejar la persistencia del carrito
export const CartPersistenceProvider: React.FC<CartPersistenceProviderProps> = ({
  children
}) => {
  const dispatch = useAppDispatch();
  const cartItems = useAppSelector(selectCartItems);

  // Efecto para cargar carrito desde localStorage SOLO al inicializar
  useEffect(() => {
    // Solo ejecutar en el cliente
    if (typeof window === 'undefined') return;

    try {
      const persistedItems = loadCartFromStorage();
      if (persistedItems.length > 0 && cartItems.length === 0) {
        dispatch(hydrateCart(persistedItems));

        // Log para debugging (remover en producción)
        if (process.env.NODE_ENV === 'development') {
          console.log('Cart hydrated from localStorage:', persistedItems.length, 'items');
        }
      }
    } catch (error) {
      console.warn('Error loading cart from localStorage:', error);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [dispatch]); // Removido cartItems.length para evitar rehidratación no deseada

  return <>{children}</>;
};

export default CartPersistenceProvider;
