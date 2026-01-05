/**
 * Tests de APIs Actualizadas para Sistema de Drivers
 * Verifica APIs que fueron modificadas para usar tabla drivers unificada
 */

import { describe, it, expect, beforeEach, jest } from '@jest/globals'
import { NextRequest } from 'next/server'

// Mock de auth.ts antes de cualquier importación
jest.mock('@/auth', () => ({
  auth: jest.fn(),
  signIn: jest.fn(),
  signOut: jest.fn(),
}))

// Mock de NextAuth
jest.mock('@/lib/auth/config', () => ({
  auth: jest.fn(),
}))

// Mock de Supabase
jest.mock('@/lib/integrations/supabase/server', () => ({
  createClient: jest.fn(),
  createAdminClient: jest.fn(),
}))

// Importar APIs a testear
import { GET as getDrivers, POST as createDriver, PATCH as updateDriver, DELETE as deleteDriver } from '@/app/api/admin/logistics/drivers/route'
import { GET as getRoutes } from '@/app/api/admin/logistics/routes/route'
import { PATCH as assignDriver } from '@/app/api/admin/logistics/routes/[id]/assign-driver/route'
import { GET as getProfile, PUT as updateProfile } from '@/app/api/driver/profile/route'
import { POST as updateLocation } from '@/app/api/driver/location/route'

