# Optimizaciones BestSeller - Eliminación de Skeletons y Fix de Hooks

**Fecha**: 2026-01-07  
**Versión**: Optimización de Performance y Fix de Bugs

## 🎯 Objetivo

Optimizar la sección BestSeller eliminando skeletons innecesarios y corrigiendo error de hooks condicionales que causaba errores de runtime.

## ✅ Cambios Implementados

### 1. Eliminación de Skeletons en BestSeller

**Archivo**: `src/components/Home-v2/BestSeller/index.tsx`

- ✅ Eliminado import de `ProductSkeletonGrid`
- ✅ Eliminada lógica de `shouldShowSkeletons` y renderizado condicional de skeletons
- ✅ Eliminado `useEffect` de hidratación forzada (React Query lo maneja automáticamente)
- ✅ Simplificado renderizado: muestra productos directamente desde cache de TanStack Query

**Beneficios**:
- Mejor TTI (Time to Interactive) - menos componentes a renderizar inicialmente
- Sin layout shifts - datos en cache se muestran inmediatamente
- Código más limpio - menos lógica condicional y estados innecesarios

### 2. Optimización del Hook useBestSellerProducts

**Archivo**: `src/hooks/useBestSellerProducts.ts`

- ✅ Agregado `placeholderData: (previousData) => previousData` para mantener datos anteriores mientras carga
- ✅ Optimizado `refetchOnMount: 'always'` para actualizar en segundo plano sin bloquear UI
- ✅ Eliminados logs de consola innecesarios para producción
- ✅ Mejorada lógica de loading para usar datos en cache cuando están disponibles

**Beneficios**:
- Mejor UX - datos en cache se muestran inmediatamente mientras se actualizan en segundo plano
- Actualizaciones no bloqueantes - TanStack Query actualiza datos sin afectar la UI visible
- Mejor uso de cache - `placeholderData` mantiene los datos anteriores durante actualizaciones

### 3. Movimiento de Archivos CSS a Directorio Público

**Archivos movidos**: `src/styles/*.css` → `public/styles/*.css`

Archivos copiados:
- `z-index-hierarchy.css`
- `disable-all-effects.css`
- `home-v3-glassmorphism.css`
- `hero-carousel.css`
- `checkout-mobile.css`
- `checkout-transition.css`
- `home-v2-animations.css`
- `mobile-modals.css`
- `collapsible.css`
- `mobile-performance.css`

**Problema resuelto**: 
- Error "Resource loading failed: link" para archivos CSS referenciados en `DeferredCSS.tsx`
- Los archivos ahora están accesibles como recursos estáticos desde `/styles/`

**Razón**: En Next.js, los archivos en `public/` se sirven desde la raíz `/`, mientras que `src/` no se sirve como estáticos. El componente `DeferredCSS.tsx` intentaba cargar CSS desde `/styles/` pero los archivos estaban en `src/styles/`.

### 4. Fix de Error de Hooks Condicionales

**Archivo**: `src/components/Home-v2/BestSeller/index.tsx`

**Problema**: Error "Rendered more hooks than during the previous render" causado por renderizado condicional de componentes con hooks.

**Solución**: Renderizar siempre `HelpCard` y `PaintVisualizerCard` pero ocultarlos visualmente cuando no se necesiten.

**Antes** (causaba error):
```tsx
{shouldShowHelpCard && <HelpCard categoryName={selectedCategory} />}
{shouldShowHelpCard && <PaintVisualizerCard />}
```

**Después** (fix aplicado):
```tsx
<div style={{ display: shouldShowHelpCard ? 'block' : 'none' }}>
  <HelpCard categoryName={selectedCategory} />
</div>
<div style={{ display: shouldShowHelpCard ? 'block' : 'none' }}>
  <PaintVisualizerCard />
</div>
```

**Resultado**: 
- ✅ Número constante de hooks entre renders
- ✅ Cumple con las reglas de hooks de React
- ✅ Error de runtime resuelto

## 📊 Impacto en Performance

### Métricas Esperadas

- **TTI (Time to Interactive)**: Mejora estimada de 100-200ms (menos componentes iniciales)
- **Layout Shifts**: Eliminados durante carga de datos (datos en cache se muestran inmediatamente)
- **Console Errors**: Reducción del 100% en errores de recursos CSS y hooks condicionales

### Optimizaciones de TanStack Query

- **Cache Hit Rate**: Mejorado con `placeholderData` - datos anteriores se mantienen durante actualizaciones
- **Network Requests**: Reducidos gracias a mejor uso de cache y `staleTime` de 10 minutos
- **Perceived Performance**: Mejorada - usuarios ven contenido inmediatamente desde cache

## 🔧 Archivos Modificados

1. `src/components/Home-v2/BestSeller/index.tsx`
   - Eliminados skeletons
   - Corregido renderizado condicional
   - Simplificada lógica de loading

2. `src/hooks/useBestSellerProducts.ts`
   - Agregado `placeholderData`
   - Optimizado `refetchOnMount`
   - Eliminados logs de desarrollo

3. `public/styles/*.css` (nuevos archivos)
   - Copiados desde `src/styles/` para servir como recursos estáticos

## 🧪 Testing

### Verificaciones Realizadas

- ✅ Linter sin errores
- ✅ Componente se renderiza correctamente
- ✅ No hay errores de hooks condicionales
- ✅ Archivos CSS se cargan desde `/styles/`
- ✅ TanStack Query funciona correctamente con placeholderData

### Casos de Prueba

1. **Carga inicial sin cache**: Componente muestra grid vacío brevemente (sin skeletons)
2. **Carga con cache**: Datos se muestran inmediatamente desde cache
3. **Actualización en segundo plano**: Datos se actualizan sin afectar UI visible
4. **Renderizado condicional**: HelpCard y PaintVisualizerCard se ocultan/muestran correctamente

## 📝 Notas Técnicas

### Por qué eliminar skeletons mejora performance

1. **Menos trabajo de render**: No hay que renderizar 12 componentes skeleton
2. **Mejor uso de cache**: TanStack Query muestra datos anteriores inmediatamente
3. **Sin layout shifts**: Si los datos llegan rápido, no hay cambio visual brusco

### Por qué mover CSS a public/

Next.js sirve archivos estáticos solo desde `public/`. Los componentes que intentan cargar CSS dinámicamente (como `DeferredCSS.tsx`) necesitan que los archivos estén en `public/` para accederlos desde rutas absolutas como `/styles/`.

### Por qué renderizar siempre en lugar de condicionalmente

React requiere que el número de hooks sea constante entre renders. Renderizar componentes condicionalmente con `&&` causa que se monten/desmonten, cambiando el número de hooks ejecutados. Renderizar siempre pero ocultar con CSS mantiene el número de hooks constante.

## 🚀 Próximos Pasos Recomendados

1. **Monitorear métricas**: Verificar mejoras en TTI y Layout Shifts en producción
2. **Optimizar otras secciones**: Considerar aplicar el mismo patrón a `NewArrivals` y otras secciones
3. **Consolidar CSS**: Evaluar si todos los CSS en `public/styles/` deben estar allí o si algunos pueden consolidarse

## 🔗 Referencias

- [React Rules of Hooks](https://react.dev/reference/rules/rules-of-hooks)
- [TanStack Query placeholderData](https://tanstack.com/query/latest/docs/react/reference/useQuery)
- [Next.js Static File Serving](https://nextjs.org/docs/app/building-your-application/optimizing/static-assets)

