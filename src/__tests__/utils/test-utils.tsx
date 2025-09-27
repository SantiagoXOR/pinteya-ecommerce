// ===================================
// PINTEYA E-COMMERCE - TEST UTILITIES
// ===================================

import React, { ReactElement } from 'react'
import { render, RenderOptions } from '@testing-library/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'

// ===================================
// QUERY CLIENT PARA TESTS
// ===================================

/**
 * Crear QueryClient optimizado para tests
 * - Sin retry para tests más rápidos
 * - Sin cache para tests aislados
 * - Sin DevTools para evitar warnings
 */
export const createTestQueryClient = () =>
  new QueryClient({
    defaultOptions: {
      queries: {
        retry: false,
        gcTime: 0,
        staleTime: 0,
      },
      mutations: {
        retry: false,
      },
    },
    logger: {
      log: () => {},
      warn: () => {},
      error: () => {},
    },
  })

// ===================================
// WRAPPER PROVIDERS PARA TESTS
// ===================================

interface AllTheProvidersProps {
  children: React.ReactNode
  queryClient?: QueryClient
}

/**
 * Wrapper que incluye todos los providers necesarios para tests
 */
export const AllTheProviders: React.FC<AllTheProvidersProps> = ({
  children,
  queryClient = createTestQueryClient(),
}) => {
  return <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
}

// ===================================
// CUSTOM RENDER FUNCTION
// ===================================

interface CustomRenderOptions extends Omit<RenderOptions, 'wrapper'> {
  queryClient?: QueryClient
}

/**
 * Custom render function que incluye automáticamente los providers
 */
export const renderWithProviders = (ui: ReactElement, options: CustomRenderOptions = {}) => {
  const { queryClient, ...renderOptions } = options

  const Wrapper: React.FC<{ children: React.ReactNode }> = ({ children }) => (
    <AllTheProviders queryClient={queryClient}>{children}</AllTheProviders>
  )

  return render(ui, { wrapper: Wrapper, ...renderOptions })
}

// ===================================
// HOOK TESTING UTILITIES
// ===================================

/**
 * Wrapper para testing de hooks que requieren QueryClient
 */
export const createHookWrapper = (queryClient?: QueryClient) => {
  const client = queryClient || createTestQueryClient()

  return ({ children }: { children: React.ReactNode }) => (
    <QueryClientProvider client={client}>{children}</QueryClientProvider>
  )
}

// ===================================
// MOCK UTILITIES
// ===================================

/**
 * Mock de localStorage para tests
 */
export const createMockLocalStorage = () => {
  const store: Record<string, string> = {}

  return {
    getItem: jest.fn((key: string) => store[key] || null),
    setItem: jest.fn((key: string, value: string) => {
      store[key] = value
    }),
    removeItem: jest.fn((key: string) => {
      delete store[key]
    }),
    clear: jest.fn(() => {
      Object.keys(store).forEach(key => delete store[key])
    }),
    length: Object.keys(store).length,
    key: jest.fn((index: number) => Object.keys(store)[index] || null),
  }
}

/**
 * Mock de sessionStorage para tests
 */
export const createMockSessionStorage = () => createMockLocalStorage()

// ===================================
// ASYNC UTILITIES
// ===================================

/**
 * Utility para esperar a que TanStack Query complete las operaciones
 */
export const waitForQueryToSettle = async (queryClient: QueryClient) => {
  await queryClient.getQueryCache().clear()
  await queryClient.getMutationCache().clear()
}

/**
 * Utility para limpiar el estado de TanStack Query entre tests
 */
export const cleanupQueryClient = (queryClient: QueryClient) => {
  queryClient.clear()
  queryClient.getQueryCache().clear()
  queryClient.getMutationCache().clear()
}

// ===================================
// EXPORTS
// ===================================

// Re-export everything from React Testing Library
export * from '@testing-library/react'

// Override render method
export { renderWithProviders as render }
