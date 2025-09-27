import { useReducer, useCallback, useMemo } from 'react'

// Tipos para el estado del componente ShopDetails
interface ShopDetailsState {
  activeColor: string
  previewImg: number
  storage: string
  type: string
  sim: string
  quantity: number
  activeTab: string
  isLoading: boolean
  error: string | null
}

// Tipos de acciones
type ShopDetailsAction =
  | { type: 'SET_ACTIVE_COLOR'; payload: string }
  | { type: 'SET_PREVIEW_IMG'; payload: number }
  | { type: 'SET_STORAGE'; payload: string }
  | { type: 'SET_TYPE'; payload: string }
  | { type: 'SET_SIM'; payload: string }
  | { type: 'SET_QUANTITY'; payload: number }
  | { type: 'SET_ACTIVE_TAB'; payload: string }
  | { type: 'SET_LOADING'; payload: boolean }
  | { type: 'SET_ERROR'; payload: string | null }
  | { type: 'RESET_STATE' }
  | { type: 'INCREMENT_QUANTITY' }
  | { type: 'DECREMENT_QUANTITY' }

// Estado inicial
const initialState: ShopDetailsState = {
  activeColor: 'blanco-puro', // Usar ID del color por defecto
  previewImg: 0,
  storage: 'gb128',
  type: 'active',
  sim: 'dual',
  quantity: 1,
  activeTab: 'tabOne',
  isLoading: false,
  error: null,
}

// Reducer function
function shopDetailsReducer(state: ShopDetailsState, action: ShopDetailsAction): ShopDetailsState {
  switch (action.type) {
    case 'SET_ACTIVE_COLOR':
      return { ...state, activeColor: action.payload }

    case 'SET_PREVIEW_IMG':
      return { ...state, previewImg: action.payload }

    case 'SET_STORAGE':
      return { ...state, storage: action.payload }

    case 'SET_TYPE':
      return { ...state, type: action.payload }

    case 'SET_SIM':
      return { ...state, sim: action.payload }

    case 'SET_QUANTITY':
      return {
        ...state,
        quantity: Math.max(1, Math.min(99, action.payload)), // Límites de cantidad
      }

    case 'SET_ACTIVE_TAB':
      return { ...state, activeTab: action.payload }

    case 'SET_LOADING':
      return { ...state, isLoading: action.payload }

    case 'SET_ERROR':
      return { ...state, error: action.payload }

    case 'INCREMENT_QUANTITY':
      return {
        ...state,
        quantity: Math.min(99, state.quantity + 1),
      }

    case 'DECREMENT_QUANTITY':
      return {
        ...state,
        quantity: Math.max(1, state.quantity - 1),
      }

    case 'RESET_STATE':
      return initialState

    default:
      return state
  }
}

// Hook personalizado
export function useShopDetailsReducer() {
  const [state, dispatch] = useReducer(shopDetailsReducer, initialState)

  // Acciones memoizadas
  const actions = useMemo(
    () => ({
      setActiveColor: (color: string) => dispatch({ type: 'SET_ACTIVE_COLOR', payload: color }),

      setPreviewImg: (index: number) => dispatch({ type: 'SET_PREVIEW_IMG', payload: index }),

      setStorage: (storage: string) => dispatch({ type: 'SET_STORAGE', payload: storage }),

      setType: (type: string) => dispatch({ type: 'SET_TYPE', payload: type }),

      setSim: (sim: string) => dispatch({ type: 'SET_SIM', payload: sim }),

      setQuantity: (quantity: number) => dispatch({ type: 'SET_QUANTITY', payload: quantity }),

      setActiveTab: (tab: string) => dispatch({ type: 'SET_ACTIVE_TAB', payload: tab }),

      setLoading: (loading: boolean) => dispatch({ type: 'SET_LOADING', payload: loading }),

      setError: (error: string | null) => dispatch({ type: 'SET_ERROR', payload: error }),

      incrementQuantity: () => dispatch({ type: 'INCREMENT_QUANTITY' }),

      decrementQuantity: () => dispatch({ type: 'DECREMENT_QUANTITY' }),

      resetState: () => dispatch({ type: 'RESET_STATE' }),
    }),
    []
  )

  // Selectores memoizados para valores derivados
  const selectors = useMemo(
    () => ({
      // Verificar si hay errores
      hasError: Boolean(state.error),

      // Verificar si está en estado de carga
      isLoading: state.isLoading,

      // Obtener configuración actual del producto
      currentConfig: {
        color: state.activeColor,
        storage: state.storage,
        type: state.type,
        sim: state.sim,
        quantity: state.quantity,
      },

      // Verificar si la cantidad está en el límite
      isMaxQuantity: state.quantity >= 99,
      isMinQuantity: state.quantity <= 1,

      // Obtener precio total basado en cantidad
      getTotalPrice: (unitPrice: number) => unitPrice * state.quantity,
    }),
    [state]
  )

  return {
    state,
    actions,
    selectors,
  }
}

// Hook para manejar la persistencia en localStorage
export function useShopDetailsWithPersistence(productId?: string) {
  const { state, actions, selectors } = useShopDetailsReducer()

  // Callbacks memoizados para persistencia
  const persistenceActions = useMemo(
    () => ({
      saveToStorage: useCallback(() => {
        if (productId) {
          const key = `shop-details-${productId}`
          localStorage.setItem(key, JSON.stringify(state))
        }
      }, [state, productId]),

      loadFromStorage: useCallback(() => {
        if (productId) {
          const key = `shop-details-${productId}`
          const saved = localStorage.getItem(key)
          if (saved) {
            try {
              const parsedState = JSON.parse(saved)
              // Restaurar estado desde localStorage
              Object.entries(parsedState).forEach(([key, value]) => {
                switch (key) {
                  case 'activeColor':
                    actions.setActiveColor(value as string)
                    break
                  case 'storage':
                    actions.setStorage(value as string)
                    break
                  case 'type':
                    actions.setType(value as string)
                    break
                  case 'sim':
                    actions.setSim(value as string)
                    break
                  case 'quantity':
                    actions.setQuantity(value as number)
                    break
                }
              })
            } catch (error) {
              console.warn('Error loading shop details from storage:', error)
            }
          }
        }
      }, [productId, actions]),
    }),
    [state, productId, actions]
  )

  return {
    state,
    actions,
    selectors,
    persistenceActions,
  }
}

export type { ShopDetailsState, ShopDetailsAction }
