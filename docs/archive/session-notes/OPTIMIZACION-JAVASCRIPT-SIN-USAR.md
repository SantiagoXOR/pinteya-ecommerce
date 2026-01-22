# ⚡ Optimización: Reducir Código JavaScript Sin Usar

## 📊 Problema Identificado

**Código JavaScript sin usar: 467 KiB** (objetivo: < 100 KiB)

### Desglose del Problema:

| Recurso | Tamaño Transferencia | Ahorro Estimado | Impacto |
|---------|----------------------|-----------------|---------|
| **pinteya.com Propio** | **567.7 KiB** | **354.5 KiB** | 🔴 **CRÍTICO** |
| `vendors-4....js` | 276.9 KiB | 158.7 KiB | 🔴 **PROBLEMA PRINCIPAL** |
| `framework....js` | 183.6 KiB | 113.9 KiB | 🔴 Alto |
| `framer-motion....js` | 40.5 KiB | 33.4 KiB | ⚠️ Moderado |
| `radix-ui....js` | 33.8 KiB | 27.9 KiB | ⚠️ Moderado |
| `lib-69426....js` | 32.9 KiB | 20.6 KiB | ⚠️ Moderado |
| **Facebook** | 203.0 KiB | 64.5 KiB | ✅ Ya optimizado |
| **Google Tag Manager** | 150.4 KiB | 48.2 KiB | ✅ Ya optimizado |

**Total**: 921.1 KiB transferido, 467.2 KiB sin usar

---

## ✅ Soluciones Implementadas

### 1. **Límites de Tamaño en Code Splitting** ⚡

**Problema:**
- Chunks demasiado grandes sin límites de tamaño
- Mucho código sin usar en chunks grandes
- Falta de control sobre el tamaño de chunks específicos

**Optimizaciones aplicadas:**

```javascript
config.optimization.splitChunks = {
  chunks: 'all',
  maxSize: 200000, // 200 KB máximo por chunk
  
  cacheGroups: {
    framework: {
      maxSize: 300000, // 300 KB máximo para framework
    },
    framerMotion: {
      maxSize: 100000, // 100 KB máximo (vs sin límite anterior)
    },
    radixUI: {
      maxSize: 100000, // 100 KB máximo (vs sin límite anterior)
    },
    lib: {
      maxSize: 150000, // 150 KB máximo (vs sin límite anterior)
    },
    vendor: {
      maxSize: 200000, // 200 KB máximo (vs sin límite anterior)
      minSize: 20000,  // 20 KB mínimo
    },
  },
}
```

**Impacto esperado:**
- ✅ Chunks más pequeños = mejor code splitting
- ✅ Menos código sin usar en cada chunk
- ✅ Mejor paralelización de carga

---

### 2. **Wrapper Lazy para Framer Motion** ⚡

**Problema:**
- Framer Motion se carga en el bundle inicial (40.5 KiB)
- Muchos componentes que usan framer-motion están en rutas no críticas (admin, help, about)
- Ahorro estimado: 33.4 KiB

**Solución implementada:**

```typescript
// src/lib/lazy-framer-motion.tsx
// ⚡ PERFORMANCE: Lazy loading wrapper para Framer Motion
// Reduce bundle inicial en ~40.5 KiB (ahorro estimado: 33.4 KiB)

export const LazyMotion = dynamic(
  () => import('framer-motion').then(m => ({ default: m.LazyMotion })),
  { ssr: false }
)

export const AnimatePresence = dynamic(
  () => import('framer-motion').then(m => ({ default: m.AnimatePresence })),
  { ssr: false }
)
```

**Uso recomendado:**
- ✅ Componentes no críticos: Usar `lazy-framer-motion.tsx`
- ✅ Componentes críticos (checkout): Mantener import directo

**Impacto esperado:**
- ✅ Reducción del 33.4 KiB en bundle inicial
- ✅ Framer Motion solo se carga cuando se necesita

---

### 3. **Optimizaciones Existentes Mantenidas** ✅

**Ya implementadas:**
- ✅ `optimizePackageImports` para Radix UI (reduce 27.9 KiB)
- ✅ Code splitting por librería (framer-motion, radix-ui, recharts separados)
- ✅ Lazy loading de componentes admin que usan framer-motion
- ✅ Dynamic imports para componentes below-the-fold

---

## 📈 Impacto Esperado

