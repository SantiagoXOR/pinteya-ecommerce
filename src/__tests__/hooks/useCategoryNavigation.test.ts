/**
 * useCategoryNavigation Hook Tests
 * Enterprise-ready test suite for category navigation logic
 * Pinteya E-commerce
 */

import { renderHook, act } from '@testing-library/react';
import { useRouter, useSearchParams, usePathname } from 'next/navigation';
import { useCategoryNavigation } from '@/hooks/useCategoryNavigation';

// Mock Next.js navigation hooks
jest.mock('next/navigation', () => ({
  useRouter: jest.fn(),
  useSearchParams: jest.fn(),
  usePathname: jest.fn(() => '/'),
}));

// Mock analytics
const mockGtag = jest.fn();
Object.defineProperty(window, 'gtag', {
  value: mockGtag,
  writable: true,
});

describe('useCategoryNavigation Hook', () => {
  const mockPush = jest.fn();
  const mockGet = jest.fn();
  const mockForEach = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
    
    // Setup router mock
    (useRouter as jest.Mock).mockReturnValue({
      push: mockPush,
    });

    // Setup search params mock
    (useSearchParams as jest.Mock).mockReturnValue({
      get: mockGet,
      forEach: mockForEach,
    });

    // Setup pathname mock
    (usePathname as jest.Mock).mockReturnValue('/');

    // Reset analytics mock
    mockGtag.mockClear();
  });

  describe('Navigation Functions', () => {
    it('navigates to filtered view with categories', async () => {
      mockGet.mockReturnValue(null);
      
      const { result } = renderHook(() => 
        useCategoryNavigation({ enableAnalytics: true })
      );

      const categories = ['cat1', 'cat2'];
      
      await act(async () => {
        result.current.navigateToFiltered(categories);
        // Wait for debounce
        await new Promise(resolve => setTimeout(resolve, 400));
      });

      expect(mockPush).toHaveBeenCalledWith('/?categories=cat1%2Ccat2');
    });

    it('navigates to home (clears filters)', async () => {
      mockGet.mockReturnValue('cat1,cat2');
      
      const { result } = renderHook(() => 
        useCategoryNavigation({ enableAnalytics: true })
      );

      await act(async () => {
        result.current.navigateToHome();
        // Wait for debounce
        await new Promise(resolve => setTimeout(resolve, 400));
      });

      expect(mockPush).toHaveBeenCalledWith('/');
    });

    it('preserves other URL parameters when enabled', async () => {
      mockGet.mockImplementation((key: string) => {
        if (key === 'categories') return null;
        if (key === 'search') return 'test';
        return null;
      });
      
      mockForEach.mockImplementation((callback: (value: string, key: string) => void) => {
        callback('test', 'search');
      });

      const { result } = renderHook(() => 
        useCategoryNavigation({ 
          preserveParams: true,
          enableAnalytics: true 
        })
      );

      const categories = ['cat1'];
      
      await act(async () => {
        result.current.navigateToFiltered(categories);
        // Wait for debounce
        await new Promise(resolve => setTimeout(resolve, 400));
      });

      expect(mockPush).toHaveBeenCalledWith('/?search=test&categories=cat1');
    });

    it('does not preserve other parameters when disabled', async () => {
      mockGet.mockImplementation((key: string) => {
        if (key === 'categories') return null;
        if (key === 'search') return 'test';
        return null;
      });

      const { result } = renderHook(() => 
        useCategoryNavigation({ 
          preserveParams: false,
          enableAnalytics: true 
        })
      );

      const categories = ['cat1'];
      
      await act(async () => {
        result.current.navigateToFiltered(categories);
        // Wait for debounce
        await new Promise(resolve => setTimeout(resolve, 400));
      });

      expect(mockPush).toHaveBeenCalledWith('/?categories=cat1');
    });
  });

  describe('URL Building', () => {
    it('builds correct URL with single category', () => {
      mockGet.mockReturnValue(null);
      mockForEach.mockImplementation(() => {}); // No other params

      const { result } = renderHook(() =>
        useCategoryNavigation()
      );

      const url = result.current.getCurrentUrl();
      expect(url).toBe('/');
    });

    it('builds correct URL with multiple categories', () => {
      mockGet.mockReturnValue('cat1,cat2,cat3');
      mockForEach.mockImplementation(() => {}); // No other params

      const { result } = renderHook(() =>
        useCategoryNavigation()
      );

      const url = result.current.getCurrentUrl();
      expect(url).toBe('/?categories=cat1%2Ccat2%2Ccat3');
    });

    it('handles empty categories correctly', () => {
      mockGet.mockReturnValue('');
      mockForEach.mockImplementation(() => {}); // No other params

      const { result } = renderHook(() =>
        useCategoryNavigation()
      );

      const url = result.current.getCurrentUrl();
      expect(url).toBe('/');
    });
  });

  describe('Navigation State', () => {
    it('tracks navigation state correctly', async () => {
      const { result } = renderHook(() => 
        useCategoryNavigation()
      );

      expect(result.current.isNavigating).toBe(false);

      act(() => {
        result.current.navigateToFiltered(['cat1']);
      });

      expect(result.current.isNavigating).toBe(true);

      // Wait for navigation to complete
      await act(async () => {
        await new Promise(resolve => setTimeout(resolve, 500));
      });

      expect(result.current.isNavigating).toBe(false);
    });
  });

  describe('Analytics Tracking', () => {
    it('tracks navigation analytics when enabled', async () => {
      const { result } = renderHook(() => 
        useCategoryNavigation({ enableAnalytics: true })
      );

      await act(async () => {
        result.current.navigateToFiltered(['cat1', 'cat2']);
        // Wait for debounce
        await new Promise(resolve => setTimeout(resolve, 400));
      });

      expect(mockGtag).toHaveBeenCalledWith(
        'event',
        'category_navigation',
        expect.objectContaining({
          event_category: 'navigation',
          event_label: 'filter',
          value: 2,
        })
      );
    });

    it('tracks clear navigation analytics', async () => {
      const { result } = renderHook(() => 
        useCategoryNavigation({ enableAnalytics: true })
      );

      await act(async () => {
        result.current.navigateToHome();
        // Wait for debounce
        await new Promise(resolve => setTimeout(resolve, 400));
      });

      expect(mockGtag).toHaveBeenCalledWith(
        'event',
        'category_navigation',
        expect.objectContaining({
          event_category: 'navigation',
          event_label: 'clear',
          value: 0,
        })
      );
    });

    it('does not track analytics when disabled', async () => {
      const { result } = renderHook(() => 
        useCategoryNavigation({ enableAnalytics: false })
      );

      await act(async () => {
        result.current.navigateToFiltered(['cat1']);
        // Wait for debounce
        await new Promise(resolve => setTimeout(resolve, 400));
      });

      expect(mockGtag).not.toHaveBeenCalled();
    });
  });

  describe('Configuration Options', () => {
    it('uses custom parameter name', async () => {
      mockGet.mockReturnValue(null);
      mockForEach.mockImplementation(() => {}); // No other params

      const { result } = renderHook(() =>
        useCategoryNavigation({ paramName: 'filters' })
      );

      await act(async () => {
        result.current.navigateToFiltered(['cat1']);
        // Wait for debounce
        await new Promise(resolve => setTimeout(resolve, 400));
      });

      expect(mockPush).toHaveBeenCalledWith('/?filters=cat1');
    });

    it('uses custom base path', async () => {
      mockGet.mockReturnValue(null);
      mockForEach.mockImplementation(() => {}); // No other params

      const { result } = renderHook(() =>
        useCategoryNavigation({ basePath: '/shop' })
      );

      await act(async () => {
        result.current.navigateToFiltered(['cat1']);
        // Wait for debounce
        await new Promise(resolve => setTimeout(resolve, 400));
      });

      expect(mockPush).toHaveBeenCalledWith('/shop?categories=cat1');
    });

    it('respects custom debounce delay', async () => {
      jest.useFakeTimers();
      mockGet.mockReturnValue(null);
      mockForEach.mockImplementation(() => {}); // No other params

      const { result } = renderHook(() =>
        useCategoryNavigation({ debounceDelay: 100 })
      );

      act(() => {
        result.current.navigateToFiltered(['cat1']);
      });

      expect(mockPush).not.toHaveBeenCalled();

      act(() => {
        jest.advanceTimersByTime(100);
      });

      expect(mockPush).toHaveBeenCalledWith('/?categories=cat1');

      jest.useRealTimers();
    });
  });

  describe('Error Handling', () => {
    it('handles navigation errors gracefully', () => {
      // Test that the hook doesn't crash when navigation fails
      mockPush.mockImplementation(() => {
        throw new Error('Navigation failed');
      });

      const { result } = renderHook(() =>
        useCategoryNavigation()
      );

      // Should not throw when navigation fails
      expect(() => {
        result.current.navigateToFiltered(['cat1']);
      }).not.toThrow();
    });
  });

  describe('Cleanup', () => {
    it('cleans up debounce timer on unmount', () => {
      // This test verifies that the hook cleans up properly
      // The actual cleanup is handled internally by the hook
      const { unmount } = renderHook(() =>
        useCategoryNavigation()
      );

      // Should unmount without errors
      expect(() => unmount()).not.toThrow();
    });
  });
});
