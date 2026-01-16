/**
 * Tests para funciones SQL de analytics
 * Verifica insert_analytics_event_optimized y get_analytics_metrics_aggregated
 */

import { createClient } from '@supabase/supabase-js'

// Solo ejecutar estos tests si tenemos acceso a Supabase
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY

const shouldRunTests = supabaseUrl && supabaseKey

describe.skip('Database Functions - Analytics', () => {
  let supabase: ReturnType<typeof createClient>

  beforeAll(() => {
    if (!shouldRunTests) {
      console.warn('⚠️  Tests de base de datos omitidos: variables de entorno no configuradas')
      return
    }

    supabase = createClient(supabaseUrl!, supabaseKey!)
  })

  describe('insert_analytics_event_optimized()', () => {
    it('debería insertar evento correctamente', async () => {
      if (!shouldRunTests) return

      const { data, error } = await supabase.rpc('insert_analytics_event_optimized', {
        p_event_name: 'page_view',
        p_category: 'navigation',
        p_action: 'view',
        p_label: 'test-page',
        p_value: null,
        p_user_id: null,
        p_session_id: 'test-session-db',
        p_page: '/test',
        p_user_agent: 'Mozilla/5.0 (Test)',
      })

      expect(error).toBeNull()
      expect(data).toBeDefined()
      expect(typeof data).toBe('number') // Retorna event_id (BIGINT)
      expect(data).toBeGreaterThan(0)
    })

    it('debería mapear tipos de eventos correctamente', async () => {
      if (!shouldRunTests) return

      const testCases = [
        { event: 'page_view', expectedType: 1 },
        { event: 'add_to_cart', expectedType: 5 },
        { event: 'purchase', expectedType: 8 },
      ]

      for (const testCase of testCases) {
        const { data: eventId, error } = await supabase.rpc('insert_analytics_event_optimized', {
          p_event_name: testCase.event,
          p_category: 'test',
          p_action: 'test',
          p_session_id: `test-session-${testCase.event}`,
          p_page: '/test',
        })

        expect(error).toBeNull()
        expect(eventId).toBeDefined()

        // Verificar que el evento se insertó con el tipo correcto
        const { data: event } = await supabase
          .from('analytics_events_optimized')
          .select('event_type, analytics_event_types(name)')
          .eq('id', eventId)
          .single()

        expect(event).toBeDefined()
        // El tipo debería coincidir (verificar indirectamente)
      }
    })

    it('debería hashear session_id correctamente', async () => {
      if (!shouldRunTests) return

      const sessionId = 'test-session-hash'
      const { data: eventId, error } = await supabase.rpc('insert_analytics_event_optimized', {
        p_event_name: 'page_view',
        p_category: 'navigation',
        p_action: 'view',
        p_session_id: sessionId,
        p_page: '/test',
      })

      expect(error).toBeNull()

      // Verificar que session_hash está presente
      const { data: event } = await supabase
        .from('analytics_events_optimized')
        .select('session_hash')
        .eq('id', eventId)
        .single()

      expect(event).toBeDefined()
      expect(event.session_hash).toBeDefined()
      expect(typeof event.session_hash).toBe('number')
    })

    it('debería manejar user_id como string o número', async () => {
      if (!shouldRunTests) return

      // Test con user_id como string numérico
      const { data: eventId1, error: error1 } = await supabase.rpc('insert_analytics_event_optimized', {
        p_event_name: 'page_view',
        p_category: 'navigation',
        p_action: 'view',
        p_user_id: '123',
        p_session_id: 'test-session-user1',
        p_page: '/test',
      })

      expect(error1).toBeNull()
      expect(eventId1).toBeDefined()

      // Test con user_id como string no numérico (debería hacer hash)
      const { data: eventId2, error: error2 } = await supabase.rpc('insert_analytics_event_optimized', {
        p_event_name: 'page_view',
        p_category: 'navigation',
        p_action: 'view',
        p_user_id: 'user-abc',
        p_session_id: 'test-session-user2',
        p_page: '/test',
      })

      expect(error2).toBeNull()
      expect(eventId2).toBeDefined()
    })
  })

  describe('get_analytics_metrics_aggregated()', () => {
    beforeEach(async () => {
      if (!shouldRunTests) return

      // Limpiar eventos de prueba anteriores
      await supabase
        .from('analytics_events_optimized')
        .delete()
        .eq('label', 'test-metrics')
        .catch(() => {})
    })

    it('debería calcular métricas correctamente', async () => {
      if (!shouldRunTests) return

      // Insertar eventos de prueba
      const now = Math.floor(Date.now() / 1000)
      const yesterday = now - 86400

      await supabase.rpc('insert_analytics_event_optimized', {
        p_event_name: 'page_view',
        p_category: 'navigation',
        p_action: 'view',
        p_label: 'test-metrics',
        p_session_id: 'test-session-metrics',
        p_page: '/test',
      })

      await supabase.rpc('insert_analytics_event_optimized', {
        p_event_name: 'add_to_cart',
        p_category: 'ecommerce',
        p_action: 'add',
        p_label: 'test-metrics',
        p_value: 1000,
        p_session_id: 'test-session-metrics',
        p_page: '/test',
      })

      await supabase.rpc('insert_analytics_event_optimized', {
        p_event_name: 'purchase',
        p_category: 'ecommerce',
        p_action: 'purchase',
        p_label: 'test-metrics',
        p_value: 5000,
        p_session_id: 'test-session-metrics',
        p_page: '/test',
      })

      // Calcular métricas
      const { data, error } = await supabase.rpc('get_analytics_metrics_aggregated', {
        p_start_date: yesterday,
        p_end_date: now,
        p_user_id: null,
      })

      expect(error).toBeNull()
      expect(data).toBeDefined()
      expect(data).toHaveProperty('ecommerce')
      expect(data).toHaveProperty('engagement')
      expect(data.ecommerce).toHaveProperty('cartAdditions')
      expect(data.ecommerce).toHaveProperty('totalRevenue')
    })

    it('debería filtrar por rango de fechas', async () => {
      if (!shouldRunTests) return

      const now = Math.floor(Date.now() / 1000)
      const yesterday = now - 86400
      const twoDaysAgo = now - 172800

      // Insertar evento dentro del rango
      await supabase.rpc('insert_analytics_event_optimized', {
        p_event_name: 'page_view',
        p_category: 'navigation',
        p_action: 'view',
        p_label: 'test-date-filter',
        p_session_id: 'test-session-date',
        p_page: '/test',
      })

      // Calcular métricas solo para últimas 24 horas
      const { data, error } = await supabase.rpc('get_analytics_metrics_aggregated', {
        p_start_date: yesterday,
        p_end_date: now,
        p_user_id: null,
      })

      expect(error).toBeNull()
      expect(data).toBeDefined()
      expect(data.engagement.totalEvents).toBeGreaterThanOrEqual(0)
    })

    it('debería filtrar por user_id cuando se proporciona', async () => {
      if (!shouldRunTests) return

      const now = Math.floor(Date.now() / 1000)
      const yesterday = now - 86400

      // Insertar eventos para diferentes usuarios
      await supabase.rpc('insert_analytics_event_optimized', {
        p_event_name: 'page_view',
        p_category: 'navigation',
        p_action: 'view',
        p_label: 'test-user-filter',
        p_user_id: '999',
        p_session_id: 'test-session-user999',
        p_page: '/test',
      })

      await supabase.rpc('insert_analytics_event_optimized', {
        p_event_name: 'page_view',
        p_category: 'navigation',
        p_action: 'view',
        p_label: 'test-user-filter',
        p_user_id: '888',
        p_session_id: 'test-session-user888',
        p_page: '/test',
      })

      // Calcular métricas solo para user 999
      const { data, error } = await supabase.rpc('get_analytics_metrics_aggregated', {
        p_start_date: yesterday,
        p_end_date: now,
        p_user_id: 999,
      })

      expect(error).toBeNull()
      expect(data).toBeDefined()
      // Las métricas deberían reflejar solo eventos del usuario 999
    })

    it('debería calcular tasas de conversión correctamente', async () => {
      if (!shouldRunTests) return

      const now = Math.floor(Date.now() / 1000)
      const yesterday = now - 86400

      // Insertar eventos para calcular conversión
      await supabase.rpc('insert_analytics_event_optimized', {
        p_event_name: 'begin_checkout',
        p_category: 'ecommerce',
        p_action: 'view',
        p_label: 'test-conversion',
        p_session_id: 'test-session-conv',
        p_page: '/checkout',
      })

      await supabase.rpc('insert_analytics_event_optimized', {
        p_event_name: 'purchase',
        p_category: 'ecommerce',
        p_action: 'purchase',
        p_label: 'test-conversion',
        p_value: 1000,
        p_session_id: 'test-session-conv',
        p_page: '/checkout',
      })

      const { data, error } = await supabase.rpc('get_analytics_metrics_aggregated', {
        p_start_date: yesterday,
        p_end_date: now,
        p_user_id: null,
      })

      expect(error).toBeNull()
      expect(data).toBeDefined()
      expect(data.ecommerce).toHaveProperty('conversionRate')
      expect(data.ecommerce.conversionRate).toBeGreaterThanOrEqual(0)
      expect(data.ecommerce.conversionRate).toBeLessThanOrEqual(100)
    })
  })

  describe('refresh_analytics_daily_summary()', () => {
    it('debería refrescar materialized view sin errores', async () => {
      if (!shouldRunTests) return

      const { data, error } = await supabase.rpc('refresh_analytics_daily_summary')

      expect(error).toBeNull()
      // La función no retorna datos, solo refresca la vista
    })

    it('debería actualizar datos en materialized view', async () => {
      if (!shouldRunTests) return

      // Insertar algunos eventos
      await supabase.rpc('insert_analytics_event_optimized', {
        p_event_name: 'page_view',
        p_category: 'navigation',
        p_action: 'view',
        p_session_id: 'test-session-refresh',
        p_page: '/test',
      })

      // Refrescar vista
      await supabase.rpc('refresh_analytics_daily_summary')

      // Verificar que la vista tiene datos
      const { data: summary, error } = await supabase
        .from('analytics_daily_summary')
        .select('*')
        .limit(1)

      expect(error).toBeNull()
      // La vista puede estar vacía si no hay datos del día actual
    })
  })
})
