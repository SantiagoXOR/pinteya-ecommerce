# CartSidebarModal

Componente de modal lateral (sheet) para el carrito de compras con drag-to-dismiss, animaciones de transición y integración con Redux y backend.

> **Última actualización**: 15 de Diciembre, 2025 - Implementado con drag-to-dismiss, animación de checkout y soporte para carrito del backend.

## 🎯 Características

- **Modal lateral (Sheet)** - Se desliza desde abajo estilo mobile-first
- **Drag to dismiss** - Arrastrar hacia abajo para cerrar (100px threshold)
- **Integración dual** - Soporte para Redux y carrito del backend
- **Animación de checkout** - Transición suave al hacer checkout
- **Barra de progreso envío** - Muestra progreso hacia envío gratis
- **Cálculo de envío** - Envío gratis desde $50.000, sino $10.000
- **Prevención de scroll** - Bloquea scroll del body cuando está abierto
- **Estados de carga** - Manejo de loading states del carrito

## 📐 Estructura Visual

```
┌─────────────────────────────────────┐
│ ───── (drag handle)                 │
│ [Comprar ahora →]                   │
├─────────────────────────────────────┤
│ [Item 1]                            │
│ [Item 2]                            │
│ [Item 3]                            │
│ ... (scrollable)                    │
├─────────────────────────────────────┤
│ [Progress Bar Envío Gratis]         │
│ Subtotal: $XX.XXX                   │
│ Envío: Gratis / $10.000             │
│ Total: $XX.XXX                      │
│ [MercadoPago] Pago seguro           │
└─────────────────────────────────────┘
```

## 🔧 Uso Básico

```tsx
import CartSidebarModal from '@/components/Common/CartSidebarModal'

// El componente se controla mediante CartSidebarModalContext
<CartSidebarModal />
```

El componente se abre/cierra automáticamente mediante el contexto:

```tsx
import { useCartModalContext } from '@/app/context/CartSidebarModalContext'

const { openCartModal, closeCartModal } = useCartModalContext()
```

## 📋 Props e Interfaces

El componente no acepta props directamente. Obtiene datos de:

- **CartSidebarModalContext**: Para estado abierto/cerrado
- **Redux store**: Para items del carrito (fallback)
- **useCartWithBackend**: Para carrito del backend (preferido)

## 🎨 Estilos y Diseño

### Dimensiones

- **Altura**: `h-[70vh] max-h-[70vh]` (70% de viewport height)
- **Border radius**: `rounded-t-3xl` (solo esquinas superiores)
- **Padding**: `p-0` (sin padding, contenido interno maneja spacing)

### Secciones

1. **Header** (Fixed top)
   - Drag handle: `w-12 h-1.5 bg-gray-300`
   - Botón comprar: `bg-gradient-to-r from-green-600 to-green-700`

2. **Content** (Scrollable)
   - Fondo: `bg-gray-50`
   - Padding: `px-4 sm:px-7.5 lg:px-11`

3. **Footer** (Fixed bottom)
   - Fondo: `bg-white`
   - Border top: `border-t border-gray-200`

### Colores

- **Botón comprar**: Verde gradiente (`from-green-600 to-green-700`)
- **Texto subtotal/total**: Naranja (`#c2410b`)
- **Envío gratis**: Verde (`text-green-600`)
- **Envío con costo**: Amarillo (`text-yellow-600`)

## 🔄 Flujo de Datos

1. **Apertura**: Contexto `isCartModalOpen` se activa
2. **Carga de items**: 
   - Intenta cargar desde `useCartWithBackend` (preferido)
   - Si no hay items del backend, usa Redux como fallback
3. **Cálculo de totales**: 
   - Subtotal: Suma de precios de items
   - Envío: $0 si subtotal >= $50.000, sino $10.000
   - Total: Subtotal + Envío
4. **Checkout**: 
   - Inicia animación de transición
   - Cierra modal
   - Navega a `/checkout`

## 🧪 Testing

### Casos de Prueba

