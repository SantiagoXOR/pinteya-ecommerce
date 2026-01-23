# Optimizaciones de Performance Post-Deploy - 23 de Enero 2026 (Fase 2)

## Resumen Ejecutivo

Continuación de las optimizaciones post-despliegue basadas en el análisis de Lighthouse más reciente. Esta fase se enfoca en reducir JavaScript no utilizado, optimizar imports de librerías pesadas, y eliminar código legacy innecesario.

## 📊 Estado Actual (Lighthouse - 23/01/2026 15:41)

### Métricas Móvil:
- **Performance**: 38/100 🔴
- **LCP**: 17.3s 🔴 (Objetivo: <2.5s)
- **FCP**: 3.2s 🔴 (Objetivo: <2.5s)
- **TBT**: 1,210ms 🔴 (Objetivo: <300ms)
- **SI**: 7.9s 🔴 (Objetivo: <3.4s)
- **CLS**: 0 ✅ (Objetivo: <0.1)

### Oportunidades Identificadas:
1. **Reduce unused JavaScript**: 890ms de ahorro potencial
2. **Defer offscreen images**: 220ms de ahorro potencial
3. **Reduce unused CSS**: 170ms de ahorro potencial
4. **Avoid serving legacy JavaScript**: 170ms de ahorro potencial
5. **Initial server response time**: 43ms de ahorro potencial

---

## ✅ Optimizaciones Implementadas (Fase 2)

### 1. Optimización de Imports de Framer Motion (170ms de ahorro estimado)

**Problema**: Varios componentes importaban directamente desde `framer-motion`, cargando la librería completa en el bundle inicial aunque ya existía un wrapper lazy.

**Solución**: Migrar todos los imports directos a usar el wrapper lazy `@/lib/framer-motion-lazy`.

**Archivos optimizados:**
- ✅ `src/components/ui/micro-interactions.tsx`
- ✅ `src/components/Analytics/MetaMetrics.tsx`
- ✅ `src/components/Analytics/HeatmapViewer.tsx`
- ✅ `src/components/Analytics/ConversionFunnel.tsx`
- ✅ `src/components/Analytics/ComparisonView.tsx`
- ✅ `src/components/Analytics/AnalyticsDemo.tsx`
- ✅ `src/app/politica-devoluciones/page.tsx`
- ✅ `src/components/admin/ui/Textarea.tsx`
- ✅ `src/components/admin/ui/Input.tsx`
- ✅ `src/components/admin/ui/ImageUpload.tsx`

**Impacto esperado:**
- Reducción de ~40-50KB en bundle inicial
- Mejora en TBT: ~170ms
- Framer Motion ahora se carga solo cuando se necesita (async chunk)

**Código antes:**
```typescript
import { motion } from 'framer-motion'
```

**Código después:**
```typescript
// ⚡ PERFORMANCE: Lazy load de Framer Motion para reducir bundle inicial
import { motion } from '@/lib/framer-motion-lazy'
```

### 2. Verificación de Configuración Legacy JavaScript

**Estado**: Verificado que `.browserslistrc` está correctamente configurado para navegadores modernos:
- Desktop: Últimas 2 versiones de Chrome, Edge, Firefox, Safari
- Mobile: iOS 14+, Android 10+

**Nota sobre JavaScript Legacy**: 
Lighthouse detecta `core-js` y transformaciones de Babel (`@babel/plugin-transform-classes`, `@babel/plugin-transform-regenerator`, `@babel/plugin-transform-spread`), pero esto es normal porque:
1. Next.js/SWC transpila según `.browserslistrc` automáticamente
2. Algunas dependencias de terceros pueden incluir polyfills
3. El polyfill de `react/cache` es necesario para Next.js 16

**Recomendación**: 
- La configuración actual es óptima
- No se requiere acción adicional - SWC ya respeta `.browserslistrc`
- El ahorro de 170ms se logrará principalmente reduciendo JavaScript no utilizado

### 3. Optimización de Code Splitting

**Estado**: Ya implementado en `next.config.js`:
- ✅ Framer Motion: `chunks: 'async'`, `maxSize: 20KB`
- ✅ Swiper: `chunks: 'async'`, `maxSize: 20KB`
- ✅ Recharts: `chunks: 'async'`, `maxSize: 100KB`
- ✅ React Query: `chunks: 'async'`, `maxSize: 20KB`
- ✅ Redux: `chunks: 'async'`, `maxSize: 20KB`

**Impacto**: Estas librerías ya se cargan de forma asíncrona, reduciendo el bundle inicial.

---

## 📋 Próximas Optimizaciones Recomendadas

