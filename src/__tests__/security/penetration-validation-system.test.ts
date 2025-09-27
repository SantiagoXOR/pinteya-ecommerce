/**
 * Tests de Penetración para Sistema de Validación Enterprise
 * Valida la robustez contra ataques de inyección, XSS, y bypass de validación
 */

// Mock de dependencias
jest.mock('@/lib/security/enterprise-audit-system', () => ({
  enterpriseAuditSystem: {
    logEnterpriseEvent: jest.fn(),
  },
}))

jest.mock('isomorphic-dompurify', () => ({
  __esModule: true,
  default: {
    sanitize: jest.fn((input, options) => {
      // Simular DOMPurify real
      let cleaned = input
      if (options?.ALLOWED_TAGS?.length === 0) {
        cleaned = cleaned.replace(/<[^>]*>/g, '')
      }
      cleaned = cleaned.replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
      return cleaned
    }),
  },
}))

jest.mock('validator', () => ({
  __esModule: true,
  default: {
    escape: jest.fn(input =>
      input.replace(/[<>&"']/g, char => {
        const entities: Record<string, string> = {
          '<': '&lt;',
          '>': '&gt;',
          '&': '&amp;',
          '"': '&quot;',
          "'": '&#x27;',
        }
        return entities[char] || char
      })
    ),
  },
}))

import { z } from 'zod'
import {
  EnterpriseValidator,
  EnterpriseSanitizer,
  ENTERPRISE_VALIDATION_CONFIGS,
  criticalValidator,
  highValidator,
} from '@/lib/validation/enterprise-validation-system'
import {
  EnterpriseEmailSchema,
  EnterprisePasswordSchema,
  EnterpriseProductSchema,
} from '@/lib/validation/enterprise-schemas'
import type { EnterpriseAuthContext } from '@/lib/auth/enterprise-auth-utils'

