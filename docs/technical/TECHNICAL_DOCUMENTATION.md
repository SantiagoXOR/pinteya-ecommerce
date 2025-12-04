# 📚 Pinteya E-commerce - Documentación Técnica Completa

## 🏗️ Arquitectura del Sistema

### Stack Tecnológico

- **Frontend**: Next.js 15 con App Router
- **Backend**: Next.js API Routes
- **Base de Datos**: Supabase (PostgreSQL)
- **Autenticación**: Supabase Auth
- **Pagos**: MercadoPago
- **Styling**: Tailwind CSS + shadcn/ui
- **Estado**: React Context + Hooks
- **Cache**: Redis + Multi-layer caching
- **Monitoreo**: Sistema custom de performance y alertas
- **Testing**: Jest + React Testing Library

### Estructura de Carpetas

```
src/
├── app/                          # Next.js App Router
│   ├── (site)/                   # Rutas públicas
│   ├── admin/                    # Panel administrativo
│   ├── api/                      # API Routes
│   └── globals.css               # Estilos globales
├── components/                   # Componentes React
│   ├── ui/                       # Componentes base (shadcn/ui)
│   ├── admin/                    # Componentes administrativos
│   └── site/                     # Componentes del sitio
├── lib/                          # Librerías y utilidades
│   ├── cache/                    # Sistema de cache
│   ├── monitoring/               # Sistema de monitoreo
│   ├── security/                 # Utilidades de seguridad
│   └── utils/                    # Utilidades generales
├── hooks/                        # React Hooks personalizados
├── providers/                    # Context Providers
├── config/                       # Configuraciones
└── types/                        # Definiciones TypeScript
```

## 🔧 Configuración del Proyecto

### Variables de Entorno

```bash
# Base de datos
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key

# MercadoPago
NEXT_PUBLIC_MERCADOPAGO_PUBLIC_KEY=your_mp_public_key
MERCADOPAGO_ACCESS_TOKEN=your_mp_access_token

# Redis
REDIS_URL=your_redis_url

# Monitoreo
SLACK_WEBHOOK_URL=your_slack_webhook
MONITORING_EMAIL_ALERTS=admin@pinteya.com

# Configuración
NODE_ENV=development|staging|production
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

### Instalación y Setup

```bash
# Clonar repositorio
git clone https://github.com/SantiagoXOR/pinteya-ecommerce.git
cd pinteya-ecommerce

# Instalar dependencias
npm install

# Configurar variables de entorno
cp .env.example .env.local
# Editar .env.local con tus valores

# Ejecutar migraciones de base de datos
npm run db:migrate

# Iniciar en desarrollo
npm run dev

# Construir para producción
npm run build
npm start
```

## 🗄️ Base de Datos

### Esquema Principal

#### Tabla: products

```sql
CREATE TABLE products (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(255) NOT NULL,
  description TEXT,
  price DECIMAL(10,2) NOT NULL,
  category_id UUID REFERENCES categories(id),
  image_url TEXT,
  stock INTEGER DEFAULT 0,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);
```

#### Tabla: categories

```sql
CREATE TABLE categories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(255) NOT NULL,
  description TEXT,
  parent_id UUID REFERENCES categories(id),
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP DEFAULT NOW()
);
```

#### Tabla: orders

```sql
CREATE TABLE orders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id),
  status VARCHAR(50) DEFAULT 'pending',
  total_amount DECIMAL(10,2) NOT NULL,
  payment_id VARCHAR(255),
  payment_status VARCHAR(50),
  shipping_address JSONB,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);
```

### Row Level Security (RLS)

```sql
-- Productos: Lectura pública, escritura solo admin
ALTER TABLE products ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Products are viewable by everyone" ON products
  FOR SELECT USING (is_active = true);

CREATE POLICY "Products are editable by admin" ON products
  FOR ALL USING (
    auth.jwt() ->> 'role' = 'admin'
  );

-- Órdenes: Solo el usuario propietario
CREATE POLICY "Users can view own orders" ON orders
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can create own orders" ON orders
  FOR INSERT WITH CHECK (auth.uid() = user_id);
```

## 🔌 APIs

### Estructura de APIs

Todas las APIs siguen un patrón consistente:

```typescript
// Estructura de respuesta estándar
interface APIResponse<T> {
  success: boolean
  data?: T
  error?: string
  message?: string
  timestamp: number
}