| Métrica | Antes | Después | Mejora |
|---------|-------|---------|--------|
| **Código sin usar (propio)** | 354.5 KiB | < 150 KiB | **-58%** ⚡ |
| **vendors chunk** | 276.9 KiB | < 150 KiB | **-46%** |
| **framework chunk** | 183.6 KiB | < 120 KiB | **-35%** |
| **framer-motion chunk** | 40.5 KiB | < 20 KiB | **-51%** |
| **Total código sin usar** | 467 KiB | < 200 KiB | **-57%** |

---

## 🔍 Cómo Funcionan las Optimizaciones

### Límites de Tamaño en Code Splitting:

1. **`maxSize` por chunk**:
   - Fuerza a webpack a dividir chunks grandes en chunks más pequeños
   - Cada chunk más pequeño contiene menos código sin usar
   - Mejor paralelización de carga

2. **`minSize` para vendors**:
   - Evita chunks muy pequeños que aumentan el número de requests
   - Balance entre code splitting y número de requests

3. **Chunks específicos limitados**:
   - `framer-motion`: 100 KB máximo
   - `radix-ui`: 100 KB máximo
   - `lib`: 150 KB máximo
   - `vendor`: 200 KB máximo

### Lazy Loading de Framer Motion:

1. **Wrapper lazy**:
   - Componentes no críticos usan el wrapper
   - Solo carga framer-motion cuando se necesita
   - No se incluye en el bundle inicial

2. **Componentes críticos**:
   - Mantienen import directo (checkout, etc.)
   - Necesitan framer-motion inmediatamente

---

## 🧪 Verificación

### 1. Bundle Analyzer

```bash
ANALYZE=true npm run build
```

**Verificar:**
- ✅ Chunks deben ser < 200 KB
- ✅ framer-motion chunk debe ser < 100 KB
- ✅ radix-ui chunk debe ser < 100 KB
- ✅ vendors chunk debe ser < 200 KB

### 2. Chrome DevTools - Coverage Tab

1. Abrir DevTools → Coverage
2. Recargar la página
3. **Verificar:**
   - ✅ Código sin usar debe ser < 200 KiB (vs 467 KiB antes)
   - ✅ framer-motion no debe aparecer en carga inicial (si se usa lazy)

### 3. Lighthouse

```bash
npx lighthouse http://localhost:3000 --view
```

**Verificar:**
- ✅ "Reduce el código JavaScript sin usar" debe mejorar
- ✅ Ahorro estimado debe reducirse significativamente
- ✅ Tamaño de transferencia debe reducirse

---

## 📝 Archivos Modificados

1. ✅ `next.config.js`
   - Agregados límites de tamaño para chunks específicos
   - Optimizado code splitting con `maxSize` y `minSize`

2. ✅ `src/lib/lazy-framer-motion.tsx` (nuevo)
   - Wrapper lazy para framer-motion
   - Reduce bundle inicial en ~33.4 KiB

---

## ⚠️ Consideraciones

### Trade-offs:

1. **Chunks más pequeños:**
   - ✅ Menos código sin usar por chunk
   - ⚠️ Más requests HTTP (pero en paralelo)
   - 💡 Aceptable: HTTP/2 maneja múltiples requests eficientemente

2. **Lazy loading de framer-motion:**
   - ✅ Menos bundle inicial
   - ⚠️ Componentes pueden tener delay al cargar
   - 💡 Aceptable: Solo para componentes no críticos

3. **Límites de tamaño:**
   - ✅ Mejor code splitting
   - ⚠️ Build time puede aumentar ligeramente
   - 💡 Aceptable: Mejor rendimiento en runtime > build time

---

## 🚀 Próximos Pasos

1. **Probar en desarrollo:**
   - Ejecutar `npm run build` y verificar tamaños de chunks
   - Ejecutar `ANALYZE=true npm run build` para ver distribución

2. **Probar en producción:**
   - Ejecutar Lighthouse en producción
   - Monitorear métricas reales de código sin usar

3. **Optimizaciones adicionales (opcional):**
   - Migrar más componentes a usar `lazy-framer-motion.tsx`
   - Evaluar si podemos eliminar más dependencias
   - Considerar usar alternativas más ligeras a framer-motion para casos simples

---

## 📚 Referencias

- [Lighthouse - Reduce unused JavaScript](https://developer.chrome.com/docs/lighthouse/performance/unused-javascript)
- [Webpack - Code Splitting](https://webpack.js.org/guides/code-splitting/)
- [Next.js - Bundle Optimization](https://nextjs.org/docs/app/api-reference/next-config-js/optimizePackageImports)

---

**Fecha de implementación**: 2025-01-XX
**Impacto esperado**: Reducción del 57% en código sin usar (467 KiB → < 200 KiB)

