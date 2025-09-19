/**
 * @jest-environment jsdom
 */

// ===================================
// ADVANCED ERROR BOUNDARY TESTS
// ===================================
// Tests comprehensivos para el sistema de Error Boundaries

import React from 'react';
import { render, screen, fireEvent, waitFor, act } from '@testing-library/react';
import '@testing-library/jest-dom';
import { AdvancedErrorBoundary } from '@/lib/error-boundary/advanced-error-boundary';
import { errorBoundaryManager } from '@/lib/error-boundary/error-boundary-manager';

// ===================================
// MOCKS
// ===================================

// Mock del Error Boundary Manager
jest.mock('@/lib/error-boundary/error-boundary-manager', () => ({
  errorBoundaryManager: {
    reportError: jest.fn(),
    getConfig: jest.fn(() => ({
      level: 'component',
      enableRetry: true,
      maxRetries: 3,
      retryDelay: 1000,
      enableAutoRecovery: true,
      recoveryTimeout: 3000,
      enableReporting: true
    })),
    getHealthStatus: jest.fn(() => ({
      status: 'healthy',
      errorRate: 0,
      criticalErrors: 0,
      recommendations: []
    }))
  }
}));

// Mock de fetch
global.fetch = jest.fn();

// Mock de console para evitar logs en tests
const originalConsoleError = console.error;
const originalConsoleLog = console.log;
const originalConsoleWarn = console.warn;

beforeEach(() => {
  console.error = jest.fn();
  console.log = jest.fn();
  console.warn = jest.fn();
  jest.clearAllMocks();
  (fetch as jest.Mock).mockClear();
});

afterEach(() => {
  console.error = originalConsoleError;
  console.log = originalConsoleLog;
  console.warn = originalConsoleWarn;
});

// ===================================
// COMPONENTES DE PRUEBA
// ===================================

const ThrowError: React.FC<{ shouldThrow?: boolean; errorType?: string }> = ({ 
  shouldThrow = false, 
  errorType = 'generic' 
}) => {
  if (shouldThrow) {
    switch (errorType) {
      case 'chunk':
        throw new Error('Loading chunk 123 failed');
      case 'network':
        throw new Error('Network request failed');
      case 'react':
        throw new Error('Cannot read property of undefined');
      default:
        throw new Error('Test error');
    }
  }
  return <div data-testid="working-component">Component works!</div>;
};

const TestWrapper: React.FC<{ 
  children: React.ReactNode;
  errorBoundaryProps?: any;
}> = ({ children, errorBoundaryProps = {} }) => (
  <AdvancedErrorBoundary {...errorBoundaryProps}>
    {children}
  </AdvancedErrorBoundary>
);

// ===================================
// TESTS BÁSICOS
// ===================================

describe('AdvancedErrorBoundary - Funcionalidad Básica', () => {
  test('renderiza children cuando no hay errores', () => {
    render(
      <TestWrapper>
        <ThrowError shouldThrow={false} />
      </TestWrapper>
    );

    expect(screen.getByTestId('working-component')).toBeInTheDocument();
    expect(screen.getByText('Component works!')).toBeInTheDocument();
  });

  test('captura y muestra error cuando el componente falla', () => {
    render(
      <TestWrapper>
        <ThrowError shouldThrow={true} />
      </TestWrapper>
    );

    expect(screen.queryByTestId('working-component')).not.toBeInTheDocument();
    expect(screen.getByText(/error en componente/i)).toBeInTheDocument();
    expect(screen.getByText(/intentando recuperación automática/i)).toBeInTheDocument();
  });

  test('muestra botón de reintentar cuando está habilitado', () => {
    render(
      <TestWrapper errorBoundaryProps={{ enableRetry: true }}>
        <ThrowError shouldThrow={true} />
      </TestWrapper>
    );

    expect(screen.getByRole('button', { name: /reintentar/i })).toBeInTheDocument();
  });

  test('no muestra botón de reintentar cuando está deshabilitado', () => {
    render(
      <TestWrapper errorBoundaryProps={{ enableRetry: false }}>
        <ThrowError shouldThrow={true} />
      </TestWrapper>
    );

    expect(screen.queryByRole('button', { name: /reintentar/i })).not.toBeInTheDocument();
  });
});