// Manejo de errores estándar
try {
  // Lógica de la API
  return NextResponse.json({
    success: true,
    data: result,
    timestamp: Date.now(),
  })
} catch (error) {
  return NextResponse.json(
    {
      success: false,
      error: error.message,
      timestamp: Date.now(),
    },
    { status: 500 }
  )
}
```

### APIs Principales

#### Productos

**GET /api/products**

```typescript
// Parámetros de consulta
interface ProductsQuery {
  page?: number
  limit?: number
  category?: string
  search?: string
  sort?: 'name' | 'price' | 'created_at'
  order?: 'asc' | 'desc'
}

// Respuesta
interface ProductsResponse {
  products: Product[]
  pagination: {
    page: number
    limit: number
    total: number
    totalPages: number
  }
}
```

**POST /api/products**

```typescript
// Body de la request
interface CreateProductRequest {
  name: string
  description?: string
  price: number
  category_id: string
  image_url?: string
  stock?: number
}
```

#### Carrito

**POST /api/cart**

```typescript
// Agregar producto al carrito
interface AddToCartRequest {
  product_id: string
  quantity: number
}

// Respuesta
interface CartResponse {
  cart: CartItem[]
  total: number
  itemCount: number
}
```

#### Órdenes

**POST /api/orders**

```typescript
// Crear orden
interface CreateOrderRequest {
  items: Array<{
    product_id: string
    quantity: number
    price: number
  }>
  shipping_address: {
    street: string
    city: string
    state: string
    zip_code: string
    country: string
  }
  payment_method: 'mercadopago'
}
```

### Middleware de Seguridad

Todas las APIs implementan:

1. **Rate Limiting**: Límites por IP y usuario
2. **Validación de Input**: Esquemas Zod
3. **Autenticación**: JWT tokens
4. **Autorización**: Verificación de roles
5. **Logging de Seguridad**: Eventos auditables
6. **Timeouts**: Configurables por endpoint

```typescript
// Ejemplo de middleware aplicado
export async function POST(request: NextRequest) {
  // 1. Rate limiting
  await rateLimiter.check(request)

  // 2. Autenticación
  const user = await authenticateUser(request)

  // 3. Validación
  const body = await validateRequest(request, schema)

  // 4. Logging de seguridad
  securityLogger.logDataAccess({
    userId: user.id,
    endpoint: '/api/products',
    action: 'create',
  })

  // 5. Lógica de negocio con timeout
  const result = await TimeoutUtils.withTimeout(
    businessLogic(body),
    TIMEOUTS.INTERNAL_API.PRODUCTS.CREATE
  )

  return NextResponse.json({ success: true, data: result })
}
```

## 🎨 Componentes React

### Estructura de Componentes

```typescript
// Componente base con TypeScript
interface ComponentProps {
  // Props tipadas
}

export const Component: React.FC<ComponentProps> = ({
  prop1,
  prop2
}) => {
  // Hooks
  const [state, setState] = useState();

  // Effects
  useEffect(() => {
    // Side effects
  }, []);

  // Handlers
  const handleAction = useCallback(() => {
    // Event handling
  }, []);

  // Render
  return (
    <div className="tailwind-classes">
      {/* JSX */}
    </div>
  );
};
```

### Hooks Personalizados

#### useCart

```typescript
export const useCart = () => {
  const [cart, setCart] = useState<CartItem[]>([])

  const addToCart = useCallback((product: Product, quantity: number) => {
    // Lógica para agregar al carrito
  }, [])

  const removeFromCart = useCallback((productId: string) => {
    // Lógica para remover del carrito
  }, [])

  const clearCart = useCallback(() => {
    setCart([])
  }, [])

  const total = useMemo(() => {
    return cart.reduce((sum, item) => sum + item.price * item.quantity, 0)
  }, [cart])

  return {
    cart,
    addToCart,
    removeFromCart,
    clearCart,
    total,
    itemCount: cart.length,
  }
}
```

#### useAuth

```typescript
export const useAuth = () => {
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)

  const signIn = async (email: string, password: string) => {
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    })

    if (error) throw error
    return data
  }

  const signOut = async () => {
    await supabase.auth.signOut()
    setUser(null)
  }

  return {
    user,
    loading,
    signIn,
    signOut,
    isAuthenticated: !!user,
  }
}
```

## 🚀 Sistema de Cache

### Arquitectura Multi-Capa

```typescript
// Configuración de capas
const CACHE_LAYERS = {
  MEMORY: { priority: 1, ttl: 300 }, // 5 minutos
  REDIS: { priority: 2, ttl: 3600 }, // 1 hora
  CDN: { priority: 3, ttl: 86400 }, // 24 horas
  BROWSER: { priority: 4, ttl: 1800 }, // 30 minutos
  EDGE: { priority: 5, ttl: 7200 }, // 2 horas
}

