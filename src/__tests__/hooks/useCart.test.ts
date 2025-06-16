// ===================================
// PINTEYA E-COMMERCE - TESTS PARA USECART HOOK
// ===================================

import React from 'react';
import { renderHook, act } from '@testing-library/react';
import { Provider } from 'react-redux';
import { configureStore } from '@reduxjs/toolkit';
import cartReducer, {
  addItemToCart,
  removeItemFromCart,
  updateCartItemQuantity,
  removeAllItemsFromCart,
  selectCartItems,
  selectTotalPrice
} from '@/redux/features/cart-slice';
import { useAppSelector, useAppDispatch } from '@/redux/store';

// Selector personalizado para contar items del carrito
const selectCartCount = (state: any) => state.cartReducer.items.length;

// Mock del hook personalizado useCart
const useCart = () => {
  const dispatch = useAppDispatch();
  const cartItems = useAppSelector(selectCartItems);
  const totalPrice = useAppSelector(selectTotalPrice);
  const cartCount = useAppSelector(selectCartCount);

  const addToCart = (item: any) => {
    dispatch(addItemToCart(item));
  };

  const removeFromCart = (id: number) => {
    dispatch(removeItemFromCart(id));
  };

  const updateQuantity = (id: number, quantity: number) => {
    dispatch(updateCartItemQuantity({ id, quantity }));
  };

  const clearCart = () => {
    dispatch(removeAllItemsFromCart());
  };

  return {
    cartItems,
    totalPrice,
    cartCount,
    addToCart,
    removeFromCart,
    updateQuantity,
    clearCart,
  };
};

// Producto de prueba
const mockProduct = {
  id: 1,
  title: 'Pintura Latex Interior Blanco 4L',
  price: 18000,
  discountedPrice: 15000,
  quantity: 1,
  imgs: {
    thumbnails: ['/images/products/pintura-latex-blanco-sm.jpg'],
    previews: ['/images/products/pintura-latex-blanco.jpg'],
  },
};

// Función helper para renderizar hook con Redux store
const renderHookWithStore = (initialState = {}) => {
  const store = configureStore({
    reducer: {
      cartReducer,
    },
    preloadedState: initialState,
  });

  const wrapper = ({ children }: { children: React.ReactNode }) => (
    React.createElement(Provider, { store }, children)
  );

  return {
    ...renderHook(() => useCart(), { wrapper }),
    store,
  };
};

