# Guía de Verificación: Optimización del Chunk de Recharts

**Fecha:** 2026-01-23  
**Objetivo:** Verificar que las optimizaciones del chunk de Recharts estén funcionando correctamente

## Resumen Rápido

Esta guía te ayudará a verificar que las optimizaciones del chunk de Recharts estén funcionando correctamente después de implementar los cambios.

## Checklist de Verificación

### ✅ Fase 1: Verificación de Imports

**Objetivo:** Asegurar que todos los componentes usen el wrapper centralizado.

```bash
npm run verify:recharts-imports
```

**Resultado esperado:**
```
✅ No se encontraron imports directos de Recharts
   Todos los imports usan el wrapper centralizado @/lib/recharts-lazy
```

**Si hay errores:**
- Revisar los archivos listados
- Reemplazar imports directos por imports desde `@/lib/recharts-lazy`
- Los tipos TypeScript pueden importarse directamente desde 'recharts' (no afecta bundle)

### ✅ Fase 2: Build y Análisis

**Paso 1: Build del proyecto**
```bash
npm run build
```

**Paso 2: Análisis específico del chunk de Recharts**
```bash
npm run analyze:recharts
```

**Resultado esperado:**
```
✅ ANÁLISIS COMPLETADO: Chunk de Recharts dentro de límites
```

**Verificaciones:**
- ✅ Tamaño del chunk: EXCELENTE (<100KB) o ACEPTABLE (<200KB)
- ✅ Un solo chunk de Recharts (óptimo)
- ✅ Chunks de Recharts encontrados (probablemente async)

**Si el chunk es >200KB:**
1. Verificar que `chunks: 'async'` esté en `next.config.js` (línea 256)
2. Verificar que se use el wrapper `@/lib/recharts-lazy`
3. Ejecutar análisis detallado: `ANALYZE=true npm run build`

### ✅ Fase 3: Verificación en Navegador

**Paso 1: Iniciar servidor**
```bash
npm run start
```

**Paso 2: Verificar carga async en Network Tab**

1. Abrir DevTools (F12)
2. Ir a la pestaña **Network**
3. Filtrar por **JS**
4. Navegar a `/admin/optimization/bundle-dashboard`
5. Verificar:
   - ✅ El chunk de recharts NO aparece en la carga inicial de la página
   - ✅ El chunk de recharts se carga cuando se renderiza el componente
   - ✅ El nombre del archivo contiene "recharts" o un hash similar

**Resultado esperado:**
- El chunk de recharts aparece como una petición separada (async)
- No está incluido en el bundle inicial
- Se carga solo cuando se necesita

### ✅ Fase 4: Verificación Funcional

**Verificar que los gráficos funcionen correctamente:**

1. Navegar a `/admin/optimization/bundle-dashboard`
2. Verificar que:
   - ✅ Los gráficos se renderizan correctamente
   - ✅ No hay errores en la consola
   - ✅ El loading state aparece brevemente antes de mostrar los gráficos
   - ✅ Los gráficos son interactivos (tooltips, etc.)

## Scripts Disponibles

| Script | Descripción |
|--------|-------------|
| `npm run verify:recharts-imports` | Verifica que todos los imports usen el wrapper |
| `npm run analyze:recharts` | Analiza específicamente el chunk de Recharts |
| `npm run analyze:chunks` | Analiza todos los chunks del build |
| `ANALYZE=true npm run build` | Build con Bundle Analyzer (análisis visual) |

## Interpretación de Resultados

### Tamaño del Chunk

- **<100KB**: ✅ EXCELENTE - Dentro del tamaño ideal
- **100-200KB**: 🟡 ACEPTABLE - Dentro del límite recomendado
- **>200KB**: 🔴 PROBLEMA - Excede el límite, requiere optimización adicional

### Carga Async

- **Chunk separado**: ✅ CORRECTO - Recharts se carga bajo demanda
- **En bundle inicial**: ❌ PROBLEMA - Recharts está en el bundle principal

### Múltiples Chunks

- **Un solo chunk**: ✅ ÓPTIMO - Mejor para code splitting
- **Múltiples chunks**: 🟡 ACEPTABLE - Puede indicar code splitting adicional

## Solución de Problemas

### Problema: Chunk >200KB

**Posibles causas:**
1. `chunks: 'async'` no está configurado en `next.config.js`
2. Hay imports directos de 'recharts' en lugar del wrapper
3. Turbopack no está respetando la configuración de webpack

**Soluciones:**
1. Verificar `next.config.js` línea 256: debe tener `chunks: 'async'`
2. Ejecutar `npm run verify:recharts-imports` y corregir imports
3. Usar `npm run build -- --webpack` si Turbopack no respeta la configuración

### Problema: Recharts en bundle inicial

**Posibles causas:**
1. Componente que usa Recharts no está usando lazy loading
2. Recharts importado en un componente que se carga inicialmente

**Soluciones:**
1. Verificar que todos los componentes usen `@/lib/recharts-lazy`
2. Asegurar que los componentes con gráficos usen `dynamic()` o estén en rutas lazy

### Problema: Gráficos no se renderizan

**Posibles causas:**
1. Error en el wrapper
2. Problema con lazy loading
3. Error en la configuración de Recharts

**Soluciones:**
1. Verificar consola del navegador para errores
2. Verificar que el chunk de recharts se carga en Network tab
3. Verificar que `ssr: false` esté configurado (ya está en el wrapper)

## Próximos Pasos

Después de verificar que todo funciona correctamente:

1. **Monitoreo continuo:**
   - Ejecutar `npm run analyze:recharts` periódicamente
   - Verificar que el chunk no crezca sin razón

2. **Optimizaciones adicionales (si es necesario):**
   - Si el chunk sigue siendo >200KB, considerar alternativas más ligeras
   - Analizar qué componentes específicos de Recharts se están usando
   - Considerar tree shaking más agresivo

3. **Documentación:**
   - Actualizar métricas en `ANALISIS_RECHARTS_DETALLADO.md`
   - Documentar cualquier optimización adicional

## Referencias

- [Análisis Detallado](./ANALISIS_RECHARTS_DETALLADO.md)
- [Plan de Optimización](../../.cursor/plans/optimización_chunk_recharts_670kb_120616e3.plan.md)
- [Next.js Dynamic Imports](https://nextjs.org/docs/pages/building-your-application/optimizing/lazy-loading)
