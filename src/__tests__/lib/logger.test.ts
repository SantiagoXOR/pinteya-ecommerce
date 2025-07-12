// ===================================
// PINTEYA E-COMMERCE - LOGGER TESTS
// ===================================

import { logger, LogLevel, LogCategory } from '@/lib/logger';

// Mock console methods
const originalConsole = { ...console };
beforeEach(() => {
  console.info = jest.fn();
  console.warn = jest.fn();
  console.error = jest.fn();
  console.debug = jest.fn();
});

afterEach(() => {
  Object.assign(console, originalConsole);
});

describe('StructuredLogger', () => {
  it('should log payment events correctly', () => {
    logger.payment(LogLevel.INFO, 'Test payment', {
      orderId: '123',
      paymentId: 'mp_123',
      amount: 100,
      currency: 'ARS',
      status: 'approved',
      method: 'mercadopago',
    });

    expect(console.info).toHaveBeenCalledWith(
      expect.stringContaining('"category":"payment"')
    );
    expect(console.info).toHaveBeenCalledWith(
      expect.stringContaining('"message":"Test payment"')
    );
    expect(console.info).toHaveBeenCalledWith(
      expect.stringContaining('"orderId":"123"')
    );
  });

  it('should log webhook events correctly', () => {
    logger.webhook(LogLevel.INFO, 'Test webhook', {
      type: 'payment',
      action: 'created',
      dataId: 'mp_123',
      isValid: true,
      processingTime: 150,
    });

    expect(console.info).toHaveBeenCalledWith(
      expect.stringContaining('"category":"webhook"')
    );
    expect(console.info).toHaveBeenCalledWith(
      expect.stringContaining('"type":"payment"')
    );
  });

  it('should log security events correctly', () => {
    logger.security(LogLevel.WARN, 'Test security', {
      threat: 'rate_limit',
      blocked: true,
      reason: 'Too many requests',
    });

    expect(console.warn).toHaveBeenCalledWith(
      expect.stringContaining('"category":"security"')
    );
    expect(console.warn).toHaveBeenCalledWith(
      expect.stringContaining('"threat":"rate_limit"')
    );
  });

  it('should log performance events correctly', () => {
    logger.performance(LogLevel.INFO, 'Test performance', {
      operation: 'test-operation',
      duration: 250,
      endpoint: '/api/test',
      statusCode: 200,
    });

    expect(console.info).toHaveBeenCalledWith(
      expect.stringContaining('"category":"performance"')
    );
    expect(console.info).toHaveBeenCalledWith(
      expect.stringContaining('"duration":250')
    );
  });

  it('should log errors correctly', () => {
    const testError = new Error('Test error');
    logger.error(LogCategory.API, 'Test error message', testError);

    expect(console.error).toHaveBeenCalledWith(
      expect.stringContaining('"category":"api"')
    );
    expect(console.error).toHaveBeenCalledWith(
      expect.stringContaining('"message":"Test error message"')
    );
    expect(console.error).toHaveBeenCalledWith(
      expect.stringContaining('"name":"Error"')
    );
  });

  it('should measure performance correctly', async () => {
    const testFunction = jest.fn().mockResolvedValue('test result');
    
    const result = await logger.measurePerformance('test-operation', testFunction);
    
    expect(result).toBe('test result');
    expect(testFunction).toHaveBeenCalled();
    expect(console.info).toHaveBeenCalledWith(
      expect.stringContaining('"operation":"test-operation"')
    );
  });

  it('should handle sync functions in measurePerformance', () => {
    const testFunction = jest.fn().mockReturnValue('sync result');
    
    const result = logger.measurePerformance('sync-operation', testFunction);
    
    expect(result).toBe('sync result');
    expect(testFunction).toHaveBeenCalled();
    expect(console.info).toHaveBeenCalledWith(
      expect.stringContaining('"operation":"sync-operation"')
    );
  });

  it('should handle errors in measurePerformance', async () => {
    const testError = new Error('Test error');
    const testFunction = jest.fn().mockRejectedValue(testError);
    
    await expect(
      logger.measurePerformance('error-operation', testFunction)
    ).rejects.toThrow('Test error');
    
    expect(console.error).toHaveBeenCalledWith(
      expect.stringContaining('"operation":"error-operation"')
    );
  });
});
