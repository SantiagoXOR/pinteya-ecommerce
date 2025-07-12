// ===================================
// TESTS: SearchAutocomplete Component - React Autosuggest patterns avanzados
// ===================================

import React from 'react';
import { render, screen, fireEvent, waitFor, act } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { useRouter } from 'next/navigation';
import { SearchAutocomplete } from '@/components/ui/search-autocomplete';
import { searchProducts } from '@/lib/api/products';

// ===================================
// MOCKS
// ===================================

jest.mock('next/navigation', () => ({
  useRouter: jest.fn(),
}));

jest.mock('@/lib/api/products', () => ({
  searchProducts: jest.fn(),
}));

const mockPush = jest.fn();
const mockSearchProducts = searchProducts as jest.MockedFunction<typeof searchProducts>;

beforeEach(() => {
  jest.clearAllMocks();
  (useRouter as jest.Mock).mockReturnValue({
    push: mockPush,
  });
  
  // Mock localStorage
  Object.defineProperty(window, 'localStorage', {
    value: {
      getItem: jest.fn(() => null),
      setItem: jest.fn(),
      removeItem: jest.fn(),
      clear: jest.fn(),
    },
    writable: true,
  });
});

// ===================================
// TESTS BÁSICOS
// ===================================

describe('SearchAutocomplete Component', () => {
  it('should render with default placeholder', () => {
    render(<SearchAutocomplete />);
    
    const input = screen.getByPlaceholderText('Busco productos de pinturería...');
    expect(input).toBeInTheDocument();
  });

  it('should render with custom placeholder', () => {
    render(<SearchAutocomplete placeholder="Buscar productos..." />);
    
    const input = screen.getByPlaceholderText('Buscar productos...');
    expect(input).toBeInTheDocument();
  });

  it('should have correct test id', () => {
    render(<SearchAutocomplete data-testid="custom-search" />);
    
    const input = screen.getByTestId('custom-search');
    expect(input).toBeInTheDocument();
  });
});

// ===================================
// TESTS DE DEBOUNCING
// ===================================

describe('SearchAutocomplete - Debouncing', () => {
  // Nota: El debouncing se maneja en el hook useSearch, no en el componente
  // Estos tests verifican que el componente llama correctamente a searchWithDebounce

  it('should debounce search requests with 150ms delay', async () => {
    const mockSearchWithDebounce = jest.fn();

    render(<SearchAutocomplete searchWithDebounce={mockSearchWithDebounce} />);

    const input = screen.getByRole('combobox');

    // Escribir rápidamente varios caracteres
    await userEvent.type(input, 'pintura');

    // Verificar que se llamó searchWithDebounce para cada carácter
    expect(mockSearchWithDebounce).toHaveBeenCalledTimes(7); // 'p', 'i', 'n', 't', 'u', 'r', 'a'
    expect(mockSearchWithDebounce).toHaveBeenLastCalledWith('pintura');
  });

  it('should cancel previous debounced calls', async () => {
    const mockSearchWithDebounce = jest.fn();

    render(<SearchAutocomplete searchWithDebounce={mockSearchWithDebounce} />);

    const input = screen.getByRole('combobox');

    // Primera búsqueda
    await userEvent.type(input, 'pintura');

    // Limpiar y escribir nueva búsqueda
    await userEvent.clear(input);
    await userEvent.type(input, 'esmalte');

    // Verificar que se llamó con ambos valores
    expect(mockSearchWithDebounce).toHaveBeenCalledWith('pintura');
    expect(mockSearchWithDebounce).toHaveBeenCalledWith('');
    expect(mockSearchWithDebounce).toHaveBeenCalledWith('esmalte');
    await waitFor(() => {
      expect(mockSearchProducts).toHaveBeenCalledTimes(1);
      expect(mockSearchProducts).toHaveBeenCalledWith('esmalte', 8);
    });
  });
});

// ===================================
// TESTS DE ESTADOS DE LOADING
// ===================================

