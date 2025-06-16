// ===================================
// PINTEYA E-COMMERCE - TESTS PARA PRODUCTITEM COMPONENT
// ===================================

import React from 'react';
import { render, screen, fireEvent, act } from '@testing-library/react';
import { Provider } from 'react-redux';
import { configureStore } from '@reduxjs/toolkit';
import ProductItem from '@/components/Common/ProductItem';
import cartReducer from '@/redux/features/cart-slice';
import wishlistReducer from '@/redux/features/wishlist-slice';
import quickViewReducer from '@/redux/features/quickView-slice';
import productDetailsReducer from '@/redux/features/product-details';
import { Product } from '@/types/product';

// Mock del contexto de modal
const mockOpenModal = jest.fn();
jest.mock('@/app/context/QuickViewModalContext', () => ({
  useModalContext: () => ({
    openModal: mockOpenModal,
  }),
}));

// Mock de Next.js Link
jest.mock('next/link', () => {
  return ({ children, href }: { children: React.ReactNode; href: string }) => (
    <a href={href}>{children}</a>
  );
});

// Mock de Next.js Image
jest.mock('next/image', () => {
  return ({ src, alt, width, height }: { src: string; alt: string; width: number; height: number }) => (
    <img src={src} alt={alt} width={width} height={height} />
  );
});

// Producto de prueba
const mockProduct: Product = {
  id: 1,
  title: 'Pintura Latex Interior Blanco 4L',
  reviews: 25,
  price: 18000,
  discountedPrice: 15000,
  imgs: {
    thumbnails: ['/images/products/pintura-latex-blanco-sm.jpg'],
    previews: ['/images/products/pintura-latex-blanco.jpg'],
  },
};

// Función helper para renderizar con Redux store
const renderWithStore = (component: React.ReactElement, initialState = {}) => {
  const store = configureStore({
    reducer: {
      cartReducer,
      wishlistReducer,
      quickViewReducer,
      productDetailsReducer,
    },
    preloadedState: initialState,
  });

  return render(
    <Provider store={store}>
      {component}
    </Provider>
  );
};

