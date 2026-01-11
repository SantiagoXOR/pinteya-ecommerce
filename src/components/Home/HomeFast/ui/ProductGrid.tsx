import type { ProductGridProps } from '../types'

/**
 * ProductGrid - Componente UI reutilizable
 * Renderiza grid de productos con layout configurable
 */
export function ProductGrid({ 
  products, 
  columns = 4, 
  gap = 'md',
  children 
}: ProductGridProps) {
  const gridClasses = {
    2: 'grid-cols-2',
    3: 'grid-cols-3',
    4: 'grid-cols-2 md:grid-cols-4',
  }
  
  const gapClasses = {
    sm: 'gap-2',
    md: 'gap-4',
    lg: 'gap-6',
  }

  return (
    <div className={`grid ${gridClasses[columns]} ${gapClasses[gap]}`}>
      {products.map((product) => (
        <div key={product.id}>
          {children(product)}
        </div>
      ))}
    </div>
  )
}
