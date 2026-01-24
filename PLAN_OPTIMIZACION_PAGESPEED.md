# 🚀 Plan de Optimización Basado en PageSpeed Insights

**Fecha**: 23 de Enero 2026  
**Performance Actual**: 43/100 (Mobile)  
**Objetivo**: >85/100

---

## 📊 Análisis de Resultados

### Métricas Críticas

| Métrica | Actual | Target | Gap | Prioridad |
|---------|--------|--------|-----|-----------|
| **LCP** | 11.3s | <2.5s | -8.8s | 🔴 CRÍTICA |
| **FCP** | 3.0s | <1.8s | -1.2s | 🔴 CRÍTICA |
| **TBT** | 770ms | <300ms | -470ms | 🔴 CRÍTICA |
| **SI** | 8.8s | <3.4s | -5.4s | 🔴 CRÍTICA |
| **CLS** | 0 | <0.1 | ✅ | 🟢 OK |

### Oportunidades Identificadas

1. **Mejora entrega de imágenes**: 418 KiB 🔴
2. **Reduce JS no usado**: 192 KiB 🔴
3. **Caché eficiente**: 265 KiB 🔴
4. **Tiempo ejecución JS**: 3.2s 🔴
5. **Trabajo hilo principal**: 7.0s 🔴
6. **JS heredado**: 49 KiB 🟡
7. **CSS no usado**: 28 KiB 🟡

**Total ahorro potencial**: ~952 KiB + mejoras en tiempo

---

## 🎯 Plan de Acción Priorizado

### FASE 1: Optimización de Imágenes (418 KiB) 🔴 CRÍTICA

**Impacto esperado**: Mayor reducción de tamaño + mejora en LCP

#### 1.1 Agregar width/height a imágenes con `fill`

**Problema**: Imágenes usando `fill` sin contenedor con dimensiones explícitas causan layout shifts.

**Archivos a optimizar**:
- `src/components/Home/Hero/HeroSlide.tsx` - Imágenes hero
- `src/components/Home/HeroCarousel/index.tsx` - Carousel hero
- `src/components/Home/PromoBanners/index.tsx` - Banners promocionales
- `src/components/Home/Hero/SimpleHeroCarousel.tsx` - Carousel simple

**Solución**: Asegurar que contenedores con `fill` tengan dimensiones explícitas o usar width/height en lugar de fill cuando sea posible.

#### 1.2 Optimizar lazy loading de imágenes

**Verificar**:
- Todas las imágenes offscreen tienen `loading="lazy"`
- Imágenes below-fold tienen `fetchPriority="low"`
- `sizes` attribute está optimizado

#### 1.3 Optimizar calidad y formatos

**Acciones**:
- Verificar que WebP/AVIF están habilitados
- Reducir calidad en imágenes no críticas (thumbnails: 65, hero: 80)
- Optimizar tamaños según uso

---

### FASE 2: Reducir JavaScript No Utilizado (192 KiB) 🔴 CRÍTICA

**Impacto esperado**: Reducción significativa en TBT y tiempo de ejecución

#### 2.1 Análisis detallado de bundle

```bash
npm run analyze
```

**Identificar**:
- Librerías completas importadas
- Código muerto
- Componentes pesados cargados eager

#### 2.2 Optimizar imports

**Acciones**:
- Convertir imports completos a modulares
- Lazy load de componentes pesados adicionales
- Eliminar dependencias no utilizadas

#### 2.3 Code splitting más agresivo

**Componentes candidatos para lazy load**:
- Componentes de Analytics (ya parcialmente optimizados)
- Componentes de Admin no críticos
- Modales y popups
- Componentes de checkout no críticos

---

### FASE 3: Optimizar Caché (265 KiB) 🔴 CRÍTICA

**Impacto esperado**: Mejora en visitas repetidas

#### 3.1 Verificar headers de caché

**Estado actual**: Headers configurados en `next.config.js`
- ✅ Imágenes: 30 días cliente, 1 año CDN
- ✅ Fonts: 1 año
- ✅ Chunks: 1 año

