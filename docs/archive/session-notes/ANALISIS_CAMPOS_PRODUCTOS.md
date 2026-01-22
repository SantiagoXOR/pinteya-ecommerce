# Análisis de Campos de Productos - Posibles Inconsistencias

## Estructura de la Tabla `products` en la DB

### Campos Principales (según código y migraciones):

1. **Información Básica:**
   - `id` (BIGSERIAL) - ID único
   - `name` (VARCHAR/TEXT) - Nombre del producto
   - `slug` (VARCHAR/TEXT) - Slug único para URL
   - `description` (TEXT) - Descripción completa
   - `short_description` (TEXT) - Descripción corta (puede no existir en todos)

2. **Precios y Stock:**
   - `price` (DECIMAL(10,2)) - Precio base
   - `discounted_price` (DECIMAL(10,2)) - Precio con descuento (nullable)
   - `stock` (INTEGER/SMALLINT) - Stock del producto base
   - `low_stock_threshold` (INTEGER) - Umbral de stock bajo (puede no existir)

3. **Categorización:**
   - `category_id` (INTEGER/SMALLINT) - **PROBLEMA**: Los productos nuevos usan `category_ids` (array) pero la DB tiene `category_id` (singular)
   - `brand` (VARCHAR/TEXT) - Marca del producto

4. **Imágenes:**
   - `images` (JSONB) - Estructura JSON compleja con diferentes formatos:
     - Formato antiguo: `{url, is_primary}`
     - Formato nuevo: `{previews: [], thumbnails: [], main: ""}`
     - Array simple: `["url1", "url2"]`

5. **Atributos del Producto:**
   - `medida` (TEXT[] o TEXT) - **PROBLEMA POTENCIAL**: Puede ser array o string
   - `terminaciones` (TEXT[]) - Array de terminaciones
   - `color` (TEXT) - Color del producto (puede no estar en todos)

6. **Metadata y Estado:**
   - `is_active` (BOOLEAN) - Producto activo
   - `is_featured` (BOOLEAN) - Producto destacado
   - `exclude_from_meta_feed` (BOOLEAN) - Excluir del feed de Meta (puede no estar en UI)
   - `created_at` (TIMESTAMP)
   - `updated_at` (TIMESTAMP)

7. **Campos que pueden no estar en UI pero sí en DB:**
   - `aikon_id` (VARCHAR) - Código SKU único
   - `cost_price` (DECIMAL) - Precio de costo
   - `compare_price` (DECIMAL) - Precio de comparación
   - `track_inventory` (BOOLEAN) - Rastrear inventario
   - `allow_backorder` (BOOLEAN) - Permitir pedidos sin stock

---

## Problemas Potenciales Identificados

### 1. ⚠️ **Categorías: Múltiples vs Singular**

**Problema:**
- La UI permite seleccionar **múltiples categorías** (`category_ids[]`)
- La tabla `products` tiene `category_id` (singular)
- Existe tabla `product_categories` para relación many-to-many

**Impacto:**
- Productos antiguos: tienen `category_id` singular
- Productos nuevos desde UI: deben guardarse en `product_categories`

**Ejemplo de inconsistencia:**
```sql
-- Producto antiguo (ID 1)
products.category_id = 5

-- Producto nuevo desde UI (ID 300)
products.category_id = NULL (o primera categoría)
product_categories: [(product_id: 300, category_id: 5), (product_id: 300, category_id: 7)]
```

**Solución necesaria:**
- Verificar que el código de creación actualice `product_categories` correctamente
- Al leer productos, considerar tanto `category_id` como `product_categories`

---

### 2. ⚠️ **Medida: Array vs String**

**Problema:**
- La UI usa `medida` como array: `["1L", "4L", "10L"]`
- En la DB puede ser:
  - `TEXT[]` (array PostgreSQL)
  - `TEXT` (string simple)
  - `VARCHAR` (string)

**Ejemplo:**
```sql
-- Producto antiguo
medida = '440CC' (TEXT)

-- Producto nuevo desde UI
medida = ARRAY['1L', '4L', '10L'] (TEXT[])
```

**Impacto:**
- Al leer productos, puede venir como string o array
- Código ya tiene normalización (ver `normalizedInitialData`), pero verificar que funcione correctamente

---

### 3. ⚠️ **Imágenes: Múltiples Formatos JSON**