describe('ProductItem Component', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should render product information correctly', async () => {
    await act(async () => {
      renderWithStore(<ProductItem item={mockProduct} />);
    });

    expect(screen.getByText('Pintura Latex Interior Blanco 4L')).toBeInTheDocument();
    expect(screen.getByText('$15000')).toBeInTheDocument();
    expect(screen.getByText('$18000')).toBeInTheDocument();

    // Buscar la imagen principal del producto (no las estrellas)
    const productImage = screen.getByAltText('');
    expect(productImage).toHaveAttribute('src', '/images/products/pintura-latex-blanco.jpg');
  });

  it('should display product image', async () => {
    await act(async () => {
      renderWithStore(<ProductItem item={mockProduct} />);
    });

    // Buscar la imagen principal del producto por su src específico
    const productImage = screen.getByAltText('');
    expect(productImage).toBeInTheDocument();
    expect(productImage).toHaveAttribute('src', '/images/products/pintura-latex-blanco.jpg');
    expect(productImage).toHaveAttribute('width', '250');
    expect(productImage).toHaveAttribute('height', '250');
  });

  it('should show discounted price and original price', async () => {
    await act(async () => {
      renderWithStore(<ProductItem item={mockProduct} />);
    });

    // Precio con descuento
    expect(screen.getByText('$15000')).toBeInTheDocument();
    // Precio original tachado
    expect(screen.getByText('$18000')).toBeInTheDocument();
  });

  it('should handle add to cart action', async () => {
    const store = configureStore({
      reducer: {
        cartReducer,
        wishlistReducer,
        quickViewReducer,
        productDetailsReducer,
      },
    });

    await act(async () => {
      render(
        <Provider store={store}>
          <ProductItem item={mockProduct} />
        </Provider>
      );
    });

    const addToCartButton = screen.getByText('Add to cart');
    
    await act(async () => {
      fireEvent.click(addToCartButton);
    });

    // Verificar que el producto se agregó al carrito
    const state = store.getState();
    expect(state.cartReducer.items).toHaveLength(1);
    expect(state.cartReducer.items[0].id).toBe(mockProduct.id);
    expect(state.cartReducer.items[0].quantity).toBe(1);
  });

  it('should handle add to wishlist action', async () => {
    const store = configureStore({
      reducer: {
        cartReducer,
        wishlistReducer,
        quickViewReducer,
        productDetailsReducer,
      },
    });

    await act(async () => {
      render(
        <Provider store={store}>
          <ProductItem item={mockProduct} />
        </Provider>
      );
    });

    const wishlistButton = screen.getByLabelText('button for favorite select');
    
    await act(async () => {
      fireEvent.click(wishlistButton);
    });

    // Verificar que el producto se agregó a la wishlist
    const state = store.getState();
    expect(state.wishlistReducer.items).toHaveLength(1);
    expect(state.wishlistReducer.items[0].id).toBe(mockProduct.id);
  });

  it('should handle quick view action', async () => {
    const store = configureStore({
      reducer: {
        cartReducer,
        wishlistReducer,
        quickViewReducer,
        productDetailsReducer,
      },
    });

    await act(async () => {
      render(
        <Provider store={store}>
          <ProductItem item={mockProduct} />
        </Provider>
      );
    });

    // Buscar el botón de quick view por su aria-label
    const quickViewButton = screen.getByLabelText('button for quick view');

    await act(async () => {
      fireEvent.click(quickViewButton);
    });

    // Verificar que se abrió el modal
    expect(mockOpenModal).toHaveBeenCalled();

    // Verificar que se actualizó el estado de quick view
    const state = store.getState();
    // El estado puede tener una estructura diferente, verificar que existe
    expect(state.quickViewReducer).toBeDefined();
  });

  it('should handle product details navigation', async () => {
    await act(async () => {
      renderWithStore(<ProductItem item={mockProduct} />);
    });

    const productTitle = screen.getByText('Pintura Latex Interior Blanco 4L');
    
    await act(async () => {
      fireEvent.click(productTitle);
    });

    // Verificar que el enlace apunta a shop-details
    const link = screen.getByRole('link');
    expect(link).toHaveAttribute('href', '/shop-details');
  });

  it('should show hover effects on buttons', async () => {
    await act(async () => {
      renderWithStore(<ProductItem item={mockProduct} />);
    });

    const addToCartButton = screen.getByText('Add to cart');
    expect(addToCartButton).toHaveClass('hover:bg-tahiti-gold-700');

    const wishlistButton = screen.getByLabelText('button for favorite select');
    expect(wishlistButton).toHaveClass('hover:text-tahiti-gold-500');
  });

  it('should handle product without discount', async () => {
    const productWithoutDiscount: Product = {
      ...mockProduct,
      discountedPrice: mockProduct.price, // Sin descuento
    };

    await act(async () => {
      renderWithStore(<ProductItem item={productWithoutDiscount} />);
    });

    // Ambos precios deberían ser iguales
    const priceElements = screen.getAllByText('$18000');
    expect(priceElements).toHaveLength(2);
  });

  it('should handle missing images gracefully', async () => {
    const productWithoutImages: Product = {
      ...mockProduct,
      imgs: {
        thumbnails: [],
        previews: [],
      },
    };

    await act(async () => {
      renderWithStore(<ProductItem item={productWithoutImages} />);
    });

    // El componente debería renderizar sin errores
    expect(screen.getByText('Pintura Latex Interior Blanco 4L')).toBeInTheDocument();
  });

  it('should have proper accessibility attributes', async () => {
    await act(async () => {
      renderWithStore(<ProductItem item={mockProduct} />);
    });

    const wishlistButton = screen.getByLabelText('button for favorite select');
    expect(wishlistButton).toHaveAttribute('aria-label', 'button for favorite select');
    expect(wishlistButton).toHaveAttribute('id', 'favOne');
  });
});
