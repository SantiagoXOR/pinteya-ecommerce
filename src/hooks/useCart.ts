// ===================================
// HOOK DEL CARRITO
// Hook completo para el carrito de compras con Redux
// ===================================

import { useAppSelector, useAppDispatch } from '@/redux/store'
import {
  addItemToCart,
  removeItemFromCart,
  updateCartItemQuantity,
  removeAllItemsFromCart,
  CartItem,
} from '@/redux/features/cart-slice'

export const useCart = () => {
  const cartItems = useAppSelector(state => state.cartReducer.items)
  const dispatch = useAppDispatch()

  // Cálculos derivados
  const cartCount = cartItems.length
  const totalQuantity = cartItems.reduce((total, item) => total + item.quantity, 0)
  const totalPrice = cartItems.reduce((total, item) => total + item.price * item.quantity, 0)

  // Acciones del carrito
  const addToCart = (item: CartItem) => {
    dispatch(addItemToCart(item))
  }

  const removeFromCart = (id: number) => {
    dispatch(removeItemFromCart(id))
  }

  const updateQuantity = (id: number, quantity: number) => {
    if (quantity <= 0) {
      dispatch(removeItemFromCart(id))
    } else {
      dispatch(updateCartItemQuantity({ id, quantity }))
    }
  }

  const clearCart = () => {
    dispatch(removeAllItemsFromCart())
  }

  return {
    cartItems,
    cartCount,
    totalQuantity,
    totalPrice,
    addToCart,
    removeFromCart,
    updateQuantity,
    clearCart,
    dispatch,
  }
}
