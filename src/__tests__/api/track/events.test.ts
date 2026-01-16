/**
 * Integration tests para /api/track/events
 * Verifica endpoint alternativo anti-bloqueadores
 */

import { POST } from '@/app/api/track/events/route'
import { NextRequest } from 'next/server'
import { getSupabaseClient } from '@/lib/integrations/supabase/index'

// Mock de Supabase
jest.mock('@/lib/integrations/supabase/index', () => ({
  getSupabaseClient: jest.fn(),
}))

const mockGetSupabaseClient = getSupabaseClient as jest.MockedFunction<typeof getSupabaseClient>

describe('POST /api/track/events', () => {
  let mockSupabase: any

  beforeEach(() => {
    jest.clearAllMocks()
    jest.useFakeTimers()

    mockSupabase = {
      rpc: jest.fn().mockResolvedValue({ data: null, error: null }),
    }

    mockGetSupabaseClient.mockReturnValue(mockSupabase as any)
  })

  afterEach(() => {
    jest.useRealTimers()
  })

  it('debería insertar evento exitosamente', async () => {
    const event = {
      event: 'page_view',
      category: 'navigation',
      action: 'view',
      label: '/test',
      sessionId: 'session-123',
      page: '/test',
    }

    const request = new NextRequest('http://localhost:3000/api/track/events', {
      method: 'POST',
      body: JSON.stringify(event),
      headers: {
        'Content-Type': 'application/json',
      },
    })

    const response = await POST(request)
    const data = await response.json()

    expect(response.status).toBe(200)
    expect(data.success).toBe(true)

    // Avanzar timers para que se ejecute setImmediate
    jest.advanceTimersByTime(100)

    // Esperar a que se complete el procesamiento asíncrono
    await new Promise((resolve) => setImmediate(resolve))

    expect(mockSupabase.rpc).toHaveBeenCalledWith('insert_analytics_event_optimized', {
      p_event_name: 'page_view',
      p_category: 'navigation',
      p_action: 'view',
      p_label: '/test',
      p_value: null,
      p_user_id: null,
      p_session_id: 'session-123',
      p_page: '/test',
      p_user_agent: null,
    })
  })

  it('debería retornar error 400 cuando faltan campos requeridos', async () => {
    const event = {
      event: 'page_view',
      // Faltan category, action, sessionId
    }

    const request = new NextRequest('http://localhost:3000/api/track/events', {
      method: 'POST',
      body: JSON.stringify(event),
      headers: {
        'Content-Type': 'application/json',
      },
    })

    const response = await POST(request)
    const data = await response.json()

    expect(response.status).toBe(400)
    expect(data.error).toContain('faltan campos requeridos')
    expect(mockSupabase.rpc).not.toHaveBeenCalled()
  })

  it('debería evitar eventos duplicados usando cache', async () => {
    const event = {
      event: 'page_view',
      category: 'navigation',
      action: 'view',
      sessionId: 'session-123',
      page: '/test',
    }

    const request1 = new NextRequest('http://localhost:3000/api/track/events', {
      method: 'POST',
      body: JSON.stringify(event),
      headers: {
        'Content-Type': 'application/json',
      },
    })

    const response1 = await POST(request1)
    const data1 = await response1.json()

    expect(response1.status).toBe(200)
    expect(data1.success).toBe(true)

    // Segunda llamada dentro del TTL (5 segundos)
    jest.advanceTimersByTime(1000)

    const request2 = new NextRequest('http://localhost:3000/api/track/events', {
      method: 'POST',
      body: JSON.stringify(event),
      headers: {
        'Content-Type': 'application/json',
      },
    })

    const response2 = await POST(request2)
    const data2 = await response2.json()

    expect(response2.status).toBe(200)
    expect(data2.cached).toBe(true)

    // Solo debería llamarse RPC una vez
    await new Promise((resolve) => setImmediate(resolve))
    expect(mockSupabase.rpc).toHaveBeenCalledTimes(1)
  })

  it('debería procesar evento duplicado después de TTL', async () => {
    const event = {
      event: 'page_view',
      category: 'navigation',
      action: 'view',
      sessionId: 'session-123',
      page: '/test',
    }

    const request1 = new NextRequest('http://localhost:3000/api/track/events', {
      method: 'POST',
      body: JSON.stringify(event),
      headers: {
        'Content-Type': 'application/json',
      },
    })

    await POST(request1)
    await new Promise((resolve) => setImmediate(resolve))

    // Avanzar tiempo más allá del TTL
    jest.advanceTimersByTime(6000)

    const request2 = new NextRequest('http://localhost:3000/api/track/events', {
      method: 'POST',
      body: JSON.stringify(event),
      headers: {
        'Content-Type': 'application/json',
      },
    })

    await POST(request2)
    await new Promise((resolve) => setImmediate(resolve))

    // Ahora debería llamarse RPC dos veces
    expect(mockSupabase.rpc).toHaveBeenCalledTimes(2)
  })

  it('debería manejar errores de Supabase correctamente', async () => {
    mockSupabase.rpc.mockResolvedValue({
      data: null,
      error: { message: 'Database error' },
    })

    const event = {
      event: 'page_view',
      category: 'navigation',
      action: 'view',
      sessionId: 'session-123',
      page: '/test',
    }

    const request = new NextRequest('http://localhost:3000/api/track/events', {
      method: 'POST',
      body: JSON.stringify(event),
      headers: {
        'Content-Type': 'application/json',
      },
    })

    const response = await POST(request)
    const data = await response.json()

    // La respuesta debería ser exitosa (procesamiento asíncrono)
    expect(response.status).toBe(200)
    expect(data.success).toBe(true)

    // El error se loguea pero no afecta la respuesta
    await new Promise((resolve) => setImmediate(resolve))
    expect(mockSupabase.rpc).toHaveBeenCalled()
  })

  it('debería manejar cuando Supabase client no está disponible', async () => {
    mockGetSupabaseClient.mockReturnValue(null)

    const event = {
      event: 'page_view',
      category: 'navigation',
      action: 'view',
      sessionId: 'session-123',
      page: '/test',
    }

    const request = new NextRequest('http://localhost:3000/api/track/events', {
      method: 'POST',
      body: JSON.stringify(event),
      headers: {
        'Content-Type': 'application/json',
      },
    })

    const response = await POST(request)
    const data = await response.json()

    // La respuesta debería ser exitosa
    expect(response.status).toBe(200)
    expect(data.success).toBe(true)

    // No debería llamar RPC
    await new Promise((resolve) => setImmediate(resolve))
    expect(mockSupabase.rpc).not.toHaveBeenCalled()
  })

  it('debería retornar error 500 cuando el JSON es inválido', async () => {
    const request = new NextRequest('http://localhost:3000/api/track/events', {
      method: 'POST',
      body: 'invalid json',
      headers: {
        'Content-Type': 'application/json',
      },
    })

    const response = await POST(request)
    const data = await response.json()

    expect(response.status).toBe(500)
    expect(data.error).toContain('Error interno del servidor')
  })

  it('debería incluir headers correctos en la respuesta', async () => {
    const event = {
      event: 'page_view',
      category: 'navigation',
      action: 'view',
      sessionId: 'session-123',
      page: '/test',
    }

    const request = new NextRequest('http://localhost:3000/api/track/events', {
      method: 'POST',
      body: JSON.stringify(event),
      headers: {
        'Content-Type': 'application/json',
      },
    })

    const response = await POST(request)

    expect(response.headers.get('Cache-Control')).toBe('no-cache, no-store, must-revalidate')
    expect(response.headers.get('Content-Type')).toBe('application/json')
  })
})
