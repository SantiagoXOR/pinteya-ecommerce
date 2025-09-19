// ===================================
// PINTEYA E-COMMERCE - RETRY LOGIC TESTS
// ===================================

import {
  retryWithBackoff,
  retryMercadoPagoOperation,
  retryWebhookOperation,
  RETRY_CONFIGS,
  RetryConfig
} from '@/lib/retry-logic';

// Mock logger
jest.mock('@/lib/enterprise/logger', () => ({
  logger: {
    info: jest.fn(),
    debug: jest.fn(),
    warn: jest.fn(),
    error: jest.fn(),
  },
  LogLevel: {
    INFO: 'info',
    DEBUG: 'debug',
    WARN: 'warn',
    ERROR: 'error',
  },
  LogCategory: {
    SYSTEM: 'system',
    PAYMENT: 'payment',
  },
}));

describe('Retry Logic', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('retryWithBackoff', () => {
    const basicConfig: RetryConfig = {
      maxRetries: 2,
      baseDelayMs: 100,
      maxDelayMs: 1000,
      backoffMultiplier: 2,
      jitterMs: 50,
      retryableErrors: ['ECONNRESET', '500'],
      nonRetryableErrors: ['400', '401']
    };

    it('should succeed on first attempt', async () => {
      const mockOperation = jest.fn().mockResolvedValue('success');

      const promise = retryWithBackoff(mockOperation, basicConfig, 'test-operation');
      const result = await promise;

      expect(result.success).toBe(true);
      expect(result.data).toBe('success');
      expect(result.attempts).toBe(1);
      expect(mockOperation).toHaveBeenCalledTimes(1);
    });

    it('should retry on retryable errors', async () => {
      // Usar configuración con delays muy pequeños para tests rápidos
      const fastConfig: RetryConfig = {
        ...basicConfig,
        baseDelayMs: 1,
        maxDelayMs: 5,
        jitterMs: 0
      };

      const mockOperation = jest.fn()
        .mockRejectedValueOnce(new Error('ECONNRESET'))
        .mockResolvedValue('success');

      const result = await retryWithBackoff(mockOperation, fastConfig, 'test-operation');

      expect(result.success).toBe(true);
      expect(result.data).toBe('success');
      expect(result.attempts).toBe(2);
      expect(mockOperation).toHaveBeenCalledTimes(2);
    });

    it('should not retry on non-retryable errors', async () => {
      const mockOperation = jest.fn().mockRejectedValue(new Error('400 Bad Request'));

      const result = await retryWithBackoff(mockOperation, basicConfig, 'test-operation');

      expect(result.success).toBe(false);
      expect(result.attempts).toBe(1);
      expect(result.error?.message).toContain('400');
      expect(mockOperation).toHaveBeenCalledTimes(1);
    });

    it('should fail after max retries', async () => {
      const fastConfig: RetryConfig = {
        ...basicConfig,
        baseDelayMs: 1,
        maxDelayMs: 5,
        jitterMs: 0
      };

      const mockOperation = jest.fn().mockRejectedValue(new Error('ECONNRESET'));

      const result = await retryWithBackoff(mockOperation, fastConfig, 'test-operation');

      expect(result.success).toBe(false);
      expect(result.attempts).toBe(3); // Intento inicial + 2 retries
      expect(result.error?.message).toContain('ECONNRESET');
      expect(mockOperation).toHaveBeenCalledTimes(3);
    });

    it('should calculate exponential backoff delays', async () => {
      const delays: number[] = [];
      const originalSetTimeout = global.setTimeout;

      // Mock setTimeout para capturar delays
      global.setTimeout = jest.fn((callback, delay) => {
        delays.push(delay);
        return originalSetTimeout(callback, 0); // Ejecutar inmediatamente
      }) as any;

      const fastConfig: RetryConfig = {
        ...basicConfig,
        baseDelayMs: 10,
        maxDelayMs: 100,
        jitterMs: 5
      };

      const mockOperation = jest.fn()
        .mockRejectedValueOnce(new Error('500'))
        .mockRejectedValueOnce(new Error('500'))
        .mockResolvedValue('success');

      await retryWithBackoff(mockOperation, fastConfig, 'test-operation');

      // Verificar que los delays aumentan exponencialmente
      expect(delays.length).toBe(2);
      expect(delays[0]).toBeGreaterThanOrEqual(10); // baseDelay + jitter
      expect(delays[1]).toBeGreaterThanOrEqual(20); // baseDelay * 2 + jitter

      global.setTimeout = originalSetTimeout;
    });

    it('should respect max delay limit', async () => {
      const configWithLowMaxDelay: RetryConfig = {
        ...basicConfig,
        baseDelayMs: 10,
        maxDelayMs: 15, // Límite bajo
        backoffMultiplier: 10, // Multiplicador alto
        jitterMs: 5
      };

      const delays: number[] = [];
      const originalSetTimeout = global.setTimeout;

      global.setTimeout = jest.fn((callback, delay) => {
        delays.push(delay);
        return originalSetTimeout(callback, 0);
      }) as any;

      const mockOperation = jest.fn()
        .mockRejectedValueOnce(new Error('500'))
        .mockResolvedValue('success');

      await retryWithBackoff(mockOperation, configWithLowMaxDelay, 'test-operation');

      // El delay no debe exceder maxDelayMs + jitter
      expect(delays[0]).toBeLessThanOrEqual(15 + 5);

      global.setTimeout = originalSetTimeout;
    });
  });

  describe('Retry Configurations', () => {
    it('should have MercadoPago critical config', () => {
      const config = RETRY_CONFIGS.MERCADOPAGO_CRITICAL;
      
      expect(config.maxRetries).toBe(3);
      expect(config.baseDelayMs).toBe(1000);
      expect(config.retryableErrors).toContain('500');
      expect(config.retryableErrors).toContain('ECONNRESET');
      expect(config.nonRetryableErrors).toContain('400');
      expect(config.nonRetryableErrors).toContain('401');
    });

    it('should have MercadoPago query config', () => {
      const config = RETRY_CONFIGS.MERCADOPAGO_QUERY;
      
      expect(config.maxRetries).toBe(2);
      expect(config.baseDelayMs).toBe(500);
      expect(config.retryableErrors).toContain('500');
      expect(config.nonRetryableErrors).toContain('400');
    });

    it('should have webhook processing config', () => {
      const config = RETRY_CONFIGS.WEBHOOK_PROCESSING;
      
      expect(config.maxRetries).toBe(1);
      expect(config.baseDelayMs).toBe(2000);
      expect(config.retryableErrors).toContain('500');
      expect(config.nonRetryableErrors).toContain('DUPLICATE_WEBHOOK');
    });
  });

  describe('retryMercadoPagoOperation', () => {
    it('should use critical config for critical operations', async () => {
      const mockOperation = jest.fn().mockResolvedValue('success');

      const result = await retryMercadoPagoOperation(mockOperation, 'test', true);

      expect(result.success).toBe(true);
      expect(result.data).toBe('success');
      expect(mockOperation).toHaveBeenCalledTimes(1);
    });

    it('should use query config for non-critical operations', async () => {
      const mockOperation = jest.fn().mockResolvedValue('success');

      const result = await retryMercadoPagoOperation(mockOperation, 'test', false);

      expect(result.success).toBe(true);
      expect(result.data).toBe('success');
      expect(mockOperation).toHaveBeenCalledTimes(1);
    });

    it('should retry critical operations more times', async () => {
      // Mock la configuración para hacer el test más rápido
      const originalConfig = require('@/lib/retry-logic').RETRY_CONFIGS.MERCADOPAGO_CRITICAL;
      require('@/lib/retry-logic').RETRY_CONFIGS.MERCADOPAGO_CRITICAL = {
        ...originalConfig,
        baseDelayMs: 1,
        maxDelayMs: 5,
        jitterMs: 0
      };

      const mockOperation = jest.fn().mockRejectedValue(new Error('500'));

      const result = await retryMercadoPagoOperation(mockOperation, 'test', true);

      expect(result.success).toBe(false);
      expect(result.attempts).toBe(4); // 1 inicial + 3 retries para críticas
      expect(mockOperation).toHaveBeenCalledTimes(4);

      // Restaurar configuración original
      require('@/lib/retry-logic').RETRY_CONFIGS.MERCADOPAGO_CRITICAL = originalConfig;
    });
  });

  describe('retryWebhookOperation', () => {
    it('should use webhook config', async () => {
      const mockOperation = jest.fn().mockResolvedValue('success');

      const result = await retryWebhookOperation(mockOperation, 'test');

      expect(result.success).toBe(true);
      expect(result.data).toBe('success');
      expect(mockOperation).toHaveBeenCalledTimes(1);
    });

    it('should retry webhook operations limited times', async () => {
      // Mock la configuración para hacer el test más rápido
      const originalConfig = require('@/lib/retry-logic').RETRY_CONFIGS.WEBHOOK_PROCESSING;
      require('@/lib/retry-logic').RETRY_CONFIGS.WEBHOOK_PROCESSING = {
        ...originalConfig,
        baseDelayMs: 1,
        maxDelayMs: 5,
        jitterMs: 0
      };

      const mockOperation = jest.fn().mockRejectedValue(new Error('500'));

      const result = await retryWebhookOperation(mockOperation, 'test');

      expect(result.success).toBe(false);
      expect(result.attempts).toBe(2); // 1 inicial + 1 retry para webhooks
      expect(mockOperation).toHaveBeenCalledTimes(2);

      // Restaurar configuración original
      require('@/lib/retry-logic').RETRY_CONFIGS.WEBHOOK_PROCESSING = originalConfig;
    });
  });

  describe('Error Classification', () => {
    const basicConfig: RetryConfig = {
      maxRetries: 2,
      baseDelayMs: 100,
      maxDelayMs: 1000,
      backoffMultiplier: 2,
      jitterMs: 50,
      retryableErrors: ['ECONNRESET', '500'],
      nonRetryableErrors: ['400', '401']
    };

    it('should identify network errors as retryable', async () => {
      const fastConfig: RetryConfig = {
        ...basicConfig,
        baseDelayMs: 1,
        maxDelayMs: 5,
        jitterMs: 0,
        retryableErrors: ['ECONNRESET', 'ENOTFOUND', 'ETIMEDOUT'],
        nonRetryableErrors: ['400', '401']
      };

      const networkErrors = ['ECONNRESET', 'ENOTFOUND', 'ETIMEDOUT'];

      for (const errorCode of networkErrors) {
        const mockOperation = jest.fn()
          .mockRejectedValueOnce(new Error(errorCode))
          .mockResolvedValue('success');

        const result = await retryWithBackoff(mockOperation, fastConfig, 'test');

        expect(result.success).toBe(true);
        expect(result.attempts).toBe(2);

        jest.clearAllMocks();
      }
    });

    it('should identify HTTP 4xx errors as non-retryable', async () => {
      const clientErrors = ['400', '401', '403', '404'];
      
      for (const errorCode of clientErrors) {
        const mockOperation = jest.fn().mockRejectedValue(new Error(`${errorCode} Error`));

        const result = await retryWithBackoff(mockOperation, RETRY_CONFIGS.MERCADOPAGO_CRITICAL, 'test');

        expect(result.success).toBe(false);
        expect(result.attempts).toBe(1); // No retry
        
        jest.clearAllMocks();
      }
    });

    it('should identify HTTP 5xx errors as retryable', async () => {
      const fastConfig: RetryConfig = {
        maxRetries: 2,
        baseDelayMs: 1,
        maxDelayMs: 5,
        backoffMultiplier: 2,
        jitterMs: 0,
        retryableErrors: ['500', '502', '503', '504'],
        nonRetryableErrors: ['400', '401']
      };

      const serverErrors = ['500', '502', '503', '504'];

      for (const errorCode of serverErrors) {
        const mockOperation = jest.fn()
          .mockRejectedValueOnce(new Error(`${errorCode} Error`))
          .mockResolvedValue('success');

        const result = await retryWithBackoff(mockOperation, fastConfig, 'test');

        expect(result.success).toBe(true);
        expect(result.attempts).toBe(2);

        jest.clearAllMocks();
      }
    });
  });
});









