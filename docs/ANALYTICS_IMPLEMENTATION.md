# Implementación de Analytics - Google Analytics 4 y Meta Pixel

## 📊 Resumen

Se ha implementado tracking completo de e-commerce con **Google Analytics 4** y **Meta Pixel** (Facebook/Instagram Ads) en el proyecto Pinteya E-commerce.

---

## 🔧 Configuración

### Variables de Entorno

Agrega estas variables a tu archivo `.env.local`:

```bash
# Google Analytics 4
NEXT_PUBLIC_GA_ID=G-MN070Y406E

# Meta Pixel (Facebook/Instagram Ads)
NEXT_PUBLIC_META_PIXEL_ID=843104698266278
```

### Archivos Creados

1. **`src/lib/meta-pixel.ts`**
   - Librería de funciones para tracking con Meta Pixel
   - Similar a `google-analytics.ts` pero para Meta Pixel
   - Incluye todos los eventos estándar de e-commerce

2. **`src/components/Analytics/MetaPixel.tsx`**
   - Componente React para cargar el script de Meta Pixel
   - Similar a `GoogleAnalytics.tsx`
   - Se carga de forma lazy para no afectar el rendimiento

3. **`src/app/layout.tsx`** (modificado)
   - Integra ambos componentes de analytics
   - Agrega preconnect a Facebook para mejor rendimiento

---

## 📈 Eventos Implementados

### 1. PageView (Automático)
**Dispara cuando:** El usuario navega a cualquier página

**Ubicación:** 
- `src/components/Analytics/GoogleAnalytics.tsx`
- `src/components/Analytics/MetaPixel.tsx`

**Qué trackea:**
- URL de la página
- Título de la página

---

### 2. ViewContent (Vista de Producto)
**Dispara cuando:** El usuario ve la página de detalle de un producto

**Ubicación:** `src/app/(site)/(pages)/products/[id]/page.tsx`

**Qué trackea:**
- ID del producto
- Nombre del producto
- Categoría
- Precio
- Moneda (ARS)

**Código:**
```typescript
// Google Analytics
trackProductView(
  String(productId),
  productName,
  category,
  price,
  'ARS'
)

// Meta Pixel
trackViewContent(
  productName,
  category,
  [String(productId)],
  price,
  'ARS'
)
```

---

### 3. AddToCart (Agregar al Carrito)
**Dispara cuando:** El usuario agrega un producto al carrito

**Ubicaciones:**
- `src/components/ui/product-card-commercial.tsx` (tarjetas de producto)
- `src/components/ShopDetails/ShopDetailModal.tsx` (modal de detalles)

**Qué trackea:**
- ID del producto
- Nombre del producto
- Categoría
- Precio
- Cantidad
- Moneda (ARS)

**Código:**
```typescript
// Google Analytics
trackGA4AddToCart(
  String(productId),
  productName,
  category,
  price,
  quantity,
  'ARS'
)

// Meta Pixel
trackMetaAddToCart(
  productName,
  String(productId),
  category,
  price * quantity,
  'ARS'
)
```

---

### 4. InitiateCheckout (Iniciar Checkout)
**Dispara cuando:** El usuario llega a la página de checkout

**Ubicación:** `src/components/Checkout/index.tsx`

**Qué trackea:**
- Lista de productos en el carrito
- Valor total del carrito
- Número de items
- Moneda (ARS)

**Código:**
```typescript
// Google Analytics
trackBeginCheckout(items, totalPrice, 'ARS')

// Meta Pixel
trackInitiateCheckout(metaContents, totalPrice, 'ARS', cartItems.length)
```

---

### 5. Purchase (Compra Completada)
**Dispara cuando:** El usuario completa el pago exitosamente

**Ubicaciones:**
- `src/app/(site)/(pages)/checkout/success/page.tsx` (página de éxito)
- `src/hooks/useCheckout.ts` (guarda datos para tracking)

**Qué trackea:**
- ID de transacción
- Lista de productos comprados
- Valor total
- Costos de envío
- Moneda (ARS)