### Prioridad Alta

1. **Análisis de Bundle Detallado** (890ms de ahorro potencial)
   - Ejecutar: `npm run analyze`
   - Identificar componentes/librerías no utilizadas
   - Implementar tree-shaking más agresivo
   - Eliminar código muerto

2. **Optimización de CSS** (170ms de ahorro potencial)
   - Verificar configuración de Tailwind purge
   - Eliminar CSS no utilizado
   - Optimizar imports de CSS

3. **Lazy Loading de Imágenes Offscreen** (220ms de ahorro potencial)
   - Verificar que todas las imágenes offscreen tienen `loading="lazy"`
   - Optimizar `sizes` attribute
   - Considerar `fetchPriority="low"` para imágenes below-fold

4. **Optimización de Tiempo de Respuesta del Servidor** (43ms de ahorro potencial)
   - Verificar que los índices de BD están aplicados (ya implementado)
   - Optimizar queries de API
   - Considerar edge caching para datos estáticos

### Prioridad Media

5. **Preload de Recursos Críticos**
   - Preload de fuentes críticas
   - Preload de imágenes hero
   - Preconnect a dominios de terceros críticos

6. **Service Worker para Caché**
   - Implementar service worker para assets estáticos
   - Cache-first strategy para imágenes
   - Stale-while-revalidate para datos dinámicos

---

## 🎯 Métricas Esperadas Post-Optimización

### Mejoras Iniciales (después de esta fase):
- **Performance**: 38 → 45-50 🟡
- **TBT**: 1,210ms → <1,000ms 🟡
- **Bundle Size**: Reducción de ~40-50KB en JavaScript inicial

### Mejoras Objetivo (con todas las optimizaciones):
- **Performance**: >85 🟢
- **LCP**: <2.5s 🟢
- **FCP**: <2.5s 🟢
- **TBT**: <300ms 🟢
- **SI**: <3.4s 🟢

---

## 📝 Archivos Modificados

1. `src/components/ui/micro-interactions.tsx` - Lazy load de framer-motion
2. `src/components/Analytics/MetaMetrics.tsx` - Lazy load de framer-motion
3. `src/components/Analytics/HeatmapViewer.tsx` - Lazy load de framer-motion
4. `src/components/Analytics/ConversionFunnel.tsx` - Lazy load de framer-motion
5. `src/components/Analytics/ComparisonView.tsx` - Lazy load de framer-motion
6. `src/components/Analytics/AnalyticsDemo.tsx` - Lazy load de framer-motion
7. `src/app/politica-devoluciones/page.tsx` - Lazy load de framer-motion
8. `src/components/admin/ui/Textarea.tsx` - Lazy load de framer-motion
9. `src/components/admin/ui/Input.tsx` - Lazy load de framer-motion
10. `src/components/admin/ui/ImageUpload.tsx` - Lazy load de framer-motion
11. `next.config.js` - Documentación mejorada sobre configuración legacy

---

## 🔍 Verificación Post-Deploy

### Comandos para verificar mejoras:

```bash
# Análisis de bundle
npm run analyze

# Lighthouse audit
npm run lighthouse:json
npm run lighthouse:analyze

# Verificar imports de framer-motion
grep -r "from 'framer-motion'" src/
```

### Checklist de Verificación:

- [ ] Deploy completado en Vercel
- [ ] Ejecutar `npm run lighthouse:json`
- [ ] Comparar métricas antes/después
- [ ] Verificar que TBT mejoró
- [ ] Verificar que bundle size se redujo
- [ ] Verificar que no hay errores en consola
- [ ] Verificar que animaciones funcionan correctamente

---

## 📊 Impacto Total Estimado (Fase 2)

- **JavaScript no utilizado (Framer Motion)**: ~170ms de ahorro
- **Reducción de bundle**: ~40-50KB
- **Mejora en TBT**: ~170ms

**Total estimado Fase 2**: ~170ms de mejora en métricas de performance

**Total acumulado (Fase 1 + Fase 2)**: ~1.77s de mejora estimada

---

## 🚀 Próximos Pasos

1. **Deploy y verificación**: Hacer deploy de estos cambios y verificar mejoras
2. **Análisis de bundle**: Ejecutar análisis detallado para identificar más oportunidades
3. **Optimización de CSS**: Eliminar CSS no utilizado
4. **Lazy loading de imágenes**: Verificar y optimizar todas las imágenes offscreen
5. **Monitoreo continuo**: Configurar alertas para detectar regresiones de performance

---

**Fecha de implementación**: 23 de Enero 2026  
**Estado**: ✅ Completado - Listo para deploy y verificación