**Problema:**
- Formatos diferentes en la DB:
  - `{"url": "https://...", "is_primary": true}`
  - `{"previews": ["url1"], "thumbnails": ["url2"], "main": "url3"}`
  - `["url1", "url2", "url3"]`

**Ejemplo:**
```sql
-- Producto antiguo
images = '{"url": "https://example.com/img.jpg", "is_primary": true}'::jsonb

-- Producto nuevo desde UI (con múltiples imágenes)
images = '[
  {"url": "https://supabase.co/storage/.../img1.jpg", "is_primary": true},
  {"url": "https://supabase.co/storage/.../img2.jpg", "is_primary": false}
]'::jsonb
```

**Impacto:**
- El código de lectura debe manejar múltiples formatos
- La escritura debe ser consistente

---

### 4. ⚠️ **Marca: String vs Brand ID**

**Problema:**
- Algunas migraciones mencionan `brand_id` (SMALLINT)
- El código usa `brand` (TEXT/VARCHAR)

**Ejemplo:**
```sql
-- Puede existir
brand = 'Sinteplast' (TEXT)

-- O también
brand_id = 2 (SMALLINT) -> 'Sinteplast' en tabla product_brands
```

**Impacto:**
- Verificar qué campo realmente existe en la tabla
- Normalizar a uno u otro

---

### 5. ⚠️ **Aikon ID: En producto base vs variantes**

**Problema:**
- `products.aikon_id` existe en algunos productos
- `product_variants.aikon_id` es el que realmente se usa (SKU único por variante)

**Ejemplo:**
```sql
-- Producto antiguo
products.aikon_id = 'AIKON-123'

-- Producto nuevo desde UI
products.aikon_id = NULL (o se deja vacío)
product_variants[0].aikon_id = 'AIKON-456-VAR-1'
product_variants[1].aikon_id = 'AIKON-456-VAR-2'
```

**Impacto:**
- No es crítico si `products.aikon_id` se deja NULL
- Lo importante es que `product_variants.aikon_id` sea único

---

### 6. ⚠️ **Campos Faltantes en UI**

**Campos que existen en DB pero NO en el formulario UI:**

- `exclude_from_meta_feed` - ¿Se necesita en UI?
- `low_stock_threshold` - ¿Se necesita en UI?
- `short_description` - ¿Se necesita en UI?
- `cost_price` - Precio de costo
- `compare_price` - Precio de comparación
- `track_inventory` - Rastrear inventario
- `allow_backorder` - Permitir pedidos sin stock

**Impacto:**
- Estos campos se establecerán con valores por defecto (NULL, false, etc.)
- Puede haber inconsistencias si productos antiguos tienen valores específicos

---

## Ejemplos de Carga de Diferentes Tipos de Productos

### Ejemplo 1: Producto Simple (sin variantes)
**Producto antiguo (DB):**
```sql
INSERT INTO products (name, slug, price, discounted_price, stock, category_id, brand, medida, is_active)
VALUES (
  'Pincel Persianero',
  'pincel-persianero-elefante',
  2500.00,
  2250.00,
  50,
  1,
  'Elefante',
  'N/A',  -- medida como string
  true
);
```

**Cómo cargarlo desde UI:**
1. **Información Básica:**
   - Nombre: "Pincel Persianero"
   - Descripción: "Pincel persianero de alta calidad"
   - Categorías: [1] (una categoría)
   - Marca: "Elefante"
   - Medidas: [] (vacío o no aplica)
   - Terminaciones: [] (vacío)

2. **Precios y Stock:**
   - Precio: $2,500.00
   - Porcentaje de descuento: 10% (calcula $2,250.00)
   - Stock: 50

3. **Variantes:**
   - NO agregar variantes (producto simple)

4. **Problema potencial:**
   - Si `medida` en DB es string 'N/A' y UI lo guarda como array vacío `[]`, puede haber inconsistencia

---

