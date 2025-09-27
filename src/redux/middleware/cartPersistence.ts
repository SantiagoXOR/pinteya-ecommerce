// ===================================
// PINTEYA E-COMMERCE - CART PERSISTENCE MIDDLEWARE
// ===================================

import { Middleware, AnyAction } from '@reduxjs/toolkit'
import { RootState } from '../store'

// Clave para localStorage
const CART_STORAGE_KEY = 'pinteya-cart'

// Definición de CartItem (importada desde cart-slice)
export interface CartItem {
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

// Tipos para el estado persistido
interface PersistedCartState {
  items: CartItem[]
  timestamp: number
  version: string
}

// Función para cargar el carrito desde localStorage
export const loadCartFromStorage = (): CartItem[] => {
  // Solo ejecutar en el cliente
  if (typeof window === 'undefined') {
    return []
  }

  try {
    const stored = localStorage.getItem(CART_STORAGE_KEY)
    if (!stored || stored.trim() === '' || stored === '""' || stored === "''") {
      return []
    }

    // Validar que el string no esté corrupto
    if (stored.includes('""') && stored.length < 5) {
      console.warn('Detected corrupted cart localStorage data, cleaning up')
      localStorage.removeItem(CART_STORAGE_KEY)
      return []
    }

    const parsed: PersistedCartState = JSON.parse(stored)

    // Verificar estructura válida
    if (!parsed || typeof parsed !== 'object') {
      console.warn('Invalid cart data structure, cleaning up')
      localStorage.removeItem(CART_STORAGE_KEY)
      return []
    }

    // Verificar que no sea muy antiguo (7 días)
    const maxAge = 7 * 24 * 60 * 60 * 1000 // 7 días en ms
    const isExpired = parsed.timestamp && Date.now() - parsed.timestamp > maxAge

    if (isExpired) {
      localStorage.removeItem(CART_STORAGE_KEY)
      return []
    }

    return parsed.items || []
  } catch (error) {
    console.warn('Error loading cart from localStorage:', error)
    // Limpiar localStorage corrupto
    localStorage.removeItem(CART_STORAGE_KEY)
    return []
  }
}

// Función para guardar el carrito en localStorage
const saveCartToStorage = (cartItems: CartItem[]): void => {
  // Solo ejecutar en el cliente
  if (typeof window === 'undefined') {
    return
  }

  try {
    // Si el carrito está vacío, limpiar localStorage
    if (cartItems.length === 0) {
      localStorage.removeItem(CART_STORAGE_KEY)
      return
    }

    const dataToStore: PersistedCartState = {
      items: cartItems,
      timestamp: Date.now(),
      version: '1.0.0',
    }

    localStorage.setItem(CART_STORAGE_KEY, JSON.stringify(dataToStore))
  } catch (error) {
    console.warn('Error saving cart to localStorage:', error)
  }
}

// Función para limpiar el carrito del localStorage
export const clearCartFromStorage = (): void => {
  if (typeof window === 'undefined') {
    return
  }

  try {
    localStorage.removeItem(CART_STORAGE_KEY)
  } catch (error) {
    console.warn('Error clearing cart from localStorage:', error)
  }
}

// Variable para manejar debounce
let saveTimeout: NodeJS.Timeout | null = null

// Middleware para persistir el carrito automáticamente
export const cartPersistenceMiddleware: Middleware = store => next => (action: AnyAction) => {
  // Ejecutar la acción primero
  const result = next(action)

  // Solo persistir acciones relacionadas con el carrito
  if (action.type?.startsWith('cart/')) {
    const state = store.getState() as RootState
    const cartItems = state.cartReducer.items

    // Limpiar timeout anterior si existe
    if (saveTimeout) {
      clearTimeout(saveTimeout)
    }

    // Guardar en localStorage con debounce más largo para evitar escrituras excesivas
    saveTimeout = setTimeout(() => {
      // Solo guardar si hay items o si se está vaciando el carrito
      if (cartItems.length > 0 || action.type === 'cart/removeAllItemsFromCart') {
        saveCartToStorage(cartItems)
      }
      saveTimeout = null
    }, 500) // Aumentado de 100ms a 500ms
  }

  return result
}

// Hook personalizado para manejar la persistencia del carrito
export const useCartPersistence = () => {
  const loadCart = () => loadCartFromStorage()
  const clearCart = () => clearCartFromStorage()

  return {
    loadCart,
    clearCart,
  }
}

// Función para migrar carrito temporal a usuario autenticado
export const migrateTemporaryCart = async (
  temporaryCartItems: CartItem[],
  userId: string
): Promise<boolean> => {
  try {
    // Aquí se podría implementar la lógica para guardar el carrito
    // en la base de datos asociado al usuario
    // Por ahora, simplemente limpiamos el localStorage
    // ya que el carrito se mantendrá en Redux

    // En una implementación completa, aquí haríamos:
    // 1. Enviar los items al backend para asociarlos al usuario
    // 2. Limpiar el localStorage
    // 3. Cargar el carrito del usuario desde el backend

    return true
  } catch (error) {
    console.error('Error migrating temporary cart:', error)
    return false
  }
}

// Función para cargar carrito de usuario autenticado
export const loadUserCart = async (userId: string): Promise<CartItem[]> => {
  try {
    // Aquí se implementaría la lógica para cargar el carrito
    // del usuario desde la base de datos

    // En una implementación completa, aquí haríamos:
    // 1. Hacer una petición al backend para obtener el carrito del usuario
    // 2. Retornar los items del carrito

    // Por ahora, retornamos un array vacío
    return []
  } catch (error) {
    console.error('Error loading user cart:', error)
    return []
  }
}

// Función para guardar carrito de usuario autenticado
export const saveUserCart = async (userId: string, cartItems: CartItem[]): Promise<boolean> => {
  try {
    // Aquí se implementaría la lógica para guardar el carrito
    // del usuario en la base de datos

    // En una implementación completa, aquí haríamos:
    // 1. Enviar los items al backend para guardarlos asociados al usuario
    // 2. Manejar la respuesta del backend

    return true
  } catch (error) {
    console.error('Error saving user cart:', error)
    return false
  }
}
