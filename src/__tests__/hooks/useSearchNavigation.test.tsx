// ===================================
// TESTS: useSearchNavigation Hook - Navegación optimizada para búsquedas
// ===================================

import { renderHook, act } from '@testing-library/react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useSearchNavigation } from '@/hooks/useSearchNavigation';

// ===================================
// MOCKS
// ===================================

// Mock Next.js router
jest.mock('next/navigation', () => ({
  useRouter: jest.fn(),
  useSearchParams: jest.fn(),
}));

// Mock window.scrollTo
Object.defineProperty(window, 'scrollTo', {
  value: jest.fn(),
  writable: true,
});

// ===================================
// SETUP
// ===================================

const mockPush = jest.fn();
const mockReplace = jest.fn();
const mockPrefetch = jest.fn();
const mockUseRouter = useRouter as jest.MockedFunction<typeof useRouter>;
const mockUseSearchParams = useSearchParams as jest.MockedFunction<typeof useSearchParams>;

const mockSearchParams = {
  get: jest.fn(),
  forEach: jest.fn(),
  toString: jest.fn(() => ''),
};

beforeEach(() => {
  jest.clearAllMocks();
  
  mockUseRouter.mockReturnValue({
    push: mockPush,
    replace: mockReplace,
    prefetch: mockPrefetch,
  } as any);
  
  mockUseSearchParams.mockReturnValue(mockSearchParams as any);
  
  // Reset window.scrollTo mock
  (window.scrollTo as jest.Mock).mockClear();
});

// ===================================
// TESTS
// ===================================

