interface MockSession {
  data: {
    user: { email: string; name: string }
  }
  status: 'authenticated' | 'loading' | 'unauthenticated'
}

interface MockRouter {
  push: jest.MockedFunction<(url: string) => void>
  replace: jest.MockedFunction<(url: string) => void>
  back: jest.MockedFunction<() => void>
}

/**
 * Tests unitarios para los componentes del sistema de drivers
 * Verifica la funcionalidad de todos los componentes React
 */

import { describe, it, expect, beforeEach, jest } from '@jest/globals'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'

// Mock de NextAuth
jest.mock('next-auth/react')

// Mock de Next.js router
jest.mock('next/navigation', () => ({
  useRouter: jest.fn(),
  useParams: jest.fn(() => ({ id: 'route-1' })),
  usePathname: jest.fn(() => '/driver/dashboard'),
}))

// Mock del contexto de drivers
jest.mock('@/contexts/DriverContext', () => ({
  useDriver: jest.fn(),
  DriverProvider: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
}))

// Mock de Google Maps
jest.mock('@vis.gl/react-google-maps', () => ({
  APIProvider: ({ children }: { children: React.ReactNode }) => (
    <div data-testid='api-provider'>{children}</div>
  ),
  Map: ({ children }: { children: React.ReactNode }) => (
    <div data-testid='google-map'>{children}</div>
  ),
  Marker: () => <div data-testid='marker' />,
  DirectionsRenderer: () => <div data-testid='directions-renderer' />,
}))

// Importar componentes a testear
import { DriverNavigation } from '@/components/driver/DriverNavigation'
import { DeliveryCard } from '@/components/driver/DeliveryCard'
import { NavigationInstructions } from '@/components/driver/NavigationInstructions'
import DriverDashboardPage from '@/app/driver/dashboard/page'

