'use client'

import * as React from 'react'
import { ProductCard, ProductCardProps } from './card'
import {
  useDesignSystemConfig,
  shouldShowInstallments,
  shouldShowFreeShipping,
  calculateInstallments,
} from '@/lib/design-system-config'

export interface EnhancedProductCardProps
  extends Omit<ProductCardProps, 'useNewComponents' | 'installments'> {
  /** Contexto de uso para aplicar configuración específica */
  context?: 'default' | 'productDetail' | 'checkout' | 'demo'
  /** Forzar uso de nuevos componentes (override de configuración) */
  forceNewComponents?: boolean
  /** Configuración manual de cuotas (override de cálculo automático) */
  customInstallments?: {
    quantity: number
    amount: number
    interestFree?: boolean
  }
  /** Datos adicionales del producto para lógica automática */
  productData?: {
    category?: string
    weight?: number
    dimensions?: {
      length: number
      width: number
      height: number
    }
  }
}

/**
 * ProductCard mejorado con configuración automática del Design System
 *
 * Este componente aplica automáticamente las mejores prácticas del design system:
 * - Calcula cuotas basado en el precio
 * - Determina si mostrar envío gratis
 * - Aplica configuración según el contexto
 * - Usa nuevos componentes e-commerce cuando corresponde
 */
const EnhancedProductCard = React.forwardRef<HTMLDivElement, EnhancedProductCardProps>(
  (
    {
      context = 'default',
      forceNewComponents,
      customInstallments,
      productData,
      price = 0,
      originalPrice,
      stock = 0,
      stockUnit,
      showInstallments,
      showFreeShipping,
      showExactStock,
      lowStockThreshold,
      ...props
    },
    ref
  ) => {
    // Obtener configuración según contexto
    const config = useDesignSystemConfig(context === 'default' ? undefined : context)

    // Determinar si usar nuevos componentes
    const useNewComponents =
      forceNewComponents ??
      (context === 'demo' ? true : config.productCard.useNewComponentsByDefault)

    // Calcular cuotas automáticamente si no se proporcionan
    const autoInstallments = React.useMemo(() => {
      if (customInstallments) {
        return customInstallments
      }
      if (!shouldShowInstallments(price, config)) {
        return undefined
      }
      return calculateInstallments(price)
    }, [price, customInstallments, config])

    // Determinar si mostrar información de cuotas
    const shouldDisplayInstallments =
      showInstallments ?? (useNewComponents && shouldShowInstallments(price, config))

    // Determinar si mostrar envío gratis
    const shouldDisplayFreeShipping = showFreeShipping ?? shouldShowFreeShipping(price, config)

    // Configuración de stock
    const stockConfig = {
      unit: stockUnit ?? config.ecommerce.stockIndicator.defaultUnit,
      showExact:
        showExactStock ??
        (context === 'productDetail' || context === 'demo'
          ? true
          : config.ecommerce.stockIndicator.showExactQuantityByDefault),
      threshold: lowStockThreshold ?? config.ecommerce.stockIndicator.defaultLowStockThreshold,
    }

    // Determinar descuento automáticamente
    const hasDiscount = originalPrice && originalPrice > price
    const discountPercentage = hasDiscount
      ? Math.round(((originalPrice - price) / originalPrice) * 100)
      : 0

    return (
      <ProductCard
        ref={ref}
        price={price}
        originalPrice={originalPrice}
        stock={stock}
        stockUnit={stockConfig.unit}
        showExactStock={stockConfig.showExact}
        lowStockThreshold={stockConfig.threshold}
        useNewComponents={useNewComponents}
        showInstallments={shouldDisplayInstallments}
        installments={autoInstallments}
        showFreeShipping={shouldDisplayFreeShipping}
        {...props}
      />
    )
  }
)

EnhancedProductCard.displayName = 'EnhancedProductCard'

/**
 * Hook para obtener configuración de producto automática
 */
export function useProductConfig(price: number, context: string = 'default') {
  const config = useDesignSystemConfig(context as any)

  return React.useMemo(
    () => ({
      shouldShowInstallments: shouldShowInstallments(price, config),
      shouldShowFreeShipping: shouldShowFreeShipping(price, config),
      installments: calculateInstallments(price),
      useNewComponents: config.productCard.useNewComponentsByDefault,
    }),
    [price, config]
  )
}

/**
 * Componente de ejemplo para mostrar diferentes configuraciones
 */
export function ProductCardShowcase() {
  const products = [
    {
      id: 1,
      title: 'Pintura Sherwin Williams 4L',
      price: 8500,
      originalPrice: 10000,
      stock: 12,
      image:
        'https://aakzspzfulgftqlgwkpb.supabase.co/storage/v1/object/public/products/sherwin-williams/pintura-sherwin-williams.jpg',
    },
    {
      id: 2,
      title: 'Esmalte Petrilac 1L',
      price: 1850,
      originalPrice: 2200,
      stock: 8,
      image:
        'https://aakzspzfulgftqlgwkpb.supabase.co/storage/v1/object/public/products/petrilac/esmalte-petrilac.jpg',
    },
    {
      id: 3,
      title: 'Poximix 250ml',
      price: 2300,
      stock: 2,
      image:
        'https://aakzspzfulgftqlgwkpb.supabase.co/storage/v1/object/public/products/poximix/adhesivo-poximix.jpg',
    },
    {
      id: 4,
      title: 'Lija El Galgo',
      price: 450,
      stock: 0,
      image:
        'https://aakzspzfulgftqlgwkpb.supabase.co/storage/v1/object/public/products/galgo/lija-galgo.jpg',
    },
  ]

  return (
    <div className='space-y-8'>
      {/* Contexto Default */}
      <div>
        <h3 className='text-lg font-semibold mb-4'>Contexto: Default (Grid de productos)</h3>
        <div className='grid grid-cols-2 md:grid-cols-2 lg:grid-cols-4 gap-4'>
          {products.map(product => (
            <EnhancedProductCard
              key={`default-${product.id}`}
              context='default'
              title={product.title}
              price={product.price}
              originalPrice={product.originalPrice}
              stock={product.stock}
              image={product.image}
              stockUnit='unidades'
              onAddToCart={() => console.log(`Agregado: ${product.title}`)}
            />
          ))}
        </div>
      </div>

      {/* Contexto Demo */}
      <div>
        <h3 className='text-lg font-semibold mb-4'>Contexto: Demo (Nuevos componentes)</h3>
        <div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4'>
          {products.map(product => (
            <EnhancedProductCard
              key={`demo-${product.id}`}
              context='demo'
              title={product.title}
              price={product.price}
              originalPrice={product.originalPrice}
              stock={product.stock}
              image={product.image}
              stockUnit='unidades'
              onAddToCart={() => console.log(`Agregado: ${product.title}`)}
            />
          ))}
        </div>
      </div>

      {/* Contexto Product Detail */}
      <div>
        <h3 className='text-lg font-semibold mb-4'>
          Contexto: Product Detail (Información completa)
        </h3>
        <div className='max-w-sm mx-auto'>
          <EnhancedProductCard
            context='productDetail'
            title='Pintura Sherwin Williams ProClassic 4L'
            price={8500}
            originalPrice={10000}
            stock={12}
            image='https://aakzspzfulgftqlgwkpb.supabase.co/storage/v1/object/public/products/sherwin-williams/pintura-sherwin-williams.jpg'
            stockUnit='latas'
            onAddToCart={() => console.log('Agregado desde detalle')}
          />
        </div>
      </div>
    </div>
  )
}

export { EnhancedProductCard }
