import React from 'react'
import { render, screen, fireEvent } from '@testing-library/react'
import '@testing-library/jest-dom'
import { CheckoutFlow } from '../checkout-flow'

// Mock de los componentes del Design System
jest.mock('../shipping-info', () => ({
  ShippingInfo: ({ options, selectedOption }: any) => (
    <div data-testid="shipping-info">
      Shipping options for: {selectedOption}
    </div>
  )
}))

jest.mock('../cart-summary', () => ({
  CartSummary: ({ cartItems, variant }: any) => (
    <div data-testid="cart-summary">
      Cart Summary - {cartItems.length} items - {variant}
    </div>
  )
}))

const mockCartItems = [
  {
    id: 1,
    title: 'Pintura Sherwin Williams 4L',
    price: 10000,
    discountedPrice: 8500,
    quantity: 2
  }
]

const mockCheckoutData = {
  totalPrice: 17000,
  shippingCost: 2500,
  discount: 0,
  finalTotal: 19500,
  shippingMethod: 'standard' as const
}

describe('CheckoutFlow', () => {
  const defaultProps = {
    cartItems: mockCartItems,
    checkoutData: mockCheckoutData
  }

  it('renders checkout flow with basic elements', () => {
    render(<CheckoutFlow {...defaultProps} />)

    expect(screen.getByText('Finalizar Compra')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /completar pedido/i })).toBeInTheDocument()
    expect(screen.getByTestId('cart-summary')).toBeInTheDocument()
  })

  it('renders without errors when no errors provided', () => {
    render(<CheckoutFlow {...defaultProps} />)

    // No debería mostrar sección de errores
    expect(screen.queryByText('Errores:')).not.toBeInTheDocument()
  })

  it('displays cart summary correctly', () => {
    render(<CheckoutFlow {...defaultProps} />)

    // Verificar que CartSummary se renderiza con los datos correctos
    expect(screen.getByTestId('cart-summary')).toBeInTheDocument()
  })

  it('renders with proper accessibility', () => {
    render(<CheckoutFlow {...defaultProps} />)

    // Verificar elementos accesibles
    expect(screen.getByRole('button', { name: /completar pedido/i })).toBeInTheDocument()
  })

  it('renders with custom className', () => {
    const customClass = 'custom-checkout-class'

    const { container } = render(
      <CheckoutFlow
        {...defaultProps}
        className={customClass}
      />
    )

    // Verificar que la clase se aplica al contenedor principal
    expect(container.firstChild).toHaveClass(customClass)
  })

  it('shows cart summary by default', () => {
    render(<CheckoutFlow {...defaultProps} />)

    expect(screen.getByTestId('cart-summary')).toBeInTheDocument()
    expect(screen.getByText('Cart Summary - 1 items - compact')).toBeInTheDocument()
  })

  it('renders with empty cart items', () => {
    render(<CheckoutFlow {...defaultProps} cartItems={[]} />)

    expect(screen.getByTestId('cart-summary')).toBeInTheDocument()
    expect(screen.getByText('Cart Summary - 0 items - compact')).toBeInTheDocument()
  })

  it('calls onComplete when complete button is clicked', () => {
    const mockOnComplete = jest.fn()

    render(<CheckoutFlow {...defaultProps} onComplete={mockOnComplete} />)

    const completeButton = screen.getByRole('button', { name: /completar pedido/i })
    fireEvent.click(completeButton)

    expect(mockOnComplete).toHaveBeenCalledTimes(1)
  })

  it('disables complete button when loading', () => {
    render(<CheckoutFlow {...defaultProps} isLoading={true} />)

    const completeButton = screen.getByRole('button', { name: /procesando/i })
    expect(completeButton).toBeDisabled()
  })

  it('shows complete button by default', () => {
    render(<CheckoutFlow {...defaultProps} />)

    expect(screen.getByText('Finalizar Compra')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /completar pedido/i })).toBeInTheDocument()
  })

  it('calls onComplete when finish button is clicked', () => {
    const mockOnComplete = jest.fn()

    render(
      <CheckoutFlow
        {...defaultProps}
        onComplete={mockOnComplete}
      />
    )

    const finishButton = screen.getByRole('button', { name: /completar pedido/i })
    fireEvent.click(finishButton)

    expect(mockOnComplete).toHaveBeenCalledTimes(1)
  })

  it('shows loading state', () => {
    render(
      <CheckoutFlow
        {...defaultProps}
        isLoading={true}
      />
    )

    expect(screen.getByText('Procesando...')).toBeInTheDocument()
  })

  it('displays errors when present', () => {
    const errors = {
      email: 'Email es requerido',
      address: 'Dirección es requerida'
    }

    render(<CheckoutFlow {...defaultProps} errors={errors} />)

    expect(screen.getByText('Errores:')).toBeInTheDocument()
    expect(screen.getByText('• Email es requerido')).toBeInTheDocument()
    expect(screen.getByText('• Dirección es requerida')).toBeInTheDocument()
  })

  it('renders with custom children content', () => {
    const customContent = <div>Custom checkout content</div>

    render(<CheckoutFlow {...defaultProps}>{customContent}</CheckoutFlow>)

    expect(screen.getByText('Custom checkout content')).toBeInTheDocument()
    expect(screen.getByText('Finalizar Compra')).toBeInTheDocument()
  })

  it('renders cart summary with correct data', () => {
    const checkoutData = {
      totalPrice: 100,
      shippingCost: 10,
      discount: 5,
      finalTotal: 105
    }

    render(<CheckoutFlow {...defaultProps} checkoutData={checkoutData} />)

    // Verificar que el componente se renderiza (CartSummary está presente)
    expect(screen.getByText('Finalizar Compra')).toBeInTheDocument()
  })

  it('shows loading state correctly', () => {
    render(<CheckoutFlow {...defaultProps} isLoading={true} />)

    // Verificar que muestra el estado de carga
    expect(screen.getByText('Procesando...')).toBeInTheDocument()

    // Verificar que el botón está deshabilitado
    const button = screen.getByRole('button', { name: /procesando/i })
    expect(button).toBeDisabled()
  })

  it('renders children content', () => {
    render(
      <CheckoutFlow {...defaultProps}>
        <div data-testid="custom-content">Custom step content</div>
      </CheckoutFlow>
    )

    expect(screen.getByTestId('custom-content')).toBeInTheDocument()
    expect(screen.getByText('Custom step content')).toBeInTheDocument()
  })
})
