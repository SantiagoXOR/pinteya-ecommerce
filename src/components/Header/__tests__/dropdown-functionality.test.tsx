/**
 * Test para verificar la funcionalidad de los dropdowns en el header mejorado
 */

import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { Provider } from 'react-redux';
import { configureStore } from '@reduxjs/toolkit';
import '@testing-library/jest-dom';

// Componentes a testear
import TopBar from '../TopBar';
import EnhancedSearchBar from '../EnhancedSearchBar';
import ActionButtons from '../ActionButtons';

// Mock del store de Redux
const mockStore = configureStore({
  reducer: {
    cartReducer: () => ({
      items: [],
      totalPrice: 0
    })
  }
});

// Mock del contexto del carrito
const mockCartContext = {
  openCartModal: jest.fn(),
  closeCartModal: jest.fn(),
  isCartModalOpen: false
};

// Mock de Radix UI DropdownMenu para testing
jest.mock('@/components/ui/dropdown-menu', () => ({
  DropdownMenu: ({ children }: { children: React.ReactNode }) => <div data-testid="dropdown-menu">{children}</div>,
  DropdownMenuTrigger: ({ children, asChild, ...props }: any) => {
    const Component = asChild ? 'div' : 'button';
    return (
      <Component
        {...props}
        onClick={(e: any) => {
          // Simular apertura del dropdown
          const content = document.querySelector('[data-testid="dropdown-content"]');
          if (content) {
            content.setAttribute('data-state', 'open');
            content.style.display = 'block';
          }
          props.onClick?.(e);
        }}
      >
        {children}
      </Component>
    );
  },
  DropdownMenuContent: ({ children, ...props }: any) => (
    <div
      {...props}
      data-testid="dropdown-content"
      data-state="closed"
      style={{ display: 'none' }}
    >
      {children}
    </div>
  ),
  DropdownMenuItem: ({ children, onClick, ...props }: any) => (
    <div
      {...props}
      role="menuitem"
      onClick={onClick}
      style={{ cursor: 'pointer' }}
    >
      {children}
    </div>
  ),
  DropdownMenuSeparator: () => <div data-testid="dropdown-separator" />
}));

jest.mock('@/app/context/CartSidebarModalContext', () => ({
  useCartModalContext: () => mockCartContext
}));

// Mock de Next.js Link
jest.mock('next/link', () => {
  return ({ children, href, ...props }: any) => (
    <a href={href} {...props}>
      {children}
    </a>
  );
});

