# 🎨 Plan de Implementación: Paint Visualizer AR con Gemini API

## 📋 Resumen

Implementación de un visualizador AR de pintura que permite a los usuarios:
- Seleccionar productos con colores (hex codes)
- Capturar fotos con la cámara o subir imágenes
- Indicar áreas a pintar con un puntero/dibujo
- Visualizar el resultado con el color seleccionado
- Integración con Gemini API para análisis (opcional)

---

## 🎯 Objetivos

1. **Funcionalidad Core**: Visualización AR de colores en imágenes
2. **UX/UI**: Interfaz intuitiva y responsive
3. **Performance**: Optimizado para móviles y desktop
4. **Seguridad**: Rate limiting para proteger la API
5. **Escalabilidad**: Preparado para alto tráfico

---

## 📦 Estructura de Archivos

```
src/
├── app/
│   └── api/
│       └── paint-visualizer/
│           └── generate/
│               └── route.ts          # API route con rate limiting
├── components/
│   └── PaintVisualizer/
│       ├── PaintVisualizer.tsx       # Componente principal
│       ├── PaintVisualizerCard.tsx   # Card para grids
│       └── types.ts                  # Tipos TypeScript
├── hooks/
│   └── usePaintProducts.ts           # Hook para productos con colores
└── lib/
    └── rate-limiting/
        └── rate-limiter.ts           # Actualizar configs
```

---

## 🔧 Tareas de Implementación

### Fase 1: Configuración Base ⚙️

#### 1.1 Configurar Rate Limits
**Archivo**: `src/lib/rate-limiting/rate-limiter.ts`

- [ ] Agregar configuración `paintVisualizer` a `RATE_LIMIT_CONFIGS`
- [ ] Configuración:
  - **Dev**: 50 requests/minuto
  - **Prod**: 10 requests/5 minutos
  - Mensaje personalizado en español

```typescript
paintVisualizer: {
  windowMs: isDevelopment ? 60 * 1000 : 5 * 60 * 1000,
  maxRequests: isDevelopment ? 50 : 10,
  message: 'Límite de visualizaciones excedido. Intente en 5 minutos.',
}
```

#### 1.2 Variables de Entorno
**Archivo**: `env.example`

- [ ] Agregar `GEMINI_API_KEY=tu_api_key_aqui`
- [ ] Documentar cómo obtener la API key

---

### Fase 2: Tipos y Interfaces 📝

#### 2.1 Crear Tipos TypeScript
**Archivo**: `src/components/PaintVisualizer/types.ts`

- [ ] Interface `PaintProduct`
- [ ] Interface `PaintColor`
- [ ] Interface `PaintRequest`
- [ ] Interface `PaintResponse`
- [ ] Interface `PaintVisualizerProps`

---

### Fase 3: API Route 🚀

#### 3.1 Crear API Route
**Archivo**: `src/app/api/paint-visualizer/generate/route.ts`

**Funcionalidades**:
- [ ] Validar request body (imageBase64, colorHex, colorName)
- [ ] Aplicar rate limiting usando `withRateLimit`
- [ ] Integración con Gemini Vision API
- [ ] Manejo de errores robusto
- [ ] Validación de imagen (tamaño, formato)
- [ ] Headers de rate limiting en respuesta

**Rate Limiting**:
```typescript
import { withRateLimit, RATE_LIMIT_CONFIGS } from '@/lib/rate-limiting/rate-limiter'

export async function POST(request: NextRequest) {
  return withRateLimit(request, RATE_LIMIT_CONFIGS.paintVisualizer, async () => {
    // Lógica de la API
  })
}
```

**Validaciones**:
- Tamaño máximo de imagen: 5MB
- Formatos permitidos: JPEG, PNG, WebP
- Color hex válido
- API key configurada

---

### Fase 4: Hook de Productos 🎣

#### 4.1 Crear Hook usePaintProducts
**Archivo**: `src/hooks/usePaintProducts.ts`

