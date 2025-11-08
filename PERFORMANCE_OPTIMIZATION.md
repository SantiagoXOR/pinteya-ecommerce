# Guía de Optimización de Performance

Este documento detalla las optimizaciones implementadas y cómo usar las herramientas de monitoreo.

## 📊 Herramientas de Monitoreo

### 1. Vercel Speed Insights

Speed Insights ya está instalado y configurado en la aplicación (`@vercel/speed-insights`).

#### Habilitar en Vercel Dashboard:

1. Ve a [vercel.com](https://vercel.com) y accede a tu proyecto
2. Navega a **Settings** → **Speed Insights**
3. Haz clic en **Enable Speed Insights**
4. Después del próximo deploy, comenzarás a ver métricas en la pestaña **Speed Insights**

#### Métricas que verás:

- **LCP (Largest Contentful Paint)**: Tiempo hasta que el contenido principal es visible
  - Meta: < 2.5s (bueno), < 4s (necesita mejora)
- **FID (First Input Delay)**: Tiempo de respuesta a primera interacción
  - Meta: < 100ms (bueno), < 300ms (necesita mejora)
- **CLS (Cumulative Layout Shift)**: Estabilidad visual
  - Meta: < 0.1 (bueno), < 0.25 (necesita mejora)
- **FCP (First Contentful Paint)**: Primer elemento visible
  - Meta: < 1.8s (bueno), < 3s (necesita mejora)
- **TTFB (Time to First Byte)**: Tiempo de respuesta del servidor
  - Meta: < 800ms (bueno), < 1.8s (necesita mejora)

### 2. Bundle Analyzer

Analiza el tamaño de tus bundles de JavaScript para identificar oportunidades de optimización.

#### Comandos disponibles:

```bash
# Analizar todo (client + server)
npm run analyze

# Solo analizar bundle del servidor
npm run analyze:server

# Solo analizar bundle del cliente
npm run analyze:browser
```

Esto generará reportes visuales en tu navegador mostrando:
- Tamaño de cada paquete
- Dependencias más pesadas
- Oportunidades de code splitting

## ✅ Optimizaciones Implementadas

### 1. Configuración de Next.js

#### SWC Minification
- Activado `swcMinify: true` para minificación más rápida y eficiente

#### Modular Imports
- Configurado para `lucide-react` y `@radix-ui/react-icons`
- Reduce el bundle importando solo los íconos necesarios

#### Package Optimization
- `optimizePackageImports` configurado para bibliotecas pesadas:
  - lucide-react
  - Todos los componentes de @radix-ui
  - recharts
  - framer-motion

### 2. Lazy Loading de Componentes

Los siguientes componentes ahora se cargan dinámicamente:

#### Componentes Pesados:
- `WhatsAppPopup`: Carga solo cuando es necesario
- `CartSidebarModal`: Lazy loading con loading fallback
- `PreviewSliderModal`: Lazy loading
- `FloatingCartButton`: Carga después de la carga inicial
- `FloatingWhatsAppButton`: Lazy loading

### 3. Optimización de Fuentes

#### Euclid Circular A:
- ✅ `font-display: swap` ya configurado
- Preload de fuentes críticas (Regular y Bold)
- 10 variantes optimizadas con formato woff2

### 4. Optimización de Imágenes

#### Next.js Image Configuration:
- Formatos modernos: WebP y AVIF habilitados
- Cache TTL: 60 segundos
- Responsive images con `sizes` apropiados

#### Imágenes a optimizar:
- `/public/images/hero/` - Imágenes de banner principal
- `/public/images/products/` - Imágenes de productos
- `/public/images/categories/` - Categorías
- `/public/images/logo/` - Logos de marca

### 5. Third-Party Scripts

#### Google Analytics:
- Estrategia `afterInteractive` para no bloquear carga inicial
- Carga condicional solo en producción

#### Vercel Analytics:
- Carga solo en producción
- No impacta performance en desarrollo

## 🎯 Próximos Pasos

### Prioridad Alta:
1. ✅ Habilitar Speed Insights en Vercel Dashboard
2. ✅ Ejecutar `npm run analyze` para ver bundles actuales
3. 🔄 Implementar lazy loading de componentes pesados
4. 🔄 Optimizar imágenes en `/public/images/`

### Prioridad Media:
5. 🔄 Revisar y optimizar providers en `src/app/providers.tsx`
6. 🔄 Implementar ISR en páginas de productos
7. 🔄 Configurar caché de API routes

### Prioridad Baja:
8. Evaluar alternativas más ligeras para librerías pesadas
9. Implementar critical CSS extraction
10. Optimizar Redux selectors con reselect

## 📈 Cómo Medir el Éxito

### Antes de las optimizaciones:
1. Ejecutar `npm run analyze` y documentar tamaños
2. Tomar screenshots de métricas en Vercel Speed Insights
3. Medir tiempo de carga con DevTools Network tab

### Después de cada optimización:
1. Re-ejecutar análisis de bundles
2. Comparar métricas en Speed Insights
3. Verificar mejoras en Core Web Vitals

### Objetivos:
- **Bundle Size**: Reducción del 30-40%
- **LCP**: < 2.5s
- **FID**: < 100ms
- **CLS**: < 0.1
- **FCP**: < 1.8s
- **TTI**: < 3.5s

## 🛠️ Herramientas Adicionales

### Lighthouse (Chrome DevTools):
```bash
# Abrir DevTools → Lighthouse → Generar reporte
# Usar modo "Navegación" para página completa
# Probar en modo incógnito para evitar extensiones
```

### WebPageTest:
- [webpagetest.org](https://www.webpagetest.org)
- Probar desde diferentes ubicaciones y dispositivos
- Obtener métricas detalladas de carga

### Google PageSpeed Insights:
- [pagespeed.web.dev](https://pagespeed.web.dev)
- Analiza tanto mobile como desktop
- Proporciona recomendaciones específicas

## 📝 Notas

- Todas las optimizaciones son incrementales
- Medir siempre antes y después de cada cambio
- Priorizar optimizaciones con mayor impacto
- No sacrificar UX por performance
- Considerar el impacto en SEO

## 🔗 Referencias

- [Next.js Performance](https://nextjs.org/docs/app/building-your-application/optimizing)
- [Vercel Speed Insights](https://vercel.com/docs/speed-insights)
- [Web Vitals](https://web.dev/vitals/)
- [Bundle Analyzer](https://github.com/vercel/next.js/tree/canary/packages/next-bundle-analyzer)

