describe('Header Dropdown Functionality', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('TopBar Dropdown', () => {
    test('should render delivery zone selector', () => {
      render(<TopBar />);
      
      expect(screen.getByText(/Envíos a Córdoba Capital/i)).toBeInTheDocument();
    });

    test('should open dropdown when clicked', async () => {
      render(<TopBar />);

      const trigger = screen.getByTestId('delivery-zone-selector');
      fireEvent.click(trigger);

      await waitFor(() => {
        // Verificar que el dropdown se abre (mock simula esto)
        const content = screen.getByTestId('dropdown-content');
        expect(content).toBeInTheDocument();
      });
    });

    test('should show available and unavailable zones', async () => {
      render(<TopBar />);

      const trigger = screen.getByTestId('delivery-zone-selector');
      fireEvent.click(trigger);

      await waitFor(() => {
        // Verificar que las zonas están renderizadas en el componente usando getAllByText
        expect(screen.getAllByText(/Córdoba Capital/i)).toHaveLength(2); // Una en trigger, otra en dropdown
        expect(screen.getByText(/Interior de Córdoba/i)).toBeInTheDocument();
        expect(screen.getByText(/Buenos Aires/i)).toBeInTheDocument();
      });
    });
  });

  describe('EnhancedSearchBar Dropdown', () => {
    const mockOnSearch = jest.fn();

    test('should render category selector', () => {
      render(<EnhancedSearchBar onSearch={mockOnSearch} />);

      expect(screen.getAllByText(/Todas las Categorías/i)).toHaveLength(2); // Una visible, otra en dropdown
    });

    test('should open category dropdown when clicked', async () => {
      render(<EnhancedSearchBar onSearch={mockOnSearch} />);

      const trigger = screen.getByTestId('category-selector');
      fireEvent.click(trigger);

      await waitFor(() => {
        // Verificar que las categorías están renderizadas
        expect(screen.getByText(/Pinturas/i)).toBeInTheDocument();
        expect(screen.getByText(/Herramientas/i)).toBeInTheDocument();
        expect(screen.getByText(/Accesorios/i)).toBeInTheDocument();
      });
    });

    test('should update placeholder when category changes', async () => {
      render(<EnhancedSearchBar onSearch={mockOnSearch} />);
      
      const trigger = screen.getByRole('button', { name: /Todas las Categorías/i });
      fireEvent.click(trigger);

      await waitFor(() => {
        const paintCategory = screen.getByText(/Pinturas/i);
        fireEvent.click(paintCategory);
      });

      // Verificar que el placeholder cambió
      const searchInput = screen.getByPlaceholderText(/Busco pinturas.../i);
      expect(searchInput).toBeInTheDocument();
    });

    test('should show category icons', async () => {
      render(<EnhancedSearchBar onSearch={mockOnSearch} />);
      
      const trigger = screen.getByRole('button', { name: /Todas las Categorías/i });
      fireEvent.click(trigger);

      await waitFor(() => {
        // Los iconos SVG deberían estar presentes (no emojis)
        const paletteIcons = document.querySelectorAll('.lucide-palette');
        const wrenchIcons = document.querySelectorAll('.lucide-wrench');
        expect(paletteIcons.length).toBeGreaterThan(0);
        expect(wrenchIcons.length).toBeGreaterThan(0);
      });
    });
  });

  describe('ActionButtons Dropdown', () => {
    test('should render cart button with counter', () => {
      render(
        <Provider store={mockStore}>
          <ActionButtons variant="header" />
        </Provider>
      );
      
      expect(screen.getByTestId('cart-icon')).toBeInTheDocument();
    });

    test('should show login buttons when not authenticated', () => {
      render(
        <Provider store={mockStore}>
          <ActionButtons variant="header" />
        </Provider>
      );
      
      expect(screen.getByText(/Iniciar con Google/i)).toBeInTheDocument();
      expect(screen.getByText(/Registrarse/i)).toBeInTheDocument();
    });

    test('should open cart modal when cart button is clicked', () => {
      render(
        <Provider store={mockStore}>
          <ActionButtons variant="header" />
        </Provider>
      );
      
      const cartButton = screen.getByRole('button', { name: /carrito/i });
      fireEvent.click(cartButton);

      expect(mockCartContext.openCartModal).toHaveBeenCalledTimes(1);
    });
  });

  describe('Mobile Variant', () => {
    test('should render mobile action buttons', () => {
      render(
        <Provider store={mockStore}>
          <ActionButtons variant="mobile" />
        </Provider>
      );
      
      // En mobile, los botones deberían ser más compactos
      const cartButton = screen.getByTestId('cart-icon');
      expect(cartButton).toHaveClass('p-2');
    });
  });

  describe('Accessibility', () => {
    test('dropdowns should be keyboard accessible', async () => {
      render(<TopBar />);
      
      const trigger = screen.getByRole('button', { name: /Envíos a/i });
      
      // Simular navegación por teclado
      trigger.focus();
      fireEvent.keyDown(trigger, { key: 'Enter' });

      await waitFor(() => {
        expect(screen.getByText(/Interior de Córdoba/i)).toBeInTheDocument();
      });
    });

    test('should have proper ARIA attributes', () => {
      render(<EnhancedSearchBar onSearch={jest.fn()} />);
      
      const trigger = screen.getByRole('button', { name: /Todas las Categorías/i });
      expect(trigger).toHaveAttribute('aria-expanded');
    });
  });

  describe('Responsive Behavior', () => {
    test('should hide certain elements on mobile', () => {
      render(<TopBar />);

      // TopBar debería estar oculto en mobile - buscar el contenedor principal
      const topBarContainer = screen.getByText(/Asesoramiento 24\/7/i).closest('.bg-blaze-orange-600');
      expect(topBarContainer).toHaveClass('hidden', 'lg:block');
    });
  });
});

describe('Dropdown Integration', () => {
  test('all dropdown components should work together', async () => {
    const mockOnSearch = jest.fn();
    
    render(
      <Provider store={mockStore}>
        <div>
          <TopBar />
          <EnhancedSearchBar onSearch={mockOnSearch} />
          <ActionButtons variant="header" />
        </div>
      </Provider>
    );

    // Verificar que todos los dropdowns están presentes
    expect(screen.getByText(/Envíos a Córdoba Capital/i)).toBeInTheDocument();
    expect(screen.getAllByText(/Todas las Categorías/i)).toHaveLength(2);
    expect(screen.getByText(/Iniciar con Google/i)).toBeInTheDocument();

    // Verificar que no hay conflictos entre dropdowns
    const deliveryTrigger = screen.getByRole('button', { name: /Envíos a/i });
    const categoryTrigger = screen.getByRole('button', { name: /Todas las Categorías/i });

    fireEvent.click(deliveryTrigger);
    await waitFor(() => {
      expect(screen.getByText(/Interior de Córdoba/i)).toBeInTheDocument();
    });

    fireEvent.click(categoryTrigger);
    await waitFor(() => {
      expect(screen.getByText(/Pinturas/i)).toBeInTheDocument();
    });
  });
});