describe('useCart Hook', () => {
  it('should initialize with empty cart', () => {
    const { result } = renderHookWithStore();

    expect(result.current.cartItems).toEqual([]);
    expect(result.current.totalPrice).toBe(0);
    expect(result.current.cartCount).toBe(0);
  });

  it('should add item to cart', () => {
    const { result } = renderHookWithStore();

    act(() => {
      result.current.addToCart(mockProduct);
    });

    expect(result.current.cartItems).toHaveLength(1);
    expect(result.current.cartItems[0].id).toBe(mockProduct.id);
    expect(result.current.cartItems[0].quantity).toBe(1);
    expect(result.current.cartCount).toBe(1);
  });

  it('should increase quantity when adding existing item', () => {
    const initialState = {
      cartReducer: {
        items: [mockProduct],
      },
    };

    const { result } = renderHookWithStore(initialState);

    act(() => {
      result.current.addToCart(mockProduct);
    });

    expect(result.current.cartItems).toHaveLength(1);
    expect(result.current.cartItems[0].quantity).toBe(2);
    expect(result.current.cartCount).toBe(1); // Número de productos únicos
  });

  it('should remove item from cart', () => {
    const initialState = {
      cartReducer: {
        items: [mockProduct],
      },
    };

    const { result } = renderHookWithStore(initialState);

    act(() => {
      result.current.removeFromCart(mockProduct.id);
    });

    expect(result.current.cartItems).toHaveLength(0);
    expect(result.current.cartCount).toBe(0);
    expect(result.current.totalPrice).toBe(0);
  });

  it('should update item quantity', () => {
    const initialState = {
      cartReducer: {
        items: [mockProduct],
      },
    };

    const { result } = renderHookWithStore(initialState);

    act(() => {
      result.current.updateQuantity(mockProduct.id, 3);
    });

    expect(result.current.cartItems[0].quantity).toBe(3);
  });

  it('should set item quantity to 0 (but not remove from cart)', () => {
    const initialState = {
      cartReducer: {
        items: [mockProduct],
      },
    };

    const { result } = renderHookWithStore(initialState);

    act(() => {
      result.current.updateQuantity(mockProduct.id, 0);
    });

    // El reducer actual no elimina automáticamente items con cantidad 0
    expect(result.current.cartItems).toHaveLength(1);
    expect(result.current.cartItems[0].quantity).toBe(0);
  });

  it('should clear entire cart', () => {
    const initialState = {
      cartReducer: {
        items: [
          mockProduct,
          { ...mockProduct, id: 2, title: 'Otro producto' },
        ],
      },
    };

    const { result } = renderHookWithStore(initialState);

    act(() => {
      result.current.clearCart();
    });

    expect(result.current.cartItems).toHaveLength(0);
    expect(result.current.cartCount).toBe(0);
    expect(result.current.totalPrice).toBe(0);
  });

  it('should calculate total price correctly', () => {
    const product1 = { ...mockProduct, quantity: 2 }; // 15000 * 2 = 30000
    const product2 = { ...mockProduct, id: 2, discountedPrice: 10000, quantity: 1 }; // 10000 * 1 = 10000

    const initialState = {
      cartReducer: {
        items: [product1, product2],
      },
    };

    const { result } = renderHookWithStore(initialState);

    expect(result.current.totalPrice).toBe(40000); // 30000 + 10000
  });

  it('should handle multiple different products', () => {
    const { result } = renderHookWithStore();

    const product1 = mockProduct;
    const product2 = { ...mockProduct, id: 2, title: 'Esmalte Azul' };
    const product3 = { ...mockProduct, id: 3, title: 'Barniz Transparente' };

    act(() => {
      result.current.addToCart(product1);
      result.current.addToCart(product2);
      result.current.addToCart(product3);
    });

    expect(result.current.cartItems).toHaveLength(3);
    expect(result.current.cartCount).toBe(3);
  });

  it('should handle edge cases with invalid quantities', () => {
    const initialState = {
      cartReducer: {
        items: [mockProduct],
      },
    };

    const { result } = renderHookWithStore(initialState);

    // Intentar establecer cantidad negativa
    act(() => {
      result.current.updateQuantity(mockProduct.id, -1);
    });

    // El reducer actual permite cantidades negativas
    expect(result.current.cartItems[0].quantity).toBe(-1);

    // Verificar que el item sigue en el carrito
    expect(result.current.cartItems).toHaveLength(1);
  });

  it('should handle removing non-existent item', () => {
    const initialState = {
      cartReducer: {
        items: [mockProduct],
      },
    };

    const { result } = renderHookWithStore(initialState);

    act(() => {
      result.current.removeFromCart(999); // ID que no existe
    });

    // El carrito debería permanecer sin cambios
    expect(result.current.cartItems).toHaveLength(1);
    expect(result.current.cartItems[0].id).toBe(mockProduct.id);
  });

  it('should handle updating quantity of non-existent item', () => {
    const initialState = {
      cartReducer: {
        items: [mockProduct],
      },
    };

    const { result } = renderHookWithStore(initialState);

    act(() => {
      result.current.updateQuantity(999, 5); // ID que no existe
    });

    // El carrito debería permanecer sin cambios
    expect(result.current.cartItems).toHaveLength(1);
    expect(result.current.cartItems[0].quantity).toBe(mockProduct.quantity);
  });

  it('should maintain cart state consistency', () => {
    const { result } = renderHookWithStore();

    // Agregar varios productos y realizar operaciones
    act(() => {
      result.current.addToCart(mockProduct);
      result.current.addToCart({ ...mockProduct, id: 2 });
      result.current.updateQuantity(1, 3);
      result.current.removeFromCart(2);
    });

    expect(result.current.cartItems).toHaveLength(1);
    expect(result.current.cartItems[0].id).toBe(1);
    expect(result.current.cartItems[0].quantity).toBe(3);
    expect(result.current.cartCount).toBe(1);
  });

  it('should handle products with different price structures', () => {
    const productWithoutDiscount = {
      ...mockProduct,
      id: 2,
      price: 20000,
      discountedPrice: 20000, // Sin descuento
    };

    const { result } = renderHookWithStore();

    act(() => {
      result.current.addToCart(mockProduct); // Con descuento
      result.current.addToCart(productWithoutDiscount); // Sin descuento
    });

    expect(result.current.cartItems).toHaveLength(2);
    expect(result.current.totalPrice).toBe(35000); // 15000 + 20000
  });
});