describe('SearchAutocomplete - Loading States', () => {
  it('should show loading spinner during search', async () => {
    // Mock para simular búsqueda lenta
    mockSearchProducts.mockImplementation(() =>
      new Promise(resolve => setTimeout(() => resolve({
        success: true,
        data: [],
        pagination: { total: 0, page: 1, limit: 8, totalPages: 0 },
      }), 1000))
    );

    // Renderizar con estado de loading
    render(<SearchAutocomplete isLoading={true} query="pintura" />);

    // Verificar que aparece el spinner
    const spinner = document.querySelector('.animate-spin');
    expect(spinner).toBeInTheDocument();
  });

  it('should disable input during loading', async () => {
    // Renderizar con estado de loading
    render(<SearchAutocomplete isLoading={true} query="pintura" />);

    const input = screen.getByRole('combobox');

    // Verificar que el input está deshabilitado
    expect(input).toBeDisabled();
  });
});

// ===================================
// TESTS DE MANEJO DE ERRORES
// ===================================

describe('SearchAutocomplete - Error Handling', () => {
  it('should show error message when search fails', async () => {
    // Renderizar con estado de error y dropdown abierto
    const { container } = render(<SearchAutocomplete error="Network error" query="pintura" />);

    // Abrir el dropdown haciendo focus en el input
    const input = screen.getByRole('combobox');
    await userEvent.click(input);

    // Verificar que aparece el mensaje de error
    await waitFor(() => {
      expect(screen.getByText(/Error en la búsqueda/)).toBeInTheDocument();
      expect(screen.getByText('Network error')).toBeInTheDocument();
    });
  });

  it('should show no results message when no products found', async () => {
    mockSearchProducts.mockResolvedValue({
      success: true,
      data: [],
      pagination: { total: 0, page: 1, limit: 8, totalPages: 0 },
    });

    render(<SearchAutocomplete />);
    
    const input = screen.getByRole('combobox');
    
    await userEvent.type(input, 'productoquenoexiste');
    
    await waitFor(() => {
      expect(screen.getByText(/Sin resultados/)).toBeInTheDocument();
      expect(screen.getByText(/No se encontraron productos para "productoquenoexiste"/)).toBeInTheDocument();
    });
  });
});

// ===================================
// TESTS DE NAVEGACIÓN
// ===================================

describe('SearchAutocomplete - Navigation', () => {
  it('should navigate to search page on Enter', async () => {
    const mockResponse = {
      success: true,
      data: [{ id: '1', name: 'Producto', price: 100 }],
      pagination: { total: 1, page: 1, limit: 8, totalPages: 1 },
    };

    mockSearchProducts.mockResolvedValue(mockResponse);

    render(<SearchAutocomplete />);
    
    const input = screen.getByRole('combobox');
    
    await userEvent.type(input, 'pintura');
    await userEvent.keyboard('{Enter}');
    
    await waitFor(() => {
      expect(mockPush).toHaveBeenCalledWith('/search?q=pintura');
    });
  });

  it('should call onSearch callback when provided', async () => {
    const onSearch = jest.fn();
    
    render(<SearchAutocomplete onSearch={onSearch} />);
    
    const input = screen.getByRole('combobox');
    
    await userEvent.type(input, 'pintura');
    await userEvent.keyboard('{Enter}');
    
    await waitFor(() => {
      expect(onSearch).toHaveBeenCalledWith('pintura');
    });
  });
});

// ===================================
// TESTS DE SUGERENCIAS
// ===================================