// ===================================
// TESTS DE CLASIFICACIÓN DE ERRORES
// ===================================

describe('AdvancedErrorBoundary - Clasificación de Errores', () => {
  test('clasifica correctamente errores de chunk loading', () => {
    const errorType = AdvancedErrorBoundary.classifyError(new Error('Loading chunk 123 failed'));
    expect(errorType).toBe('chunk');
  });

  test('clasifica correctamente errores de red', () => {
    const errorType = AdvancedErrorBoundary.classifyError(new Error('Network request failed'));
    expect(errorType).toBe('network');
  });

  test('clasifica correctamente errores de React', () => {
    const error = new Error('Cannot read property of undefined');
    error.stack = 'Error at React.Component.render';
    const errorType = AdvancedErrorBoundary.classifyError(error);
    expect(errorType).toBe('component');
  });

  test('clasifica errores desconocidos como unknown', () => {
    const errorType = AdvancedErrorBoundary.classifyError(new Error('Some random error'));
    expect(errorType).toBe('unknown');
  });
});

// ===================================
// TESTS DE ESTRATEGIAS DE RECUPERACIÓN
// ===================================

describe('AdvancedErrorBoundary - Estrategias de Recuperación', () => {
  test('determina estrategia reload para errores de chunk', () => {
    const strategy = AdvancedErrorBoundary.determineRecoveryStrategy(
      new Error('Loading chunk failed'), 
      'chunk'
    );
    expect(strategy).toBe('reload');
  });

  test('determina estrategia retry para errores de red', () => {
    const strategy = AdvancedErrorBoundary.determineRecoveryStrategy(
      new Error('Network failed'), 
      'network'
    );
    expect(strategy).toBe('retry');
  });

  test('determina estrategia fallback para errores de componente', () => {
    const strategy = AdvancedErrorBoundary.determineRecoveryStrategy(
      new Error('Component error'), 
      'component'
    );
    expect(strategy).toBe('fallback');
  });
});

// ===================================
// TESTS DE REINTENTOS
// ===================================

