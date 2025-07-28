/**
 * CategoryPill Component Tests
 * Enterprise-ready test suite with accessibility focus
 * Pinteya E-commerce
 */

import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { axe, toHaveNoViolations } from 'jest-axe';
import CategoryPill from '@/components/Home/Categories/CategoryPill';
import type { Category, CategoryPillProps } from '@/types/categories';

// Extend Jest matchers
expect.extend(toHaveNoViolations);

// Mock Next.js Image component
jest.mock('next/image', () => {
  return function MockImage({ src, alt, onError, ...props }: any) {
    return (
      <img 
        src={src} 
        alt={alt} 
        onError={onError}
        data-testid="category-icon"
        {...props} 
      />
    );
  };
});

// Test data
const mockCategory: Category = {
  id: 'test-category',
  name: 'Test Category',
  icon: '/test-icon.png',
  description: 'Test category description',
  count: 5,
};

const defaultProps: CategoryPillProps = {
  category: mockCategory,
  isSelected: false,
  onClick: jest.fn(),
  size: 'md',
  disabled: false,
};

describe('CategoryPill Component', () => {
  const mockOnClick = jest.fn();
  const mockOnKeyDown = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Rendering', () => {
    it('renders without crashing', () => {
      render(<CategoryPill {...defaultProps} onClick={mockOnClick} />);
      expect(screen.getByRole('button')).toBeInTheDocument();
    });

    it('displays category name', () => {
      render(<CategoryPill {...defaultProps} onClick={mockOnClick} />);
      expect(screen.getByText(mockCategory.name)).toBeInTheDocument();
    });

    it('displays category icon', () => {
      render(<CategoryPill {...defaultProps} onClick={mockOnClick} />);
      const icon = screen.getByTestId('category-icon');
      expect(icon).toHaveAttribute('src', mockCategory.icon);
    });

    it('displays product count when available', () => {
      render(<CategoryPill {...defaultProps} onClick={mockOnClick} />);
      expect(screen.getByText('(5)')).toBeInTheDocument();
    });

    it('hides product count when not available', () => {
      const categoryWithoutCount = { ...mockCategory, count: undefined };
      render(
        <CategoryPill 
          {...defaultProps} 
          category={categoryWithoutCount}
          onClick={mockOnClick} 
        />
      );
      expect(screen.queryByText(/\(\d+\)/)).not.toBeInTheDocument();
    });

    it('renders description for screen readers', () => {
      render(<CategoryPill {...defaultProps} onClick={mockOnClick} />);
      expect(screen.getByText(mockCategory.description!)).toHaveClass('sr-only');
    });
  });

  describe('Accessibility', () => {
    it('should not have accessibility violations', async () => {
      const { container } = render(<CategoryPill {...defaultProps} onClick={mockOnClick} />);
      const results = await axe(container);
      expect(results).toHaveNoViolations();
    });

    it('has proper ARIA attributes when not selected', () => {
      render(<CategoryPill {...defaultProps} onClick={mockOnClick} />);
      const button = screen.getByRole('button');
      
      expect(button).toHaveAttribute('aria-pressed', 'false');
      expect(button).toHaveAttribute('aria-label', expect.stringContaining(mockCategory.name));
      expect(button).toHaveAttribute('aria-label', expect.stringContaining('no seleccionada'));
      expect(button).toHaveAttribute('role', 'button');
      expect(button).toHaveAttribute('tabIndex', '0');
    });

    it('has proper ARIA attributes when selected', () => {
      render(
        <CategoryPill 
          {...defaultProps} 
          isSelected={true}
          onClick={mockOnClick} 
        />
      );
      const button = screen.getByRole('button');
      
      expect(button).toHaveAttribute('aria-pressed', 'true');
      expect(button).toHaveAttribute('aria-label', expect.stringContaining('seleccionada'));
    });

    it('has proper ARIA attributes when disabled', () => {
      render(
        <CategoryPill 
          {...defaultProps} 
          disabled={true}
          onClick={mockOnClick} 
        />
      );
      const button = screen.getByRole('button');
      
      expect(button).toHaveAttribute('tabIndex', '-1');
      expect(button).toBeDisabled();
    });

    it('links to description with aria-describedby', () => {
      render(<CategoryPill {...defaultProps} onClick={mockOnClick} />);
      const button = screen.getByRole('button');
      
      expect(button).toHaveAttribute('aria-describedby', `${mockCategory.id}-description`);
    });

    it('has empty alt text for decorative icon', () => {
      render(<CategoryPill {...defaultProps} onClick={mockOnClick} />);
      const icon = screen.getByTestId('category-icon');
      
      expect(icon).toHaveAttribute('alt', '');
    });
  });

  describe('Interactions', () => {
    it('calls onClick when clicked', async () => {
      const user = userEvent.setup();
      render(<CategoryPill {...defaultProps} onClick={mockOnClick} />);
      
      const button = screen.getByRole('button');
      await user.click(button);
      
      expect(mockOnClick).toHaveBeenCalledWith(mockCategory.id);
    });

    it('does not call onClick when disabled', async () => {
      const user = userEvent.setup();
      render(
        <CategoryPill 
          {...defaultProps} 
          disabled={true}
          onClick={mockOnClick} 
        />
      );
      
      const button = screen.getByRole('button');
      await user.click(button);
      
      expect(mockOnClick).not.toHaveBeenCalled();
    });

    it('handles Enter key press', async () => {
      const user = userEvent.setup();
      render(<CategoryPill {...defaultProps} onClick={mockOnClick} />);
      
      const button = screen.getByRole('button');
      button.focus();
      await user.keyboard('{Enter}');
      
      expect(mockOnClick).toHaveBeenCalledWith(mockCategory.id);
    });

    it('handles Space key press', async () => {
      const user = userEvent.setup();
      render(<CategoryPill {...defaultProps} onClick={mockOnClick} />);
      
      const button = screen.getByRole('button');
      button.focus();
      await user.keyboard(' ');
      
      expect(mockOnClick).toHaveBeenCalledWith(mockCategory.id);
    });

    it('calls custom onKeyDown handler', async () => {
      const user = userEvent.setup();
      render(
        <CategoryPill 
          {...defaultProps} 
          onClick={mockOnClick}
          onKeyDown={mockOnKeyDown}
        />
      );
      
      const button = screen.getByRole('button');
      button.focus();
      await user.keyboard('{ArrowRight}');
      
      expect(mockOnKeyDown).toHaveBeenCalledWith(
        expect.any(Object),
        mockCategory.id
      );
    });

    it('prevents default behavior for Enter and Space', async () => {
      const user = userEvent.setup();
      render(<CategoryPill {...defaultProps} onClick={mockOnClick} />);
      
      const button = screen.getByRole('button');
      button.focus();
      
      const enterEvent = new KeyboardEvent('keydown', { key: 'Enter' });
      const preventDefaultSpy = jest.spyOn(enterEvent, 'preventDefault');
      
      fireEvent.keyDown(button, enterEvent);
      
      expect(preventDefaultSpy).toHaveBeenCalled();
    });
  });

  describe('Visual States', () => {
    it('applies selected styles when selected', () => {
      render(
        <CategoryPill 
          {...defaultProps} 
          isSelected={true}
          onClick={mockOnClick} 
        />
      );
      const button = screen.getByRole('button');
      
      expect(button).toHaveAttribute('data-selected', 'true');
      expect(button).toHaveClass('scale-105');
    });

    it('applies not selected styles when not selected', () => {
      render(<CategoryPill {...defaultProps} onClick={mockOnClick} />);
      const button = screen.getByRole('button');
      
      expect(button).toHaveAttribute('data-selected', 'false');
    });

    it('applies disabled styles when disabled', () => {
      render(
        <CategoryPill 
          {...defaultProps} 
          disabled={true}
          onClick={mockOnClick} 
        />
      );
      const button = screen.getByRole('button');
      
      expect(button).toHaveClass('opacity-50', 'cursor-not-allowed');
    });
  });

  describe('Size Variants', () => {
    it('applies small size styles', () => {
      render(
        <CategoryPill 
          {...defaultProps} 
          size="sm"
          onClick={mockOnClick} 
        />
      );
      const button = screen.getByRole('button');
      
      expect(button).toHaveClass('pl-6', 'pr-3', 'py-1.5', 'text-xs');
    });

    it('applies medium size styles', () => {
      render(
        <CategoryPill 
          {...defaultProps} 
          size="md"
          onClick={mockOnClick} 
        />
      );
      const button = screen.getByRole('button');
      
      expect(button).toHaveClass('pl-8', 'pr-4', 'py-2', 'text-sm');
    });

    it('applies large size styles', () => {
      render(
        <CategoryPill 
          {...defaultProps} 
          size="lg"
          onClick={mockOnClick} 
        />
      );
      const button = screen.getByRole('button');
      
      expect(button).toHaveClass('pl-10', 'pr-5', 'py-3', 'text-base');
    });
  });

  describe('Error Handling', () => {
    it('handles image loading errors gracefully', () => {
      const consoleSpy = jest.spyOn(console, 'warn').mockImplementation();
      render(<CategoryPill {...defaultProps} onClick={mockOnClick} />);
      
      const icon = screen.getByTestId('category-icon');
      fireEvent.error(icon);
      
      expect(consoleSpy).toHaveBeenCalledWith(
        expect.stringContaining(`Failed to load image for category: ${mockCategory.name}`)
      );
      
      consoleSpy.mockRestore();
    });
  });

  describe('Custom Props', () => {
    it('applies custom className', () => {
      const customClass = 'custom-test-class';
      render(
        <CategoryPill 
          {...defaultProps} 
          className={customClass}
          onClick={mockOnClick} 
        />
      );
      const button = screen.getByRole('button');
      
      expect(button).toHaveClass(customClass);
    });

    it('applies custom testId', () => {
      const customTestId = 'custom-test-id';
      render(
        <CategoryPill 
          {...defaultProps} 
          testId={customTestId}
          onClick={mockOnClick} 
        />
      );
      
      expect(screen.getByTestId(customTestId)).toBeInTheDocument();
    });

    it('sets data attributes correctly', () => {
      render(<CategoryPill {...defaultProps} onClick={mockOnClick} />);
      const button = screen.getByRole('button');
      
      expect(button).toHaveAttribute('data-category-id', mockCategory.id);
      expect(button).toHaveAttribute('data-selected', 'false');
    });
  });
});
