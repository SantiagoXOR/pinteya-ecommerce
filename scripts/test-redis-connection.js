#!/usr/bin/env node
/**
 * Script de prueba para verificar conexión a Redis
 * 
 * Uso:
 *   node scripts/test-redis-connection.js
 * 
 * Requiere variables de entorno:
 *   REDIS_HOST (default: localhost)
 *   REDIS_PORT (default: 6379)
 *   REDIS_PASSWORD (opcional)
 *   REDIS_DB (default: 0)
 */

require('dotenv').config({ path: '.env.local' })
const Redis = require('ioredis')

// Colores para output
const colors = {
  reset: '\x1b[0m',
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m',
}

function log(message, color = 'reset') {
  console.log(`${colors[color]}${message}${colors.reset}`)
}

async function testRedis() {
  log('\n🔍 Verificando configuración de Redis...\n', 'cyan')

  // Configuración
  const host = process.env.REDIS_HOST || 'localhost'
  const isUpstash = host.includes('.upstash.io')
  const useTLS = process.env.REDIS_TLS === 'true' || isUpstash

  const config = {
    host,
    port: parseInt(process.env.REDIS_PORT || '6379'),
    password: process.env.REDIS_PASSWORD || undefined,
    db: parseInt(process.env.REDIS_DB || '0'),
    connectTimeout: 10000,
    commandTimeout: 5000,
    retryStrategy: (times) => {
      if (times > 3) {
        return null // No reintentar después de 3 intentos
      }
      return Math.min(times * 200, 2000)
    },
    // Habilitar TLS para Upstash
    ...(useTLS && {
      tls: {
        rejectUnauthorized: false,
      },
    }),
  }

  // Mostrar configuración (sin password)
  log('📋 Configuración:', 'blue')
  console.log(`   Host: ${config.host}`)
  console.log(`   Port: ${config.port}`)
  console.log(`   DB: ${config.db}`)
  console.log(`   Password: ${config.password ? '***configurado***' : 'no configurado'}`)
  console.log(`   TLS: ${useTLS ? '✅ Habilitado (Upstash detectado)' : '❌ Deshabilitado'}`)
  console.log(`   DISABLE_REDIS: ${process.env.DISABLE_REDIS || 'no configurado'}\n`)

  // Verificar si Redis está deshabilitado
  if (process.env.DISABLE_REDIS === 'true') {
    log('⚠️  ADVERTENCIA: DISABLE_REDIS=true', 'yellow')
    log('   Redis está deshabilitado. Cambia a false para habilitarlo.\n', 'yellow')
  }

  const redis = new Redis(config)

  try {
    // Test 1: Ping
    log('🧪 Test 1: Ping...', 'cyan')
    const pingResult = await redis.ping()
    if (pingResult === 'PONG') {
      log('   ✅ Ping exitoso', 'green')
    } else {
      log(`   ⚠️  Respuesta inesperada: ${pingResult}`, 'yellow')
    }

    // Test 2: Escritura/Lectura
    log('\n🧪 Test 2: Escritura y Lectura...', 'cyan')
    const testKey = `test:connection:${Date.now()}`
    const testValue = 'ok'
    
    await redis.set(testKey, testValue, 'EX', 10)
    log('   ✅ Escritura exitosa', 'green')
    
    const readValue = await redis.get(testKey)
    if (readValue === testValue) {
      log('   ✅ Lectura exitosa', 'green')
    } else {
      log(`   ❌ Valor incorrecto: esperado "${testValue}", obtenido "${readValue}"`, 'red')
    }

    // Test 3: TTL
    log('\n🧪 Test 3: TTL (Time To Live)...', 'cyan')
    const ttl = await redis.ttl(testKey)
    if (ttl > 0 && ttl <= 10) {
      log(`   ✅ TTL correcto: ${ttl} segundos`, 'green')
    } else {
      log(`   ⚠️  TTL inesperado: ${ttl}`, 'yellow')
    }

    // Test 4: Incremento
    log('\n🧪 Test 4: Incremento atómico...', 'cyan')
    const counterKey = `test:counter:${Date.now()}`
    const count1 = await redis.incr(counterKey)
    const count2 = await redis.incr(counterKey)
    const count3 = await redis.incr(counterKey)
    
    if (count1 === 1 && count2 === 2 && count3 === 3) {
      log('   ✅ Incremento atómico funciona correctamente', 'green')
    } else {
      log(`   ❌ Incremento falló: ${count1}, ${count2}, ${count3}`, 'red')
    }

    // Limpiar
    await redis.del(counterKey)
    await redis.del(testKey)

    // Test 5: Pipeline
    log('\n🧪 Test 5: Pipeline (operaciones batch)...', 'cyan')
    const pipeline = redis.pipeline()
    pipeline.set('test:pipeline:1', 'value1')
    pipeline.set('test:pipeline:2', 'value2')
    pipeline.get('test:pipeline:1')
    pipeline.get('test:pipeline:2')
    
    const results = await pipeline.exec()
    if (results && results.length === 4) {
      const errors = results.filter(r => r[0] !== null)
      if (errors.length === 0) {
        log('   ✅ Pipeline ejecutado correctamente', 'green')
      } else {
        log(`   ⚠️  Pipeline con errores: ${errors.length}`, 'yellow')
      }
    } else {
      log('   ❌ Pipeline falló', 'red')
    }

    // Limpiar
    await redis.del('test:pipeline:1', 'test:pipeline:2')

    // Test 6: Info del servidor
    log('\n🧪 Test 6: Información del servidor...', 'cyan')
    try {
      const info = await redis.info('server')
      const versionMatch = info.match(/redis_version:([^\r\n]+)/)
      if (versionMatch) {
        log(`   ✅ Versión Redis: ${versionMatch[1]}`, 'green')
      }
    } catch (error) {
      log('   ⚠️  No se pudo obtener info del servidor', 'yellow')
    }

    // Resumen
    log('\n' + '='.repeat(50), 'cyan')
    log('✅ TODOS LOS TESTS PASARON', 'green')
    log('✅ Redis está configurado y funcionando correctamente', 'green')
    log('='.repeat(50) + '\n', 'cyan')

    await redis.quit()
    process.exit(0)

  } catch (error) {
    log('\n' + '='.repeat(50), 'red')
    log('❌ ERROR EN LA CONEXIÓN', 'red')
    log('='.repeat(50), 'red')
    log(`\nTipo: ${error.constructor.name}`, 'red')
    log(`Mensaje: ${error.message}`, 'red')
    
    if (error.code === 'ECONNREFUSED') {
      log('\n💡 Posibles soluciones:', 'yellow')
      log('   1. Verifica que Redis esté corriendo', 'yellow')
      log('   2. Verifica REDIS_HOST y REDIS_PORT', 'yellow')
      log('   3. Verifica firewall/red', 'yellow')
    } else if (error.message.includes('password')) {
      log('\n💡 Posibles soluciones:', 'yellow')
      log('   1. Verifica REDIS_PASSWORD', 'yellow')
      log('   2. Algunos servidores Redis no requieren password', 'yellow')
    } else if (error.message.includes('timeout')) {
      log('\n💡 Posibles soluciones:', 'yellow')
      log('   1. Verifica conectividad de red', 'yellow')
      log('   2. Verifica que el servidor Redis esté accesible', 'yellow')
      log('   3. Aumenta connectTimeout si es necesario', 'yellow')
    }

    log('\n')
    await redis.quit().catch(() => {})
    process.exit(1)
  }
}

// Ejecutar
testRedis().catch(error => {
  log(`\n❌ Error fatal: ${error.message}`, 'red')
  process.exit(1)
})