**Funcionalidades**:
- [ ] Obtener productos con colores desde API
- [ ] Extraer colores únicos de variantes
- [ ] Mapear nombres de colores a hex codes
- [ ] Filtrar productos sin colores
- [ ] Manejo de estados (loading, error)
- [ ] Cache de resultados

**Datos requeridos**:
- Producto: id, name, brand, image
- Colores: name, hex, variantId (opcional)

---

### Fase 5: Componentes UI 🎨

#### 5.1 Componente Principal PaintVisualizer
**Archivo**: `src/components/PaintVisualizer/PaintVisualizer.tsx`

**Funcionalidades**:
- [ ] Modal/Dialog con estado abierto/cerrado
- [ ] Selector de productos (grid de productos con colores)
- [ ] Selector de colores (pills con preview)
- [ ] Captura de cámara (getUserMedia)
- [ ] Upload de imagen desde archivo
- [ ] Canvas para dibujar/seleccionar áreas
- [ ] Aplicación de color en tiempo real
- [ ] Preview del resultado
- [ ] Descarga de imagen resultante
- [ ] Reset/limpiar
- [ ] Loading states
- [ ] Manejo de errores con toast/alert

**Interacciones**:
- Mouse: dibujo continuo
- Touch: soporte para móviles
- Canvas: overlay sobre imagen para selección
- Blend modes: multiply/overlay para realismo

#### 5.2 Componente Card PaintVisualizerCard
**Archivo**: `src/components/PaintVisualizer/PaintVisualizerCard.tsx`

**Funcionalidades**:
- [ ] Card similar a HelpCard
- [ ] Diseño responsive (mobile/desktop)
- [ ] Imagen de fondo atractiva
- [ ] Badge "AR" o "AI"
- [ ] Botón CTA llamativo
- [ ] Hover effects
- [ ] Integración con PaintVisualizer modal

**Estilos**:
- Mismo tamaño que ProductCard
- Gradiente morado/azul para diferenciación
- Badge AR con icono Sparkles

---

### Fase 6: Integración 🔗

#### 6.1 Integrar en Grids de Productos
**Archivos**: 
- `src/components/Home-v2/BestSeller/index.tsx`
- `src/components/Checkout/ProductGridInfinite.tsx`

- [ ] Importar `PaintVisualizerCard`
- [ ] Agregar al grid (alternar o junto con HelpCard)
- [ ] Mantener lógica de `shouldShowHelpCard`
- [ ] Testing en diferentes dispositivos

---

### Fase 7: Manejo de Errores y UX 🛡️

#### 7.1 Errores y Feedback
- [ ] Mensajes de error claros en español
- [ ] Toast notifications para feedback
- [ ] Loading states durante procesamiento
- [ ] Mensajes informativos (permisos de cámara, etc.)
- [ ] Fallbacks cuando Gemini API falla

#### 7.2 Validaciones Frontend
- [ ] Validar selección de producto y color
- [ ] Validar imagen antes de enviar
- [ ] Mostrar límites de rate limiting al usuario
- [ ] Disable buttons durante procesamiento

---

### Fase 8: Optimizaciones ⚡

#### 8.1 Performance
- [ ] Lazy loading de componentes pesados
- [ ] Compresión de imágenes antes de enviar
- [ ] Debounce en dibujo de canvas
- [ ] Memoización de componentes
- [ ] Optimización de re-renders

#### 8.2 Accesibilidad
- [ ] ARIA labels
- [ ] Keyboard navigation
- [ ] Focus management
- [ ] Screen reader support

---

## 🔒 Rate Limiting - Especificaciones Detalladas

### Configuración

```typescript
paintVisualizer: {
  windowMs: 5 * 60 * 1000,        // 5 minutos
  maxRequests: 10,                 // 10 requests por ventana
  message: 'Límite de visualizaciones excedido. Intente en 5 minutos.',
  headers: true,                   // Incluir headers informativos
  standardHeaders: true,           // Headers RFC 6585
  legacyHeaders: true,             // Headers legacy
}
```

### Headers de Respuesta

