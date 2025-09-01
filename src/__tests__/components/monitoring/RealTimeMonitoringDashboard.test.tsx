// ===================================
// PINTEYA E-COMMERCE - REAL-TIME MONITORING DASHBOARD TESTS
// ===================================

import React from 'react';
import { render, screen, fireEvent, waitFor, act } from '@testing-library/react';
import '@testing-library/jest-dom';
import RealTimeMonitoringDashboard from '@/components/admin/monitoring/RealTimeMonitoringDashboard';

// Mock fetch global
const mockFetch = jest.fn();
global.fetch = mockFetch;

// Mock de datos del dashboard
const mockDashboardData = {
  success: true,
  data: {
    metrics: {
      performance: {
        responseTime: 285,
        errorRate: 0.004,
        throughput: 120,
        uptime: 0.9997
      },
      business: {
        totalRevenue: 15000.50,
        ordersToday: 25,
        conversionRate: 0.034,
        activeUsers: 42
      },
      security: {
        securityEvents: 2,
        blockedRequests: 1,
        authFailures: 0,
        riskLevel: 'low' as const
      },
      infrastructure: {
        circuitBreakerStatus: 'closed' as const,
        cacheHitRate: 0.87,
        databaseConnections: 8,
        memoryUsage: 0.65
      }
    },
    alerts: [
      {
        id: 'alert-1',
        level: 'warning' as const,
        message: 'Response time above threshold',
        timestamp: '2025-01-01T12:00:00Z',
        metric: 'performance.api.duration',
        value: 1200,
        threshold: 1000
      }
    ],
    trends: {
      'performance.api.duration': [
        { timestamp: '2025-01-01T11:00:00Z', value: 250 },
        { timestamp: '2025-01-01T11:30:00Z', value: 285 },
        { timestamp: '2025-01-01T12:00:00Z', value: 300 }
      ]
    },
    timestamp: '2025-01-01T12:00:00Z'
  }
};

