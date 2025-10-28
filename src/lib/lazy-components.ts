/**
 * LAZY COMPONENTS - Optimización de Performance
 * 
 * Este archivo centraliza el lazy loading de componentes pesados
 * para mejorar el First Load JS y el performance general.
 */

import dynamic from 'next/dynamic'
import React from 'react'

// ===================================
// LOADING FALLBACKS
// ===================================

const DefaultSkeleton = () => (
  <div className="animate-pulse bg-gray-200 rounded-md h-48 w-full" />
)

const ChartSkeleton = () => (
  <div className="animate-pulse bg-gray-100 rounded-lg p-6">
    <div className="h-4 bg-gray-300 rounded w-1/4 mb-4"></div>
    <div className="h-64 bg-gray-200 rounded"></div>
  </div>
)

const ModalSkeleton = () => (
  <div className="fixed inset-0 bg-black/50 flex items-center justify-center">
    <div className="bg-white rounded-lg p-6 animate-pulse">
      <div className="h-4 bg-gray-300 rounded w-48 mb-4"></div>
      <div className="h-32 bg-gray-200 rounded"></div>
    </div>
  </div>
)

// ===================================
// FRAMER MOTION - LAZY LOAD
// ===================================

export const LazyMotion = dynamic(() => 
  import('framer-motion').then((mod) => mod.LazyMotion),
  {
    loading: () => null,
    ssr: false
  }
)

export const AnimatePresence = dynamic(() =>
  import('framer-motion').then((mod) => mod.AnimatePresence),
  {
    loading: () => null,
    ssr: false
  }
)

// ===================================
// RECHARTS - LAZY LOAD
// ===================================

export const LazyLineChart = dynamic(() =>
  import('recharts').then((mod) => mod.LineChart),
  {
    loading: () => <ChartSkeleton />,
    ssr: false
  }
)

export const LazyBarChart = dynamic(() =>
  import('recharts').then((mod) => mod.BarChart),
  {
    loading: () => <ChartSkeleton />,
    ssr: false
  }
)

export const LazyPieChart = dynamic(() =>
  import('recharts').then((mod) => mod.PieChart),
  {
    loading: () => <ChartSkeleton />,
    ssr: false
  }
)

export const LazyAreaChart = dynamic(() =>
  import('recharts').then((mod) => mod.AreaChart),
  {
    loading: () => <ChartSkeleton />,
    ssr: false
  }
)

// ===================================
// GOOGLE MAPS - LAZY LOAD
// ===================================

export const LazyGoogleMap = dynamic(() =>
  import('@react-google-maps/api').then((mod) => mod.GoogleMap),
  {
    loading: () => (
      <div className="w-full h-full bg-gray-200 animate-pulse flex items-center justify-center">
        <span className="text-gray-500">Cargando mapa...</span>
      </div>
    ),
    ssr: false
  }
)

export const LazyMarker = dynamic(() =>
  import('@react-google-maps/api').then((mod) => mod.Marker),
  {
    loading: () => null,
    ssr: false
  }
)

// ===================================
// ADMIN COMPONENTS - LAZY LOAD
// ===================================

export const LazyAdminDashboard = dynamic(() =>
  import('@/components/admin/AdminDashboard'),
  {
    loading: () => <DefaultSkeleton />,
    ssr: false
  }
)

export const LazyProductsPanel = dynamic(() =>
  import('@/components/admin/ProductsPanel'),
  {
    loading: () => <DefaultSkeleton />,
    ssr: false
  }
)

export const LazyOrdersPanel = dynamic(() =>
  import('@/components/admin/OrdersPanel'),
  {
    loading: () => <DefaultSkeleton />,
    ssr: false
  }
)

export const LazyAnalyticsPanel = dynamic(() =>
  import('@/components/Analytics/AnalyticsDemo'),
  {
    loading: () => <ChartSkeleton />,
    ssr: false
  }
)

// ===================================
// MODALS - LAZY LOAD
// ===================================

export const LazyShopDetailModal = dynamic(() =>
  import('@/components/ShopDetails/ShopDetailModal').then((mod) => mod.ShopDetailModal),
  {
    loading: () => <ModalSkeleton />,
    ssr: false
  }
)

// ===================================
// HEAVY UI COMPONENTS - LAZY LOAD
// ===================================

export const LazySwiper = dynamic(() =>
  import('swiper/react').then((mod) => mod.Swiper),
  {
    loading: () => <DefaultSkeleton />,
    ssr: false
  }
)

export const LazySwiperSlide = dynamic(() =>
  import('swiper/react').then((mod) => mod.SwiperSlide),
  {
    loading: () => null,
    ssr: false
  }
)

// ===================================
// UTILITIES
// ===================================

/**
 * Wrapper para lazy load de cualquier componente con opciones personalizadas
 */
export function createLazyComponent<T = any>(
  importFn: () => Promise<any>,
  options?: {
    loading?: React.ComponentType
    ssr?: boolean
  }
) {
  return dynamic<T>(importFn, {
    loading: options?.loading || (() => <DefaultSkeleton />),
    ssr: options?.ssr ?? false
  })
}

/**
 * Lazy load condicional basado en viewport
 */
export function createLazyComponentOnView<T = any>(
  importFn: () => Promise<any>,
  options?: {
    loading?: React.ComponentType
  }
) {
  return dynamic<T>(importFn, {
    loading: options?.loading || (() => <DefaultSkeleton />),
    ssr: false
  })
}

