# 🔌 APIs Administrativas - Pinteya E-commerce

## 📋 Resumen

Documentación completa de las APIs administrativas implementadas para el panel de administración. Todas las APIs incluyen autenticación, validación y manejo de errores robusto.

## 🔐 Autenticación

Todas las APIs administrativas requieren autenticación con Clerk:

```typescript
// Middleware de autenticación
async function checkAdminPermissions() {
  const { userId } = auth();
  
  if (!userId) {
    return { error: 'No autorizado', status: 401 };
  }

  if (!supabaseAdmin) {
    return { error: 'Servicio administrativo no disponible', status: 503 };
  }

  return { userId, supabase: supabaseAdmin };
}
```

## 🛍️ APIs de Productos

### 1. GET /api/admin/products
**Propósito:** Obtener lista paginada de productos con filtros

#### Parámetros de Query:
```typescript
interface ProductListParams {
  page?: number;           // Página actual (default: 1)
  pageSize?: number;       // Elementos por página (default: 25, max: 100)
  sortBy?: string;         // Campo de ordenamiento (default: 'created_at')
  sortOrder?: 'asc' | 'desc'; // Orden (default: 'desc')
  
  // Filtros
  search?: string;         // Búsqueda en nombre y descripción
  category?: string;       // ID de categoría
  status?: 'active' | 'inactive' | 'draft';
  priceMin?: number;       // Precio mínimo
  priceMax?: number;       // Precio máximo
  stockMin?: number;       // Stock mínimo
  stockMax?: number;       // Stock máximo
}
```

#### Respuesta:
```typescript
interface ProductListResponse {
  data: Product[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
  filters: ProductFilters;
  sort: {
    by: string;
    order: 'asc' | 'desc';
  };
}
```

#### Ejemplo de Uso:
```bash
GET /api/admin/products?page=1&pageSize=25&search=pintura&category=uuid&status=active&priceMin=100&priceMax=1000
```

### 2. POST /api/admin/products
**Propósito:** Crear nuevo producto

#### Body:
```typescript
interface CreateProductRequest {
  name: string;                    // Requerido
  description?: string;
  price: number;                   // Requerido, >= 0
  stock: number;                   // Requerido, >= 0
  category_id: string;             // Requerido, UUID válido
  image_url?: string;              // URL válida
  status: 'active' | 'inactive' | 'draft'; // Default: 'draft'
}
```

#### Validaciones:
- ✅ Nombre requerido (1-255 caracteres)
- ✅ Precio >= 0
- ✅ Stock >= 0
- ✅ Categoría debe existir
- ✅ URL de imagen válida (opcional)

#### Respuesta:
```typescript
{
  message: 'Producto creado exitosamente',
  data: Product
}
```

### 3. GET /api/admin/products/[id]
**Propósito:** Obtener producto específico por ID

#### Parámetros:
- `id`: UUID del producto

#### Respuesta:
```typescript
{
  data: Product & {
    category_name: string;
  }
}
```

### 4. PUT /api/admin/products/[id]
**Propósito:** Actualizar producto específico

#### Body:
```typescript
interface UpdateProductRequest {
  name?: string;
  description?: string;
  price?: number;
  stock?: number;
  category_id?: string;
  image_url?: string;
  status?: 'active' | 'inactive' | 'draft';
}
```

#### Validaciones:
- ✅ Todos los campos opcionales
- ✅ Mismas validaciones que POST cuando se proporcionan
- ✅ Verificación de existencia del producto
- ✅ Verificación de categoría si se actualiza

#### Respuesta:
```typescript
{
  message: 'Producto actualizado exitosamente',
  data: Product
}
```

### 5. DELETE /api/admin/products/[id]
**Propósito:** Eliminar producto específico

#### Lógica de Eliminación:
```typescript
// Verificar si tiene órdenes asociadas
const { data: orderItems } = await supabase
  .from('order_items')
  .select('id')
  .eq('product_id', productId)
  .limit(1);

if (orderItems && orderItems.length > 0) {
  // Soft delete: marcar como inactivo
  await supabase
    .from('products')
    .update({ 
      status: 'inactive',
      updated_at: new Date().toISOString()
    })
    .eq('id', productId);
    
  return { message: 'Producto marcado como inactivo (tiene órdenes asociadas)', soft_delete: true };
} else {
  // Hard delete: eliminar completamente
  await supabase
    .from('products')
    .delete()
    .eq('id', productId);
    
  return { message: 'Producto eliminado exitosamente' };
}
```

