'use client'

import { Button } from '@/components/ui/button'
import { ShoppingCart } from '@/lib/optimized-imports'

interface AddToCartButtonProps {
  productId: number | string
  productName?: string
}

/**
 * AddToCartButton - Client Component mínimo
 * Solo para interactividad de agregar al carrito
 */
export function AddToCartButton({ productId, productName }: AddToCartButtonProps) {
  const handleAddToCart = () => {
    // TODO: Implementar lógica de agregar al carrito
    console.log('Agregar al carrito:', productId, productName)
  }

  return (
    <Button 
      onClick={handleAddToCart}
      className="w-full"
      size="sm"
    >
      <ShoppingCart className="w-4 h-4 mr-2" />
      Agregar al Carrito
    </Button>
  )
}
