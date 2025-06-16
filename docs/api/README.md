# 🔌 APIs - Referencia Completa

> Documentación completa de todas las APIs del sistema Pinteya E-commerce

## 📋 Resumen de APIs

Pinteya E-commerce cuenta con **22 endpoints** completamente funcionales organizados en 4 categorías principales:

| Categoría | Endpoints | Estado | Documentación |
|-----------|-----------|--------|---------------|
| **Productos** | 6 | ✅ 100% | [📦 Ver Productos](./products.md) |
| **Pagos** | 4 | ✅ 100% | [💳 Ver Pagos](./payments.md) |
| **Usuario** | 8 | ✅ 100% | [👤 Ver Usuario](./user.md) |
| **Órdenes** | 4 | ✅ 100% | [📊 Ver Órdenes](./orders.md) |

## 🚀 Base URL

```
Desarrollo:  http://localhost:3001/api
Producción:  https://pinteya-ecommerce.vercel.app/api
```

## 🔐 Autenticación

### **Rutas Públicas** (No requieren autenticación)
```typescript
// Productos y categorías
GET /api/products
GET /api/products/[id]
GET /api/categories

// Pagos (para checkout)
POST /api/payments/create-preference
POST /api/payments/webhook
GET /api/payments/status

// Utilidades
GET /api/test
```

### **Rutas Protegidas** (Requieren JWT de Clerk)
```typescript
// Usuario
GET /api/user/profile
PUT /api/user/profile
GET /api/user/addresses
POST /api/user/addresses
PUT /api/user/addresses/[id]
DELETE /api/user/addresses/[id]
GET /api/user/orders
GET /api/user/dashboard

// Órdenes
GET /api/orders
GET /api/orders/[id]
POST /api/orders
PUT /api/orders/[id]
```

## 📊 Endpoints por Categoría

### 🛍️ **Productos** (6 endpoints)
```typescript
GET    /api/products              // Listar productos con filtros
GET    /api/products/[id]         // Obtener producto específico
GET    /api/categories            // Listar categorías
GET    /api/products/search       // Buscar productos
GET    /api/products/featured     // Productos destacados
GET    /api/products/category/[slug] // Productos por categoría
```

### 💳 **Pagos** (4 endpoints)
```typescript
POST   /api/payments/create-preference  // Crear preferencia MercadoPago
POST   /api/payments/webhook           // Webhook notificaciones
GET    /api/payments/status            // Estado de pago
GET    /api/payments/methods           // Métodos de pago disponibles
```

### 👤 **Usuario** (8 endpoints)
```typescript
GET    /api/user/profile          // Obtener perfil
PUT    /api/user/profile          // Actualizar perfil
GET    /api/user/addresses        // Listar direcciones
POST   /api/user/addresses        // Crear dirección
PUT    /api/user/addresses/[id]   // Actualizar dirección
DELETE /api/user/addresses/[id]   // Eliminar dirección
GET    /api/user/orders           // Órdenes del usuario
GET    /api/user/dashboard        // Dashboard con estadísticas
```

### 📊 **Órdenes** (4 endpoints)
```typescript
GET    /api/orders               // Listar órdenes (admin)
GET    /api/orders/[id]          // Obtener orden específica
POST   /api/orders               // Crear nueva orden
PUT    /api/orders/[id]          // Actualizar orden
```

## 🔧 Headers Requeridos

### **Para Rutas Protegidas**
```typescript
{
  "Authorization": "Bearer <clerk_jwt_token>",
  "Content-Type": "application/json"
}
```

### **Para Webhooks**
```typescript
{
  "Content-Type": "application/json",
  "x-signature": "<mercadopago_signature>"
}
```

## 📝 Formato de Respuesta

### **Respuesta Exitosa**
```typescript
{
  "success": true,
  "data": any,
  "message": string,
  "timestamp": string
}
```

### **Respuesta de Error**
```typescript
{
  "success": false,
  "error": {
    "code": string,
    "message": string,
    "details": any
  },
  "timestamp": string
}
```

## 🔍 Filtros y Paginación

### **Productos**
```typescript
GET /api/products?page=1&limit=12&category=pinturas&sort=price_asc&search=sherwin
```

### **Órdenes de Usuario**
```typescript
GET /api/user/orders?page=1&limit=10&status=completed&date_from=2025-01-01
```

## 📊 Códigos de Estado HTTP

| Código | Significado | Uso |
|--------|-------------|-----|
| `200` | OK | Operación exitosa |
| `201` | Created | Recurso creado |
| `400` | Bad Request | Datos inválidos |
| `401` | Unauthorized | No autenticado |
| `403` | Forbidden | Sin permisos |
| `404` | Not Found | Recurso no encontrado |
| `500` | Internal Error | Error del servidor |

## 🧪 Testing de APIs

### **Herramientas Recomendadas**
- **Postman**: Colección de endpoints
- **Thunder Client**: Extensión VS Code
- **curl**: Línea de comandos
- **Jest**: Tests automatizados

### **Ejemplo con curl**
```bash
# Obtener productos
curl -X GET "http://localhost:3001/api/products" \
  -H "Content-Type: application/json"

# Crear preferencia de pago
curl -X POST "http://localhost:3001/api/payments/create-preference" \
  -H "Content-Type: application/json" \
  -d '{
    "items": [
      {
        "id": 1,
        "quantity": 2,
        "price": 1500
      }
    ],
    "buyer": {
      "name": "Juan Pérez",
      "email": "juan@example.com"
    }
  }'
```

## 📈 Rate Limiting

### **Límites por Endpoint**
- **Productos**: 100 requests/minuto
- **Pagos**: 10 requests/minuto
- **Usuario**: 50 requests/minuto
- **Órdenes**: 30 requests/minuto

### **Headers de Rate Limit**
```typescript
{
  "X-RateLimit-Limit": "100",
  "X-RateLimit-Remaining": "95",
  "X-RateLimit-Reset": "1640995200"
}
```

## 🔒 Seguridad

### **Validación de Datos**
- **Zod Schemas**: Validación de entrada
- **Sanitización**: Limpieza de datos
- **Type Safety**: TypeScript en toda la API

### **Protección CSRF**
- **SameSite Cookies**: Protección automática
- **Origin Validation**: Validación de origen
- **CORS**: Configuración restrictiva

## 📚 Ejemplos de Uso

### **React Hook**
```typescript
import { useProducts } from '@/hooks/useProducts';

function ProductList() {
  const { products, loading, error } = useProducts({
    filters: { category: 'pinturas' },
    pagination: { page: 1, limit: 12 }
  });

  if (loading) return <div>Cargando...</div>;
  if (error) return <div>Error: {error}</div>;

  return (
    <div>
      {products.map(product => (
        <ProductCard key={product.id} product={product} />
      ))}
    </div>
  );
}
```

### **API Client**
```typescript
import { apiClient } from '@/lib/api-client';

// Obtener productos
const products = await apiClient.get('/products', {
  params: { category: 'pinturas', page: 1 }
});

// Crear orden
const order = await apiClient.post('/orders', {
  items: [{ id: 1, quantity: 2 }],
  shipping_address: { /* ... */ }
});
```

---

## 🔗 Enlaces Relacionados

- [📦 API de Productos](./products.md)
- [💳 API de Pagos](./payments.md)
- [👤 API de Usuario](./user.md)
- [📊 API de Órdenes](./orders.md)

---

*Última actualización: Junio 2025*
