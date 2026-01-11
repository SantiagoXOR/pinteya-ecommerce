import { ProductGrid } from '../ui/ProductGrid'
import { ProductCard } from '../ui/ProductCard'
import { AddToCartButton } from '../client/AddToCartButton'
import type { BestSellerSectionProps } from '../types'

/**
 * BestSellerSection - Server Component
 * Renderiza grid de productos bestseller sin skeleton
 */
export function BestSellerSection({ products, limit, className }: BestSellerSectionProps) {
  // Limitar productos si se especifica
  const displayedProducts = limit ? products.slice(0, limit) : products

  if (displayedProducts.length === 0) {
    return (
      <section className={`py-6 ${className || ''}`}>
        <div className="max-w-[1170px] w-full mx-auto px-4 sm:px-8">
          <div className="text-center py-12">
            <p className="text-gray-500">No hay productos disponibles en este momento.</p>
          </div>
        </div>
      </section>
    )
  }

  return (
    <section className={`py-6 ${className || ''}`}>
      <div className="max-w-[1170px] w-full mx-auto px-4 sm:px-8">
        <h2 className="text-2xl font-bold text-gray-900 mb-6">Más Vendidos</h2>
        <ProductGrid products={displayedProducts} columns={4}>
          {(product) => (
            <ProductCard 
              product={product}
              priority={product.id === displayedProducts[0]?.id}
              actions={
                <AddToCartButton 
                  productId={product.id} 
                  productName={product.name || product.title}
                />
              }
            />
          )}
        </ProductGrid>
      </div>
    </section>
  )
}
