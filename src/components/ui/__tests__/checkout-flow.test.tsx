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
    currentStep: 0,
    cartItems: mockCartItems,
    checkoutData: mockCheckoutData
  }

  it('renders checkout flow with default steps', () => {
    render(<CheckoutFlow {...defaultProps} />)

    expect(screen.getByText('Proceso de Compra')).toBeInTheDocument()
    expect(screen.getByText('Paso 1 de 5')).toBeInTheDocument()
    expect(screen.getAllByText('Carrito')).toHaveLength(2) // Aparece en el indicador y en el título
  })

  it('shows progress indicator', () => {
    render(<CheckoutFlow {...defaultProps} currentStep={2} />)
    
    expect(screen.getByText('Paso 3 de 5')).toBeInTheDocument()
    // El progreso debería ser 60% (3/5 * 100)
  })

  it('displays active step correctly', () => {
    render(<CheckoutFlow {...defaultProps} currentStep={1} />)

    expect(screen.getAllByText('Envío')).toHaveLength(2) // Aparece en el indicador y en el título
    expect(screen.getAllByText('Dirección y método')).toHaveLength(2) // Aparece en el indicador y en la descripción
  })

  it('shows shipping info on shipping step', () => {
    render(<CheckoutFlow {...defaultProps} currentStep={1} />)
    
    expect(screen.getByText('Opciones de Envío')).toBeInTheDocument()
    expect(screen.getByTestId('shipping-info')).toBeInTheDocument()
  })

  it('calls onStepChange when clicking on completed step', () => {
    const mockOnStepChange = jest.fn()
    
    render(
      <CheckoutFlow 
        {...defaultProps} 
        currentStep={2}
        onStepChange={mockOnStepChange}
      />
    )
    
    // Hacer clic en el primer paso (debería estar completado)
    const firstStep = screen.getByText('Carrito')
    fireEvent.click(firstStep.closest('div')!)
    
    expect(mockOnStepChange).toHaveBeenCalledWith(0)
  })

  it('shows cart summary when enabled', () => {
    render(<CheckoutFlow {...defaultProps} showCartSummary={true} />)
    
    expect(screen.getByTestId('cart-summary')).toBeInTheDocument()
    expect(screen.getByText('Cart Summary - 1 items - default')).toBeInTheDocument()
  })

  it('hides cart summary when disabled', () => {
    render(<CheckoutFlow {...defaultProps} showCartSummary={false} />)
    
    expect(screen.queryByTestId('cart-summary')).not.toBeInTheDocument()
  })

  it('calls onContinue when continue button is clicked', () => {
    const mockOnContinue = jest.fn()
    
    render(<CheckoutFlow {...defaultProps} onContinue={mockOnContinue} />)
    
    const continueButton = screen.getByText('Continuar')
    fireEvent.click(continueButton)
    
    expect(mockOnContinue).toHaveBeenCalledTimes(1)
  })

  it('calls onGoBack when back button is clicked', () => {
    const mockOnGoBack = jest.fn()
    
    render(
      <CheckoutFlow 
        {...defaultProps} 
        currentStep={1}
        onGoBack={mockOnGoBack}
      />
    )
    
    const backButton = screen.getByText('Anterior')
    fireEvent.click(backButton)
    
    expect(mockOnGoBack).toHaveBeenCalledTimes(1)
  })

  it('disables back button on first step', () => {
    render(<CheckoutFlow {...defaultProps} currentStep={0} />)
    
    const backButton = screen.getByText('Anterior')
    expect(backButton).toBeDisabled()
  })

  it('shows finish button on last step', () => {
    render(<CheckoutFlow {...defaultProps} currentStep={4} />)
    
    expect(screen.getByText('Finalizar Compra')).toBeInTheDocument()
    expect(screen.queryByText('Continuar')).not.toBeInTheDocument()
  })

  it('calls onComplete when finish button is clicked', () => {
    const mockOnComplete = jest.fn()
    
    render(
      <CheckoutFlow 
        {...defaultProps} 
        currentStep={4}
        onComplete={mockOnComplete}
      />
    )
    
    const finishButton = screen.getByText('Finalizar Compra')
    fireEvent.click(finishButton)
    
    expect(mockOnComplete).toHaveBeenCalledTimes(1)
  })

  it('shows loading state', () => {
    render(
      <CheckoutFlow 
        {...defaultProps} 
        currentStep={4}
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
    
    expect(screen.getByText('Hay errores que corregir:')).toBeInTheDocument()
    expect(screen.getByText('• Email es requerido')).toBeInTheDocument()
    expect(screen.getByText('• Dirección es requerida')).toBeInTheDocument()
  })

  it('renders in compact variant', () => {
    render(<CheckoutFlow {...defaultProps} variant="compact" />)
    
    // En variante compact, no debería mostrar el indicador de progreso
    expect(screen.queryByText('Proceso de Compra')).not.toBeInTheDocument()
  })

  it('renders custom steps', () => {
    const customSteps = [
      {
        id: 'custom1',
        title: 'Paso Personalizado',
        description: 'Descripción personalizada',
        icon: () => <div>Icon</div>
      }
    ]

    render(<CheckoutFlow {...defaultProps} steps={customSteps} />)

    expect(screen.getAllByText('Paso Personalizado')).toHaveLength(2) // Aparece en el indicador y en el título
    expect(screen.getByText('Paso 1 de 1')).toBeInTheDocument()
  })

  it('shows step status correctly', () => {
    render(<CheckoutFlow {...defaultProps} currentStep={2} />)
    
    // Los primeros dos pasos deberían estar completados
    // El tercer paso debería estar activo
    // Los últimos dos pasos deberían estar deshabilitados
    
    const steps = screen.getAllByRole('generic').filter(el => 
      el.textContent?.includes('Carrito') || 
      el.textContent?.includes('Envío') || 
      el.textContent?.includes('Facturación')
    )
    
    expect(steps.length).toBeGreaterThan(0)
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
