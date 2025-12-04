# Versiones del Home - Pinteya E-commerce

## Estructura de Rutas

### 🏠 Home Principal (Producción)
**Ruta:** `/` (`src/app/(site)/page.tsx`)

**Componente:** `@/components/Home-v2`

**Descripción:** 
- Versión optimizada del home con mejoras en UX/UI y performance
- Incluye WhatsApp Popup para captura de leads (aparece a los 5 segundos)
- Secciones reordenadas para mejorar engagement y reducir bounce rate
- **SEO:** Indexable (sin robots noindex)

**Características principales:**
- ✅ BenefitsBar (no sticky)
- ✅ Banners promocionales horizontales (CYBERMONDAY, Envío Gratis, Líderes en Córdoba)
- ✅ Hero Section optimizado con carousel
- ✅ Categorías con búsqueda
- ✅ Sección "Envío Gratis" con productos >$50.000
- ✅ Productos Destacados
- ✅ Ofertas Especiales
- ✅ Nuevos Productos
- ✅ Búsquedas Populares
- ✅ Trust Section
- ✅ Testimonials
- ✅ Newsletter
- ✅ WhatsApp Popup (timer 5 segundos)
- ✅ Floating Cart
- ✅ Floating WhatsApp
- ✅ Exit Intent Modal

---

### 🧪 Home V2 (Test/Backup)
**Ruta:** `/home-v2` (`src/app/(site)/home-v2/page.tsx`)

**Componente:** `@/components/Home-v2`

**Descripción:** 
- Versión de prueba/backup del home optimizado
- Mismo contenido que el home principal
- **SEO:** No indexable (robots: noindex, nofollow)

**Uso:** Testing y comparación A/B

---

### 📦 Home V0 (Versión Anterior)
**Ruta:** `/home-v0` (`src/app/(site)/home-v0/page.tsx`)

**Componente:** `@/components/Home`

**Descripción:** 
- Versión original del home antes de la optimización
- Mantenida como respaldo y referencia
- **SEO:** No indexable (robots: noindex, nofollow)

**Uso:** Fallback en caso de necesitar revertir cambios

---

## Historial de Cambios

### 2025-10-28
- ✅ `home-v2` promovido a home principal (`/`)
- ✅ Home original movido a `/home-v0`
- ✅ WhatsApp Popup implementado con timer de 5 segundos
- ✅ Metadata actualizado para SEO en producción

---

## Testing

### Resetear LocalStorage (WhatsApp Popup)
Para ver el popup nuevamente durante testing:

```javascript
// Ejecutar en consola del navegador:
localStorage.removeItem('whatsappPopupShown')
```

### Comparación de Versiones
- **Home Actual (Optimizado):** `http://localhost:3000/`
- **Home V2 (Backup):** `http://localhost:3000/home-v2`
- **Home V0 (Original):** `http://localhost:3000/home-v0`

---

## Componentes Principales

### Home Optimizado (`@/components/Home-v2`)
- Lazy loading de todos los componentes pesados
- Animaciones CSS optimizadas
- Tracking de scroll depth con GA4
- Estructura modular con imports dinámicos

### Home Original (`@/components/Home`)
- Implementación original sin optimizaciones
- Usado como referencia

---

## Notas de Producción

⚠️ **Importante:**
- Solo el home principal (`/`) debe estar indexado por Google
- Las versiones de test (`/home-v2`, `/home-v0`) tienen `robots: noindex, nofollow`
- El WhatsApp Popup solo aparece una vez por visita (localStorage)
- Timer del popup configurado a 5 segundos para producción

---

## Métricas a Monitorear

1. **Bounce Rate** - Objetivo: Reducir de 91% a <60%
2. **Time on Page** - Objetivo: Aumentar engagement
3. **Scroll Depth** - Tracking: 25%, 50%, 75%, 100%
4. **WhatsApp Popup Conversion** - Clicks en botón "Enviar por WhatsApp"
5. **CTA Clicks** - Todos los CTAs trackeados con GA4

---

## Mantenimiento

Para revertir a la versión anterior:
1. Copiar contenido de `/home-v0/page.tsx` a `/page.tsx`
2. Actualizar imports a `@/components/Home`
3. Remover import de `@/styles/home-v2-animations.css`
4. Actualizar metadata según necesidad

