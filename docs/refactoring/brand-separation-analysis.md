# Análisis de Refactorización: Separación de Marca y Nombre de Productos

## 📊 Situación Actual

### Estructura de Base de Datos

La tabla `products` actualmente almacena marca y nombre del producto en un solo campo `name`:

```sql
CREATE TABLE products (
  id SERIAL PRIMARY KEY,
  name TEXT NOT NULL,  -- ⚠️ Contiene marca + nombre mezclados
  slug TEXT UNIQUE NOT NULL,
  description TEXT,
  price DECIMAL(10,2) NOT NULL,
  discounted_price DECIMAL(10,2),
  stock INTEGER DEFAULT 0,
  category_id INTEGER REFERENCES categories(id),
  images JSONB DEFAULT '{"thumbnails": [], "previews": []}',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

### Patrones de Datos Identificados

#### 1. Productos El Galgo

- **Actual**: `"Pincel Persianero N°10 Galgo"`
- **Marca**: `"El Galgo"`
- **Nombre**: `"Pincel Persianero N°10"`

#### 2. Productos Plavicon

- **Actual**: `"Plavipint Techos Poliuretánico 10L Plavicon"`
- **Marca**: `"Plavicon"`
- **Nombre**: `"Plavipint Techos Poliuretánico 10L"`

#### 3. Productos Poximix (Marca Akapol)

- **Actual**: `"Poximix Interior 0.5kg Poxipol"`
- **Marca**: `"Akapol"` (según especificaciones del proyecto)
- **Nombre**: `"Poximix Interior 0.5kg"`

#### 4. Productos Sinteplast

- **Actual**: `"Recuplast Interior 1L Sinteplast"`
- **Marca**: `"Sinteplast"`
- **Nombre**: `"Recuplast Interior 1L"`

#### 5. Productos Petrilac

- **Actual**: `"Sintético Converlux 1L Petrilac"`
- **Marca**: `"Petrilac"`
- **Nombre**: `"Sintético Converlux 1L"`

#### 6. Productos Sherwin Williams

- **Actual**: `"Pintura Sherwin Williams ProClassic"`
- **Marca**: `"Sherwin Williams"`
- **Nombre**: `"Pintura ProClassic"`

## 🎯 Diseño de Nueva Estructura

### Propuesta de Migración

#### 1. Nueva Estructura de Tabla

```sql
ALTER TABLE products ADD COLUMN brand VARCHAR(100);

-- Índice para optimizar búsquedas por marca
CREATE INDEX idx_products_brand ON products(brand);
```

#### 2. Mapeo de Marcas

```javascript
const brandMapping = {
  galgo: 'El Galgo',
  plavicon: 'Plavicon',
  poxipol: 'Akapol', // Productos Poximix son marca Akapol
  sinteplast: 'Sinteplast',
  petrilac: 'Petrilac',
  sherwin: 'Sherwin Williams',
}
```

#### 3. Lógica de Extracción

```javascript
function extractBrandAndName(currentName) {
  // Patrones de extracción por marca
  const patterns = [
    { brand: 'El Galgo', pattern: /(.+?)\s+galgo$/i },
    { brand: 'Plavicon', pattern: /(.+?)\s+plavicon$/i },
    { brand: 'Akapol', pattern: /(.+?)\s+poxipol$/i },
    { brand: 'Sinteplast', pattern: /(.+?)\s+sinteplast$/i },
    { brand: 'Petrilac', pattern: /(.+?)\s+petrilac$/i },
    { brand: 'Sherwin Williams', pattern: /(.+?)\s+sherwin\s+williams/i },
  ]

  for (const { brand, pattern } of patterns) {
    const match = currentName.match(pattern)
    if (match) {
      return {
        brand: brand,
        name: match[1].trim(),
      }
    }
  }

  // Fallback: mantener nombre original sin marca
  return {
    brand: null,
    name: currentName,
  }
}
```

## 📋 Plan de Implementación

### Fase 1: Migración de Base de Datos

1. ✅ Agregar columna `brand` a tabla `products`
2. ✅ Crear script de migración de datos
3. ✅ Ejecutar migración en 22 productos existentes
4. ✅ Validar integridad de datos

### Fase 2: Actualización de Código

1. ✅ Actualizar tipos TypeScript
2. ✅ Modificar esquemas de validación Zod
3. ✅ Actualizar APIs de productos
4. ✅ Refactorizar componentes UI

### Fase 3: Testing y Validación

1. ✅ Actualizar tests existentes
2. ✅ Crear tests para funcionalidad de marcas
3. ✅ Validar funcionalidad completa

## 🔄 Impacto en la Aplicación

### APIs Afectadas

- `GET /api/products` - Incluir campo `brand` en respuesta
- `POST /api/products` - Validar campo `brand` en creación
- Filtros de búsqueda - Permitir filtrado por marca

### Componentes Afectados

- `ProductCard` - Mostrar marca y nombre separados
- `ProductDetail` - Mostrar información de marca
- `SearchResults` - Filtros por marca
- `ProductList` - Agrupación por marca (opcional)

### Beneficios Esperados

1. **Mejor organización de datos**
2. **Filtrado por marca**
3. **SEO mejorado** (marca en metadatos)
4. **Búsqueda más precisa**
5. **Futuras funcionalidades** (páginas de marca, comparaciones)

## ⚠️ Consideraciones

### Retrocompatibilidad

- Mantener campo `name` para compatibilidad
- Componentes legacy pueden seguir usando `name` completo
- Migración gradual de componentes

### Validación de Datos

- Verificar que todos los productos tengan marca asignada
- Validar consistencia de nombres extraídos
- Backup de datos antes de migración

### Performance

- Índice en columna `brand` para búsquedas rápidas
- Considerar cache de marcas populares
- Optimizar queries que usen ambos campos
