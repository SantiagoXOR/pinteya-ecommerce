---
name: Optimización CRO y UI Fixes
overview: Implementación de mejoras críticas de conversión (CRO) y correcciones de UI/UX basadas en el diagnóstico detallado del e-commerce Pinte Ya!. Incluye estandarización de formato de precios, optimización del flujo de checkout, mejoras de microcopy y ajustes de UX. Plan actualizado con análisis exhaustivo de huecos y mejoras identificadas.
todos:
  - id: fix-currency-format-core
    content: Estandarizar formato de moneda en funciones core (consolidated-utils.ts, helpers.ts, price-display.tsx)
    status: completed
  - id: fix-currency-format-card
    content: Corregir formato de precios en card.tsx (líneas 305, 325, 333)
    status: completed
    dependencies:
      - fix-currency-format-core
  - id: fix-currency-format-product-card
    content: Corregir formato de precios en ProductCardContent.tsx (líneas 64, 78)
    status: completed
    dependencies:
      - fix-currency-format-core
  - id: fix-currency-format-cart-sidebar
    content: Corregir formato de precios en CartSidebarModal/index.tsx (líneas 243, 255, 266)
    status: completed
    dependencies:
      - fix-currency-format-core
  - id: verify-checkout-price-formats
    content: Verificar y corregir formato de precios en CartSummaryFooter.tsx y ProductAddedScreen.tsx
    status: completed
    dependencies:
      - fix-currency-format-core
  - id: hide-header-footer-checkout
    content: Ocultar Header, Footer y BottomNav en checkout (providers.tsx líneas 247, 263, 172)
    status: completed
  - id: fix-checkout-button-position
    content: Mover botón 'Comprar ahora' después del resumen de totales en MetaCheckoutWizard.tsx
    status: completed
  - id: create-sticky-add-to-cart
    content: Crear componente StickyAddToCart con consideraciones de z-index, padding y accesibilidad
    status: completed
  - id: verify-use-media-query
    content: Verificar o crear hook useMediaQuery.ts para detección de móvil en StickyAddToCart
    status: completed
  - id: hide-checkout-testimonials
    content: Eliminar completamente testimonios en todos los pasos del checkout
    status: completed
  - id: update-contact-microcopy
    content: Actualizar texto del paso de contacto en MetaCheckoutWizard.tsx (línea 561)
    status: completed
  - id: update-shipping-microcopy
    content: Actualizar texto del paso de envío y placeholder en MetaCheckoutWizard.tsx (líneas 705, 740)
    status: completed
  - id: update-mercadopago-description
    content: Actualizar descripción de Mercado Pago en PaymentMethodSelector.tsx (línea 99)
    status: completed
  - id: update-confirmation-microcopy
    content: Actualizar textos de confirmación y botón final en MetaCheckoutWizard.tsx (líneas 832-836, 480)
    status: completed
  - id: consolidate-format-functions
    content: Decidir estrategia de consolidación de funciones formatCurrency (consolidated-utils.ts vs formatters.ts vs format.ts)
    status: completed
  - id: verify-edge-cases-prices
    content: "Verificar manejo de casos edge: precios null, 0, muy grandes, decimales terminados en 0"
    status: completed
    dependencies:
      - fix-currency-format-core
  - id: verify-checkout-express
    content: Verificar formato de precios y microcopy en CheckoutExpress.tsx y SimplifiedCheckout.tsx
    status: completed
    dependencies:
      - fix-currency-format-core
  - id: create-checkout-texts-constants
    content: Crear archivo constants/checkout-texts.ts para centralizar textos de checkout
    status: completed
  - id: add-price-format-tests
    content: Agregar tests unitarios para formatCurrency con casos edge (0, null, muy grandes, decimales)
    status: completed
    dependencies:
      - fix-currency-format-core
  - id: add-sticky-button-tests
    content: Agregar tests para StickyAddToCart (móvil/desktop, z-index, padding, funcionalidad)
    status: cancelled
    dependencies:
      - create-sticky-add-to-cart
---

# Plan de Optimización CRO y UI Fixes - Pinte Ya! (Unificado y Actualizado)

## Resumen Ejecutivo

Este plan implementa las mejoras críticas identificadas en el diagnóstico del e-commerce para aumentar la tasa de conversión y mejorar la experiencia de usuario. Las mejoras se dividen en 3 épicas principales:

1. **Corrección de Formato de Moneda** (Prioridad Crítica)
2. **Optimización del Flujo de Checkout** (Prioridad Alta)
3. **Mejora de Microcopy y UX** (Prioridad Media-Alta)

