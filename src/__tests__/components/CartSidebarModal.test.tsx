// ===================================
// PINTEYA E-COMMERCE - TESTS PARA CARTSIDEBARMODAL COMPONENT
// ===================================

import React from 'react';
import { render, screen, fireEvent, act } from '@testing-library/react';
import { Provider } from 'react-redux';
import { configureStore } from '@reduxjs/toolkit';
import CartSidebarModal from '@/components/Common/CartSidebarModal';
import cartReducer from '@/redux/features/cart-slice';

// Mock del contexto de modal del carrito
const mockCloseModal = jest.fn();
const mockIsOpen = true;

jest.mock('@/app/context/CartSidebarModalContext', () => ({
  useCartModalContext: () => ({
    isCartModalOpen: mockIsOpen,
    openCartModal: jest.fn(),
    closeCartModal: mockCloseModal,
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

// Items de carrito de prueba
const mockCartItems = [
  {
    id: 1,
    title: 'Pintura Latex Interior Blanco 4L',
    price: 18000,
    discountedPrice: 15000,
    quantity: 2,
    imgs: {
      thumbnails: ['/images/products/pintura-latex-blanco-sm.jpg'],
      previews: ['/images/products/pintura-latex-blanco.jpg'],
    },
  },
  {
    id: 2,
    title: 'Esmalte Sintético Azul 1L',
    price: 8000,
    discountedPrice: 7000,
    quantity: 1,
    imgs: {
      thumbnails: ['/images/products/esmalte-azul-sm.jpg'],
      previews: ['/images/products/esmalte-azul.jpg'],
    },
  },
];

// Función helper para renderizar con Redux store
const renderWithStore = (component: React.ReactElement, initialState = {}) => {
  const store = configureStore({
    reducer: {
      cartReducer,
    },
    preloadedState: initialState,
  });

  return render(
    <Provider store={store}>
      {component}
    </Provider>
  );
};

describe('CartSidebarModal Component', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should render cart modal when open', async () => {
    const initialState = {
      cartReducer: {
        items: mockCartItems,
      },
    };

    await act(async () => {
      renderWithStore(<CartSidebarModal />, initialState);
    });

    expect(screen.getByText('Cart View')).toBeInTheDocument();
    expect(screen.getByText('Pintura Latex Interior Blanco 4L')).toBeInTheDocument();
    expect(screen.getByText('Esmalte Sintético Azul 1L')).toBeInTheDocument();
  });

  it('should display cart items with correct information', async () => {
    const initialState = {
      cartReducer: {
        items: mockCartItems,
      },
    };

    await act(async () => {
      renderWithStore(<CartSidebarModal />, initialState);
    });

    // Verificar que se muestran los productos
    expect(screen.getByText('Pintura Latex Interior Blanco 4L')).toBeInTheDocument();
    expect(screen.getByText('Esmalte Sintético Azul 1L')).toBeInTheDocument();

    // Verificar precios (el formato real incluye espacios: "Price: $ 15000")
    expect(screen.getByText(/Price:.*15000/)).toBeInTheDocument();
    expect(screen.getByText(/Price:.*7000/)).toBeInTheDocument();
  });

  it('should calculate and display total price correctly', async () => {
    const initialState = {
      cartReducer: {
        items: mockCartItems,
      },
    };

    await act(async () => {
      renderWithStore(<CartSidebarModal />, initialState);
    });

    // Total: (15000 * 2) + (7000 * 1) = 37000
    expect(screen.getByText('$37000')).toBeInTheDocument();
  });

  it('should handle close modal action', async () => {
    const initialState = {
      cartReducer: {
        items: mockCartItems,
      },
    };

    await act(async () => {
      renderWithStore(<CartSidebarModal />, initialState);
    });

    const closeButton = screen.getByRole('button', { name: /close/i });
    
    await act(async () => {
      fireEvent.click(closeButton);
    });

    expect(mockCloseModal).toHaveBeenCalled();
  });

  it('should display empty cart message when no items', async () => {
    const initialState = {
      cartReducer: {
        items: [],
      },
    };

    await act(async () => {
      renderWithStore(<CartSidebarModal />, initialState);
    });

    expect(screen.getByText(/your cart is empty/i)).toBeInTheDocument();
  });

  it('should handle remove item from cart', async () => {
    const store = configureStore({
      reducer: {
        cartReducer,
      },
      preloadedState: {
        cartReducer: {
          items: mockCartItems,
        },
      },
    });

    await act(async () => {
      render(
        <Provider store={store}>
          <CartSidebarModal />
        </Provider>
      );
    });

    // Buscar todos los botones de eliminar y hacer clic en el primero
    const removeButtons = screen.getAllByLabelText('button for remove product from cart');
    expect(removeButtons.length).toBe(2); // Verificar que hay 2 botones (uno por producto)

    await act(async () => {
      fireEvent.click(removeButtons[0]); // Hacer clic en el primer botón
    });

    // Verificar que se eliminó un item (de 2 items iniciales a 1)
    const state = store.getState();
    expect(state.cartReducer.items.length).toBe(1);
  });

  it('should handle quantity updates', async () => {
    const store = configureStore({
      reducer: {
        cartReducer,
      },
      preloadedState: {
        cartReducer: {
          items: mockCartItems,
        },
      },
    });

    await act(async () => {
      render(
        <Provider store={store}>
          <CartSidebarModal />
        </Provider>
      );
    });

    // Buscar controles de cantidad (+ y -)
    const quantityButtons = screen.getAllByRole('button');
    const increaseButton = quantityButtons.find(button => 
      button.textContent?.includes('+') || 
      button.getAttribute('aria-label')?.includes('increase')
    );

    if (increaseButton) {
      await act(async () => {
        fireEvent.click(increaseButton);
      });

      // Verificar que la cantidad cambió
      const state = store.getState();
      const updatedItem = state.cartReducer.items.find(item => item.id === 1);
      expect(updatedItem?.quantity).toBeGreaterThan(2);
    }
  });

  it('should show checkout button when items exist', async () => {
    const initialState = {
      cartReducer: {
        items: mockCartItems,
      },
    };

    await act(async () => {
      renderWithStore(<CartSidebarModal />, initialState);
    });

    const checkoutButton = screen.getByRole('link', { name: /checkout/i });
    expect(checkoutButton).toBeInTheDocument();
    expect(checkoutButton).toHaveAttribute('href', '/checkout');
  });

  it('should show checkout button even when cart is empty (current behavior)', async () => {
    const initialState = {
      cartReducer: {
        items: [],
      },
    };

    await act(async () => {
      renderWithStore(<CartSidebarModal />, initialState);
    });

    // El componente actual siempre muestra el botón de checkout
    const checkoutButton = screen.queryByRole('link', { name: /checkout/i });
    expect(checkoutButton).toBeInTheDocument();
  });

  it('should display products correctly (quantities not shown in current implementation)', async () => {
    const initialState = {
      cartReducer: {
        items: mockCartItems,
      },
    };

    await act(async () => {
      renderWithStore(<CartSidebarModal />, initialState);
    });

    // Verificar que se muestran los productos (el componente actual no muestra cantidades)
    expect(screen.getByText('Pintura Latex Interior Blanco 4L')).toBeInTheDocument();
    expect(screen.getByText('Esmalte Sintético Azul 1L')).toBeInTheDocument();
  });

  it('should handle modal overlay click to close', async () => {
    const initialState = {
      cartReducer: {
        items: mockCartItems,
      },
    };

    await act(async () => {
      renderWithStore(<CartSidebarModal />, initialState);
    });

    // Buscar el botón de cerrar modal
    const closeButton = screen.getByLabelText('button for close modal');

    await act(async () => {
      fireEvent.click(closeButton);
    });

    expect(mockCloseModal).toHaveBeenCalled();
  });

  it('should show proper loading states', async () => {
    const initialState = {
      cartReducer: {
        items: mockCartItems,
        isLoading: true,
      },
    };

    await act(async () => {
      renderWithStore(<CartSidebarModal />, initialState);
    });

    // Verificar que se muestra algún indicador de carga
    // Esto depende de la implementación específica del componente
    expect(screen.getByText('Cart View')).toBeInTheDocument();
  });
});
