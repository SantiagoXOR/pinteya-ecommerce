# Sistema de Analytics - Pinteya E-commerce

## 🎯 Funcionalidades Implementadas

### ✅ Fase 6 Completada: Sistema de Analytics y Métricas

#### 1. Sistema de Tracking de Eventos

- **Archivo**: `src/lib/analytics.ts`
- **Hook**: `src/hooks/useAnalytics.ts`
- **Funcionalidades**:
  - Tracking automático de clicks, hovers, scroll
  - Eventos de e-commerce (vista producto, carrito, checkout, compra)
  - Métricas de conversión en tiempo real
  - Almacenamiento en Supabase y Google Analytics

#### 2. Dashboard de Analytics

- **Componente**: `src/components/Analytics/AnalyticsDashboard.tsx`
- **Página**: `src/app/admin/analytics/page.tsx`
- **Funcionalidades**:
  - Métricas principales (vistas, conversiones, AOV)
  - Métricas de engagement (sesiones, usuarios, duración)
  - Top productos y páginas más visitadas
  - Métricas en tiempo real

#### 3. Embudo de Conversión

- **Componente**: `src/components/Analytics/ConversionFunnel.tsx`
- **Funcionalidades**:
  - Visualización del flujo de conversión
  - Tasas de conversión por etapa
  - Identificación de puntos de abandono
  - Recomendaciones automáticas

#### 4. Heatmaps de Interacciones

- **Componente**: `src/components/Analytics/HeatmapViewer.tsx`
- **Funcionalidades**:
  - Visualización de clicks, hovers y scroll
  - Overlay de calor sobre contenido
  - Análisis de zonas de mayor actividad
  - Insights automáticos

#### 5. Integración Google Analytics 4

- **Archivo**: `src/lib/google-analytics.ts`
- **Componente**: `src/components/Analytics/GoogleAnalytics.tsx`
- **Funcionalidades**:
  - Enhanced E-commerce tracking
  - Eventos personalizados
  - Configuración de usuario
  - Consentimiento de cookies

#### 6. APIs de Analytics

- **Eventos**: `src/app/api/analytics/events/route.ts`
- **Métricas**: `src/app/api/analytics/metrics/route.ts`
- **Funcionalidades**:
  - Almacenamiento de eventos
  - Cálculo de métricas agregadas
  - Filtros por fecha, usuario, sesión
  - Optimización de consultas

## 🚀 Cómo Usar

### 1. Configuración Básica

```tsx
import { useAnalytics } from '@/hooks/useAnalytics'

const MyComponent = () => {
  const { trackEvent, trackProductView } = useAnalytics()

  const handleClick = () => {
    trackEvent('button_click', 'ui', 'click', 'my-button')
  }

  return <button onClick={handleClick}>Click me</button>
}
```

### 2. Tracking de E-commerce

```tsx
import { useTrackEcommerce } from '@/components/Analytics/AnalyticsProvider'

const ProductCard = ({ product }) => {
  const { trackProductView, trackAddToCart } = useTrackEcommerce()

  useEffect(() => {
    trackProductView(product.id, product.name, product.category, product.price)
  }, [])

  const handleAddToCart = () => {
    trackAddToCart(product.id, product.name, product.price, 1)
  }

  return (
    <div>
      <h3>{product.name}</h3>
      <button onClick={handleAddToCart}>Agregar al carrito</button>
    </div>
  )
}
```

### 3. Tracking Automático

```tsx
import { withAnalytics } from '@/components/Analytics/AnalyticsProvider'

const MyComponent = () => {
  return <div>Mi componente</div>
}

export default withAnalytics(MyComponent, 'MyComponent')
```

## 📊 Métricas Disponibles

### E-commerce

- Vistas de productos
- Agregados al carrito
- Checkouts iniciados
- Compras completadas
- Tasa de conversión
- Valor promedio de orden
- Tasa de abandono de carrito

### Engagement

- Sesiones únicas
- Usuarios únicos
- Duración promedio de sesión
- Eventos por sesión
- Páginas más visitadas
- Productos más vistos

### Comportamiento

- Heatmaps de clicks
- Patrones de scroll
- Interacciones por elemento
- Flujo de navegación

## 🔧 Configuración

### Variables de Entorno

```env
# Supabase (REQUERIDO)
NEXT_PUBLIC_SUPABASE_URL=tu_supabase_url
SUPABASE_SERVICE_ROLE_KEY=tu_service_role_key

# Google Analytics 4 (OPCIONAL)
NEXT_PUBLIC_GA_ID=G-XXXXXXXXXX
```

### Base de Datos

Aplicar migración: `supabase/migrations/20250105_create_analytics_tables.sql`

### Permisos

- Dashboard de analytics: Solo usuarios con role 'admin'
- Inserción de eventos: Todos los usuarios
- Lectura de métricas: Solo administradores

## 🎮 Demo

Visita `/demo/analytics` para ver el sistema en acción.

## 📈 Próximas Mejoras

- Reportes automáticos por email
- Alertas de métricas
- Segmentación de usuarios
- A/B testing integrado
- Exportación de datos avanzada
