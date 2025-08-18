# 🚀 Next.js Enterprise Patterns - Pinteya E-commerce

> Patrones y mejores prácticas enterprise para Next.js 15 basados en documentación oficial y Context7

[![Next.js](https://img.shields.io/badge/Next.js-15.3.3-black)](https://nextjs.org/)
[![Enterprise](https://img.shields.io/badge/Enterprise-Ready-success)](../DOCUMENTATION_INDEX.md)
[![Context7](https://img.shields.io/badge/Context7-Optimized-blue)](https://context7.ai/)

---

## 📋 Índice

- [🎯 Objetivos Enterprise](#-objetivos-enterprise)
- [🏗️ Arquitectura de Caching](#️-arquitectura-de-caching)
- [⚡ Performance Optimization](#-performance-optimization)
- [🔒 Security Patterns](#-security-patterns)
- [📊 Monitoring & Observability](#-monitoring--observability)
- [🧪 Testing Enterprise](#-testing-enterprise)

---

## 🎯 Objetivos Enterprise

### **Principios Fundamentales**
- **Escalabilidad**: Manejo de alto volumen de transacciones
- **Confiabilidad**: 99.9% uptime con recuperación automática
- **Performance**: First Load < 500KB, Build time < 30s
- **Observabilidad**: Métricas en tiempo real y alertas automáticas

### **Estándares de Calidad**
- **Caching Strategy**: 4 capas de caché optimizadas
- **Error Handling**: Manejo robusto con retry logic
- **Security**: HMAC verification y rate limiting
- **Monitoring**: Dashboard enterprise con alertas

---

## 🏗️ Arquitectura de Caching

### **1. Request Memoization**
```typescript
// Memoización automática de fetch requests
async function getProducts() {
  // fetch se memoiza automáticamente en el mismo render
  const res = await fetch('https://api.pinteya.com/products')
  return res.json()
}

// Primera llamada: cache MISS
const products1 = await getProducts()
// Segunda llamada: cache HIT
const products2 = await getProducts()
```

### **2. Data Cache**
```typescript
// Estrategias de caching por caso de uso
export default async function ProductsPage() {
  // Static data (similar a getStaticProps)
  const staticData = await fetch('https://api.pinteya.com/categories', { 
    cache: 'force-cache' 
  })

  // Dynamic data (similar a getServerSideProps)
  const dynamicData = await fetch('https://api.pinteya.com/inventory', { 
    cache: 'no-store' 
  })

  // Time-based revalidation
  const revalidatedData = await fetch('https://api.pinteya.com/prices', {
    next: { revalidate: 300 } // 5 minutos
  })

  return <ProductGrid data={staticData} />
}
```

### **3. Full Route Cache**
```typescript
// Configuración de revalidación por ruta
export const revalidate = 3600 // 1 hora

// Opt-out de cache para rutas dinámicas
export const dynamic = 'force-dynamic'

// Cache con tags para invalidación selectiva
export default async function Page() {
  const data = await fetch('https://api.pinteya.com/products', {
    next: { tags: ['products'] }
  })
  
  return <ProductList products={data} />
}
```

### **4. Router Cache**
```typescript
// Configuración de staleTimes en next.config.js
const nextConfig = {
  experimental: {
    staleTimes: {
      dynamic: 30,    // 30 segundos para contenido dinámico
      static: 180     // 3 minutos para contenido estático
    }
  }
}
```

---

## ⚡ Performance Optimization

### **1. Server Components Optimization**
```typescript
// Componente Server optimizado
export default async function ProductCard({ productId }: { productId: string }) {
  // Fetch paralelo para evitar waterfalls
  const [product, reviews, inventory] = await Promise.all([
    getProduct(productId),
    getReviews(productId),
    getInventory(productId)
  ])

  return (
    <div className="product-card">
      <ProductImage src={product.image} />
      <ProductInfo product={product} />
      <ReviewSummary reviews={reviews} />
      <StockIndicator inventory={inventory} />
    </div>
  )
}
```

### **2. Streaming y Suspense**
```typescript
import { Suspense } from 'react'

export default function ProductsPage() {
  return (
    <div>
      <ProductHeader />
      <Suspense fallback={<ProductsSkeleton />}>
        <ProductsList />
      </Suspense>
      <Suspense fallback={<ReviewsSkeleton />}>
        <ProductReviews />
      </Suspense>
    </div>
  )
}
```

### **3. Image Optimization**
```typescript
import Image from 'next/image'

// Configuración optimizada para e-commerce
export default function ProductImage({ src, alt }: { src: string, alt: string }) {
  return (
    <Image
      src={src}
      alt={alt}
      width={400}
      height={400}
      priority={true} // Para imágenes above-the-fold
      placeholder="blur"
      blurDataURL="data:image/jpeg;base64,..."
      sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
    />
  )
}
```

### **4. Bundle Optimization**
```javascript
// next.config.js - Optimización de bundles
const nextConfig = {
  // Auto-bundle dependencies en Pages Router
  bundlePagesRouterDependencies: true,
  
  // Optimización de Tailwind
  experimental: {
    optimizeCss: true
  },
  
  // Compresión
  compress: true,
  
  // Tree shaking mejorado
  swcMinify: true
}
```

---

## 🔒 Security Patterns

### **1. Middleware de Seguridad**
```typescript
// middleware.ts - Seguridad enterprise
import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

export function middleware(request: NextRequest) {
  // Rate limiting por IP
  const ip = request.ip || 'unknown'
  
  // CSRF protection
  const csrfToken = request.headers.get('x-csrf-token')
  
  // Security headers
  const response = NextResponse.next()
  response.headers.set('X-Frame-Options', 'DENY')
  response.headers.set('X-Content-Type-Options', 'nosniff')
  response.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin')
  
  return response
}

export const config = {
  matcher: [
    '/((?!api|_next/static|_next/image|favicon.ico).*)',
  ],
}
```

### **2. API Routes Seguras**
```typescript
// app/api/admin/route.ts - API enterprise
import { auth } from '@clerk/nextjs'
import { NextRequest, NextResponse } from 'next/server'

export async function GET(request: NextRequest) {
  try {
    // Autenticación
    const { userId } = auth()
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Rate limiting
    const rateLimitResult = await checkRateLimit(userId)
    if (!rateLimitResult.success) {
      return NextResponse.json(
        { error: 'Rate limit exceeded' }, 
        { status: 429 }
      )
    }

    // Validación de entrada
    const searchParams = request.nextUrl.searchParams
    const page = parseInt(searchParams.get('page') || '1')
    
    if (page < 1 || page > 1000) {
      return NextResponse.json({ error: 'Invalid page' }, { status: 400 })
    }

    // Lógica de negocio
    const data = await getAdminData(userId, page)
    
    return NextResponse.json(data)
  } catch (error) {
    console.error('Admin API error:', error)
    return NextResponse.json(
      { error: 'Internal server error' }, 
      { status: 500 }
    )
  }
}
```

---

## 📊 Monitoring & Observability

### **1. Web Vitals Tracking**
```typescript
// app/layout.tsx - Monitoreo de performance
import { WebVitals } from '@/components/WebVitals'

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="es" data-scroll-behavior="smooth">
      <body>
        <WebVitals />
        {children}
      </body>
    </html>
  )
}
```

```typescript
// components/WebVitals.tsx
'use client'

import { useReportWebVitals } from 'next/web-vitals'

export function WebVitals() {
  useReportWebVitals((metric) => {
    // Enviar métricas a sistema de monitoreo
    fetch('/api/analytics/web-vitals', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(metric)
    })
  })

  return null
}
```

### **2. Error Boundary Enterprise**
```typescript
// components/ErrorBoundary.tsx
'use client'

import { useEffect } from 'react'

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => {
    // Log error a sistema de monitoreo
    console.error('Application error:', error)
    
    // Enviar a servicio de tracking
    fetch('/api/errors', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        message: error.message,
        stack: error.stack,
        digest: error.digest,
        timestamp: new Date().toISOString()
      })
    })
  }, [error])

  return (
    <div className="error-boundary">
      <h2>Algo salió mal</h2>
      <button onClick={reset}>Intentar nuevamente</button>
    </div>
  )
}
```

---

## 🧪 Testing Enterprise

### **1. Configuración Jest Optimizada**
```javascript
// jest.config.js - Enterprise testing
const nextJest = require('next/jest')

const createJestConfig = nextJest({
  dir: './',
})

const customJestConfig = {
  setupFilesAfterEnv: ['<rootDir>/jest.setup.js'],
  testEnvironment: 'jest-environment-jsdom',
  moduleNameMapping: {
    '^@/(.*)$': '<rootDir>/src/$1',
  },
  collectCoverageFrom: [
    'src/**/*.{js,jsx,ts,tsx}',
    '!src/**/*.d.ts',
    '!src/**/*.stories.{js,jsx,ts,tsx}',
  ],
  coverageThreshold: {
    global: {
      branches: 70,
      functions: 70,
      lines: 70,
      statements: 70,
    },
  },
}

module.exports = createJestConfig(customJestConfig)
```

### **2. Mocks Centralizados**
```typescript
// __mocks__/next-auth.ts
export const auth = jest.fn(() => ({
  user: { id: 'test-user', email: 'test@pinteya.com' }
}))

// __mocks__/supabase.ts
export const createClient = jest.fn(() => ({
  from: jest.fn(() => ({
    select: jest.fn(() => Promise.resolve({ data: [], error: null })),
    insert: jest.fn(() => Promise.resolve({ data: {}, error: null })),
  }))
}))
```

---

**Documentado por**: Augment Agent  
**Fecha**: Enero 2025  
**Versión**: Enterprise v3.0  
**Basado en**: Next.js 15 + Context7 Documentation
