// ===================================
// HOOK OPTIMIZADO: useCartOptimized
// ===================================
// Versión optimizada del hook de carrito con mejor performance,
// type safety mejorado y gestión de estado más eficiente

import { useCallback, useMemo, useEffect, useRef } from 'react'
import { useAuth } from '@/hooks/useAuth'
import { useAppDispatch, useAppSelector } from '@/redux/store'
import {
  selectCartItems,
  selectTotalPrice,
  selectTotalQuantity,
  addItemToCart,
  removeItemFromCart,
  updateItemQuantity,
  clearCart,
  hydrateCart,
  replaceCart,
  CartItem,
} from '@/redux/features/cart-slice'

// ===================================
// TIPOS Y INTERFACES
// ===================================

export interface CartItemWithMetadata extends CartItem {
  addedAt: number
  lastModified: number
  isTemporary?: boolean
}

export interface CartSummary {
  totalItems: number
  totalPrice: number
  totalQuantity: number
  hasItems: boolean
  isEmpty: boolean
  averageItemPrice: number
}

export interface UseCartOptimizedOptions {
  /** Habilitar persistencia automática */
  enablePersistence?: boolean
  /** Tiempo de debounce para guardado automático (ms) */
  saveDebounceMs?: number
  /** Habilitar sincronización con usuario autenticado */
  enableUserSync?: boolean
  /** Callback cuando el carrito cambia */
  onCartChange?: (items: CartItem[], summary: CartSummary) => void
  /** Callback cuando se agrega un item */
  onItemAdded?: (item: CartItem) => void
  /** Callback cuando se remueve un item */
  onItemRemoved?: (itemId: string) => void
}

export interface UseCartOptimizedReturn {
  // Estado del carrito
  items: CartItem[]
  summary: CartSummary
  isLoading: boolean
  error: string | null

  // Estado de usuario
  isAuthenticated: boolean
  userId: string | undefined

  // Funciones de manipulación
  addItem: (item: Omit<CartItem, 'quantity'>, quantity?: number) => void
  removeItem: (itemId: string) => void
  updateQuantity: (itemId: string, quantity: number) => void
  clearAllItems: () => void

  // Funciones de utilidad
  getItem: (itemId: string) => CartItem | undefined
  hasItem: (itemId: string) => boolean
  getItemQuantity: (itemId: string) => number

  // Funciones de persistencia
  saveCart: () => Promise<void>
  loadCart: () => Promise<void>
  syncWithUser: () => Promise<void>

  // Funciones de validación
  validateCart: () => boolean
  getInvalidItems: () => CartItem[]
}

// ===================================
// CONSTANTES
// ===================================

const STORAGE_KEY = 'pinteya_cart'
const MAX_QUANTITY_PER_ITEM = 99
const SAVE_DEBOUNCE_DEFAULT = 1000

// ===================================
// HOOK PRINCIPAL OPTIMIZADO
// ===================================