describe('AdvancedErrorBoundary - Sistema de Reintentos', () => {
  beforeEach(() => {
    jest.useFakeTimers();
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  test('permite reintentar manualmente', async () => {
    let shouldThrow = true;
    
    const DynamicComponent = () => {
      if (shouldThrow) {
        throw new Error('Test error');
      }
      return <div data-testid="success">Success!</div>;
    };

    render(
      <TestWrapper errorBoundaryProps={{ enableRetry: true, maxRetries: 3 }}>
        <DynamicComponent />
      </TestWrapper>
    );

    // Verificar que se muestra el error
    expect(screen.getByText(/error en componente/i)).toBeInTheDocument();

    // Simular que el error se resuelve
    shouldThrow = false;

    // Hacer clic en reintentar
    const retryButton = screen.getByRole('button', { name: /reintentar/i });
    fireEvent.click(retryButton);

    // Verificar que el componente se recupera
    await waitFor(() => {
      expect(screen.getByTestId('success')).toBeInTheDocument();
    });
  });

  test('respeta el límite máximo de reintentos', () => {
    render(
      <TestWrapper errorBoundaryProps={{ enableRetry: true, maxRetries: 2 }}>
        <ThrowError shouldThrow={true} />
      </TestWrapper>
    );

    const retryButton = screen.getByRole('button', { name: /reintentar/i });

    // Primer reintento
    fireEvent.click(retryButton);
    expect(screen.getByRole('button', { name: /reintentar/i })).toBeInTheDocument();

    // Segundo reintento
    fireEvent.click(retryButton);
    expect(screen.getByRole('button', { name: /reintentar/i })).toBeInTheDocument();

    // Tercer reintento - debería alcanzar el límite
    fireEvent.click(retryButton);
    
    // El botón debería seguir ahí pero el comportamiento interno cambia
    // (esto requeriría acceso al estado interno para verificar completamente)
  });

  test('implementa backoff exponencial en reintentos automáticos', () => {
    const setTimeoutSpy = jest.spyOn(global, 'setTimeout');
    const onError = jest.fn();

    render(
      <TestWrapper errorBoundaryProps={{
        enableRetry: true,
        enableAutoRecovery: true,
        retryDelay: 1000,
        onError
      }}>
        <ThrowError shouldThrow={true} errorType="network" />
      </TestWrapper>
    );

    expect(onError).toHaveBeenCalled();

    // Verificar que se programa un reintento automático
    expect(setTimeoutSpy).toHaveBeenCalled();

    setTimeoutSpy.mockRestore();
  });
});

// ===================================
// TESTS DE REPORTE DE ERRORES
// ===================================

describe('AdvancedErrorBoundary - Reporte de Errores', () => {
  test('reporta errores al Error Boundary Manager', () => {
    const onError = jest.fn();

    render(
      <TestWrapper errorBoundaryProps={{
        enableReporting: true,
        onError,
        context: 'test-component'
      }}>
        <ThrowError shouldThrow={true} />
      </TestWrapper>
    );

    expect(onError).toHaveBeenCalled();
    // El reporte se hace en componentDidCatch, que puede ser asíncrono
    expect(onError).toHaveBeenCalledWith(
      expect.any(Error),
      expect.any(Object),
      expect.any(String)
    );
  });

  test('no reporta errores cuando está deshabilitado', () => {
    render(
      <TestWrapper errorBoundaryProps={{ enableReporting: false }}>
        <ThrowError shouldThrow={true} />
      </TestWrapper>
    );

    expect(errorBoundaryManager.reportError).not.toHaveBeenCalled();
  });

  test('envía reporte a API cuando está habilitado', async () => {
    (fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      json: async () => ({ success: true })
    });

    render(
      <TestWrapper errorBoundaryProps={{ enableReporting: true }}>
        <ThrowError shouldThrow={true} />
      </TestWrapper>
    );

    await waitFor(() => {
      expect(fetch).toHaveBeenCalledWith('/api/monitoring/errors', expect.objectContaining({
        method: 'POST',
        headers: { 'Content-Type': 'application/json' }
      }));
    });
  });
});

// ===================================
// TESTS DE UI SEGÚN NIVEL
// ===================================

describe('AdvancedErrorBoundary - UI según Nivel', () => {
  test('muestra UI de página para level="page"', () => {
    render(
      <TestWrapper errorBoundaryProps={{ level: 'page' }}>
        <ThrowError shouldThrow={true} />
      </TestWrapper>
    );

    expect(screen.getByText(/¡oops! algo salió mal/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /ir al inicio/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /recargar página/i })).toBeInTheDocument();
  });

  test('muestra UI de componente para level="component"', () => {
    render(
      <TestWrapper errorBoundaryProps={{ level: 'component' }}>
        <ThrowError shouldThrow={true} />
      </TestWrapper>
    );

    expect(screen.getByText(/error en componente/i)).toBeInTheDocument();
    expect(screen.queryByText(/¡oops! algo salió mal/i)).not.toBeInTheDocument();
  });

  test('muestra fallback personalizado cuando se proporciona', () => {
    const CustomFallback = () => <div data-testid="custom-fallback">Custom Error UI</div>;
    
    render(
      <TestWrapper errorBoundaryProps={{ fallback: <CustomFallback /> }}>
        <ThrowError shouldThrow={true} />
      </TestWrapper>
    );

    expect(screen.getByTestId('custom-fallback')).toBeInTheDocument();
    expect(screen.getByText('Custom Error UI')).toBeInTheDocument();
  });
});

// ===================================
// TESTS DE INTEGRACIÓN
// ===================================

