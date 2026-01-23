# 🔧 Plan de Acción: Optimizar Chunk de Recharts (670KB)

**Fecha:** 23 de Enero, 2026  
**Problema:** Chunk de 670KB contiene principalmente recharts (146 referencias)  
**Prioridad:** 🔴 Alta

---

## 📊 Análisis del Problema

### Chunk Problemático

- **Archivo:** `92d203edc9c1b3db.js`
- **Tamaño:** 670.75 KB (0.66 MB)
- **Contenido Principal:** recharts (146 referencias)
- **Estado:** 🔴 Crítico - Excede 3.3x el límite recomendado de 200KB

### Ubicaciones de Uso

**Archivos que usan recharts:**
1. `src/app/admin/optimization/bundle-dashboard/page.tsx` - ✅ Ya usa lazy loading
2. `src/components/admin/logistics/PerformanceChart.tsx` - ⚠️ Comentado pero puede tener imports
3. Otros componentes admin (verificar)

---

## 🎯 Soluciones Propuestas

### Solución 1: Verificar y Aplicar Lazy Loading Completo

**Acción:**
1. Verificar que TODOS los imports de recharts usen `dynamic()`
2. Asegurar que `ssr: false` esté configurado
3. Verificar que no haya imports directos

**Archivos a revisar:**
- `src/components/admin/logistics/PerformanceChart.tsx`
- `src/app/admin/analytics/page.tsx`
- `src/app/admin/logistics/page.tsx`
- Cualquier otro componente que use gráficos

### Solución 2: Configurar Code Splitting Específico para Recharts

**En `next.config.js`:**
```javascript
// Ya existe pero verificar que funcione con Turbopack
recharts: {
  test: /[\\/]node_modules[\\/]recharts[\\/]/,
  name: 'recharts',
  priority: 30,
  chunks: 'async', // CRITICAL: Solo cargar cuando se necesita
  maxSize: 100000, // 100 KB máximo
  reuseExistingChunk: true,
}
```

**Problema:** Turbopack puede no respetar esta configuración completamente.

### Solución 3: Crear Wrapper Lazy para Recharts

**Crear:** `src/lib/recharts-lazy.tsx`

```typescript
// Wrapper centralizado para lazy loading de recharts
import dynamic from 'next/dynamic'

export const BarChart = dynamic(
  () => import('recharts').then(mod => ({ default: mod.BarChart })),
  { ssr: false }
)

export const LineChart = dynamic(
  () => import('recharts').then(mod => ({ default: mod.LineChart })),
  { ssr: false }
)

// ... otros componentes de recharts
```

**Ventajas:**
- Centraliza el lazy loading
- Facilita mantenimiento
- Asegura consistencia

### Solución 4: Considerar Alternativa Más Ligera

**Opciones:**
1. **Chart.js** (~60KB) - Más ligero que recharts
2. **Victory** (~80KB) - Alternativa moderna
3. **Visx** (~50KB) - Muy ligero, basado en D3

**Solo si:** recharts no se usa frecuentemente o se puede reemplazar fácilmente.

---

## ✅ Checklist de Implementación

### Paso 1: Verificar Imports Actuales
- [ ] Buscar todos los imports directos de recharts
- [ ] Verificar que usen lazy loading
- [ ] Identificar imports que necesitan migración

### Paso 2: Aplicar Lazy Loading
- [ ] Migrar imports directos a `dynamic()`
- [ ] Crear wrapper centralizado (opcional pero recomendado)
- [ ] Verificar que `ssr: false` esté configurado

### Paso 3: Verificar Configuración
- [ ] Verificar que `maxSize: 100000` esté en webpack config
- [ ] Verificar que `chunks: 'async'` esté configurado
- [ ] Considerar configuración específica de Turbopack

### Paso 4: Testing
- [ ] Ejecutar `npm run build`
- [ ] Verificar que chunk de recharts sea <200KB
- [ ] Verificar que lazy loading funcione correctamente
- [ ] Probar que gráficos se carguen cuando se necesiten

---

## 📝 Notas Técnicas

### Turbopack vs Webpack

**Problema:** Next.js 16 usa Turbopack por defecto, que puede tener comportamiento diferente:
- Turbopack puede no respetar completamente `maxSize` de webpack
- Puede requerir configuración específica de Turbopack
- Considerar usar `--webpack` flag si es necesario

### Verificación Post-Implementación

```bash
# Ejecutar análisis de chunks
node scripts/analyze-chunks.js

# Verificar que chunk de recharts sea <200KB
# Verificar que se cargue bajo demanda (async)
```

---

## 🎯 Resultado Esperado

**Antes:**
- Chunk de 670KB con recharts incluido

**Después:**
- Chunk de recharts <200KB (preferiblemente <100KB)
- Recharts cargado solo cuando se necesita (lazy loading)
- Reducción significativa del tamaño del bundle inicial

---

**Última actualización:** 23 de Enero, 2026
