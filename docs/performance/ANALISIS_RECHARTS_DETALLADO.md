# Análisis Detallado: Optimización del Chunk de Recharts

**Fecha:** 2026-01-23  
**Objetivo:** Reducir el chunk de Recharts de 670KB a menos de 200KB

## Resumen Ejecutivo

Se implementaron optimizaciones para reducir el tamaño del chunk de Recharts y asegurar que se cargue solo cuando sea necesario (async). Las optimizaciones incluyen:

1. ✅ Wrapper centralizado para lazy loading consistente
2. ✅ Configuración de webpack con `chunks: 'async'`
3. ✅ Migración de componentes existentes al wrapper
4. ✅ Documentación completa del proceso

## Situación Inicial

**Problema identificado:**
- Chunk: `92d203edc9c1b3db.js` - **670.75 KB** (3.3x el límite recomendado de 200KB)
- Contenido principal: recharts con 146 referencias
- Recharts posiblemente incluido en bundle inicial (no async)

**Archivos afectados:**
- `src/app/admin/optimization/bundle-dashboard/page.tsx` - Usaba lazy loading pero de forma inconsistente
- `src/components/admin/logistics/PerformanceChart.tsx` - Imports comentados (no usa recharts actualmente)

## Optimizaciones Implementadas

### 1. Wrapper Centralizado (`src/lib/recharts-lazy.tsx`)

**Objetivo:** Centralizar la configuración de lazy loading para todos los componentes de Recharts.

**Características:**
- ✅ Todos los componentes exportados con `dynamic()` de Next.js
- ✅ `ssr: false` para todos (Recharts requiere DOM)
- ✅ Loading states consistentes con componente `ChartLoading`
- ✅ Exporta todos los componentes principales:
  - Gráficos: BarChart, LineChart, AreaChart, PieChart, RadarChart, ScatterChart, ComposedChart, FunnelChart, Treemap, Sankey
  - Elementos: Bar, Line, Area, Pie, Cell, Radar, Scatter, Funnel, Label, LabelList
  - Ejes: XAxis, YAxis, ZAxis, CartesianGrid, PolarGrid, PolarAngleAxis, PolarRadiusAxis
  - Interacción: Tooltip, Legend, Brush, ReferenceLine, ReferenceDot, ReferenceArea, ErrorBar
  - Contenedores: ResponsiveContainer
- ✅ Re-exporta tipos TypeScript de Recharts

**Ventajas:**
- Centraliza configuración de lazy loading
- Facilita mantenimiento futuro
- Asegura consistencia en todos los usos
- Permite agregar loading states y error boundaries fácilmente

### 2. Configuración de Webpack (`next.config.js`)

**Cambios realizados:**

```javascript
recharts: {
  test: /[\\/]node_modules[\\/]recharts[\\/]/,
  name: 'recharts',
  priority: 30,
  chunks: 'async', // ⚡ CRITICAL: Agregado - Solo cargar cuando se necesita
  maxSize: 100000, // 100 KB máximo
  reuseExistingChunk: true,
}
```

**Impacto:**
- ✅ `chunks: 'async'` asegura que Recharts solo se cargue bajo demanda
- ✅ `maxSize: 100000` limita el tamaño máximo del chunk a 100KB
- ✅ Compatible con configuración existente de `modularizeImports` y `optimizePackageImports`

### 3. Migración de Componentes

**Archivo migrado:**
- `src/app/admin/optimization/bundle-dashboard/page.tsx`

**Cambios:**
- ❌ Removidos: 11 imports individuales con `dynamic()` duplicados
- ✅ Agregado: Import único desde `@/lib/recharts-lazy`
- ✅ Simplificado: Código más limpio y mantenible

**Antes:**
```typescript
const BarChart = dynamic(() => import('recharts').then(mod => ({ default: mod.BarChart })), { ssr: false })
const Bar = dynamic(() => import('recharts').then(mod => ({ default: mod.Bar })), { ssr: false })
// ... 9 más
```

**Después:**
```typescript
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  // ... todos desde wrapper centralizado
} from '@/lib/recharts-lazy'
```

## Configuración Existente Verificada

### Modularize Imports (`next.config.js` líneas 66-69)
```javascript
'recharts': {
  transform: 'recharts/lib/{{member}}',
  skipDefaultConversion: true,
}
```
✅ Ya configurado correctamente

### Optimize Package Imports (`next.config.js` línea 93)
```javascript
optimizePackageImports: [
  // ...
  'recharts',
  // ...
]
```
✅ Ya configurado correctamente

## Resultados Esperados

### Antes de las Optimizaciones:
- ❌ Chunk de 670KB con recharts incluido
- ❌ Recharts posiblemente en bundle inicial
- ❌ Código duplicado para lazy loading

### Después de las Optimizaciones:
- ✅ Chunk de recharts <200KB (idealmente <100KB)
- ✅ Recharts cargado solo cuando se necesita (async)
- ✅ Reducción significativa del tamaño del bundle inicial
- ✅ Código centralizado y mantenible
- ✅ Mejora esperada en TBT y LCP

## Verificación

### Scripts Disponibles:

Se han creado scripts especializados para verificar las optimizaciones:

