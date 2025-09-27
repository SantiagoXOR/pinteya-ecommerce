/**
 * Esquemas de Validación Enterprise Unificados
 * Extiende y mejora los esquemas existentes con validaciones enterprise
 */

import { z } from 'zod'

// =====================================================
// CONSTANTES DE VALIDACIÓN ENTERPRISE
// =====================================================

export const ENTERPRISE_VALIDATION_CONSTANTS = {
  // Longitudes de strings
  MIN_NAME_LENGTH: 2,
  MAX_NAME_LENGTH: 100,
  MIN_DESCRIPTION_LENGTH: 10,
  MAX_DESCRIPTION_LENGTH: 5000,
  MIN_PASSWORD_LENGTH: 8,
  MAX_PASSWORD_LENGTH: 128,

  // Límites numéricos
  MIN_PRICE: 0.01,
  MAX_PRICE: 999999.99,
  MIN_QUANTITY: 1,
  MAX_QUANTITY: 9999,
  MIN_STOCK: 0,
  MAX_STOCK: 999999,

  // Límites de arrays
  MAX_ARRAY_LENGTH: 1000,
  MAX_TAGS_LENGTH: 50,
  MAX_IMAGES_LENGTH: 20,

  // Patrones regex
  PHONE_REGEX: /^[\+]?[1-9][\d]{0,15}$/,
  SLUG_REGEX: /^[a-z0-9]+(?:-[a-z0-9]+)*$/,
  COLOR_HEX_REGEX: /^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/,
  UUID_REGEX: /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i,

  // Tipos de archivo permitidos
  ALLOWED_IMAGE_TYPES: ['image/jpeg', 'image/png', 'image/gif', 'image/webp'],
  ALLOWED_DOCUMENT_TYPES: ['application/pdf', 'text/plain', 'text/csv'],

  // Tamaños de archivo
  MAX_IMAGE_SIZE: 5 * 1024 * 1024, // 5MB
  MAX_DOCUMENT_SIZE: 10 * 1024 * 1024, // 10MB
} as const

// =====================================================
// VALIDADORES BÁSICOS ENTERPRISE
// =====================================================

/**
 * Validador de email enterprise con verificaciones adicionales
 */
