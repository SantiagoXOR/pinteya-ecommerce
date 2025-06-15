// ===================================
// PINTEYA E-COMMERCE - TESTS PARA CHECKOUT COMPONENT
// ===================================

import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { useRouter } from 'next/navigation';
import Checkout from '@/components/Checkout';

// Mock next/navigation
jest.mock('next/navigation', () => ({
  useRouter: jest.fn(),
}));

// Mock useCheckout hook
jest.mock('@/hooks/useCheckout', () => ({
  useCheckout: jest.fn(() => ({
    cartItems: [
      {
        id: '1',
        name: 'Pintura Blanca',
        price: 5000,
        quantity: 2,
        image: '/test-image.jpg',
      },
    ],
    total: 10000,
    isLoading: false,
    error: null,
    processCheckout: jest.fn(),
    clearCart: jest.fn(),
  })),
}));

const mockPush = jest.fn();

beforeEach(() => {
  (useRouter as jest.Mock).mockReturnValue({
    push: mockPush,
  });
  jest.clearAllMocks();
});

describe('Checkout Component', () => {
  it('should render checkout form with cart items', () => {
    render(<Checkout />);
    
    expect(screen.getByText('Finalizar Compra')).toBeInTheDocument();
    expect(screen.getByText('Pintura Blanca')).toBeInTheDocument();
    expect(screen.getByText('$10.000')).toBeInTheDocument();
  });

  it('should redirect to cart when no items', () => {
    const { useCheckout } = require('@/hooks/useCheckout');
    useCheckout.mockReturnValue({
      cartItems: [],
      total: 0,
      isLoading: false,
      error: null,
      processCheckout: jest.fn(),
      clearCart: jest.fn(),
    });

    render(<Checkout />);
    
    expect(mockPush).toHaveBeenCalledWith('/cart');
  });

  it('should handle form submission', async () => {
    const mockProcessCheckout = jest.fn().mockResolvedValue({
      success: true,
      init_point: 'https://mercadopago.com/checkout',
    });

    const { useCheckout } = require('@/hooks/useCheckout');
    useCheckout.mockReturnValue({
      cartItems: [
        {
          id: '1',
          name: 'Pintura Blanca',
          price: 5000,
          quantity: 2,
          image: '/test-image.jpg',
        },
      ],
      total: 10000,
      isLoading: false,
      error: null,
      processCheckout: mockProcessCheckout,
      clearCart: jest.fn(),
    });

    render(<Checkout />);
    
    // Fill form
    fireEvent.change(screen.getByLabelText(/nombre/i), {
      target: { value: 'Juan Pérez' },
    });
    fireEvent.change(screen.getByLabelText(/email/i), {
      target: { value: 'juan@example.com' },
    });
    fireEvent.change(screen.getByLabelText(/teléfono/i), {
      target: { value: '1234567890' },
    });

    // Submit form
    fireEvent.click(screen.getByText('Proceder al Pago'));

    await waitFor(() => {
      expect(mockProcessCheckout).toHaveBeenCalled();
    });
  });

  it('should display loading state', () => {
    const { useCheckout } = require('@/hooks/useCheckout');
    useCheckout.mockReturnValue({
      cartItems: [
        {
          id: '1',
          name: 'Pintura Blanca',
          price: 5000,
          quantity: 2,
          image: '/test-image.jpg',
        },
      ],
      total: 10000,
      isLoading: true,
      error: null,
      processCheckout: jest.fn(),
      clearCart: jest.fn(),
    });

    render(<Checkout />);
    
    expect(screen.getByText('Procesando...')).toBeInTheDocument();
  });

  it('should display error state', () => {
    const { useCheckout } = require('@/hooks/useCheckout');
    useCheckout.mockReturnValue({
      cartItems: [
        {
          id: '1',
          name: 'Pintura Blanca',
          price: 5000,
          quantity: 2,
          image: '/test-image.jpg',
        },
      ],
      total: 10000,
      isLoading: false,
      error: 'Error procesando el pago',
      processCheckout: jest.fn(),
      clearCart: jest.fn(),
    });

    render(<Checkout />);
    
    expect(screen.getByText('Error procesando el pago')).toBeInTheDocument();
  });

  it('should calculate shipping cost correctly', () => {
    const { useCheckout } = require('@/hooks/useCheckout');
    useCheckout.mockReturnValue({
      cartItems: [
        {
          id: '1',
          name: 'Pintura Blanca',
          price: 5000,
          quantity: 2,
          image: '/test-image.jpg',
        },
      ],
      total: 10000,
      isLoading: false,
      error: null,
      processCheckout: jest.fn(),
      clearCart: jest.fn(),
    });

    render(<Checkout />);
    
    // Should show shipping cost for orders under free shipping threshold
    expect(screen.getByText('$2.500')).toBeInTheDocument(); // Shipping cost
  });

  it('should show free shipping for large orders', () => {
    const { useCheckout } = require('@/hooks/useCheckout');
    useCheckout.mockReturnValue({
      cartItems: [
        {
          id: '1',
          name: 'Pintura Blanca',
          price: 30000,
          quantity: 1,
          image: '/test-image.jpg',
        },
      ],
      total: 30000,
      isLoading: false,
      error: null,
      processCheckout: jest.fn(),
      clearCart: jest.fn(),
    });

    render(<Checkout />);
    
    // Should show free shipping for orders over threshold
    expect(screen.getByText('Gratis')).toBeInTheDocument();
  });

  it('should validate required fields', async () => {
    render(<Checkout />);
    
    // Try to submit without filling required fields
    fireEvent.click(screen.getByText('Proceder al Pago'));

    await waitFor(() => {
      expect(screen.getByText('El nombre es requerido')).toBeInTheDocument();
    });
  });

  it('should validate email format', async () => {
    render(<Checkout />);
    
    fireEvent.change(screen.getByLabelText(/email/i), {
      target: { value: 'invalid-email' },
    });
    
    fireEvent.click(screen.getByText('Proceder al Pago'));

    await waitFor(() => {
      expect(screen.getByText('Email inválido')).toBeInTheDocument();
    });
  });
});
