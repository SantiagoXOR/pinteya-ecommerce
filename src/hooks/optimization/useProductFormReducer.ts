import { useReducer, useCallback, useMemo } from 'react'

// Tipos para el estado del formulario de productos
interface ProductFormState {
  // UI State
  activeTab: string
  previewMode: boolean
  
  // Información básica
  name: string
  description: string
  shortDescription: string
  categoryId: string
  status: 'active' | 'inactive' | 'draft'

  // Detalles del producto
  brand: string
  model: string
  sku: string
  barcode: string

  // Precios
  price: number
  comparePrice: number
  costPrice: number
  taxRate: number

  // Inventario
  trackInventory: boolean
  stock: number
  lowStockThreshold: number
  allowBackorder: boolean

  // Envío
  requiresShipping: boolean
  weight: number
  dimensions: {
    length: number
    width: number
    height: number
  }

  // SEO
  seoTitle: string
  seoDescription: string
  seoKeywords: string[]

  // Imágenes y variantes
  images: string[]
  variants: any[]

  // Estado del formulario
  isLoading: boolean
  isSaving: boolean
  errors: Record<string, string>
  isDirty: boolean
  currentStep: number
  validationErrors: Record<string, string[]>
  uploadProgress: number
  isUploading: boolean
}

// Tipos de acciones
type ProductFormAction =
  | { type: 'SET_FIELD'; field: keyof ProductFormState; value: any }
  | { type: 'SET_MULTIPLE_FIELDS'; fields: Partial<ProductFormState> }
  | { type: 'SET_LOADING'; payload: boolean }
  | { type: 'SET_SAVING'; payload: boolean }
  | { type: 'SET_ERROR'; field: string; error: string }
  | { type: 'CLEAR_ERROR'; field: string }
  | { type: 'CLEAR_ALL_ERRORS' }
  | { type: 'SET_VALIDATION_ERRORS'; errors: Record<string, string[]> }
  | { type: 'SET_DIRTY'; payload: boolean }
  | { type: 'SET_STEP'; step: number }
  | { type: 'NEXT_STEP' }
  | { type: 'PREV_STEP' }
  | { type: 'SET_ACTIVE_TAB'; tab: string }
  | { type: 'SET_PREVIEW_MODE'; previewMode: boolean }
  | { type: 'ADD_IMAGE'; image: string }
  | { type: 'REMOVE_IMAGE'; index: number }
  | { type: 'ADD_VARIANT'; variant: any }
  | { type: 'REMOVE_VARIANT'; index: number }
  | { type: 'UPDATE_VARIANT'; index: number; variant: any }
  | { type: 'ADD_SEO_KEYWORD'; keyword: string }
  | { type: 'REMOVE_SEO_KEYWORD'; index: number }
  | { type: 'RESET_FORM' }
  | { type: 'LOAD_PRODUCT'; product: Partial<ProductFormState> }

// Estado inicial
const initialState: ProductFormState = {
  // UI State
  activeTab: 'general',
  previewMode: false,
  
  // Información básica
  name: '',
  description: '',
  shortDescription: '',
  categoryId: '',
  status: 'draft',

  // Detalles del producto
  brand: '',
  model: '',
  sku: '',
  barcode: '',

  // Precios
  price: 0,
  comparePrice: 0,
  costPrice: 0,
  taxRate: 0,

  // Inventario
  trackInventory: true,
  stock: 0,
  lowStockThreshold: 5,
  allowBackorder: false,

  // Envío
  requiresShipping: true,
  weight: 0,
  dimensions: {
    length: 0,
    width: 0,
    height: 0,
  },

  // SEO
  seoTitle: '',
  seoDescription: '',
  seoKeywords: [],

  // Imágenes y variantes
  images: [],
  variants: [],

  // Estado del formulario
  isLoading: false,
  isSaving: false,
  errors: {},
  isDirty: false,
  currentStep: 0,
  validationErrors: {},
  uploadProgress: 0,
  isUploading: false,
}

