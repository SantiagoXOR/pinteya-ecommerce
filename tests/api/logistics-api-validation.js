// =====================================================
// VALIDACIÓN DE APIS - PANEL DE LOGÍSTICA
// Descripción: Testing exhaustivo de APIs y datos de base de datos
// Ejecutar con: node tests/api/logistics-api-validation.js
// =====================================================

const https = require('https')
const http = require('http')

// =====================================================
// CONFIGURACIÓN
// =====================================================

const BASE_URL = 'http://localhost:3000'
const API_ENDPOINTS = [
  '/api/admin/logistics',
  '/api/admin/logistics/shipments',
  '/api/admin/logistics/couriers',
  '/api/admin/logistics/carriers',
]

// =====================================================
// FUNCIONES AUXILIARES
// =====================================================

function makeRequest(url) {
  return new Promise((resolve, reject) => {
    const protocol = url.startsWith('https') ? https : http

    protocol
      .get(url, res => {
        let data = ''

        res.on('data', chunk => {
          data += chunk
        })

        res.on('end', () => {
          try {
            const jsonData = JSON.parse(data)
            resolve({
              status: res.statusCode,
              headers: res.headers,
              data: jsonData,
            })
          } catch (error) {
            resolve({
              status: res.statusCode,
              headers: res.headers,
              data: data,
              parseError: error.message,
            })
          }
        })
      })
      .on('error', error => {
        reject(error)
      })
  })
}

function log(level, message, data = null) {
  const timestamp = new Date().toISOString()
  const icons = {
    info: 'ℹ️',
    success: '✅',
    warning: '⚠️',
    error: '❌',
    data: '📊',
  }

  console.log(`${icons[level] || '📝'} [${timestamp}] ${message}`)
  if (data) {
    console.log(JSON.stringify(data, null, 2))
  }
}

// =====================================================
// VALIDACIONES ESPECÍFICAS
// =====================================================

function validateLogisticsMainAPI(data) {
  const validations = []

  // Verificar estructura básica
  if (data.stats) {
    validations.push({
      test: 'Estructura stats presente',
      passed: true,
      value: Object.keys(data.stats).length,
    })

    // Verificar métricas específicas
    const requiredStats = ['total_shipments', 'active_shipments', 'delivered_shipments']
    requiredStats.forEach(stat => {
      const exists = data.stats.hasOwnProperty(stat)
      const isNumber = typeof data.stats[stat] === 'number'
      const isPositive = data.stats[stat] >= 0

      validations.push({
        test: `Métrica ${stat}`,
        passed: exists && isNumber && isPositive,
        value: data.stats[stat],
        details: { exists, isNumber, isPositive },
      })
    })
  } else {
    validations.push({
      test: 'Estructura stats presente',
      passed: false,
      error: 'No se encontró objeto stats',
    })
  }

  // Verificar envíos recientes
  if (data.recent_shipments) {
    const isArray = Array.isArray(data.recent_shipments)
    const hasData = data.recent_shipments.length > 0

    validations.push({
      test: 'Envíos recientes',
      passed: isArray && hasData,
      value: data.recent_shipments.length,
      details: { isArray, hasData },
    })

    // Validar estructura de envíos
    if (hasData) {
      const firstShipment = data.recent_shipments[0]
      const requiredFields = ['id', 'tracking_number', 'status', 'destination', 'cost']

      requiredFields.forEach(field => {
        const hasField = firstShipment.hasOwnProperty(field)
        const hasValue = firstShipment[field] !== null && firstShipment[field] !== undefined

        validations.push({
          test: `Campo ${field} en envío`,
          passed: hasField && hasValue,
          value: firstShipment[field],
          details: { hasField, hasValue },
        })
      })
    }
  }

  // Verificar métricas de performance
  if (data.performance_metrics) {
    const isArray = Array.isArray(data.performance_metrics)
    const hasData = data.performance_metrics.length > 0

    validations.push({
      test: 'Métricas de performance',
      passed: isArray && hasData,
      value: data.performance_metrics.length,
      details: { isArray, hasData },
    })
  }

  return validations
}

function validateShipmentsAPI(data) {
  const validations = []

  if (Array.isArray(data)) {
    validations.push({
      test: 'Respuesta es array',
      passed: true,
      value: data.length,
    })

    if (data.length > 0) {
      const shipment = data[0]
      const requiredFields = [
        'id',
        'tracking_number',
        'status',
        'courier',
        'destination',
        'cost',
        'created_at',
      ]

      requiredFields.forEach(field => {
        const hasField = shipment.hasOwnProperty(field)
        const hasValue = shipment[field] !== null && shipment[field] !== undefined

        validations.push({
          test: `Campo ${field}`,
          passed: hasField && hasValue,
          value: shipment[field],
        })
      })

      // Validar formatos específicos
      if (shipment.cost) {
        const costIsNumber = typeof shipment.cost === 'number' || !isNaN(parseFloat(shipment.cost))
        validations.push({
          test: 'Formato de costo',
          passed: costIsNumber,
          value: shipment.cost,
        })
      }

      if (shipment.created_at) {
        const dateIsValid = !isNaN(Date.parse(shipment.created_at))
        validations.push({
          test: 'Formato de fecha',
          passed: dateIsValid,
          value: shipment.created_at,
        })
      }
    }
  } else {
    validations.push({
      test: 'Respuesta es array',
      passed: false,
      error: 'La respuesta no es un array',
    })
  }

  return validations
}

