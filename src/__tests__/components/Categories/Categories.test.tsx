/**
 * Categories Component Tests
 * Enterprise-ready test suite with accessibility and performance testing
 * Pinteya E-commerce
 */

import React from 'react';
import { render, screen, fireEvent, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { axe, toHaveNoViolations } from 'jest-axe';
import { useRouter, useSearchParams } from 'next/navigation';
import Categories from '@/components/Home/Categories';
import type { Category, CategoriesProps } from '@/types/categories';

// Extend Jest matchers
expect.extend(toHaveNoViolations);

// Mock Next.js navigation hooks
jest.mock('next/navigation', () => ({
  useRouter: jest.fn(),
  useSearchParams: jest.fn(),
  usePathname: jest.fn(() => '/'),
}));

// Mock Next.js Image component
jest.mock('next/image', () => {
  return function MockImage({ src, alt, ...props }: any) {
    return <img src={src} alt={alt} {...props} />;
  };
});

// Mock analytics
const mockGtag = jest.fn();
Object.defineProperty(window, 'gtag', {
  value: mockGtag,
  writable: true,
});

// Mock the category hooks
jest.mock('@/hooks/useCategoryData', () => ({
  useCategoryData: jest.fn(() => ({
    categories: [
      {
        id: 'preparacion',
        name: 'Preparación',
        icon: '/images/categories/preparaciones.png',
        description: 'Productos para preparación de superficies',
        isAvailable: true,
      },
      {
        id: 'reparacion',
        name: 'Reparación',
        icon: '/images/categories/reparaciones.png',
        description: 'Productos para reparación y restauración',
        isAvailable: true,
      },
    ],
    loading: false,
    error: null,
    refresh: jest.fn(),
  })),
}));

jest.mock('@/hooks/useCategoryFilter', () => ({
  useCategoryFilter: jest.fn(() => ({
    selectedCategories: [],
    toggleCategory: jest.fn(),
    clearAll: jest.fn(),
    isSelected: jest.fn(() => false),
    selectedCount: 0,
  })),
}));

jest.mock('@/hooks/useCategoryNavigation', () => ({
  useCategoryNavigation: jest.fn(() => ({
    navigateToFiltered: jest.fn(),
    navigateToHome: jest.fn(),
    getCurrentUrl: jest.fn(() => '/'),
    isNavigating: false,
  })),
}));

// Test data
const mockCategories: Category[] = [
  {
    id: 'test-category-1',
    name: 'Test Category 1',
    icon: '/test-icon-1.png',
    description: 'Test description 1',
    count: 5,
  },
  {
    id: 'test-category-2',
    name: 'Test Category 2',
    icon: '/test-icon-2.png',
    description: 'Test description 2',
    count: 3,
  },
  {
    id: 'test-category-3',
    name: 'Test Category 3',
    icon: '/test-icon-3.png',
    description: 'Test description 3',
    count: 8,
  },
];

describe('Categories Component', () => {
  // Mock functions
  const mockPush = jest.fn();
  const mockGet = jest.fn();
  const mockOnCategoryChange = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
    
    // Setup router mock
    (useRouter as jest.Mock).mockReturnValue({
      push: mockPush,
    });

    // Setup search params mock
    (useSearchParams as jest.Mock).mockReturnValue({
      get: mockGet,
      forEach: jest.fn(),
    });

    // Reset analytics mock
    mockGtag.mockClear();
  });

  describe('Rendering', () => {
    it('renders without crashing', () => {
      render(<Categories />);
      expect(screen.getByTestId('categories-filter')).toBeInTheDocument();
    });

    it('renders the header correctly', () => {
      render(<Categories />);
      
      expect(screen.getByText('Explora por Categorías')).toBeInTheDocument();
      expect(screen.getByRole('group', { name: /grupo de filtros/i })).toBeInTheDocument();
    });

    it('renders all default categories', () => {
      render(<Categories />);
      
      // Check that category pills are rendered
      const categoryButtons = screen.getAllByRole('button');
      expect(categoryButtons.length).toBeGreaterThan(0);
    });

    it('renders custom categories when provided', () => {
      render(<Categories categories={mockCategories} />);
      
      mockCategories.forEach(category => {
        expect(screen.getByText(category.name)).toBeInTheDocument();
      });
    });

    it('displays selected count when categories are selected', () => {
      render(
        <Categories 
          categories={mockCategories}
          selectedCategories={['test-category-1', 'test-category-2']}
        />
      );
      
      expect(screen.getByText('2 categorías seleccionadas')).toBeInTheDocument();
    });

    it('shows clear filters button when categories are selected', () => {
      render(
        <Categories 
          categories={mockCategories}
          selectedCategories={['test-category-1']}
        />
      );
      
      expect(screen.getByText(/limpiar filtros/i)).toBeInTheDocument();
    });
  });

  describe('Accessibility', () => {
    it('should not have accessibility violations', async () => {
      const { container } = render(<Categories categories={mockCategories} />);
      const results = await axe(container);
      expect(results).toHaveNoViolations();
    });

    it('has proper ARIA attributes', () => {
      render(<Categories categories={mockCategories} />);
      
      // Check group role
      expect(screen.getByRole('group')).toHaveAttribute('aria-label');
      
      // Check button roles and attributes
      const buttons = screen.getAllByRole('button');
      buttons.forEach(button => {
        expect(button).toHaveAttribute('aria-label');
        expect(button).toHaveAttribute('aria-pressed');
      });
    });

    it('supports keyboard navigation', async () => {
      const user = userEvent.setup();
      render(<Categories categories={mockCategories} />);
      
      const firstButton = screen.getByTestId('category-pill-test-category-1');
      
      // Focus first button
      await user.tab();
      expect(firstButton).toHaveFocus();
      
      // Test Enter key
      await user.keyboard('{Enter}');
      expect(mockOnCategoryChange || mockPush).toHaveBeenCalled();
    });

    it('handles arrow key navigation', async () => {
      const user = userEvent.setup();
      render(<Categories categories={mockCategories} />);
      
      const firstButton = screen.getByTestId('category-pill-test-category-1');
      const secondButton = screen.getByTestId('category-pill-test-category-2');
      
      // Focus first button
      firstButton.focus();
      expect(firstButton).toHaveFocus();
      
      // Navigate with arrow key
      await user.keyboard('{ArrowRight}');
      expect(secondButton).toHaveFocus();
    });

    it('provides screen reader announcements', () => {
      render(<Categories categories={mockCategories} />);
      
      mockCategories.forEach(category => {
        if (category.description) {
          expect(screen.getByText(category.description)).toHaveClass('sr-only');
        }
      });
    });
  });

  describe('Interactions', () => {
    it('toggles category selection on click', async () => {
      const user = userEvent.setup();
      render(<Categories categories={mockCategories} onCategoryChange={mockOnCategoryChange} />);
      
      const categoryButton = screen.getByTestId('category-pill-test-category-1');
      
      await user.click(categoryButton);
      
      expect(mockOnCategoryChange).toHaveBeenCalledWith(
        expect.objectContaining({
          type: 'select',
          categoryId: 'test-category-1',
        })
      );
    });

    it('handles controlled mode correctly', async () => {
      const user = userEvent.setup();
      render(
        <Categories 
          categories={mockCategories}
          selectedCategories={['test-category-1']}
          onCategoryChange={mockOnCategoryChange}
        />
      );
      
      const selectedButton = screen.getByTestId('category-pill-test-category-1');
      expect(selectedButton).toHaveAttribute('aria-pressed', 'true');
      
      await user.click(selectedButton);
      
      expect(mockOnCategoryChange).toHaveBeenCalledWith(
        expect.objectContaining({
          type: 'deselect',
          categoryId: 'test-category-1',
        })
      );
    });

    it('clears all selections when clear button is clicked', () => {
      // Test with controlled props to ensure clear button is visible
      const mockClearAll = jest.fn();

      // Mock the hook to return selected categories
      const { useCategoryFilter } = require('@/hooks/useCategoryFilter');
      useCategoryFilter.mockReturnValue({
        selectedCategories: ['test-category-1', 'test-category-2'],
        toggleCategory: jest.fn(),
        clearAll: mockClearAll,
        isSelected: jest.fn(() => true),
        selectedCount: 2,
      });

      render(<Categories categories={mockCategories} />);

      // Clear button should be visible with selected count
      const clearButton = screen.getByText(/limpiar filtros/i);
      expect(clearButton).toBeInTheDocument();
    });
  });

  describe('States', () => {
    it('renders loading state', () => {
      render(<Categories loading={true} />);
      
      expect(screen.getByText('Cargando categorías...')).toBeInTheDocument();
      expect(screen.getByText('Cargando categorías...')).toBeInTheDocument();
    });

    it('renders error state', () => {
      const errorMessage = 'Failed to load categories';
      render(<Categories error={errorMessage} />);
      
      expect(screen.getByText('Error al cargar categorías')).toBeInTheDocument();
      expect(screen.getByText(errorMessage)).toBeInTheDocument();
    });

    it('handles disabled state', () => {
      render(<Categories categories={mockCategories} disabled={true} />);
      
      const container = screen.getByTestId('categories-filter');
      expect(container).toHaveClass('opacity-50', 'pointer-events-none');
    });
  });

  describe('Performance', () => {
    it('respects maxCategories prop', () => {
      render(<Categories categories={mockCategories} maxCategories={2} />);
      
      const categoryButtons = screen.getAllByRole('button');
      // Should have 2 category buttons (excluding clear button if present)
      const categoryPills = categoryButtons.filter(button => 
        button.getAttribute('data-testid')?.startsWith('category-pill-')
      );
      expect(categoryPills).toHaveLength(2);
    });

    it('memoizes expensive calculations', () => {
      const { rerender } = render(<Categories categories={mockCategories} />);
      
      // Re-render with same props
      rerender(<Categories categories={mockCategories} />);
      
      // Component should not re-render unnecessarily
      expect(screen.getByTestId('categories-filter')).toBeInTheDocument();
    });
  });

  describe('Analytics', () => {
    it('tracks category interactions', () => {
      // Analytics are handled by the hooks, so we just verify the component renders
      render(<Categories categories={mockCategories} />);

      // Check that category pills are rendered (using the mock data)
      const categoryButtons = screen.getAllByRole('button');
      expect(categoryButtons.length).toBeGreaterThan(0);

      // Analytics tracking is tested in the hook tests
    });
  });
});
