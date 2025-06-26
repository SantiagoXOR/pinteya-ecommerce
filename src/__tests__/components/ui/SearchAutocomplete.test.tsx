import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { useRouter } from 'next/navigation';
import { SearchAutocomplete, type SearchSuggestion } from '@/components/ui/search-autocomplete';
import { searchProducts } from '@/lib/api/products';

// Mock Next.js router
const mockPush = jest.fn();
jest.mock('next/navigation', () => ({
  useRouter: () => ({
    push: mockPush,
  }),
}));

// Mock API
jest.mock('@/lib/api/products', () => ({
  searchProducts: jest.fn(),
}));

const mockSearchProducts = searchProducts as jest.MockedFunction<typeof searchProducts>;

// Mock localStorage
const localStorageMock = {
  getItem: jest.fn(),
  setItem: jest.fn(),
  removeItem: jest.fn(),
  clear: jest.fn(),
};
Object.defineProperty(window, 'localStorage', {
  value: localStorageMock,
});

describe('SearchAutocomplete', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    localStorageMock.getItem.mockReturnValue(null);
  });

  it('renders with default placeholder', () => {
    render(<SearchAutocomplete />);
    
    expect(screen.getByPlaceholderText('Busco productos de pinturería...')).toBeInTheDocument();
  });

  it('renders with custom placeholder', () => {
    render(<SearchAutocomplete placeholder="Buscar productos..." />);
    
    expect(screen.getByPlaceholderText('Buscar productos...')).toBeInTheDocument();
  });

  it('shows trending searches when focused without query', async () => {
    const user = userEvent.setup();
    render(<SearchAutocomplete showTrendingSearches={true} />);
    
    const input = screen.getByPlaceholderText('Busco productos de pinturería...');
    await user.click(input);

    await waitFor(() => {
      expect(screen.getByText('Búsquedas populares')).toBeInTheDocument();
      expect(screen.getByText('Pintura látex')).toBeInTheDocument();
      expect(screen.getByText('Sherwin Williams')).toBeInTheDocument();
    });
  });

  it('shows recent searches when available', async () => {
    const user = userEvent.setup();
    const recentSearches = ['pintura blanca', 'rodillos'];
    localStorageMock.getItem.mockReturnValue(JSON.stringify(recentSearches));
    
    render(<SearchAutocomplete showRecentSearches={true} />);
    
    const input = screen.getByPlaceholderText('Busco productos de pinturería...');
    await user.click(input);

    await waitFor(() => {
      expect(screen.getByText('Búsquedas recientes')).toBeInTheDocument();
      expect(screen.getByText('pintura blanca')).toBeInTheDocument();
      expect(screen.getByText('rodillos')).toBeInTheDocument();
    });
  });

  it('searches products when typing', async () => {
    const user = userEvent.setup();
    const mockProducts = [
      {
        id: '1',
        name: 'Pintura Látex Blanca',
        category: { name: 'Pinturas' },
        image_url: '/test-image.jpg',
        stock: 10,
      },
    ];

    mockSearchProducts.mockResolvedValue({
      success: true,
      data: mockProducts,
    });

    render(<SearchAutocomplete debounceMs={100} />);
    
    const input = screen.getByPlaceholderText('Busco productos de pinturería...');
    await user.type(input, 'pintura');

    await waitFor(() => {
      expect(mockSearchProducts).toHaveBeenCalledWith('pintura', 6);
    }, { timeout: 500 });

    await waitFor(() => {
      expect(screen.getByText('Productos')).toBeInTheDocument();
      expect(screen.getByText('Pintura Látex Blanca')).toBeInTheDocument();
      expect(screen.getByText('Pinturas')).toBeInTheDocument();
    });
  });

  it('handles API errors gracefully', async () => {
    const user = userEvent.setup();
    mockSearchProducts.mockRejectedValue(new Error('API Error'));

    render(<SearchAutocomplete debounceMs={100} />);
    
    const input = screen.getByPlaceholderText('Busco productos de pinturería...');
    await user.type(input, 'test');

    await waitFor(() => {
      expect(mockSearchProducts).toHaveBeenCalled();
    }, { timeout: 500 });

    // Should not crash and should clear suggestions
    expect(screen.queryByText('Productos')).not.toBeInTheDocument();
  });

  it('navigates to product when suggestion is clicked', async () => {
    const user = userEvent.setup();
    const mockProducts = [
      {
        id: '1',
        name: 'Pintura Test',
        category: { name: 'Pinturas' },
        image_url: '/test.jpg',
        stock: 5,
      },
    ];

    mockSearchProducts.mockResolvedValue({
      success: true,
      data: mockProducts,
    });

    render(<SearchAutocomplete debounceMs={100} />);
    
    const input = screen.getByPlaceholderText('Busco productos de pinturería...');
    await user.type(input, 'pintura');

    await waitFor(() => {
      expect(screen.getByText('Pintura Test')).toBeInTheDocument();
    });

    await user.click(screen.getByText('Pintura Test'));

    expect(mockPush).toHaveBeenCalledWith('/product/1');
  });

  it('submits search on Enter key', async () => {
    const user = userEvent.setup();
    render(<SearchAutocomplete />);
    
    const input = screen.getByPlaceholderText('Busco productos de pinturería...');
    await user.type(input, 'test search');
    await user.keyboard('{Enter}');

    expect(mockPush).toHaveBeenCalledWith('/shop?search=test%20search');
  });

  it('saves recent searches', async () => {
    const user = userEvent.setup();
    render(<SearchAutocomplete showRecentSearches={true} />);
    
    const input = screen.getByPlaceholderText('Busco productos de pinturería...');
    await user.type(input, 'test search');
    await user.keyboard('{Enter}');

    expect(localStorageMock.setItem).toHaveBeenCalledWith(
      'pinteya-recent-searches',
      JSON.stringify(['test search'])
    );
  });

  it('clears input when X button is clicked', async () => {
    const user = userEvent.setup();
    render(<SearchAutocomplete />);
    
    const input = screen.getByPlaceholderText('Busco productos de pinturería...');
    await user.type(input, 'test');

    const clearButton = screen.getByRole('button', { name: /clear/i });
    await user.click(clearButton);

    expect(input).toHaveValue('');
  });

  it('handles keyboard navigation', async () => {
    const user = userEvent.setup();
    const mockProducts = [
      {
        id: '1',
        name: 'Product 1',
        category: { name: 'Category' },
        stock: 5,
      },
      {
        id: '2',
        name: 'Product 2',
        category: { name: 'Category' },
        stock: 3,
      },
    ];

    mockSearchProducts.mockResolvedValue({
      success: true,
      data: mockProducts,
    });

    render(<SearchAutocomplete debounceMs={100} showTrendingSearches={false} showRecentSearches={false} />);

    const input = screen.getByPlaceholderText('Busco productos de pinturería...');
    await user.type(input, 'product');

    await waitFor(() => {
      expect(screen.getByText('Product 1')).toBeInTheDocument();
    });

    // Navigate down to first product
    await user.keyboard('{ArrowDown}');

    // Select with Enter
    await user.keyboard('{Enter}');

    expect(mockPush).toHaveBeenCalledWith('/product/1');
  });

  it('closes dropdown on Escape key', async () => {
    const user = userEvent.setup();
    render(<SearchAutocomplete />);
    
    const input = screen.getByPlaceholderText('Busco productos de pinturería...');
    await user.click(input);

    await waitFor(() => {
      expect(screen.getByText('Búsquedas populares')).toBeInTheDocument();
    });

    await user.keyboard('{Escape}');

    await waitFor(() => {
      expect(screen.queryByText('Búsquedas populares')).not.toBeInTheDocument();
    });
  });

  it('respects maxSuggestions prop', async () => {
    const user = userEvent.setup();
    const mockProducts = Array.from({ length: 10 }, (_, i) => ({
      id: `${i + 1}`,
      name: `Product ${i + 1}`,
      category: { name: 'Category' },
      stock: 5,
    }));

    mockSearchProducts.mockResolvedValue({
      success: true,
      data: mockProducts,
    });

    render(<SearchAutocomplete maxSuggestions={3} debounceMs={100} />);
    
    const input = screen.getByPlaceholderText('Busco productos de pinturería...');
    await user.type(input, 'product');

    await waitFor(() => {
      expect(screen.getByText('Product 1')).toBeInTheDocument();
      expect(screen.getByText('Product 2')).toBeInTheDocument();
      expect(screen.getByText('Product 3')).toBeInTheDocument();
      expect(screen.queryByText('Product 4')).not.toBeInTheDocument();
    });
  });

  it('calls custom onSearch callback', async () => {
    const user = userEvent.setup();
    const onSearch = jest.fn();
    
    render(<SearchAutocomplete onSearch={onSearch} />);
    
    const input = screen.getByPlaceholderText('Busco productos de pinturería...');
    await user.type(input, 'test search');
    await user.keyboard('{Enter}');

    expect(onSearch).toHaveBeenCalledWith('test search');
    expect(mockPush).not.toHaveBeenCalled();
  });

  it('calls custom onSuggestionSelect callback', async () => {
    const user = userEvent.setup();
    const onSuggestionSelect = jest.fn();
    
    render(<SearchAutocomplete onSuggestionSelect={onSuggestionSelect} showTrendingSearches={true} />);
    
    const input = screen.getByPlaceholderText('Busco productos de pinturería...');
    await user.click(input);

    await waitFor(() => {
      expect(screen.getByText('Pintura látex')).toBeInTheDocument();
    });

    await user.click(screen.getByText('Pintura látex'));

    expect(onSuggestionSelect).toHaveBeenCalledWith(
      expect.objectContaining({
        title: 'Pintura látex',
        type: 'trending',
      })
    );
    expect(mockPush).not.toHaveBeenCalled();
  });
});
