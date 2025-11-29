# Implementación de Analytics - Google Analytics 4, Meta Pixel y Google Ads

## 📊 Resumen

Se ha implementado tracking completo de e-commerce con **Google Analytics 4**, **Meta Pixel** (Facebook/Instagram Ads) y **Google Ads Conversion Tracking** en el proyecto Pinteya E-commerce.

---

## 🔧 Configuración

### Variables de Entorno

Agrega estas variables a tu archivo `.env.local`:

```bash
# Google Analytics 4
NEXT_PUBLIC_GA_ID=G-MN070Y406E

# Meta Pixel (Facebook/Instagram Ads)
NEXT_PUBLIC_META_PIXEL_ID=843104698266278

# Google Ads Conversion Tracking (Opcional pero recomendado)
# Obtén estos valores desde: https://ads.google.com/ → Herramientas y configuración → Conversiones
NEXT_PUBLIC_GOOGLE_ADS_CONVERSION_ID=AW-XXXXXXXXX
NEXT_PUBLIC_GOOGLE_ADS_CONVERSION_LABEL=XXXXXXXXX
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

3. **`src/components/Analytics/GoogleAds.tsx`**
   - Componente React para inicializar Google Ads Conversion Tracking
   - Usa el mismo gtag de Google Analytics (no requiere script adicional)
   - Se carga de forma lazy para no afectar el rendimiento

4. **`src/lib/google-ads.ts`**
   - Librería de funciones para tracking de conversiones de Google Ads
   - Similar a `google-analytics.ts` pero específico para Google Ads
   - Incluye funciones para purchase, begin_checkout, add_to_cart

5. **`src/app/layout.tsx`** (modificado)
   - Integra los tres componentes de analytics (GA4, Meta Pixel, Google Ads)
   - Agrega preconnect a Google Ads y Facebook para mejor rendimiento

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

// Google Ads
trackGoogleAdsBeginCheckout(totalPrice, 'ARS', items)
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

// Google Ads
trackGoogleAdsPurchase(transactionId, totalValue, 'ARS', items)
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

#### Google Ads
1. Abre Chrome DevTools (F12)
2. Ve a la pestaña "Network"
3. Filtra por "googleadservices.com" o "google-analytics.com"
4. Realiza acciones de conversión (checkout, purchase)
5. Deberías ver requests de conversión

**Consola del navegador:**
```javascript
// Ver eventos en la consola
dataLayer // Muestra todos los eventos enviados, incluyendo conversiones de Google Ads
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

### 4. Verificar en Google Ads

