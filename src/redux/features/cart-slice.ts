import { createSelector, createSlice, PayloadAction } from '@reduxjs/toolkit'
import { RootState } from '../store'
import { loadCartFromStorage } from '../middleware/cartPersistence'

type InitialState = {
  items: CartItem[]
}

type CartItem = {
  id: number
  title: string
  price: number
  discountedPrice: number
  quantity: number
  imgs?: {
    thumbnails: string[]
    previews: string[]
  }
}

// Función para obtener el estado inicial con persistencia
const getInitialState = (): InitialState => {
  // En el servidor, siempre retornar estado vacío
  if (typeof window === 'undefined') {
    return { items: [] }
  }

  // En el cliente, intentar cargar desde localStorage
  try {
    const persistedItems = loadCartFromStorage()
    return { items: persistedItems }
  } catch (error) {
    console.warn('Error loading persisted cart:', error)
    return { items: [] }
  }
}

const initialState: InitialState = getInitialState()

export const cart = createSlice({
  name: 'cart',
  initialState,
  reducers: {
    addItemToCart: (state, action: PayloadAction<CartItem>) => {
      const { id, title, price, quantity, discountedPrice, imgs } = action.payload
      const existingItem = state.items.find(item => item.id === id)

      if (existingItem) {
        existingItem.quantity += quantity
      } else {
        state.items.push({
          id,
          title,
          price,
          quantity,
          discountedPrice,
          imgs,
        })
      }
    },
    removeItemFromCart: (state, action: PayloadAction<number>) => {
      const itemId = action.payload
      state.items = state.items.filter(item => item.id !== itemId)
    },
    updateCartItemQuantity: (state, action: PayloadAction<{ id: number; quantity: number }>) => {
      const { id, quantity } = action.payload
      const existingItem = state.items.find(item => item.id === id)

      if (existingItem) {
        existingItem.quantity = quantity
      }
    },

    removeAllItemsFromCart: state => {
      state.items = []
    },

    // Acción para hidratar el carrito desde localStorage
    hydrateCart: (state, action: PayloadAction<CartItem[]>) => {
      state.items = action.payload
    },

    // Acción para reemplazar todo el carrito (útil para migración de usuarios)
    replaceCart: (state, action: PayloadAction<CartItem[]>) => {
      state.items = action.payload
    },
  },
})

export const selectCartItems = (state: RootState) => state.cartReducer.items

export const selectTotalPrice = createSelector([selectCartItems], items => {
  return items.reduce((total: number, item: CartItem) => {
    return total + item.discountedPrice * item.quantity
  }, 0)
})

export const {
  addItemToCart,
  removeItemFromCart,
  updateCartItemQuantity,
  removeAllItemsFromCart,
  hydrateCart,
  replaceCart,
} = cart.actions
export default cart.reducer