**Verificar**:
- Headers se están aplicando correctamente
- CDN (Vercel) respeta los headers
- Recursos estáticos tienen caché apropiado

#### 3.2 Optimizar caché de recursos dinámicos

**Considerar**:
- Service Worker para caché de assets
- Cache-Control más agresivo para recursos estáticos
- Verificar que Vercel Edge Cache está funcionando

---

### FASE 4: Reducir Tiempo de Ejecución JS (3.2s) 🔴 CRÍTICA

**Impacto esperado**: Mejora significativa en TBT y TTI

#### 4.1 Code splitting más agresivo

**Acciones**:
- Lazy load de más componentes
- Defer de scripts no críticos
- Separar código crítico de no crítico

#### 4.2 Optimizar carga de librerías

**Verificar**:
- Framer Motion ya está lazy (✅)
- Swiper ya está lazy (✅)
- Recharts ya está lazy (✅)
- Otras librerías pesadas necesitan lazy load

---

### FASE 5: Minimizar Trabajo del Hilo Principal (7.0s) 🔴 CRÍTICA

**Impacto esperado**: Mejora en interactividad

#### 5.1 Reducir parsing de JavaScript

**Acciones**:
- Reducir tamaño de bundle inicial (Fase 2)
- Code splitting más agresivo
- Defer de JavaScript no crítico

#### 5.2 Optimizar renderizado

**Acciones**:
- Usar React.memo para componentes pesados
- Optimizar re-renders innecesarios
- Lazy load de componentes below-fold

---

### FASE 6: Optimizaciones Menores 🟡

#### 6.1 JavaScript Heredado (49 KiB)

**Acciones**:
- Verificar `.browserslistrc` está correcto (✅)
- Eliminar polyfills innecesarios
- Optimizar configuración de SWC

#### 6.2 CSS No Utilizado (28 KiB)

**Acciones**:
- Verificar Tailwind purge
- Eliminar CSS no utilizado
- Optimizar imports de CSS

---

## 📋 Checklist de Implementación

### Fase 1: Imágenes
- [ ] Agregar dimensiones explícitas a contenedores con `fill`
- [ ] Verificar lazy loading en todas las imágenes offscreen
- [ ] Optimizar `sizes` attribute
- [ ] Verificar formatos WebP/AVIF
- [ ] Ajustar calidad según uso

### Fase 2: JavaScript
- [ ] Ejecutar `npm run analyze`
- [ ] Identificar código no utilizado
- [ ] Optimizar imports modulares
- [ ] Lazy load de componentes adicionales
- [ ] Eliminar dependencias no utilizadas

### Fase 3: Caché
- [ ] Verificar headers de caché funcionando
- [ ] Optimizar Cache-Control
- [ ] Verificar CDN cache

### Fase 4-5: Ejecución JS
- [ ] Code splitting más agresivo
- [ ] Defer de scripts no críticos
- [ ] Optimizar carga de librerías

### Fase 6: Optimizaciones Menores
- [ ] JavaScript heredado
- [ ] CSS no utilizado

---

## 🎯 Métricas Objetivo Post-Optimización

### Objetivos Iniciales (Después de Fase 1-3)
- **Performance**: 43 → 55-60
- **LCP**: 11.3s → <8s
- **FCP**: 3.0s → <2.5s
- **TBT**: 770ms → <500ms
- **SI**: 8.8s → <6s

### Objetivos Finales (Después de todas las fases)
- **Performance**: >85
- **LCP**: <2.5s
- **FCP**: <1.8s
- **TBT**: <300ms
- **SI**: <3.4s

---

## 🚀 Próximos Pasos Inmediatos

1. **Ejecutar análisis de bundle**: `npm run analyze`
2. **Optimizar imágenes con `fill`**: Agregar dimensiones explícitas
3. **Verificar caché**: Confirmar headers funcionando
4. **Code splitting**: Lazy load de más componentes
5. **Verificar mejoras**: Ejecutar PageSpeed Insights nuevamente

---

**Estado**: 📋 Plan creado - Listo para implementación