// Uso del cache
const cachedData = await multiLayerCacheManager.get('products:popular')
if (!cachedData) {
  const data = await fetchPopularProducts()
  await multiLayerCacheManager.set('products:popular', data, {
    layers: ['MEMORY', 'REDIS'],
    ttl: 3600,
  })
  return data
}
```

### Estrategias de Cache

1. **Cache First**: Prioriza cache, fallback a red
2. **Network First**: Prioriza red, fallback a cache
3. **Stale While Revalidate**: Cache inmediato + actualización en background
4. **Fastest**: Race entre cache y red
5. **Adaptive**: Estrategia dinámica basada en contexto

```typescript
// Aplicar estrategia específica
const data = await advancedCacheStrategyManager.execute(
  'products:category:electronics',
  () => fetchProductsByCategory('electronics'),
  'PRODUCT_DATA' // Configuración predefinida
)
```

## 📊 Sistema de Monitoreo

### Métricas en Tiempo Real

```typescript
// Registrar métricas de performance
realTimePerformanceMonitor.recordWebVitals({
  lcp: 2300, // Largest Contentful Paint
  fid: 85, // First Input Delay
  cls: 0.08, // Cumulative Layout Shift
  fcp: 1600, // First Contentful Paint
  ttfb: 650, // Time to First Byte
})

// Registrar métricas de API
realTimePerformanceMonitor.recordAPIMetrics({
  endpoint: '/api/products',
  method: 'GET',
  responseTime: 450,
  statusCode: 200,
  userAgent: request.headers['user-agent'],
  ip: request.ip,
})
```

### Sistema de Alertas

```typescript
// Configurar alertas
advancedAlertingEngine.configureChannel(AlertChannel.SLACK, {
  channel: AlertChannel.SLACK,
  enabled: true,
  config: {
    webhookUrl: process.env.SLACK_WEBHOOK_URL,
    slackChannel: '#alerts',
  },
  filters: {
    severities: [AlertSeverity.HIGH, AlertSeverity.CRITICAL],
  },
})

// Crear alerta personalizada
await advancedAlertingEngine.createAlert(
  AlertType.PERFORMANCE,
  AlertSeverity.HIGH,
  'Response time crítico detectado',
  'El tiempo de respuesta promedio ha excedido 3 segundos',
  {
    endpoint: '/api/products',
    responseTime: 3200,
    threshold: 3000,
  }
)
```

### Presupuestos de Performance

```typescript
// Registrar métricas contra presupuestos
performanceBudgetsMonitor.recordMeasurement(
  'lcp_mobile', // Budget ID
  2800, // Valor medido
  {
    // Contexto
    device: 'mobile',
    page: '/products',
    network: '4g',
  }
)

// Generar reporte
const report = performanceBudgetsMonitor.generateReport(24) // Últimas 24 horas
console.log(`Score general: ${report.summary.overallScore}/100`)
```

## 🔒 Seguridad

### Autenticación y Autorización

```typescript
// Middleware de autenticación
export const authenticateUser = async (request: NextRequest): Promise<User> => {
  const token = request.headers.get('authorization')?.replace('Bearer ', '')

  if (!token) {
    throw new Error('Token de autenticación requerido')
  }

  const {
    data: { user },
    error,
  } = await supabase.auth.getUser(token)

  if (error || !user) {
    securityLogger.logAuthenticationFailure({
      ip: request.ip,
      userAgent: request.headers.get('user-agent'),
      endpoint: request.url,
    })
    throw new Error('Token inválido')
  }

  securityLogger.logAuthenticationSuccess({
    userId: user.id,
    userEmail: user.email,
    ip: request.ip,
    endpoint: request.url,
  })

  return user
}

