// ===================================
// TESTS: Security Logger
// ===================================

import { NextRequest } from 'next/server'
import {
  createSecurityLogger,
  extractSecurityContext,
  securityLog,
  SecurityEvent,
  SecurityEventType,
  SecuritySeverity,
} from '@/lib/logging/security-logger'

// Mock console methods
const originalConsoleLog = console.log
const mockConsoleLog = jest.fn()

beforeAll(() => {
  console.log = mockConsoleLog
})

afterAll(() => {
  console.log = originalConsoleLog
})

beforeEach(() => {
  mockConsoleLog.mockClear()
  // Reset environment variables
  delete process.env.SECURITY_LOG_LEVEL
  // Set to production mode for consistent JSON output
  process.env.NODE_ENV = 'production'
})

// Helper para crear mock request
function createMockRequest(overrides: Partial<NextRequest> = {}): NextRequest {
  return {
    url: 'http://localhost:3000/api/test',
    method: 'GET',
    headers: new Map([
      ['x-forwarded-for', '192.168.1.1'],
      ['user-agent', 'Mozilla/5.0 Test Browser'],
      ['x-request-id', 'test-request-123'],
    ]),
    ...overrides,
  } as NextRequest
}

describe('Security Logger', () => {
  describe('extractSecurityContext', () => {
    it('should extract basic context from request', () => {
      const request = createMockRequest()
      const context = extractSecurityContext(request)

      expect(context.ip).toBe('192.168.1.1')
      expect(context.userAgent).toBe('Mozilla/5.0 Test Browser')
      expect(context.endpoint).toBe('/api/test')
      expect(context.method).toBe('GET')
      expect(context.requestId).toBe('test-request-123')
      expect(context.timestamp).toBeDefined()
    })

    it('should handle missing headers gracefully', () => {
      const request = createMockRequest({
        headers: new Map(),
      })
      const context = extractSecurityContext(request)

      expect(context.ip).toBe('unknown')
      expect(context.userAgent).toBe('unknown')
      expect(context.requestId).toMatch(/^req_\d+_[a-z0-9]+$/)
    })

    it('should extract IP from x-forwarded-for correctly', () => {
      const request = createMockRequest({
        headers: new Map([['x-forwarded-for', '203.0.113.1, 198.51.100.1, 192.168.1.1']]),
      })
      const context = extractSecurityContext(request)

      expect(context.ip).toBe('203.0.113.1')
    })

    it('should fallback to x-real-ip when x-forwarded-for is not available', () => {
      const request = createMockRequest({
        headers: new Map([['x-real-ip', '203.0.113.2']]),
      })
      const context = extractSecurityContext(request)

      expect(context.ip).toBe('203.0.113.2')
    })

    it('should merge additional context', () => {
      const request = createMockRequest()
      const additionalContext = {
        userId: 'user-123',
        sessionId: 'session-456',
      }
      const context = extractSecurityContext(request, additionalContext)

      expect(context.userId).toBe('user-123')
      expect(context.sessionId).toBe('session-456')
      expect(context.ip).toBe('192.168.1.1')
    })
  })

  describe('createSecurityLogger', () => {
    it('should create logger with request context', () => {
      const request = createMockRequest()
      const logger = createSecurityLogger(request)

      expect(logger.context).toBeDefined()
      expect(logger.context.ip).toBe('192.168.1.1')
      expect(logger.context.endpoint).toBe('/api/test')
      expect(typeof logger.log).toBe('function')
      expect(typeof logger.logAuthAttempt).toBe('function')
    })

    it('should create logger without request', () => {
      const logger = createSecurityLogger(undefined, {
        userId: 'test-user',
        endpoint: '/api/manual',
      })

      expect(logger.context).toBeDefined()
      expect(logger.context.userId).toBe('test-user')
      expect(logger.context.endpoint).toBe('/api/manual')
    })
  })

  describe('Security Event Logging', () => {
    it('should log security events with proper format', () => {
      const request = createMockRequest()
      const logger = createSecurityLogger(request)

      const event: SecurityEvent = {
        type: 'auth_attempt',
        severity: 'medium',
        message: 'Test authentication attempt',
        context: logger.context,
        metadata: { testData: 'value' },
      }

      logger.log(event)

      expect(mockConsoleLog).toHaveBeenCalledTimes(1)
      const loggedData = JSON.parse(mockConsoleLog.mock.calls[0][0])

      expect(loggedData.event_type).toBe('auth_attempt')
      expect(loggedData.severity).toBe('medium')
      expect(loggedData.message).toBe('Test authentication attempt')
      expect(loggedData.metadata.testData).toBe('value')
    })

    it('should respect log level configuration', () => {
      process.env.SECURITY_LOG_LEVEL = 'high'

      const request = createMockRequest()
      const logger = createSecurityLogger(request)

      // Low severity event should not be logged
      logger.log({
        type: 'security_scan',
        severity: 'low',
        message: 'Low severity event',
        context: logger.context,
      })

      expect(mockConsoleLog).not.toHaveBeenCalled()

      // High severity event should be logged
      logger.log({
        type: 'permission_denied',
        severity: 'high',
        message: 'High severity event',
        context: logger.context,
      })

      expect(mockConsoleLog).toHaveBeenCalledTimes(1)
    })

    it('should format error information correctly', () => {
      const request = createMockRequest()
      const logger = createSecurityLogger(request)
      const testError = new Error('Test error message')
      testError.stack = 'Error stack trace'

      logger.log({
        type: 'api_error',
        severity: 'high',
        message: 'API error occurred',
        context: logger.context,
        error: testError,
      })

      const loggedData = JSON.parse(mockConsoleLog.mock.calls[0][0])
      expect(loggedData.error.name).toBe('Error')
      expect(loggedData.error.message).toBe('Test error message')
      expect(loggedData.error.stack).toBe('Error stack trace')
    })
  })

  describe('Specialized Logging Methods', () => {
    let logger: ReturnType<typeof createSecurityLogger>

    beforeEach(() => {
      // Set log level to low to ensure all logs are captured
      process.env.SECURITY_LOG_LEVEL = 'low'
      const request = createMockRequest()
      logger = createSecurityLogger(request)
    })

    it('should log authentication attempts correctly', () => {
      logger.logAuthAttempt(logger.context, true, { provider: 'google' })

      const loggedData = JSON.parse(mockConsoleLog.mock.calls[0][0])
      expect(loggedData.event_type).toBe('auth_success')
      expect(loggedData.severity).toBe('low')
      expect(loggedData.metadata.success).toBe(true)
      expect(loggedData.metadata.provider).toBe('google')
    })

    it('should log failed authentication attempts', () => {
      logger.logAuthAttempt(logger.context, false, { reason: 'invalid_password' })

      const loggedData = JSON.parse(mockConsoleLog.mock.calls[0][0])
      expect(loggedData.event_type).toBe('auth_failure')
      expect(loggedData.severity).toBe('medium')
      expect(loggedData.metadata.success).toBe(false)
      expect(loggedData.metadata.reason).toBe('invalid_password')
    })

    it('should log rate limit exceeded events', () => {
      logger.logRateLimitExceeded(logger.context, { limit: 100, window: '5m' })

      const loggedData = JSON.parse(mockConsoleLog.mock.calls[0][0])
      expect(loggedData.event_type).toBe('rate_limit_exceeded')
      expect(loggedData.severity).toBe('medium')
      expect(loggedData.metadata.limit).toBe(100)
      expect(loggedData.metadata.window).toBe('5m')
    })

    it('should log permission denied events', () => {
      logger.logPermissionDenied(logger.context, 'products', 'create')

      const loggedData = JSON.parse(mockConsoleLog.mock.calls[0][0])
      expect(loggedData.event_type).toBe('permission_denied')
      expect(loggedData.severity).toBe('high')
      expect(loggedData.metadata.resource).toBe('products')
      expect(loggedData.metadata.action).toBe('create')
    })

    it('should log suspicious activity', () => {
      logger.logSuspiciousActivity(logger.context, 'Multiple failed login attempts', {
        attempts: 5,
        timeframe: '1m',
      })

      const loggedData = JSON.parse(mockConsoleLog.mock.calls[0][0])
      expect(loggedData.event_type).toBe('suspicious_activity')
      expect(loggedData.severity).toBe('high')
      expect(loggedData.metadata.reason).toBe('Multiple failed login attempts')
      expect(loggedData.metadata.attempts).toBe(5)
    })

    it('should log admin actions', () => {
      logger.logAdminAction(logger.context, 'delete_user', { targetUserId: 'user-456' })

      const loggedData = JSON.parse(mockConsoleLog.mock.calls[0][0])
      expect(loggedData.event_type).toBe('admin_action')
      expect(loggedData.severity).toBe('medium')
      expect(loggedData.metadata.action).toBe('delete_user')
      expect(loggedData.metadata.targetUserId).toBe('user-456')
    })

    it('should log API errors', () => {
      const error = new Error('Database connection failed')
      logger.logApiError(logger.context, error, { database: 'postgres' })

      const loggedData = JSON.parse(mockConsoleLog.mock.calls[0][0])
      expect(loggedData.event_type).toBe('api_error')
      expect(loggedData.severity).toBe('medium')
      expect(loggedData.error.message).toBe('Database connection failed')
      expect(loggedData.metadata.database).toBe('postgres')
    })
  })

  describe('Development vs Production Logging', () => {
    it('should use colored output in development', () => {
      process.env.NODE_ENV = 'development'

      const request = createMockRequest()
      const logger = createSecurityLogger(request)

      logger.log({
        type: 'auth_attempt',
        severity: 'medium',
        message: 'Test message',
        context: logger.context,
      })

      expect(mockConsoleLog).toHaveBeenCalledTimes(1)
      const call = mockConsoleLog.mock.calls[0]
      expect(call[0]).toContain('\x1b[33m') // Yellow color for medium severity
      expect(call[0]).toContain('[SECURITY:AUTH_ATTEMPT]')
    })

    it('should use plain JSON in production', () => {
      process.env.NODE_ENV = 'production'

      const request = createMockRequest()
      const logger = createSecurityLogger(request)

      logger.log({
        type: 'auth_attempt',
        severity: 'medium',
        message: 'Test message',
        context: logger.context,
      })

      expect(mockConsoleLog).toHaveBeenCalledTimes(1)
      const call = mockConsoleLog.mock.calls[0]
      expect(call[0]).not.toContain('\x1b[') // No color codes
      expect(typeof call[0]).toBe('string')
      expect(() => JSON.parse(call[0])).not.toThrow()
    })
  })

  describe('securityLog helper', () => {
    it('should provide quick logging methods', () => {
      // Set log level to low to capture all logs
      process.env.SECURITY_LOG_LEVEL = 'low'

      securityLog.info('Info message', { component: 'test' })
      securityLog.warn('Warning message', { component: 'test' })
      securityLog.error('Error message', new Error('Test error'), { component: 'test' })

      expect(mockConsoleLog).toHaveBeenCalledTimes(3)

      const infoLog = JSON.parse(mockConsoleLog.mock.calls[0][0])
      const warnLog = JSON.parse(mockConsoleLog.mock.calls[1][0])
      const errorLog = JSON.parse(mockConsoleLog.mock.calls[2][0])

      expect(infoLog.severity).toBe('low')
      expect(warnLog.severity).toBe('medium')
      expect(errorLog.severity).toBe('high')
      expect(errorLog.error).toBeDefined()
    })
  })
})
