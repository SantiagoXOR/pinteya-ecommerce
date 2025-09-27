// ===================================
// HOOK DE ACCIONES DEL CARRITO
// Hook simplificado para acciones del carrito
// ===================================

import { useCart } from './useCart'

export const useCartActions = () => {
  const { addToCart, removeFromCart, updateQuantity, clearCart } = useCart()

  return {
    addToCart,
    removeFromCart,
    updateQuantity,
    clearCart,
  }
}