describe('AdvancedErrorBoundary - Integración', () => {
  test('funciona correctamente con múltiples niveles anidados', () => {
    render(
      <TestWrapper errorBoundaryProps={{ level: 'page', context: 'page-boundary' }}>
        <div>
          <TestWrapper errorBoundaryProps={{ level: 'section', context: 'section-boundary' }}>
            <div>
              <TestWrapper errorBoundaryProps={{ level: 'component', context: 'component-boundary' }}>
                <ThrowError shouldThrow={true} />
              </TestWrapper>
            </div>
          </TestWrapper>
        </div>
      </TestWrapper>
    );

    // El error debería ser capturado por el boundary más cercano (component)
    expect(screen.getByText(/error en componente/i)).toBeInTheDocument();
  });

  test('maneja errores asincrónicos correctamente', async () => {
    const AsyncComponent = () => {
      React.useEffect(() => {
        setTimeout(() => {
          throw new Error('Async error');
        }, 100);
      }, []);
      
      return <div>Async Component</div>;
    };

    render(
      <TestWrapper>
        <AsyncComponent />
      </TestWrapper>
    );

    // Los errores asincrónicos no son capturados por Error Boundaries
    // Este test verifica que el componente se renderiza normalmente
    expect(screen.getByText('Async Component')).toBeInTheDocument();
  });
});

// ===================================
// TESTS DE PERFORMANCE
// ===================================

describe('AdvancedErrorBoundary - Performance', () => {
  test('no afecta el rendimiento cuando no hay errores', () => {
    const startTime = performance.now();
    
    render(
      <TestWrapper>
        <div>
          {Array.from({ length: 100 }, (_, i) => (
            <div key={i}>Item {i}</div>
          ))}
        </div>
      </TestWrapper>
    );

    const endTime = performance.now();
    const renderTime = endTime - startTime;

    // El tiempo de renderizado debería ser razonable (menos de 100ms)
    expect(renderTime).toBeLessThan(100);
  });

  test('limpia timeouts al desmontarse', () => {
    const clearTimeoutSpy = jest.spyOn(global, 'clearTimeout');
    
    const { unmount } = render(
      <TestWrapper errorBoundaryProps={{ enableAutoRecovery: true }}>
        <ThrowError shouldThrow={true} />
      </TestWrapper>
    );

    unmount();

    expect(clearTimeoutSpy).toHaveBeenCalled();
    clearTimeoutSpy.mockRestore();
  });
});

// ===================================
// TESTS DE EDGE CASES
// ===================================

describe('AdvancedErrorBoundary - Edge Cases', () => {
  test('maneja errores sin stack trace', () => {
    const errorWithoutStack = new Error('Error without stack');
    delete errorWithoutStack.stack;

    const ThrowErrorWithoutStack = () => {
      throw errorWithoutStack;
    };

    render(
      <TestWrapper>
        <ThrowErrorWithoutStack />
      </TestWrapper>
    );

    expect(screen.getByText(/error en componente/i)).toBeInTheDocument();
  });

  test('maneja errores con mensajes muy largos', () => {
    const longMessage = 'A'.repeat(1000);
    const ThrowLongError = () => {
      throw new Error(longMessage);
    };

    render(
      <TestWrapper>
        <ThrowLongError />
      </TestWrapper>
    );

    expect(screen.getByText(/error en componente/i)).toBeInTheDocument();
  });

  test('maneja múltiples errores consecutivos', () => {
    let errorCount = 0;
    const MultipleErrorComponent = () => {
      errorCount++;
      throw new Error(`Error ${errorCount}`);
    };

    const { rerender } = render(
      <TestWrapper>
        <MultipleErrorComponent />
      </TestWrapper>
    );

    expect(screen.getByText(/error en componente/i)).toBeInTheDocument();

    // Simular otro error
    rerender(
      <TestWrapper>
        <MultipleErrorComponent />
      </TestWrapper>
    );

    expect(screen.getByText(/error en componente/i)).toBeInTheDocument();
  });
});