// Verificación de roles
export const requireRole = (user: User, requiredRole: string) => {
  const userRole = user.user_metadata?.role || 'user'

  if (userRole !== requiredRole) {
    securityLogger.logAuthorizationDenied({
      userId: user.id,
      userRole,
      requiredRole,
      endpoint: request.url,
    })
    throw new Error('Permisos insuficientes')
  }
}
```

### Rate Limiting

```typescript
// Configuración de rate limiting
const rateLimitConfig = {
  windowMs: 15 * 60 * 1000, // 15 minutos
  max: 100, // 100 requests por ventana
  message: 'Demasiadas requests, intenta más tarde',
  standardHeaders: true,
  legacyHeaders: false,
}

// Aplicar rate limiting
export const rateLimiter = new RateLimiter(rateLimitConfig)

// En API route
await rateLimiter.check(request)
```

### Logging de Seguridad

```typescript
// Eventos de seguridad automáticos
securityLogger.logSuspiciousActivity(
  {
    userId: user.id,
    ip: request.ip,
    userAgent: request.headers.get('user-agent'),
    endpoint: request.url,
  },
  'Múltiples intentos de acceso fallidos',
  75
)

securityLogger.logDataAccess({
  userId: user.id,
  dataType: 'user_profiles',
  recordCount: 1,
  action: 'read',
})

securityLogger.logPaymentFraudAttempt(
  {
    userId: user.id,
    ip: request.ip,
    amount: 1000000, // Monto sospechoso
  },
  'Monto excesivamente alto para el perfil del usuario'
)
```

## 🧪 Testing

### Configuración de Tests

```typescript
// jest.config.js
module.exports = {
  testEnvironment: 'jsdom',
  setupFilesAfterEnv: ['<rootDir>/jest.setup.js'],
  moduleNameMapping: {
    '^@/(.*)$': '<rootDir>/src/$1',
  },
  collectCoverageFrom: ['src/**/*.{js,jsx,ts,tsx}', '!src/**/*.d.ts'],
}

// jest.setup.js
import '@testing-library/jest-dom'
import { server } from './src/mocks/server'

beforeAll(() => server.listen())
afterEach(() => server.resetHandlers())
afterAll(() => server.close())
```

### Tests de Componentes

```typescript
// __tests__/components/ProductCard.test.tsx
import { render, screen, fireEvent } from '@testing-library/react';
import { ProductCard } from '@/components/ProductCard';

const mockProduct = {
  id: '1',
  name: 'Test Product',
  price: 99.99,
  image_url: '/test-image.jpg'
};

describe('ProductCard', () => {
  it('renders product information correctly', () => {
    render(<ProductCard product={mockProduct} />);

    expect(screen.getByText('Test Product')).toBeInTheDocument();
    expect(screen.getByText('$99.99')).toBeInTheDocument();
  });

  it('calls onAddToCart when button is clicked', () => {
    const mockAddToCart = jest.fn();
    render(<ProductCard product={mockProduct} onAddToCart={mockAddToCart} />);

    fireEvent.click(screen.getByText('Agregar al Carrito'));
    expect(mockAddToCart).toHaveBeenCalledWith(mockProduct);
  });
});
```

### Tests de APIs

```typescript
// __tests__/api/products.test.ts
import { createMocks } from 'node-mocks-http'
import handler from '@/app/api/products/route'

describe('/api/products', () => {
  it('returns products list', async () => {
    const { req, res } = createMocks({
      method: 'GET',
      query: { page: '1', limit: '10' },
    })

    await handler(req, res)

    expect(res._getStatusCode()).toBe(200)

    const data = JSON.parse(res._getData())
    expect(data.success).toBe(true)
    expect(Array.isArray(data.data.products)).toBe(true)
  })

  it('handles invalid parameters', async () => {
    const { req, res } = createMocks({
      method: 'GET',
      query: { page: 'invalid' },
    })

    await handler(req, res)

    expect(res._getStatusCode()).toBe(400)
  })
})
```

## 🚀 Deployment

### Configuración de Producción

```typescript
// next.config.js
/** @type {import('next').NextConfig} */
const nextConfig = {
  experimental: {
    appDir: true,
  },
  images: {
    domains: ['your-image-domain.com'],
  },
  env: {
    CUSTOM_KEY: process.env.CUSTOM_KEY,
  },
  // Optimizaciones de producción
  compiler: {
    removeConsole: process.env.NODE_ENV === 'production',
  },
  // Headers de seguridad
  async headers() {
    return [
      {
        source: '/(.*)',
        headers: [
          {
            key: 'X-Frame-Options',
            value: 'DENY',
          },
          {
            key: 'X-Content-Type-Options',
            value: 'nosniff',
          },
          {
            key: 'Referrer-Policy',
            value: 'origin-when-cross-origin',
          },
        ],
      },
    ]
  },
}

