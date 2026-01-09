# Sistema Unificado de Texturas

## Descripción General

El sistema de texturas centraliza la generación de efectos visuales CSS para los selectores de color (pills y swatches) en toda la aplicación. Simula diferentes acabados de pintura como madera, metálico, tiza, brillante, etc.

## Arquitectura Modular

```
src/lib/textures/
├── index.ts              # API pública (exports)
├── types.ts              # Tipos TypeScript centralizados
├── utils.ts              # Funciones de color (darkenHex, lightenHex)
├── color-detection.ts    # Detección de colores especiales
├── texture-mappings.ts   # Mapeos finish/product → textura
├── texture-generators.ts # Generadores CSS para cada textura
└── texture-resolver.ts   # Lógica de prioridad (función principal)
```

### Beneficios de la Arquitectura

| Archivo | Responsabilidad | Para Modificar |
|---------|-----------------|----------------|
| `types.ts` | Tipos TypeScript | Agregar nuevos tipos |
| `texture-generators.ts` | CSS de texturas | Cambiar efectos visuales |
| `texture-mappings.ts` | Mapeos de datos | Agregar nuevos finishes |
| `texture-resolver.ts` | Lógica de prioridad | Cambiar reglas |
| `color-detection.ts` | Detectores | Agregar colores especiales |

## Tipos de Textura Disponibles

| Tipo | Descripción | Uso |
|------|-------------|-----|
| `solid` | Color sólido sin efecto | Default |
| `wood` | Vetas verticales de madera | Impregnantes, barnices madera |
| `metallic` | Efecto metal cepillado | Pinturas metálicas |
| `chalk` | Textura granulada mate | Pintura a la tiza |
| `pearl` | Efecto perlado iridiscente | Pinturas perladas |
| `gloss` | Brillo intenso | Acabado brillante |
| `satin` | Brillo suave | Acabado satinado |
| `matte` | Sin brillo | Acabado mate |
| `transparent` | Líneas diagonales | Incoloro/Transparente |
| `fluo` | Efecto neón con glow | Colores fluorescentes |
| `rustic` | Efecto óxido/manchas | Hierro antiguo, rústico |

## Prioridad de Texturas

El sistema determina qué textura aplicar siguiendo esta prioridad (de mayor a menor):

```
1. Incoloro/Transparente/Cristal → 'transparent' (SIEMPRE)
2. isImpregnante o category='Madera' → 'wood' (SIEMPRE)
3. selectedFinish (lo que el usuario selecciona) → textura dinámica
4. textureType explícito del color
5. finish original de la variante
6. Inferir del nombre del color (fallback)
```

### Reglas Especiales

- **Incoloro**: Siempre muestra líneas diagonales, sin importar el finish
- **Madera**: Siempre muestra vetas verticales, sin importar el finish
- **Otros productos**: Cambian textura según el finish seleccionado

## Mapeo Finish → Textura

```typescript
FINISH_TEXTURES = {
  'brillante': 'gloss',
  'satinado': 'satin',
  'mate': 'matte',
  'a la tiza': 'chalk',
  'metálico': 'metallic',
  'fluo': 'fluo',
  'rústico': 'rustic',
  'hierro antiguo': 'rustic',
  'perlado': 'pearl',
  // ... más mappings
}
```

## Uso en Componentes

### Función Principal: `resolveTextureType`

```tsx
import { resolveTextureType, getTextureStyle } from '@/lib/textures'

// Una sola llamada resuelve toda la lógica de prioridad
const textureType = useMemo(() => resolveTextureType({
  colorName: colorData.name,
  colorCategory: colorData.category,     // opcional
  colorTextureType: colorData.textureType, // opcional
  colorFinish: colorData.finish,          // opcional
  isWoodProduct: isImpregnante,           // opcional
  selectedFinish,                         // opcional
}), [deps])

// Aplicar estilos
const style = getTextureStyle(colorData.hex, textureType)

return <button style={style}>...</button>
```

### ColorPill (ProductCard)

```tsx
import { resolveTextureType, getTextureStyle, isTransparentColor } from '@/lib/textures'

const textureType = useMemo(() => resolveTextureType({
  colorName: colorData.name,
  colorTextureType: colorData.textureType,
  colorFinish: colorData.finish,
  isWoodProduct: isImpregnante,
  selectedFinish,
}), [colorData.name, colorData.textureType, colorData.finish, isImpregnante, selectedFinish])
```

### ColorSwatch (ShopDetailModal)

