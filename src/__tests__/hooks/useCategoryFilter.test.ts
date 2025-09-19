/**
 * useCategoryFilter Hook Tests
 * Enterprise-ready test suite for category filter logic
 * Pinteya E-commerce
 */

import { renderHook, act } from '@testing-library/react';
import { useSearchParams } from 'next/navigation';
import { useCategoryFilter } from '@/hooks/useCategoryFilter';
import type { CategoryChangeEvent } from '@/types/categories';

// Mock Next.js navigation hooks
jest.mock('next/navigation', () => ({
  useSearchParams: jest.fn(),
}));

// Mock analytics
const mockGtag = jest.fn();
Object.defineProperty(window, 'gtag', {
  value: mockGtag,
  writable: true,
});

describe('useCategoryFilter Hook', () => {
  const mockGet = jest.fn();
  const mockOnCategoryChange = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
    
    // Setup search params mock
    (useSearchParams as jest.Mock).mockReturnValue({
      get: mockGet,
      forEach: jest.fn(),
    });

    // Reset analytics mock
    mockGtag.mockClear();
  });

  describe('Initialization', () => {
    it('initializes with empty array by default', () => {
      mockGet.mockReturnValue(null);
      
      const { result } = renderHook(() => useCategoryFilter());
      
      expect(result.current.selectedCategories).toEqual([]);
      expect(result.current.selectedCount).toBe(0);
    });

    it('initializes with provided initial categories', () => {
      mockGet.mockReturnValue(null);
      
      const initialCategories = ['cat1', 'cat2'];
      const { result } = renderHook(() => 
        useCategoryFilter({ 
          initialCategories,
          syncWithUrl: false 
        })
      );
      
      expect(result.current.selectedCategories).toEqual(initialCategories);
      expect(result.current.selectedCount).toBe(2);
    });

    it('initializes from URL when syncWithUrl is enabled', () => {
      const urlCategories = 'cat1,cat2,cat3';
      mockGet.mockReturnValue(urlCategories);
      
      const { result } = renderHook(() => 
        useCategoryFilter({ syncWithUrl: true })
      );
      
      expect(result.current.selectedCategories).toEqual(['cat1', 'cat2', 'cat3']);
      expect(result.current.selectedCount).toBe(3);
    });

    it('filters out empty categories from URL', () => {
      const urlCategories = 'cat1,,cat2,';
      mockGet.mockReturnValue(urlCategories);
      
      const { result } = renderHook(() => 
        useCategoryFilter({ syncWithUrl: true })
      );
      
      expect(result.current.selectedCategories).toEqual(['cat1', 'cat2']);
    });
  });

  describe('Category Selection', () => {
    it('toggles category selection correctly', () => {
      mockGet.mockReturnValue(null);
      
      const { result } = renderHook(() => 
        useCategoryFilter({ 
          syncWithUrl: false,
          onCategoryChange: mockOnCategoryChange 
        })
      );
      
      // Select category
      act(() => {
        result.current.toggleCategory('cat1');
      });
      
      expect(result.current.selectedCategories).toEqual(['cat1']);
      expect(result.current.isSelected('cat1')).toBe(true);
      expect(result.current.selectedCount).toBe(1);
      
      // Verify callback was called
      expect(mockOnCategoryChange).toHaveBeenCalledWith(
        expect.objectContaining({
          type: 'select',
          categoryId: 'cat1',
          selectedCategories: ['cat1'],
          previousCategories: [],
        })
      );
    });

    it('deselects already selected category', () => {
      mockGet.mockReturnValue(null);
      
      const { result } = renderHook(() => 
        useCategoryFilter({ 
          initialCategories: ['cat1'],
          syncWithUrl: false,
          onCategoryChange: mockOnCategoryChange 
        })
      );
      
      // Deselect category
      act(() => {
        result.current.toggleCategory('cat1');
      });
      
      expect(result.current.selectedCategories).toEqual([]);
      expect(result.current.isSelected('cat1')).toBe(false);
      expect(result.current.selectedCount).toBe(0);
      
      // Verify callback was called
      expect(mockOnCategoryChange).toHaveBeenCalledWith(
        expect.objectContaining({
          type: 'deselect',
          categoryId: 'cat1',
          selectedCategories: [],
          previousCategories: ['cat1'],
        })
      );
    });

    it('respects maximum selections limit', () => {
      mockGet.mockReturnValue(null);
      const consoleSpy = jest.spyOn(console, 'warn').mockImplementation();
      
      const { result } = renderHook(() => 
        useCategoryFilter({ 
          maxSelections: 2,
          syncWithUrl: false 
        })
      );
      
      // Select up to limit
      act(() => {
        result.current.toggleCategory('cat1');
        result.current.toggleCategory('cat2');
      });
      
      expect(result.current.selectedCategories).toEqual(['cat1', 'cat2']);
      
      // Try to exceed limit
      act(() => {
        result.current.toggleCategory('cat3');
      });
      
      expect(result.current.selectedCategories).toEqual(['cat1', 'cat2']);
      expect(consoleSpy).toHaveBeenCalledWith('Maximum 2 categories can be selected');
      
      consoleSpy.mockRestore();
    });

    it('checks if category is selected correctly', () => {
      mockGet.mockReturnValue(null);
      
      const { result } = renderHook(() => 
        useCategoryFilter({ 
          initialCategories: ['cat1', 'cat2'],
          syncWithUrl: false 
        })
      );
      
      expect(result.current.isSelected('cat1')).toBe(true);
      expect(result.current.isSelected('cat2')).toBe(true);
      expect(result.current.isSelected('cat3')).toBe(false);
    });
  });

  describe('Bulk Operations', () => {
    it('clears all selections', () => {
      mockGet.mockReturnValue(null);
      
      const { result } = renderHook(() => 
        useCategoryFilter({ 
          initialCategories: ['cat1', 'cat2'],
          syncWithUrl: false,
          onCategoryChange: mockOnCategoryChange 
        })
      );
      
      act(() => {
        result.current.clearAll();
      });
      
      expect(result.current.selectedCategories).toEqual([]);
      expect(result.current.selectedCount).toBe(0);
      
      // Verify callback was called
      expect(mockOnCategoryChange).toHaveBeenCalledWith(
        expect.objectContaining({
          type: 'clear',
          categoryId: undefined,
          selectedCategories: [],
          previousCategories: ['cat1', 'cat2'],
        })
      );
    });

    it('does not call callback when clearing empty selection', () => {
      mockGet.mockReturnValue(null);
      
      const { result } = renderHook(() => 
        useCategoryFilter({ 
          syncWithUrl: false,
          onCategoryChange: mockOnCategoryChange 
        })
      );
      
      act(() => {
        result.current.clearAll();
      });
      
      expect(mockOnCategoryChange).not.toHaveBeenCalled();
    });

    it('selects all provided categories', () => {
      mockGet.mockReturnValue(null);
      
      const { result } = renderHook(() => 
        useCategoryFilter({ 
          syncWithUrl: false,
          onCategoryChange: mockOnCategoryChange 
        })
      );
      
      const categoriesToSelect = ['cat1', 'cat2', 'cat3'];
      
      act(() => {
        result.current.selectAll(categoriesToSelect);
      });
      
      expect(result.current.selectedCategories).toEqual(categoriesToSelect);
      expect(result.current.selectedCount).toBe(3);
      
      // Verify callback was called
      expect(mockOnCategoryChange).toHaveBeenCalledWith(
        expect.objectContaining({
          type: 'selectAll',
          categoryId: undefined,
          selectedCategories: categoriesToSelect,
          previousCategories: [],
        })
      );
    });

    it('respects max selections when selecting all', () => {
      mockGet.mockReturnValue(null);
      const consoleSpy = jest.spyOn(console, 'warn').mockImplementation();
      
      const { result } = renderHook(() => 
        useCategoryFilter({ 
          maxSelections: 2,
          syncWithUrl: false 
        })
      );
      
      const categoriesToSelect = ['cat1', 'cat2', 'cat3', 'cat4'];
      
      act(() => {
        result.current.selectAll(categoriesToSelect);
      });
      
      expect(result.current.selectedCategories).toEqual(['cat1', 'cat2']);
      expect(consoleSpy).toHaveBeenCalledWith('Only first 2 categories will be selected');
      
      consoleSpy.mockRestore();
    });
  });

  describe('Analytics Tracking', () => {
    it('tracks analytics when enabled', () => {
      mockGet.mockReturnValue(null);
      
      const { result } = renderHook(() => 
        useCategoryFilter({ 
          syncWithUrl: false,
          enableAnalytics: true 
        })
      );
      
      act(() => {
        result.current.toggleCategory('cat1');
      });
      
      expect(mockGtag).toHaveBeenCalledWith(
        'event',
        'category_filter_change',
        expect.objectContaining({
          event_category: 'filters',
          event_label: 'cat1',
          value: 1,
        })
      );
    });

    it('does not track analytics when disabled', () => {
      mockGet.mockReturnValue(null);
      
      const { result } = renderHook(() => 
        useCategoryFilter({ 
          syncWithUrl: false,
          enableAnalytics: false 
        })
      );
      
      act(() => {
        result.current.toggleCategory('cat1');
      });
      
      expect(mockGtag).not.toHaveBeenCalled();
    });
  });

  describe('Performance', () => {
    it('maintains referential equality for stable functions', () => {
      mockGet.mockReturnValue(null);
      
      const { result, rerender } = renderHook(() => 
        useCategoryFilter({ syncWithUrl: false })
      );
      
      const firstRender = {
        toggleCategory: result.current.toggleCategory,
        clearAll: result.current.clearAll,
        selectAll: result.current.selectAll,
        isSelected: result.current.isSelected,
      };
      
      rerender();
      
      const secondRender = {
        toggleCategory: result.current.toggleCategory,
        clearAll: result.current.clearAll,
        selectAll: result.current.selectAll,
        isSelected: result.current.isSelected,
      };
      
      // Functions should maintain referential equality
      expect(firstRender.toggleCategory).toBe(secondRender.toggleCategory);
      expect(firstRender.clearAll).toBe(secondRender.clearAll);
      expect(firstRender.selectAll).toBe(secondRender.selectAll);
      expect(firstRender.isSelected).toBe(secondRender.isSelected);
    });
  });

  describe('Edge Cases', () => {
    it('handles invalid URL parameters gracefully', () => {
      mockGet.mockReturnValue('');
      
      const { result } = renderHook(() => 
        useCategoryFilter({ syncWithUrl: true })
      );
      
      expect(result.current.selectedCategories).toEqual([]);
    });

    it('handles null URL parameters', () => {
      mockGet.mockReturnValue(null);
      
      const { result } = renderHook(() => 
        useCategoryFilter({ syncWithUrl: true })
      );
      
      expect(result.current.selectedCategories).toEqual([]);
    });
  });
});









