# CommercialProductCard

Componente de tarjeta de producto con diseño comercial estilo MercadoLibre, optimizado para conversión y experiencia de usuario.

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

| Aspecto | ProductCard Actual | CommercialProductCard |
|---------|-------------------|----------------------|
| **Imagen** | 120px altura | 200px altura |
| **Badge "Nuevo"** | No disponible | Esquina superior derecha |
| **Título** | text-base centrado | text-lg font-semibold alineado izquierda |
| **Precio** | text-lg color naranja | text-2xl color #712F00 alineado izquierda |
| **Cuotas** | Texto simple | Verde destacado alineado izquierda |
| **Envío** | Badge básico | Ícono SVG personalizado + ubicación |
| **Botón** | Estándar | Amarillo con hover effects |

## 🚀 Uso Básico

```tsx
import { CommercialProductCard } from '@/components/ui/product-card-commercial'

function ProductGrid() {
  return (
    <CommercialProductCard
      image="/images/products/barniz-campbell.jpg"
      title="Barniz Campbell 4L"
      brand="Petrilac"
      price={19350}
      originalPrice={21500}
      discount="10%"
      isNew={true}
      stock={12}
      installments={{
        quantity: 3,
        amount: 6450,
        interestFree: true
      }}
      freeShipping={true}
      deliveryLocation="Llega gratis hoy en Córdoba Capital"
      onAddToCart={() => console.log('Agregado al carrito')}
    />
  )
}
```

## 📋 Props

### Básicas
| Prop | Tipo | Default | Descripción |
|------|------|---------|-------------|
| `image` | `string` | - | URL de la imagen del producto |
| `title` | `string` | - | Nombre del producto |
| `brand` | `string` | - | Marca del producto |
| `price` | `number` | - | Precio actual |
| `originalPrice` | `number` | - | Precio original (para mostrar descuento) |
| `discount` | `string` | - | Porcentaje de descuento (ej: "10%") |

### Badges y Estados
| Prop | Tipo | Default | Descripción |
|------|------|---------|-------------|
| `isNew` | `boolean` | `false` | Muestra badge "Nuevo" |
| `stock` | `number` | `0` | Cantidad en stock |

### Cuotas
| Prop | Tipo | Default | Descripción |
|------|------|---------|-------------|
| `installments` | `object` | - | Información de cuotas |
| `installments.quantity` | `number` | - | Cantidad de cuotas |
| `installments.amount` | `number` | - | Monto por cuota |
| `installments.interestFree` | `boolean` | - | Si es sin interés |

### Envío
| Prop | Tipo | Default | Descripción |
|------|------|---------|-------------|
| `freeShipping` | `boolean` | `false` | Envío gratis manual |
| `shippingText` | `string` | `"Envío GRATIS EXPRESS"` | Texto del envío |
| `deliveryLocation` | `string` | `"Llega gratis hoy en Córdoba Capital"` | Ubicación de entrega |

### Interacción
| Prop | Tipo | Default | Descripción |
|------|------|---------|-------------|
| `cta` | `string` | `"Agregar al carrito"` | Texto del botón |
| `onAddToCart` | `function` | - | Callback al hacer clic |
| `showCartAnimation` | `boolean` | `true` | Animación de carga |

## 🎨 Ejemplos de Uso

### Producto con Descuento
```tsx
<CommercialProductCard
  image="/images/products/pintura.jpg"
  title="Pintura Látex Premium 20L"
  brand="Sherwin Williams"
  price={8500}
  originalPrice={12000}
  discount="30%"
  isNew={true}
  installments={{
    quantity: 3,
    amount: 2833,
    interestFree: true
  }}
  onAddToCart={handleAddToCart}
/>
```

### Producto Sin Stock
```tsx
<CommercialProductCard
  image="/images/products/impermeabilizante.jpg"
  title="Impermeabilizante Acrílico 10L"
  brand="Plavicon"
  price={18500}
  originalPrice={20000}
  discount="8%"
  stock={0}
  onAddToCart={handleAddToCart}
/>
```

### Producto con Envío Gratis Automático
```tsx
<CommercialProductCard
  image="/images/products/barniz.jpg"
  title="Barniz Campbell 4L"
  price={20000} // >= 15000 activa envío gratis automático
  installments={{
    quantity: 6,
    amount: 3333,
    interestFree: true
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

## 🧪 Testing

El componente incluye 20 tests que cubren:
- ✅ Renderizado básico
- ✅ Badges y estados
- ✅ Información de cuotas
- ✅ Envío gratis (manual y automático)
- ✅ Interacciones del usuario
- ✅ Estados de carga y error
- ✅ Casos edge (sin stock, sin imagen, etc.)

```bash
npm test src/components/ui/__tests__/commercial-product-card.test.tsx
```

## 🎯 Beneficios UX

1. **Mayor conversión:** Diseño optimizado para ventas
2. **Información clara:** Jerarquía visual mejorada
3. **Confianza:** Badges y garantías destacadas
4. **Urgencia:** Información de envío prominente
5. **Accesibilidad:** Contraste y legibilidad mejorados

## 🔗 Demo

Visita `/demo/commercial-product-card` para ver la comparación en vivo entre el diseño actual y el nuevo diseño comercial.



