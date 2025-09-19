// ===================================
// TESTS PARA HOOK DEL CARRITO
// Tests unitarios para useCart con Redux
// ===================================

import { renderHook, act } from '@testing-library/react';
import { Provider } from 'react-redux';
import { configureStore } from '@reduxjs/toolkit';
import { useCart } from '@/hooks/useCart';
import cartReducer from '@/redux/features/cart-slice';
import React from 'react';

// Wrapper para Redux
const createWrapper = () => {
  const store = configureStore({
    reducer: {
      cartReducer,
    },
  });
  
  return ({ children }: { children: React.ReactNode }) => (
    <Provider store={store}>{children}</Provider>
  );
};

// Datos de prueba
const mockCartItem = {
  id: 1,
  title: 'Producto Test',
  price: 100,
  discountedPrice: 100,
  quantity: 1,
  imgs: {
    thumbnails: ['https://example.com/thumb.jpg'],
    previews: ['https://example.com/preview.jpg']
  }
};

const mockCartItem2 = {
  id: 2,
  title: 'Producto Test 2',
  price: 200,
  discountedPrice: 200,
  quantity: 1,
  imgs: {
    thumbnails: ['https://example.com/thumb2.jpg'],
    previews: ['https://example.com/preview2.jpg']
  }
};

describe('useCart Hook', () => {
  describe('Inicialización del Carrito', () => {
    it('debe inicializar con carrito vacío', () => {
      const { result } = renderHook(() => useCart(), {
        wrapper: createWrapper()
      });

      expect(result.current.cartItems).toEqual([]);
      expect(result.current.cartCount).toBe(0);
      expect(result.current.totalPrice).toBe(0);
      expect(result.current.totalQuantity).toBe(0);
    });
  });

  describe('Agregar Productos', () => {
    it('debe agregar un producto nuevo al carrito', () => {
      const { result } = renderHook(() => useCart(), {
        wrapper: createWrapper()
      });

      act(() => {
        result.current.addToCart(mockCartItem);
      });

      expect(result.current.cartItems).toHaveLength(1);
      expect(result.current.cartItems[0]).toEqual(mockCartItem);
      expect(result.current.cartCount).toBe(1);
      expect(result.current.totalPrice).toBe(100);
      expect(result.current.totalQuantity).toBe(1);
    });

    it('debe incrementar cantidad si el producto ya existe', () => {
      const { result } = renderHook(() => useCart(), {
        wrapper: createWrapper()
      });

      act(() => {
        result.current.addToCart(mockCartItem);
      });

      act(() => {
        result.current.addToCart(mockCartItem);
      });

      expect(result.current.cartItems).toHaveLength(1);
      expect(result.current.cartItems[0].quantity).toBe(2);
      expect(result.current.cartCount).toBe(1);
      expect(result.current.totalQuantity).toBe(2);
      expect(result.current.totalPrice).toBe(200);
    });

    it('debe agregar múltiples productos diferentes', () => {
      const { result } = renderHook(() => useCart(), {
        wrapper: createWrapper()
      });

      act(() => {
        result.current.addToCart(mockCartItem);
      });

      act(() => {
        result.current.addToCart(mockCartItem2);
      });

      expect(result.current.cartItems).toHaveLength(2);
      expect(result.current.cartCount).toBe(2);
      expect(result.current.totalQuantity).toBe(2);
      expect(result.current.totalPrice).toBe(300);
    });
  });

  describe('Remover Productos', () => {
    it('debe remover un producto del carrito', () => {
      const { result } = renderHook(() => useCart(), {
        wrapper: createWrapper()
      });

      // Agregar producto primero
      act(() => {
        result.current.addToCart(mockCartItem);
      });

      // Remover producto
      act(() => {
        result.current.removeFromCart(mockCartItem.id);
      });

      expect(result.current.cartItems).toHaveLength(0);
      expect(result.current.cartCount).toBe(0);
      expect(result.current.totalPrice).toBe(0);
      expect(result.current.totalQuantity).toBe(0);
    });

    it('debe remover solo el producto especificado', () => {
      const { result } = renderHook(() => useCart(), {
        wrapper: createWrapper()
      });

      // Agregar dos productos
      act(() => {
        result.current.addToCart(mockCartItem);
        result.current.addToCart(mockCartItem2);
      });

      // Remover solo el primero
      act(() => {
        result.current.removeFromCart(mockCartItem.id);
      });

      expect(result.current.cartItems).toHaveLength(1);
      expect(result.current.cartItems[0].id).toBe(mockCartItem2.id);
      expect(result.current.totalPrice).toBe(200);
    });
  });

  describe('Actualizar Cantidad', () => {
    it('debe actualizar la cantidad de un producto', () => {
      const { result } = renderHook(() => useCart(), {
        wrapper: createWrapper()
      });

      // Agregar producto
      act(() => {
        result.current.addToCart(mockCartItem);
      });

      // Actualizar cantidad
      act(() => {
        result.current.updateQuantity(mockCartItem.id, 3);
      });

      expect(result.current.cartItems[0].quantity).toBe(3);
      expect(result.current.totalQuantity).toBe(3);
      expect(result.current.totalPrice).toBe(300);
    });

    it('debe remover el producto si la cantidad es 0', () => {
      const { result } = renderHook(() => useCart(), {
        wrapper: createWrapper()
      });

      // Agregar producto
      act(() => {
        result.current.addToCart(mockCartItem);
      });

      // Actualizar cantidad a 0
      act(() => {
        result.current.updateQuantity(mockCartItem.id, 0);
      });

      expect(result.current.cartItems).toHaveLength(0);
      expect(result.current.totalPrice).toBe(0);
    });
  });

  describe('Limpiar Carrito', () => {
    it('debe limpiar todo el carrito', () => {
      const { result } = renderHook(() => useCart(), {
        wrapper: createWrapper()
      });

      // Agregar productos
      act(() => {
        result.current.addToCart(mockCartItem);
        result.current.addToCart(mockCartItem2);
      });

      // Limpiar carrito
      act(() => {
        result.current.clearCart();
      });

      expect(result.current.cartItems).toHaveLength(0);
      expect(result.current.cartCount).toBe(0);
      expect(result.current.totalPrice).toBe(0);
      expect(result.current.totalQuantity).toBe(0);
    });
  });

  describe('Cálculos del Carrito', () => {
    it('debe calcular correctamente el precio total', () => {
      const { result } = renderHook(() => useCart(), {
        wrapper: createWrapper()
      });

      act(() => {
        result.current.addToCart(mockCartItem);
        result.current.addToCart(mockCartItem2);
        result.current.updateQuantity(mockCartItem.id, 2);
      });

      expect(result.current.totalPrice).toBe(400); // (100 * 2) + (200 * 1)
      expect(result.current.totalQuantity).toBe(3); // 2 + 1
      expect(result.current.cartCount).toBe(2); // 2 productos únicos
    });

    it('debe manejar productos con precio 0', () => {
      const freeItem = { ...mockCartItem, price: 0 };
      const { result } = renderHook(() => useCart(), {
        wrapper: createWrapper()
      });

      act(() => {
        result.current.addToCart(freeItem);
      });

      expect(result.current.totalPrice).toBe(0);
      expect(result.current.cartItems).toHaveLength(1);
    });
  });
});