module.exports = nextConfig
```

### Scripts de Deployment

```bash
#!/bin/bash
# deploy.sh

# Build de producción
npm run build

# Tests
npm run test

# Verificación de tipos
npm run type-check

# Linting
npm run lint

# Deploy a Vercel
vercel --prod
```

### Monitoreo en Producción

```typescript
// Configuración de monitoreo para producción
const productionConfig = {
  monitoring: {
    enabled: true,
    sampleRate: 0.1, // 10% de las requests
    alertThresholds: {
      responseTime: 2000,
      errorRate: 0.05,
      memoryUsage: 0.8,
    },
  },
  logging: {
    level: 'warn',
    includeStackTrace: false,
    maskSensitiveData: true,
  },
  cache: {
    defaultTTL: 3600,
    maxMemoryUsage: '512MB',
  },
}
```

## 📈 Performance

### Optimizaciones Implementadas

1. **Code Splitting**: Lazy loading de componentes
2. **Image Optimization**: Next.js Image component
3. **Bundle Analysis**: Webpack Bundle Analyzer
4. **Caching Strategy**: Multi-layer caching
5. **Database Optimization**: Índices y queries optimizadas
6. **CDN**: Assets estáticos en CDN

### Métricas Objetivo

- **LCP**: < 2.5s (móvil), < 2s (desktop)
- **FID**: < 100ms
- **CLS**: < 0.1
- **Bundle Size**: < 250KB (JS inicial)
- **API Response**: < 500ms (promedio)
- **Error Rate**: < 1%

## 🔧 Troubleshooting

### Problemas Comunes

#### Error de Conexión a Base de Datos

```bash
# Verificar variables de entorno
echo $NEXT_PUBLIC_SUPABASE_URL
echo $NEXT_PUBLIC_SUPABASE_ANON_KEY

# Verificar conectividad
curl -I $NEXT_PUBLIC_SUPABASE_URL/rest/v1/
```

#### Problemas de Cache

```typescript
// Limpiar cache manualmente
await multiLayerCacheManager.clear()

// Verificar estado del cache
const stats = await multiLayerCacheManager.getStats()
console.log('Cache stats:', stats)
```

#### Problemas de Performance

```typescript
// Verificar métricas actuales
const metrics = realTimePerformanceMonitor.getCurrentMetrics()
console.log('Performance metrics:', metrics)

// Verificar presupuestos
const budgetReport = performanceBudgetsMonitor.generateReport(1)
console.log(
  'Budget violations:',
  budgetReport.budgetResults.filter(r => r.status === 'critical')
)
```

### Logs de Debug

```typescript
// Habilitar logs detallados
process.env.DEBUG = 'pinteya:*'

// Logs específicos por categoría
logger.debug(LogLevel.DEBUG, 'Debug message', { context }, LogCategory.API)
```

## 📞 Soporte

Para soporte técnico:

- **Email**: dev@pinteya.com
- **Slack**: #pinteya-dev
- **Documentación**: [docs.pinteya.com](https://docs.pinteya.com)
- **Issues**: [GitHub Issues](https://github.com/SantiagoXOR/pinteya-ecommerce/issues)

## 📋 Guías de Desarrollo

### Convenciones de Código

#### TypeScript

```typescript
// Interfaces con PascalCase
interface UserProfile {
  id: string
  email: string
  createdAt: Date
}

// Tipos con PascalCase
type OrderStatus = 'pending' | 'confirmed' | 'shipped' | 'delivered'

// Enums con PascalCase
enum PaymentMethod {
  CREDIT_CARD = 'credit_card',
  MERCADOPAGO = 'mercadopago',
  BANK_TRANSFER = 'bank_transfer',
}

// Funciones con camelCase
const calculateTotal = (items: CartItem[]): number => {
  return items.reduce((sum, item) => sum + item.price * item.quantity, 0)
}