## ⚠️ Resumen de Hallazgos Críticos del Análisis Exhaustivo

Este plan ha sido actualizado con un análisis exhaustivo que identificó múltiples huecos críticos en la implementación original:

1. **5 archivos adicionales** con formato de precios inconsistente no identificados inicialmente
2. **Header/Footer/BottomNav** NO están ocultos en checkout (solo admin/auth)
3. **StickyAddToCart** necesita consideraciones de z-index, padding y accesibilidad
4. **Múltiples funciones de formateo** duplicadas que requieren consolidación
5. **Casos edge** no considerados (precios null, muy grandes, decimales)

Ver sección completa "Análisis de Huecos y Mejoras Identificadas" al final del documento para detalles completos.---

## Épica 1: Estandarización de Formato de Moneda

### Problema

Inconsistencia en el formato de precios: se mezclan formatos (ej: `$13,621.3` en lugar de `$13.621,30`), generando desconfianza en los usuarios.

### Archivos a Modificar

1. **[src/lib/utils/consolidated-utils.ts](src/lib/utils/consolidated-utils.ts)**

- Función `formatCurrency`: Asegurar que siempre use formato `es-AR` con 2 decimales o 0 si es entero
- Regla: Nunca mostrar 1 decimal (ej: `.3`)

2. **[src/utils/helpers.ts](src/utils/helpers.ts)**

- Función `formatPrice`: Actualizar para usar `formatCurrency` de `consolidated-utils.ts` en lugar de implementación propia
- Eliminar duplicación de lógica

3. **[src/components/ui/price-display.tsx](src/components/ui/price-display.tsx)**

- Función `renderPrice`: Verificar que use el formato correcto con 2 decimales siempre

4. **[src/components/Checkout/MetaCheckoutFlow/MetaCheckoutWizard.tsx](src/components/Checkout/MetaCheckoutFlow/MetaCheckoutWizard.tsx)**

- Línea 480: Corregir formato del precio en botón "Pagar"
- Líneas 864, 869: Corregir formato de precios en lista de productos

5. **[src/components/Cart/OrderSummary.tsx](src/components/Cart/OrderSummary.tsx)**

- Línea 55: Corregir formato de precio (actualmente usa `.toFixed(2)` que puede generar formato incorrecto)

### Solución Técnica

Crear una función centralizada de formateo que:

- Use `Intl.NumberFormat('es-AR')` con configuración consistente
- Formato: Separador de miles con punto (.), decimales con coma (,)
- Siempre mostrar 2 decimales o 0 si es entero
- Nunca mostrar 1 decimal
```typescript
// Función centralizada en consolidated-utils.ts
export function formatCurrency(
  amount: number | string | null | undefined,
  currency: string = 'ARS',
  options?: Intl.NumberFormatOptions
): string {
  // ... validación de amount ...
  const defaultOptions: Intl.NumberFormatOptions = {
    style: 'currency',
    currency: currency.toUpperCase(),
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
    ...options,
  }
  // Si el decimal es .00, mostrar sin decimales (opcional, según preferencia)
  const formatted = new Intl.NumberFormat('es-AR', defaultOptions).format(safeAmount)
  // Opcional: remover .00 final para enteros
  return formatted.replace(/,\d{2}$/, '') // Solo si se prefiere sin decimales para enteros
}
```


---

## Épica 2: Optimización del Flujo de Checkout

### 2.1 Reubicación del Botón "Comprar ahora"

**Archivo**: [src/components/Checkout/MetaCheckoutFlow/MetaCheckoutWizard.tsx](src/components/Checkout/MetaCheckoutFlow/MetaCheckoutWizard.tsx)**Problema**: El botón "Comprar ahora" aparece antes del resumen de totales (línea 390-414), rompiendo el flujo lógico del usuario.**Solución**:

- Mover el botón "Comprar ahora" (líneas 389-414) para que aparezca **después** del componente `CartSummaryFooter` (línea 381-386)
- Mantener el botón sticky solo si la lista de productos es muy larga
- Orden correcto: Productos → Subtotal → Envío → Total → Botón "Comprar ahora"

### 2.2 Botón Sticky en Ficha de Producto

**Archivos**:

- [src/components/ShopDetails/ShopDetailModal/index.tsx](src/components/ShopDetails/ShopDetailModal/index.tsx)
- [src/components/ShopDetails/ShopDetailModal/components/AddToCartSection.tsx](src/components/ShopDetails/ShopDetailModal/components/AddToCartSection.tsx)