### Ejemplo 2: Producto con Variantes por Color y Medida
**Producto antiguo (DB):**
```sql
-- Producto base
INSERT INTO products (name, slug, price, discounted_price, stock, category_id, brand, medida, terminaciones, is_active)
VALUES (
  'Sintético Converlux',
  'sintetico-converlux-petrilac',
  0.00,  -- precio en 0 porque se maneja en variantes
  0.00,
  0,     -- stock en 0 porque se maneja en variantes
  2,
  'Petrilac',
  ARRAY['1L', '4L'],  -- medida como array
  ARRAY['Mate'],      -- terminaciones como array
  true
);

-- Variantes
INSERT INTO product_variants (product_id, aikon_id, color_name, measure, price_list, price_sale, stock, finish)
VALUES
  (12, 'AIKON-SINT-CONV-1L-BLANCO', 'Blanco', '1L', 8500.00, 7650.00, 15, 'Mate'),
  (12, 'AIKON-SINT-CONV-1L-NEGRO', 'Negro', '1L', 8500.00, 7650.00, 12, 'Mate'),
  (12, 'AIKON-SINT-CONV-4L-BLANCO', 'Blanco', '4L', 28500.00, 25650.00, 8, 'Mate');
```

**Cómo cargarlo desde UI:**
1. **Información Básica:**
   - Nombre: "Sintético Converlux"
   - Descripción: "Sintético Converlux marca Petrilac..."
   - Categorías: [2]
   - Marca: "Petrilac"
   - Medidas: ["1L", "4L"] (badges naranjas)
   - Terminaciones: ["Mate"] (badges naranjas)
   - Color: (opcional, puede quedar vacío)

2. **Precios y Stock:**
   - Precio: $0.00 o $8,500.00 (precio base, aunque se sobreescribe en variantes)
   - Descuento: 10% (opcional)
   - Stock: 0 (se maneja en variantes)

3. **Variantes (agregar 3 variantes):**
   - Variante 1:
     - Color: Blanco, #FFFFFF
     - Capacidad: 1L (usar badge)
     - Terminación: Mate
     - Precio Lista: $8,500.00 (usar badge del producto base si existe)
     - Precio Venta: $7,650.00 (usar badge de discounted_price)
     - Stock: 15 (usar badge del producto base o ingresar manualmente)
     - SKU: AIKON-SINT-CONV-1L-BLANCO
   
   - Variante 2:
     - Color: Negro, #000000
     - Capacidad: 1L
     - Terminación: Mate
     - Precio Lista: $8,500.00
     - Precio Venta: $7,650.00
     - Stock: 12
     - SKU: AIKON-SINT-CONV-1L-NEGRO
   
   - Variante 3:
     - Color: Blanco, #FFFFFF
     - Capacidad: 4L (usar badge)
     - Terminación: Mate
     - Precio Lista: $28,500.00
     - Precio Venta: $25,650.00
     - Stock: 8
     - SKU: AIKON-SINT-CONV-4L-BLANCO

4. **Problemas potenciales:**
   - Si el producto base tiene precio $0, los badges de "Usar precio" no funcionarán bien
   - El stock del producto base ($0) no es útil para los badges de stock de variantes

---

### Ejemplo 3: Producto con Variantes Solo por Medida (sin color)
**Producto antiguo (DB):**
```sql
-- Producto base
INSERT INTO products (name, slug, price, discounted_price, stock, category_id, brand, medida, is_active)
VALUES (
  'Cinta Papel Blanca',
  'cinta-papel-blanca-varios',
  0.00,
  0.00,
  0,
  1,
  'Varios',
  ARRAY['18mm', '24mm', '36mm', '48mm'],
  true
);

-- Variantes (todas del mismo color)
INSERT INTO product_variants (product_id, aikon_id, color_name, measure, price_list, price_sale, stock)
VALUES
  (14, 'AIKON-CINTA-18MM', 'Blanco', '18mm', 850.00, 765.00, 100),
  (14, 'AIKON-CINTA-24MM', 'Blanco', '24mm', 950.00, 855.00, 80),
  (14, 'AIKON-CINTA-36MM', 'Blanco', '36mm', 1200.00, 1080.00, 60),
  (14, 'AIKON-CINTA-48MM', 'Blanco', '48mm', 1450.00, 1305.00, 40);
```

**Cómo cargarlo desde UI:**
1. **Información Básica:**
   - Nombre: "Cinta Papel Blanca"
   - Categorías: [1]
   - Marca: "Varios"
   - Medidas: ["18mm", "24mm", "36mm", "48mm"]
   - Color: "Blanco" (o vacío)

2. **Precios y Stock:**
   - Precio: $850.00 (precio base, aunque varía por medida)
   - Descuento: 10%
   - Stock: 0