export const EnterpriseEmailSchema = z
  .string()
  .email('Email inválido')
  .min(5, 'Email muy corto')
  .max(254, 'Email muy largo')
  .refine(email => !email.includes('..'), 'Email no puede contener puntos consecutivos')
  .refine(
    email => !/[<>()[\]\\.,;:\s@"]/.test(email.split('@')[0]),
    'Caracteres no permitidos en email'
  )

/**
 * Validador de contraseña enterprise
 */
export const EnterprisePasswordSchema = z
  .string()
  .min(ENTERPRISE_VALIDATION_CONSTANTS.MIN_PASSWORD_LENGTH, 'Contraseña muy corta')
  .max(ENTERPRISE_VALIDATION_CONSTANTS.MAX_PASSWORD_LENGTH, 'Contraseña muy larga')
  .refine(password => /[A-Z]/.test(password), 'Debe contener al menos una mayúscula')
  .refine(password => /[a-z]/.test(password), 'Debe contener al menos una minúscula')
  .refine(password => /\d/.test(password), 'Debe contener al menos un número')
  .refine(
    password => /[!@#$%^&*(),.?":{}|<>]/.test(password),
    'Debe contener al menos un carácter especial'
  )

/**
 * Validador de teléfono enterprise
 */
export const EnterprisePhoneSchema = z
  .string()
  .regex(ENTERPRISE_VALIDATION_CONSTANTS.PHONE_REGEX, 'Formato de teléfono inválido')
  .min(8, 'Teléfono muy corto')
  .max(20, 'Teléfono muy largo')

/**
 * Validador de slug enterprise
 */
export const EnterpriseSlugSchema = z
  .string()
  .regex(
    ENTERPRISE_VALIDATION_CONSTANTS.SLUG_REGEX,
    'Slug debe contener solo letras minúsculas, números y guiones'
  )
  .min(3, 'Slug muy corto')
  .max(100, 'Slug muy largo')

/**
 * Validador de UUID enterprise
 */
export const EnterpriseUUIDSchema = z
  .string()
  .regex(ENTERPRISE_VALIDATION_CONSTANTS.UUID_REGEX, 'UUID inválido')

/**
 * Validador de precio enterprise
 */
export const EnterprisePriceSchema = z
  .number()
  .min(ENTERPRISE_VALIDATION_CONSTANTS.MIN_PRICE, 'Precio muy bajo')
  .max(ENTERPRISE_VALIDATION_CONSTANTS.MAX_PRICE, 'Precio muy alto')
  .multipleOf(0.01, 'Precio debe tener máximo 2 decimales')

/**
 * Validador de cantidad enterprise
 */
export const EnterpriseQuantitySchema = z
  .number()
  .int('Cantidad debe ser un número entero')
  .min(ENTERPRISE_VALIDATION_CONSTANTS.MIN_QUANTITY, 'Cantidad muy baja')
  .max(ENTERPRISE_VALIDATION_CONSTANTS.MAX_QUANTITY, 'Cantidad muy alta')

// =====================================================
// ESQUEMAS DE PRODUCTOS ENTERPRISE
// =====================================================

export const EnterpriseProductSchema = z.object({
  name: z
    .string()
    .min(ENTERPRISE_VALIDATION_CONSTANTS.MIN_NAME_LENGTH, 'Nombre muy corto')
    .max(ENTERPRISE_VALIDATION_CONSTANTS.MAX_NAME_LENGTH, 'Nombre muy largo')
    .refine(name => !/[<>{}]/.test(name), 'Nombre contiene caracteres no permitidos'),

  brand: z.string().min(1, 'Marca requerida').max(50, 'Marca muy larga').optional(),

  slug: EnterpriseSlugSchema,

  description: z
    .string()
    .min(ENTERPRISE_VALIDATION_CONSTANTS.MIN_DESCRIPTION_LENGTH, 'Descripción muy corta')
    .max(ENTERPRISE_VALIDATION_CONSTANTS.MAX_DESCRIPTION_LENGTH, 'Descripción muy larga')
    .optional(),

  short_description: z.string().max(500, 'Descripción corta muy larga').optional(),

  price: EnterprisePriceSchema,

  discounted_price: EnterprisePriceSchema.optional(),

  cost_price: EnterprisePriceSchema.optional(),

  stock: z
    .number()
    .int('Stock debe ser un número entero')
    .min(ENTERPRISE_VALIDATION_CONSTANTS.MIN_STOCK, 'Stock no puede ser negativo')
    .max(ENTERPRISE_VALIDATION_CONSTANTS.MAX_STOCK, 'Stock muy alto'),

  low_stock_threshold: z.number().int().min(0).max(1000).optional(),

  category_id: EnterpriseUUIDSchema.optional(),

  status: z.enum(['active', 'inactive', 'draft']).default('draft'),

  tags: z
    .array(z.string().min(1).max(30))
    .max(ENTERPRISE_VALIDATION_CONSTANTS.MAX_TAGS_LENGTH, 'Demasiadas etiquetas')
    .optional(),

  images: z
    .object({
      previews: z
        .array(z.string().url('URL de imagen inválida'))
        .max(ENTERPRISE_VALIDATION_CONSTANTS.MAX_IMAGES_LENGTH, 'Demasiadas imágenes')
        .optional(),
      main: z.string().url('URL de imagen principal inválida').optional(),
      gallery: z
        .array(z.string().url('URL de imagen inválida'))
        .max(ENTERPRISE_VALIDATION_CONSTANTS.MAX_IMAGES_LENGTH, 'Demasiadas imágenes en galería')
        .optional(),
    })
    .optional(),

  specifications: z.record(z.string().max(200, 'Especificación muy larga')).optional(),

  seo: z
    .object({
      meta_title: z.string().max(60, 'Meta título muy largo').optional(),
      meta_description: z.string().max(160, 'Meta descripción muy larga').optional(),
      keywords: z.array(z.string().max(50)).max(20, 'Demasiadas keywords').optional(),
    })
    .optional(),
})

export const EnterpriseProductUpdateSchema = EnterpriseProductSchema.partial()

export const EnterpriseProductFiltersSchema = z.object({
  category_id: EnterpriseUUIDSchema.optional(),
  brand: z.string().max(50).optional(),
  min_price: z.coerce.number().min(0.01).optional(),
  max_price: z.coerce.number().min(0.01).optional(),
  status: z.enum(['active', 'inactive', 'draft']).optional(),
  in_stock: z.boolean().optional(),
  tags: z.array(z.string().max(30)).max(10).optional(),
  search: z.string().max(100).optional(),
  sort_by: z.enum(['name', 'price', 'created_at', 'updated_at']).default('created_at'),
  sort_order: z.enum(['asc', 'desc']).default('desc'),
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
})

// =====================================================
// ESQUEMAS DE USUARIOS ENTERPRISE
// =====================================================

export const EnterpriseUserSchema = z.object({
  clerk_id: z.string().min(1, 'ID de Clerk requerido'),
  email: EnterpriseEmailSchema,
  first_name: z
    .string()
    .min(ENTERPRISE_VALIDATION_CONSTANTS.MIN_NAME_LENGTH, 'Nombre muy corto')
    .max(ENTERPRISE_VALIDATION_CONSTANTS.MAX_NAME_LENGTH, 'Nombre muy largo')
    .optional(),
  last_name: z
    .string()
    .min(ENTERPRISE_VALIDATION_CONSTANTS.MIN_NAME_LENGTH, 'Apellido muy corto')
    .max(ENTERPRISE_VALIDATION_CONSTANTS.MAX_NAME_LENGTH, 'Apellido muy largo')
    .optional(),
  phone: EnterprisePhoneSchema.optional(),
  avatar_url: z.string().url('URL de avatar inválida').optional(),
  role: z.enum(['admin', 'customer', 'moderator']).default('customer'),
  is_active: z.boolean().default(true),
  preferences: z
    .object({
      newsletter: z.boolean().default(false),
      notifications: z.boolean().default(true),
      language: z.enum(['es', 'en']).default('es'),
      currency: z.enum(['ARS', 'USD']).default('ARS'),
    })
    .optional(),
  metadata: z.record(z.any()).optional(),
})

export const EnterpriseUserUpdateSchema = EnterpriseUserSchema.partial().omit({
  clerk_id: true,
  role: true,
})

export const EnterpriseUserRegistrationSchema = z.object({
  email: EnterpriseEmailSchema,
  password: EnterprisePasswordSchema,
  first_name: z
    .string()
    .min(ENTERPRISE_VALIDATION_CONSTANTS.MIN_NAME_LENGTH, 'Nombre muy corto')
    .max(ENTERPRISE_VALIDATION_CONSTANTS.MAX_NAME_LENGTH, 'Nombre muy largo'),
  last_name: z
    .string()
    .min(ENTERPRISE_VALIDATION_CONSTANTS.MIN_NAME_LENGTH, 'Apellido muy corto')
    .max(ENTERPRISE_VALIDATION_CONSTANTS.MAX_NAME_LENGTH, 'Apellido muy largo'),
  phone: EnterprisePhoneSchema.optional(),
  terms_accepted: z
    .boolean()
    .refine(val => val === true, 'Debe aceptar los términos y condiciones'),
  privacy_accepted: z
    .boolean()
    .refine(val => val === true, 'Debe aceptar la política de privacidad'),
})

// =====================================================
// ESQUEMAS DE ÓRDENES ENTERPRISE
// =====================================================

export const EnterpriseOrderItemSchema = z.object({
  product_id: EnterpriseUUIDSchema,
  quantity: EnterpriseQuantitySchema,
  unit_price: EnterprisePriceSchema,
  total_price: EnterprisePriceSchema,
  product_snapshot: z
    .object({
      name: z.string(),
      brand: z.string().optional(),
      image_url: z.string().url().optional(),
    })
    .optional(),
})

export const EnterpriseShippingAddressSchema = z.object({
  first_name: z
    .string()
    .min(ENTERPRISE_VALIDATION_CONSTANTS.MIN_NAME_LENGTH, 'Nombre muy corto')
    .max(ENTERPRISE_VALIDATION_CONSTANTS.MAX_NAME_LENGTH, 'Nombre muy largo'),
  last_name: z
    .string()
    .min(ENTERPRISE_VALIDATION_CONSTANTS.MIN_NAME_LENGTH, 'Apellido muy corto')
    .max(ENTERPRISE_VALIDATION_CONSTANTS.MAX_NAME_LENGTH, 'Apellido muy largo'),
  street: z.string().min(5, 'Dirección muy corta').max(200, 'Dirección muy larga'),
  city: z.string().min(2, 'Ciudad muy corta').max(100, 'Ciudad muy larga'),
  state: z.string().min(2, 'Provincia muy corta').max(100, 'Provincia muy larga'),
  postal_code: z.string().min(4, 'Código postal muy corto').max(10, 'Código postal muy largo'),
  country: z.string().min(2, 'País muy corto').max(100, 'País muy largo').default('Argentina'),
  phone: EnterprisePhoneSchema.optional(),
  notes: z.string().max(500, 'Notas muy largas').optional(),
})

export const EnterpriseOrderSchema = z.object({
  items: z
    .array(EnterpriseOrderItemSchema)
    .min(1, 'Debe incluir al menos un producto')
    .max(50, 'Demasiados productos en la orden'),

  subtotal: EnterprisePriceSchema,
  shipping_cost: EnterprisePriceSchema.default(0),
  tax_amount: EnterprisePriceSchema.default(0),
  discount_amount: EnterprisePriceSchema.default(0),
  total: EnterprisePriceSchema,

  shipping_address: EnterpriseShippingAddressSchema,
  billing_address: EnterpriseShippingAddressSchema.optional(),

  payment_method: z.enum(['mercadopago', 'transfer', 'cash']).default('mercadopago'),

  notes: z.string().max(1000, 'Notas muy largas').optional(),

  metadata: z.record(z.any()).optional(),
})

export const EnterpriseOrderFiltersSchema = z.object({
  status: z.enum(['pending', 'processing', 'shipped', 'delivered', 'cancelled']).optional(),
  payment_status: z.enum(['pending', 'paid', 'failed', 'refunded']).optional(),
  date_from: z.string().datetime().optional(),
  date_to: z.string().datetime().optional(),
  customer_id: EnterpriseUUIDSchema.optional(),
  min_total: EnterprisePriceSchema.optional(),
  max_total: EnterprisePriceSchema.optional(),
  search: z.string().max(100).optional(),
  sort_by: z.enum(['created_at', 'total', 'status']).default('created_at'),
  sort_order: z.enum(['asc', 'desc']).default('desc'),
  page: z.number().int().min(1).default(1),
  limit: z.number().int().min(1).max(100).default(20),
})

// =====================================================
// ESQUEMAS DE PAGOS ENTERPRISE
// =====================================================

export const EnterpriseMercadoPagoItemSchema = z.object({
  id: z.string().min(1, 'ID de producto requerido'),
  title: z.string().min(1, 'Título requerido').max(256, 'Título muy largo'),
  description: z.string().max(600, 'Descripción muy larga').optional(),
  quantity: EnterpriseQuantitySchema,
  unit_price: EnterprisePriceSchema,
  currency_id: z.enum(['ARS', 'USD']).default('ARS'),
  category_id: z.string().optional(),
})

export const EnterprisePayerSchema = z.object({
  name: z
    .string()
    .min(ENTERPRISE_VALIDATION_CONSTANTS.MIN_NAME_LENGTH, 'Nombre muy corto')
    .max(ENTERPRISE_VALIDATION_CONSTANTS.MAX_NAME_LENGTH, 'Nombre muy largo'),
  surname: z
    .string()
    .min(ENTERPRISE_VALIDATION_CONSTANTS.MIN_NAME_LENGTH, 'Apellido muy corto')
    .max(ENTERPRISE_VALIDATION_CONSTANTS.MAX_NAME_LENGTH, 'Apellido muy largo'),
  email: EnterpriseEmailSchema,
  phone: z
    .object({
      area_code: z.string().min(2).max(4),
      number: z.string().min(6).max(12),
    })
    .optional(),
  identification: z.object({
    type: z.enum(['DNI', 'CI', 'LC', 'LE', 'Otro']),
    number: z
      .string()
      .min(7, 'Número de identificación muy corto')
      .max(20, 'Número de identificación muy largo'),
  }),
  address: z
    .object({
      street_name: z.string().min(5).max(200),
      street_number: z.number().int().min(1).max(99999),
      zip_code: z.string().min(4).max(10),
    })
    .optional(),
})

export const EnterpriseCreatePreferenceSchema = z.object({
  items: z
    .array(EnterpriseMercadoPagoItemSchema)
    .min(1, 'Debe incluir al menos un item')
    .max(50, 'Demasiados items'),

  payer: EnterprisePayerSchema,

  external_reference: z
    .string()
    .min(1, 'Referencia externa requerida')
    .max(256, 'Referencia muy larga'),

  back_urls: z.object({
    success: z.string().url('URL de éxito inválida'),
    failure: z.string().url('URL de fallo inválida'),
    pending: z.string().url('URL de pendiente inválida'),
  }),

  auto_return: z.enum(['approved', 'all']).default('approved'),

  payment_methods: z
    .object({
      excluded_payment_methods: z
        .array(
          z.object({
            id: z.string(),
          })
        )
        .optional(),
      excluded_payment_types: z
        .array(
          z.object({
            id: z.string(),
          })
        )
        .optional(),
      installments: z.number().int().min(1).max(24).optional(),
    })
    .optional(),

  shipments: z
    .object({
      cost: EnterprisePriceSchema.optional(),
      mode: z.enum(['not_specified', 'custom']).default('not_specified'),
    })
    .optional(),

  notification_url: z.string().url('URL de notificación inválida').optional(),

  metadata: z.record(z.any()).optional(),
})

// =====================================================
// ESQUEMAS DE FORMULARIOS ENTERPRISE
// =====================================================

export const EnterpriseContactFormSchema = z.object({
  name: z
    .string()
    .min(ENTERPRISE_VALIDATION_CONSTANTS.MIN_NAME_LENGTH, 'Nombre muy corto')
    .max(ENTERPRISE_VALIDATION_CONSTANTS.MAX_NAME_LENGTH, 'Nombre muy largo'),
  email: EnterpriseEmailSchema,
  phone: EnterprisePhoneSchema.optional(),
  subject: z.string().min(5, 'Asunto muy corto').max(200, 'Asunto muy largo'),
  message: z
    .string()
    .min(ENTERPRISE_VALIDATION_CONSTANTS.MIN_DESCRIPTION_LENGTH, 'Mensaje muy corto')
    .max(2000, 'Mensaje muy largo'),
  company: z.string().max(100, 'Nombre de empresa muy largo').optional(),
  category: z.enum(['general', 'support', 'sales', 'technical']).default('general'),
  priority: z.enum(['low', 'medium', 'high']).default('medium'),
  attachments: z.array(z.string().url()).max(5, 'Demasiados archivos adjuntos').optional(),
})

export const EnterpriseNewsletterSchema = z.object({
  email: EnterpriseEmailSchema,
  preferences: z
    .object({
      products: z.boolean().default(true),
      promotions: z.boolean().default(true),
      news: z.boolean().default(false),
    })
    .optional(),
  source: z.string().max(50).optional(),
})

// =====================================================
// ESQUEMAS DE PARÁMETROS ENTERPRISE
// =====================================================

export const EnterpriseIdParamSchema = z.object({
  id: z.string().transform(val => {
    // Intentar UUID primero
    if (ENTERPRISE_VALIDATION_CONSTANTS.UUID_REGEX.test(val)) {
      return val
    }

    // Intentar número
    const num = parseInt(val, 10)
    if (!isNaN(num) && num > 0) {
      return num
    }

    throw new Error('ID debe ser un UUID válido o un número positivo')
  }),
})

export const EnterpriseSlugParamSchema = z.object({
  slug: EnterpriseSlugSchema,
})

export const EnterprisePaginationSchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
  sort_by: z.string().max(50).optional(),
  sort_order: z.enum(['asc', 'desc']).default('desc'),
})

// =====================================================
// ESQUEMAS DE ARCHIVOS ENTERPRISE
// =====================================================

export const EnterpriseFileUploadSchema = z.object({
  file: z.object({
    name: z.string().min(1, 'Nombre de archivo requerido'),
    size: z
      .number()
      .int()
      .min(1, 'Archivo vacío')
      .max(ENTERPRISE_VALIDATION_CONSTANTS.MAX_IMAGE_SIZE, 'Archivo muy grande'),
    type: z.enum(
      [
        ...ENTERPRISE_VALIDATION_CONSTANTS.ALLOWED_IMAGE_TYPES,
        ...ENTERPRISE_VALIDATION_CONSTANTS.ALLOWED_DOCUMENT_TYPES,
      ] as [string, ...string[]],
      'Tipo de archivo no permitido'
    ),
  }),
  category: z.enum(['product_image', 'avatar', 'document', 'other']).default('other'),
  alt_text: z.string().max(200, 'Texto alternativo muy largo').optional(),
  metadata: z.record(z.any()).optional(),
})
