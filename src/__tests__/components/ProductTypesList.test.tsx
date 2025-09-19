// ===================================
// PINTEYA E-COMMERCE - TESTS PARA PRODUCT TYPES LIST
// ===================================

import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import ProductTypesList from '@/components/ShopWithSidebar/ProductTypesList';
import { PRODUCT_CATEGORIES } from '@/constants/shop';

// Mock del hook useCategoryData
jest.mock('@/hooks/useCategoryData', () => ({
  useCategoryData: () => ({
    categories: Object.values(PRODUCT_CATEGORIES),
    loading: false,
    error: null,
  })
}));

const mockOnCategorySelect = jest.fn();

const defaultProps = {
  onCategorySelect: mockOnCategorySelect,
  selectedCategory: '',
};

beforeEach(() => {
  mockOnCategorySelect.mockClear();
});

describe('ProductTypesList', () => {
  it('should render component title', () => {
    render(<ProductTypesList {...defaultProps} />);
    
    expect(screen.getByText('Tipos de Productos')).toBeInTheDocument();
  });

  it('should render all product categories', () => {
    render(<ProductTypesList {...defaultProps} />);
    
    Object.values(PRODUCT_CATEGORIES).forEach(category => {
      expect(screen.getByText(category.name)).toBeInTheDocument();
    });
  });

  it('should render category buttons', () => {
    render(<ProductTypesList {...defaultProps} />);
    
    const buttons = screen.getAllByRole('button');
    expect(buttons).toHaveLength(Object.keys(PRODUCT_CATEGORIES).length);
  });

  it('should call onCategorySelect when category is clicked', () => {
    render(<ProductTypesList {...defaultProps} />);
    
    const pinturaButton = screen.getByText('Pinturas');
    fireEvent.click(pinturaButton);
    
    expect(mockOnCategorySelect).toHaveBeenCalledWith('pinturas');
  });

  it('should highlight selected category', () => {
    const propsWithSelected = {
      ...defaultProps,
      selectedCategory: 'pinturas',
    };
    
    render(<ProductTypesList {...propsWithSelected} />);
    
    const pinturaButton = screen.getByText('Pinturas').closest('button');
    expect(pinturaButton).toHaveClass('bg-primary', 'text-white');
  });

  it('should not highlight unselected categories', () => {
    const propsWithSelected = {
      ...defaultProps,
      selectedCategory: 'pinturas',
    };
    
    render(<ProductTypesList {...propsWithSelected} />);
    
    const herramientasButton = screen.getByText('Herramientas').closest('button');
    expect(herramientasButton).not.toHaveClass('bg-primary', 'text-white');
    expect(herramientasButton).toHaveClass('hover:bg-gray-100');
  });

  it('should show category descriptions in title attribute', () => {
    render(<ProductTypesList {...defaultProps} />);
    
    Object.values(PRODUCT_CATEGORIES).forEach(category => {
      const button = screen.getByText(category.name).closest('button');
      expect(button).toHaveAttribute('title', category.description);
    });
  });

  it('should handle multiple category selections', () => {
    render(<ProductTypesList {...defaultProps} />);
    
    const pinturaButton = screen.getByText('Pinturas');
    const herramientasButton = screen.getByText('Herramientas');
    
    fireEvent.click(pinturaButton);
    expect(mockOnCategorySelect).toHaveBeenCalledWith('pinturas');
    
    fireEvent.click(herramientasButton);
    expect(mockOnCategorySelect).toHaveBeenCalledWith('herramientas');
    
    expect(mockOnCategorySelect).toHaveBeenCalledTimes(2);
  });

  it('should render with proper accessibility attributes', () => {
    render(<ProductTypesList {...defaultProps} />);
    
    const buttons = screen.getAllByRole('button');
    buttons.forEach(button => {
      expect(button).toBeInTheDocument();
      expect(button).toHaveAttribute('title');
    });
  });

  it('should handle empty selected category', () => {
    const propsWithEmpty = {
      ...defaultProps,
      selectedCategory: '',
    };
    
    render(<ProductTypesList {...propsWithEmpty} />);
    
    const buttons = screen.getAllByRole('button');
    buttons.forEach(button => {
      expect(button).not.toHaveClass('bg-primary', 'text-white');
    });
  });

  it('should handle invalid selected category', () => {
    const propsWithInvalid = {
      ...defaultProps,
      selectedCategory: 'invalid-category',
    };
    
    render(<ProductTypesList {...propsWithInvalid} />);
    
    const buttons = screen.getAllByRole('button');
    buttons.forEach(button => {
      expect(button).not.toHaveClass('bg-primary', 'text-white');
    });
  });

  it('should maintain consistent styling', () => {
    render(<ProductTypesList {...defaultProps} />);
    
    const container = screen.getByText('Tipos de Productos').closest('div');
    expect(container).toHaveClass('mb-7.5');
    
    const title = screen.getByText('Tipos de Productos');
    expect(title).toHaveClass('font-medium', 'text-dark', 'text-lg', 'mb-4');
    
    const list = screen.getByRole('list', { hidden: true });
    expect(list).toHaveClass('space-y-2');
  });
});