**Problema**: El botón "Agregar al carrito" no es visible sin hacer scroll en móviles.**Solución**:

- Crear un componente `StickyAddToCart` que se muestre fijo en la parte inferior del viewport
- Contenido: Precio final + Botón "Agregar al carrito"
- Usar `position: fixed` con `z-index` alto
- Solo mostrar en móviles (usar media query o hook de detección de móvil)

**Implementación**:

```tsx
// Nuevo componente: src/components/ShopDetails/StickyAddToCart.tsx
<div className="fixed bottom-0 left-0 right-0 z-50 bg-white border-t shadow-lg md:hidden">
  <div className="flex items-center justify-between p-4">
    <div>
      <p className="text-sm text-gray-600">Total</p>
      <p className="text-2xl font-bold text-orange-600">{formattedPrice}</p>
    </div>
    <Button onClick={onAddToCart} className="flex-1 ml-4">
      Agregar al Carrito
    </Button>
  </div>
</div>
```



### 2.3 Limpieza del "Túnel de Compra"

**Archivo**: [src/components/Checkout/MetaCheckoutFlow/MetaCheckoutWizard.tsx](src/components/Checkout/MetaCheckoutFlow/MetaCheckoutWizard.tsx)**Problema**: Los testimonios y navegación principal aparecen durante el checkout (líneas 417-419, 489-494), distrayendo al usuario.**Solución**:

- Ocultar el componente `Testimonials` en todos los pasos del checkout (excepto quizás en el paso de resumen inicial)
- Verificar si hay un layout específico para `/checkout` que oculte el Header/Footer
- Si no existe, crear un layout condicional que oculte elementos distractores cuando `pathname.includes('/checkout')`

**Archivos a revisar**:

- [src/app/checkout/page.tsx](src/app/checkout/page.tsx) - Verificar si usa layout especial
- [src/app/providers.tsx](src/app/providers.tsx) - Verificar si Header/Footer se renderizan condicionalmente
- [src/components/Header/index.tsx](src/components/Header/index.tsx) - Verificar si se puede ocultar en checkout

**Implementación**:

```tsx
// En MetaCheckoutWizard.tsx, líneas 416-419 y 489-494
// Cambiar de:
{state.currentStep === 'summary' && (
  <div className='mt-4'>
    <Testimonials />
  </div>
)}
// A:
{false && state.currentStep === 'summary' && (
  <div className='mt-4'>
    <Testimonials />
  </div>
)}
// O mejor, eliminar completamente estas secciones
```

---

## Épica 3: Mejora de Microcopy y UX

### 3.1 Texto del Paso de Contacto

**Archivo**: [src/components/Checkout/MetaCheckoutFlow/MetaCheckoutWizard.tsx](src/components/Checkout/MetaCheckoutFlow/MetaCheckoutWizard.tsx)**Línea 561**: Cambiar:

- **Actual**: `"Necesitamos tu nombre y teléfono para confirmar tu pedido y contactarte."`
- **Nuevo**: `"Ingresá tus datos para que sepamos a quién entregarle el pedido."`

### 3.2 Texto del Paso de Envío

**Archivo**: [src/components/Checkout/MetaCheckoutFlow/MetaCheckoutWizard.tsx](src/components/Checkout/MetaCheckoutFlow/MetaCheckoutWizard.tsx)**Línea 705**: Cambiar:

- **Actual**: `"Ingresá la dirección donde querés recibir tu pedido."`
- **Nuevo**: `"¿A dónde te llevamos tus pinturas?"`

**Línea 740**: Actualizar placeholder del campo de dirección:

- Agregar placeholder: `"Calle y número (ej: Manuel Dorrego 1680)"`

### 3.3 Descripción de Mercado Pago

**Archivo**: [src/components/Checkout/PaymentMethodSelector.tsx](src/components/Checkout/PaymentMethodSelector.tsx)**Línea 99**: Cambiar:

- **Actual**: `"Tarjetas y más opciones"`
- **Nuevo**: `"Pagá online en cuotas. Tarjetas de crédito, débito o dinero en cuenta."`

### 3.4 Confirmación Final

**Archivo**: [src/components/Checkout/MetaCheckoutFlow/MetaCheckoutWizard.tsx](src/components/Checkout/MetaCheckoutFlow/MetaCheckoutWizard.tsx)**Líneas 832-836**: Cambiar:

- **Título actual**: `"Revisá tu pedido antes de confirmar"`
- **Título nuevo**: `"¡Ya casi es tuyo!"`
- **Cuerpo actual**: `"Verificá que todos los datos sean correctos antes de proceder al pago."`
- **Cuerpo nuevo**: `"Dale un último vistazo a los detalles antes de finalizar la compra."`

