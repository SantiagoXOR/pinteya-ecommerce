# 🔌 Especificaciones Técnicas de APIs - Panel Administrativo

**Versión:** 1.0  
**Fecha:** Enero 2025  
**Estándar:** REST + Enterprise Patterns

---

## 📋 **ESTÁNDARES GENERALES**

### **Convenciones de URLs**

```typescript
// Patrón estándar para APIs administrativas
;/api/adimn /
  { resource } / // Colección
  api /
  admin /
  { resource } /
  { id } / // Recurso específico
  api /
  admin /
  { resource } /
  { id } /
  { action } // Acción específica

// Ejemplos:
GET / api / admin / products
POST / api / admin / products
GET / api / admin / products / 123
PUT / api / admin / products / 123
DELETE / api / admin / products / 123
POST / api / admin / products / 123 / duplicate
```

### **Estructura de Respuesta Estándar**

```typescript
// Respuesta exitosa
interface SuccessResponse<T> {
  data: T
  success: true
  message?: string
  meta?: {
    total?: number
    page?: number
    limit?: number
    total_pages?: number
  }
  links?: {
    self: string
    next?: string
    prev?: string
    first?: string
    last?: string
  }
}

// Respuesta de error
interface ErrorResponse {
  success: false
  error: string
  code?: string
  details?: any
  timestamp: string
  path: string
}
```

### **Códigos de Estado HTTP**

```typescript
// Códigos estándar a usar
200 // OK - Operación exitosa
201 // Created - Recurso creado
204 // No Content - Eliminación exitosa
400 // Bad Request - Error de validación
401 // Unauthorized - No autenticado
403 // Forbidden - Sin permisos
404 // Not Found - Recurso no encontrado
409 // Conflict - Conflicto de datos
422 // Unprocessable Entity - Error de validación específico
500 // Internal Server Error - Error del servidor
```

---

## 🛠️ **PATRONES DE IMPLEMENTACIÓN**

### **1. Patrón de Autenticación Enterprise**

```typescript
// src/lib/auth/api-auth-middleware.ts

import { NextRequest, NextResponse } from 'next/server'
import { requireAdminAuth } from '@/lib/auth/enterprise-auth-utils'

export function withAdminAuth(permissions: string[] = []) {
  return function (handler: Function) {
    return async function (request: NextRequest, context: any) {
      try {
        // Verificar autenticación enterprise
        const authResult = await requireAdminAuth(request, permissions)

        if (!authResult.success) {
          return NextResponse.json(
            {
              success: false,
              error: authResult.error,
              code: authResult.code,
              timestamp: new Date().toISOString(),
              path: request.url,
            },
            { status: authResult.status || 401 }
          )
        }

        // Agregar contexto de usuario a la request
        request.user = authResult.user
        request.supabase = authResult.supabase

        return await handler(request, context)
      } catch (error) {
        console.error('Auth middleware error:', error)
        return NextResponse.json(
          {
            success: false,
            error: 'Error de autenticación',
            code: 'AUTH_ERROR',
            timestamp: new Date().toISOString(),
            path: request.url,
          },
          { status: 500 }
        )
      }
    }
  }
}

// Uso en APIs
export const GET = withAdminAuth(['products_read'])(async request => {
  // Lógica de la API con usuario autenticado
  const { user, supabase } = request
  // ...
})
```

### **2. Patrón de Validación con Zod**