// Constantes con UPPER_SNAKE_CASE
const MAX_CART_ITEMS = 50
const DEFAULT_PAGE_SIZE = 20
```

#### React Components

```typescript
// Componentes con PascalCase
export const ProductCard: React.FC<ProductCardProps> = ({ product, onAddToCart }) => {
  // Props destructuring al inicio
  const { id, name, price, image_url } = product;

  // Hooks al inicio
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Handlers con handle prefix
  const handleAddToCart = useCallback(async () => {
    setIsLoading(true);
    try {
      await onAddToCart(product);
    } catch (err) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  }, [product, onAddToCart]);

  // Early returns para casos especiales
  if (error) {
    return <ErrorMessage message={error} />;
  }

  // JSX con className descriptivas
  return (
    <div className="product-card bg-white rounded-lg shadow-md p-4">
      <img
        src={image_url}
        alt={name}
        className="product-image w-full h-48 object-cover rounded"
      />
      <h3 className="product-name text-lg font-semibold mt-2">{name}</h3>
      <p className="product-price text-xl font-bold text-green-600">${price}</p>
      <button
        onClick={handleAddToCart}
        disabled={isLoading}
        className="add-to-cart-btn w-full mt-4 bg-blue-600 text-white py-2 rounded hover:bg-blue-700 disabled:opacity-50"
      >
        {isLoading ? 'Agregando...' : 'Agregar al Carrito'}
      </button>
    </div>
  );
};
```

#### API Routes

```typescript
// Estructura estándar de API
export async function GET(request: NextRequest) {
  const startTime = Date.now()

  try {
    // 1. Extraer parámetros
    const { searchParams } = new URL(request.url)
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '20')

    // 2. Validación
    if (page < 1 || limit < 1 || limit > 100) {
      return NextResponse.json(
        {
          success: false,
          error: 'Parámetros inválidos',
          timestamp: Date.now(),
        },
        { status: 400 }
      )
    }

    // 3. Autenticación (si es necesaria)
    const user = await authenticateUser(request)

    // 4. Lógica de negocio
    const result = await businessLogic({ page, limit, userId: user?.id })

    // 5. Logging de performance
    const responseTime = Date.now() - startTime
    logger.info(
      LogLevel.INFO,
      'API request completed',
      {
        endpoint: '/api/example',
        responseTime,
        userId: user?.id,
      },
      LogCategory.API
    )

    // 6. Respuesta exitosa
    return NextResponse.json({
      success: true,
      data: result,
      timestamp: Date.now(),
    })
  } catch (error) {
    // 7. Manejo de errores
    logger.error(LogLevel.ERROR, 'API request failed', error as Error, LogCategory.API)

    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Error interno del servidor',
        timestamp: Date.now(),
      },
      { status: 500 }
    )
  }
}
```

### Flujo de Desarrollo

#### 1. Feature Development

```bash
# Crear rama para feature
git checkout -b feature/nueva-funcionalidad

# Desarrollo con commits atómicos
git add .
git commit -m "feat: agregar validación de productos"

# Tests
npm run test

# Linting
npm run lint

# Type checking
npm run type-check

# Push y PR
git push origin feature/nueva-funcionalidad
```

#### 2. Code Review Checklist

- [ ] Código sigue convenciones establecidas
- [ ] Tests unitarios incluidos
- [ ] Documentación actualizada
- [ ] Performance considerado
- [ ] Seguridad validada
- [ ] Accesibilidad verificada
- [ ] Responsive design implementado

#### 3. Deployment Process

```bash
# Staging deployment
git checkout staging
git merge feature/nueva-funcionalidad
npm run build
npm run test:e2e
vercel --target staging

# Production deployment
git checkout main
git merge staging
npm run build
npm run test:full
vercel --prod
```

### Debugging

#### Frontend Debugging

```typescript
// React DevTools
// Instalar extensión React Developer Tools

// Debug hooks
const useDebugValue = (value: any, formatter?: (value: any) => any) => {
  React.useDebugValue(value, formatter);
};

// Error boundaries
class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true };
  }

  componentDidCatch(error, errorInfo) {
    console.error('Error boundary caught an error:', error, errorInfo);
    // Log to monitoring service
    logger.error(LogLevel.ERROR, 'React error boundary', error, LogCategory.FRONTEND);
  }

  render() {
    if (this.state.hasError) {
      return <h1>Algo salió mal.</h1>;
    }

    return this.props.children;
  }
}
```

#### Backend Debugging

```typescript
// Debug middleware
export const debugMiddleware = (req: NextRequest) => {
  console.log('🔍 Debug Info:', {
    method: req.method,
    url: req.url,
    headers: Object.fromEntries(req.headers.entries()),
    timestamp: new Date().toISOString(),
  })
}

