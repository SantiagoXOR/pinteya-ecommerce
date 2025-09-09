// ===================================
// PINTEYA E-COMMERCE - HOOK DE CARRITO CON BACKEND
// ===================================
// Hook optimizado que conecta el carrito frontend con las APIs del backend

'use client';

import { useCallback, useEffect, useState } from 'react';
import { useSession } from 'next-auth/react';
import { toast } from 'sonner';

// Tipos para el carrito
interface CartProduct {
  id: number;
  name: string;
  price: number;
  discounted_price?: number;
  images?: any;
  stock: number;
  brand?: string;
  category?: {
    id: number;
    name: string;
  };
}

interface CartItem {
  id: string;
  user_id: string;
  product_id: number;
  quantity: number;
  created_at: string;
  updated_at: string;
  products: CartProduct;
}

interface CartState {
  items: CartItem[];
  totalItems: number;
  totalAmount: number;
  itemCount: number;
  loading: boolean;
  error: string | null;
}

interface UseCartWithBackendReturn extends CartState {
  addItem: (productId: number, quantity?: number) => Promise<boolean>;
  removeItem: (productId: number, quantity?: number) => Promise<boolean>;
  updateQuantity: (productId: number, quantity: number) => Promise<boolean>;
  clearCart: () => Promise<boolean>;
  loadCart: () => Promise<void>;
  getItemQuantity: (productId: number) => number;
  isInCart: (productId: number) => boolean;
  refreshCart: () => Promise<void>;
}

/**
 * Hook para manejar el carrito con integración completa al backend
 */
