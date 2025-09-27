// ===================================
// PINTEYA E-COMMERCE - VALIDACIONES CON ZOD
// ===================================

import { z } from 'zod'
import { VALIDATION_CONSTANTS } from '@/constants/shop'

// ===================================
// VALIDACIONES DE PRODUCTOS
// ===================================
export const ProductSchema = z.object({
  name: z.string().min(1, 'El nombre es requerido').max(255, 'Nombre muy largo'),
  brand: z.string().min(1, 'La marca es requerida').max(100, 'Marca muy larga').optional(),
  slug: z.string().min(1, 'El slug es requerido').max(255, 'Slug muy largo'),
  description: z.string().optional(),
  price: z.number().positive('El precio debe ser positivo'),
  discounted_price: z.number().positive().optional(),
  stock: z.number().int().min(0, 'El stock no puede ser negativo').default(0),
  category_id: z.number().int().positive().optional(),
  images: z
    .object({
      previews: z.array(z.string().url()).optional(),
      main: z.string().url().optional(),
    })
    .optional(),
})

export const ProductFiltersSchema = z.object({
  category: z.string().optional(),
  categories: z.array(z.string()).optional(),
  brand: z.string().optional(),
  brands: z.array(z.string()).optional(),
  paintType: z.string().optional(),
  paintTypes: z.array(z.string()).optional(),
  priceMin: z.number().positive().optional(),
  priceMax: z.number().positive().optional(),
  search: z.string().optional(),
  hasDiscount: z.boolean().optional(),
  page: z.number().int().positive().default(1),
  limit: z.number().int().positive().max(100).default(12),
  sortBy: z.enum(['price', 'name', 'created_at', 'brand']).default('created_at'),
  sortOrder: z.enum(['asc', 'desc']).default('desc'),
})

// ===================================
// VALIDACIONES DE CATEGORÍAS
// ===================================
export const CategorySchema = z.object({
  name: z.string().min(1, 'El nombre es requerido').max(255, 'Nombre muy largo'),
  slug: z.string().min(1, 'El slug es requerido').max(255, 'Slug muy largo'),
  description: z.string().optional().nullable(),
  icon: z.string().optional().nullable(),
})

export const CategoryFiltersSchema = z.object({
  search: z.string().optional(),
  parentId: z.number().optional(),
})

// ===================================
// VALIDACIONES DE USUARIOS
// ===================================
export const UserSchema = z.object({
  clerk_id: z.string().min(1, 'ID de Clerk requerido'),
  email: z.string().email('Email inválido'),
  name: z.string().max(255, 'Nombre muy largo').optional(),
})

export const UpdateUserProfileSchema = z.object({
  name: z.string().max(255, 'Nombre muy largo').optional(),
  email: z.string().email('Email inválido').optional(),
})

// ===================================
// VALIDACIONES DE ÓRDENES
// ===================================
export const OrderItemSchema = z.object({
  productId: z.number().int().positive('ID de producto inválido'),
  quantity: z.number().int().positive('La cantidad debe ser positiva'),
  price: z.number().positive('El precio debe ser positivo'),
})

export const CreateOrderSchema = z.object({
  items: z.array(OrderItemSchema).min(1, 'Debe incluir al menos un producto'),
  total: z.number().positive('El total debe ser positivo'),
  shippingAddress: z
    .object({
      street: z.string().min(1, 'La dirección es requerida'),
      city: z.string().min(1, 'La ciudad es requerida'),
      postalCode: z.string().min(1, 'El código postal es requerido'),
      country: z.string().min(1, 'El país es requerido'),
    })
    .optional(),
})

export const OrderFiltersSchema = z.object({
  status: z.string().optional(),
  dateFrom: z.string().optional(),
  dateTo: z.string().optional(),
  page: z.number().int().positive().default(1),
  limit: z.number().int().positive().max(100).default(10),
})

// ===================================
// VALIDACIONES DE PAGOS
// ===================================
export const MercadoPagoItemSchema = z.object({
  title: z.string().min(1, 'El título es requerido'),
  quantity: z.number().int().positive('La cantidad debe ser positiva'),
  unit_price: z.number().positive('El precio debe ser positivo'),
  currency_id: z.string().default('ARS'),
})

