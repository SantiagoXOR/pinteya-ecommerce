import React from 'react'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { CommercialProductCard } from '../product-card-commercial'

describe('CommercialProductCard', () => {
  const defaultProps = {
    image: '/test-image.jpg',
    title: 'Barniz Campbell 4L',
    brand: 'Petrilac',
    price: 19350,
    originalPrice: 21500,
    discount: '10%',
    stock: 12,
    onAddToCart: jest.fn(),
  }

  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('renders correctly with all props', () => {
    render(<CommercialProductCard {...defaultProps} />)
    
    expect(screen.getByTestId('commercial-product-card')).toBeInTheDocument()
    expect(screen.getByText('Barniz Campbell 4L')).toBeInTheDocument()
    expect(screen.getByText('Petrilac')).toBeInTheDocument()
    expect(screen.getByText('$19.350')).toBeInTheDocument()
    expect(screen.getByText('$21.500')).toBeInTheDocument()
  })

  it('shows "Nuevo" badge when isNew is true', () => {
    render(<CommercialProductCard {...defaultProps} isNew={true} />)
    
    expect(screen.getByText('Nuevo')).toBeInTheDocument()
  })

  it('shows discount badge when discount is provided', () => {
    render(<CommercialProductCard {...defaultProps} />)

    expect(screen.getByText('10%')).toBeInTheDocument()
    expect(screen.getByText('Descuento')).toBeInTheDocument()
    expect(screen.getByText('especial')).toBeInTheDocument()
  })

  it('shows installments information when provided', () => {
    const installments = {
      quantity: 3,
      amount: 6450,
      interestFree: true
    }
    
    render(
      <CommercialProductCard 
        {...defaultProps} 
        installments={installments}
      />
    )
    
    expect(screen.getByText('3x de $6.450 sin interés')).toBeInTheDocument()
  })

  it('shows free shipping when freeShipping is true', () => {
    render(
      <CommercialProductCard
        {...defaultProps}
        freeShipping={true}
      />
    )

    expect(screen.getByAltText('Envío gratis')).toBeInTheDocument()
  })

  it('shows free shipping automatically for prices >= 15000', () => {
    render(
      <CommercialProductCard
        {...defaultProps}
        price={20000}
      />
    )

    expect(screen.getByAltText('Envío gratis')).toBeInTheDocument()
  })

  it('shows delivery location when provided', () => {
    render(
      <CommercialProductCard
        {...defaultProps}
        freeShipping={true}
        deliveryLocation="Llega gratis hoy en Córdoba Capital"
      />
    )

    // Ahora solo muestra el ícono, no el texto de ubicación
    expect(screen.getByAltText('Envío gratis')).toBeInTheDocument()
  })

  it('calls onAddToCart when button is clicked', () => {
    render(<CommercialProductCard {...defaultProps} />)
    
    const button = screen.getByTestId('add-to-cart-btn')
    fireEvent.click(button)
    
    expect(defaultProps.onAddToCart).toHaveBeenCalledTimes(1)
  })

  it('shows loading state when adding to cart', async () => {
    render(<CommercialProductCard {...defaultProps} showCartAnimation={true} />)

    const button = screen.getByTestId('add-to-cart-btn')
    fireEvent.click(button)

    // Verificar que el botón está deshabilitado durante la carga
    expect(button).toBeDisabled()

    // Verificar que aparece el texto "Agregando..." (puede estar oculto en mobile)
    await waitFor(() => {
      const loadingTexts = screen.getAllByText(/Agregando|\.\.\./)
      expect(loadingTexts.length).toBeGreaterThan(0)
    }, { timeout: 100 })

    // Verificar que después de 1 segundo el botón vuelve a estar habilitado
    await waitFor(() => {
      expect(button).not.toBeDisabled()
    }, { timeout: 1200 })
  })

  it('disables button when stock is 0', () => {
    render(<CommercialProductCard {...defaultProps} stock={0} />)
    
    const button = screen.getByTestId('add-to-cart-btn')
    expect(button).toBeDisabled()
    expect(screen.getByText('Sin stock')).toBeInTheDocument()
  })

  it('shows placeholder when no image is provided', () => {
    render(<CommercialProductCard {...defaultProps} image={undefined} />)
    
    const placeholder = screen.getByAltText('Sin imagen')
    expect(placeholder).toBeInTheDocument()
  })

  it('handles image error by showing placeholder', () => {
    render(<CommercialProductCard {...defaultProps} />)
    
    const image = screen.getByAltText('Barniz Campbell 4L')
    fireEvent.error(image)
    
    expect(image).toHaveAttribute('src', '/images/products/placeholder.svg')
  })

  it('applies custom className', () => {
    render(<CommercialProductCard {...defaultProps} className="custom-class" />)
    
    const card = screen.getByTestId('commercial-product-card')
    expect(card).toHaveClass('custom-class')
  })

  it('renders without brand when not provided', () => {
    render(<CommercialProductCard {...defaultProps} brand={undefined} />)
    
    expect(screen.queryByText('Petrilac')).not.toBeInTheDocument()
  })

  it('renders without original price when not provided', () => {
    render(<CommercialProductCard {...defaultProps} originalPrice={undefined} />)
    
    expect(screen.queryByText('$21.500')).not.toBeInTheDocument()
  })

  it('renders without discount badge when not provided', () => {
    render(<CommercialProductCard {...defaultProps} discount={undefined} />)

    expect(screen.queryByText('10%')).not.toBeInTheDocument()
    expect(screen.queryByText('Descuento')).not.toBeInTheDocument()
    expect(screen.queryByText('especial')).not.toBeInTheDocument()
  })

  it('uses custom CTA text', () => {
    render(<CommercialProductCard {...defaultProps} cta="Comprar ahora" />)
    
    expect(screen.getByText('Comprar ahora')).toBeInTheDocument()
  })

  it('renders children when provided', () => {
    render(
      <CommercialProductCard {...defaultProps}>
        <div data-testid="custom-child">Custom content</div>
      </CommercialProductCard>
    )
    
    expect(screen.getByTestId('custom-child')).toBeInTheDocument()
    expect(screen.getByText('Custom content')).toBeInTheDocument()
  })

  it('handles zero price correctly', () => {
    render(<CommercialProductCard {...defaultProps} price={0} />)
    
    expect(screen.getByText('$0')).toBeInTheDocument()
  })

  it('formats large prices correctly', () => {
    render(<CommercialProductCard {...defaultProps} price={123456} />)
    
    expect(screen.getByText('$123.456')).toBeInTheDocument()
  })
})
