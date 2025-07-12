// ===================================
// TESTS: useSearchErrorHandler Hook - Manejo robusto de errores
// ===================================

import { renderHook, act, waitFor } from '@testing-library/react';
import { useSearchErrorHandler } from '@/hooks/useSearchErrorHandler';

// ===================================
// SETUP
// ===================================

beforeEach(() => {
  jest.clearAllMocks();
  jest.useFakeTimers();
});

afterEach(() => {
  jest.useRealTimers();
});

// ===================================
// TESTS BÁSICOS
// ===================================

describe('useSearchErrorHandler Hook', () => {
  it('should initialize with default state', () => {
    const { result } = renderHook(() => useSearchErrorHandler());

    expect(result.current.currentError).toBe(null);
    expect(result.current.retryCount).toBe(0);
    expect(result.current.isRetrying).toBe(false);
    expect(result.current.hasError).toBe(false);
  });

  it('should accept custom retry configuration', () => {
    const { result } = renderHook(() => 
      useSearchErrorHandler({
        retryConfig: {
          maxRetries: 5,
          baseDelay: 500,
        }
      })
    );

    expect(result.current.retryConfig.maxRetries).toBe(5);
    expect(result.current.retryConfig.baseDelay).toBe(500);
  });
});

// ===================================
// TESTS DE CLASIFICACIÓN DE ERRORES
// ===================================

describe('useSearchErrorHandler - Error Classification', () => {
  it('should classify network errors correctly', () => {
    const { result } = renderHook(() => useSearchErrorHandler());

    const networkError = new TypeError('fetch failed');
    networkError.name = 'TypeError';

    act(() => {
      const error = result.current.handleError(networkError);
      expect(error.type).toBe('network');
      expect(error.retryable).toBe(true);
      expect(error.message).toContain('conexión');
    });
  });

  it('should classify timeout errors correctly', () => {
    const { result } = renderHook(() => useSearchErrorHandler());

    const timeoutError = new Error('timeout');
    timeoutError.name = 'AbortError';

    act(() => {
      const error = result.current.handleError(timeoutError);
      expect(error.type).toBe('timeout');
      expect(error.retryable).toBe(true);
      expect(error.message).toContain('tardó demasiado');
    });
  });

  it('should classify server errors correctly', () => {
    const { result } = renderHook(() => useSearchErrorHandler());

    const serverError = { status: 500, message: 'Internal Server Error' };

    act(() => {
      const error = result.current.handleError(serverError);
      expect(error.type).toBe('server');
      expect(error.retryable).toBe(true);
      expect(error.code).toBe('500');
    });
  });

  it('should classify validation errors correctly', () => {
    const { result } = renderHook(() => useSearchErrorHandler());

    const validationError = { status: 400, message: 'Bad Request' };

    act(() => {
      const error = result.current.handleError(validationError);
      expect(error.type).toBe('validation');
      expect(error.retryable).toBe(false);
      expect(error.code).toBe('400');
    });
  });
});

// ===================================
// TESTS DE RETRY AUTOMÁTICO
// ===================================

describe('useSearchErrorHandler - Retry Logic', () => {
  it('should retry failed operations with exponential backoff', async () => {
    const { result } = renderHook(() => 
      useSearchErrorHandler({
        retryConfig: {
          maxRetries: 3,
          baseDelay: 100,
          backoffFactor: 2,
        }
      })
    );

    let callCount = 0;
    const failingOperation = jest.fn().mockImplementation(() => {
      callCount++;
      if (callCount < 3) {
        throw new Error('Network error');
      }
      return Promise.resolve('success');
    });

    let executePromise: Promise<any>;

    await act(async () => {
      executePromise = result.current.executeWithRetry(failingOperation, 'test operation');
    });

    // Avanzar timers para los retries
    await act(async () => {
      jest.advanceTimersByTime(100); // Primer retry
      await Promise.resolve();
      jest.advanceTimersByTime(200); // Segundo retry
      await Promise.resolve();
    });

    const result_value = await executePromise!;

    expect(result_value).toBe('success');
    expect(failingOperation).toHaveBeenCalledTimes(3);
  });

  it('should not retry non-retryable errors', async () => {
    const { result } = renderHook(() => useSearchErrorHandler());

    const nonRetryableOperation = jest.fn().mockRejectedValue({ 
      status: 400, 
      message: 'Bad Request' 
    });

    await act(async () => {
      await expect(
        result.current.executeWithRetry(nonRetryableOperation, 'validation test')
      ).rejects.toThrow();
    });

    expect(nonRetryableOperation).toHaveBeenCalledTimes(1);
  });

  it('should stop retrying after max attempts', async () => {
    const { result } = renderHook(() => 
      useSearchErrorHandler({
        retryConfig: { maxRetries: 2, baseDelay: 50 }
      })
    );

    const alwaysFailingOperation = jest.fn().mockRejectedValue(
      new Error('Persistent error')
    );

    let executePromise: Promise<any>;

    await act(async () => {
      executePromise = result.current.executeWithRetry(
        alwaysFailingOperation,
        'persistent failure test'
      );
    });

    // Avanzar timers para todos los retries
    await act(async () => {
      jest.advanceTimersByTime(50);  // Primer retry
      await Promise.resolve();
      jest.advanceTimersByTime(100); // Segundo retry
      await Promise.resolve();
    });

    await expect(executePromise!).rejects.toThrow('Persistent error');
    expect(alwaysFailingOperation).toHaveBeenCalledTimes(3); // Original + 2 retries
  });
});