```tsx
import { resolveTextureType, getTextureStyle, isTransparentColor } from '@/lib/textures'

const textureType = useMemo(() => resolveTextureType({
  colorName: color.name,
  colorCategory: color.category,
  colorTextureType: color.textureType,
  colorFinish: color.finish,
  selectedFinish,
}), [color.name, color.category, color.textureType, color.finish, selectedFinish])
```

## Función Principal: getTextureStyle

```typescript
function getTextureStyle(hex: string, textureType: TextureType): CSSProperties
```

Retorna un objeto con propiedades CSS:
- `backgroundColor`
- `backgroundImage` (gradientes para el efecto)
- `backgroundSize`
- `backgroundBlendMode`
- `boxShadow`
- `filter` (opcional, para saturación/brillo)
- `overflow: 'hidden'` (contiene efectos dentro del pill)

## Ejemplos de Texturas CSS

### Wood (Madera)
```css
backgroundImage: 
  repeating-linear-gradient(90deg, darker 0 1px, transparent 1px 8px),
  repeating-linear-gradient(95deg, darker 0 1px, transparent 1px 12px);
backgroundBlendMode: multiply;
```

### Metallic (Metálico)
```css
backgroundImage:
  linear-gradient(135deg, lighter 0%, hex 50%, lighter 100%),
  repeating-linear-gradient(0deg, rgba(255,255,255,0.1) 0px 1px, transparent 1px 3px);
backgroundBlendMode: overlay;
boxShadow: inset 0 1px 2px rgba(255,255,255,0.4), inset 0 -1px 2px rgba(0,0,0,0.15);
```

### Transparent (Incoloro)
```css
backgroundImage:
  repeating-linear-gradient(45deg, rgba(200,200,200,0.15) 0px 2px, transparent 2px 4px);
backgroundSize: 6px 6px;
```

### Rustic (Óxido)
```css
backgroundImage:
  radial-gradient(ellipse at 20% 30%, darker 0%, transparent 40%),
  radial-gradient(ellipse at 70% 60%, lighter 0%, transparent 35%),
  repeating-radial-gradient(circle at 40% 40%, darker 0px, transparent 1px 3px);
filter: saturate(0.9) contrast(1.05);
```

## Textura Dinámica

Cuando el usuario selecciona un finish diferente (ej: Brillante → Satinado), los pills actualizan su textura en tiempo real:

```
Usuario selecciona "Satinado"
    ↓
selectedFinish = "Satinado"
    ↓
getTextureForFinish("Satinado") → 'satin'
    ↓
getTextureStyle(hex, 'satin') → CSS styles
    ↓
Pills se re-renderizan con nueva textura
```

**Excepciones**: Incoloro y Madera NO cambian con el finish.

## Base de Datos

Los colores en `product_variants` tienen:
- `color_name`: Nombre del color (ej: "Incoloro", "Caoba")
- `color_hex`: Código hex (ej: "#F5F5F5", "#8B4513")
- `finish`: Acabado (ej: "Brillante", "Mate", "Metálico")

### Valores para Incoloro
```sql
color_name = 'Incoloro'
color_hex = '#F5F5F5'
```

## Agregar Nueva Textura

### Paso 1: Agregar tipo en `types.ts`
```typescript
// src/lib/textures/types.ts
export type TextureType = 
  | 'solid'
  | 'wood'
  | 'nueva-textura'  // ← Agregar aquí
```

### Paso 2: Agregar generador en `texture-generators.ts`
```typescript
// src/lib/textures/texture-generators.ts
'nueva-textura': (hex: string) => ({
  ...BASE_STYLE,
  backgroundColor: hex,
  backgroundImage: '...',
  // ... más propiedades CSS
})
```

### Paso 3: Agregar mapeo en `texture-mappings.ts` (si corresponde)
```typescript
// src/lib/textures/texture-mappings.ts
export const FINISH_TO_TEXTURE: Record<string, TextureType> = {
  // ...
  'nombre del finish': 'nueva-textura',
}
```

## Archivos del Sistema

| Archivo | Propósito |
|---------|-----------|
| `src/lib/textures/index.ts` | API pública (exports) |
| `src/lib/textures/types.ts` | Tipos TypeScript |
| `src/lib/textures/texture-resolver.ts` | Lógica de prioridad |
| `src/lib/textures/texture-generators.ts` | CSS de cada textura |
| `src/lib/textures/texture-mappings.ts` | Mapeos finish/product → textura |
| `src/lib/textures/color-detection.ts` | Detección de colores especiales |
| `src/lib/textures/utils.ts` | Utilidades de color |

## Archivos Consumidores