```typescript
// src/lib/validation/admin-schemas.ts

import { z } from 'zod'

export const ProductSchema = z.object({
  name: z.string().min(1, 'Nombre requerido').max(255),
  description: z.string().optional(),
  price: z.number().positive('Precio debe ser positivo'),
  stock: z.number().int().min(0, 'Stock no puede ser negativo'),
  category_id: z.number().int().positive(),
  brand: z.string().optional(),
  images: z
    .array(
      z.object({
        url: z.string().url(),
        alt_text: z.string().optional(),
        is_primary: z.boolean().default(false),
      })
    )
    .optional(),
  is_active: z.boolean().default(true),
  is_featured: z.boolean().default(false),
})

export const ProductFiltersSchema = z.object({
  page: z.number().int().positive().default(1),
  limit: z.number().int().min(1).max(100).default(10),
  search: z.string().optional(),
  category_id: z.number().int().positive().optional(),
  is_active: z.boolean().optional(),
  is_featured: z.boolean().optional(),
  price_min: z.number().positive().optional(),
  price_max: z.number().positive().optional(),
  sort_by: z.enum(['name', 'price', 'stock', 'created_at']).default('created_at'),
  sort_order: z.enum(['asc', 'desc']).default('desc'),
})

// Middleware de validación
export function withValidation(schema: z.ZodSchema) {
  return function (handler: Function) {
    return async function (request: NextRequest, context: any) {
      try {
        let data

        if (request.method === 'GET') {
          // Validar query parameters
          const { searchParams } = new URL(request.url)
          data = Object.fromEntries(searchParams.entries())

          // Convertir tipos para números y booleans
          Object.keys(data).forEach(key => {
            if (data[key] === 'true') data[key] = true
            else if (data[key] === 'false') data[key] = false
            else if (!isNaN(Number(data[key])) && data[key] !== '') {
              data[key] = Number(data[key])
            }
          })
        } else {
          // Validar body para POST/PUT
          data = await request.json()
        }

        const validationResult = schema.safeParse(data)

        if (!validationResult.success) {
          return NextResponse.json(
            {
              success: false,
              error: 'Datos de entrada inválidos',
              code: 'VALIDATION_ERROR',
              details: validationResult.error.errors,
              timestamp: new Date().toISOString(),
              path: request.url,
            },
            { status: 422 }
          )
        }

        request.validatedData = validationResult.data
        return await handler(request, context)
      } catch (error) {
        console.error('Validation middleware error:', error)
        return NextResponse.json(
          {
            success: false,
            error: 'Error de validación',
            code: 'VALIDATION_MIDDLEWARE_ERROR',
            timestamp: new Date().toISOString(),
            path: request.url,
          },
          { status: 500 }
        )
      }
    }
  }
}
```

### **3. Patrón de Manejo de Errores**

```typescript
// src/lib/api/error-handler.ts

export class ApiError extends Error {
  constructor(
    message: string,
    public statusCode: number = 500,
    public code: string = 'INTERNAL_ERROR',
    public details?: any
  ) {
    super(message)
    this.name = 'ApiError'
  }
}

export function withErrorHandler(handler: Function) {
  return async function (request: NextRequest, context: any) {
    try {
      return await handler(request, context)
    } catch (error) {
      console.error('API Error:', error)

      if (error instanceof ApiError) {
        return NextResponse.json(
          {
            success: false,
            error: error.message,
            code: error.code,
            details: error.details,
            timestamp: new Date().toISOString(),
            path: request.url,
          },
          { status: error.statusCode }
        )
      }

      // Error no controlado
      return NextResponse.json(
        {
          success: false,
          error: 'Error interno del servidor',
          code: 'INTERNAL_ERROR',
          timestamp: new Date().toISOString(),
          path: request.url,
        },
        { status: 500 }
      )
    }
  }
}

// Errores específicos
export const NotFoundError = (resource: string) =>
  new ApiError(`${resource} no encontrado`, 404, 'NOT_FOUND')

export const ValidationError = (message: string, details?: any) =>
  new ApiError(message, 422, 'VALIDATION_ERROR', details)

export const UnauthorizedError = (message: string = 'No autorizado') =>
  new ApiError(message, 401, 'UNAUTHORIZED')

export const ForbiddenError = (message: string = 'Sin permisos') =>
  new ApiError(message, 403, 'FORBIDDEN')
```

### **4. Patrón de Logging Estructurado**

```typescript
// src/lib/api/api-logger.ts

interface ApiLogEntry {
  timestamp: string
  method: string
  path: string
  user_id?: string
  status_code: number
  response_time_ms: number
  error?: string
  metadata?: any
}

export function withApiLogging(handler: Function) {
  return async function (request: NextRequest, context: any) {
    const startTime = Date.now()
    const logEntry: Partial<ApiLogEntry> = {
      timestamp: new Date().toISOString(),
      method: request.method,
      path: new URL(request.url).pathname,
      user_id: request.user?.id,
    }

    try {
      const response = await handler(request, context)

      logEntry.status_code = response.status
      logEntry.response_time_ms = Date.now() - startTime

      // Log exitoso
      console.log('API Success:', logEntry)

      return response
    } catch (error) {
      logEntry.status_code = error.statusCode || 500
      logEntry.response_time_ms = Date.now() - startTime
      logEntry.error = error.message

      // Log de error
      console.error('API Error:', logEntry)

      throw error
    }
  }
}
```

---

## 🔄 **COMPOSICIÓN DE MIDDLEWARES**

### **Patrón de Composición**

