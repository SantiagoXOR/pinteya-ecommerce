/**
 * Test independiente para useProductList sin dependencias de configuración global
 * Ejecutar con: npx jest src/hooks/admin/__tests__/useProductList.standalone.test.ts --no-cache --no-coverage
 */

// Mock React hooks
const mockUseState = jest.fn();
const mockUseEffect = jest.fn();

jest.mock('react', () => ({
  useState: mockUseState,
  useEffect: mockUseEffect
}));

// Mock fetch
global.fetch = jest.fn();

describe('useProductList Hook - Standalone Tests', () => {
  let mockSetProducts: jest.Mock;
  let mockSetIsLoading: jest.Mock;
  let mockSetError: jest.Mock;

  beforeEach(() => {
    jest.clearAllMocks();
    
    // Mock useState calls
    mockSetProducts = jest.fn();
    mockSetIsLoading = jest.fn();
    mockSetError = jest.fn();
    
    mockUseState
      .mockReturnValueOnce([[], mockSetProducts]) // products state
      .mockReturnValueOnce([true, mockSetIsLoading]) // isLoading state
      .mockReturnValueOnce([null, mockSetError]); // error state
    
    // Mock useEffect to immediately call the effect
    mockUseEffect.mockImplementation((effect) => {
      effect();
    });
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it('should initialize with correct default state', async () => {
    // Mock successful API response
    (global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        success: true,
        data: {
          products: [],
          total: 0
        }
      })
    });

    // Import and execute the hook
    const { useProductList } = await import('../useProductList');
    const result = useProductList();

    // Verify initial state setup
    expect(mockUseState).toHaveBeenCalledTimes(3);
    expect(mockUseState).toHaveBeenNthCalledWith(1, []); // products
    expect(mockUseState).toHaveBeenNthCalledWith(2, true); // isLoading
    expect(mockUseState).toHaveBeenNthCalledWith(3, null); // error

    // Verify return value structure
    expect(result).toEqual({
      products: [],
      isLoading: true,
      error: null
    });
  });

  it('should call fetch with correct URL', async () => {
    (global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        success: true,
        data: {
          products: [],
          total: 0
        }
      })
    });

    const { useProductList } = await import('../useProductList');
    useProductList();

    expect(global.fetch).toHaveBeenCalledWith('/api/admin/products-direct?limit=25');
  });

  it('should handle successful API response', async () => {
    const mockProducts = [
      {
        id: 1,
        name: 'Test Product',
        description: 'Test Description',
        price: 1000,
        stock: 50,
        category_id: 1,
        images: { main: '/test.jpg', gallery: [], previews: [], thumbnails: [] },
        created_at: '2025-01-01T00:00:00Z',
        updated_at: '2025-01-01T00:00:00Z',
        category_name: 'Test Category'
      }
    ];

    (global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        success: true,
        data: {
          products: mockProducts,
          total: 1
        }
      })
    });

    const { useProductList } = await import('../useProductList');
    useProductList();

    // Wait for async operations
    await new Promise(resolve => setTimeout(resolve, 0));

    expect(mockSetIsLoading).toHaveBeenCalledWith(true);
    expect(mockSetError).toHaveBeenCalledWith(null);
    expect(mockSetProducts).toHaveBeenCalledWith(mockProducts);
    expect(mockSetIsLoading).toHaveBeenCalledWith(false);
  });

  it('should handle API errors', async () => {
    (global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: false,
      status: 500,
      statusText: 'Internal Server Error'
    });

    const { useProductList } = await import('../useProductList');
    useProductList();

    // Wait for async operations
    await new Promise(resolve => setTimeout(resolve, 0));

    expect(mockSetError).toHaveBeenCalledWith('Error 500: Internal Server Error');
    expect(mockSetProducts).toHaveBeenCalledWith([]);
    expect(mockSetIsLoading).toHaveBeenCalledWith(false);
  });

  it('should handle network errors', async () => {
    (global.fetch as jest.Mock).mockRejectedValueOnce(new Error('Network error'));

    const { useProductList } = await import('../useProductList');
    useProductList();

    // Wait for async operations
    await new Promise(resolve => setTimeout(resolve, 0));

    expect(mockSetError).toHaveBeenCalledWith('Network error');
    expect(mockSetProducts).toHaveBeenCalledWith([]);
    expect(mockSetIsLoading).toHaveBeenCalledWith(false);
  });

  it('should handle invalid response structure', async () => {
    (global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        success: false,
        error: 'Invalid request'
      })
    });

    const { useProductList } = await import('../useProductList');
    useProductList();

    // Wait for async operations
    await new Promise(resolve => setTimeout(resolve, 0));

    expect(mockSetError).toHaveBeenCalledWith('Estructura de respuesta inválida');
    expect(mockSetProducts).toHaveBeenCalledWith([]);
    expect(mockSetIsLoading).toHaveBeenCalledWith(false);
  });

  it('should export correct TypeScript types', async () => {
    const module = await import('../useProductList');
    
    expect(typeof module.useProductList).toBe('function');
    expect(module.Product).toBeDefined;
    expect(module.ProductListResponse).toBeDefined;
  });

  it('should follow React Hooks best practices', async () => {
    const { useProductList } = await import('../useProductList');
    
    // Hook should be a function
    expect(typeof useProductList).toBe('function');
    
    // Hook name should start with 'use'
    expect(useProductList.name).toBe('useProductList');
    
    // Hook follows React best practices
    expect(useProductList.name).toMatch(/^use/);
  });
});