## 📊 Estructura de Datos

### Product Interface:
```typescript
interface Product {
  id: string;
  name: string;
  description: string;
  price: number;
  stock: number;
  category_id: string;
  category_name?: string;
  image_url?: string;
  status: 'active' | 'inactive' | 'draft';
  created_at: string;
  updated_at: string;
}
```

## 🛡️ Manejo de Errores

### Códigos de Estado:
- **200:** Éxito
- **201:** Creado exitosamente
- **400:** Datos inválidos / Parámetros incorrectos
- **401:** No autorizado
- **404:** Recurso no encontrado
- **500:** Error interno del servidor
- **503:** Servicio no disponible

### Formato de Error:
```typescript
interface ErrorResponse {
  error: string;
  details?: any; // Para errores de validación Zod
}
```

### Ejemplos de Errores:
```json
// Error de validación
{
  "error": "Datos inválidos",
  "details": [
    {
      "code": "too_small",
      "minimum": 1,
      "type": "string",
      "inclusive": true,
      "exact": false,
      "message": "El nombre es requerido",
      "path": ["name"]
    }
  ]
}

// Error de negocio
{
  "error": "Categoría no encontrada"
}

// Error de autorización
{
  "error": "No autorizado"
}
```

## 🔍 Filtros Avanzados

### Búsqueda de Texto:
```sql
-- Búsqueda en nombre y descripción
WHERE name ILIKE '%search%' OR description ILIKE '%search%'
```

### Filtros de Rango:
```sql
-- Precio
WHERE price >= priceMin AND price <= priceMax

-- Stock
WHERE stock >= stockMin AND stock <= stockMax
```

### Ordenamiento:
```sql
-- Campos disponibles para ordenar
ORDER BY created_at, updated_at, name, price, stock
```

## 📈 Performance y Optimización

### Paginación:
```typescript
// Implementación eficiente con LIMIT/OFFSET
const from = (page - 1) * pageSize;
const to = from + pageSize - 1;
query = query.range(from, to);
```

### Índices de Base de Datos:
```sql
-- Índices recomendados para performance
CREATE INDEX idx_products_name ON products(name);
CREATE INDEX idx_products_category_id ON products(category_id);
CREATE INDEX idx_products_status ON products(status);
CREATE INDEX idx_products_price ON products(price);
CREATE INDEX idx_products_created_at ON products(created_at);
```

### Cache Strategy:
- **React Query:** 5 minutos de stale time
- **Invalidación:** Automática en mutaciones
- **Background refetch:** Habilitado

## 🧪 Testing

### Unit Tests:
```typescript
// Ejemplo de test de API
describe('GET /api/admin/products', () => {
  it('should return paginated products', async () => {
    const response = await request(app)
      .get('/api/admin/products?page=1&pageSize=10')
      .set('Authorization', `Bearer ${adminToken}`)
      .expect(200);

    expect(response.body.data).toHaveLength(10);
    expect(response.body.total).toBeGreaterThan(0);
    expect(response.body.page).toBe(1);
  });
});
```

### Integration Tests:
- ✅ Flujo completo CRUD
- ✅ Validaciones de datos
- ✅ Manejo de errores
- ✅ Autenticación y autorización

## 📚 Próximas APIs

### En Desarrollo (SEMANA 3):
- `GET /api/admin/orders` - Lista de órdenes
- `GET /api/admin/orders/[id]` - Detalle de orden
- `PATCH /api/admin/orders/[id]/status` - Cambiar estado
- `GET /api/admin/orders/stats` - Estadísticas

### Planificadas:
- APIs de clientes
- APIs de analytics
- APIs de configuración
- APIs de reportes

## 🔗 Referencias

- [Supabase API Reference](https://supabase.com/docs/reference/javascript)
- [Zod Validation](https://zod.dev/)
- [Clerk Authentication](https://clerk.com/docs)
- [Next.js API Routes](https://nextjs.org/docs/api-routes/introduction)