describe('Driver Components Unit Tests', () => {
  const mockUseSession = useSession as jest.MockedFunction<typeof useSession>
  const mockUseRouter = useRouter as jest.MockedFunction<typeof useRouter>
  const mockUseDriver = require('@/contexts/DriverContext').useDriver

  const mockDriverState = {
    driver: {
      id: 'driver-1',
      name: 'Carlos Rodríguez',
      email: 'carlos@pinteya.com',
      vehicle_type: 'Van',
      license_plate: 'ABC123',
      status: 'available',
    },
    currentRoute: null,
    assignedRoutes: [],
    currentLocation: { lat: -34.6037, lng: -58.3816 },
    isTracking: false,
    isOnline: true,
    notifications: [],
    loading: false,
    error: null,
  }

  const mockDriverActions = {
    startLocationTracking: jest.fn(),
    stopLocationTracking: jest.fn(),
    updateDriverLocation: jest.fn(),
    startRoute: jest.fn(),
    completeRoute: jest.fn(),
    completeDelivery: jest.fn(),
    goOnline: jest.fn(),
    goOffline: jest.fn(),
  }

  beforeEach(() => {
    jest.clearAllMocks()

    mockUseSession.mockReturnValue({
      data: {
        user: { email: 'carlos@pinteya.com', name: 'Carlos Rodríguez' },
      },
      status: 'authenticated',
    } as MockSession)

    mockUseRouter.mockReturnValue({
      push: jest.fn(),
      replace: jest.fn(),
      back: jest.fn(),
    } as MockRouter)

    mockUseDriver.mockReturnValue({
      state: mockDriverState,
      ...mockDriverActions,
    })
  })

  describe('DriverNavigation Component', () => {
    it('should render navigation items correctly', () => {
      render(<DriverNavigation />)

      expect(screen.getByText('Inicio')).toBeInTheDocument()
      expect(screen.getByText('Rutas')).toBeInTheDocument()
      expect(screen.getByText('Entregas')).toBeInTheDocument()
      expect(screen.getByText('Perfil')).toBeInTheDocument()
    })

    it('should show driver name and online status', () => {
      render(<DriverNavigation />)

      expect(screen.getByText('Carlos Rodríguez')).toBeInTheDocument()
      expect(screen.getByText('En línea')).toBeInTheDocument()
    })

    it('should show offline status when driver is offline', () => {
      mockUseDriver.mockReturnValue({
        state: { ...mockDriverState, isOnline: false },
        ...mockDriverActions,
      })

      render(<DriverNavigation />)

      expect(screen.getByText('Desconectado')).toBeInTheDocument()
    })

    it('should show active route indicator', () => {
      const activeRoute = {
        id: 'route-1',
        name: 'Ruta Centro',
        status: 'active' as const,
        shipments: [],
        waypoints: [],
        total_distance: 10,
        estimated_time: 60,
        optimization_score: 85,
      }

      mockUseDriver.mockReturnValue({
        state: { ...mockDriverState, currentRoute: activeRoute },
        ...mockDriverActions,
      })

      render(<DriverNavigation />)

      expect(screen.getByText('Ruta Activa')).toBeInTheDocument()
    })
  })

  describe('DeliveryCard Component', () => {
    const mockDelivery = {
      id: 'delivery-1',
      tracking_number: 'TRK-001',
      customer_name: 'Juan Pérez',
      customer_phone: '+54 11 1234-5678',
      destination: {
        address: 'Av. Corrientes 1234',
        city: 'Buenos Aires',
        postal_code: '1043',
        coordinates: { lat: -34.6037, lng: -58.3816 },
        notes: 'Timbre 2B',
      },
      items: [{ name: 'Producto 1', quantity: 2, weight: 1.5 }],
      status: 'confirmed' as const,
      estimated_delivery_time: '14:00 - 18:00',
      special_instructions: 'Llamar antes de llegar',
      requires_signature: true,
      cash_on_delivery: 5000,
    }

    const mockProps = {
      delivery: mockDelivery,
      isActive: true,
      onComplete: jest.fn(),
      onStartNavigation: jest.fn(),
      isNavigating: false,
    }

    it('should render delivery information correctly', () => {
      render(<DeliveryCard {...mockProps} />)

      expect(screen.getByText('Juan Pérez')).toBeInTheDocument()
      expect(screen.getByText('TRK-001')).toBeInTheDocument()
      expect(screen.getByText('Av. Corrientes 1234')).toBeInTheDocument()
      expect(screen.getByText('Buenos Aires, 1043')).toBeInTheDocument()
    })

    it('should show special instructions', () => {
      render(<DeliveryCard {...mockProps} />)

      expect(screen.getByText('Llamar antes de llegar')).toBeInTheDocument()
    })

    it('should show cash on delivery amount', () => {
      render(<DeliveryCard {...mockProps} />)

      expect(screen.getByText('Cobrar: $5.000')).toBeInTheDocument()
    })

    it('should call onStartNavigation when navigation button is clicked', () => {
      render(<DeliveryCard {...mockProps} />)

      const navButton = screen.getByText('Navegar')
      fireEvent.click(navButton)

      expect(mockProps.onStartNavigation).toHaveBeenCalled()
    })

    it('should call onComplete when complete button is clicked', () => {
      render(<DeliveryCard {...mockProps} />)

      const completeButton = screen.getByText('Marcar como Entregado')
      fireEvent.click(completeButton)

      expect(mockProps.onComplete).toHaveBeenCalled()
    })

    it('should show call and SMS buttons when phone is available', () => {
      render(<DeliveryCard {...mockProps} />)

      expect(screen.getByText('Llamar')).toBeInTheDocument()
      expect(screen.getByText('SMS')).toBeInTheDocument()
    })
  })

  describe('NavigationInstructions Component', () => {
    const mockInstructions = [
      {
        instruction: 'Head north on Av. Corrientes',
        distance: '500 m',
        duration: '2 mins',
        maneuver: 'straight',
        coordinates: { lat: -34.6037, lng: -58.3816 },
      },
      {
        instruction: 'Turn right onto Av. 9 de Julio',
        distance: '1.2 km',
        duration: '4 mins',
        maneuver: 'turn-right',
        coordinates: { lat: -34.6, lng: -58.3816 },
      },
    ]

    const mockProps = {
      instructions: mockInstructions,
      currentLocation: { lat: -34.6037, lng: -58.3816 },
    }

    it('should render current instruction', () => {
      render(<NavigationInstructions {...mockProps} />)

      expect(screen.getByText('Head north on Av. Corrientes')).toBeInTheDocument()
      expect(screen.getByText('500 m')).toBeInTheDocument()
      expect(screen.getByText('2 mins')).toBeInTheDocument()
    })

    it('should show next instruction', () => {
      render(<NavigationInstructions {...mockProps} />)

      expect(screen.getByText('Luego: Turn right onto Av. 9 de Julio')).toBeInTheDocument()
    })

    it('should show progress indicator', () => {
      render(<NavigationInstructions {...mockProps} />)

      expect(screen.getByText('Paso 1 de 2')).toBeInTheDocument()
      expect(screen.getByText('50%')).toBeInTheDocument()
    })
  })

  describe('DriverDashboardPage Component', () => {
    it('should render dashboard with driver information', () => {
      render(<DriverDashboardPage />)

      expect(screen.getByText('Estado del Driver')).toBeInTheDocument()
      expect(screen.getByText('Van - ABC123')).toBeInTheDocument()
    })

    it('should show online/offline controls', () => {
      render(<DriverDashboardPage />)

      expect(screen.getByText('En Línea')).toBeInTheDocument()
      expect(screen.getByText('Desconectar')).toBeInTheDocument()
    })

    it('should call goOnline when connect button is clicked', () => {
      mockUseDriver.mockReturnValue({
        state: { ...mockDriverState, isOnline: false },
        ...mockDriverActions,
      })

      render(<DriverDashboardPage />)

      const connectButton = screen.getByText('Conectarse')
      fireEvent.click(connectButton)

      expect(mockDriverActions.goOnline).toHaveBeenCalled()
    })

    it('should show current location when available', () => {
      render(<DriverDashboardPage />)

      expect(screen.getByText(/Ubicación: -34.6037, -58.3816/)).toBeInTheDocument()
    })

    it('should show today statistics', () => {
      render(<DriverDashboardPage />)

      expect(screen.getByText('Estadísticas de Hoy')).toBeInTheDocument()
      expect(screen.getByText('Entregas')).toBeInTheDocument()
      expect(screen.getByText('Distancia')).toBeInTheDocument()
      expect(screen.getByText('Tiempo Activo')).toBeInTheDocument()
      expect(screen.getByText('Eficiencia')).toBeInTheDocument()
    })
  })
})
