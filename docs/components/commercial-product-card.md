# CommercialProductCard

Componente de tarjeta de producto con diseño comercial estilo MercadoLibre, optimizado para conversión y experiencia de usuario.

> **Última actualización**: 15 de Diciembre, 2025 - Refactorizado en arquitectura modular con hooks personalizados y componentes separados.

## 🏗️ Arquitectura Modular

El componente ha sido refactorizado en una arquitectura modular que separa la lógica de negocio en hooks personalizados y la UI en componentes reutilizables:

```
product-card-commercial/
├── index.tsx                    # Componente principal (orquestador)
├── types.ts                      # Tipos e interfaces TypeScript
├── hooks/                        # Lógica de negocio
│   ├── useProductColors.ts      # Manejo de colores y selección
│   ├── useProductMeasures.ts    # Manejo de medidas y capacidades
│   ├── useProductVariants.ts    # Cálculo de precios por variante
│   ├── useProductBadges.ts      # Generación de badges inteligentes
│   └── useProductCardState.ts   # Estado del componente (modal, hover, etc.)
├── components/                   # Componentes UI
│   ├── ProductCardImage.tsx     # Imagen del producto con fallback
│   ├── ProductCardContent.tsx   # Contenido (marca, título, precios)
│   ├── ProductCardActions.tsx   # Botón agregar al carrito
│   ├── ColorPillSelector.tsx    # Selector de colores (pills)
│   └── MeasurePillSelector.tsx  # Selector de medidas (pills)
└── utils/                        # Utilidades
    ├── color-utils.ts           # Funciones de manejo de colores
    ├── measure-utils.ts         # Funciones de manejo de medidas
    └── texture-utils.ts         # Funciones de texturas
```

### Hooks Personalizados

#### `useProductColors`
Extrae colores únicos de las variantes y maneja la selección del usuario.

```tsx
const { uniqueColors, selectedColor, setSelectedColor } = useProductColors({
  variants,
  title
})
```

#### `useProductMeasures`
Extrae medidas/capacidades únicas y maneja la selección.

```tsx
const { uniqueMeasures, selectedMeasure, setSelectedMeasure, commonUnit } = useProductMeasures({
  variants,
  title
})
```

#### `useProductVariants`
Calcula el precio y variante actual basado en la selección de color y medida.

```tsx
const { currentVariant, displayPrice, displayOriginalPrice } = useProductVariants({
  variants,
  selectedColor,
  selectedMeasure,
  price,
  originalPrice
})
```

#### `useProductBadges`
Genera badges inteligentes basados en características del producto.

```tsx
const { badges, resolvedFinish, resolvedFinishSource, isImpregnante } = useProductBadges({
  title,
  slug,
  variants,
  description,
  features,
  specifications,
  dimensions,
  weight,
  brand,
  badgeConfig,
  price,
  medida
})
```

#### `useProductCardState`
Maneja el estado interno del componente (modal, hover, carga, etc.).

```tsx
const state = useProductCardState({ image, title })
// state: { isHovered, showQuickActions, showShopDetailModal, isAddingToCart, ... }
```

### Componentes UI

- **ProductCardImage**: Maneja la imagen con fallback y estados de error
- **ProductCardContent**: Muestra marca, título y precios con formato
- **ProductCardActions**: Botón de agregar al carrito con estados de carga
- **ColorPillSelector**: Selector visual de colores en formato pills
- **MeasurePillSelector**: Selector visual de medidas con unidad integrada

## 🎯 Características

