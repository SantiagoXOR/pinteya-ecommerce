import { render, screen } from '@testing-library/react'
import { PriceDisplay } from '../price-display'

describe('PriceDisplay', () => {
  it('renders basic price correctly', () => {
    render(<PriceDisplay amount={1550} />)

    // Verifica que el precio se muestre correctamente formateado (con espacio)
    expect(screen.getByText('$ 15,50')).toBeInTheDocument()
  })

  it('shows discount percentage when original price is provided', () => {
    render(
      <PriceDisplay 
        amount={1550} 
        originalAmount={2000} 
        showDiscountPercentage 
      />
    )
    
    // Verifica precio original tachado
    expect(screen.getByText('$ 20,00')).toBeInTheDocument()

    // Verifica precio actual
    expect(screen.getByText('$ 15,50')).toBeInTheDocument()
    
    // Verifica porcentaje de descuento (23% = (2000-1550)/2000 * 100)
    expect(screen.getByText(/-\d+%/)).toBeInTheDocument()
  })

  it('displays installments information', () => {
    render(
      <PriceDisplay 
        amount={15000}
        installments={{
          quantity: 12,
          amount: 1250,
          interestFree: true
        }}
      />
    )
    
    // Verifica información de cuotas
    expect(screen.getByText(/12x de/)).toBeInTheDocument()
    expect(screen.getByText(/\$ 12,50/)).toBeInTheDocument()
    expect(screen.getByText('sin interés')).toBeInTheDocument()
  })

  it('shows free shipping badge when enabled', () => {
    render(<PriceDisplay amount={1550} showFreeShipping />)
    
    expect(screen.getByText('🚚 Envío gratis')).toBeInTheDocument()
  })

  it('applies correct variant classes', () => {
    const { container } = render(
      <PriceDisplay amount={1550} variant="center" />
    )
    
    expect(container.firstChild).toHaveClass('text-center', 'items-center')
  })

  it('applies correct size classes', () => {
    const { container } = render(
      <PriceDisplay amount={1550} size="lg" />
    )
    
    // Verifica que se aplique la clase de tamaño
    expect(container.querySelector('.text-2xl')).toBeInTheDocument()
  })

  it('handles different currencies', () => {
    render(<PriceDisplay amount={1550} currency="USD" />)
    
    // Para USD debería mostrar el símbolo de dólar
    expect(screen.getByText(/US\$/)).toBeInTheDocument()
  })

  it('uses custom currency symbol when provided', () => {
    render(<PriceDisplay amount={1550} currencySymbol="$" />)
    
    expect(screen.getByText('$15,50')).toBeInTheDocument()
  })

  it('calculates discount percentage correctly', () => {
    render(
      <PriceDisplay 
        amount={7500} 
        originalAmount={10000} 
        showDiscountPercentage 
      />
    )
    
    // 25% de descuento: (10000-7500)/10000 * 100 = 25%
    expect(screen.getByText('-25%')).toBeInTheDocument()
  })

  it('renders compact variant correctly', () => {
    const { container } = render(
      <PriceDisplay 
        amount={1550} 
        originalAmount={2000}
        variant="compact" 
      />
    )
    
    expect(container.firstChild).toHaveClass('flex-row', 'items-baseline', 'gap-2')
  })

  it('handles installments without interest correctly', () => {
    render(
      <PriceDisplay 
        amount={15000}
        installments={{
          quantity: 6,
          amount: 2500,
          interestFree: false
        }}
        installmentsText="con interés"
      />
    )
    
    expect(screen.getByText(/6x de/)).toBeInTheDocument()
    expect(screen.getByText(/\$ 25,00/)).toBeInTheDocument()
    // No debería mostrar "sin interés" cuando interestFree es false
    expect(screen.queryByText('sin interés')).not.toBeInTheDocument()
  })

  it('applies custom price color', () => {
    const { container } = render(
      <PriceDisplay amount={1550} priceColor="#FF0000" />
    )

    // Verifica que se aplique la clase de color personalizado
    expect(container.querySelector('.text-\\[\\#FF0000\\]')).toBeInTheDocument()
  })

  it('handles zero amount correctly', () => {
    render(<PriceDisplay amount={0} />)

    expect(screen.getByText('$ 0,00')).toBeInTheDocument()
  })

  it('handles large amounts correctly', () => {
    render(<PriceDisplay amount={1234567} />)

    // Debería formatear números grandes con separadores de miles
    expect(screen.getByText('$ 12.345,67')).toBeInTheDocument()
  })
})
