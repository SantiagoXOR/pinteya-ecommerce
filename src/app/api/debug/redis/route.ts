// ===================================
// PINTEYA E-COMMERCE - REDIS DIAGNÓSTICO
// ===================================

import { NextRequest, NextResponse } from 'next/server'
import {
  getRedisClient,
  isRedisAvailable,
  getRateLimitStats,
} from '@/lib/integrations/redis'

// ===================================
// GET /api/debug/redis - Diagnóstico de Redis
// ===================================
export async function GET(request: NextRequest) {
  try {
    const diagnostics: any = {
      timestamp: new Date().toISOString(),
      environment: {
        REDIS_HOST: process.env.REDIS_HOST || 'no configurado',
        REDIS_PORT: process.env.REDIS_PORT || 'no configurado',
        REDIS_DB: process.env.REDIS_DB || 'no configurado',
        REDIS_PASSWORD: process.env.REDIS_PASSWORD ? '***configurado***' : 'no configurado',
        DISABLE_REDIS: process.env.DISABLE_REDIS || 'no configurado',
        NODE_ENV: process.env.NODE_ENV || 'no configurado',
      },
      connection: {
        available: false,
        isMock: false,
        error: null as string | null,
      },
      tests: {
        ping: { success: false, error: null as string | null },
        write: { success: false, error: null as string | null },
        read: { success: false, error: null as string | null },
        increment: { success: false, error: null as string | null },
      },
      stats: null as any,
    }

    // Verificar si Redis está disponible
    try {
      const available = await isRedisAvailable()
      diagnostics.connection.available = available
      diagnostics.connection.isMock = !available && process.env.DISABLE_REDIS !== 'true'
    } catch (error: any) {
      diagnostics.connection.error = error.message
    }

    // Obtener cliente Redis
    const client = getRedisClient()

    // Verificar si es Mock
    if (client && 'storage' in (client as any)) {
      diagnostics.connection.isMock = true
      diagnostics.connection.available = false
    }

    // Test 1: Ping
    try {
      if (client && !('storage' in (client as any))) {
        const result = await (client as any).ping()
        diagnostics.tests.ping.success = result === 'PONG'
        diagnostics.tests.ping.result = result
      } else {
        diagnostics.tests.ping.error = 'Redis no disponible (usando mock)'
      }
    } catch (error: any) {
      diagnostics.tests.ping.error = error.message
    }

    // Test 2: Write
    try {
      if (client && !('storage' in (client as any))) {
        const testKey = `test:debug:${Date.now()}`
        await (client as any).set(testKey, 'test-value', 'EX', 10)
        diagnostics.tests.write.success = true
        diagnostics.tests.write.key = testKey

        // Test 3: Read
        try {
          const value = await (client as any).get(testKey)
          diagnostics.tests.read.success = value === 'test-value'
          diagnostics.tests.read.value = value

          // Limpiar
          await (client as any).del(testKey)
        } catch (error: any) {
          diagnostics.tests.read.error = error.message
        }
      } else {
        diagnostics.tests.write.error = 'Redis no disponible (usando mock)'
      }
    } catch (error: any) {
      diagnostics.tests.write.error = error.message
    }

    // Test 4: Increment
    try {
      if (client && !('storage' in (client as any))) {
        const counterKey = `test:counter:${Date.now()}`
        const count1 = await (client as any).incr(counterKey)
        const count2 = await (client as any).incr(counterKey)
        diagnostics.tests.increment.success = count1 === 1 && count2 === 2
        diagnostics.tests.increment.values = { count1, count2 }

        // Limpiar
        await (client as any).del(counterKey)
      } else {
        diagnostics.tests.increment.error = 'Redis no disponible (usando mock)'
      }
    } catch (error: any) {
      diagnostics.tests.increment.error = error.message
    }

    // Obtener estadísticas de rate limiting
    try {
      if (diagnostics.connection.available) {
        const stats = await getRateLimitStats('rate_limit:*')
        diagnostics.stats = stats
      }
    } catch (error: any) {
      diagnostics.stats = { error: error.message }
    }

    // Determinar estado general
    const allTestsPassed =
      diagnostics.tests.ping.success &&
      diagnostics.tests.write.success &&
      diagnostics.tests.read.success &&
      diagnostics.tests.increment.success

    const isHealthy = diagnostics.connection.available && allTestsPassed && !diagnostics.connection.isMock

    return NextResponse.json(
      {
        success: isHealthy,
        status: isHealthy ? 'healthy' : diagnostics.connection.isMock ? 'mock' : 'unhealthy',
        message: isHealthy
          ? 'Redis está conectado y funcionando correctamente'
          : diagnostics.connection.isMock
          ? 'Redis está deshabilitado o usando mock'
          : 'Redis tiene problemas de conexión',
        diagnostics,
      },
      {
        status: isHealthy ? 200 : 503,
      }
    )
  } catch (error: any) {
    console.error('❌ Error en diagnóstico de Redis:', error)

    return NextResponse.json(
      {
        success: false,
        status: 'error',
        message: 'Error ejecutando diagnóstico de Redis',
        error: error.message,
        timestamp: new Date().toISOString(),
      },
      {
        status: 500,
      }
    )
  }
}
