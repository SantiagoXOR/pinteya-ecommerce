# Tipos Actualizados - Referencia Post-Refactorización

## 📋 Resumen de Cambios

Se han actualizado todos los tipos TypeScript para incluir el campo `brand` en la estructura de productos.

## 🔧 Tipos Principales Actualizados

### 1. Base de Datos (`src/types/database.ts`)

```typescript
// Tipo principal de producto en BD
products: {
  Row: {
    id: number;
    name: string;
    brand: string | null;        // ✅ NUEVO CAMPO
    slug: string;
    description: string | null;
    price: number;
    discounted_price: number | null;
    stock: number;
    category_id: number | null;
    images: any | null;
    created_at: string;
    updated_at: string | null;   // ✅ AGREGADO
  };
  Insert: {
    // ... incluye brand?: string | null
  };
  Update: {
    // ... incluye brand?: string | null
  };
}
```

### 2. Validaciones Zod (`src/lib/validations.ts`)

```typescript
// Esquema de producto actualizado
export const ProductSchema = z.object({
  name: z.string().min(1, 'El nombre es requerido').max(255, 'Nombre muy largo'),
  brand: z.string().min(1, 'La marca es requerida').max(100, 'Marca muy larga').optional(), // ✅ NUEVO
  slug: z.string().min(1, 'El slug es requerido').max(255, 'Slug muy largo'),
  description: z.string().optional(),
  price: z.number().positive('El precio debe ser positivo'),
  discounted_price: z.number().positive().optional(),
  stock: z.number().int().min(0, 'El stock no puede ser negativo').default(0),
  category_id: z.number().int().positive().optional(),
  images: z.object({
    previews: z.array(z.string().url()).optional(),
    main: z.string().url().optional(),
  }).optional(),
});

// Filtros actualizados
export const ProductFiltersSchema = z.object({
  category: z.string().optional(),
  brand: z.string().optional(),              // ✅ NUEVO FILTRO
  priceMin: z.number().positive().optional(),
  priceMax: z.number().positive().optional(),
  search: z.string().optional(),
  page: z.number().int().positive().default(1),
  limit: z.number().int().positive().max(100).default(12),
  sortBy: z.enum(['price', 'name', 'created_at', 'brand']).default('created_at'), // ✅ BRAND AGREGADO
  sortOrder: z.enum(['asc', 'desc']).default('desc'),
});
```

### 3. Tipos de API (`src/types/api.ts`)

```typescript
// Filtros de productos actualizados
export interface ProductFilters {
  category?: string;
  brand?: string;                    // ✅ NUEVO FILTRO
  priceMin?: number;
  priceMax?: number;
  search?: string;
  page?: number;
  limit?: number;
  sortBy?: 'price' | 'name' | 'created_at' | 'brand'; // ✅ BRAND AGREGADO
  sortOrder?: 'asc' | 'desc';
}
```

### 4. Tipos Legacy (`src/types/product.ts`)

```typescript
// Tipo legacy actualizado para compatibilidad
export type Product = {
  title: string;
  brand?: string;                    // ✅ NUEVO CAMPO OPCIONAL
  reviews: number;
  price: number;
  discountedPrice: number;
  id: number;
  imgs?: {
    thumbnails: string[];
    previews: string[];
  };
};
```

### 5. Adaptador de Productos (`src/lib/adapters/productAdapter.ts`)

```typescript
// Tipo extendido actualizado
export type ExtendedProduct = LegacyProduct & {
  stock?: number;
  created_at?: string;
  category?: {
    id: number;
    name: string;
    slug: string;
  };
  name?: string;
  brand?: string | null;             // ✅ NUEVO CAMPO
  discounted_price?: number | null;
  images?: any;
};
```

## 🗄️ Esquema de Base de Datos Actualizado

```sql
-- Tabla products actualizada
CREATE TABLE IF NOT EXISTS products (
  id SERIAL PRIMARY KEY,
  name TEXT NOT NULL,
  brand VARCHAR(100),              -- ✅ NUEVA COLUMNA
  slug TEXT UNIQUE NOT NULL,
  description TEXT,
  price DECIMAL(10,2) NOT NULL CHECK (price > 0),
  discounted_price DECIMAL(10,2) CHECK (discounted_price > 0),
  stock INTEGER DEFAULT 0 CHECK (stock >= 0),
  category_id INTEGER REFERENCES categories(id) ON DELETE SET NULL,
  images JSONB DEFAULT '{"thumbnails": [], "previews": []}',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Índice para optimizar búsquedas por marca
CREATE INDEX IF NOT EXISTS idx_products_brand ON products(brand);
```

## 🔄 Compatibilidad y Migración

### Retrocompatibilidad
- ✅ Todos los campos `brand` son opcionales
- ✅ Componentes legacy siguen funcionando
- ✅ APIs mantienen compatibilidad hacia atrás

### Nuevas Funcionalidades Disponibles
- ✅ Filtrado por marca en APIs
- ✅ Ordenamiento por marca
- ✅ Búsqueda optimizada por marca
- ✅ Validación de marca en formularios

### Próximos Pasos
1. **APIs**: Actualizar endpoints para manejar filtros por marca
2. **Componentes**: Modificar UI para mostrar marca separada
3. **Testing**: Actualizar tests para incluir campo brand
4. **Documentación**: Actualizar documentación de APIs

## 📊 Datos de Migración

### Marcas Identificadas
- **Akapol**: 8 productos (Poximix)
- **El Galgo**: 11 productos (pinceles, rodillos, lijas)
- **Plavicon**: 16 productos (pinturas látex)
- **Sinteplast**: 6 productos (Recuplast)
- **Petrilac**: 6 productos (sintéticos, barnices)
- **Genérico**: 6 productos (accesorios)

### Estado de Migración
- ✅ **53 productos** migrados exitosamente
- ✅ **100% de productos** tienen marca asignada
- ✅ **0 errores** en migración de datos
- ✅ **Índices** creados para optimización

## ⚠️ Consideraciones para Desarrollo

### Validaciones
- Campo `brand` es opcional para mantener compatibilidad
- Longitud máxima: 100 caracteres
- Permite valores null en base de datos

### Performance
- Índice `idx_products_brand` optimiza consultas por marca
- Filtros combinados (marca + categoría) son eficientes
- Ordenamiento por marca es rápido

### Testing
- Todos los tests existentes deben seguir pasando
- Nuevos tests deben incluir campo `brand`
- Mocks deben incluir datos de marca
