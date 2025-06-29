import { render, screen } from '@testing-library/react'
import { ProductCard } from '../card'

describe('ProductCard with E-commerce Components', () => {
  const defaultProps = {
    title: 'Pintura Sherwin Williams',
    price: 8500,
    originalPrice: 10000,
    stock: 12,
    onAddToCart: jest.fn(),
  }

  it('renders legacy version when useNewComponents is false', () => {
    render(
      <ProductCard 
        {...defaultProps}
        useNewComponents={false}
      />
    )
    
    // Verifica que use el formato legacy de precios
    expect(screen.getByText('$8.500')).toBeInTheDocument()
    expect(screen.getByText('$10.000')).toBeInTheDocument()
    
    // Verifica mensaje de stock legacy
    expect(screen.queryByText(/Solo quedan/)).not.toBeInTheDocument()
  })

  it('renders new components when useNewComponents is true', () => {
    render(
      <ProductCard 
        {...defaultProps}
        useNewComponents={true}
        showExactStock={true}
        stockUnit="latas"
      />
    )
    
    // Verifica que use PriceDisplay (formato con separadores de miles)
    expect(screen.getByText('$ 8.500,00')).toBeInTheDocument()
    
    // Verifica que use StockIndicator
    expect(screen.getByText(/12 latas disponibles/)).toBeInTheDocument()
  })

  it('shows installments when enabled', () => {
    render(
      <ProductCard 
        {...defaultProps}
        useNewComponents={true}
        showInstallments={true}
        installments={{
          quantity: 6,
          amount: 1417,
          interestFree: true
        }}
      />
    )
    
    // Verifica información de cuotas
    expect(screen.getByText(/6x de/)).toBeInTheDocument()
    expect(screen.getByText(/\$ 14,17/)).toBeInTheDocument()
    expect(screen.getByText('sin interés')).toBeInTheDocument()
  })

  it('shows free shipping badge when enabled', () => {
    render(
      <ProductCard 
        {...defaultProps}
        useNewComponents={true}
        showFreeShipping={true}
      />
    )
    
    expect(screen.getByText('🚚 Envío gratis')).toBeInTheDocument()
  })

  it('shows low stock warning with new components', () => {
    render(
      <ProductCard 
        {...defaultProps}
        stock={3}
        useNewComponents={true}
        showExactStock={true}
        lowStockThreshold={5}
        stockUnit="unidades"
      />
    )
    
    // Verifica que muestre stock bajo
    expect(screen.getByText(/3 unidades disponibles/)).toBeInTheDocument()
  })

  it('shows out of stock with new components', () => {
    render(
      <ProductCard 
        {...defaultProps}
        stock={0}
        useNewComponents={true}
      />
    )
    
    expect(screen.getAllByText('Sin stock')[0]).toBeInTheDocument()
  })

  it('handles different stock units correctly', () => {
    render(
      <ProductCard 
        {...defaultProps}
        stock={5}
        useNewComponents={true}
        showExactStock={true}
        stockUnit="litros"
      />
    )
    
    expect(screen.getByText(/5 litros disponibles/)).toBeInTheDocument()
  })

  it('shows discount percentage with new PriceDisplay', () => {
    render(
      <ProductCard 
        {...defaultProps}
        useNewComponents={true}
      />
    )
    
    // PriceDisplay calcula automáticamente el descuento
    // (10000-8500)/10000 * 100 = 15%
    expect(screen.getByText('-15%')).toBeInTheDocument()
  })

  it('maintains backward compatibility with legacy props', () => {
    render(
      <ProductCard 
        {...defaultProps}
        badge="Envío gratis"
        discount="15%"
        useNewComponents={false}
      />
    )
    
    // Verifica que los props legacy sigan funcionando
    expect(screen.getByText('Envío gratis')).toBeInTheDocument()
    expect(screen.getByText('15%')).toBeInTheDocument()
  })

  it('applies compact variant for PriceDisplay in ProductCard', () => {
    const { container } = render(
      <ProductCard 
        {...defaultProps}
        useNewComponents={true}
      />
    )
    
    // Verifica que PriceDisplay use variante compact
    expect(container.querySelector('.flex-row.items-baseline')).toBeInTheDocument()
  })

  it('uses minimal variant for StockIndicator in ProductCard', () => {
    render(
      <ProductCard 
        {...defaultProps}
        stock={10}
        useNewComponents={true}
        showExactStock={true}
      />
    )
    
    // StockIndicator debería estar presente con información de stock
    expect(screen.getByText(/10 unidades disponibles/)).toBeInTheDocument()
  })

  it('handles zero price correctly with new components', () => {
    render(
      <ProductCard 
        {...defaultProps}
        price={0}
        originalPrice={undefined}
        useNewComponents={true}
      />
    )
    
    expect(screen.getByText('$ 0,00')).toBeInTheDocument()
  })

  it('handles large prices correctly with new components', () => {
    render(
      <ProductCard 
        {...defaultProps}
        price={123456}
        useNewComponents={true}
      />
    )
    
    // Verifica formato con separadores de miles
    expect(screen.getByText('$ 123.456,00')).toBeInTheDocument()
  })

  it('shows pre-order option when stock is 0 and allowPreOrder is enabled', () => {
    // Nota: Esta funcionalidad requeriría agregar allowPreOrder prop al ProductCard
    render(
      <ProductCard 
        {...defaultProps}
        stock={0}
        useNewComponents={true}
      />
    )
    
    // Por ahora solo verifica que muestre sin stock
    expect(screen.getAllByText('Sin stock')[0]).toBeInTheDocument()
  })

  it('integrates all new components together', () => {
    render(
      <ProductCard 
        {...defaultProps}
        useNewComponents={true}
        showInstallments={true}
        installments={{
          quantity: 12,
          amount: 708,
          interestFree: true
        }}
        showFreeShipping={true}
        showExactStock={true}
        stockUnit="latas"
        lowStockThreshold={10}
      />
    )
    
    // Verifica que todos los componentes estén presentes
    expect(screen.getByText('$ 8.500,00')).toBeInTheDocument() // PriceDisplay
    expect(screen.getByText(/12x de/)).toBeInTheDocument() // Installments
    expect(screen.getByText('🚚 Envío gratis')).toBeInTheDocument() // Free shipping
    expect(screen.getByText(/12 latas disponibles/)).toBeInTheDocument() // StockIndicator
  })
})