// ===================================
// TESTS DE CALLBACKS
// ===================================

describe('useSearchErrorHandler - Callbacks', () => {
  it('should call onError callback when error occurs', () => {
    const onError = jest.fn();
    const { result } = renderHook(() => useSearchErrorHandler({ onError }));

    const testError = new Error('Test error');

    act(() => {
      result.current.handleError(testError);
    });

    expect(onError).toHaveBeenCalledWith(
      expect.objectContaining({
        type: 'unknown',
        message: 'Test error',
        retryable: true,
      })
    );
  });

  it('should call onRetrySuccess callback on successful retry', async () => {
    const onRetrySuccess = jest.fn();
    const { result } = renderHook(() => 
      useSearchErrorHandler({ 
        onRetrySuccess,
        retryConfig: { maxRetries: 2, baseDelay: 50 }
      })
    );

    let callCount = 0;
    const retryOperation = jest.fn().mockImplementation(() => {
      callCount++;
      if (callCount === 1) {
        throw new Error('First failure');
      }
      return Promise.resolve('success');
    });

    let executePromise: Promise<any>;

    await act(async () => {
      executePromise = result.current.executeWithRetry(retryOperation);
    });

    await act(async () => {
      jest.advanceTimersByTime(50);
      await Promise.resolve();
    });

    await executePromise!;

    expect(onRetrySuccess).toHaveBeenCalled();
  });

  it('should call onRetryFailed callback when all retries fail', async () => {
    const onRetryFailed = jest.fn();
    const { result } = renderHook(() => 
      useSearchErrorHandler({ 
        onRetryFailed,
        retryConfig: { maxRetries: 1, baseDelay: 50 }
      })
    );

    const failingOperation = jest.fn().mockRejectedValue(new Error('Always fails'));

    let executePromise: Promise<any>;

    await act(async () => {
      executePromise = result.current.executeWithRetry(failingOperation);
    });

    await act(async () => {
      jest.advanceTimersByTime(50);
      await Promise.resolve();
    });

    await expect(executePromise!).rejects.toThrow();

    expect(onRetryFailed).toHaveBeenCalledWith(
      expect.objectContaining({
        type: 'unknown',
        message: 'Always fails',
      }),
      1 // número de intentos
    );
  });
});

// ===================================
// TESTS DE ESTADO
// ===================================

describe('useSearchErrorHandler - State Management', () => {
  it('should update retry state during retries', async () => {
    const { result } = renderHook(() => 
      useSearchErrorHandler({
        retryConfig: { maxRetries: 2, baseDelay: 50 }
      })
    );

    let callCount = 0;
    const retryOperation = jest.fn().mockImplementation(() => {
      callCount++;
      if (callCount < 3) {
        throw new Error('Retry test');
      }
      return Promise.resolve('success');
    });

    let executePromise: Promise<any>;

    await act(async () => {
      executePromise = result.current.executeWithRetry(retryOperation);
    });

    // Verificar estado durante primer retry
    await act(async () => {
      jest.advanceTimersByTime(50);
      await Promise.resolve();
    });

    expect(result.current.isRetrying).toBe(true);
    expect(result.current.retryCount).toBe(1);

    // Completar la operación
    await act(async () => {
      jest.advanceTimersByTime(100);
      await Promise.resolve();
    });

    await executePromise!;

    expect(result.current.isRetrying).toBe(false);
    expect(result.current.retryCount).toBe(0);
  });

  it('should clear error state', () => {
    const { result } = renderHook(() => useSearchErrorHandler());

    // Simular error
    act(() => {
      result.current.handleError(new Error('Test error'));
    });

    expect(result.current.hasError).toBe(true);

    // Limpiar error
    act(() => {
      result.current.clearError();
    });

    expect(result.current.hasError).toBe(false);
    expect(result.current.currentError).toBe(null);
    expect(result.current.retryCount).toBe(0);
  });
});
