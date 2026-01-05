# 🧪 Guía de Testing de Rerenders

## 📋 Resumen

Se han implementado optimizaciones para reducir rerenders excesivos durante la carga de la aplicación. Esta guía explica cómo verificar que las optimizaciones están funcionando correctamente.

## ✅ Optimizaciones Implementadas

1. **CartModalContext** - Memoización del value del contexto
2. **useDevicePerformance** - Diferir detección de performance
3. **useGeolocation** - Optimizar verificación de permisos
4. **Header Component** - Optimizar selectores y efectos

## 🔍 Métodos de Testing

### Método 1: React DevTools Profiler (Recomendado)

**Pasos:**

1. Instalar React DevTools en el navegador (Chrome/Firefox)
2. Abrir la aplicación en desarrollo: `npm run dev`
3. Abrir DevTools → Pestaña "Profiler"
4. Hacer clic en el botón de grabación (círculo rojo)
5. Recargar la página (F5)
6. Esperar 5-10 segundos
7. Detener la grabación

**Qué buscar:**

- **Total de renders**: Debería ser < 50 durante la carga inicial
- **Componentes que más se rerenderizan**: 
  - Header: < 10 rerenders
  - CategoryTogglePills: < 5 rerenders
  - CartModalProvider: < 3 rerenders
- **Tiempo de render**: Cada render debería ser < 16ms (60 FPS)

**Análisis:**

1. Filtrar por "Why did this render?"
2. Buscar componentes con muchos rerenders
3. Verificar que los rerenders sean necesarios (props/state cambiaron)
4. Identificar rerenders innecesarios (mismo props/state)

### Método 2: Console Logs

**Pasos:**

1. Abrir la aplicación en desarrollo
2. Abrir DevTools → Console
3. Filtrar por "🔄" o "re-render"
4. Recargar la página
5. Contar los logs de rerenders

**Qué buscar:**

- Logs con formato: `🔄 ComponentName re-rendered`
- Total de logs durante la carga inicial
- Componentes que aparecen frecuentemente

### Método 3: Script de Monitoreo (Puppeteer)

**Requisitos:**

```bash
npm install puppeteer --save-dev
```

**Ejecutar:**

```bash
# Terminal 1: Iniciar la aplicación
npm run dev

# Terminal 2: Ejecutar el script de monitoreo
node scripts/monitor-rerenders.js
```

**Qué hace:**

- Abre un navegador automatizado
- Captura todos los console.log relacionados con rerenders
- Analiza y muestra estadísticas
- Detecta patrones problemáticos

### Método 4: Playwright Test (Cuando esté disponible)

**Ejecutar:**

```bash
npx playwright test rerender-investigation
```

**Nota:** Actualmente hay un problema con la configuración de Playwright que impide ejecutar los tests. Se está trabajando en solucionarlo.

## 📊 Métricas Objetivo

### Carga Inicial

- **Total de rerenders**: < 50
- **Header**: < 10 rerenders
- **CategoryTogglePills**: < 5 rerenders
- **CartModalProvider**: < 3 rerenders
- **Otros componentes**: < 5 rerenders cada uno

### Durante Interacciones

- **Scroll**: < 5 rerenders por acción
- **Click**: < 3 rerenders por acción
- **Input**: < 2 rerenders por keystroke (con debounce)

### Performance

- **Tiempo de render**: < 16ms por componente (60 FPS)
- **FCP (First Contentful Paint)**: < 1.8s
- **LCP (Largest Contentful Paint)**: < 2.5s
- **TTI (Time to Interactive)**: < 3.8s

## 🔧 Debugging

### Si detectas muchos rerenders:

1. **Verificar React DevTools Profiler**
   - Abrir Profiler
   - Grabar durante la carga
   - Filtrar por "Why did this render?"
   - Identificar la causa raíz

2. **Revisar Context Providers**
   - Verificar que los values estén memoizados
   - Usar `useMemo` para valores calculados
   - Usar `useCallback` para funciones

3. **Revisar Selectores de Redux**
   - Verificar que usen `shallowEqual` cuando sea necesario
   - Evitar crear nuevos objetos en selectores
   - Memoizar selectores complejos

4. **Revisar Hooks Personalizados**
   - Verificar que no actualicen estado innecesariamente
   - Usar `useRef` para valores que no causan rerenders
   - Diferir trabajo no crítico con `requestIdleCallback`

### Componentes Problemáticos Comunes

1. **Header**
   - Verificar `useGeolocation` - debería diferirse
   - Verificar `useDevicePerformance` - debería diferirse
   - Verificar selectores de Redux - deberían estar memoizados

2. **CategoryTogglePills**
   - Verificar que `useProductFilters` no cause rerenders innecesarios
   - Verificar que los callbacks estén memoizados

3. **CartModalProvider**
   - Verificar que el value del contexto esté memoizado
   - Verificar que los callbacks estén memoizados

## 📝 Reporte de Problemas

Si detectas rerenders excesivos:

1. **Capturar información:**
   - Screenshot del React DevTools Profiler
   - Console logs de rerenders
   - Métricas de performance

2. **Identificar el componente:**
   - Nombre del componente
   - Número de rerenders
   - Props/state que cambian

3. **Documentar:**
   - Crear un issue con la información capturada
   - Incluir pasos para reproducir
   - Incluir métricas antes/después

## 🎯 Próximos Pasos

1. **Ejecutar React DevTools Profiler** para obtener métricas reales
2. **Comparar métricas antes/después** de las optimizaciones
3. **Identificar componentes adicionales** que puedan necesitar optimización
4. **Documentar mejoras** en el rendimiento

## 📚 Recursos

- [React DevTools Profiler](https://react.dev/learn/react-developer-tools#profiler)
- [React Performance Optimization](https://react.dev/learn/render-and-commit#optimizing-performance)
- [Redux Performance](https://redux.js.org/usage/deriving-data-selectors#optimizing-selectors-with-memoization)

