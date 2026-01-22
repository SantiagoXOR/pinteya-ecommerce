# Verificación de Base de Datos - Resultados Reales

## ✅ Estructura Real de la Tabla `products`

### Campos Confirmados en la DB:

1. **Información Básica:**
   - `id` (INTEGER/BIGSERIAL) ✅
   - `name` (TEXT) ✅
   - `slug` (TEXT) ✅
   - `description` (TEXT, nullable) ✅
   - ~~`short_description`~~ ❌ **NO EXISTE**

2. **Precios y Stock:**
   - `price` (NUMERIC) ✅
   - `discounted_price` (NUMERIC, nullable) ✅
   - `stock` (INTEGER, default: 0) ✅
   - ~~`low_stock_threshold`~~ ❌ **NO EXISTE**

3. **Categorización:**
   - `category_id` (INTEGER, nullable) ✅ **EXISTE**
   - `brand` (VARCHAR) ✅ **EXISTE** (NO existe `brand_id`)
   - Tabla `product_categories` ✅ **EXISTE** (many-to-many)

4. **Imágenes:**
   - `images` (JSONB, default: `'{"previews": [], "thumbnails": []}'::jsonb`) ✅
   - Formato por defecto: `{previews: [], thumbnails: []}`

5. **Atributos del Producto:**
   - `medida` (VARCHAR/TEXT, nullable) ⚠️ **ES STRING, NO ARRAY**
   - `terminaciones` (TEXT[], default: `'{}'::text[]`) ✅ **ES ARRAY**
   - `color` (VARCHAR, nullable) ✅

6. **Metadata y Estado:**
   - `is_active` (BOOLEAN, default: true) ✅
   - ~~`is_featured`~~ ❌ **NO EXISTE**
   - `exclude_from_meta_feed` (BOOLEAN, default: false) ✅ **EXISTE**
   - `created_at` (TIMESTAMP) ✅
   - `updated_at` (TIMESTAMP) ✅
   - `aikon_id` (VARCHAR, nullable) ✅

7. **Otros:**
   - `search_vector` (TSVECTOR, nullable) ✅

---

## 🔴 PROBLEMAS CRÍTICOS CONFIRMADOS

### 1. ⚠️ **MEDIDA: String vs Array - PROBLEMA REAL**

**Estado actual en DB:**
- `medida` es `VARCHAR/TEXT` (string simple), **NO es array**
- Productos existentes tienen valores como:
  - `'Nº10'`
  - `'22cm'`
  - `'10L'`
  - `'18mm x 40m'`
  - `'Grano 40'`

**Problema:**
- La UI permite ingresar múltiples medidas como array: `["1L", "4L", "10L"]`
- Si se guarda como array desde la UI, puede causar error o inconsistencia
- **SOLUCIÓN NECESARIA**: El backend debe convertir el array a string (ej: concatenar con comas o guardar solo la primera)

**Ejemplo de inconsistencia:**
```sql
-- Producto antiguo (DB)
medida = '4L' (VARCHAR)

-- Producto nuevo desde UI (si se guarda como array)
medida = '["1L", "4L", "10L"]' (string de JSON, incorrecto)
-- O debería ser:
medida = '1L, 4L, 10L' (string concatenado)
-- O solo:
medida = '1L' (primera medida)
```

---

### 2. ✅ **CATEGORÍAS: Funciona Correctamente**

**Estado actual en DB:**
- Existe `category_id` (INTEGER, nullable) en `products`
- Existe tabla `product_categories` (many-to-many) con:
  - `product_id` (INTEGER)
  - `category_id` (INTEGER)
  - `created_at` (TIMESTAMP)

**Hallazgos:**
- Algunos productos tienen múltiples categorías en `product_categories`:
  - Producto 245: 5 categorías `[40,38,35,42,39]`
  - Producto 68: 4 categorías `[40,38,35,39]`
  - Producto 242: 4 categorías `[40,38,35,42]`

**Conclusión:**
- El sistema soporta múltiples categorías correctamente
- Los productos nuevos desde UI deben usar `product_categories` para múltiples
- El campo `category_id` puede quedar NULL o con la primera categoría

---

### 3. ⚠️ **IMÁGENES: Formato por Defecto Confirmado**

**Estado actual en DB:**
- `images` es JSONB
- Default: `'{"previews": [], "thumbnails": []}'::jsonb`
- Formato detectado en productos existentes: `{previews: [], thumbnails: [], main: ""}`

**Conclusión:**
- El formato está normalizado como `{previews, thumbnails, main}`
- El código debe asegurarse de guardar en este formato

---

### 4. ✅ **BRAND: Solo String, No Brand ID**