| Archivo | Uso |
|---------|-----|
| `src/lib/constants/paint-colors.ts` | ColorOption con textureType |
| `src/components/ui/product-card-commercial/types.ts` | ColorData, ColorPillProps |
| `src/components/ui/product-card-commercial/components/ColorPill.tsx` | Pills de color |
| `src/components/ui/advanced-color-picker.tsx` | ColorSwatch |
| `src/components/ShopDetails/ShopDetailModal/index.tsx` | Modal de producto |

---

# Guía de Carga de Productos

## Cómo Funcionan las Texturas Automáticamente

El sistema detecta **automáticamente** qué textura aplicar basándose en los datos de la variante. No necesitas configurar nada extra si sigues estas reglas:

### Flujo de Detección Automática

```
┌─────────────────────────────────────────────────────────────┐
│  VARIANTE EN BASE DE DATOS                                  │
│  ─────────────────────────────────────────────────────────  │
│  color_name: "Caoba"                                        │
│  color_hex: "#8B4513"                                       │
│  finish: "Brillante"                                        │
└─────────────────────────────────────────────────────────────┘
                           │
                           ▼
┌─────────────────────────────────────────────────────────────┐
│  SISTEMA DE TEXTURAS (automático)                           │
│  ─────────────────────────────────────────────────────────  │
│  1. ¿Es "Incoloro"? → transparent                           │
│  2. ¿Es producto madera? → wood                             │
│  3. ¿Tiene finish? → Buscar en FINISH_TO_TEXTURE            │
│     "Brillante" → gloss                                     │
│     "Metálico" → metallic                                   │
│     "A La Tiza" → chalk                                     │
│  4. Fallback → solid                                        │
└─────────────────────────────────────────────────────────────┘
                           │
                           ▼
┌─────────────────────────────────────────────────────────────┐
│  RESULTADO VISUAL                                           │
│  ─────────────────────────────────────────────────────────  │
│  [CAOBA ✓] ← Pill con textura según finish                  │
└─────────────────────────────────────────────────────────────┘
```

## Crear/Editar Variantes con Colores

### Campos Importantes en `product_variants`

| Campo | Tipo | Descripción | Ejemplo |
|-------|------|-------------|---------|
| `color_name` | VARCHAR | Nombre del color | "Caoba", "Incoloro", "Blanco" |
| `color_hex` | VARCHAR(7) | Código hexadecimal | "#8B4513", "#F5F5F5" |
| `finish` | VARCHAR | Acabado/terminación | "Brillante", "Satinado", "Metálico" |
| `measure` | VARCHAR | Medida/capacidad | "1 Litro", "4 L", "440 CC" |

### Valores de `finish` Reconocidos

El sistema reconoce automáticamente estos valores de `finish`:

| Valor en DB | Textura Aplicada | Efecto Visual |
|-------------|------------------|---------------|
| `Brillante` | `gloss` | Brillo intenso |
| `Satinado` | `satin` | Brillo suave |
| `Mate` | `matte` | Sin brillo |
| `Metálico` | `metallic` | Efecto metal cepillado |
| `A La Tiza` | `chalk` | Textura granulada |
| `Fluo` | `fluo` | Efecto neón |
| `Rústico` | `rustic` | Efecto óxido |
| `Hierro Antiguo` | `rustic` | Efecto óxido |
| `Perlado` | `pearl` | Efecto perlado |

### Valores de `color_name` Especiales

| Valor | Comportamiento |
|-------|----------------|
| `Incoloro` | **SIEMPRE** muestra líneas diagonales (transparent) |
| `Transparente` | **SIEMPRE** muestra líneas diagonales |
| `Cristal` | **SIEMPRE** muestra líneas diagonales |

## Ejemplos de INSERT para Variantes

### Producto de Madera (Impregnante)
```sql
INSERT INTO product_variants (product_id, color_name, color_hex, finish, measure, price_list)
VALUES 
  (123, 'Caoba', '#8B4513', 'Brillante', '1 Litro', 15000),
  (123, 'Roble', '#8B7355', 'Brillante', '1 Litro', 15000),
  (123, 'Roble', '#8B7355', 'Satinado', '1 Litro', 15000),
  (123, 'Cedro', '#CD853F', 'Brillante', '1 Litro', 15000);
-- ✅ Todos mostrarán vetas de madera (por ser impregnante)
-- ✅ El usuario puede cambiar entre Brillante/Satinado
```

### Producto Metálico
```sql
INSERT INTO product_variants (product_id, color_name, color_hex, finish, measure, price_list)
VALUES 
  (456, 'Cobre', '#B87333', 'Metálico', '440 CC', 12000),
  (456, 'Oro', '#FFD700', 'Metálico', '440 CC', 12000),
  (456, 'Plata', '#C0C0C0', 'Metálico', '440 CC', 12000);
-- ✅ Todos mostrarán efecto metal cepillado
```