**Línea 480**: Cambiar texto del botón:

- **Actual**: `"Pagar $X.XXX"`
- **Nuevo**: `"Confirmar Pedido"` (mantener el precio pero cambiar el verbo)

---

## Orden de Implementación Recomendado

1. **Fase 1 (Crítica)**: Épica 1 - Formato de Moneda
2. **Fase 2 (Alta)**: Épica 2.1 y 2.2 - Reubicación de botones
3. **Fase 3 (Media)**: Épica 3 - Microcopy
4. **Fase 4 (Media)**: Épica 2.3 - Limpieza del túnel de compra

---

## Testing

Después de cada cambio, verificar:

- [ ] Precios se muestran correctamente en formato argentino
- [ ] Botón "Comprar ahora" aparece después del total
- [ ] Botón sticky funciona en móvil en ficha de producto
- [ ] Textos actualizados se muestran correctamente
- [ ] No hay elementos distractores en el checkout (pasos 2-5)
- [ ] El flujo completo de checkout funciona sin errores

---

## Análisis de Huecos y Mejoras Identificadas

### 🔴 CRÍTICO: Archivos Adicionales con Formato de Precios Inconsistente

El análisis del código reveló **múltiples archivos adicionales** que usan `.toLocaleString('es-AR')` directamente sin usar la función centralizada:

#### Archivos Críticos a Actualizar:

1. **[src/components/ui/card.tsx](src/components/ui/card.tsx)**

- **Líneas 305, 325, 333**: Usa `toLocaleString('es-AR')` directamente
- **Problema**: No maneja decimales correctamente (puede mostrar `.3` en lugar de `.30`)
- **Solución**: Reemplazar con `formatCurrency()` de `consolidated-utils.ts`

2. **[src/components/ui/product-card-commercial/components/ProductCardContent.tsx](src/components/ui/product-card-commercial/components/ProductCardContent.tsx)**

- **Líneas 64, 78**: Usa `toLocaleString('es-AR')` con `minimumFractionDigits: 0`
- **Problema**: Configuración inconsistente con el resto de la app
- **Solución**: Usar función centralizada con opciones consistentes

3. **[src/components/Common/CartSidebarModal/index.tsx](src/components/Common/CartSidebarModal/index.tsx)**

- **Líneas 243, 255, 266**: Usa `toLocaleString()` sin especificar locale
- **Problema**: Puede usar formato incorrecto según configuración del navegador
- **Solución**: Especificar `'es-AR'` o mejor, usar `formatCurrency()`

4. **[src/components/Checkout/MetaCheckoutFlow/CartSummaryFooter.tsx](src/components/Checkout/MetaCheckoutFlow/CartSummaryFooter.tsx)**

- **Verificar**: Si usa formateo de precios, debe usar función centralizada

5. **[src/components/Checkout/MetaCheckoutFlow/ProductAddedScreen.tsx](src/components/Checkout/MetaCheckoutFlow/ProductAddedScreen.tsx)**

- **Verificar**: Si muestra precios, debe usar función centralizada

### 🟠 ALTA: Ocultación de Header/Footer y Bottom Nav en Checkout

**Problema Identificado**: El Header, Footer y Bottom Navigation NO están ocultos en checkout, solo en admin y auth.**Archivo**: [src/app/providers.tsx](src/app/providers.tsx)**Líneas afectadas**:

- **Línea 247**: `{!isAdminRoute && !isAuthRoute && <MemoizedHeader />}`
- **Línea 263**: `{!isAdminRoute && !isAuthRoute && <MemoizedFooter />}`
- **Línea 172**: `{!isAdminRoute && !isAuthRoute && <MercadoLibreBottomNav />}`

**Solución**:

```tsx
// Cambiar de:
{!isAdminRoute && !isAuthRoute && <MemoizedHeader />}
// A:
{!isAdminRoute && !isAuthRoute && !isCheckoutRoute && <MemoizedHeader />}

// Aplicar mismo cambio para Footer y BottomNav
```

**Nota**: El `isCheckoutRoute` ya está detectado en línea 207, solo falta agregarlo a las condiciones.

### 🟡 MEDIA: Consideraciones para StickyAddToCart

**Problemas no considerados en el plan original**:

1. **Z-index y Conflictos**:

- El `MercadoLibreBottomNav` tiene `z-index` alto y está en la parte inferior
- El `StickyAddToCart` debe tener `z-index` mayor pero solo en móvil
- **Solución**: Usar `z-50` para sticky button (mayor que bottom nav que usa `z-40`)

2. **Padding Bottom**:

- Cuando el sticky button está visible, el contenido debe tener padding-bottom para evitar que tape información
- **Solución**: Agregar `pb-20` o `pb-24` al contenedor principal cuando sticky está activo

3. **Duplicación de Botón**:

- El botón "Agregar al carrito" ya existe en `AddToCartSection.tsx`
- **Solución**: El sticky debe ser una versión simplificada que solo muestre precio + botón, sin selectores de variantes

4. **Detección de Móvil**:

- El plan menciona "usar media query o hook de detección de móvil"
- **Recomendación**: Usar `useMediaQuery` hook o Tailwind `md:hidden` class
- **Archivo a crear/verificar**: `src/hooks/useMediaQuery.ts` (si no existe)

5. **Accesibilidad**:

- El sticky button debe tener `aria-label` descriptivo
- Debe ser focusable con teclado
- **Solución**: Agregar atributos ARIA apropiados

### 🟡 MEDIA: Casos Edge en Formateo de Precios

**Casos no considerados**:

1. **Precios en 0 o null**:

- La función debe manejar `null`, `undefined`, `0` correctamente
- **Verificar**: `consolidated-utils.ts` ya maneja esto, pero verificar que todos los lugares lo usen

2. **Precios muy grandes** (millones):

- Verificar que el formato funcione correctamente con números grandes
- **Ejemplo**: `$1.234.567,89` debe mostrarse correctamente

3. **Precios con decimales que terminan en 0**:

- **Decisión necesaria**: ¿Mostrar `$100,00` o `$100`?
- **Recomendación del diagnóstico**: Mostrar siempre 2 decimales o 0 si es entero, pero nunca 1 decimal
- **Solución**: Usar `minimumFractionDigits: 2, maximumFractionDigits: 2` y luego remover `.00` si se prefiere

4. **Precios en centavos vs pesos**:

- Algunos componentes usan precios en centavos (ej: `PriceDisplay` usa `amount * 100`)
- Otros usan precios directos
- **Verificar**: Consistencia en toda la aplicación

### 🟢 BAJA: Mejoras Adicionales de UX

1. **Placeholder del campo de dirección**:

- El plan menciona agregar placeholder pero no especifica dónde exactamente
- **Archivo**: `AddressMapSelectorAdvanced` (usado en línea 711 de MetaCheckoutWizard.tsx)
- **Verificar**: Si el componente acepta prop `placeholder`

2. **Testimonios en paso de resumen**:

- El plan dice "excepto quizás en el paso de resumen inicial"
- **Decisión necesaria**: ¿Mantener testimonios en resumen o eliminarlos completamente?
- **Recomendación**: Eliminar completamente para mantener el "túnel de compra" limpio

3. **Botón "Comprar ahora" sticky**:

- El plan menciona mantener sticky solo si la lista es larga
- **Implementación**: Necesita lógica para detectar altura del contenido
- **Solución**: Usar `IntersectionObserver` o calcular altura del scroll

### 🔵 TESTING: Casos de Prueba Adicionales

**Casos no cubiertos en el plan original**:

1. **Testing de formato de precios**:

- [ ] Precio `0` → `$0,00` o `$0`
- [ ] Precio `null` → Manejo de error apropiado
- [ ] Precio `13.621,3` → Debe convertirse a `$13.621,30`
- [ ] Precio `1000000` → `$1.000.000,00`
- [ ] Precio `100.50` → `$100,50`

2. **Testing de sticky button**:

- [ ] Solo aparece en móvil (`< 768px`)
- [ ] No aparece en desktop
- [ ] Z-index correcto (no tapa bottom nav)
- [ ] Padding bottom aplicado correctamente
- [ ] Funcionalidad de agregar al carrito funciona

3. **Testing de ocultación en checkout**:

- [ ] Header oculto en `/checkout`
- [ ] Footer oculto en `/checkout`
- [ ] Bottom nav oculto en `/checkout`
- [ ] Testimonios ocultos en pasos 2-5
- [ ] Elementos visibles en otras rutas

### 📋 Archivos Adicionales a Revisar

1. **[src/components/Checkout/SimplifiedCheckout.tsx](src/components/Checkout/SimplifiedCheckout.tsx)**

- Verificar si usa formato de precios inconsistente
- Verificar si muestra testimonios o elementos distractores