describe('useSearchNavigation Hook', () => {
  it('should navigate to search with query', () => {
    const { result } = renderHook(() => useSearchNavigation());

    act(() => {
      result.current.navigateToSearch('pintura roja');
    });

    expect(mockPush).toHaveBeenCalledWith('/search?q=pintura+roja');
  });

  it('should navigate to search with query and category', () => {
    const { result } = renderHook(() => useSearchNavigation());

    act(() => {
      result.current.navigateToSearch('pintura', 'pinturas');
    });

    expect(mockPush).toHaveBeenCalledWith('/search?q=pintura&category=pinturas');
  });

  it('should navigate to search with additional parameters', () => {
    const { result } = renderHook(() => useSearchNavigation());

    act(() => {
      result.current.navigateToSearch('pintura', undefined, { 
        sort: 'price',
        brand: 'sherwin' 
      });
    });

    expect(mockPush).toHaveBeenCalledWith('/search?q=pintura&sort=price&brand=sherwin');
  });

  it('should use replace instead of push when configured', () => {
    const { result } = renderHook(() => useSearchNavigation({ replace: true }));

    act(() => {
      result.current.navigateToSearch('test query');
    });

    expect(mockReplace).toHaveBeenCalledWith('/search?q=test+query');
    expect(mockPush).not.toHaveBeenCalled();
  });

  it('should preserve existing parameters when configured', () => {
    mockSearchParams.get.mockImplementation((key) => {
      if (key === 'sort') {return 'price';}
      if (key === 'brand') {return 'sherwin';}
      return null;
    });

    mockSearchParams.forEach.mockImplementation((callback) => {
      callback('price', 'sort');
      callback('sherwin', 'brand');
    });

    const { result } = renderHook(() => useSearchNavigation({ 
      preserveParams: true 
    }));

    act(() => {
      result.current.navigateToSearch('nueva busqueda');
    });

    expect(mockPush).toHaveBeenCalledWith('/search?q=nueva+busqueda&sort=price&brand=sherwin');
  });

  it('should scroll to top when configured', () => {
    jest.useFakeTimers();
    
    const { result } = renderHook(() => useSearchNavigation({ 
      scrollToTop: true 
    }));

    act(() => {
      result.current.navigateToSearch('test');
    });

    // Fast-forward timers
    act(() => {
      jest.advanceTimersByTime(100);
    });

    expect(window.scrollTo).toHaveBeenCalledWith({ 
      top: 0, 
      behavior: 'smooth' 
    });

    jest.useRealTimers();
  });

  it('should call navigation callbacks', () => {
    const onBeforeNavigate = jest.fn();
    const onAfterNavigate = jest.fn();

    const { result } = renderHook(() => useSearchNavigation({
      onBeforeNavigate,
      onAfterNavigate,
    }));

    act(() => {
      result.current.navigateToSearch('test');
    });

    expect(onBeforeNavigate).toHaveBeenCalledWith('/search?q=test');
    expect(onAfterNavigate).toHaveBeenCalledWith('/search?q=test');
  });

  it('should navigate to product', () => {
    const { result } = renderHook(() => useSearchNavigation());

    act(() => {
      result.current.navigateToProduct('123');
    });

    expect(mockPush).toHaveBeenCalledWith('/products/123');
  });

  it('should navigate to product with slug', () => {
    const { result } = renderHook(() => useSearchNavigation());

    act(() => {
      result.current.navigateToProduct('123', 'pintura-sherwin-williams');
    });

    expect(mockPush).toHaveBeenCalledWith('/products/pintura-sherwin-williams');
  });

  it('should navigate to category', () => {
    const { result } = renderHook(() => useSearchNavigation());

    act(() => {
      result.current.navigateToCategory('pinturas');
    });

    expect(mockPush).toHaveBeenCalledWith('/shop?category=pinturas');
  });

  it('should navigate to category with slug', () => {
    const { result } = renderHook(() => useSearchNavigation());

    act(() => {
      result.current.navigateToCategory('pinturas', 'pinturas-interiores');
    });

    expect(mockPush).toHaveBeenCalledWith('/shop/pinturas-interiores');
  });

  it('should prefetch search page', () => {
    const { result } = renderHook(() => useSearchNavigation());

    act(() => {
      result.current.prefetchSearch('pintura');
    });

    expect(mockPrefetch).toHaveBeenCalledWith('/search?q=pintura');
  });

  it('should prefetch product page', () => {
    const { result } = renderHook(() => useSearchNavigation());

    act(() => {
      result.current.prefetchProduct('123');
    });

    expect(mockPrefetch).toHaveBeenCalledWith('/products/123');
  });

  it('should get current search query', () => {
    mockSearchParams.get.mockImplementation((key) => {
      if (key === 'q') {return 'current search';}
      return null;
    });

    const { result } = renderHook(() => useSearchNavigation());

    const query = result.current.getCurrentSearchQuery();
    expect(query).toBe('current search');
  });

  it('should get current category', () => {
    mockSearchParams.get.mockImplementation((key) => {
      if (key === 'category') {return 'pinturas';}
      return null;
    });

    const { result } = renderHook(() => useSearchNavigation());

    const category = result.current.getCurrentCategory();
    expect(category).toBe('pinturas');
  });

  it('should build search URL correctly', () => {
    const { result } = renderHook(() => useSearchNavigation());

    const url = result.current.buildSearchUrl('test query', 'pinturas', {
      sort: 'price',
      brand: 'sherwin'
    });

    expect(url).toBe('/search?q=test+query&category=pinturas&sort=price&brand=sherwin');
  });

  it('should not include category "all" in URL', () => {
    const { result } = renderHook(() => useSearchNavigation());

    const url = result.current.buildSearchUrl('test', 'all');
    expect(url).toBe('/search?q=test');
  });

  it('should handle empty query gracefully', () => {
    const { result } = renderHook(() => useSearchNavigation());

    act(() => {
      result.current.navigateToSearch('');
    });

    // Should not navigate with empty query
    expect(mockPush).not.toHaveBeenCalled();
  });

  it('should handle whitespace-only query', () => {
    const { result } = renderHook(() => useSearchNavigation());

    act(() => {
      result.current.navigateToSearch('   ');
    });

    // Should not navigate with whitespace-only query
    expect(mockPush).not.toHaveBeenCalled();
  });
});