describe('Tests de Penetración - Sistema de Validación Enterprise', () => {
  let mockContext: EnterpriseAuthContext

  beforeEach(() => {
    jest.clearAllMocks()

    mockContext = {
      userId: 'test_user_123',
      sessionId: 'test_session_123',
      email: 'test@example.com',
      role: 'admin',
      permissions: ['admin_access'],
      sessionValid: true,
      securityLevel: 'critical',
      ipAddress: '192.168.1.1',
      userAgent: 'test-agent',
      supabase: {} as any,
      validations: {
        jwtValid: true,
        csrfValid: true,
        rateLimitPassed: true,
        originValid: true,
      },
    }
  })

  describe('Ataques de Inyección SQL', () => {
    it('debe detectar y bloquear inyecciones SQL básicas', async () => {
      const sqlInjectionPayloads = [
        "'; DROP TABLE users; --",
        "' OR '1'='1",
        "' UNION SELECT * FROM admin_users --",
        "'; INSERT INTO users (role) VALUES ('admin'); --",
        "' AND 1=1 --",
        "' OR 1=1 #",
        "'; EXEC xp_cmdshell('dir'); --",
        "' UNION ALL SELECT password FROM users WHERE '1'='1",
        "'; UPDATE users SET role='admin' WHERE id=1; --",
        "' OR EXISTS(SELECT * FROM users WHERE role='admin') --",
      ]

      const schema = z.object({
        search: z.string(),
        filter: z.string(),
      })

      let blockedCount = 0
      let allowedCount = 0

      for (const payload of sqlInjectionPayloads) {
        const testData = {
          search: payload,
          filter: `category = '${payload}'`,
        }

        const result = await criticalValidator.validateAndSanitize(schema, testData, mockContext)

        if (!result.success) {
          const hasSQLError = result.errors?.some(
            e =>
              e.code === 'SQL_INJECTION_DETECTED' ||
              e.message.includes('SQL') ||
              e.message.includes('injection')
          )

          if (hasSQLError) {
            blockedCount++
          } else {
            allowedCount++
          }
        } else {
          // Verificar que fue sanitizado
          const sanitizedSearch = result.sanitized?.search || ''
          const sanitizedFilter = result.sanitized?.filter || ''

          const containsSQLKeywords =
            /\b(SELECT|INSERT|UPDATE|DELETE|DROP|UNION|EXEC)\b/i.test(sanitizedSearch) ||
            /\b(SELECT|INSERT|UPDATE|DELETE|DROP|UNION|EXEC)\b/i.test(sanitizedFilter)

          if (containsSQLKeywords) {
            allowedCount++ // Payload pasó sin sanitización adecuada
          } else {
            blockedCount++ // Payload fue sanitizado correctamente
          }
        }
      }

      // Verificar que la mayoría de inyecciones fueron bloqueadas/sanitizadas
      expect(blockedCount).toBeGreaterThan(allowedCount)
      expect(blockedCount).toBeGreaterThan(7) // Al menos 70% bloqueadas
    })

    it('debe detectar inyecciones SQL avanzadas y ofuscadas', async () => {
      const advancedSQLPayloads = [
        // Ofuscación con comentarios
        "'; /*comment*/ DROP /*comment*/ TABLE users; --",

        // Codificación hexadecimal
        "'; SELECT 0x41646d696e; --", // 'Admin' en hex

        // Bypass con espacios y tabs
        "';\t\nSELECT\t*\nFROM\tusers\tWHERE\t'1'='1",

        // Inyección con funciones
        "'; SELECT CHAR(65,68,77,73,78); --", // 'ADMIN'

        // Bypass con concatenación
        "'; SELECT 'ad'+'min' FROM users; --",

        // Inyección con subconsultas
        "' AND (SELECT COUNT(*) FROM users WHERE role='admin') > 0 --",

        // Bypass con CASE statements
        "'; SELECT CASE WHEN (1=1) THEN 'admin' ELSE 'user' END; --",

        // Time-based blind injection
        "'; WAITFOR DELAY '00:00:05'; --",

        // Boolean-based blind injection
        "' AND (SELECT SUBSTRING(password,1,1) FROM users WHERE id=1)='a",

        // Error-based injection
        "' AND EXTRACTVALUE(1, CONCAT(0x7e, (SELECT password FROM users LIMIT 1), 0x7e)); --",
      ]

      const schema = z.object({
        query: z.string(),
        params: z.string(),
      })

      let detectedCount = 0

      for (const payload of advancedSQLPayloads) {
        const testData = {
          query: payload,
          params: `param=${payload}`,
        }

        const result = await criticalValidator.validateAndSanitize(schema, testData, mockContext)

        // Verificar detección o sanitización
        if (!result.success) {
          const hasSQLDetection = result.errors?.some(
            e => e.code === 'SQL_INJECTION_DETECTED' || e.severity === 'critical'
          )

          if (hasSQLDetection) {
            detectedCount++
          }
        } else {
          // Verificar sanitización efectiva
          const sanitizedQuery = result.sanitized?.query || ''
          const sanitizedParams = result.sanitized?.params || ''

          const stillContainsSQLPatterns =
            /\b(SELECT|INSERT|UPDATE|DELETE|DROP|UNION|WAITFOR|EXTRACTVALUE)\b/i.test(
              sanitizedQuery
            ) ||
            /\b(SELECT|INSERT|UPDATE|DELETE|DROP|UNION|WAITFOR|EXTRACTVALUE)\b/i.test(
              sanitizedParams
            )

          if (!stillContainsSQLPatterns) {
            detectedCount++ // Sanitización efectiva
          }
        }
      }

      // Verificar detección de inyecciones avanzadas
      expect(detectedCount).toBeGreaterThan(7) // Al menos 70% detectadas
    })
  })

  describe('Ataques XSS (Cross-Site Scripting)', () => {
    it('debe detectar y bloquear XSS básicos', async () => {
      const xssPayloads = [
        '<script>alert("XSS")</script>',
        '<img src="x" onerror="alert(1)">',
        '<svg onload="alert(1)">',
        '<iframe src="javascript:alert(1)"></iframe>',
        '<body onload="alert(1)">',
        '<div onclick="alert(1)">Click me</div>',
        '<a href="javascript:alert(1)">Link</a>',
        '<input type="text" onfocus="alert(1)" autofocus>',
        '<marquee onstart="alert(1)">',
        '<video><source onerror="alert(1)">',
      ]

      const schema = z.object({
        content: z.string(),
        description: z.string(),
      })

      let blockedCount = 0

      for (const payload of xssPayloads) {
        const testData = {
          content: payload,
          description: `User content: ${payload}`,
        }

        const result = await criticalValidator.validateAndSanitize(schema, testData, mockContext)

        if (!result.success) {
          const hasXSSError = result.errors?.some(
            e =>
              e.code === 'XSS_DETECTED' || e.message.includes('XSS') || e.message.includes('script')
          )

          if (hasXSSError) {
            blockedCount++
          }
        } else {
          // Verificar sanitización
          const sanitizedContent = result.sanitized?.content || ''
          const sanitizedDescription = result.sanitized?.description || ''

          const containsXSSPatterns =
            /<script/i.test(sanitizedContent) ||
            /javascript:/i.test(sanitizedContent) ||
            /on\w+\s*=/i.test(sanitizedContent) ||
            /<script/i.test(sanitizedDescription) ||
            /javascript:/i.test(sanitizedDescription) ||
            /on\w+\s*=/i.test(sanitizedDescription)

          if (!containsXSSPatterns) {
            blockedCount++ // Sanitización efectiva
          }
        }
      }

      // Verificar que la mayoría de XSS fueron bloqueados/sanitizados
      expect(blockedCount).toBeGreaterThan(7) // Al menos 70% bloqueados
    })

    it('debe detectar XSS avanzados y ofuscados', async () => {
      const advancedXSSPayloads = [
        // Ofuscación con encoding
        '%3Cscript%3Ealert(1)%3C/script%3E',

        // Bypass con mayúsculas/minúsculas
        '<ScRiPt>alert(1)</ScRiPt>',

        // Bypass con espacios y tabs
        '<script\t>alert(1)</script>',

        // Bypass con comentarios HTML
        '<script><!--alert(1)--></script>',

        // Bypass con caracteres nulos
        '<script\x00>alert(1)</script>',

        // Bypass con entidades HTML
        '&lt;script&gt;alert(1)&lt;/script&gt;',

        // Bypass con atributos fragmentados
        '<img src="x" onerror="eval(String.fromCharCode(97,108,101,114,116,40,49,41))">',

        // Bypass con eventos menos comunes
        '<details open ontoggle="alert(1)">',

        // Bypass con CSS
        '<style>@import"javascript:alert(1)";</style>',

        // Bypass con SVG
        '<svg><script>alert(1)</script></svg>',
      ]

      const schema = z.object({
        userInput: z.string(),
        htmlContent: z.string(),
      })

      let detectedCount = 0

      for (const payload of advancedXSSPayloads) {
        const testData = {
          userInput: payload,
          htmlContent: `<div>${payload}</div>`,
        }

        const result = await criticalValidator.validateAndSanitize(schema, testData, mockContext)

        if (!result.success) {
          const hasXSSDetection = result.errors?.some(
            e => e.code === 'XSS_DETECTED' || e.severity === 'critical'
          )

          if (hasXSSDetection) {
            detectedCount++
          }
        } else {
          // Verificar sanitización efectiva
          const sanitizedInput = result.sanitized?.userInput || ''
          const sanitizedHTML = result.sanitized?.htmlContent || ''

          const stillContainsXSS =
            /<script/i.test(sanitizedInput) ||
            /javascript:/i.test(sanitizedInput) ||
            /on\w+\s*=/i.test(sanitizedInput) ||
            /<script/i.test(sanitizedHTML) ||
            /javascript:/i.test(sanitizedHTML) ||
            /on\w+\s*=/i.test(sanitizedHTML)

          if (!stillContainsXSS) {
            detectedCount++ // Sanitización efectiva
          }
        }
      }

      // Verificar detección de XSS avanzados
      expect(detectedCount).toBeGreaterThan(7) // Al menos 70% detectados
    })
  })

  describe('Ataques de Bypass de Validación', () => {
    it('debe resistir intentos de bypass con datos malformados', async () => {
      const bypassAttempts = [
        // Null bytes
        { email: 'test@example.com\x00admin@evil.com', password: 'password\x00' },

        // Unicode normalization attacks
        { email: 'test@еxample.com', password: 'pаssword123!' }, // Cyrillic characters

        // Overlong UTF-8 sequences
        { email: 'test@example.com', password: '\xC0\xAFpassword' },

        // Control characters
        { email: 'test\r\n@example.com', password: 'pass\tword' },

        // Homograph attacks
        { email: 'admin@gооgle.com', password: 'password123!' }, // Cyrillic 'o'

        // Length manipulation
        { email: 'a'.repeat(1000) + '@example.com', password: 'x'.repeat(10000) },

        // Type confusion
        { email: ['test@example.com'], password: { value: 'password' } },

        // Prototype pollution attempt
        {
          email: 'test@example.com',
          password: 'password',
          __proto__: { isAdmin: true },
          constructor: { prototype: { role: 'admin' } },
        },
      ]

      let blockedCount = 0
      let allowedCount = 0

      for (const attempt of bypassAttempts) {
        try {
          const result = await criticalValidator.validateAndSanitize(
            z.object({
              email: EnterpriseEmailSchema,
              password: EnterprisePasswordSchema,
            }),
            attempt,
            mockContext
          )

          if (!result.success) {
            blockedCount++
          } else {
            // Verificar que los datos fueron sanitizados apropiadamente
            const sanitizedEmail = result.sanitized?.email || ''
            const sanitizedPassword = result.sanitized?.password || ''

            const containsMaliciousPatterns =
              /[\x00-\x1F\x7F-\x9F]/.test(sanitizedEmail) ||
              /[\x00-\x1F\x7F-\x9F]/.test(sanitizedPassword) ||
              sanitizedEmail.length > 254 ||
              sanitizedPassword.length > 128

            if (containsMaliciousPatterns) {
              allowedCount++ // Bypass exitoso
            } else {
              blockedCount++ // Sanitización efectiva
            }
          }
        } catch (error) {
          blockedCount++ // Error = bypass fallido
        }
      }

      // Verificar que la mayoría de bypasses fueron bloqueados
      expect(blockedCount).toBeGreaterThan(allowedCount)
      expect(blockedCount).toBeGreaterThan(6) // Al menos 75% bloqueados
    })

    it('debe detectar ataques de schema poisoning', async () => {
      const schemaPoisoningAttempts = [
        // Intentar inyectar propiedades adicionales
        {
          name: 'Product Name',
          price: 100,
          isAdmin: true,
          role: 'admin',
          permissions: ['all'],
          __proto__: { constructor: 'evil' },
        },

        // Intentar bypass con nested objects
        {
          name: 'Product Name',
          price: 100,
          metadata: {
            admin: true,
            execute: 'rm -rf /',
            eval: 'process.exit(1)',
          },
        },

        // Intentar bypass con arrays maliciosos
        {
          name: 'Product Name',
          price: 100,
          tags: ['normal', { __proto__: { isAdmin: true } }, 'another_normal'],
        },

        // Intentar bypass con funciones
        {
          name: 'Product Name',
          price: 100,
          callback: 'function() { return true; }',
          toString: 'function() { return "admin"; }',
        },
      ]

      let detectedCount = 0

      for (const attempt of schemaPoisoningAttempts) {
        const result = await criticalValidator.validateAndSanitize(
          EnterpriseProductSchema,
          attempt,
          mockContext
        )

        if (!result.success) {
          detectedCount++
        } else {
          // Verificar que propiedades maliciosas fueron removidas
          const sanitizedData = result.sanitized || {}

          const hasMaliciousProps =
            'isAdmin' in sanitizedData ||
            'role' in sanitizedData ||
            'permissions' in sanitizedData ||
            '__proto__' in sanitizedData ||
            'constructor' in sanitizedData ||
            'callback' in sanitizedData ||
            'toString' in sanitizedData

          if (!hasMaliciousProps) {
            detectedCount++ // Sanitización efectiva
          }
        }
      }

      // Verificar detección de schema poisoning
      expect(detectedCount).toBe(schemaPoisoningAttempts.length)
    })
  })

  describe('Ataques de Agotamiento de Recursos', () => {
    it('debe manejar payloads extremadamente grandes', async () => {
      const largeSanitizer = new EnterpriseSanitizer(ENTERPRISE_VALIDATION_CONFIGS.CRITICAL_ADMIN)

      const resourceExhaustionPayloads = [
        // String extremadamente largo
        'x'.repeat(10000000), // 10MB

        // Objeto con muchas propiedades
        Object.fromEntries(Array.from({ length: 100000 }, (_, i) => [`prop_${i}`, `value_${i}`])),

        // Array extremadamente largo
        Array.from({ length: 1000000 }, (_, i) => `item_${i}`),

        // Objeto profundamente anidado
        Array.from({ length: 1000 }, () => ({})).reduce((acc, curr) => ({ nested: acc }), {}),
      ]

      let handledCount = 0
      const startTime = Date.now()

      for (const payload of resourceExhaustionPayloads) {
        try {
          const startMemory = process.memoryUsage().heapUsed

          // Intentar sanitizar payload masivo
          const result = largeSanitizer.sanitizeObject(payload)

          const endMemory = process.memoryUsage().heapUsed
          const memoryIncrease = endMemory - startMemory

          // Verificar que no se agotó la memoria (< 100MB por payload)
          if (memoryIncrease < 100 * 1024 * 1024) {
            handledCount++
          }
        } catch (error) {
          // Error esperado para payloads que exceden límites
          if (error.message.includes('máxima') || error.message.includes('excede')) {
            handledCount++ // Límite aplicado correctamente
          }
        }
      }

      const endTime = Date.now()
      const totalTime = endTime - startTime

      // Verificar que el sistema manejó los payloads sin crashear
      expect(handledCount).toBe(resourceExhaustionPayloads.length)

      // Verificar que el tiempo de procesamiento fue razonable (< 30 segundos)
      expect(totalTime).toBeLessThan(30000)
    })

    it('debe resistir ataques de regex DoS (ReDoS)', async () => {
      const redosPayloads = [
        // Payload que causa backtracking exponencial
        'a'.repeat(1000) + 'X',

        // Nested quantifiers
        '(' + 'a'.repeat(100) + ')*' + 'b'.repeat(100),

        // Alternation with overlapping patterns
        'a'.repeat(50) + '|' + 'a'.repeat(49) + 'b',

        // Catastrophic backtracking pattern
        'a'.repeat(30) + 'a?'.repeat(30) + 'a'.repeat(30),
      ]

      const emailSchema = z.object({
        email: EnterpriseEmailSchema,
        description: z.string().max(1000),
      })

      let processedCount = 0
      const maxTimePerPayload = 5000 // 5 segundos máximo

      for (const payload of redosPayloads) {
        const startTime = Date.now()

        try {
          const testData = {
            email: `test${payload}@example.com`,
            description: payload,
          }

          const result = await Promise.race([
            criticalValidator.validateAndSanitize(emailSchema, testData, mockContext),
            new Promise((_, reject) =>
              setTimeout(() => reject(new Error('Timeout')), maxTimePerPayload)
            ),
          ])

          const endTime = Date.now()
          const processingTime = endTime - startTime

          // Verificar que no hubo timeout
          if (processingTime < maxTimePerPayload) {
            processedCount++
          }
        } catch (error) {
          const endTime = Date.now()
          const processingTime = endTime - startTime

          // Si fue timeout, es un problema; si fue validación fallida, está bien
          if (error.message !== 'Timeout' && processingTime < maxTimePerPayload) {
            processedCount++
          }
        }
      }

      // Verificar que todos los payloads fueron procesados sin timeout
      expect(processedCount).toBe(redosPayloads.length)
    })
  })

  describe('Validación de Integridad del Sistema', () => {
    it('debe mantener consistencia durante ataques masivos', async () => {
      const massiveAttack = Array.from({ length: 1000 }, (_, i) => ({
        email: `attacker${i}@evil.com`,
        password: `<script>alert(${i})</script>`,
        name: `'; DROP TABLE users; -- ${i}`,
        description: 'x'.repeat(10000) + i,
      }))

      let validatedCount = 0
      let blockedCount = 0
      const startTime = Date.now()

      const schema = z.object({
        email: EnterpriseEmailSchema,
        password: EnterprisePasswordSchema,
        name: z.string().min(1).max(100),
        description: z.string().max(1000),
      })

      for (const attackData of massiveAttack) {
        try {
          const result = await criticalValidator.validateAndSanitize(
            schema,
            attackData,
            mockContext
          )

          if (result.success) {
            validatedCount++
          } else {
            blockedCount++
          }
        } catch (error) {
          blockedCount++
        }
      }

      const endTime = Date.now()
      const totalTime = endTime - startTime
      const avgTimePerValidation = totalTime / 1000

      // Verificar que el sistema procesó todos los ataques
      expect(validatedCount + blockedCount).toBe(1000)

      // Verificar que la mayoría fueron bloqueados
      expect(blockedCount).toBeGreaterThan(validatedCount)

      // Verificar performance razonable (< 10ms por validación)
      expect(avgTimePerValidation).toBeLessThan(10)
    })
  })
})