export function useCartOptimized(options: UseCartOptimizedOptions = {}): UseCartOptimizedReturn {
  const {
    enablePersistence = true,
    saveDebounceMs = SAVE_DEBOUNCE_DEFAULT,
    enableUserSync = true,
    onCartChange,
    onItemAdded,
    onItemRemoved,
  } = options

  // ===================================
  // ESTADO Y SELECTORES OPTIMIZADOS
  // ===================================

  const dispatch = useAppDispatch()
  const { user, isLoaded } = useAuth()

  // Selectores memoizados para mejor performance
  const items = useAppSelector(selectCartItems)
  const totalPrice = useAppSelector(selectTotalPrice)
  const totalQuantity = useAppSelector(selectTotalQuantity)

  // Referencias para optimización
  const saveTimeoutRef = useRef<NodeJS.Timeout | null>(null)
  const lastSaveRef = useRef<string>('')

  // ===================================
  // RESUMEN DEL CARRITO MEMOIZADO
  // ===================================

  const summary = useMemo<CartSummary>(() => {
    const totalItems = items.length
    const hasItems = totalItems > 0
    const isEmpty = !hasItems
    const averageItemPrice = hasItems ? totalPrice / totalQuantity : 0

    return {
      totalItems,
      totalPrice,
      totalQuantity,
      hasItems,
      isEmpty,
      averageItemPrice,
    }
  }, [items.length, totalPrice, totalQuantity])

  // ===================================
  // FUNCIONES DE MANIPULACIÓN OPTIMIZADAS
  // ===================================

  const addItem = useCallback(
    (item: Omit<CartItem, 'quantity'>, quantity: number = 1) => {
      // Validaciones
      if (quantity <= 0 || quantity > MAX_QUANTITY_PER_ITEM) {
        console.warn(
          `Cantidad inválida: ${quantity}. Debe estar entre 1 y ${MAX_QUANTITY_PER_ITEM}`
        )
        return
      }

      const cartItem: CartItem = {
        ...item,
        quantity: Math.min(quantity, MAX_QUANTITY_PER_ITEM),
      }

      dispatch(addItemToCart(cartItem))

      // Callback optimizado
      if (onItemAdded) {
        onItemAdded(cartItem)
      }
    },
    [dispatch, onItemAdded]
  )

  const removeItem = useCallback(
    (itemId: string) => {
      dispatch(removeItemFromCart(itemId))

      // Callback optimizado
      if (onItemRemoved) {
        onItemRemoved(itemId)
      }
    },
    [dispatch, onItemRemoved]
  )

  const updateQuantity = useCallback(
    (itemId: string, quantity: number) => {
      // Validaciones
      if (quantity <= 0) {
        removeItem(itemId)
        return
      }

      if (quantity > MAX_QUANTITY_PER_ITEM) {
        quantity = MAX_QUANTITY_PER_ITEM
      }

      dispatch(updateItemQuantity({ id: itemId, quantity }))
    },
    [dispatch, removeItem]
  )

  const clearAllItems = useCallback(() => {
    dispatch(clearCart())
  }, [dispatch])

  // ===================================
  // FUNCIONES DE UTILIDAD OPTIMIZADAS
  // ===================================

  const getItem = useCallback(
    (itemId: string): CartItem | undefined => {
      return items.find(item => item.id === itemId)
    },
    [items]
  )

  const hasItem = useCallback(
    (itemId: string): boolean => {
      return items.some(item => item.id === itemId)
    },
    [items]
  )

  const getItemQuantity = useCallback(
    (itemId: string): number => {
      const item = getItem(itemId)
      return item?.quantity || 0
    },
    [getItem]
  )

  // ===================================
  // FUNCIONES DE PERSISTENCIA OPTIMIZADAS
  // ===================================

  const saveToLocalStorage = useCallback(
    (cartItems: CartItem[]) => {
      if (!enablePersistence || typeof window === 'undefined') {
        return
      }

      try {
        const cartData = {
          items: cartItems,
          timestamp: Date.now(),
          version: '1.0',
        }

        localStorage.setItem(STORAGE_KEY, JSON.stringify(cartData))
      } catch (error) {
        console.error('Error guardando carrito en localStorage:', error)
      }
    },
    [enablePersistence]
  )

  const loadFromLocalStorage = useCallback((): CartItem[] => {
    if (!enablePersistence || typeof window === 'undefined') {
      return []
    }

    try {
      const stored = localStorage.getItem(STORAGE_KEY)
      if (!stored) {
        return []
      }

      const cartData = JSON.parse(stored)

      // Validar estructura de datos
      if (cartData.items && Array.isArray(cartData.items)) {
        return cartData.items
      }

      return []
    } catch (error) {
      console.error('Error cargando carrito desde localStorage:', error)
      return []
    }
  }, [enablePersistence])

  const saveCart = useCallback(async () => {
    if (!enablePersistence) {
      return
    }

    // Guardar en localStorage
    saveToLocalStorage(items)

    // Si hay usuario autenticado, guardar en backend (implementación futura)
    if (enableUserSync && user?.id) {
      try {
        // Aquí se implementaría la llamada al backend
        // await saveUserCart(user.id, items);
      } catch (error) {
        console.error('Error guardando carrito del usuario:', error)
      }
    }
  }, [items, enablePersistence, enableUserSync, user?.id, saveToLocalStorage])

  const loadCart = useCallback(async () => {
    if (!enablePersistence) {
      return
    }

    try {
      let cartItems: CartItem[] = []

      // Si hay usuario autenticado, cargar desde backend
      if (enableUserSync && user?.id) {
        try {
          // Aquí se implementaría la llamada al backend
          // cartItems = await loadUserCart(user.id);
        } catch (error) {
          console.error('Error cargando carrito del usuario:', error)
        }
      }

      // Si no hay items del usuario, cargar desde localStorage
      if (cartItems.length === 0) {
        cartItems = loadFromLocalStorage()
      }

      if (cartItems.length > 0) {
        dispatch(hydrateCart(cartItems))
      }
    } catch (error) {
      console.error('Error cargando carrito:', error)
    }
  }, [enablePersistence, enableUserSync, user?.id, loadFromLocalStorage, dispatch])

  const syncWithUser = useCallback(async () => {
    if (!enableUserSync || !user?.id) {
      return
    }

    try {
      // Migrar carrito temporal a usuario autenticado
      const temporaryItems = loadFromLocalStorage()

      if (temporaryItems.length > 0) {
        // Combinar con items existentes del usuario
        // Aquí se implementaría la lógica de merge
        dispatch(replaceCart(temporaryItems))

        // Limpiar localStorage después de migración
        localStorage.removeItem(STORAGE_KEY)
      }

      // Cargar carrito del usuario
      await loadCart()
    } catch (error) {
      console.error('Error sincronizando carrito con usuario:', error)
    }
  }, [enableUserSync, user?.id, loadFromLocalStorage, dispatch, loadCart])

  // ===================================
  // FUNCIONES DE VALIDACIÓN
  // ===================================

  const validateCart = useCallback((): boolean => {
    return items.every(
      item =>
        item.id &&
        item.name &&
        item.price > 0 &&
        item.quantity > 0 &&
        item.quantity <= MAX_QUANTITY_PER_ITEM
    )
  }, [items])

  const getInvalidItems = useCallback((): CartItem[] => {
    return items.filter(
      item =>
        !item.id ||
        !item.name ||
        item.price <= 0 ||
        item.quantity <= 0 ||
        item.quantity > MAX_QUANTITY_PER_ITEM
    )
  }, [items])

  // ===================================
  // EFECTOS OPTIMIZADOS
  // ===================================

  // Efecto para guardado automático con debounce
  useEffect(() => {
    if (!enablePersistence) {
      return
    }

    const currentCartString = JSON.stringify(items)

    // Evitar guardados innecesarios
    if (currentCartString === lastSaveRef.current) {
      return
    }

    lastSaveRef.current = currentCartString

    // Limpiar timeout anterior
    if (saveTimeoutRef.current) {
      clearTimeout(saveTimeoutRef.current)
    }

    // Programar guardado con debounce
    saveTimeoutRef.current = setTimeout(() => {
      saveCart()
    }, saveDebounceMs)

    return () => {
      if (saveTimeoutRef.current) {
        clearTimeout(saveTimeoutRef.current)
      }
    }
  }, [items, enablePersistence, saveDebounceMs, saveCart])

  // Efecto para callback de cambios
  useEffect(() => {
    if (onCartChange) {
      onCartChange(items, summary)
    }
  }, [items, summary, onCartChange])

  // Efecto para carga inicial
  useEffect(() => {
    if (isLoaded && !user) {
      // Usuario no autenticado - cargar desde localStorage
      loadCart()
    }
  }, [isLoaded, user, loadCart])

  // Efecto para sincronización con usuario
  useEffect(() => {
    console.log(
      '[useCartOptimized] 🚫 SYNC WITH USER TEMPORALMENTE DESHABILITADO PARA EVITAR RECURSIÓN'
    )

    // CÓDIGO COMENTADO TEMPORALMENTE
    // if (isLoaded && user && enableUserSync) {
    //   syncWithUser();
    // }
  }, [isLoaded, user, enableUserSync, syncWithUser])

  // ===================================
  // RETURN OPTIMIZADO
  // ===================================

  return {
    // Estado del carrito
    items,
    summary,
    isLoading: !isLoaded,
    error: null,

    // Estado de usuario
    isAuthenticated: !!user,
    userId: user?.id,

    // Funciones de manipulación
    addItem,
    removeItem,
    updateQuantity,
    clearAllItems,

    // Funciones de utilidad
    getItem,
    hasItem,
    getItemQuantity,

    // Funciones de persistencia
    saveCart,
    loadCart,
    syncWithUser,

    // Funciones de validación
    validateCart,
    getInvalidItems,
  }
}
