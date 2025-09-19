'use client'

import React from 'react'
import { SessionProvider } from 'next-auth/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { ReactQueryDevtools } from '@tanstack/react-query-devtools'
import { Toaster } from 'sonner'
import { MonitoringProvider } from './MonitoringProvider'
import { CartProvider } from '../contexts/CartContext'
import { DesignSystemProvider } from '../contexts/DesignSystemContext'
import { ThemeProvider } from 'next-themes'

// Configuración del cliente de React Query
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60 * 5, // 5 minutos
      gcTime: 1000 * 60 * 10, // 10 minutos (antes cacheTime)
      retry: (failureCount, error: any) => {
        // No reintentar en errores 4xx
        if (error?.status >= 400 && error?.status < 500) {
          return false
        }
        // Máximo 3 reintentos para otros errores
        return failureCount < 3
      },
      retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000),
    },
    mutations: {
      retry: 1,
      retryDelay: 1000,
    },
  },
})

interface ProvidersProps {
  children: React.ReactNode
}

export function Providers({ children }: ProvidersProps) {
  return (
    <SessionProvider>
      <QueryClientProvider client={queryClient}>
        <ThemeProvider
          attribute="class"
          defaultTheme="light"
          enableSystem
          disableTransitionOnChange
        >
          <MonitoringProvider
            autoStart={true}
            enableErrorBoundary={true}
          >
            <DesignSystemProvider>
              <CartProvider>
                {children}
                
                {/* Toaster para notificaciones */}
                <Toaster
                  position="top-right"
                  expand={false}
                  richColors
                  closeButton
                  toastOptions={{
                    duration: 4000,
                    style: {
                      background: 'white',
                      border: '1px solid #e2e8f0',
                      color: '#1e293b',
                    },
                  }}
                />
                
                {/* React Query Devtools solo en desarrollo */}
                {process.env.NODE_ENV === 'development' && (
                  <ReactQueryDevtools
                    initialIsOpen={false}
                    position="bottom-right"
                  />
                )}
              </CartProvider>
            </DesignSystemProvider>
          </MonitoringProvider>
        </ThemeProvider>
      </QueryClientProvider>
    </SessionProvider>
  )
}

// Re-exportar providers individuales para uso específico
export { MonitoringProvider, useMonitoring, useErrorReporting, useMonitoringStats, MonitoringStatus } from './MonitoringProvider'
export { CartProvider, useCart } from '../contexts/CartContext'
export { DesignSystemProvider, useDesignSystem } from '../contexts/DesignSystemContext'

// Tipos útiles
export type { MonitoringContextType } from './MonitoringProvider'

// Configuración por defecto para diferentes entornos
export const getProviderConfig = () => {
  const isDevelopment = process.env.NODE_ENV === 'development'
  const isProduction = process.env.NODE_ENV === 'production'
  
  return {
    monitoring: {
      autoStart: isProduction, // Solo auto-iniciar en producción
      enableErrorBoundary: true,
      enableDevtools: isDevelopment,
    },
    reactQuery: {
      enableDevtools: isDevelopment,
      staleTime: isDevelopment ? 1000 * 30 : 1000 * 60 * 5, // 30s dev, 5min prod
      gcTime: isDevelopment ? 1000 * 60 : 1000 * 60 * 10, // 1min dev, 10min prod
    },
    theme: {
      defaultTheme: 'light' as const,
      enableSystem: true,
      storageKey: 'ecommerce-theme',
    },
  }
}

/**
 * Hook para acceder a la configuración de providers
 */
export function useProviderConfig() {
  return React.useMemo(() => getProviderConfig(), [])
}

/**
 * Componente de desarrollo para mostrar el estado de todos los providers
 */
export function ProvidersStatus() {
  const { isInitialized, isMonitoring, error } = useMonitoring()
  const config = useProviderConfig()
  
  if (process.env.NODE_ENV !== 'development') {
    return null
  }

  return (
    <div className="fixed bottom-4 left-4 z-50 bg-gray-900 text-white text-xs p-3 rounded-lg shadow-lg max-w-xs">
      <div className="font-semibold mb-2">Providers Status</div>
      
      <div className="space-y-1">
        <div className="flex justify-between">
          <span>Monitoring:</span>
          <span>{isInitialized ? '✅' : '❌'}</span>
        </div>
        
        <div className="flex justify-between">
          <span>Active:</span>
          <span>{isMonitoring ? '✅' : '❌'}</span>
        </div>
        
        <div className="flex justify-between">
          <span>React Query:</span>
          <span>✅</span>
        </div>
        
        <div className="flex justify-between">
          <span>NextAuth:</span>
          <span>✅</span>
        </div>
        
        <div className="flex justify-between">
          <span>Theme:</span>
          <span>✅</span>
        </div>
        
        {error && (
          <div className="mt-2 p-2 bg-red-900 rounded text-red-200">
            <div className="font-semibold">Error:</div>
            <div className="text-xs">{error instanceof Error ? error.message : String(error) || 'Error desconocido'}</div>
          </div>
        )}
      </div>
      
      <div className="mt-2 pt-2 border-t border-gray-700 text-xs text-gray-400">
        Environment: {process.env.NODE_ENV}
      </div>
    </div>
  )
}