// Database query debugging
const debugQuery = async (query: string, params: any[]) => {
  const start = Date.now()
  console.log('🗄️ Executing query:', query, params)

  try {
    const result = await supabase.rpc(query, params)
    const duration = Date.now() - start
    console.log(`✅ Query completed in ${duration}ms`)
    return result
  } catch (error) {
    console.error('❌ Query failed:', error)
    throw error
  }
}
```

### Performance Optimization

#### Frontend Optimizations

```typescript
// Lazy loading de componentes
const LazyProductGallery = lazy(() => import('./ProductGallery'));

// Memoización de componentes
const MemoizedProductCard = React.memo(ProductCard, (prevProps, nextProps) => {
  return prevProps.product.id === nextProps.product.id &&
         prevProps.product.price === nextProps.product.price;
});

// Optimización de re-renders
const useOptimizedCallback = useCallback((id: string) => {
  // Lógica optimizada
}, [/* dependencies mínimas */]);

// Virtual scrolling para listas grandes
import { FixedSizeList as List } from 'react-window';

const VirtualizedProductList = ({ products }) => (
  <List
    height={600}
    itemCount={products.length}
    itemSize={200}
    itemData={products}
  >
    {({ index, style, data }) => (
      <div style={style}>
        <ProductCard product={data[index]} />
      </div>
    )}
  </List>
);
```

#### Backend Optimizations

```typescript
// Database query optimization
const getProductsOptimized = async (filters: ProductFilters) => {
  // Usar índices apropiados
  const query = supabase
    .from('products')
    .select(
      `
      id,
      name,
      price,
      image_url,
      categories!inner(name)
    `
    )
    .eq('is_active', true)

  // Aplicar filtros eficientemente
  if (filters.category) {
    query.eq('categories.name', filters.category)
  }

  // Paginación
  const from = (filters.page - 1) * filters.limit
  query.range(from, from + filters.limit - 1)

  return query
}

// Cache optimization
const getCachedProducts = async (key: string) => {
  // Intentar cache primero
  const cached = await redis.get(key)
  if (cached) {
    return JSON.parse(cached)
  }

  // Fallback a base de datos
  const data = await getProductsOptimized(filters)

  // Cachear resultado
  await redis.setex(key, 300, JSON.stringify(data)) // 5 minutos

  return data
}
```

## 🔐 Guía de Seguridad

### Checklist de Seguridad

#### Autenticación

- [ ] Passwords hasheados con bcrypt/scrypt
- [ ] JWT tokens con expiración apropiada
- [ ] Refresh tokens implementados
- [ ] Rate limiting en login
- [ ] Account lockout después de intentos fallidos
- [ ] 2FA disponible para admins

#### Autorización

- [ ] RLS policies en Supabase
- [ ] Verificación de roles en cada endpoint
- [ ] Principio de menor privilegio
- [ ] Validación de ownership de recursos

#### Input Validation

- [ ] Validación con Zod schemas
- [ ] Sanitización de HTML
- [ ] Validación de tipos de archivo
- [ ] Límites de tamaño de request
- [ ] Validación de URLs

#### Data Protection

- [ ] Encriptación en tránsito (HTTPS)
- [ ] Encriptación en reposo
- [ ] Datos sensibles enmascarados en logs
- [ ] Backup encriptado
- [ ] Cumplimiento GDPR/CCPA

### Implementación de Seguridad

```typescript
// Validación de input
import { z } from 'zod'

const ProductSchema = z.object({
  name: z.string().min(1).max(255),
  price: z.number().positive().max(999999),
  description: z.string().max(2000).optional(),
  category_id: z.string().uuid(),
})

// Sanitización
import DOMPurify from 'dompurify'

const sanitizeHTML = (html: string): string => {
  return DOMPurify.sanitize(html, {
    ALLOWED_TAGS: ['b', 'i', 'em', 'strong', 'p', 'br'],
    ALLOWED_ATTR: [],
  })
}

// Headers de seguridad
const securityHeaders = {
  'X-Frame-Options': 'DENY',
  'X-Content-Type-Options': 'nosniff',
  'Referrer-Policy': 'origin-when-cross-origin',
  'Permissions-Policy': 'camera=(), microphone=(), geolocation=()',
  'Content-Security-Policy': "default-src 'self'; script-src 'self' 'unsafe-inline'",
}
```

---

_Documentación actualizada: Diciembre 2024_
_Versión: 2.0.0_