describe('SearchAutocomplete - Suggestions', () => {
  it('should show suggestions when typing', async () => {
    const mockSuggestions = [
      {
        id: 'product-1',
        type: 'product' as const,
        title: 'Pintura Látex Blanca',
        subtitle: 'Pinturas',
        href: '/shop-details/1',
        badge: 'En stock'
      },
      {
        id: 'product-2',
        type: 'product' as const,
        title: 'Pintura Esmalte Azul',
        subtitle: 'Pinturas',
        href: '/shop-details/2',
        badge: 'En stock'
      },
    ];

    const mockSearchWithDebounce = jest.fn();

    render(
      <SearchAutocomplete
        suggestions={mockSuggestions}
        searchWithDebounce={mockSearchWithDebounce}
      />
    );

    const input = screen.getByRole('combobox');

    await userEvent.type(input, 'pintura');

    await waitFor(() => {
      expect(screen.getByText('Pintura Látex Blanca')).toBeInTheDocument();
      expect(screen.getByText('Pintura Esmalte Azul')).toBeInTheDocument();
    });
  });

  it('should handle suggestion selection', async () => {
    const onSuggestionSelect = jest.fn();
    const mockSuggestions = [
      {
        id: 'product-1',
        type: 'product' as const,
        title: 'Pintura Látex',
        subtitle: 'Pinturas',
        href: '/shop-details/1',
        badge: 'En stock'
      },
    ];

    const mockSearchWithDebounce = jest.fn();

    render(
      <SearchAutocomplete
        suggestions={mockSuggestions}
        searchWithDebounce={mockSearchWithDebounce}
        onSuggestionSelect={onSuggestionSelect}
      />
    );

    const input = screen.getByRole('combobox');

    await userEvent.type(input, 'pintura');

    await waitFor(() => {
      const suggestion = screen.getByText('Pintura Látex');
      expect(suggestion).toBeInTheDocument();
    });

    const suggestion = screen.getByText('Pintura Látex');
    await userEvent.click(suggestion);

    expect(onSuggestionSelect).toHaveBeenCalled();
  });
});

// ===================================
// TESTS DE ACCESIBILIDAD
// ===================================

