// ===================================
// PINTEYA E-COMMERCE - CART HOOK WITH CLERK INTEGRATION
// ===================================

import { useEffect, useCallback } from 'react';
import { useAuth } from './useAuth';
import { useAppDispatch, useAppSelector } from '@/redux/store';
import { 
  selectCartItems, 
  hydrateCart, 
  replaceCart,
  removeAllItemsFromCart 
} from '@/redux/features/cart-slice';
import { 
  loadCartFromStorage, 
  clearCartFromStorage,
  migrateTemporaryCart,
  loadUserCart,
  saveUserCart 
} from '@/redux/middleware/cartPersistence';

// Hook personalizado para manejar el carrito con integración NextAuth
export const useCartWithClerk = () => {
  const { user, isLoaded } = useAuth();
  const dispatch = useAppDispatch();
  const cartItems = useAppSelector(selectCartItems);

  // Función para migrar carrito temporal a usuario autenticado
  const migrateCart = useCallback(async (userId: string) => {
    try {
      // Obtener items del localStorage
      const temporaryItems = loadCartFromStorage();
      
      if (temporaryItems.length > 0) {
        
        // Migrar items al backend (implementación futura)
        const migrationSuccess = await migrateTemporaryCart(temporaryItems, userId);
        
        if (migrationSuccess) {
          // Limpiar localStorage después de migración exitosa
          clearCartFromStorage();
        }
      }
      
      // Cargar carrito del usuario desde el backend (implementación futura)
      const userCartItems = await loadUserCart(userId);
      
      // Si hay items del usuario, reemplazar el carrito actual
      if (userCartItems.length > 0) {
        dispatch(replaceCart(userCartItems));
      }
      
    } catch (error) {
      console.error('Error during cart migration:', error);
    }
  }, [dispatch]);

  // Función para guardar carrito del usuario autenticado
  const saveCart = useCallback(async (userId: string) => {
    try {
      if (cartItems.length > 0) {
        await saveUserCart(userId, cartItems);
      }
    } catch (error) {
      console.error('Error saving user cart:', error);
    }
  }, [cartItems]);

  // Efecto para manejar cambios en el estado de autenticación
  useEffect(() => {
    console.log('[useCartWithClerk] 🚫 TEMPORALMENTE DESHABILITADO PARA EVITAR RECURSIÓN');
    return;

    // CÓDIGO COMENTADO TEMPORALMENTE
    // if (!isLoaded) return;

    // if (user) {
    //   // Usuario autenticado - migrar carrito temporal si existe
    //   migrateCart(user.id);
    // } else {
    //   // Usuario no autenticado - cargar desde localStorage
    //   const persistedItems = loadCartFromStorage();
    //   if (persistedItems.length > 0) {
    //     dispatch(hydrateCart(persistedItems));
    //   }
    // }
  }, [user, isLoaded, dispatch, migrateCart]);

  // Efecto para guardar carrito de usuario autenticado cuando cambie
  useEffect(() => {
    console.log('[useCartWithClerk] 🚫 SAVE CART TEMPORALMENTE DESHABILITADO PARA EVITAR RECURSIÓN');
    return;

    // CÓDIGO COMENTADO TEMPORALMENTE
    // if (!isLoaded || !user) return;

    // // Debounce para evitar guardados excesivos
    // const timeoutId = setTimeout(() => {
    //   saveCart(user.id);
    // }, 1000);

    // return () => clearTimeout(timeoutId);
  }, [cartItems, user, isLoaded, saveCart]);

  // Función para limpiar carrito al cerrar sesión
  const handleSignOut = useCallback(() => {
    dispatch(removeAllItemsFromCart());
    clearCartFromStorage();
  }, [dispatch]);

  return {
    isAuthenticated: !!user,
    userId: user?.id,
    cartItems,
    migrateCart,
    saveCart,
    handleSignOut,
  };
};

// Hook simplificado para componentes que solo necesitan el estado del carrito
export const useCart = () => {
  const cartItems = useAppSelector(selectCartItems);
  const dispatch = useAppDispatch();

  return {
    cartItems,
    dispatch,
  };
};
