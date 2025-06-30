import React from 'react'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { ProductCard } from '../card'

describe('ProductCard - Nuevo Diseño', () => {
  const defaultProps = {
    image: '/test-image.jpg',
    title: 'Pintura Látex Premium Sherwin Williams',
    price: 2500,
    originalPrice: 3200,
    discount: '25%',
    badge: 'Llega gratis hoy',
    cta: 'Agregar al carrito',
    stock: 10, // Agregamos stock para que no aparezca "Sin stock"
    onAddToCart: jest.fn(),
  }

  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('renderiza correctamente con todas las props', () => {
    render(<ProductCard {...defaultProps} />)
    
    expect(screen.getByTestId('product-card')).toBeInTheDocument()
    expect(screen.getByTestId('product-name')).toHaveTextContent('Pintura Látex Premium Sherwin Williams')
    expect(screen.getByTestId('product-price')).toBeInTheDocument()
    expect(screen.getByTestId('add-to-cart-btn')).toHaveTextContent('Agregar al carrito')
  })

  it('muestra el badge de descuento correctamente', () => {
    render(<ProductCard {...defaultProps} />)

    expect(screen.getByText('25%')).toBeInTheDocument()
    expect(screen.getByText('Descuento')).toBeInTheDocument()
    expect(screen.getByText('especial')).toBeInTheDocument()
  })

  it('muestra el badge de envío', () => {
    render(<ProductCard {...defaultProps} />)
    
    expect(screen.getByText('Llega gratis hoy')).toBeInTheDocument()
  })

  it('muestra precios correctamente formateados', () => {
    render(<ProductCard {...defaultProps} />)
    
    expect(screen.getByText('$2.500')).toBeInTheDocument()
    expect(screen.getByText('$3.200')).toBeInTheDocument()
  })

  it('no muestra precio original si no se proporciona', () => {
    const props = { ...defaultProps, originalPrice: undefined }
    render(<ProductCard {...props} />)
    
    expect(screen.getByText('$2.500')).toBeInTheDocument()
    expect(screen.queryByText('$3.200')).not.toBeInTheDocument()
  })

  it('no muestra badge de descuento si no se proporciona', () => {
    const props = { ...defaultProps, discount: undefined }
    render(<ProductCard {...props} />)
    
    expect(screen.queryByText('25%')).not.toBeInTheDocument()
    expect(screen.queryByText('Descuento especial')).not.toBeInTheDocument()
  })

  it('muestra placeholder cuando no hay imagen', () => {
    const props = { ...defaultProps, image: undefined }
    render(<ProductCard {...props} />)

    // Verifica que se muestra el placeholder SVG
    const placeholder = screen.getByTestId('product-card').querySelector('svg')
    expect(placeholder).toBeInTheDocument()
  })

  it('llama a onAddToCart cuando se hace click en el botón', () => {
    render(<ProductCard {...defaultProps} />)
    
    const button = screen.getByTestId('add-to-cart-btn')
    fireEvent.click(button)
    
    expect(defaultProps.onAddToCart).toHaveBeenCalledTimes(1)
  })

  it('muestra animación de carga al agregar al carrito', async () => {
    render(<ProductCard {...defaultProps} showCartAnimation={true} />)

    const button = screen.getByTestId('add-to-cart-btn')
    fireEvent.click(button)

    // Debe mostrar "Agregando..." inmediatamente
    expect(screen.getByText('Agregando...')).toBeInTheDocument()
    expect(button).toBeDisabled()

    // Debe volver al estado original después de 1 segundo
    await waitFor(() => {
      expect(screen.getByText('Agregar al carrito')).toBeInTheDocument()
      expect(button).not.toBeDisabled()
    }, { timeout: 1500 })
  })

  it('deshabilita el botón cuando stock es 0', () => {
    const props = { ...defaultProps, stock: 0 }
    render(<ProductCard {...props} />)
    
    const button = screen.getByTestId('add-to-cart-btn')
    expect(button).toBeDisabled()
    expect(button).toHaveTextContent('Sin stock')
  })

  it('permite personalizar el texto del CTA', () => {
    const props = { ...defaultProps, cta: 'Comprar ahora' }
    render(<ProductCard {...props} />)
    
    expect(screen.getByText('Comprar ahora')).toBeInTheDocument()
  })

  it('usa CTA por defecto si no se proporciona', () => {
    const props = { ...defaultProps, cta: undefined }
    render(<ProductCard {...props} />)
    
    expect(screen.getByText('Agregar al carrito')).toBeInTheDocument()
  })

  it('renderiza link al producto si se proporciona productId', () => {
    const props = { ...defaultProps, productId: '123' }
    render(<ProductCard {...props} />)
    
    const link = screen.getByRole('link')
    expect(link).toHaveAttribute('href', '/shop-details/123')
  })

  it('no renderiza link si no se proporciona productId', () => {
    render(<ProductCard {...defaultProps} />)
    
    expect(screen.queryByRole('link')).not.toBeInTheDocument()
  })

  it('aplica clases CSS correctas para el diseño', () => {
    render(<ProductCard {...defaultProps} />)

    const card = screen.getByTestId('product-card')
    expect(card).toHaveClass('bg-white')
    expect(card).toHaveClass('rounded-xl') // Mobile-first: rounded-xl
    expect(card).toHaveClass('md:rounded-2xl') // Desktop: rounded-2xl
    expect(card).toHaveClass('md:max-w-[300px]') // Desktop: max-width
  })

  it('muestra ícono de carrito en el botón CTA', () => {
    render(<ProductCard {...defaultProps} />)
    
    const button = screen.getByTestId('add-to-cart-btn')
    const icon = button.querySelector('svg')
    expect(icon).toBeInTheDocument()
  })

  it('maneja correctamente productos sin precio', () => {
    const props = { ...defaultProps, price: undefined }
    render(<ProductCard {...props} />)

    // El ProductCard siempre muestra el precio, incluso si es undefined (muestra $0)
    expect(screen.getByTestId('product-price')).toBeInTheDocument()
    expect(screen.getByText('$0')).toBeInTheDocument()
  })

  it('renderiza children adicionales si se proporcionan', () => {
    render(
      <ProductCard {...defaultProps}>
        <div data-testid="custom-content">Contenido personalizado</div>
      </ProductCard>
    )
    
    expect(screen.getByTestId('custom-content')).toBeInTheDocument()
    expect(screen.getByText('Contenido personalizado')).toBeInTheDocument()
  })

  it('aplica className personalizada', () => {
    render(<ProductCard {...defaultProps} className="custom-class" />)
    
    const card = screen.getByTestId('product-card')
    expect(card).toHaveClass('custom-class')
  })

  it('pasa props adicionales al componente Card', () => {
    render(<ProductCard {...defaultProps} data-custom="test-value" />)
    
    const card = screen.getByTestId('product-card')
    expect(card).toHaveAttribute('data-custom', 'test-value')
  })
})