1. **Verificar imports de Recharts:**
   ```bash
   npm run verify:recharts-imports
   ```
   Verifica que todos los imports usen el wrapper centralizado.

2. **Análisis específico del chunk de Recharts:**
   ```bash
   npm run analyze:recharts
   ```
   Analiza específicamente el chunk de Recharts y verifica su tamaño.

3. **Análisis general de chunks:**
   ```bash
   npm run analyze:chunks
   ```
   Analiza todos los chunks del build.

### Pasos para Verificar:

1. **Verificar que los imports usen el wrapper:**
   ```bash
   npm run verify:recharts-imports
   ```
   Debe mostrar: ✅ No se encontraron imports directos de Recharts

2. **Build del proyecto:**
   ```bash
   npm run build
   ```

3. **Análisis específico del chunk de Recharts:**
   ```bash
   npm run analyze:recharts
   ```
   Verifica el tamaño del chunk y proporciona recomendaciones.

4. **Análisis general de chunks (opcional):**
   ```bash
   npm run analyze:chunks
   ```

5. **Bundle Analyzer (opcional - análisis visual detallado):**
   ```bash
   ANALYZE=true npm run build
   ```
   Abre un reporte visual interactivo del bundle.

6. **Verificación en Network Tab:**
   - Iniciar servidor: `npm run start`
   - Abrir DevTools > Network tab
   - Navegar a `/admin/optimization/bundle-dashboard`
   - Verificar que el chunk de recharts se carga bajo demanda (async)
   - Verificar que NO está en el bundle inicial (no se carga en la primera carga de página)

### Métricas de Éxito:

- [x] ✅ Todos los imports usan el wrapper centralizado (`npm run verify:recharts-imports`)
- [ ] Chunk de recharts <200KB (verificar con `npm run analyze:recharts`)
- [ ] Chunk de recharts idealmente <100KB
- [ ] Recharts solo se carga bajo demanda (verificar Network tab)
- [ ] No hay regresiones en funcionalidad
- [ ] Build exitoso sin errores
- [ ] Gráficos se renderizan correctamente

## Compatibilidad con Turbopack

**Nota importante:** Next.js 16 usa Turbopack por defecto, pero la configuración de webpack se respeta cuando se usa el flag `--webpack`.

**Recomendaciones:**
- Si Turbopack no respeta la configuración, usar: `npm run build -- --webpack`
- Verificar que el comportamiento sea consistente entre ambos bundlers
- Documentar cualquier diferencia encontrada

## Uso del Wrapper

### Importación Estándar:
```typescript
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer } from '@/lib/recharts-lazy'
```

### Ejemplo de Uso:
```typescript
<ResponsiveContainer width="100%" height={300}>
  <BarChart data={data}>
    <CartesianGrid strokeDasharray="3 3" />
    <XAxis dataKey="name" />
    <YAxis />
    <Tooltip />
    <Bar dataKey="value" fill="#8884d8" />
  </BarChart>
</ResponsiveContainer>
```

### Loading State:
El wrapper incluye automáticamente un loading state que se muestra mientras se carga Recharts. No se requiere configuración adicional.

## Próximos Pasos (Opcional)

Si después de estas optimizaciones el chunk sigue siendo >200KB:

1. **Análisis detallado con Bundle Analyzer:**
   - Identificar qué partes específicas de Recharts se están usando
   - Verificar si hay dependencias transitivas innecesarias

2. **Considerar alternativas más ligeras:**
   - Chart.js (~60KB)
   - Victory (~80KB)
   - Visx (~50KB)

**Criterio:** Solo considerar alternativas si el chunk sigue siendo >200KB después de todas las optimizaciones.

## Archivos Modificados

1. ✅ `src/lib/recharts-lazy.tsx` (nuevo) - Wrapper centralizado
2. ✅ `src/app/admin/optimization/bundle-dashboard/page.tsx` - Migrado a wrapper
3. ✅ `next.config.js` (línea 256) - Agregado `chunks: 'async'`
4. ✅ `scripts/analyze-recharts-chunk.js` (nuevo) - Script de análisis específico
5. ✅ `scripts/verify-recharts-imports.js` (nuevo) - Script de verificación de imports
6. ✅ `package.json` - Agregados scripts: `analyze:recharts`, `verify:recharts-imports`
7. ✅ `docs/performance/ANALISIS_RECHARTS_DETALLADO.md` (este archivo) - Documentación

## Referencias

- [Plan de Optimización Original](../../.cursor/plans/optimización_chunk_recharts_670kb_120616e3.plan.md)
- [Next.js Dynamic Imports](https://nextjs.org/docs/pages/building-your-application/optimizing/lazy-loading)
- [Webpack Code Splitting](https://webpack.js.org/guides/code-splitting/)
- [Recharts Documentation](https://recharts.org/)

## Notas Adicionales

- El componente `PerformanceChart.tsx` tiene imports de Recharts comentados y no requiere cambios
- Todos los componentes del wrapper tienen `ssr: false` porque Recharts requiere DOM
- El loading state es consistente en todos los componentes para mejor UX
- Los tipos TypeScript se pueden importar directamente desde 'recharts' sin afectar el bundle
