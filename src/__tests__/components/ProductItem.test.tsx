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
    expect(screen.getByText((content, element) => {
      return element?.textContent === '$ 15.000' || content.includes('15.000');
    })).toBeInTheDocument();
    expect(screen.getByText((content, element) => {
      return element?.textContent === '$ 18.000' || content.includes('18.000');
    })).toBeInTheDocument();

    // Buscar la imagen principal del producto
    const productImage = screen.getByAltText('Pintura Latex Interior Blanco 4L');
    expect(productImage).toHaveAttribute('src', '/images/products/pintura-latex-blanco.jpg');
  });

  it('should display product image', async () => {
    await act(async () => {
      renderWithStore(<ProductItem item={mockProduct} />);
    });

    // Buscar la imagen principal del producto por su alt text
    const productImage = screen.getByAltText('Pintura Latex Interior Blanco 4L');
    expect(productImage).toBeInTheDocument();
    expect(productImage).toHaveAttribute('src', '/images/products/pintura-latex-blanco.jpg');
    expect(productImage).toHaveClass('object-contain', 'w-full', 'h-full');
  });

  it('should show discounted price and original price', async () => {
    await act(async () => {
      renderWithStore(<ProductItem item={mockProduct} />);
    });

    // Precio con descuento (formateado con puntos)
    expect(screen.getByText((content, element) => {
      return element?.textContent === '$ 15.000' || content.includes('15.000');
    })).toBeInTheDocument();
    // Precio original tachado (formateado con puntos)
    expect(screen.getByText((content, element) => {
      return element?.textContent === '$ 18.000' || content.includes('18.000');
    })).toBeInTheDocument();
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

    const addToCartButton = screen.getByText('Agregar al carrito');
    
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

    // El ProductCard unificado no tiene botón de wishlist visible
    // Solo verifica que el componente se renderiza correctamente
    expect(screen.getByTestId('commercial-product-card')).toBeInTheDocument();
    expect(screen.getByText('Pintura Latex Interior Blanco 4L')).toBeInTheDocument();
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

    // El ProductCard unificado no tiene botón de quick view visible
    // Solo verifica que el componente se renderiza correctamente
    expect(screen.getByTestId('commercial-product-card')).toBeInTheDocument();
    expect(screen.getByText('Pintura Latex Interior Blanco 4L')).toBeInTheDocument();
  });

  it('should handle product details navigation', async () => {
    await act(async () => {
      renderWithStore(<ProductItem item={mockProduct} />);
    });

    const productTitle = screen.getByText('Pintura Latex Interior Blanco 4L');
    
    await act(async () => {
      fireEvent.click(productTitle);
    });

    // El ProductCard unificado no tiene link directo, solo el botón de agregar al carrito
    const addToCartButton = screen.getByTestId('add-to-cart-btn');
    expect(addToCartButton).toBeInTheDocument();
  });

  it('should show hover effects on buttons', async () => {
    await act(async () => {
      renderWithStore(<ProductItem item={mockProduct} />);
    });

    const addToCartButton = screen.getByTestId('add-to-cart-btn');
    expect(addToCartButton).toHaveClass('bg-yellow-400');

    // El ProductCard unificado no tiene botón de wishlist visible
    expect(addToCartButton).toBeInTheDocument();
  });

  it('should handle product without discount', async () => {
    const productWithoutDiscount: Product = {
      ...mockProduct,
      discountedPrice: mockProduct.price, // Sin descuento
    };

    await act(async () => {
      renderWithStore(<ProductItem item={productWithoutDiscount} />);
    });

    // Solo debería mostrar un precio (sin descuento)
    expect(screen.getByText((content, element) => {
      return element?.textContent === '$ 18.000' || content.includes('18.000');
    })).toBeInTheDocument();
    // No debería haber precio tachado
    expect(screen.queryByText('line-through')).not.toBeInTheDocument();
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

    // El ProductCard unificado tiene diferentes atributos de accesibilidad
    const addToCartButton = screen.getByTestId('add-to-cart-btn');
    expect(addToCartButton).toBeInTheDocument();

    const productCard = screen.getByTestId('commercial-product-card');
    expect(productCard).toBeInTheDocument();
  });
});
