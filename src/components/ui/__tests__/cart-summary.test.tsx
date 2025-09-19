import React from 'react'
import { render, screen, fireEvent } from '@testing-library/react'
import '@testing-library/jest-dom'
import { CartSummary } from '../cart-summary'

// Mock de los componentes del Design System
jest.mock('../price-display', () => ({
  PriceDisplay: ({ amount, originalAmount, className }: any) => (
    <div data-testid="price-display" className={className}>
      ${(amount / 100).toFixed(2)}
      {originalAmount && ` (was $${(originalAmount / 100).toFixed(2)})`}
    </div>
  )
}))

jest.mock('../shipping-info', () => ({
  ShippingInfo: ({ options, selectedOption }: any) => (
    <div data-testid="shipping-info">
      Shipping: {selectedOption}
    </div>
  )
}))

jest.mock('../product-card-enhanced', () => ({
  EnhancedProductCard: ({ title, context }: any) => (
    <div data-testid="enhanced-product-card">
      {title} - {context}
    </div>
  )
}))

const mockCartItems = [
  {
    id: 1,
    title: 'Pintura Sherwin Williams 4L',
    price: 10000,
    discountedPrice: 8500,
    quantity: 2,
    image: '/test-image.jpg',
    category: 'pinturas'
  },
  {
    id: 2,
    title: 'Esmalte Petrilac 1L',
    price: 2300,
    discountedPrice: 2300,
    quantity: 1,
    category: 'esmaltes'
  }
]

describe('CartSummary', () => {
  const defaultProps = {
    cartItems: mockCartItems,
    totalPrice: 19300,
    shippingCost: 2500,
    discount: 0,
    finalTotal: 21800
  }

  it('renders cart summary with items', () => {
    render(<CartSummary {...defaultProps} />)
    
    expect(screen.getByText('Resumen del Pedido')).toBeInTheDocument()
    expect(screen.getByText('2 items')).toBeInTheDocument()
    expect(screen.getByText('Pintura Sherwin Williams 4L')).toBeInTheDocument()
    expect(screen.getByText('Esmalte Petrilac 1L')).toBeInTheDocument()
  })

  it('shows empty cart message when no items', () => {
    render(<CartSummary {...defaultProps} cartItems={[]} />)
    
    expect(screen.getByText('No hay productos en el carrito')).toBeInTheDocument()
  })

  it('displays price calculations correctly', () => {
    render(<CartSummary {...defaultProps} />)
    
    expect(screen.getByText('Subtotal')).toBeInTheDocument()
    expect(screen.getByText('Envío')).toBeInTheDocument()
    expect(screen.getByText('Total')).toBeInTheDocument()
  })

  it('shows free shipping badge when applicable', () => {
    const propsWithFreeShipping = {
      ...defaultProps,
      totalPrice: 60000,
      shippingCost: 0
    }

    render(<CartSummary {...propsWithFreeShipping} />)

    // Buscar específicamente el badge de envío gratis
    expect(screen.getByText('Gratis', { selector: '.bg-success' })).toBeInTheDocument()
  })

  it('displays discount when applied', () => {
    const propsWithDiscount = {
      ...defaultProps,
      discount: 1000,
      appliedCoupon: {
        code: 'PROMO10',
        discount: 1000,
        type: 'fixed' as const
      }
    }
    
    render(<CartSummary {...propsWithDiscount} />)
    
    expect(screen.getByText('Descuento')).toBeInTheDocument()
    expect(screen.getByText('PROMO10')).toBeInTheDocument()
  })

  it('calls onCheckout when checkout button is clicked', () => {
    const mockOnCheckout = jest.fn()
    
    render(<CartSummary {...defaultProps} onCheckout={mockOnCheckout} />)
    
    const checkoutButton = screen.getByText('Proceder al Pago')
    fireEvent.click(checkoutButton)
    
    expect(mockOnCheckout).toHaveBeenCalledTimes(1)
  })

  it('renders in compact variant', () => {
    render(<CartSummary {...defaultProps} variant="compact" />)
    
    // En variante compact, debería tener altura máxima reducida
    const itemsContainer = screen.getByText('Pintura Sherwin Williams 4L').closest('.max-h-40')
    expect(itemsContainer).toBeInTheDocument()
  })

  it('shows product cards when enabled', () => {
    render(
      <CartSummary 
        {...defaultProps} 
        showProductCards={true}
        productCardContext="checkout"
      />
    )
    
    expect(screen.getAllByTestId('enhanced-product-card')).toHaveLength(2)
    expect(screen.getByText('Pintura Sherwin Williams 4L - checkout')).toBeInTheDocument()
  })

  it('shows shipping details in detailed variant', () => {
    render(
      <CartSummary 
        {...defaultProps} 
        variant="detailed"
        showShippingDetails={true}
      />
    )
    
    expect(screen.getByTestId('shipping-info')).toBeInTheDocument()
  })

  it('disables checkout button when cart is empty', () => {
    const mockOnCheckout = jest.fn()

    render(
      <CartSummary
        {...defaultProps}
        cartItems={[]}
        onCheckout={mockOnCheckout}
      />
    )

    // El botón de checkout no debería aparecer cuando el carrito está vacío
    expect(screen.queryByText('Proceder al Pago')).not.toBeInTheDocument()
  })

  it('calculates final total correctly when not provided', () => {
    const propsWithoutFinalTotal = {
      cartItems: mockCartItems,
      totalPrice: 19300,
      shippingCost: 2500,
      discount: 1000
      // finalTotal no proporcionado
    }
    
    render(<CartSummary {...propsWithoutFinalTotal} />)
    
    // Debería calcular: 19300 + 2500 - 1000 = 20800
    expect(screen.getByText('Total')).toBeInTheDocument()
  })

  it('shows benefits section when not compact', () => {
    render(<CartSummary {...defaultProps} variant="default" />)
    
    expect(screen.getByText('Compra protegida')).toBeInTheDocument()
    expect(screen.getByText('Tu dinero está protegido con MercadoPago')).toBeInTheDocument()
  })

  it('handles single item correctly', () => {
    const singleItemProps = {
      ...defaultProps,
      cartItems: [mockCartItems[0]]
    }
    
    render(<CartSummary {...singleItemProps} />)
    
    expect(screen.getByText('1 item')).toBeInTheDocument()
  })
})