3. **Variantes (4 variantes, todas color Blanco):**
   - Variante 1: 18mm, $850.00, $765.00, stock: 100
   - Variante 2: 24mm, $950.00, $855.00, stock: 80
   - Variante 3: 36mm, $1,200.00, $1,080.00, stock: 60
   - Variante 4: 48mm, $1,450.00, $1,305.00, stock: 40

4. **Problemas potenciales:**
   - Precios diferentes por medida: los badges "Usar precio" solo funcionan para la primera variante
   - Stock diferente por variante: el badge "Usar stock" no es útil

---

### Ejemplo 4: Producto con Variantes Solo por Color (misma medida)
**Producto antiguo (DB):**
```sql
-- Producto base
INSERT INTO products (name, slug, price, discounted_price, stock, category_id, brand, medida, terminaciones, is_active)
VALUES (
  'Impregnante Danzke',
  'impregnante-danzke-petrilac',
  7800.00,  -- precio base (todas las variantes 1L tienen este precio)
  7020.00,  -- precio con descuento base
  0,        -- stock se maneja en variantes
  2,
  'Petrilac',
  ARRAY['1L', '4L'],
  ARRAY['Satinado'],
  true
);

-- Variantes 1L (todas misma medida, diferentes colores)
INSERT INTO product_variants (product_id, aikon_id, color_name, measure, price_list, price_sale, stock, finish)
VALUES
  (19, 'AIKON-DANZKE-1L-NATURAL', 'Natural', '1L', 7800.00, 7020.00, 25, 'Satinado'),
  (19, 'AIKON-DANZKE-1L-CAOBA', 'Caoba', '1L', 7800.00, 7020.00, 20, 'Satinado'),
  (19, 'AIKON-DANZKE-1L-NOGAL', 'Nogal', '1L', 7800.00, 7020.00, 18, 'Satinado');
```

**Cómo cargarlo desde UI:**
1. **Información Básica:**
   - Nombre: "Impregnante Danzke"
   - Categorías: [2]
   - Marca: "Petrilac"
   - Medidas: ["1L", "4L"]
   - Terminaciones: ["Satinado"]
   - Color: (vacío, se maneja en variantes)

2. **Precios y Stock:**
   - Precio: $7,800.00 ✅ (este precio se aplica a todas las variantes 1L)
   - Descuento: 10% ($7,020.00) ✅
   - Stock: 0

3. **Variantes 1L (usar badges para precio y descuento):**
   - Variante Natural: Color Natural, 1L, Precio Lista $7,800.00 (badge ✅), Precio Venta $7,020.00 (badge ✅), Stock: 25
   - Variante Caoba: Color Caoba, 1L, Precio Lista $7,800.00 (badge ✅), Precio Venta $7,020.00 (badge ✅), Stock: 20
   - Variante Nogal: Color Nogal, 1L, Precio Lista $7,800.00 (badge ✅), Precio Venta $7,020.00 (badge ✅), Stock: 18

4. **✅ Este caso funciona bien con los badges** porque:
   - Todas las variantes tienen el mismo precio base
   - Todas tienen el mismo descuento
   - Los badges son útiles aquí

---

## Resumen de Problemas y Recomendaciones

### ✅ **Campos que funcionan bien:**
- `name`, `slug`, `description`
- `price`, `discounted_price` (siempre DECIMAL)
- `stock` (siempre INTEGER)
- `is_active`, `is_featured`
- `terminaciones` (siempre TEXT[])

### ⚠️ **Campos que requieren atención:**
1. **`category_id` vs `category_ids`**: Verificar que se use `product_categories` para múltiples
2. **`medida`**: Asegurar normalización array/string en lectura
3. **`images`**: Normalizar formato JSONB en escritura/lectura
4. **`brand` vs `brand_id`**: Verificar qué campo existe realmente
5. **Campos faltantes en UI**: Decidir si agregar o dejar con defaults

### 🔧 **Recomendaciones:**
1. Agregar validación en el backend para normalizar `medida` siempre como array
2. Normalizar `images` a un formato consistente (ej: array de objetos `{url, is_primary}`)
3. Verificar que `product_categories` se actualice correctamente al crear/editar
4. Considerar agregar campos faltantes al UI si son importantes para el negocio
5. Documentar el formato esperado de cada campo en el código