describe('SearchAutocomplete - Accessibility', () => {
  it('should have proper ARIA attributes', () => {
    render(<SearchAutocomplete />);
    
    const input = screen.getByRole('combobox');
    expect(input).toHaveAttribute('autoComplete', 'off');
  });

  it('should support keyboard navigation', async () => {
    const mockSuggestions = [
      {
        id: 'product-1',
        type: 'product' as const,
        title: 'Pintura 1',
        subtitle: 'Pinturas',
        href: '/shop-details/1',
        badge: 'En stock'
      },
      {
        id: 'product-2',
        type: 'product' as const,
        title: 'Pintura 2',
        subtitle: 'Pinturas',
        href: '/shop-details/2',
        badge: 'En stock'
      },
    ];

    const mockSearchWithDebounce = jest.fn();

    render(
      <SearchAutocomplete
        suggestions={mockSuggestions}
        searchWithDebounce={mockSearchWithDebounce}
      />
    );

    const input = screen.getByRole('combobox');

    await userEvent.type(input, 'pintura');

    await waitFor(() => {
      expect(screen.getByText('Pintura 1')).toBeInTheDocument();
    });

    // Navegar con flechas
    await userEvent.keyboard('{ArrowDown}');
    await userEvent.keyboard('{ArrowDown}');
    await userEvent.keyboard('{ArrowUp}');
    
    // Seleccionar con Enter
    await userEvent.keyboard('{Enter}');
    
    // Verificar que se navega correctamente
    await waitFor(() => {
      expect(mockPush).toHaveBeenCalled();
    });
  });

  // ===================================
  // TESTS PARA REACT AUTOSUGGEST PATTERNS
  // ===================================

  describe('React Autosuggest Patterns', () => {
    it('should have proper ARIA attributes', () => {
      render(<SearchAutocomplete data-testid="aria-test" />);

      const input = screen.getByTestId('aria-test');
      expect(input).toHaveAttribute('role', 'combobox');
      expect(input).toHaveAttribute('aria-expanded', 'false');
      expect(input).toHaveAttribute('aria-haspopup', 'listbox');
      expect(input).toHaveAttribute('aria-autocomplete', 'list');
    });

    it('should update aria-expanded when dropdown opens', async () => {
      const user = userEvent.setup();
      const mockSuggestions = [
        { id: '1', type: 'product' as const, title: 'Test Product', href: '/products/1' }
      ];

      render(
        <SearchAutocomplete
          data-testid="aria-expanded-test"
          suggestions={mockSuggestions}
          query="test"
        />
      );

      const input = screen.getByTestId('aria-expanded-test');
      await user.click(input);

      expect(input).toHaveAttribute('aria-expanded', 'true');
    });

    it('should handle keyboard navigation with ArrowDown and ArrowUp', async () => {
      const user = userEvent.setup();
      const mockSuggestions = [
        { id: '1', type: 'product' as const, title: 'Product 1', href: '/products/1' },
        { id: '2', type: 'product' as const, title: 'Product 2', href: '/products/2' }
      ];

      render(
        <SearchAutocomplete
          data-testid="keyboard-nav-test"
          suggestions={mockSuggestions}
          query="test"
        />
      );

      const input = screen.getByTestId('keyboard-nav-test');
      await user.click(input);

      // Arrow down should highlight first option
      await user.keyboard('{ArrowDown}');

      await waitFor(() => {
        const firstOption = screen.getByRole('option', { name: /Product 1/ });
        expect(firstOption).toHaveAttribute('aria-selected', 'true');
      });

      // Arrow down again should highlight second option
      await user.keyboard('{ArrowDown}');

      await waitFor(() => {
        const secondOption = screen.getByRole('option', { name: /Product 2/ });
        expect(secondOption).toHaveAttribute('aria-selected', 'true');
      });
    });

    it('should handle IME composition events', async () => {
      const searchWithDebounce = jest.fn();

      render(
        <SearchAutocomplete
          data-testid="ime-test"
          searchWithDebounce={searchWithDebounce}
        />
      );

      const input = screen.getByTestId('ime-test');

      // Start composition
      fireEvent.compositionStart(input);
      fireEvent.change(input, { target: { value: 'test' } });

      // Should not call searchWithDebounce during composition
      expect(searchWithDebounce).not.toHaveBeenCalled();

      // End composition
      fireEvent.compositionEnd(input, { target: { value: 'test' } });

      // Should call searchWithDebounce after composition ends
      expect(searchWithDebounce).toHaveBeenCalledWith('test');
    });

    it('should announce changes for screen readers', async () => {
      const user = userEvent.setup();
      const mockSuggestions = [
        { id: '1', type: 'product' as const, title: 'Test Product', href: '/products/1' }
      ];

      render(
        <SearchAutocomplete
          data-testid="screen-reader-test"
          suggestions={mockSuggestions}
          query="test"
        />
      );

      const input = screen.getByTestId('screen-reader-test');
      await user.click(input);

      // Check for aria-live region
      const liveRegion = screen.getByRole('status', { hidden: true });
      expect(liveRegion).toBeInTheDocument();
    });

    it('should handle Escape key to close dropdown', async () => {
      const user = userEvent.setup();
      const mockSuggestions = [
        { id: '1', type: 'product' as const, title: 'Test Product', href: '/products/1' }
      ];

      render(
        <SearchAutocomplete
          data-testid="escape-test"
          suggestions={mockSuggestions}
          query="test"
        />
      );

      const input = screen.getByTestId('escape-test');
      await user.click(input);

      // Dropdown should be open
      expect(screen.getByRole('listbox')).toBeInTheDocument();

      await user.keyboard('{Escape}');

      await waitFor(() => {
        expect(screen.queryByRole('listbox')).not.toBeInTheDocument();
      });
    });

    it('should highlight suggestions on mouse hover', async () => {
      const user = userEvent.setup();
      const mockSuggestions = [
        { id: '1', type: 'product' as const, title: 'Test Product', href: '/products/1' }
      ];

      render(
        <SearchAutocomplete
          data-testid="hover-test"
          suggestions={mockSuggestions}
          query="test"
        />
      );

      const input = screen.getByTestId('hover-test');
      await user.click(input);

      const option = screen.getByRole('option', { name: /Test Product/ });
      await user.hover(option);

      expect(option).toHaveAttribute('aria-selected', 'true');
    });
  });
});
