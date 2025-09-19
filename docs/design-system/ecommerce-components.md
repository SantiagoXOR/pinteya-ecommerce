# 🛒 Componentes E-commerce - Pinteya Design System

> Componentes especializados para e-commerce inspirados en MercadoPago y optimizados para el mercado argentino

## 📋 Índice

- [🏷️ PriceDisplay](#️-pricedisplay)
- [📦 StockIndicator](#-stockindicator)
- [🚚 ShippingInfo](#-shippinginfo)
- [🎨 Tokens E-commerce](#-tokens-e-commerce)
- [📱 Ejemplos de Uso](#-ejemplos-de-uso)

---

## 🏷️ PriceDisplay

Componente para mostrar precios con descuentos, cuotas y información de envío.

### Características

- ✅ **Precios con descuento**: Precio original tachado + porcentaje de descuento
- ✅ **Cuotas sin interés**: Información de financiación
- ✅ **Múltiples monedas**: Soporte para ARS, USD, EUR
- ✅ **Envío gratis**: Badge destacado
- ✅ **Variantes responsive**: Default, center, compact
- ✅ **Tamaños adaptativos**: sm, md, lg, xl

### Uso Básico

```tsx
import { PriceDisplay } from '@/components/ui/price-display'

// Precio simple
<PriceDisplay amount={1550} currency="ARS" />

// Con descuento
<PriceDisplay 
  amount={1550} 
  originalAmount={2000}
  showDiscountPercentage
/>

// Con cuotas
<PriceDisplay 
  amount={15000}
  installments={{
    quantity: 12,
    amount: 1250,
    interestFree: true
  }}
/>

// Completo
<PriceDisplay 
  amount={15000}
  originalAmount={20000}
  installments={{
    quantity: 12,
    amount: 1250,
    interestFree: true
  }}
  showDiscountPercentage
  showFreeShipping
  variant="center"
  size="lg"
/>
```

### Props

| Prop | Tipo | Default | Descripción |
|------|------|---------|-------------|
| `amount` | `number` | - | Precio actual en centavos |
| `originalAmount` | `number` | - | Precio original antes del descuento |
| `currency` | `string` | `"ARS"` | Código de moneda |
| `installments` | `object` | - | Información de cuotas |
| `showDiscountPercentage` | `boolean` | `true` | Mostrar porcentaje de descuento |
| `showFreeShipping` | `boolean` | `false` | Mostrar badge de envío gratis |
| `variant` | `"default" \| "center" \| "compact"` | `"default"` | Variante de diseño |
| `size` | `"sm" \| "md" \| "lg" \| "xl"` | `"md"` | Tamaño del componente |

---

## 📦 StockIndicator

Componente para mostrar disponibilidad de stock con estados automáticos.

### Características

- ✅ **Estados automáticos**: En stock, stock bajo, sin stock, pre-orden
- ✅ **Umbrales configurables**: Define cuándo considerar stock bajo
- ✅ **Cantidad exacta**: Opción para mostrar cantidad específica
- ✅ **Fechas de reposición**: Información de disponibilidad futura
- ✅ **Unidades personalizables**: Litros, kg, metros, etc.
- ✅ **Íconos contextuales**: Íconos apropiados para cada estado

### Uso Básico

```tsx
import { StockIndicator } from '@/components/ui/stock-indicator'

// Stock disponible
<StockIndicator quantity={15} showExactQuantity />

// Stock bajo
<StockIndicator 
  quantity={3} 
  lowStockThreshold={5}
  showExactQuantity 
/>

// Sin stock con reposición
<StockIndicator 
  quantity={0}
  restockDate={new Date('2025-07-05')}
/>

// Pre-orden
<StockIndicator 
  quantity={0}
  allowPreOrder
/>

// Con unidades personalizadas
<StockIndicator 
  quantity={5}
  unit="litros"
  showExactQuantity
/>
```

### Estados de Stock

| Estado | Color | Descripción |
|--------|-------|-------------|
| **En Stock** | 🟢 Verde | Cantidad > umbral bajo |
| **Stock Bajo** | 🟡 Amarillo | Cantidad ≤ umbral bajo |
| **Sin Stock** | 🔴 Rojo | Cantidad = 0 |
| **Pre-orden** | 🔵 Azul | Sin stock pero permite pedidos |

---

## 🚚 ShippingInfo

Componente para mostrar información y opciones de envío.

### Características

- ✅ **Múltiples opciones**: Gratis, rápido, estándar, express, retiro
- ✅ **Calculadora de envío**: Por código postal
- ✅ **Estimación de entrega**: Rangos de días hábiles
- ✅ **Garantías de envío**: Badges de protección
- ✅ **Selección interactiva**: Callbacks para seleccionar opciones
- ✅ **Variantes de diseño**: Default, inline, badge, card

### Uso Básico

```tsx
import { ShippingInfo } from '@/components/ui/shipping-info'

// Envío gratis simple
<ShippingInfo highlightFreeShipping />

// Badge de envío gratis
<ShippingInfo variant="badge" type="free" />

// Múltiples opciones
<ShippingInfo 
  variant="card"
  options={[
    {
      id: 'free',
      name: 'Envío gratis',
      price: 0,
      estimatedDays: { min: 5, max: 7 },
      isFree: true,
      description: 'En compras mayores a $50.000'
    },
    {
      id: 'express',
      name: 'Envío express',
      price: 3000,
      estimatedDays: { min: 1, max: 2 },
      isExpress: true
    }
  ]}
  onOptionSelect={(id) => console.log('Selected:', id)}
  showGuarantees
/>

// Con calculadora
<ShippingInfo 
  showCalculator
  postalCode="1425"
/>
```

---

## 🎨 Tokens E-commerce

Nuevos tokens de color específicos para e-commerce:

```typescript
// Precios
ecommerce.price.current: '#712F00'      // Precio actual
ecommerce.price.original: '#757575'     // Precio original tachado
ecommerce.price.discount: '#F44336'     // Color de descuento
ecommerce.price.installments: '#00A651' // Color de cuotas

// Stock
ecommerce.stock.available: '#00A651'    // En stock
ecommerce.stock.low: '#FF9800'          // Stock bajo
ecommerce.stock.outOfStock: '#F44336'   // Sin stock
ecommerce.stock.preOrder: '#2196F3'     // Pre-orden

// Envío
ecommerce.shipping.free: '#00A651'      // Envío gratis
ecommerce.shipping.fast: '#2196F3'      // Envío rápido
ecommerce.shipping.express: '#9C27B0'   // Envío express

// Estados de compra
ecommerce.purchase.addToCart: '#EF7D00' // Agregar al carrito
ecommerce.purchase.buyNow: '#00A651'    // Comprar ahora
ecommerce.purchase.wishlist: '#F44336'  // Lista de deseos

// Badges
ecommerce.badges.new: '#2196F3'         // Nuevo
ecommerce.badges.sale: '#F44336'        // Oferta
ecommerce.badges.featured: '#FF9800'    // Destacado
ecommerce.badges.bestseller: '#9C27B0'  // Más vendido
```

---

## 📱 Ejemplos de Uso

### Producto de Pinturería Completo

```tsx
import { PriceDisplay, StockIndicator, ShippingInfo } from '@/components/ui'

function ProductCard() {
  return (
    <div className="border rounded-lg p-4 space-y-4">
      <h3 className="font-medium">Pintura Sherwin Williams 4L</h3>
      
      {/* Precio con descuento y cuotas */}
      <PriceDisplay 
        amount={8500}
        originalAmount={10000}
        installments={{
          quantity: 6,
          amount: 1417,
          interestFree: true
        }}
        showFreeShipping
        variant="center"
      />
      
      {/* Stock disponible */}
      <StockIndicator 
        quantity={12}
        unit="latas"
        showExactQuantity
        lowStockThreshold={5}
      />
      
      {/* Opciones de envío */}
      <ShippingInfo 
        variant="card"
        options={[
          {
            id: 'free',
            name: 'Envío gratis',
            price: 0,
            estimatedDays: { min: 5, max: 7 },
            isFree: true,
            description: 'Compra mínima $50.000'
          },
          {
            id: 'standard',
            name: 'Envío estándar',
            price: 2500,
            estimatedDays: { min: 3, max: 5 },
            description: 'Productos pesados'
          }
        ]}
        showGuarantees
      />
    </div>
  )
}
```

### Grid de Productos

```tsx
function ProductGrid() {
  return (
    <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
      {products.map(product => (
        <div key={product.id} className="border rounded-lg p-3">
          <img src={product.image} alt={product.name} />
          <h4 className="font-medium text-sm mt-2">{product.name}</h4>
          
          <PriceDisplay 
            amount={product.price}
            originalAmount={product.originalPrice}
            variant="compact"
            size="sm"
          />
          
          <StockIndicator 
            quantity={product.stock}
            variant="minimal"
          />
        </div>
      ))}
    </div>
  )
}
```

---

## 🎯 Mejores Prácticas

### 1. **Consistencia de Precios**
- Siempre usar centavos para evitar errores de redondeo
- Mantener formato de moneda consistente (ARS para Argentina)
- Mostrar descuentos de forma prominente

### 2. **Información de Stock**
- Ser transparente con la disponibilidad
- Usar umbrales apropiados para cada tipo de producto
- Ofrecer alternativas cuando no hay stock

### 3. **Opciones de Envío**
- Destacar envío gratis cuando aplique
- Mostrar tiempos de entrega realistas
- Incluir calculadora para productos pesados

### 4. **Responsive Design**
- Usar variantes compactas en móviles
- Priorizar información más importante
- Mantener legibilidad en pantallas pequeñas

---

## 🔗 Enlaces Relacionados

- [🎨 Tokens de Diseño](./tokens.md)
- [🌈 Paleta de Colores](./colors.md)
- [📱 Responsive Design](./responsive.md)
- [🧭 Componentes de Navegación](./components/navigation.md)



