# Rules: Performance y Optimización

## Objetivos de Performance

Este proyecto tiene objetivos estrictos de performance. **TODAS** las implementaciones deben cumplirlos.

## Métricas Objetivo

- **First Load JS**: < 500KB
- **Build Time**: < 20s
- **API Response Time**: < 300ms
- **Lighthouse Performance Score**: > 85
- **Time to Interactive**: < 3.5s
- **Largest Contentful Paint**: < 2.5s

## Reglas de Performance

### 1. Code Splitting

- **SIEMPRE** usar `dynamic()` de Next.js para componentes pesados
- Lazy load componentes no críticos:
  ```typescript
  const HeavyComponent = dynamic(() => import('./HeavyComponent'), {
    loading: () => <Skeleton />,
    ssr: false // Solo si no necesita SSR
  });
  ```

### 2. Imágenes

- **SIEMPRE** usar `next/image` para imágenes
- **SIEMPRE** especificar `width` y `height` o usar `fill`
- Usar formatos modernos: WebP, AVIF cuando sea posible
- Lazy load imágenes fuera del viewport

### 3. Bundle Size

- **NUNCA** importar librerías completas si solo necesitas una función
  ```typescript
  // ❌ Incorrecto
  import _ from 'lodash';
  
  // ✅ Correcto
  import debounce from 'lodash/debounce';
  ```
- Monitorear bundle size con `npm run analyze`

### 4. React Optimization

- **SIEMPRE** usar `React.memo()` para componentes que reciben props que no cambian frecuentemente
- **SIEMPRE** usar `useCallback()` para funciones pasadas como props
- **SIEMPRE** usar `useMemo()` para cálculos costosos

### 5. API Optimization

- **SIEMPRE** implementar caching en APIs cuando sea apropiado
- Usar Redis para cache de datos frecuentes
- Implementar paginación en listados grandes
- Limitar campos retornados (no usar `SELECT *`)

### 6. Database Queries

- **SIEMPRE** usar índices apropiados
- **NUNCA** hacer N+1 queries
- Usar `.select()` específico en Supabase (no `*`)
- Implementar paginación con `.range()`

### 7. CSS y Estilos

- **SIEMPRE** usar Tailwind CSS (ya está configurado)
- **NUNCA** importar CSS pesados innecesarios
- Usar `@apply` con moderación
- Evitar CSS inline en componentes grandes

### 8. Third-Party Scripts

- **SIEMPRE** cargar scripts de terceros de forma asíncrona
- Usar `next/script` con estrategia apropiada:
  ```typescript
  <Script src="..." strategy="lazyOnload" />
  ```

### 9. Monitoring

- **SIEMPRE** monitorear métricas de performance
- Usar Web Vitals API
- Implementar logging de performance en producción

### 10. Build Optimization

- Verificar bundle size después de cada cambio significativo
- Ejecutar `npm run analyze` antes de mergear PRs grandes
- Revisar chunks generados

## Archivos Clave

- `next.config.js` - Configuración de optimización
- `src/lib/recharts-lazy.tsx` - Ejemplo de lazy loading
- `scripts/performance/` - Scripts de análisis

## Comandos de Performance

```bash
npm run analyze              # Analizar bundle
npm run analyze:recharts     # Analizar chunk de Recharts
npm run lighthouse           # Lighthouse audit
npm run optimize:images      # Optimizar imágenes
```