export const CreatePreferenceSchema = z.object({
  items: z.array(MercadoPagoItemSchema).min(1, 'Debe incluir al menos un item'),
  external_reference: z.string().min(1, 'La referencia externa es requerida'),
  back_urls: z.object({
    success: z.string().url('URL de éxito inválida'),
    failure: z.string().url('URL de fallo inválida'),
    pending: z.string().url('URL de pendiente inválida'),
  }),
})

export const MercadoPagoWebhookSchema = z.object({
  action: z.string(),
  api_version: z.string(),
  data: z.object({
    id: z.string(),
  }),
  date_created: z.string(),
  id: z.number(),
  live_mode: z.boolean(),
  type: z.string(),
  user_id: z.string(),
})

// ===================================
// VALIDACIONES DE FORMULARIOS
// ===================================
export const ContactFormSchema = z.object({
  name: z
    .string()
    .min(VALIDATION_CONSTANTS.MIN_NAME_LENGTH, 'El nombre es requerido')
    .max(VALIDATION_CONSTANTS.MAX_NAME_LENGTH, 'Nombre muy largo'),
  email: z.string().email('Email inválido'),
  subject: z.string().min(1, 'El asunto es requerido').max(200, 'Asunto muy largo'),
  message: z
    .string()
    .min(VALIDATION_CONSTANTS.MIN_MESSAGE_LENGTH, 'El mensaje debe tener al menos 10 caracteres')
    .max(VALIDATION_CONSTANTS.MAX_MESSAGE_LENGTH, 'Mensaje muy largo'),
})

export const NewsletterSchema = z.object({
  email: z.string().email('Email inválido'),
})

// ===================================
// VALIDACIONES DE DIRECCIONES
// ===================================
export const AddressSchema = z.object({
  name: z.string().min(1, 'El nombre es requerido').max(100, 'Nombre muy largo'),
  street: z.string().min(1, 'La dirección es requerida').max(255, 'Dirección muy larga'),
  city: z.string().min(1, 'La ciudad es requerida').max(100, 'Ciudad muy larga'),
  postal_code: z
    .string()
    .min(1, 'El código postal es requerido')
    .max(20, 'Código postal muy largo'),
  is_default: z.boolean().default(false),
})

// ===================================
// VALIDACIONES DE PARÁMETROS DE URL
// ===================================
export const IdParamSchema = z.object({
  id: z.string().transform(val => {
    const num = parseInt(val, 10)
    if (isNaN(num) || num <= 0) {
      throw new Error('ID inválido')
    }
    return num
  }),
})

export const SlugParamSchema = z.object({
  slug: z.string().min(1, 'Slug requerido').max(255, 'Slug muy largo'),
})

// ===================================
// FUNCIONES AUXILIARES
// ===================================

// Tipos genéricos para validación
type ValidationInput = Record<string, any> | any[] | string | number | boolean | null

interface ValidationResult<T> {
  success: boolean
  data?: T
  error?: string
}

/**
 * Valida datos usando un schema de Zod
 * @param schema - Schema de Zod
 * @param data - Datos a validar
 * @returns Datos validados
 */
export function validateData<T>(schema: z.ZodSchema<T>, data: ValidationInput): T {
  try {
    return schema.parse(data)
  } catch (error) {
    if (error instanceof z.ZodError) {
      const messages = error.errors.map(err => `${err.path.join('.')}: ${err.message}`)
      throw new Error(`Errores de validación: ${messages.join(', ')}`)
    }
    throw error
  }
}

/**
 * Valida datos de manera segura, retornando un resultado
 * @param schema - Schema de Zod
 * @param data - Datos a validar
 * @returns Resultado de la validación
 */
export function safeValidateData<T>(
  schema: z.ZodSchema<T>,
  data: ValidationInput
): ValidationResult<T> {
  try {
    const validatedData = schema.parse(data)
    return { success: true, data: validatedData }
  } catch (error) {
    if (error instanceof z.ZodError) {
      const messages = error.errors.map(err => `${err.path.join('.')}: ${err.message}`)
      return { success: false, error: `Errores de validación: ${messages.join(', ')}` }
    }
    return { success: false, error: 'Error de validación desconocido' }
  }
}
