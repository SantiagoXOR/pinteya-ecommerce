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

## Troubleshooting

### Textura no aparece
1. Verificar que `color_name` sea exactamente "Incoloro" (case-sensitive en DB)
2. Verificar que `isTransparentColor()` detecte el nombre
3. Verificar que el componente reciba `selectedFinish`

### Madera sin vetas
1. Verificar que `isImpregnante` sea `true` para el producto
2. O que `category === 'Madera'` en PAINT_COLORS
3. O que `textureType === 'wood'` explícitamente

### Finish no cambia textura
1. Verificar que `selectedFinish` se pase al componente
2. Verificar que el finish esté en `FINISH_TEXTURES`
3. Recordar: Incoloro y Madera NO cambian con finish (por diseño)

---

*Última actualización: Enero 2026*
