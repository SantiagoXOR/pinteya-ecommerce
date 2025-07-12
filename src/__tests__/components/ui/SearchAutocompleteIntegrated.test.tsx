// ===================================
// TESTS: SearchAutocompleteIntegrated - Integración completa
// ===================================

import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { useRouter } from 'next/navigation';
import { searchProducts } from '@/lib/api/products';
import { SearchAutocompleteIntegrated } from '@/components/ui/SearchAutocompleteIntegrated';

// Mocks
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

describe('SearchAutocompleteIntegrated', () => {
  it('should render with default props', () => {
    render(<SearchAutocompleteIntegrated />);
    
    expect(screen.getByRole('combobox')).toBeInTheDocument();
    expect(screen.getByPlaceholderText('Busco productos de pinturería...')).toBeInTheDocument();
  });

  it('should integrate with useSearch hook and show suggestions', async () => {
    const mockResponse = {
      success: true,
      data: [
        { 
          id: '1', 
          name: 'Pintura Látex Blanca', 
          category: { name: 'Pinturas' },
          images: { previews: ['/test.jpg'] },
          stock: 10
        },
        { 
          id: '2', 
          name: 'Pintura Esmalte Azul', 
          category: { name: 'Pinturas' },
          images: { previews: ['/test2.jpg'] },
          stock: 5
        },
      ],
      pagination: { total: 2, page: 1, limit: 6, totalPages: 1 },
    };

    mockSearchProducts.mockResolvedValue(mockResponse);

    render(<SearchAutocompleteIntegrated debounceMs={100} />);
    
    const input = screen.getByRole('combobox');
    
    await userEvent.type(input, 'pintura');
    
    // Esperar a que aparezcan las sugerencias
    await waitFor(() => {
      expect(screen.getByText('Pintura Látex Blanca')).toBeInTheDocument();
      expect(screen.getByText('Pintura Esmalte Azul')).toBeInTheDocument();
    }, { timeout: 1000 });

    // Verificar que se llamó a la API
    expect(mockSearchProducts).toHaveBeenCalledWith('pintura', 6);
  });

  it('should execute search on Enter key', async () => {
    const onSearchExecuted = jest.fn();
    const mockResponse = {
      success: true,
      data: [{ id: '1', name: 'Test Product', category: { name: 'Test' } }],
      pagination: { total: 1, page: 1, limit: 12, totalPages: 1 },
    };

    mockSearchProducts.mockResolvedValue(mockResponse);

    render(
      <SearchAutocompleteIntegrated 
        onSearchExecuted={onSearchExecuted}
        debounceMs={100}
      />
    );
    
    const input = screen.getByRole('combobox');
    
    await userEvent.type(input, 'test query');
    await userEvent.keyboard('{Enter}');
    
    await waitFor(() => {
      expect(mockPush).toHaveBeenCalledWith('/search?q=test%20query');
    });
  });

  it('should handle suggestion selection', async () => {
    const onSuggestionSelected = jest.fn();
    const mockResponse = {
      success: true,
      data: [
        { 
          id: '1', 
          name: 'Test Product', 
          category: { name: 'Test Category' },
          images: { previews: ['/test.jpg'] },
          stock: 10
        },
      ],
      pagination: { total: 1, page: 1, limit: 6, totalPages: 1 },
    };

    mockSearchProducts.mockResolvedValue(mockResponse);

    render(
      <SearchAutocompleteIntegrated 
        onSuggestionSelected={onSuggestionSelected}
        debounceMs={100}
      />
    );
    
    const input = screen.getByRole('combobox');
    
    await userEvent.type(input, 'test');
    
    await waitFor(() => {
      expect(screen.getByText('Test Product')).toBeInTheDocument();
    });

    await userEvent.click(screen.getByText('Test Product'));
    
    expect(onSuggestionSelected).toHaveBeenCalledWith(
      expect.objectContaining({
        title: 'Test Product',
        type: 'product'
      })
    );
  });

  it('should clear search when clear button is clicked', async () => {
    render(<SearchAutocompleteIntegrated />);
    
    const input = screen.getByRole('combobox');
    
    await userEvent.type(input, 'test query');
    
    // Buscar el botón de limpiar
    const clearButton = screen.getByLabelText('Clear search');
    await userEvent.click(clearButton);
    
    expect(input).toHaveValue('');
  });

  it('should show loading state during search', async () => {
    // Mock para simular búsqueda lenta
    mockSearchProducts.mockImplementation(() => 
      new Promise(resolve => setTimeout(() => resolve({
        success: true,
        data: [],
        pagination: { total: 0, page: 1, limit: 6, totalPages: 0 },
      }), 1000))
    );

    render(<SearchAutocompleteIntegrated debounceMs={50} />);
    
    const input = screen.getByRole('combobox');
    
    await userEvent.type(input, 'test');
    
    // Verificar que aparece el spinner de carga
    await waitFor(() => {
      const spinner = document.querySelector('.animate-spin');
      expect(spinner).toBeInTheDocument();
    });
  });

  it('should handle API errors gracefully', async () => {
    mockSearchProducts.mockRejectedValue(new Error('API Error'));

    render(<SearchAutocompleteIntegrated debounceMs={50} />);
    
    const input = screen.getByRole('combobox');
    
    await userEvent.type(input, 'test');
    
    await waitFor(() => {
      expect(mockSearchProducts).toHaveBeenCalled();
    });

    // El componente no debería crashear y debería mostrar estado sin resultados
    expect(input).toBeInTheDocument();
  });
});
