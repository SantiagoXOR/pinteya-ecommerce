# API Reference - Sistema de Variantes de Productos

## Índice
- [APIs Públicas](#apis-públicas)
- [APIs Administrativas](#apis-administrativas)
- [Esquemas de Datos](#esquemas-de-datos)
- [Códigos de Error](#códigos-de-error)
- [Ejemplos de Uso](#ejemplos-de-uso)

## APIs Públicas

### GET `/api/products`

Lista todos los productos con información de variantes incluida.

**Parámetros de Query:**
- `limit` (opcional): Número máximo de productos a retornar
- `offset` (opcional): Número de productos a saltar
- `category` (opcional): Filtrar por categoría
- `search` (opcional): Búsqueda por nombre o descripción

**Respuesta:**
```json
{
  "data": [
    {
      "id": 1,
      "name": "Pintura Latex Interior",
      "price": 2500.00,
      "brand": "Sherwin Williams",
      "stock": 50,
      "images": ["url1.jpg", "url2.jpg"],
      "category": "Pinturas",
      "variants": [
        {
          "id": 1,
          "aikon_id": "SW-LAT-001-BL",
          "variant_slug": "blanco-mate-1l",
          "color_name": "Blanco",
          "color_hex": "#FFFFFF",
          "measure": "1L",
          "finish": "Mate",
          "price_list": 2500.00,
          "price_sale": 2250.00,
          "stock": 25,
          "is_default": true,
          "image_url": "variant1.jpg"
        }
      ],
      "variant_count": 3,
      "has_variants": true,
      "default_variant": {
        "id": 1,
        "color_name": "Blanco",
        "price_sale": 2250.00
      }
    }
  ],
  "success": true,
  "total": 150,
  "page": 1,
  "limit": 20
}
```

### GET `/api/products/[id]`

Obtiene un producto específico con todas sus variantes.

**Parámetros:**
- `id`: ID del producto (requerido)

**Respuesta:**
```json
{
  "data": {
    "id": 1,
    "name": "Pintura Latex Interior",
    "description": "Pintura latex de alta calidad para interiores",
    "price": 2500.00,
    "brand": "Sherwin Williams",
    "stock": 50,
    "images": ["url1.jpg"],
    "category": "Pinturas",
    "variants": [
      {
        "id": 1,
        "aikon_id": "SW-LAT-001-BL",
        "variant_slug": "blanco-mate-1l",
        "color_name": "Blanco",
        "color_hex": "#FFFFFF",
        "measure": "1L",
        "finish": "Mate",
        "price_list": 2500.00,
        "price_sale": 2250.00,
        "stock": 25,
        "is_default": true,
        "image_url": "variant1.jpg",
        "metadata": {},
        "created_at": "2025-10-01T10:00:00Z",
        "updated_at": "2025-10-01T10:00:00Z"
      }
    ],
    "variant_count": 3,
    "has_variants": true,
    "default_variant": {
      "id": 1,
      "color_name": "Blanco",
      "price_sale": 2250.00
    }
  },
  "success": true
}
```

### GET `/api/products/[id]/variants`

Lista todas las variantes de un producto específico.

**Parámetros:**
- `id`: ID del producto (requerido)

**Query Parameters:**
- `active_only` (opcional): Solo variantes activas (default: true)
- `include_inactive` (opcional): Incluir variantes inactivas

**Respuesta:**
```json
{
  "data": [
    {
      "id": 1,
      "product_id": 1,
      "aikon_id": "SW-LAT-001-BL",
      "variant_slug": "blanco-mate-1l",
      "color_name": "Blanco",
      "color_hex": "#FFFFFF",
      "measure": "1L",
      "finish": "Mate",
      "price_list": 2500.00,
      "price_sale": 2250.00,
      "stock": 25,
      "is_active": true,
      "is_default": true,
      "image_url": "variant1.jpg",
      "metadata": {},
      "created_at": "2025-10-01T10:00:00Z",
      "updated_at": "2025-10-01T10:00:00Z"
    }
  ],
  "success": true,
  "total": 3
}
```

**Caso Especial - Sin Variantes:**
Si el producto no tiene variantes en la tabla, se genera una variante virtual:
```json
{
  "data": [
    {
      "id": "virtual-1",
      "product_id": 1,
      "aikon_id": "LEGACY-1",
      "variant_slug": "default",
      "color_name": null,
      "color_hex": null,
      "measure": null,
      "finish": null,
      "price_list": 2500.00,
      "price_sale": null,
      "stock": 50,
      "is_active": true,
      "is_default": true,
      "image_url": null,
      "metadata": {"legacy": true},
      "created_at": "2025-10-01T10:00:00Z",
      "updated_at": "2025-10-01T10:00:00Z"
    }
  ],
  "success": true,
  "total": 1
}
```

### GET `/api/products/[id]/variants/[variantId]`

Obtiene una variante específica de un producto.

**Parámetros:**
- `id`: ID del producto (requerido)
- `variantId`: ID de la variante (requerido)

**Respuesta:**
```json
{
  "data": {
    "id": 1,
    "product_id": 1,
    "aikon_id": "SW-LAT-001-BL",
    "variant_slug": "blanco-mate-1l",
    "color_name": "Blanco",
    "color_hex": "#FFFFFF",
    "measure": "1L",
    "finish": "Mate",
    "price_list": 2500.00,
    "price_sale": 2250.00,
    "stock": 25,
    "is_active": true,
    "is_default": true,
    "image_url": "variant1.jpg",
    "metadata": {},
    "created_at": "2025-10-01T10:00:00Z",
    "updated_at": "2025-10-01T10:00:00Z"
  },
  "success": true
}
```

## APIs Administrativas

### GET `/api/admin/products/variants`

Lista todas las variantes con filtros avanzados (requiere autenticación admin).

**Headers Requeridos:**
```
Authorization: Bearer <jwt_token>
Content-Type: application/json
```

**Query Parameters:**
- `page` (opcional): Página actual (default: 1)
- `limit` (opcional): Elementos por página (default: 20, max: 100)
- `product_id` (opcional): Filtrar por producto específico
- `is_active` (opcional): Filtrar por estado activo
- `search` (opcional): Búsqueda en nombre de color, medida, acabado
- `sort_by` (opcional): Campo para ordenar (default: 'created_at')
- `sort_order` (opcional): Orden ascendente/descendente (default: 'desc')

**Respuesta:**
```json
{
  "data": [
    {
      "id": 1,
      "product_id": 1,
      "product_name": "Pintura Latex Interior",
      "aikon_id": "SW-LAT-001-BL",
      "variant_slug": "blanco-mate-1l",
      "color_name": "Blanco",
      "color_hex": "#FFFFFF",
      "measure": "1L",
      "finish": "Mate",
      "price_list": 2500.00,
      "price_sale": 2250.00,
      "stock": 25,
      "is_active": true,
      "is_default": true,
      "image_url": "variant1.jpg",
      "metadata": {},
      "created_at": "2025-10-01T10:00:00Z",
      "updated_at": "2025-10-01T10:00:00Z"
    }
  ],
  "success": true,
  "pagination": {
    "total": 150,
    "page": 1,
    "limit": 20,
    "total_pages": 8,
    "has_next": true,
    "has_prev": false
  }
}
```

### POST `/api/admin/products/variants`

Crea una nueva variante de producto (requiere autenticación admin).

**Headers Requeridos:**
```
Authorization: Bearer <jwt_token>
Content-Type: application/json
```

**Body:**
```json
{
  "product_id": 1,
  "aikon_id": "SW-LAT-001-RD",
  "variant_slug": "rojo-satinado-1l", // Opcional, se auto-genera
  "color_name": "Rojo",
  "color_hex": "#FF0000",
  "measure": "1L",
  "finish": "Satinado",
  "price_list": 2600.00,
  "price_sale": 2340.00,
  "stock": 30,
  "is_active": true,
  "is_default": false,
  "image_url": "rojo-variant.jpg",
  "metadata": {
    "supplier": "Proveedor A",
    "batch": "2025-001"
  }
}
```

**Respuesta:**
```json
{
  "data": {
    "id": 2,
    "product_id": 1,
    "aikon_id": "SW-LAT-001-RD",
    "variant_slug": "rojo-satinado-1l",
    "color_name": "Rojo",
    "color_hex": "#FF0000",
    "measure": "1L",
    "finish": "Satinado",
    "price_list": 2600.00,
    "price_sale": 2340.00,
    "stock": 30,
    "is_active": true,
    "is_default": false,
    "image_url": "rojo-variant.jpg",
    "metadata": {
      "supplier": "Proveedor A",
      "batch": "2025-001"
    },
    "created_at": "2025-10-01T11:00:00Z",
    "updated_at": "2025-10-01T11:00:00Z"
  },
  "success": true,
  "message": "Variante creada exitosamente"
}
```

### PUT `/api/admin/products/variants`

Actualización masiva de variantes (requiere autenticación admin).

**Headers Requeridos:**
```
Authorization: Bearer <jwt_token>
Content-Type: application/json
```

**Body:**
```json
{
  "operation": "bulk_update",
  "variant_ids": [1, 2, 3],
  "updates": {
    "is_active": true,
    "stock": 50,
    "price_sale": 2000.00
  }
}
```

**Operaciones Disponibles:**
- `bulk_update`: Actualizar campos específicos
- `bulk_activate`: Activar variantes
- `bulk_deactivate`: Desactivar variantes
- `bulk_stock_update`: Actualizar solo stock

**Respuesta:**
```json
{
  "data": {
    "updated_count": 3,
    "updated_variants": [1, 2, 3],
    "operation": "bulk_update"
  },
  "success": true,
  "message": "3 variantes actualizadas exitosamente"
}
```

### PUT `/api/products/[id]/variants/[variantId]`

Actualiza una variante específica (requiere autenticación admin).

**Headers Requeridos:**
```
Authorization: Bearer <jwt_token>
Content-Type: application/json
```

**Body:**
```json
{
  "color_name": "Azul Marino",
  "color_hex": "#000080",
  "price_sale": 2200.00,
  "stock": 40,
  "is_active": true,
  "metadata": {
    "updated_reason": "Cambio de proveedor"
  }
}
```

**Respuesta:**
```json
{
  "data": {
    "id": 1,
    "product_id": 1,
    "aikon_id": "SW-LAT-001-BL",
    "variant_slug": "azul-marino-mate-1l",
    "color_name": "Azul Marino",
    "color_hex": "#000080",
    "measure": "1L",
    "finish": "Mate",
    "price_list": 2500.00,
    "price_sale": 2200.00,
    "stock": 40,
    "is_active": true,
    "is_default": true,
    "image_url": "variant1.jpg",
    "metadata": {
      "updated_reason": "Cambio de proveedor"
    },
    "created_at": "2025-10-01T10:00:00Z",
    "updated_at": "2025-10-01T12:00:00Z"
  },
  "success": true,
  "message": "Variante actualizada exitosamente"
}
```

### DELETE `/api/products/[id]/variants/[variantId]`

Eliminación suave de una variante (requiere autenticación admin).

**Headers Requeridos:**
```
Authorization: Bearer <jwt_token>
```

**Respuesta:**
```json
{
  "data": {
    "id": 1,
    "deleted": true,
    "new_default_variant_id": 2
  },
  "success": true,
  "message": "Variante eliminada exitosamente. Nueva variante por defecto asignada."
}
```

## Esquemas de Datos

### Variant Schema (Zod)

```typescript
const VariantSchema = z.object({
  product_id: z.number().int().positive(),
  aikon_id: z.string().min(1).max(50),
  variant_slug: z.string().min(1).max(255).optional(),
  color_name: z.string().max(100).optional(),
  color_hex: z.string().regex(/^#[0-9A-Fa-f]{6}$/).optional(),
  measure: z.string().max(50).optional(),
  finish: z.string().max(100).optional(),
  price_list: z.number().min(0),
  price_sale: z.number().min(0).optional(),
  stock: z.number().int().min(0).default(0),
  is_active: z.boolean().default(true),
  is_default: z.boolean().default(false),
  image_url: z.string().url().optional(),
  metadata: z.record(z.any()).default({})
});
```

### Bulk Update Schema

```typescript
const BulkUpdateSchema = z.object({
  operation: z.enum(['bulk_update', 'bulk_activate', 'bulk_deactivate', 'bulk_stock_update']),
  variant_ids: z.array(z.number().int().positive()).min(1),
  updates: z.object({
    is_active: z.boolean().optional(),
    stock: z.number().int().min(0).optional(),
    price_list: z.number().min(0).optional(),
    price_sale: z.number().min(0).optional(),
    metadata: z.record(z.any()).optional()
  }).optional()
});
```

## Códigos de Error

### Errores Comunes

| Código | Mensaje | Descripción |
|--------|---------|-------------|
| 400 | "Datos de entrada inválidos" | Validación de esquema falló |
| 401 | "No autorizado" | Token de autenticación faltante o inválido |
| 403 | "Acceso denegado" | Usuario no tiene permisos de administrador |
| 404 | "Producto no encontrado" | ID de producto no existe |
| 404 | "Variante no encontrada" | ID de variante no existe |
| 409 | "Conflicto de datos" | aikon_id o variant_slug duplicado |
| 422 | "No se puede eliminar la única variante" | Intento de eliminar la última variante |
| 500 | "Error interno del servidor" | Error no manejado |

### Ejemplos de Respuestas de Error

**400 - Validación Fallida:**
```json
{
  "data": null,
  "success": false,
  "error": "Datos de entrada inválidos",
  "details": {
    "field": "color_hex",
    "message": "Formato de color hexadecimal inválido"
  }
}
```

**404 - Producto No Encontrado:**
```json
{
  "data": null,
  "success": false,
  "error": "Producto no encontrado"
}
```

**409 - Conflicto de Datos:**
```json
{
  "data": null,
  "success": false,
  "error": "El aikon_id 'SW-LAT-001-BL' ya existe para este producto"
}
```

## Ejemplos de Uso

### Ejemplo 1: Obtener Productos con Variantes

```bash
curl -X GET "http://localhost:3000/api/products?limit=5" \
  -H "Content-Type: application/json"
```

### Ejemplo 2: Crear Nueva Variante (Admin)

```bash
curl -X POST "http://localhost:3000/api/admin/products/variants" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "product_id": 1,
    "aikon_id": "SW-LAT-001-GR",
    "color_name": "Verde",
    "color_hex": "#00FF00",
    "measure": "1L",
    "finish": "Satinado",
    "price_list": 2500.00,
    "price_sale": 2250.00,
    "stock": 20
  }'
```

### Ejemplo 3: Actualización Masiva (Admin)

```bash
curl -X PUT "http://localhost:3000/api/admin/products/variants" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "operation": "bulk_update",
    "variant_ids": [1, 2, 3],
    "updates": {
      "is_active": true,
      "stock": 50
    }
  }'
```

### Ejemplo 4: Filtrar Variantes por Producto

```bash
curl -X GET "http://localhost:3000/api/admin/products/variants?product_id=1&is_active=true" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -H "Content-Type: application/json"
```

---

**Versión**: 1.0.0  
**Última Actualización**: Octubre 2025  
**Estado**: ✅ COMPLETADO