```typescript
// src/lib/api/middleware-composer.ts

export function composeMiddlewares(...middlewares: Function[]) {
  return function (handler: Function) {
    return middlewares.reduceRight((acc, middleware) => middleware(acc), handler)
  }
}

// Uso en APIs
export const GET = composeMiddlewares(
  withErrorHandler,
  withApiLogging,
  withAdminAuth(['products_read']),
  withValidation(ProductFiltersSchema)
)(async (request: NextRequest) => {
  // Lógica de la API
  const { validatedData, user, supabase } = request

  // Implementación...
})
```

---

## 📊 **EJEMPLOS DE IMPLEMENTACIÓN COMPLETA**

### **API de Productos Completa**

```typescript
// src/app/api/admin/products/route.ts

import { NextRequest, NextResponse } from 'next/server'
import { composeMiddlewares } from '@/lib/api/middleware-composer'
import { withErrorHandler } from '@/lib/api/error-handler'
import { withApiLogging } from '@/lib/api/api-logger'
import { withAdminAuth } from '@/lib/auth/api-auth-middleware'
import { withValidation } from '@/lib/validation/admin-schemas'
import { ProductFiltersSchema, ProductSchema } from '@/lib/validation/admin-schemas'
import { NotFoundError, ValidationError } from '@/lib/api/error-handler'

// GET /api/admin/products
const getHandler = async (request: NextRequest) => {
  const { validatedData, supabase } = request
  const { page, limit, search, category_id, sort_by, sort_order } = validatedData

  // Construir query
  let query = supabase.from('products').select(
    `
      id, name, slug, price, discounted_price, stock, brand, is_active, is_featured,
      category:categories(id, name),
      images
    `,
    { count: 'exact' }
  )

  // Aplicar filtros
  if (search) {
    query = query.or(`name.ilike.%${search}%,description.ilike.%${search}%`)
  }

  if (category_id) {
    query = query.eq('category_id', category_id)
  }

  // Ordenamiento
  query = query.order(sort_by, { ascending: sort_order === 'asc' })

  // Paginación
  const from = (page - 1) * limit
  const to = from + limit - 1
  query = query.range(from, to)

  const { data: products, error, count } = await query

  if (error) {
    throw new ApiError('Error al obtener productos', 500, 'DATABASE_ERROR', error)
  }

  return NextResponse.json({
    data: products,
    success: true,
    meta: {
      total: count || 0,
      page,
      limit,
      total_pages: Math.ceil((count || 0) / limit),
    },
    links: {
      self: `/api/admin/products?page=${page}&limit=${limit}`,
      next:
        page * limit < (count || 0)
          ? `/api/admin/products?page=${page + 1}&limit=${limit}`
          : undefined,
      prev: page > 1 ? `/api/admin/products?page=${page - 1}&limit=${limit}` : undefined,
    },
  })
}

// POST /api/admin/products
const postHandler = async (request: NextRequest) => {
  const { validatedData, supabase, user } = request

  // Verificar que la categoría existe
  const { data: category, error: categoryError } = await supabase
    .from('categories')
    .select('id, name')
    .eq('id', validatedData.category_id)
    .single()

  if (categoryError || !category) {
    throw new ValidationError('Categoría no encontrada')
  }

  // Crear producto
  const { data: product, error } = await supabase
    .from('products')
    .insert({
      ...validatedData,
      slug: generateSlug(validatedData.name),
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    })
    .select(
      `
      id, name, slug, price, stock, category_id, is_active,
      category:categories(id, name)
    `
    )
    .single()

  if (error) {
    throw new ApiError('Error al crear producto', 500, 'DATABASE_ERROR', error)
  }

  // Log de auditoría
  await logAdminAction(user.id, 'CREATE', 'product', product.id, null, product)

  return NextResponse.json(
    {
      data: product,
      success: true,
      message: 'Producto creado exitosamente',
    },
    { status: 201 }
  )
}

// Aplicar middlewares
export const GET = composeMiddlewares(
  withErrorHandler,
  withApiLogging,
  withAdminAuth(['products_read']),
  withValidation(ProductFiltersSchema)
)(getHandler)

export const POST = composeMiddlewares(
  withErrorHandler,
  withApiLogging,
  withAdminAuth(['products_create']),
  withValidation(ProductSchema)
)(postHandler)
```

---

## 🔗 **PRÓXIMOS DOCUMENTOS**

- [Arquitectura de Componentes](./COMPONENT_ARCHITECTURE.md)
- [Esquemas de Base de Datos](./DATABASE_SCHEMA.md)
- [Guías de Seguridad](./SECURITY_GUIDELINES.md)

---

**Estado:** ✅ Completado
**Próxima actualización:** Al implementar nuevos patrones de API
