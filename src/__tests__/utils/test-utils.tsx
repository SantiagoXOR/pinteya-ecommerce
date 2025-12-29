// ===================================
// PINTEYA E-COMMERCE - TEST UTILITIES
// ===================================

import React, { ReactElement } from 'react'
import { render, RenderOptions } from '@testing-library/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { Provider } from 'react-redux'
import { configureStore, PreloadedState } from '@reduxjs/toolkit'
import { SessionProvider } from 'next-auth/react'
import type { RootState, AppStore } from '@/redux/store'
import quickViewReducer from '@/redux/features/quickView-slice'
import cartReducer from '@/redux/features/cart-slice'
import wishlistReducer from '@/redux/features/wishlist-slice'
import productDetailsReducer from '@/redux/features/product-details'

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
// REDUX STORE PARA TESTS
// ===================================

/**
 * Crear Redux store para tests con estado opcional
 */
export const createTestStore = (preloadedState?: PreloadedState<RootState>): AppStore => {
  return configureStore({
    reducer: {
      quickViewReducer,
      cartReducer,
      wishlistReducer,
      productDetailsReducer,
    },
    preloadedState,
    middleware: getDefaultMiddleware =>
      getDefaultMiddleware({
        serializableCheck: {
          ignoredActions: ['persist/PERSIST', 'persist/REHYDRATE'],
        },
      }),
  })
}

// ===================================
// MOCK DE NEXT AUTH SESSION
// ===================================

export interface MockSession {
  user: {
    id: string
    email: string
    name: string
    image?: string
  }
  expires: string
}

export const createMockSession = (overrides?: Partial<MockSession>): MockSession => ({
  user: {
    id: 'test-user-id',
    email: 'test@example.com',
    name: 'Test User',
    image: 'https://example.com/avatar.jpg',
    ...overrides?.user,
  },
  expires: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
  ...overrides,
})

// ===================================
// WRAPPER PROVIDERS PARA TESTS
// ===================================

interface AllTheProvidersProps {
  children: React.ReactNode
  queryClient?: QueryClient
  reduxStore?: AppStore
  authState?: 'authenticated' | 'unauthenticated' | 'loading'
  session?: MockSession | null
}

/**
 * Wrapper que incluye todos los providers necesarios para tests
 * - QueryClient (TanStack Query)
 * - Redux Store
 * - NextAuth SessionProvider
 */
export const AllTheProviders: React.FC<AllTheProvidersProps> = ({
  children,
  queryClient = createTestQueryClient(),
  reduxStore,
  authState = 'unauthenticated',
  session,
}) => {
  const store = reduxStore || createTestStore()
  
  // Determinar session basado en authState
  let sessionData: MockSession | null = null
  if (authState === 'authenticated') {
    sessionData = session || createMockSession()
  } else if (authState === 'loading') {
    sessionData = null // Loading state
  }

  return (
    <Provider store={store}>
      <QueryClientProvider client={queryClient}>
        <SessionProvider
          session={sessionData}
          refetchInterval={0}
          refetchOnWindowFocus={false}
        >
          {children}
        </SessionProvider>
      </QueryClientProvider>
    </Provider>
  )
}

// ===================================
// CUSTOM RENDER FUNCTION
// ===================================

export interface CustomRenderOptions extends Omit<RenderOptions, 'wrapper'> {
  queryClient?: QueryClient
  reduxState?: Partial<RootState>
  reduxStore?: AppStore
  authState?: 'authenticated' | 'unauthenticated' | 'loading'
  session?: MockSession | null
  initialEntries?: string[]
}

/**
 * Custom render function que incluye automáticamente todos los providers
 * - QueryClient (TanStack Query)
 * - Redux Store
 * - NextAuth SessionProvider
 */