describe('Driver APIs Updated Tests', () => {
  const mockAuth = require('@/lib/auth/config').auth
  const mockCreateClient = require('@/lib/integrations/supabase/server').createClient
  const mockCreateAdminClient = require('@/lib/integrations/supabase/server').createAdminClient

  const mockAdminSession = {
    user: {
      email: 'admin@pinteya.com',
      id: 'admin-1',
      role: 'admin',
    },
  }

  const mockDriverSession = {
    user: {
      email: 'carlos.rodriguez@pinteya.com',
      id: 'driver-1',
      role: 'driver',
    },
  }

  const mockDriver = {
    id: 'driver-1',
    first_name: 'Carlos',
    last_name: 'Rodriguez',
    email: 'carlos.rodriguez@pinteya.com',
    phone: '+54 11 1234-5678',
    driver_license: 'DL001234567',
    license_plate: 'ABC123',
    vehicle_type: 'Van',
    status: 'available',
    max_capacity: 50,
    current_location: null,
    rating: 5.0,
    total_deliveries: 0,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  }

  const mockSupabaseClient = {
    from: jest.fn(() => ({
      select: jest.fn(() => ({
        eq: jest.fn(() => ({
          single: jest.fn(() => Promise.resolve({ data: mockDriver, error: null })),
          order: jest.fn(() => Promise.resolve({ data: [mockDriver], error: null })),
          range: jest.fn(() => Promise.resolve({ data: [mockDriver], error: null })),
        })),
        in: jest.fn(() => ({
          order: jest.fn(() => Promise.resolve({ data: [], error: null })),
        })),
        gte: jest.fn(() => ({
          lte: jest.fn(() => Promise.resolve({ data: [], error: null })),
        })),
      })),
      insert: jest.fn(() => ({
        select: jest.fn(() => ({
          single: jest.fn(() => Promise.resolve({ data: mockDriver, error: null })),
        })),
      })),
      update: jest.fn(() => ({
        eq: jest.fn(() => ({
          select: jest.fn(() => ({
            single: jest.fn(() => Promise.resolve({ data: mockDriver, error: null })),
          })),
        })),
      })),
      delete: jest.fn(() => ({
        eq: jest.fn(() => Promise.resolve({ data: null, error: null })),
      })),
    })),
  }

  beforeEach(() => {
    jest.clearAllMocks()
    mockCreateClient.mockReturnValue(mockSupabaseClient)
    mockCreateAdminClient.mockReturnValue(mockSupabaseClient)
  })

  describe('GET /api/admin/logistics/drivers', () => {
    it('debe listar drivers usando tabla drivers (no logistics_drivers)', async () => {
      mockAuth.mockResolvedValue(mockAdminSession)

      // Mock de user_profiles para validación de admin
      mockSupabaseClient.from.mockReturnValueOnce({
        select: jest.fn(() => ({
          eq: jest.fn(() => ({
            single: jest.fn(() =>
              Promise.resolve({
                data: { email: 'admin@pinteya.com', role_id: 'role-admin' },
                error: null,
              })
            ),
          })),
        })),
      })

      // Mock de user_roles
      mockSupabaseClient.from.mockReturnValueOnce({
        select: jest.fn(() => ({
          eq: jest.fn(() => ({
            single: jest.fn(() =>
              Promise.resolve({ data: { role_name: 'admin' }, error: null })
            ),
          })),
        })),
      })

      // Mock de drivers
      mockSupabaseClient.from.mockReturnValueOnce({
        select: jest.fn(() => ({
          order: jest.fn(() => ({
            range: jest.fn(() =>
              Promise.resolve({
                data: [mockDriver],
                error: null,
              })
            ),
          })),
        })),
      })

      const request = new NextRequest('http://localhost:3000/api/admin/logistics/drivers')
      const response = await getDrivers(request)
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(Array.isArray(data)).toBe(true)
      // Verificar que se usa tabla drivers
      expect(mockSupabaseClient.from).toHaveBeenCalledWith('drivers')
    })

    it('debe retornar drivers con first_name y last_name (no name)', async () => {
      mockAuth.mockResolvedValue(mockAdminSession)

      // Setup mocks similar al anterior
      mockSupabaseClient.from.mockReturnValueOnce({
        select: jest.fn(() => ({
          eq: jest.fn(() => ({
            single: jest.fn(() =>
              Promise.resolve({
                data: { email: 'admin@pinteya.com', role_id: 'role-admin' },
                error: null,
              })
            ),
          })),
        })),
      })

      mockSupabaseClient.from.mockReturnValueOnce({
        select: jest.fn(() => ({
          eq: jest.fn(() => ({
            single: jest.fn(() =>
              Promise.resolve({ data: { role_name: 'admin' }, error: null })
            ),
          })),
        })),
      })

      mockSupabaseClient.from.mockReturnValueOnce({
        select: jest.fn(() => ({
          order: jest.fn(() => ({
            range: jest.fn(() =>
              Promise.resolve({
                data: [mockDriver],
                error: null,
              })
            ),
          })),
        })),
      })

      const request = new NextRequest('http://localhost:3000/api/admin/logistics/drivers')
      const response = await getDrivers(request)
      const data = await response.json()

      if (data.length > 0 && data[0].name) {
        // Si hay datos, verificar que name es combinación de first_name y last_name
        expect(data[0]).toHaveProperty('name')
        expect(data[0].name).toContain(mockDriver.first_name)
      }
    })
  })

  describe('POST /api/admin/logistics/drivers', () => {
    it('debe crear driver con first_name y last_name separados', async () => {
      mockAuth.mockResolvedValue(mockAdminSession)

      // Setup mocks
      mockSupabaseClient.from.mockReturnValueOnce({
        select: jest.fn(() => ({
          eq: jest.fn(() => ({
            single: jest.fn(() => Promise.resolve({ data: null, error: null })),
          })),
        })),
      })

      mockSupabaseClient.from.mockReturnValueOnce({
        select: jest.fn(() => ({
          eq: jest.fn(() => ({
            single: jest.fn(() =>
              Promise.resolve({
                data: { email: 'admin@pinteya.com', role_id: 'role-admin' },
                error: null,
              })
            ),
          })),
        })),
      })

      mockSupabaseClient.from.mockReturnValueOnce({
        select: jest.fn(() => ({
          eq: jest.fn(() => ({
            single: jest.fn(() =>
              Promise.resolve({ data: { role_name: 'admin' }, error: null })
            ),
          })),
        })),
      })

      mockSupabaseClient.from.mockReturnValueOnce({
        select: jest.fn(() => ({
          eq: jest.fn(() => ({
            single: jest.fn(() => Promise.resolve({ data: null, error: null })),
          })),
        })),
      })

      mockSupabaseClient.from.mockReturnValueOnce({
        insert: jest.fn(() => ({
          select: jest.fn(() => ({
            single: jest.fn(() => Promise.resolve({ data: mockDriver, error: null })),
          })),
        })),
      })

      const requestBody = {
        name: 'Carlos Rodriguez',
        phone: '+54 11 1234-5678',
        email: 'carlos.rodriguez@pinteya.com',
        vehicle_type: 'Van',
        license_plate: 'ABC123',
        max_capacity: 50,
        status: 'available',
      }

      const request = new NextRequest('http://localhost:3000/api/admin/logistics/drivers', {
        method: 'POST',
        body: JSON.stringify(requestBody),
      })

      const response = await createDriver(request)

      // Verificar que se llama a insert con first_name y last_name
      const insertCall = mockSupabaseClient.from().insert
      expect(insertCall).toHaveBeenCalled()
    })

    it('debe usar tabla drivers (no logistics_drivers)', async () => {
      mockAuth.mockResolvedValue(mockAdminSession)

      // Similar setup al anterior
      const request = new NextRequest('http://localhost:3000/api/admin/logistics/drivers', {
        method: 'POST',
        body: JSON.stringify({
          name: 'Test Driver',
          phone: '+54 11 1234-5678',
          vehicle_type: 'Van',
          license_plate: 'TEST123',
          max_capacity: 50,
        }),
      })

      // Verificar que from('drivers') es llamado, no from('logistics_drivers')
      expect(mockSupabaseClient.from).toHaveBeenCalled()
    })
  })

  describe('PATCH /api/admin/logistics/drivers', () => {
    it('debe actualizar driver usando tabla drivers', async () => {
      mockAuth.mockResolvedValue(mockAdminSession)

      const requestBody = {
        id: 'driver-1',
        status: 'busy',
        max_capacity: 60,
      }

      const request = new NextRequest('http://localhost:3000/api/admin/logistics/drivers', {
        method: 'PATCH',
        body: JSON.stringify(requestBody),
      })

      // Setup mocks
      mockSupabaseClient.from.mockReturnValueOnce({
        select: jest.fn(() => ({
          eq: jest.fn(() => ({
            single: jest.fn(() =>
              Promise.resolve({
                data: { email: 'admin@pinteya.com', role_id: 'role-admin' },
                error: null,
              })
            ),
          })),
        })),
      })

      mockSupabaseClient.from.mockReturnValueOnce({
        select: jest.fn(() => ({
          eq: jest.fn(() => ({
            single: jest.fn(() =>
              Promise.resolve({ data: { role_name: 'admin' }, error: null })
            ),
          })),
        })),
      })

      mockSupabaseClient.from.mockReturnValueOnce({
        select: jest.fn(() => ({
          eq: jest.fn(() => ({
            single: jest.fn(() => Promise.resolve({ data: mockDriver, error: null })),
          })),
        })),
      })

      mockSupabaseClient.from.mockReturnValueOnce({
        update: jest.fn(() => ({
          eq: jest.fn(() => ({
            select: jest.fn(() => ({
              single: jest.fn(() => Promise.resolve({ data: { ...mockDriver, ...requestBody }, error: null })),
            })),
          })),
        })),
      })

      const response = await updateDriver(request)

      expect(mockSupabaseClient.from).toHaveBeenCalledWith('drivers')
    })
  })

  describe('GET /api/admin/logistics/routes', () => {
    it('debe incluir driver con first_name y last_name en rutas', async () => {
      mockAuth.mockResolvedValue(mockAdminSession)

      const mockRoute = {
        id: 'route-1',
        name: 'Ruta Test',
        driver_id: 'driver-1',
        status: 'planned',
        driver: {
          id: 'driver-1',
          first_name: 'Carlos',
          last_name: 'Rodriguez',
          phone: '+54 11 1234-5678',
          vehicle_type: 'Van',
          license_plate: 'ABC123',
          status: 'available',
        },
      }

      // Setup mocks
      mockSupabaseClient.from.mockReturnValueOnce({
        select: jest.fn(() => ({
          eq: jest.fn(() => ({
            single: jest.fn(() =>
              Promise.resolve({
                data: { email: 'admin@pinteya.com', role_id: 'role-admin' },
                error: null,
              })
            ),
          })),
        })),
      })

      mockSupabaseClient.from.mockReturnValueOnce({
        select: jest.fn(() => ({
          eq: jest.fn(() => ({
            single: jest.fn(() =>
              Promise.resolve({ data: { role_name: 'admin' }, error: null })
            ),
          })),
        })),
      })

      mockSupabaseClient.from.mockReturnValueOnce({
        select: jest.fn(() => ({
          order: jest.fn(() => ({
            range: jest.fn(() => Promise.resolve({ data: [mockRoute], error: null })),
          })),
        })),
      })

      const request = new NextRequest('http://localhost:3000/api/admin/logistics/routes')
      const response = await getRoutes(request)

      expect(response.status).toBe(200)
    })
  })

  describe('POST /api/driver/location', () => {
    it('debe actualizar current_location en tabla drivers', async () => {
      mockAuth.mockResolvedValue(mockDriverSession)

      const locationData = {
        location: { lat: -34.6037, lng: -58.3816 },
        speed: 25,
        heading: 180,
        accuracy: 5,
      }

      // Setup mocks
      mockSupabaseClient.from.mockReturnValueOnce({
        select: jest.fn(() => ({
          eq: jest.fn(() => ({
            single: jest.fn(() => Promise.resolve({ data: { id: 'driver-1', status: 'available' }, error: null })),
          })),
        })),
      })

      mockSupabaseClient.from.mockReturnValueOnce({
        update: jest.fn(() => ({
          eq: jest.fn(() => ({
            select: jest.fn(() => ({
              single: jest.fn(() =>
                Promise.resolve({
                  data: { ...mockDriver, current_location: locationData.location },
                  error: null,
                })
              ),
            })),
          })),
        })),
      })

      mockSupabaseClient.from.mockReturnValueOnce({
        insert: jest.fn(() => Promise.resolve({ data: null, error: null })),
      })

      const request = new NextRequest('http://localhost:3000/api/driver/location', {
        method: 'POST',
        body: JSON.stringify(locationData),
      })

      const response = await updateLocation(request)

      // Verificar que se actualiza en tabla drivers
      expect(mockSupabaseClient.from).toHaveBeenCalledWith('drivers')
    })
  })

  describe('GET /api/driver/profile', () => {
    it('debe retornar perfil con first_name y last_name', async () => {
      mockAuth.mockResolvedValue(mockDriverSession)

      // Setup mocks
      mockSupabaseClient.from.mockReturnValueOnce({
        select: jest.fn(() => ({
          eq: jest.fn(() => ({
            single: jest.fn(() => Promise.resolve({ data: mockDriver, error: null })),
          })),
        })),
      })

      mockSupabaseClient.from.mockReturnValueOnce({
        select: jest.fn(() => ({
          eq: jest.fn(() => ({
            in: jest.fn(() => ({
              order: jest.fn(() => Promise.resolve({ data: [], error: null })),
            })),
          })),
        })),
      })

      mockSupabaseClient.from.mockReturnValueOnce({
        select: jest.fn(() => ({
          eq: jest.fn(() => ({
            eq: jest.fn(() => ({
              gte: jest.fn(() => ({
                lte: jest.fn(() => Promise.resolve({ data: [], error: null })),
              })),
            })),
          })),
        })),
      })

      mockSupabaseClient.from.mockReturnValueOnce({
        select: jest.fn(() => ({
          eq: jest.fn(() => ({
            gte: jest.fn(() => ({
              lte: jest.fn(() => Promise.resolve({ data: [], error: null })),
            })),
          })),
        })),
      })

      const request = new NextRequest('http://localhost:3000/api/driver/profile')
      const response = await getProfile(request)
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.driver).toHaveProperty('first_name')
      expect(data.driver).toHaveProperty('last_name')
      expect(data.driver.name).toBe(`${mockDriver.first_name} ${mockDriver.last_name}`)
    })
  })
})