1. Ve a [Google Ads](https://ads.google.com/)
2. Ve a **Herramientas y configuración** → **Conversiones**
3. Verifica que las conversiones se estén registrando
4. Puede tardar hasta 24-48 horas en aparecer las primeras conversiones

**Nota:** Google Ads puede importar conversiones desde GA4 automáticamente, o usar el tag de conversión directo (si está configurado).

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
[Google Ads] Conversion tracked: {conversionLabel: "...", value: 5000, ...}
```

---

## 🚀 Producción

### Antes de Deployar:

1. **Verifica las variables de entorno** en Vercel/tu hosting:
   ```bash
   NEXT_PUBLIC_GA_ID=G-MN070Y406E
   NEXT_PUBLIC_META_PIXEL_ID=843104698266278
   NEXT_PUBLIC_GOOGLE_ADS_CONVERSION_ID=AW-XXXXXXXXX
   NEXT_PUBLIC_GOOGLE_ADS_CONVERSION_LABEL=XXXXXXXXX
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

### Google Ads Conversion Tracking

#### Configuración
Google Ads puede trackear conversiones de dos formas:

1. **Importación desde GA4 (Recomendado para empezar)**
   - Google Ads importa automáticamente las conversiones desde GA4
   - No requiere configuración adicional en el código
   - Ve a Google Ads → Conversiones → Importar → Google Analytics 4

2. **Tag de Conversión Directo (Opcional pero recomendado)**
   - Proporciona atribución más precisa para Google Ads específicamente
   - Requiere configurar `NEXT_PUBLIC_GOOGLE_ADS_CONVERSION_ID` y `NEXT_PUBLIC_GOOGLE_ADS_CONVERSION_LABEL`
   - Ya está implementado en el código

#### Funciones Disponibles

```typescript
import {
  trackGoogleAdsPurchase,
  trackGoogleAdsBeginCheckout,
  trackGoogleAdsAddToCart,
  trackGoogleAdsConversion,
} from '@/lib/google-ads'

// Trackear compra
trackGoogleAdsPurchase(transactionId, value, 'ARS', items)

// Trackear inicio de checkout
trackGoogleAdsBeginCheckout(value, 'ARS', items)

// Trackear agregar al carrito
trackGoogleAdsAddToCart(value, 'ARS', items)

// Trackear conversión personalizada
trackGoogleAdsConversion(conversionLabel, value, 'ARS', transactionId)
```

#### Vinculación con Google Analytics
Para vincular Google Ads con GA4:

1. En Google Ads: **Herramientas y configuración** → **Configuración** → **Configuración de la cuenta**
2. Busca **"Google Analytics"** → Haz clic en **"Vincular"**
3. Selecciona tu propiedad de GA4 (G-MN070Y406E)
4. Activa **"Importar datos de conversión de Google Analytics"**

Para más detalles, consulta: [Guía Completa de Google Ads](GOOGLE_ADS_SETUP_GUIDE.md)

---

## 🔄 Cómo Trabajan los Tres Sistemas Juntos

### Arquitectura de Tracking

```
Usuario realiza acción (ej: compra)
    ↓
┌─────────────────────────────────────────┐
│  Evento disparado en el sitio           │
│  (ej: checkout/success/page.tsx)        │
└─────────────────────────────────────────┘
    ↓
    ├─→ Google Analytics 4 (GA4)
    │   • Tracking completo de comportamiento
    │   • Análisis de funnels
    │   • Audiencias para remarketing
    │
    ├─→ Meta Pixel (Facebook/Instagram)
    │   • Tracking para campañas de Meta
    │   • Optimización de audiencias
    │   • Remarketing en Facebook/Instagram
    │
    └─→ Google Ads Conversion Tracking
        • Atribución precisa para Google Ads
        • Optimización de ofertas
        • Importación desde GA4 (alternativa)
```

### Ventajas de Cada Sistema

**Google Analytics 4:**
- Análisis completo del comportamiento del usuario
- Creación de audiencias para remarketing
- Funnels de conversión detallados
- Integración con Google Ads (importación de conversiones)

**Meta Pixel:**
- Optimización de campañas de Facebook/Instagram
- Audiencias personalizadas para Meta
- Tracking de eventos estándar de e-commerce
- Lookalike audiences

**Google Ads Conversion Tracking:**
- Atribución más precisa para Google Ads
- Optimización automática de ofertas
- Mejor medición de ROI de campañas
- Puede funcionar junto con importación desde GA4

### Recomendación

- **Usa los tres sistemas** para máxima cobertura y precisión
- **GA4** es la base para análisis y creación de audiencias
- **Meta Pixel** es esencial si haces publicidad en Facebook/Instagram
- **Google Ads Conversion Tracking** mejora la atribución específica para Google Ads

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
- [Google Ads Conversion Tracking - Documentación](https://support.google.com/google-ads/answer/1722054)
- [Eventos de E-commerce GA4](https://developers.google.com/analytics/devguides/collection/ga4/ecommerce)
- [Meta Pixel - Eventos Estándar](https://developers.facebook.com/docs/meta-pixel/reference)
- [Guía Completa de Google Ads para Pinteya](GOOGLE_ADS_SETUP_GUIDE.md)
- [Guía Rápida de Google Ads](GOOGLE_ADS_QUICK_START.md)

---

## ✅ Checklist de Implementación

- [x] Variables de entorno configuradas
- [x] Variables de entorno configuradas (GA4, Meta Pixel, Google Ads)
- [x] Google Analytics script cargado
- [x] Meta Pixel script cargado
- [x] Google Ads Conversion Tracking configurado
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
- [ ] Testing en Google Ads verificado
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

### Las conversiones no aparecen en Google Ads
1. Verifica que `NEXT_PUBLIC_GOOGLE_ADS_CONVERSION_ID` y `NEXT_PUBLIC_GOOGLE_ADS_CONVERSION_LABEL` estén configurados
2. Verifica que Google Ads esté vinculado con GA4 (importación de conversiones)
3. Espera 24-48 horas para que aparezcan las primeras conversiones
4. Revisa la consola del navegador por errores de tracking
5. Verifica que los eventos se estén trackeando correctamente en GA4

---

## 📧 Soporte

Para preguntas o problemas con la implementación, contacta al equipo de desarrollo.

**Fecha de implementación:** Noviembre 2025
**Versión:** 1.0.0