- ✅ Apertura y cierre del modal
- ✅ Drag to dismiss funciona (100px threshold)
- ✅ Items del carrito se muestran correctamente
- ✅ Cálculo de subtotal, envío y total
- ✅ Barra de progreso envío gratis
- ✅ Botón comprar navega a checkout
- ✅ Animación de transición funciona
- ✅ Prevención de scroll del body
- ✅ Estados de loading del carrito
- ✅ Empty state cuando no hay items

## 📝 Notas de Desarrollo

### Commit: `99e06a95` - "feat: mejorar diseño del sheet del carrito"

**Cambios implementados:**

1. **Botón verde en top**
   - Botón "Comprar ahora" movido al header
   - Estilo verde del checkout para consistencia
   - Sticky en la parte superior

2. **Diseño compacto**
   - Altura reducida a 70vh
   - Mejor uso del espacio vertical
   - Padding optimizado

3. **Pesos de precios alineados**
   - Alineación consistente de precios
   - Mejor jerarquía visual
   - Colores diferenciados (subtotal/total en naranja)

### Drag to Dismiss

El componente implementa drag-to-dismiss con:

1. **Touch events**: `onTouchStart`, `onTouchMove`, `onTouchEnd`
2. **Mouse events**: `onMouseDown`, `onMouseMove`, `onMouseUp`
3. **Threshold**: 100px de arrastre hacia abajo para cerrar
4. **Visual feedback**: `translateY` durante el arrastre
5. **Smooth transition**: Transición suave al soltar

### Integración Dual de Carrito

El componente soporta dos fuentes de datos:

1. **Backend (preferido)**: `useCartWithBackend`
   - Sincronizado con base de datos
   - Soporte para múltiples dispositivos
   - Loading states

2. **Redux (fallback)**: `useAppSelector`
   - Estado local del cliente
   - Fallback si backend no está disponible
   - Compatibilidad con código legacy

### Animación de Checkout

El componente usa `useCheckoutTransition` para animación:

```typescript
const { isTransitioning, startTransition } = useCheckoutTransition({
  onTransitionStart: () => closeCartModal(),
  onTransitionComplete: () => {
    // Navegación automática
  },
})
```

Y renderiza `CheckoutTransitionAnimation` para el efecto visual.

### Barra de Progreso Envío

Muestra progreso hacia envío gratis ($50.000):

```tsx
<ShippingProgressBar 
  currentAmount={effectiveTotalPrice} 
  variant='compact' 
  showIcon={true}
/>
```

## 🔗 Archivos Relacionados

- `src/components/Common/CartSidebarModal/index.tsx` - Implementación principal
- `src/components/Common/CartSidebarModal/SingleItem.tsx` - Item individual del carrito
- `src/components/Common/CartSidebarModal/EmptyCart.tsx` - Estado vacío
- `src/app/context/CartSidebarModalContext.tsx` - Contexto para control del modal
- `src/hooks/useCartWithBackend.ts` - Hook para carrito del backend
- `src/hooks/useCheckoutTransition.ts` - Hook para animación de checkout
- `src/components/ui/shipping-progress-bar.tsx` - Barra de progreso
- `src/components/ui/checkout-transition-animation.tsx` - Animación de transición

## 🐛 Troubleshooting

### El modal no se abre

**Solución**: Verifica que `CartSidebarModalContext` esté configurado correctamente y que `openCartModal()` se esté llamando. Asegúrate de que el componente esté renderizado en el layout.

### Drag to dismiss no funciona

**Solución**: Verifica que los eventos touch/mouse estén configurados correctamente. El threshold es de 100px hacia abajo. Asegúrate de que el drag handle tenga los handlers asignados.

### Los items no se muestran

**Solución**: Verifica que:
1. `useCartWithBackend` esté retornando items correctamente
2. Redux tenga items como fallback
3. El componente esté montado (`mounted === true`)

### El cálculo de envío es incorrecto

**Solución**: Verifica que `effectiveTotalPrice` sea correcto. El envío es gratis si `>= 50000`, sino `10000`. Asegúrate de que los precios estén en el formato correcto (sin decimales si son enteros).

### La animación de checkout no funciona

**Solución**: Verifica que `CheckoutTransitionAnimation` esté renderizado y que `isTransitioning` se active correctamente. Asegúrate de que `useCheckoutTransition` esté configurado.