- **Diseño comercial impactante** inspirado en MercadoLibre
- **Imagen destacada** más grande (200px vs 120px)
- **Jerarquía visual mejorada** con precio como elemento principal
- **Texto alineado a la izquierda** para mejor legibilidad
- **Colores consistentes** con la paleta del proyecto (#712F00)
- **Badges llamativos** para descuentos y productos nuevos
- **Ícono SVG personalizado** para envío gratis (icon-envio.svg)
- **Información de envío destacada** con íconos y ubicación
- **Botón CTA optimizado** para conversión
- **Responsive** y accesible
- **Tests completos** (20/20 pasando)

## 📐 Comparación Visual

| Aspecto           | ProductCard Actual    | CommercialProductCard                     |
| ----------------- | --------------------- | ----------------------------------------- |
| **Imagen**        | 120px altura          | 200px altura                              |
| **Badge "Nuevo"** | No disponible         | Esquina superior derecha                  |
| **Título**        | text-base centrado    | text-lg font-semibold alineado izquierda  |
| **Precio**        | text-lg color naranja | text-2xl color #712F00 alineado izquierda |
| **Cuotas**        | Texto simple          | Verde destacado alineado izquierda        |
| **Envío**         | Badge básico          | Ícono SVG personalizado + ubicación       |
| **Botón**         | Estándar              | Amarillo con hover effects                |

## 🚀 Uso Básico

```tsx
import { CommercialProductCard } from '@/components/ui/product-card-commercial'

function ProductGrid() {
  return (
    <CommercialProductCard
      image='/images/products/barniz-campbell.jpg'
      title='Barniz Campbell 4L'
      brand='Petrilac'
      price={19350}
      originalPrice={21500}
      discount='10%'
      isNew={true}
      stock={12}
      productId={123}
      slug='barniz-campbell-4l'
      variants={[
        {
          id: 1,
          color_name: 'Natural',
          color_hex: '#D4A574',
          measure: '4L',
          price_list: 19350,
          stock: 12
        }
      ]}
      onAddToCart={() => console.log('Agregado al carrito')}
    />
  )
}
```

### Uso con Variantes

El componente maneja automáticamente las variantes de productos (colores, medidas, acabados):

```tsx
<CommercialProductCard
  title='Impregnante Danzke'
  price={25000}
  variants={[
    { id: 1, color_name: 'Roble', color_hex: '#8B4513', measure: '4L', price_list: 25000 },
    { id: 2, color_name: 'Roble', color_hex: '#8B4513', measure: '10L', price_list: 55000 },
    { id: 3, color_name: 'Pino', color_hex: '#F4A460', measure: '4L', price_list: 25000 },
  ]}
  // El componente mostrará selectores de color y medida automáticamente
/>
```

## 📋 Props

### Básicas

| Prop            | Tipo     | Default | Descripción                              |
| --------------- | -------- | ------- | ---------------------------------------- |
| `image`         | `string` | -       | URL de la imagen del producto            |
| `title`         | `string` | -       | Nombre del producto                      |
| `brand`         | `string` | -       | Marca del producto                       |
| `price`         | `number` | -       | Precio actual                            |
| `originalPrice` | `number` | -       | Precio original (para mostrar descuento) |
| `discount`      | `string` | -       | Porcentaje de descuento (ej: "10%")      |

### Badges y Estados

| Prop    | Tipo      | Default | Descripción           |
| ------- | --------- | ------- | --------------------- |
| `isNew` | `boolean` | `false` | Muestra badge "Nuevo" |
| `stock` | `number`  | `0`     | Cantidad en stock     |

### Cuotas

| Prop                        | Tipo      | Default | Descripción           |
| --------------------------- | --------- | ------- | --------------------- |
| `installments`              | `object`  | -       | Información de cuotas |
| `installments.quantity`     | `number`  | -       | Cantidad de cuotas    |
| `installments.amount`       | `number`  | -       | Monto por cuota       |
| `installments.interestFree` | `boolean` | -       | Si es sin interés     |

### Envío

| Prop               | Tipo      | Default                                 | Descripción          |
| ------------------ | --------- | --------------------------------------- | -------------------- |
| `freeShipping`     | `boolean` | `false`                                 | Envío gratis manual  |
| `shippingText`     | `string`  | `"Envío GRATIS EXPRESS"`                | Texto del envío      |
| `deliveryLocation` | `string`  | `"Llega gratis hoy en Córdoba Capital"` | Ubicación de entrega |

### Variantes y Badges

| Prop            | Tipo              | Default | Descripción                                    |
| --------------- | ----------------- | ------- | ---------------------------------------------- |
| `variants`      | `ProductVariant[]` | `[]`    | Array de variantes (colores, medidas, etc.)   |
| `badgeConfig`   | `BadgeConfig`     | -       | Configuración de badges inteligentes           |
| `description`   | `string`          | -       | Descripción del producto                        |
| `features`      | `object`          | -       | Características del producto                   |
| `specifications`| `object`          | -       | Especificaciones técnicas                      |
| `dimensions`    | `object`          | -       | Dimensiones del producto                        |
| `weight`        | `number`          | -       | Peso del producto                              |
| `color`         | `string`          | -       | Color directo de la base de datos              |
| `medida`        | `string`          | -       | Medida directa de la base de datos            |

### Interacción

| Prop                | Tipo       | Default                | Descripción            |
| ------------------- | ---------- | ---------------------- | ---------------------- |
| `cta`               | `string`   | `"Agregar al carrito"` | Texto del botón        |
| `onAddToCart`       | `function` | -                      | Callback al hacer clic |
| `showCartAnimation` | `boolean`  | `true`                 | Animación de carga     |
| `productId`         | `number\|string` | - | ID del producto para tracking |
| `slug`              | `string`   | -                      | Slug del producto      |

## 🎨 Ejemplos de Uso

### Producto con Descuento

```tsx
<CommercialProductCard
  image='/images/products/pintura.jpg'
  title='Pintura Látex Premium 20L'
  brand='Sherwin Williams'
  price={8500}
  originalPrice={12000}
  discount='30%'
  isNew={true}
  installments={{
    quantity: 3,
    amount: 2833,
    interestFree: true,
  }}
  onAddToCart={handleAddToCart}
/>
```

### Producto Sin Stock

```tsx
<CommercialProductCard
  image='/images/products/impermeabilizante.jpg'
  title='Impermeabilizante Acrílico 10L'
  brand='Plavicon'
  price={18500}
  originalPrice={20000}
  discount='8%'
  stock={0}
  onAddToCart={handleAddToCart}
/>
```

### Producto con Envío Gratis Automático

```tsx
<CommercialProductCard
  image='/images/products/barniz.jpg'
  title='Barniz Campbell 4L'
  price={20000} // >= 15000 activa envío gratis automático
  installments={{
    quantity: 6,
    amount: 3333,
    interestFree: true,
  }}
  onAddToCart={handleAddToCart}
/>
```

## 🔧 Migración desde ProductCard

Para migrar del `ProductCard` actual al nuevo `CommercialProductCard`:

1. **Cambiar el import:**

```tsx
// Antes
import { ProductCard } from '@/components/ui/card'

// Después
import { CommercialProductCard } from '@/components/ui/product-card-commercial'
```

2. **Actualizar props específicas:**

```tsx
// Antes
<ProductCard
  badge="Nuevo"
  showFreeShipping={true}
  useNewComponents={true}
/>

// Después
<CommercialProductCard
  isNew={true}
  freeShipping={true}
/>
```

3. **Mantener props compatibles:**

- `image`, `title`, `brand`, `price`, `originalPrice`, `discount`
- `stock`, `onAddToCart`, `showCartAnimation`
- `installments` (misma estructura)

## 🚚 Cálculo Automático de Envío Gratis

El badge de "Envío gratis" debe basarse en el umbral configurado por el Design System. Para mantener consistencia en toda la UI:

```tsx
import { useDesignSystemConfig, shouldShowFreeShipping } from '@/lib/design-system-config'

function CardWrapper({ price, features }: { price: number; features?: { freeShipping?: boolean } }) {
  const config = useDesignSystemConfig()
  const freeShipping = features?.freeShipping || shouldShowFreeShipping(price, config)
  return <CommercialProductCard price={price} freeShipping={freeShipping} />
}
```

Esto reemplaza cualquier lógica hardcodeada (por ejemplo `price >= 15000`).

## 🎨 Selectores de Color y Medida (Pills)

Los selectores han sido actualizados de círculos a pills con mejor UX:

- **ColorPillSelector**: Muestra colores como pills con nombre y hex
- **MeasurePillSelector**: Muestra medidas con unidad integrada (ej: "4L", "10L")
- **Interacción mejorada**: Hover effects y estados visuales claros
- **Integración con variantes**: Los selectores se actualizan automáticamente según las variantes disponibles

## 🧪 Testing

El componente incluye 20 tests que cubren:

- ✅ Renderizado básico
- ✅ Badges y estados
- ✅ Información de cuotas
- ✅ Envío gratis (manual y automático)
- ✅ Interacciones del usuario
- ✅ Estados de carga y error
- ✅ Casos edge (sin stock, sin imagen, etc.)
- ✅ Selección de variantes (colores y medidas)
- ✅ Cálculo de precios por variante

```bash
npm test src/components/ui/__tests__/commercial-product-card.test.tsx
```

## 🔧 Extensibilidad

La arquitectura modular permite extender fácilmente el componente:

### Agregar un nuevo hook

```tsx
// hooks/useProductCustomFeature.ts
export const useProductCustomFeature = ({ product }) => {
  // Lógica personalizada
  return { customData, customActions }
}

// En index.tsx
const customFeature = useProductCustomFeature({ product })
```

### Agregar un nuevo componente

```tsx
// components/ProductCardCustom.tsx
export const ProductCardCustom = ({ data }) => {
  // UI personalizada
}

// En index.tsx
<ProductCardCustom data={customFeature.customData} />
```

## 🎯 Beneficios UX

1. **Mayor conversión:** Diseño optimizado para ventas
2. **Información clara:** Jerarquía visual mejorada
3. **Confianza:** Badges y garantías destacadas
4. **Urgencia:** Información de envío prominente
5. **Accesibilidad:** Contraste y legibilidad mejorados

## 🔗 Demo

Visita `/demo/commercial-product-card` para ver la comparación en vivo entre el diseño actual y el nuevo diseño comercial.