**Código:**
```typescript
// Google Analytics
trackGA4Purchase(
  transactionId,
  items,
  totalValue,
  'ARS',
  shippingCost,
  0 // tax
)

// Meta Pixel
trackMetaPurchase(
  totalValue,
  'ARS',
  contents,
  items.length,
  transactionId
)
```

---

## 🧪 Testing

### 1. Verificar en Desarrollo

#### Google Analytics 4
1. Abre Chrome DevTools (F12)
2. Ve a la pestaña "Network"
3. Filtra por "google-analytics.com" o "gtag"
4. Realiza las acciones (ver producto, agregar al carrito, etc.)
5. Deberías ver requests a GA4

**Consola del navegador:**
```javascript
// Ver eventos en la consola
dataLayer // Muestra todos los eventos enviados
```

#### Meta Pixel
1. Instala la extensión [Meta Pixel Helper](https://chrome.google.com/webstore/detail/meta-pixel-helper/)
2. Ve a tu sitio web
3. El helper mostrará los eventos que se disparan
4. Los eventos deberían aparecer en verde ✅

**Consola del navegador:**
```javascript
// Ver eventos en la consola
fbq('track', 'PageView') // Disparar manualmente
```

---

### 2. Verificar en Google Analytics

1. Ve a [Google Analytics](https://analytics.google.com/)
2. Selecciona tu propiedad "Pinteya E-commerce"
3. Ve a **Informes** → **Tiempo real** → **Eventos**
4. Realiza acciones en tu sitio:
   - Navega a la home → `page_view`
   - Ve un producto → `view_item`
   - Agrega al carrito → `add_to_cart`
   - Ve al checkout → `begin_checkout`
   - Completa una compra (modo test) → `purchase`

**Los eventos deberían aparecer en 30-60 segundos.**

---

### 3. Verificar en Meta Events Manager

1. Ve a [Meta Events Manager](https://business.facebook.com/events_manager)
2. Selecciona tu pixel "Pinteya E-commerce" (ID: 843104698266278)
3. Ve a **Probar eventos**
4. Ingresa la URL de tu sitio
5. Realiza las mismas acciones que en GA4

**Eventos esperados:**
- `PageView` ✅
- `ViewContent` ✅
- `AddToCart` ✅
- `InitiateCheckout` ✅
- `Purchase` ✅

---

## 🎯 Flujo Completo de Testing

### Test E2E Recomendado:

1. **Homepage**
   ```
   ✅ PageView se dispara automáticamente
   ```

2. **Producto**
   ```
   Navega a: /products/[id]
   ✅ ViewContent se dispara con detalles del producto
   ```

3. **Agregar al Carrito**
   ```
   Click en "Agregar al carrito"
   ✅ AddToCart se dispara con producto y precio
   ```

4. **Checkout**
   ```
   Navega a: /checkout
   ✅ InitiateCheckout se dispara con items del carrito
   ```

5. **Pago y Confirmación**
   ```
   Completa el pago (modo test)
   Llega a: /checkout/success
   ✅ Purchase se dispara con detalles de la compra
   ```

---

## 📝 Logs en Consola

Todos los eventos de analytics escriben logs en la consola en modo desarrollo:

```javascript
[Analytics] Product view tracked: {id: 123, name: "Pintura", ...}
[Analytics] Add to cart tracked: {id: 123, quantity: 1, ...}
[Analytics] Initiate checkout tracked: {items: 2, totalValue: 5000}
[Analytics] Purchase tracked: {transactionId: "abc123", ...}
```

---

## 🚀 Producción

### Antes de Deployar:

1. **Verifica las variables de entorno** en Vercel/tu hosting:
   ```bash
   NEXT_PUBLIC_GA_ID=G-MN070Y406E
   NEXT_PUBLIC_META_PIXEL_ID=843104698266278
   ```

2. **Redeploya** para que las variables tomen efecto

3. **Verifica en producción** usando las herramientas de testing

---

## ⚙️ Configuración Avanzada

### Google Analytics 4

#### Eventos Personalizados
Puedes agregar eventos personalizados en `src/lib/google-analytics.ts`:

```typescript
export const trackCustomEvent = (eventName: string, params: Record<string, any>) => {
  trackEvent(eventName, 'custom', undefined, undefined, params)
}
```

#### Conversiones
Los eventos `purchase` ya están configurados como conversión en GA4. Para agregar más conversiones:

1. Ve a GA4 → **Administración** → **Eventos**
2. Encuentra el evento (ej: `add_to_cart`)
3. Click en **Marcar como conversión**

---

### Meta Pixel

#### Conversiones API (Server-Side)
Para tracking más preciso y evitar ad-blockers, considera implementar [Conversions API](https://developers.facebook.com/docs/marketing-api/conversions-api):

```typescript
// Ejemplo (requiere implementación backend)
fetch('/api/meta-conversions', {
  method: 'POST',
  body: JSON.stringify({
    event: 'Purchase',
    value: 5000,
    currency: 'ARS',
    // ... más datos
  })
})
```

#### Matching Avanzado
Para mejorar la atribución, puedes enviar datos del usuario (hasheados):

```typescript
import { setUserData } from '@/lib/meta-pixel'

// Solo con consentimiento del usuario
setUserData({
  em: hashEmail(email), // SHA256 del email
  ph: hashPhone(phone), // SHA256 del teléfono
  // ... más datos
})
```

---

## 🔒 Privacidad y GDPR

### Consentimiento de Cookies

Considera implementar un banner de consentimiento antes de cargar los scripts:

```typescript
// Ejemplo con consentimiento
if (userConsent.analytics) {
  trackPageView()
}

if (userConsent.advertising) {
  trackMetaPixel()
}
```

### Revocar Consentimiento

```typescript
import { revokeConsent, grantConsent } from '@/lib/meta-pixel'

// Usuario revoca consentimiento
revokeConsent()

// Usuario otorga consentimiento
grantConsent()
```

---

## 📚 Referencias

- [Google Analytics 4 - Documentación](https://developers.google.com/analytics/devguides/collection/ga4)
- [Meta Pixel - Documentación](https://developers.facebook.com/docs/meta-pixel)
- [Eventos de E-commerce GA4](https://developers.google.com/analytics/devguides/collection/ga4/ecommerce)
- [Meta Pixel - Eventos Estándar](https://developers.facebook.com/docs/meta-pixel/reference)

---

## ✅ Checklist de Implementación

- [x] Variables de entorno configuradas
- [x] Google Analytics script cargado
- [x] Meta Pixel script cargado
- [x] PageView tracking (automático)
- [x] ViewContent tracking (página de producto)
- [x] AddToCart tracking (cards + modal)
- [x] InitiateCheckout tracking (página checkout)
- [x] Purchase tracking (página de éxito)
- [x] SessionStorage para datos de compra
- [x] Logs en consola para debugging
- [ ] Testing en desarrollo completado
- [ ] Testing en Google Analytics verificado
- [ ] Testing en Meta Events Manager verificado
- [ ] Variables en producción configuradas
- [ ] Testing en producción completado

---

## 🐛 Troubleshooting

### Los eventos no aparecen en GA4
1. Verifica que `NEXT_PUBLIC_GA_ID` esté configurado
2. Revisa la consola del navegador por errores
3. Verifica que no haya ad-blockers activos
4. Espera hasta 24 horas para datos históricos (real-time funciona inmediatamente)

### Los eventos no aparecen en Meta Pixel
1. Verifica que `NEXT_PUBLIC_META_PIXEL_ID` esté configurado
2. Usa Meta Pixel Helper para debugging
3. Revisa la consola del navegador por errores
4. Verifica que no haya ad-blockers bloqueando Facebook

### Purchase no se trackea
1. Verifica que los datos estén en sessionStorage: `sessionStorage.getItem('checkout-data')`
2. Revisa que el status sea 'approved' en la URL
3. Verifica los logs en consola de la página de éxito

---

## 📧 Soporte

Para preguntas o problemas con la implementación, contacta al equipo de desarrollo.

**Fecha de implementación:** Noviembre 2025
**Versión:** 1.0.0