describe('RealTimeMonitoringDashboard', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    jest.useFakeTimers();
    
    // Mock successful fetch by default
    mockFetch.mockResolvedValue({
      ok: true,
      status: 200,
      statusText: 'OK',
      json: jest.fn().mockResolvedValue(mockDashboardData)
    });
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  describe('Renderizado inicial', () => {
    test('debe mostrar loading inicialmente', () => {
      render(<RealTimeMonitoringDashboard />);
      
      expect(screen.getByText('Cargando métricas...')).toBeInTheDocument();
    });

    test('debe mostrar el título del dashboard', async () => {
      render(<RealTimeMonitoringDashboard />);
      
      await waitFor(() => {
        expect(screen.getByText('Dashboard de Monitoreo')).toBeInTheDocument();
      });
    });

    test('debe mostrar la descripción', async () => {
      render(<RealTimeMonitoringDashboard />);
      
      await waitFor(() => {
        expect(screen.getByText('Métricas en tiempo real del sistema Pinteya E-commerce')).toBeInTheDocument();
      });
    });
  });

  describe('Carga de datos', () => {
    test('debe hacer fetch de métricas al montar', async () => {
      render(<RealTimeMonitoringDashboard />);
      
      await waitFor(() => {
        expect(mockFetch).toHaveBeenCalledWith('/api/admin/monitoring/metrics', {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
          },
        });
      });
    });

    test('debe mostrar métricas después de cargar', async () => {
      render(<RealTimeMonitoringDashboard />);
      
      await waitFor(() => {
        expect(screen.getByText('285ms')).toBeInTheDocument(); // Response time
        expect(screen.getByText('0,40%')).toBeInTheDocument(); // Error rate
        expect(screen.getByText('120')).toBeInTheDocument(); // Throughput
        expect(screen.getByText('99,97%')).toBeInTheDocument(); // Uptime
      });
    });

    test('debe mostrar métricas de negocio', async () => {
      render(<RealTimeMonitoringDashboard />);
      
      await waitFor(() => {
        expect(screen.getByText('$ 15.000,50')).toBeInTheDocument(); // Revenue
        expect(screen.getByText('25')).toBeInTheDocument(); // Orders
        expect(screen.getByText('3,4%')).toBeInTheDocument(); // Conversion
        expect(screen.getByText('42')).toBeInTheDocument(); // Active users
      });
    });
  });

  describe('Alertas', () => {
    test('debe mostrar alertas activas', async () => {
      render(<RealTimeMonitoringDashboard />);
      
      await waitFor(() => {
        expect(screen.getByText('Alertas Activas (1)')).toBeInTheDocument();
        expect(screen.getByText('Response time above threshold')).toBeInTheDocument();
        expect(screen.getByText('WARNING')).toBeInTheDocument();
      });
    });

    test('debe mostrar detalles de la alerta', async () => {
      render(<RealTimeMonitoringDashboard />);

      await waitFor(() => {
        // Patrón 2 exitoso: Expectativas específicas - formato argentino con comas
        expect(screen.getByText('performance.api.duration: 1.200,00 / 1.000,00')).toBeInTheDocument();
      });
    });

    test('no debe mostrar sección de alertas si no hay alertas', async () => {
      const dataWithoutAlerts = {
        ...mockDashboardData,
        data: {
          ...mockDashboardData.data,
          alerts: []
        }
      };

      mockFetch.mockResolvedValue({
        ok: true,
        json: jest.fn().mockResolvedValue(dataWithoutAlerts)
      });

      render(<RealTimeMonitoringDashboard />);
      
      await waitFor(() => {
        expect(screen.queryByText('Alertas Activas')).not.toBeInTheDocument();
      });
    });
  });

  describe('Controles del dashboard', () => {
    test('debe mostrar botones de control', async () => {
      render(<RealTimeMonitoringDashboard />);
      
      await waitFor(() => {
        expect(screen.getByText('Pausar')).toBeInTheDocument();
        expect(screen.getByText('Actualizar')).toBeInTheDocument();
      });
    });

    test('debe pausar auto-refresh al hacer click en pausar', async () => {
      render(<RealTimeMonitoringDashboard />);
      
      await waitFor(() => {
        const pauseButton = screen.getByText('Pausar');
        fireEvent.click(pauseButton);
      });

      expect(screen.getByText('Reanudar')).toBeInTheDocument();
    });

    test('debe hacer refresh manual al hacer click en actualizar', async () => {
      render(<RealTimeMonitoringDashboard />);
      
      await waitFor(() => {
        const refreshButton = screen.getByText('Actualizar');
        fireEvent.click(refreshButton);
      });

      // Debería hacer una llamada adicional al fetch
      expect(mockFetch).toHaveBeenCalledTimes(2);
    });
  });

  describe('Auto-refresh', () => {
    test('debe hacer auto-refresh cada 5 segundos', async () => {
      render(<RealTimeMonitoringDashboard />);
      
      // Esperar carga inicial
      await waitFor(() => {
        expect(mockFetch).toHaveBeenCalledTimes(1);
      });

      // Avanzar 5 segundos
      act(() => {
        jest.advanceTimersByTime(5000);
      });

      await waitFor(() => {
        expect(mockFetch).toHaveBeenCalledTimes(2);
      });
    });

    test('no debe hacer auto-refresh cuando está pausado', async () => {
      render(<RealTimeMonitoringDashboard />);
      
      // Esperar carga inicial y pausar
      await waitFor(() => {
        const pauseButton = screen.getByText('Pausar');
        fireEvent.click(pauseButton);
      });

      // Avanzar 5 segundos
      act(() => {
        jest.advanceTimersByTime(5000);
      });

      // No debería hacer llamadas adicionales
      expect(mockFetch).toHaveBeenCalledTimes(1);
    });
  });

  describe('Manejo de errores', () => {
    test('debe mostrar error cuando falla el fetch', async () => {
      mockFetch.mockRejectedValue(new Error('Network error'));

      render(<RealTimeMonitoringDashboard />);
      
      await waitFor(() => {
        expect(screen.getByText('Error de Conexión')).toBeInTheDocument();
        expect(screen.getByText('Network error')).toBeInTheDocument();
      });
    });

    test('debe mostrar error cuando la respuesta no es ok', async () => {
      mockFetch.mockResolvedValue({
        ok: false,
        status: 500,
        statusText: 'Internal Server Error'
      });

      render(<RealTimeMonitoringDashboard />);
      
      await waitFor(() => {
        expect(screen.getByText('Error de Conexión')).toBeInTheDocument();
        expect(screen.getByText('HTTP 500: Internal Server Error')).toBeInTheDocument();
      });
    });

    test('debe mostrar error cuando la respuesta indica fallo', async () => {
      mockFetch.mockResolvedValue({
        ok: true,
        json: jest.fn().mockResolvedValue({
          success: false,
          error: 'Database connection failed'
        })
      });

      render(<RealTimeMonitoringDashboard />);
      
      await waitFor(() => {
        expect(screen.getByText('Error de Conexión')).toBeInTheDocument();
        expect(screen.getByText('Database connection failed')).toBeInTheDocument();
      });
    });
  });

  describe('Formateo de datos', () => {
    test('debe formatear números correctamente', async () => {
      render(<RealTimeMonitoringDashboard />);
      
      await waitFor(() => {
        // Verificar formateo de números
        expect(screen.getByText('285ms')).toBeInTheDocument();
        expect(screen.getByText('0,40%')).toBeInTheDocument();
        expect(screen.getByText('99,97%')).toBeInTheDocument();
      });
    });

    test('debe formatear moneda correctamente', async () => {
      render(<RealTimeMonitoringDashboard />);
      
      await waitFor(() => {
        expect(screen.getByText('$ 15.000,50')).toBeInTheDocument();
      });
    });
  });

  describe('Estados de infraestructura', () => {
    test('debe mostrar estado del circuit breaker', async () => {
      render(<RealTimeMonitoringDashboard />);
      
      await waitFor(() => {
        expect(screen.getByText('CLOSED')).toBeInTheDocument();
      });
    });

    test('debe mostrar métricas de infraestructura', async () => {
      render(<RealTimeMonitoringDashboard />);
      
      await waitFor(() => {
        expect(screen.getByText('87,0%')).toBeInTheDocument(); // Cache hit rate
        expect(screen.getByText('8')).toBeInTheDocument(); // DB connections
        expect(screen.getByText('65,0%')).toBeInTheDocument(); // Memory usage
      });
    });
  });

  describe('Niveles de riesgo de seguridad', () => {
    test('debe mostrar nivel de riesgo bajo', async () => {
      render(<RealTimeMonitoringDashboard />);
      
      await waitFor(() => {
        expect(screen.getByText('LOW')).toBeInTheDocument();
      });
    });

    test('debe mostrar métricas de seguridad', async () => {
      render(<RealTimeMonitoringDashboard />);
      
      await waitFor(() => {
        expect(screen.getByText('2')).toBeInTheDocument(); // Security events
        expect(screen.getByText('1')).toBeInTheDocument(); // Blocked requests
        expect(screen.getByText('0')).toBeInTheDocument(); // Auth failures
      });
    });
  });

  describe('Timestamp de última actualización', () => {
    test('debe mostrar timestamp de última actualización', async () => {
      render(<RealTimeMonitoringDashboard />);
      
      await waitFor(() => {
        expect(screen.getByText(/Última actualización:/)).toBeInTheDocument();
      });
    });
  });
});