// Reducer function
function productFormReducer(state: ProductFormState, action: ProductFormAction): ProductFormState {
  switch (action.type) {
    case 'SET_FIELD':
      return {
        ...state,
        [action.field]: action.value,
        isDirty: true,
        // Limpiar error del campo si existe
        errors: {
          ...state.errors,
          [action.field]: undefined,
        },
      }

    case 'SET_MULTIPLE_FIELDS':
      return {
        ...state,
        ...action.fields,
        isDirty: true,
      }

    case 'SET_LOADING':
      return { ...state, isLoading: action.payload }

    case 'SET_SAVING':
      return { ...state, isSaving: action.payload }

    case 'SET_ERROR':
      return {
        ...state,
        errors: {
          ...state.errors,
          [action.field]: action.error,
        },
      }

    case 'CLEAR_ERROR':
      const { [action.field]: _, ...restErrors } = state.errors
      return {
        ...state,
        errors: restErrors,
      }

    case 'CLEAR_ALL_ERRORS':
      return {
        ...state,
        errors: {},
        validationErrors: {},
      }

    case 'SET_VALIDATION_ERRORS':
      return {
        ...state,
        validationErrors: action.errors,
      }

    case 'SET_DIRTY':
      return { ...state, isDirty: action.payload }

    case 'SET_STEP':
      return { ...state, currentStep: Math.max(0, Math.min(4, action.step)) }

    case 'NEXT_STEP':
      return { ...state, currentStep: Math.min(4, state.currentStep + 1) }

    case 'PREV_STEP':
      return { ...state, currentStep: Math.max(0, state.currentStep - 1) }

    case 'SET_ACTIVE_TAB':
      return { ...state, activeTab: action.tab }

    case 'SET_PREVIEW_MODE':
      return { ...state, previewMode: action.previewMode }

    case 'ADD_IMAGE':
      return {
        ...state,
        images: [...state.images, action.image],
        isDirty: true,
      }

    case 'REMOVE_IMAGE':
      return {
        ...state,
        images: state.images.filter((_, index) => index !== action.index),
        isDirty: true,
      }

    case 'ADD_VARIANT':
      return {
        ...state,
        variants: [...state.variants, action.variant],
        isDirty: true,
      }

    case 'REMOVE_VARIANT':
      return {
        ...state,
        variants: state.variants.filter((_, index) => index !== action.index),
        isDirty: true,
      }

    case 'UPDATE_VARIANT':
      return {
        ...state,
        variants: state.variants.map((variant, index) =>
          index === action.index ? action.variant : variant
        ),
        isDirty: true,
      }

    case 'ADD_SEO_KEYWORD':
      if (!state.seoKeywords.includes(action.keyword)) {
        return {
          ...state,
          seoKeywords: [...state.seoKeywords, action.keyword],
          isDirty: true,
        }
      }
      return state

    case 'REMOVE_SEO_KEYWORD':
      return {
        ...state,
        seoKeywords: state.seoKeywords.filter((_, index) => index !== action.index),
        isDirty: true,
      }

    case 'RESET_FORM':
      return initialState

    case 'LOAD_PRODUCT':
      return {
        ...state,
        ...action.product,
        isDirty: false,
      }

    default:
      return state
  }
}