**Estado actual en DB:**
- Solo existe `brand` (VARCHAR)
- **NO existe `brand_id`**

**Conclusión:**
- No hay problema aquí, el código está correcto usando `brand` como string

---

### 5. ❌ **CAMPOS QUE NO EXISTEN EN LA DB**

**Campos que mencioné pero NO existen:**
- `short_description` ❌
- `low_stock_threshold` ❌
- `is_featured` ❌
- `brand_id` ❌
- `cost_price` ❌
- `compare_price` ❌
- `track_inventory` ❌
- `allow_backorder` ❌

**Campos que existen pero pueden no estar en UI:**
- `exclude_from_meta_feed` ✅ (default: false)

---

### 6. ✅ **TERMINACIONES: Es Array (Correcto)**

**Estado actual en DB:**
- `terminaciones` es `TEXT[]` (array PostgreSQL)
- Default: `'{}'::text[]` (array vacío)
- Esto es consistente con la UI

---

## 📊 Resumen de Inconsistencias Reales

### ✅ **Campos Consistentes:**
1. `name`, `slug`, `description` - Sin problemas
2. `price`, `discounted_price` - Sin problemas
3. `stock` - Sin problemas
4. `is_active` - Sin problemas
5. `terminaciones` - Es array, consistente con UI ✅
6. `brand` - Es string, consistente con UI ✅
7. `category_id` + `product_categories` - Sistema soporta múltiples ✅

### ⚠️ **Campos con Problemas:**

1. **`medida`** - **CRÍTICO**
   - DB: VARCHAR/TEXT (string)
   - UI: Array `string[]`
   - **ACCIÓN REQUERIDA**: Backend debe convertir array a string o solo tomar la primera medida

2. **`images`** - Formato correcto
   - DB: JSONB con formato `{previews: [], thumbnails: [], main: ""}`
   - Verificar que el código guarde en este formato

3. **`exclude_from_meta_feed`** - Campo faltante en UI
   - Existe en DB (default: false)
   - No está en el formulario UI
   - No es crítico si se deja con default

---

## 🔧 Recomendaciones Urgentes

### 1. **CRÍTICO: Normalizar `medida`**

**Opción A: Guardar solo primera medida (Recomendado)**
```typescript
// En el backend, al guardar producto:
const medidaValue = Array.isArray(data.medida) && data.medida.length > 0
  ? data.medida[0]  // Solo primera medida
  : (typeof data.medida === 'string' ? data.medida : null)
```

**Opción B: Guardar como string concatenado**
```typescript
const medidaValue = Array.isArray(data.medida)
  ? data.medida.join(', ')  // "1L, 4L, 10L"
  : data.medida
```

**Opción C: Migrar DB a TEXT[] (Requiere migración)**
- Cambiar tipo de columna de VARCHAR a TEXT[]
- Esto requiere migración de datos existentes

**Recomendación**: Opción A (guardar solo primera medida) es la más segura y no requiere migración.

---

### 2. **Normalizar lectura de `medida`**

El código actual en `normalizedInitialData` ya maneja esto, pero verificar que funcione cuando `medida` viene como string:

```typescript
medida: (() => {
  const rawMedida = (initialData as any).medida
  if (!rawMedida) return []
  if (Array.isArray(rawMedida)) return rawMedida
  if (typeof rawMedida === 'string') {
    return [rawMedida]  // ✅ Convertir string a array para UI
  }
  return [String(rawMedida)]
})(),
```

---

### 3. **Verificar escritura de `images`**

Asegurar que se guarde en formato:
```json
{
  "previews": ["url1", "url2"],
  "thumbnails": ["thumb1", "thumb2"],
  "main": "url1"
}
```

---

## 📝 Ejemplos de Productos Reales en DB

### Producto Antiguo (ID 1):
```sql
{
  id: 1,
  name: "Pincel Persianero",
  category_id: 40,
  medida: "Nº10",  -- STRING, no array
  terminaciones: [],  -- ARRAY vacío
  brand: "El Galgo",
  aikon_id: "524"
}
```

### Producto con Múltiples Categorías (ID 245):
```sql
{
  id: 245,
  name: "Cinta Enmascarar Azul Pintor",
  category_id: 40,  -- Primera categoría
  -- En product_categories: [40, 38, 35, 42, 39] (5 categorías)
}
```

---

## ✅ Conclusión

El problema más crítico es **`medida` siendo VARCHAR en DB pero array en UI**. 

**Acción inmediata requerida:**
1. Modificar el backend para convertir el array de `medida` a string antes de guardar
2. O cambiar la UI para usar string simple en lugar de array
3. O hacer migración de DB para cambiar `medida` a TEXT[] (más complejo)

Los demás campos están bien o tienen soluciones simples ya implementadas.
