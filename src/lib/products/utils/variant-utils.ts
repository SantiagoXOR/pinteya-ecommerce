// ===================================
// UTILIDADES PARA VARIANTES DE PRODUCTOS
// ===================================

/**
 * Interfaz para variantes de productos
 */
interface ProductVariant {
  id: string | number
  price_sale?: number
  price_list?: number
  measure?: string
  color_name?: string
}

/**
 * Interfaz para productos con variantes
 */
interface ProductWithVariants {
  id: string | number
  price?: number
  discountedPrice?: number
  medida?: string
  color?: string
  originalPrice?: number
  default_variant?: ProductVariant
  variants?: ProductVariant[]
}

/**
 * Obtiene el precio efectivo de una variante (price_sale || price_list)
 * @param variant - Variante del producto
 * @returns Precio efectivo de la variante (0 si no existe)
 */
export function getVariantEffectivePrice(variant: ProductVariant | null | undefined): number {
  if (!variant) return 0
  return Number(variant.price_sale) || Number(variant.price_list) || 0
}

/**
 * Encuentra la variante más costosa de un producto
 * @param product - Producto con variantes
 * @returns La variante más costosa o null si no hay variantes
 */
export function getMostExpensiveVariant(
  product: ProductWithVariants
): ProductVariant | null {
  if (!product.variants || product.variants.length === 0) return null
  
  return product.variants.reduce((mostExpensive: ProductVariant, current: ProductVariant) => {
    const currentPrice = getVariantEffectivePrice(current)
    const mostExpensivePrice = getVariantEffectivePrice(mostExpensive)
    return currentPrice > mostExpensivePrice ? current : mostExpensive
  }, product.variants[0])
}

/**
 * Actualiza un producto con su variante más costosa
 * Esto es útil para productos con envío gratis donde queremos mostrar el precio más alto
 * @param product - Producto a actualizar
 * @returns Producto actualizado con la variante más costosa como default
 */
export function updateProductWithMostExpensiveVariant(
  product: ProductWithVariants
): ProductWithVariants {
  const mostExpensiveVariant = getMostExpensiveVariant(product)
  
  if (mostExpensiveVariant) {
    const variantPrice = getVariantEffectivePrice(mostExpensiveVariant)
    const variantListPrice = Number(mostExpensiveVariant.price_list) || variantPrice
    
    // Actualizar default_variant para que ProductItem use la variante más cara por defecto
    const updatedVariants = product.variants ? [...product.variants] : []
    const mostExpensiveVariantIndex = updatedVariants.findIndex(
      (v: ProductVariant) => v.id === mostExpensiveVariant.id
    )
    
    return {
      ...product,
      price: variantListPrice,
      discountedPrice: variantPrice,
      medida: mostExpensiveVariant.measure || product.medida,
      color: mostExpensiveVariant.color_name || product.color, // Actualizar color con el de la variante más cara
      // Actualizar también originalPrice si existe
      originalPrice: variantListPrice,
      // Establecer la variante más cara como default_variant
      default_variant: mostExpensiveVariant,
      // Asegurarse de que la variante más cara esté al inicio del array para que sea la seleccionada por defecto
      variants: mostExpensiveVariantIndex > 0 
        ? [mostExpensiveVariant, ...updatedVariants.filter((v: ProductVariant) => v.id !== mostExpensiveVariant.id)]
        : updatedVariants,
    }
  }
  
  return product
}