// Hook personalizado
export function useProductFormReducer(initialStateOverride?: Partial<ProductFormState>) {
  const initialStateWithOverride = { ...initialState, ...initialStateOverride }
  const [state, dispatch] = useReducer(productFormReducer, initialStateWithOverride)

  // Acciones memoizadas
  const actions = useMemo(
    () => ({
      setField: (field: keyof ProductFormState, value: any) =>
        dispatch({ type: 'SET_FIELD', field, value }),

      setMultipleFields: (fields: Partial<ProductFormState>) =>
        dispatch({ type: 'SET_MULTIPLE_FIELDS', fields }),

      setLoading: (loading: boolean) => dispatch({ type: 'SET_LOADING', payload: loading }),

      setSaving: (saving: boolean) => dispatch({ type: 'SET_SAVING', payload: saving }),

      setError: (field: string, error: string) => dispatch({ type: 'SET_ERROR', field, error }),

      clearError: (field: string) => dispatch({ type: 'CLEAR_ERROR', field }),

      clearAllErrors: () => dispatch({ type: 'CLEAR_ALL_ERRORS' }),

      setValidationErrors: (errors: Record<string, string[]>) =>
        dispatch({ type: 'SET_VALIDATION_ERRORS', errors }),

      setDirty: (dirty: boolean) => dispatch({ type: 'SET_DIRTY', payload: dirty }),

      setStep: (step: number) => dispatch({ type: 'SET_STEP', step }),

      nextStep: () => dispatch({ type: 'NEXT_STEP' }),

      prevStep: () => dispatch({ type: 'PREV_STEP' }),

      setActiveTab: (tab: string) => dispatch({ type: 'SET_ACTIVE_TAB', tab }),

      setPreviewMode: (previewMode: boolean) =>
        dispatch({ type: 'SET_PREVIEW_MODE', previewMode }),

      addImage: (image: string) => dispatch({ type: 'ADD_IMAGE', image }),

      removeImage: (index: number) => dispatch({ type: 'REMOVE_IMAGE', index }),

      addVariant: (variant: any) => dispatch({ type: 'ADD_VARIANT', variant }),

      removeVariant: (index: number) => dispatch({ type: 'REMOVE_VARIANT', index }),

      updateVariant: (index: number, variant: any) =>
        dispatch({ type: 'UPDATE_VARIANT', index, variant }),

      addSeoKeyword: (keyword: string) => dispatch({ type: 'ADD_SEO_KEYWORD', keyword }),

      removeSeoKeyword: (index: number) => dispatch({ type: 'REMOVE_SEO_KEYWORD', index }),

      resetForm: () => dispatch({ type: 'RESET_FORM' }),

      loadProduct: (product: Partial<ProductFormState>) =>
        dispatch({ type: 'LOAD_PRODUCT', product }),
    }),
    []
  )

  // Selectores memoizados
  const selectors = useMemo(
    () => ({
      // Verificaciones de estado
      hasErrors: Object.keys(state.errors).length > 0,
      hasValidationErrors: Object.keys(state.validationErrors).length > 0,
      isFormValid: Object.keys(state.errors).length === 0 && state.name.trim() !== '',

      // Información de pasos
      isFirstStep: state.currentStep === 0,
      isLastStep: state.currentStep === 4,
      stepProgress: ((state.currentStep + 1) / 5) * 100,

      // Cálculos de precios
      profitMargin:
        state.price > 0 && state.costPrice > 0
          ? ((state.price - state.costPrice) / state.price) * 100
          : 0,

      discountPercentage:
        state.comparePrice > 0 && state.price > 0
          ? ((state.comparePrice - state.price) / state.comparePrice) * 100
          : 0,

      // Estado de inventario
      isLowStock: state.stock <= state.lowStockThreshold,
      isOutOfStock: state.stock === 0,

      // Validaciones específicas
      isPriceValid: state.price > 0,
      isSkuValid: state.sku.length > 0,
      areDimensionsValid:
        state.dimensions.length > 0 && state.dimensions.width > 0 && state.dimensions.height > 0,

      // Contadores
      imageCount: state.images.length,
      variantCount: state.variants.length,
      keywordCount: state.seoKeywords.length,

      // Obtener errores por paso
      getStepErrors: (step: number) => {
        const stepFields = {
          0: ['name', 'description', 'categoryId'],
          1: ['price', 'comparePrice', 'costPrice'],
          2: ['stock', 'lowStockThreshold'],
          3: ['images'],
          4: ['seoTitle', 'seoDescription'],
        }

        const fields = stepFields[step as keyof typeof stepFields] || []
        return fields.filter(field => state.errors[field])
      },
    }),
    [state]
  )

  return {
    state,
    actions,
    selectors,
  }
}

// Hook para validación en tiempo real
export function useProductFormValidation() {
  const { state, actions, selectors } = useProductFormReducer()

  const validateField = useCallback(
    (field: keyof ProductFormState, value: any) => {
      let error = ''

      switch (field) {
        case 'name':
          if (!value || value.trim().length === 0) {
            error = 'El nombre es requerido'
          } else if (value.length > 255) {
            error = 'Máximo 255 caracteres'
          }
          break

        case 'price':
          if (value <= 0) {
            error = 'El precio debe ser mayor a 0'
          } else if (value > 999999.99) {
            error = 'Precio máximo excedido'
          }
          break

        case 'comparePrice':
          if (value > 0 && value < state.price) {
            error = 'El precio de comparación debe ser mayor al precio base'
          }
          break

        case 'costPrice':
          if (value > 0 && value > state.price) {
            error = 'El precio de costo debe ser menor al precio de venta'
          }
          break

        case 'stock':
          if (value < 0) {
            error = 'El stock debe ser mayor o igual a 0'
          } else if (value > 999999) {
            error = 'Stock máximo excedido'
          }
          break

        case 'sku':
          if (value && !/^[A-Z0-9\-_]+$/.test(value)) {
            error = 'SKU debe contener solo letras mayúsculas, números, guiones y guiones bajos'
          }
          break
      }

      if (error) {
        actions.setError(field, error)
      } else {
        actions.clearError(field)
      }

      return error === ''
    },
    [state.price, actions]
  )

  const validateForm = useCallback(() => {
    const fields: (keyof ProductFormState)[] = ['name', 'price', 'stock', 'categoryId']

    let isValid = true
    fields.forEach(field => {
      const fieldValid = validateField(field, state[field])
      if (!fieldValid) {
        isValid = false
      }
    })

    return isValid
  }, [state, validateField])

  return {
    state,
    actions,
    selectors,
    validateField,
    validateForm,
  }
}

export type { ProductFormState, ProductFormAction }