export const useCartWithBackend = (): UseCartWithBackendReturn => {
  const { data: session, status } = useSession();
  const [cartState, setCartState] = useState<CartState>({
    items: [],
    totalItems: 0,
    totalAmount: 0,
    itemCount: 0,
    loading: false,
    error: null
  });

  // Función para hacer requests a la API
  const apiRequest = useCallback(async (url: string, options: RequestInit = {}) => {
    try {
      const response = await fetch(url, {
        headers: {
          'Content-Type': 'application/json',
          ...options.headers
        },
        ...options
      });

      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.error || `HTTP ${response.status}`);
      }

      return data;
    } catch (error: any) {
      console.error(`API Error (${url}):`, error);
      throw error;
    }
  }, []);

  // Cargar carrito desde el backend
  const loadCart = useCallback(async () => {
    if (status === 'loading') return;
    
    if (!session?.user) {
      // Usuario no autenticado - carrito vacío
      setCartState(prev => ({
        ...prev,
        items: [],
        totalItems: 0,
        totalAmount: 0,
        itemCount: 0,
        loading: false,
        error: null
      }));
      return;
    }

    setCartState(prev => ({ ...prev, loading: true, error: null }));

    try {
      const data = await apiRequest('/api/cart');
      
      setCartState(prev => ({
        ...prev,
        items: data.items || [],
        totalItems: data.totalItems || 0,
        totalAmount: data.totalAmount || 0,
        itemCount: data.itemCount || 0,
        loading: false,
        error: null
      }));

      console.log('✅ Carrito cargado:', data.itemCount, 'productos únicos');
    } catch (error: any) {
      console.error('❌ Error cargando carrito:', error);
      setCartState(prev => ({
        ...prev,
        loading: false,
        error: error.message || 'Error cargando carrito'
      }));
    }
  }, [session, status, apiRequest]);

  // Agregar item al carrito
  const addItem = useCallback(async (productId: number, quantity: number = 1): Promise<boolean> => {
    if (!session?.user) {
      toast.error('Debes iniciar sesión para agregar productos al carrito');
      return false;
    }

    setCartState(prev => ({ ...prev, loading: true, error: null }));

    try {
      const data = await apiRequest('/api/cart/add', {
        method: 'POST',
        body: JSON.stringify({ productId, quantity })
      });

      if (data.success) {
        // Recargar carrito para obtener estado actualizado
        await loadCart();
        
        toast.success(data.message || 'Producto agregado al carrito');
        console.log('✅ Producto agregado:', data.item?.productName);
        return true;
      } else {
        throw new Error(data.error || 'Error agregando producto');
      }
    } catch (error: any) {
      console.error('❌ Error agregando al carrito:', error);
      setCartState(prev => ({ ...prev, loading: false, error: error.message }));
      
      if (error.message.includes('Stock insuficiente')) {
        toast.error(error.message);
      } else if (error.message.includes('autenticado')) {
        toast.error('Debes iniciar sesión para agregar productos');
      } else {
        toast.error('Error agregando producto al carrito');
      }
      
      return false;
    }
  }, [session, apiRequest, loadCart]);

  // Remover item del carrito
  const removeItem = useCallback(async (productId: number, quantity?: number): Promise<boolean> => {
    if (!session?.user) {
      toast.error('Debes iniciar sesión');
      return false;
    }

    setCartState(prev => ({ ...prev, loading: true, error: null }));

    try {
      const data = await apiRequest('/api/cart/remove', {
        method: 'DELETE',
        body: JSON.stringify({ productId, quantity })
      });

      if (data.success) {
        await loadCart();
        toast.success(data.message || 'Producto removido del carrito');
        console.log('✅ Producto removido:', data.item?.productName);
        return true;
      } else {
        throw new Error(data.error || 'Error removiendo producto');
      }
    } catch (error: any) {
      console.error('❌ Error removiendo del carrito:', error);
      setCartState(prev => ({ ...prev, loading: false, error: error.message }));
      toast.error('Error removiendo producto del carrito');
      return false;
    }
  }, [session, apiRequest, loadCart]);

  // Actualizar cantidad de un item
  const updateQuantity = useCallback(async (productId: number, quantity: number): Promise<boolean> => {
    if (!session?.user) {
      toast.error('Debes iniciar sesión');
      return false;
    }

    setCartState(prev => ({ ...prev, loading: true, error: null }));

    try {
      const data = await apiRequest('/api/cart/update', {
        method: 'PUT',
        body: JSON.stringify({ productId, quantity })
      });

      if (data.success) {
        await loadCart();
        toast.success(data.message || 'Cantidad actualizada');
        console.log('✅ Cantidad actualizada:', data.item?.productName);
        return true;
      } else {
        throw new Error(data.error || 'Error actualizando cantidad');
      }
    } catch (error: any) {
      console.error('❌ Error actualizando cantidad:', error);
      setCartState(prev => ({ ...prev, loading: false, error: error.message }));
      toast.error('Error actualizando cantidad');
      return false;
    }
  }, [session, apiRequest, loadCart]);

  // Limpiar carrito completo
  const clearCart = useCallback(async (): Promise<boolean> => {
    if (!session?.user) {
      toast.error('Debes iniciar sesión');
      return false;
    }

    setCartState(prev => ({ ...prev, loading: true, error: null }));

    try {
      const data = await apiRequest('/api/cart', {
        method: 'DELETE'
      });

      if (data.success) {
        await loadCart();
        toast.success('Carrito limpiado');
        console.log('✅ Carrito limpiado');
        return true;
      } else {
        throw new Error(data.error || 'Error limpiando carrito');
      }
    } catch (error: any) {
      console.error('❌ Error limpiando carrito:', error);
      setCartState(prev => ({ ...prev, loading: false, error: error.message }));
      toast.error('Error limpiando carrito');
      return false;
    }
  }, [session, apiRequest, loadCart]);

  // Obtener cantidad de un producto específico en el carrito
  const getItemQuantity = useCallback((productId: number): number => {
    const item = cartState.items.find(item => item.product_id === productId);
    return item?.quantity || 0;
  }, [cartState.items]);

  // Verificar si un producto está en el carrito
  const isInCart = useCallback((productId: number): boolean => {
    return cartState.items.some(item => item.product_id === productId);
  }, [cartState.items]);

  // Refrescar carrito (alias para loadCart)
  const refreshCart = useCallback(async () => {
    await loadCart();
  }, [loadCart]);

  // Cargar carrito al montar el componente o cuando cambie la sesión
  useEffect(() => {
    loadCart();
  }, [loadCart]);

  return {
    ...cartState,
    addItem,
    removeItem,
    updateQuantity,
    clearCart,
    loadCart,
    getItemQuantity,
    isInCart,
    refreshCart
  };
};

export default useCartWithBackend;