2. **[src/components/Checkout/CheckoutExpress.tsx](src/components/Checkout/CheckoutExpress.tsx)**

- Verificar formato de precios
- Verificar microcopy (línea 419 mencionada en grep)

3. **[src/components/Cart/SingleItem.tsx](src/components/Cart/SingleItem.tsx)**

- Verificar formato de precios en items del carrito

4. **[src/components/ShopDetails/ShopDetailModal/utils/price-utils.tsx](src/components/ShopDetails/ShopDetailModal/utils/price-utils.tsx)**

- Ya tiene función `formatPrice` (línea 124)
- Verificar si es consistente con la función centralizada

5. **[src/lib/utils/formatters.ts](src/lib/utils/formatters.ts)**

- Tiene función `formatCurrency` (línea 72)
- **Decisión necesaria**: ¿Consolidar con `consolidated-utils.ts` o mantener ambas?

### ⚠️ Decisiones Pendientes

1. **Estrategia de consolidación de funciones de formateo**:

- Hay múltiples funciones: `formatCurrency` en `consolidated-utils.ts`, `formatters.ts`, `format.ts`
- **Opción A**: Consolidar todo en `consolidated-utils.ts` y deprecar las demás
- **Opción B**: Mantener todas pero asegurar que usen la misma lógica interna
- **Recomendación**: Opción A para evitar confusión

2. **Formato de precios enteros**:

- ¿Mostrar `$100,00` o `$100`?
- **Recomendación**: `$100` (sin decimales para enteros) para mejor UX

3. **Testimonios en checkout**:

- ¿Eliminar completamente o mantener solo en paso de resumen?
- **Recomendación**: Eliminar completamente para mantener túnel limpio

4. **Sticky button en desktop**:

- ¿Mostrar sticky button también en desktop o solo móvil?
- **Recomendación**: Solo móvil (como indica el diagnóstico)

### 🔧 Mejoras Técnicas Recomendadas

1. **Crear hook `useFormatPrice`**:
   ```typescript
         // src/hooks/useFormatPrice.ts
         export function useFormatPrice() {
           return useCallback((amount: number | null | undefined) => {
             return formatCurrency(amount)
           }, [])
         }
   ```




- Facilita migración gradual
- Permite cambiar formato globalmente si es necesario

2. **Crear constante para textos de checkout**:
   ```typescript
         // src/constants/checkout-texts.ts
         export const CHECKOUT_TEXTS = {
           contact: {
             title: "Ingresá tus datos para que sepamos a quién entregarle el pedido.",
             // ...
           },
           // ...
         }
   ```




- Facilita mantenimiento y traducciones futuras

3. **Agregar tests unitarios**:

- Tests para `formatCurrency` con todos los casos edge
- Tests para componentes de checkout
- Tests de accesibilidad para sticky button

---

## Notas Técnicas

- Todos los cambios deben mantener la compatibilidad con el código existente
- Usar las utilidades de formateo centralizadas para evitar duplicación
- Considerar crear un archivo de constantes para textos de checkout para facilitar mantenimiento
- Implementar tests unitarios para funciones críticas de formateo

---

## Análisis de Huecos y Mejoras Identificadas

### 🔴 CRÍTICO: Archivos Adicionales con Formato de Precios Inconsistente

El análisis del código reveló **múltiples archivos adicionales** que usan `.toLocaleString('es-AR')` directamente sin usar la función centralizada:

#### Archivos Críticos a Actualizar:

1. **[src/components/ui/card.tsx](src/components/ui/card.tsx)**

- **Líneas 305, 325, 333**: Usa `toLocaleString('es-AR')` directamente
- **Problema**: No maneja decimales correctamente (puede mostrar `.3` en lugar de `.30`)
- **Solución**: Reemplazar con `formatCurrency()` de `consolidated-utils.ts`

2. **[src/components/ui/product-card-commercial/components/ProductCardContent.tsx](src/components/ui/product-card-commercial/components/ProductCardContent.tsx)**

- **Líneas 64, 78**: Usa `toLocaleString('es-AR')` con `minimumFractionDigits: 0`
- **Problema**: Configuración inconsistente con el resto de la app
- **Solución**: Usar función centralizada con opciones consistentes

3. **[src/components/Common/CartSidebarModal/index.tsx](src/components/Common/CartSidebarModal/index.tsx)**

- **Líneas 243, 255, 266**: Usa `toLocaleString()` sin especificar locale
- **Problema**: Puede usar formato incorrecto según configuración del navegador
- **Solución**: Especificar `'es-AR'` o mejor, usar `formatCurrency()`