function validateCouriersAPI(data) {
  const validations = []

  if (Array.isArray(data)) {
    validations.push({
      test: 'Respuesta es array',
      passed: true,
      value: data.length,
    })

    if (data.length > 0) {
      const courier = data[0]
      const requiredFields = ['id', 'name', 'active']

      requiredFields.forEach(field => {
        const hasField = courier.hasOwnProperty(field)
        const hasValue = courier[field] !== null && courier[field] !== undefined

        validations.push({
          test: `Campo ${field}`,
          passed: hasField && hasValue,
          value: courier[field],
        })
      })
    }
  } else {
    validations.push({
      test: 'Respuesta es array',
      passed: false,
      error: 'La respuesta no es un array',
    })
  }

  return validations
}

// =====================================================
// FUNCIÓN PRINCIPAL DE TESTING
// =====================================================

async function runAPIValidation() {
  log('info', 'Iniciando validación exhaustiva de APIs de Logística')
  log('info', `Base URL: ${BASE_URL}`)

  const report = {
    timestamp: new Date().toISOString(),
    baseUrl: BASE_URL,
    endpoints: {},
    summary: {
      totalEndpoints: API_ENDPOINTS.length,
      successfulEndpoints: 0,
      failedEndpoints: 0,
      totalTests: 0,
      passedTests: 0,
      failedTests: 0,
    },
  }

  for (const endpoint of API_ENDPOINTS) {
    const fullUrl = `${BASE_URL}${endpoint}`
    log('info', `Testing endpoint: ${endpoint}`)

    try {
      const response = await makeRequest(fullUrl)

      const endpointReport = {
        url: fullUrl,
        status: response.status,
        success: response.status === 200,
        responseTime: Date.now(),
        validations: [],
      }

      if (response.status === 200) {
        log('success', `✅ ${endpoint} - Status 200`)
        report.summary.successfulEndpoints++

        // Ejecutar validaciones específicas según el endpoint
        if (endpoint === '/api/admin/logistics') {
          endpointReport.validations = validateLogisticsMainAPI(response.data)
        } else if (endpoint === '/api/admin/logistics/shipments') {
          endpointReport.validations = validateShipmentsAPI(response.data)
        } else if (endpoint === '/api/admin/logistics/couriers') {
          endpointReport.validations = validateCouriersAPI(response.data)
        }

        // Contar tests
        const passedTests = endpointReport.validations.filter(v => v.passed).length
        const totalTests = endpointReport.validations.length

        report.summary.totalTests += totalTests
        report.summary.passedTests += passedTests
        report.summary.failedTests += totalTests - passedTests

        log('data', `Validaciones para ${endpoint}:`, {
          total: totalTests,
          passed: passedTests,
          failed: totalTests - passedTests,
        })

        // Mostrar validaciones fallidas
        const failedValidations = endpointReport.validations.filter(v => !v.passed)
        if (failedValidations.length > 0) {
          log('warning', `Validaciones fallidas en ${endpoint}:`)
          failedValidations.forEach(validation => {
            log('error', `  - ${validation.test}: ${validation.error || 'Falló'}`)
          })
        }
      } else {
        log('error', `❌ ${endpoint} - Status ${response.status}`)
        report.summary.failedEndpoints++
        endpointReport.error = `HTTP ${response.status}`
      }

      report.endpoints[endpoint] = endpointReport
    } catch (error) {
      log('error', `❌ ${endpoint} - Error: ${error.message}`)
      report.summary.failedEndpoints++
      report.endpoints[endpoint] = {
        url: fullUrl,
        success: false,
        error: error.message,
      }
    }
  }

  // Generar resumen final
  log('info', '📋 RESUMEN FINAL:')
  log(
    'info',
    `Endpoints exitosos: ${report.summary.successfulEndpoints}/${report.summary.totalEndpoints}`
  )
  log('info', `Tests pasados: ${report.summary.passedTests}/${report.summary.totalTests}`)

  const successRate = ((report.summary.passedTests / report.summary.totalTests) * 100).toFixed(1)
  log('info', `Tasa de éxito: ${successRate}%`)

  if (report.summary.failedEndpoints === 0 && report.summary.failedTests === 0) {
    log('success', '🎉 ¡TODAS LAS APIS FUNCIONAN CORRECTAMENTE!')
  } else {
    log('warning', '⚠️ Algunas APIs o validaciones fallaron')
  }

  // Guardar reporte
  const fs = require('fs')
  const path = require('path')

  const reportsDir = path.join(__dirname, '..', 'reports')
  if (!fs.existsSync(reportsDir)) {
    fs.mkdirSync(reportsDir, { recursive: true })
  }

  const reportPath = path.join(reportsDir, `logistics-api-validation-${Date.now()}.json`)
  fs.writeFileSync(reportPath, JSON.stringify(report, null, 2))

  log('info', `📄 Reporte guardado en: ${reportPath}`)

  return report
}

// =====================================================
// EJECUTAR SI ES LLAMADO DIRECTAMENTE
// =====================================================

if (require.main === module) {
  runAPIValidation().catch(error => {
    log('error', 'Error durante la validación:', error)
    process.exit(1)
  })
}

module.exports = { runAPIValidation }
