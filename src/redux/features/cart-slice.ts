import { createSelector, createSlice, PayloadAction } from '@reduxjs/toolkit'
import { RootState } from '../store'
import { loadCartFromStorage } from '../middleware/cartPersistence'

type InitialState = {
  items: CartItem[]
}

export type CartItem = {
  id: number
  title: string
  price: number
  discountedPrice: number
  quantity: number
  imgs?: {
    thumbnails: string[]
    previews: string[]
  }
  // Atributos opcionales para mostrar descriptores (color, medida, etc.)
  attributes?: {
    color?: string
    medida?: string
    finish?: string
  }
  // ID de la variante seleccionada (para validación de stock)
  variant_id?: number | string
}

/**
 * Compara dos items del carrito para determinar si son iguales
 * Dos items son iguales si tienen el mismo id Y los mismos attributes (color, medida, finish)
 */
function areItemsEqual(item1: CartItem, item2: CartItem): boolean {
  // Primero comparar id
  if (item1.id !== item2.id) {
    return false
  }

  // Normalizar attributes para comparación
  const normalizeAttr = (value?: string) => {
    if (!value) return ''
    return value.trim().toLowerCase()
  }

  const attrs1 = item1.attributes || {}
  const attrs2 = item2.attributes || {}

  // Comparar cada atributo normalizado
  const color1 = normalizeAttr(attrs1.color)
  const color2 = normalizeAttr(attrs2.color)
  const medida1 = normalizeAttr(attrs1.medida)
  const medida2 = normalizeAttr(attrs2.medida)
  const finish1 = normalizeAttr(attrs1.finish)
  const finish2 = normalizeAttr(attrs2.finish)

  // Dos items son iguales si tienen el mismo id y los mismos attributes
  return color1 === color2 && medida1 === medida2 && finish1 === finish2
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
      const newItem = action.payload
      // Buscar item existente usando comparación por id + attributes (variantes)
      const existingItem = state.items.find(item => areItemsEqual(item, newItem))

      if (existingItem) {
        // Si el item ya existe con las mismas variantes, sumar cantidad
        existingItem.quantity += newItem.quantity
      } else {
        // Si no existe o tiene variantes diferentes, agregar como nuevo item
        state.items.push(newItem)
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