- `RateLimit-Limit`: Límite máximo
- `RateLimit-Remaining`: Requests restantes
- `RateLimit-Reset`: Timestamp de reset
- `Retry-After`: Segundos hasta próximo intento (si excedido)

### Implementación en API Route

```typescript
import { withRateLimit, RATE_LIMIT_CONFIGS } from '@/lib/rate-limiting/rate-limiter'

export async function POST(request: NextRequest) {
  return withRateLimit(
    request,
    RATE_LIMIT_CONFIGS.paintVisualizer,
    async () => {
      // Validación de request
      // Procesamiento
      // Respuesta
    }
  )
}
```

### Manejo de Rate Limit Excedido

- Status: 429 Too Many Requests
- Body: Mensaje en español con `retryAfter`
- Headers: Información de rate limit
- Frontend: Mostrar mensaje al usuario con countdown

---

## 📊 Testing Checklist

### Funcional
- [ ] Selección de producto funciona
- [ ] Selección de color funciona
- [ ] Captura de cámara funciona
- [ ] Upload de imagen funciona
- [ ] Dibujo en canvas funciona
- [ ] Aplicación de color funciona
- [ ] Descarga de resultado funciona
- [ ] Reset funciona

### Rate Limiting
- [ ] Rate limit se aplica correctamente
- [ ] Headers se envían correctamente
- [ ] Mensaje de error es claro
- [ ] Frontend maneja 429 correctamente
- [ ] Reset después de ventana funciona

### Cross-browser
- [ ] Chrome/Edge
- [ ] Firefox
- [ ] Safari
- [ ] Mobile browsers

### Responsive
- [ ] Mobile (< 768px)
- [ ] Tablet (768px - 1024px)
- [ ] Desktop (> 1024px)

---

## 📚 Dependencias

### Nuevas (si es necesario)
- Ninguna nueva (usar librerías existentes)

### Existentes
- `next/image` - Optimización de imágenes
- `react` - Framework
- `@/components/ui/dialog` - Modal
- `@/components/ui/button` - Botones
- `@/lib/rate-limiting` - Rate limiting
- Canvas API nativo - Dibujo

---

## 🚀 Orden de Implementación Recomendado

1. ✅ **Fase 1**: Configuración base (rate limits, env vars)
2. ✅ **Fase 2**: Tipos TypeScript
3. ✅ **Fase 3**: API Route con rate limiting
4. ✅ **Fase 4**: Hook usePaintProducts
5. ✅ **Fase 5**: Componente PaintVisualizer
6. ✅ **Fase 5**: Componente PaintVisualizerCard
7. ✅ **Fase 6**: Integración en grids
8. ✅ **Fase 7**: Manejo de errores y UX
9. ✅ **Fase 8**: Optimizaciones

---

## 📝 Notas Importantes

1. **Gemini API**: Opcional para análisis. El pintado se hace en canvas del navegador.
2. **Rate Limiting**: Crítico para evitar abuso y costos excesivos.
3. **Cámara**: Requiere permisos. Manejar denegación gracefully.
4. **Canvas**: Performance crítico en móviles. Optimizar dibujo.
5. **Imágenes**: Validar tamaño y formato antes de procesar.
6. **Colores**: Usar hex codes de la base de datos/productos reales.

---

## 🔄 Próximos Pasos (Futuro)

- [ ] Guardar visualizaciones en perfil de usuario
- [ ] Compartir visualizaciones
- [ ] Historial de colores probados
- [ ] Comparar antes/después
- [ ] Integración con carrito (agregar producto desde visualización)
- [ ] Analytics de uso
- [ ] Mejoras con Gemini Vision API (detección automática de paredes)

---

## ✅ Checklist Final

- [ ] Todo el código implementado
- [ ] Rate limiting funcionando
- [ ] Testing completo
- [ ] Documentación actualizada
- [ ] Variables de entorno configuradas
- [ ] Deploy a staging
- [ ] Testing en producción
- [ ] Monitoreo de errores configurado