export const renderWithProviders = (
  ui: ReactElement,
  options: CustomRenderOptions = {}
) => {
  const {
    queryClient,
    reduxState,
    reduxStore,
    authState = 'unauthenticated',
    session,
    ...renderOptions
  } = options

  // Crear store con estado predefinido si se proporciona
  const store = reduxStore || (reduxState ? createTestStore(reduxState as PreloadedState<RootState>) : undefined)

  const Wrapper: React.FC<{ children: React.ReactNode }> = ({ children }) => (
    <AllTheProviders
      queryClient={queryClient}
      reduxStore={store}
      authState={authState}
      session={session}
    >
      {children}
    </AllTheProviders>
  )

  return {
    ...render(ui, { wrapper: Wrapper, ...renderOptions }),
    store: store || createTestStore(),
  }
}

/**
 * Render solo con Redux (sin QueryClient ni NextAuth)
 */
export const renderWithRedux = (
  ui: ReactElement,
  options: {
    reduxState?: Partial<RootState>
    reduxStore?: AppStore
  } & Omit<RenderOptions, 'wrapper'> = {}
) => {
  const { reduxState, reduxStore, ...renderOptions } = options
  const store = reduxStore || (reduxState ? createTestStore(reduxState as PreloadedState<RootState>) : createTestStore())

  const Wrapper: React.FC<{ children: React.ReactNode }> = ({ children }) => (
    <Provider store={store}>{children}</Provider>
  )

  return {
    ...render(ui, { wrapper: Wrapper, ...renderOptions }),
    store,
  }
}

/**
 * Render solo con QueryClient (sin Redux ni NextAuth)
 */
export const renderWithQuery = (
  ui: ReactElement,
  options: {
    queryClient?: QueryClient
  } & Omit<RenderOptions, 'wrapper'> = {}
) => {
  const { queryClient, ...renderOptions } = options
  const client = queryClient || createTestQueryClient()

  const Wrapper: React.FC<{ children: React.ReactNode }> = ({ children }) => (
    <QueryClientProvider client={client}>{children}</QueryClientProvider>
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

/**
 * Wrapper para testing de hooks que requieren Redux
 */
export const createReduxHookWrapper = (reduxStore?: AppStore, reduxState?: Partial<RootState>) => {
  const store = reduxStore || (reduxState ? createTestStore(reduxState as PreloadedState<RootState>) : createTestStore())

  return ({ children }: { children: React.ReactNode }) => (
    <Provider store={store}>{children}</Provider>
  )
}

/**
 * Wrapper completo para testing de hooks que requieren todos los providers
 */
export const createFullHookWrapper = (options?: {
  queryClient?: QueryClient
  reduxStore?: AppStore
  reduxState?: Partial<RootState>
  authState?: 'authenticated' | 'unauthenticated' | 'loading'
  session?: MockSession | null
}) => {
  const {
    queryClient = createTestQueryClient(),
    reduxStore,
    reduxState,
    authState = 'unauthenticated',
    session,
  } = options || {}

  const store = reduxStore || (reduxState ? createTestStore(reduxState as PreloadedState<RootState>) : createTestStore())
  
  let sessionData: MockSession | null = null
  if (authState === 'authenticated') {
    sessionData = session || createMockSession()
  }

  return ({ children }: { children: React.ReactNode }) => (
    <Provider store={store}>
      <QueryClientProvider client={queryClient}>
        <SessionProvider
          session={sessionData}
          refetchInterval={0}
          refetchOnWindowFocus={false}
        >
          {children}
        </SessionProvider>
      </QueryClientProvider>
    </Provider>
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
// HELPER FUNCTIONS
// ===================================

/**
 * Crear estado inicial de carrito para tests
 */
export const createMockCartState = (items: any[] = []) => ({
  cartReducer: {
    items,
    totalPrice: items.reduce((sum, item) => sum + (item.discountedPrice || item.price) * item.quantity, 0),
    isLoading: false,
    error: null,
  },
})

/**
 * Crear estado inicial de autenticación para tests
 */
export const createMockAuthState = (isAuthenticated: boolean = false) => {
  if (isAuthenticated) {
    return {
      authState: 'authenticated' as const,
      session: createMockSession(),
    }
  }
  return {
    authState: 'unauthenticated' as const,
    session: null,
  }
}

// ===================================
// EXPORTS
// ===================================

// Re-export everything from React Testing Library
export * from '@testing-library/react'

// Override render method
export { renderWithProviders as render }