4. **[src/components/Checkout/MetaCheckoutFlow/CartSummaryFooter.tsx](src/components/Checkout/MetaCheckoutFlow/CartSummaryFooter.tsx)**

- **Verificar**: Si usa formateo de precios, debe usar función centralizada

5. **[src/components/Checkout/MetaCheckoutFlow/ProductAddedScreen.tsx](src/components/Checkout/MetaCheckoutFlow/ProductAddedScreen.tsx)**

- **Verificar**: Si muestra precios, debe usar función centralizada

### 🟠 ALTA: Ocultación de Header/Footer y Bottom Nav en Checkout

**Problema Identificado**: El Header, Footer y Bottom Navigation NO están ocultos en checkout, solo en admin y auth.**Archivo**: [src/app/providers.tsx](src/app/providers.tsx)**Líneas afectadas**:

- **Línea 247**: `{!isAdminRoute && !isAuthRoute && <MemoizedHeader />}`
- **Línea 263**: `{!isAdminRoute && !isAuthRoute && <MemoizedFooter />}`
- **Línea 172**: `{!isAdminRoute && !isAuthRoute && <MercadoLibreBottomNav />}`

**Solución**:

```tsx
// Cambiar de:
{!isAdminRoute && !isAuthRoute && <MemoizedHeader />}
// A:
{!isAdminRoute && !isAuthRoute && !isCheckoutRoute && <MemoizedHeader />}

// Aplicar mismo cambio para Footer y BottomNav
```

**Nota**: El `isCheckoutRoute` ya está detectado en línea 207, solo falta agregarlo a las condiciones.

### 🟡 MEDIA: Consideraciones para StickyAddToCart

**Problemas no considerados en el plan original**:

1. **Z-index y Conflictos**:

- El `MercadoLibreBottomNav` tiene `z-index` alto y está en la parte inferior
- El `StickyAddToCart` debe tener `z-index` mayor pero solo en móvil
- **Solución**: Usar `z-50` para sticky button (mayor que bottom nav que usa `z-40`)

2. **Padding Bottom**:

- Cuando el sticky button está visible, el contenido debe tener padding-bottom para evitar que tape información
- **Solución**: Agregar `pb-20` o `pb-24` al contenedor principal cuando sticky está activo

3. **Duplicación de Botón**:

- El botón "Agregar al carrito" ya existe en `AddToCartSection.tsx`
- **Solución**: El sticky debe ser una versión simplificada que solo muestre precio + botón, sin selectores de variantes

4. **Detección de Móvil**:

- El plan menciona "usar media query o hook de detección de móvil"
- **Recomendación**: Usar `useMediaQuery` hook o Tailwind `md:hidden` class
- **Archivo a crear/verificar**: `src/hooks/useMediaQuery.ts` (si no existe)

5. **Accesibilidad**:

- El sticky button debe tener `aria-label` descriptivo
- Debe ser focusable con teclado
- **Solución**: Agregar atributos ARIA apropiados

### 🟡 MEDIA: Casos Edge en Formateo de Precios

**Casos no considerados**:

1. **Precios en 0 o null**:

- La función debe manejar `null`, `undefined`, `0` correctamente
- **Verificar**: `consolidated-utils.ts` ya maneja esto, pero verificar que todos los lugares lo usen

2. **Precios muy grandes** (millones):

- Verificar que el formato funcione correctamente con números grandes
- **Ejemplo**: `$1.234.567,89` debe mostrarse correctamente

3. **Precios con decimales que terminan en 0**:

- **Decisión necesaria**: ¿Mostrar `$100,00` o `$100`?
- **Recomendación del diagnóstico**: Mostrar siempre 2 decimales o 0 si es entero, pero nunca 1 decimal
- **Solución**: Usar `minimumFractionDigits: 2, maximumFractionDigits: 2` y luego remover `.00` si se prefiere

4. **Precios en centavos vs pesos**:

- Algunos componentes usan precios en centavos (ej: `PriceDisplay` usa `amount * 100`)
- Otros usan precios directos
- **Verificar**: Consistencia en toda la aplicación

### 🟢 BAJA: Mejoras Adicionales de UX

1. **Placeholder del campo de dirección**:

- El plan menciona agregar placeholder pero no especifica dónde exactamente
- **Archivo**: `AddressMapSelectorAdvanced` (usado en línea 711 de MetaCheckoutWizard.tsx)
- **Verificar**: Si el componente acepta prop `placeholder`

2. **Testimonios en paso de resumen**:

- El plan dice "excepto quizás en el paso de resumen inicial"
- **Decisión necesaria**: ¿Mantener testimonios en resumen o eliminarlos completamente?
- **Recomendación**: Eliminar completamente para mantener el "túnel de compra" limpio

3. **Botón "Comprar ahora" sticky**:

- El plan menciona mantener sticky solo si la lista es larga
- **Implementación**: Necesita lógica para detectar altura del contenido
- **Solución**: Usar `IntersectionObserver` o calcular altura del scroll

### 🔵 TESTING: Casos de Prueba Adicionales

**Casos no cubiertos en el plan original**:

1. **Testing de formato de precios**:

- [ ] Precio `0` → `$0,00` o `$0`
- [ ] Precio `null` → Manejo de error apropiado
- [ ] Precio `13.621,3` → Debe convertirse a `$13.621,30`
- [ ] Precio `1000000` → `$1.000.000,00`
- [ ] Precio `100.50` → `$100,50`

2. **Testing de sticky button**:

- [ ] Solo aparece en móvil (`< 768px`)
- [ ] No aparece en desktop
- [ ] Z-index correcto (no tapa bottom nav)
- [ ] Padding bottom aplicado correctamente
- [ ] Funcionalidad de agregar al carrito funciona

3. **Testing de ocultación en checkout**:

- [ ] Header oculto en `/checkout`
- [ ] Footer oculto en `/checkout`
- [ ] Bottom nav oculto en `/checkout`
- [ ] Testimonios ocultos en pasos 2-5
- [ ] Elementos visibles en otras rutas

### 📋 Archivos Adicionales a Revisar

1. **[src/components/Checkout/SimplifiedCheckout.tsx](src/components/Checkout/SimplifiedCheckout.tsx)**

- Verificar si usa formato de precios inconsistente
- Verificar si muestra testimonios o elementos distractores

2. **[src/components/Checkout/CheckoutExpress.tsx](src/components/Checkout/CheckoutExpress.tsx)**

- Verificar formato de precios
- Verificar microcopy (línea 419 mencionada en grep)

3. **[src/components/Cart/SingleItem.tsx](src/components/Cart/SingleItem.tsx)**

- Verificar formato de precios en items del carrito

4. **[src/components/ShopDetails/ShopDetailModal/utils/price-utils.tsx](src/components/ShopDetails/ShopDetailModal/utils/price-utils.tsx)**

- Ya tiene función `formatPrice` (línea 124)
- Verificar si es consistente con la función centralizada

5. **[src/lib/utils/formatters.ts](src/lib/utils/formatters.ts)**

- Tiene función `formatCurrency` (línea 72)
- **Decisión necesaria**: ¿Consolidar con `consolidated-utils.ts` o mantener ambas?

### ⚠️ Decisiones Pendientes

1. **Estrategia de consolidación de funciones de formateo**:

- Hay múltiples funciones: `formatCurrency` en `consolidated-utils.ts`, `formatters.ts`, `format.ts`
- **Opción A**: Consolidar todo en `consolidated-utils.ts` y deprecar las demás
- **Opción B**: Mantener todas pero asegurar que usen la misma lógica interna
- **Recomendación**: Opción A para evitar confusión

2. **Formato de precios enteros**:

- ¿Mostrar `$100,00` o `$100`?
- **Recomendación**: `$100` (sin decimales para enteros) para mejor UX

3. **Testimonios en checkout**:

- ¿Eliminar completamente o mantener solo en paso de resumen?
- **Recomendación**: Eliminar completamente para mantener túnel limpio

4. **Sticky button en desktop**:

- ¿Mostrar sticky button también en desktop o solo móvil?
- **Recomendación**: Solo móvil (como indica el diagnóstico)

### 🔧 Mejoras Técnicas Recomendadas

1. **Crear hook `useFormatPrice`**:
   ```typescript
         // src/hooks/useFormatPrice.ts
         export function useFormatPrice() {
           return useCallback((amount: number | null | undefined) => {
             return formatCurrency(amount)
           }, [])
         }
   ```




- Facilita migración gradual
- Permite cambiar formato globalmente si es necesario

2. **Crear constante para textos de checkout**:
   ```typescript
         // src/constants/checkout-texts.ts
         export const CHECKOUT_TEXTS = {
           contact: {
             title: "Ingresá tus datos para que sepamos a quién entregarle el pedido.",
             // ...
           },
           // ...
         }
   ```




- Facilita mantenimiento y traducciones futuras

3. **Agregar tests unitarios**:

- Tests para `formatCurrency` con todos los casos edge