### Producto Incoloro/Barniz
```sql
INSERT INTO product_variants (product_id, color_name, color_hex, finish, measure, price_list)
VALUES 
  (789, 'Incoloro', '#F5F5F5', 'Brillante', '1 Litro', 8000),
  (789, 'Incoloro', '#F5F5F5', 'Satinado', '1 Litro', 8000),
  (789, 'Incoloro', '#F5F5F5', 'Mate', '1 Litro', 8000);
-- ✅ SIEMPRE muestra líneas diagonales (ignora el finish para textura)
-- ✅ El usuario ve las opciones Brillante/Satinado/Mate
```

### Producto con Múltiples Colores y Finishes
```sql
INSERT INTO product_variants (product_id, color_name, color_hex, finish, measure, price_list)
VALUES 
  (101, 'Blanco', '#FFFFFF', 'Brillante', '1 Litro', 10000),
  (101, 'Blanco', '#FFFFFF', 'Satinado', '1 Litro', 10000),
  (101, 'Negro', '#000000', 'Brillante', '1 Litro', 10000),
  (101, 'Negro', '#000000', 'Mate', '1 Litro', 10000),
  (101, 'Rojo', '#DC143C', 'Brillante', '1 Litro', 10000);
-- ✅ La textura cambia dinámicamente al seleccionar finish
```

## Colores Predefinidos (Opcional)

Si el color ya existe en `PAINT_COLORS` (`src/lib/constants/paint-colors.ts`), el sistema usará el hex predefinido. Si no existe, usará el `color_hex` de la variante.

### Agregar Color a la Paleta (Opcional)

Si quieres que un color esté disponible globalmente:

```typescript
// src/lib/constants/paint-colors.ts
export const PAINT_COLORS: ColorOption[] = [
  // ...
  {
    id: 'mi-nuevo-color',
    name: 'mi-nuevo-color',
    displayName: 'Mi Nuevo Color',
    hex: '#ABC123',
    category: 'Sintético',  // o 'Madera', 'Neutros', etc.
    family: 'Personalizados',
    isPopular: false,
    description: 'Descripción del color',
    textureType: 'solid',   // opcional: forzar una textura
  },
]
```

## Tabla de Referencia Rápida

### ¿Qué Textura Se Aplicará?

| Tipo de Producto | color_name | finish | Textura Resultante |
|------------------|------------|--------|-------------------|
| Impregnante Madera | Caoba | Brillante | `wood` (vetas) |
| Impregnante Madera | Roble | Satinado | `wood` (vetas) |
| Barniz | Incoloro | Brillante | `transparent` (líneas) |
| Barniz | Incoloro | Mate | `transparent` (líneas) |
| Aerosol Metálico | Cobre | Metálico | `metallic` (metal) |
| Esmalte Sintético | Blanco | Brillante | `gloss` (brillo) |
| Esmalte Sintético | Negro | Mate | `matte` (sin brillo) |
| Pintura Chalk | Azul | A La Tiza | `chalk` (granulado) |
| Ferroxin | Hierro Antiguo | Rústico | `rustic` (óxido) |
| Aerosol Fluo | Naranja | Fluo | `fluo` (neón) |

## Troubleshooting

### Textura no aparece
1. Verificar que `color_name` sea exactamente "Incoloro" (case-sensitive en DB)
2. Verificar que `isTransparentColor()` detecte el nombre
3. Verificar que el componente reciba `selectedFinish`

### Madera sin vetas
1. Verificar que el producto sea detectado como "impregnante" o "barniz madera"
2. El `detectProductType()` en `product-utils.ts` determina si es madera
3. O agregar `textureType: 'wood'` en PAINT_COLORS

### Finish no cambia textura
1. Verificar que `selectedFinish` se pase al componente
2. Verificar que el finish esté en `FINISH_TO_TEXTURE` (texture-mappings.ts)
3. Recordar: **Incoloro y Madera NO cambian con finish** (por diseño)

### Color aparece gris
1. Verificar que `color_hex` tenga un valor válido (no `null`, no truncado)
2. El hex debe ser formato `#RRGGBB` (7 caracteres)
3. Verificar en DB: `SELECT color_name, color_hex FROM product_variants WHERE color_hex IS NULL`

### Agregar nuevo finish
1. Editar `src/lib/textures/texture-mappings.ts`
2. Agregar al objeto `FINISH_TO_TEXTURE`:
```typescript
'nuevo-finish': 'textura-correspondiente',
```

---

*Última actualización: Enero 2026*
