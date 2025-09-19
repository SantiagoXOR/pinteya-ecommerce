// ===================================
// PINTEYA E-COMMERCE - SEO DASHBOARD TESTS
// Tests completos para el dashboard administrativo SEO
// ===================================

import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { jest } from '@jest/globals';
import '@testing-library/jest-dom';

// Mock de Next.js
jest.mock('next/navigation', () => ({
  useRouter: () => ({
    push: jest.fn(),
    back: jest.fn(),
    forward: jest.fn(),
    refresh: jest.fn(),
  }),
  useSearchParams: () => new URLSearchParams(),
  usePathname: () => '/admin/seo',
}));

// Mock de Clerk
jest.mock('@clerk/nextjs', () => ({
  useAuth: () => ({
    isLoaded: true,
    userId: 'test-user-id',
    sessionId: 'test-session-id',
    getToken: jest.fn().mockResolvedValue('test-token'),
  }),
  useUser: () => ({
    isLoaded: true,
    user: {
      id: 'test-user-id',
      emailAddresses: [{ emailAddress: 'admin@pinteya.com' }],
    },
  }),
}));

// Mock de componentes UI
jest.mock('@/components/ui/card', () => ({
  Card: ({ children, className }: any) => <div className={className}>{children}</div>,
  CardContent: ({ children }: any) => <div>{children}</div>,
  CardDescription: ({ children }: any) => <div>{children}</div>,
  CardHeader: ({ children }: any) => <div>{children}</div>,
  CardTitle: ({ children }: any) => <h3>{children}</h3>,
}));

jest.mock('@/components/ui/button', () => ({
  Button: ({ children, onClick, disabled, ...props }: any) => (
    <button onClick={onClick} disabled={disabled} {...props}>
      {children}
    </button>
  ),
}));

jest.mock('@/components/ui/badge', () => ({
  Badge: ({ children, className }: any) => <span className={className}>{children}</span>,
}));

jest.mock('@/components/ui/progress', () => ({
  Progress: ({ value }: any) => <div data-testid="progress" data-value={value}></div>,
}));

jest.mock('@/components/ui/alert', () => ({
  Alert: ({ children }: any) => <div role="alert">{children}</div>,
  AlertDescription: ({ children }: any) => <div>{children}</div>,
}));

jest.mock('@/components/admin/layout/AdminLayout', () => ({
  AdminLayout: ({ children, title, actions }: any) => (
    <div>
      <h1>{title}</h1>
      {actions && <div data-testid="actions">{actions}</div>}
      <main>{children}</main>
    </div>
  ),
}));

// Mock de APIs
global.fetch = jest.fn();

// Importar componente después de los mocks
import SEOAdminDashboard from '@/app/admin/seo/page';

// ===================================
// DATOS DE PRUEBA
// ===================================

const mockOverviewData = {
  overallScore: 85,
  totalPages: 1247,
  indexedPages: 1180,
  organicTraffic: 8920,
  avgPosition: 3.2,
  ctr: 2.56,
  coreWebVitals: {
    lcp: 2.1,
    fid: 85,
    cls: 0.08,
    fcp: 1.8,
    ttfb: 420,
    inp: 180
  },
  recentTests: {
    total: 24,
    passed: 18,
    failed: 3,
    warnings: 3
  },
  sitemapStatus: {
    totalUrls: 1247,
    lastGenerated: new Date().toISOString(),
    errors: 2
  },
  optimizationStatus: {
    activeTools: 4,
    improvements: 12,
    issues: 5
  }
};

const mockAlerts = [
  {
    id: 'alert_1',
    type: 'warning',
    title: 'Meta Description Faltante',
    message: 'Se detectaron 5 páginas sin meta description',
    timestamp: new Date().toISOString(),
    url: '/products/pintura-interior',
    action: {
      label: 'Revisar',
      href: '/admin/seo/testing'
    }
  },
  {
    id: 'alert_2',
    type: 'error',
    title: 'Error en Sitemap',
    message: 'El sitemap contiene URLs inválidas',
    timestamp: new Date().toISOString(),
    action: {
      label: 'Corregir',
      href: '/admin/seo/sitemap'
    }
  }
];

// ===================================
// SETUP Y HELPERS
// ===================================

const mockFetch = (data: any, status = 200) => {
  (global.fetch as jest.Mock).mockResolvedValueOnce({
    ok: status >= 200 && status < 300,
    status,
    json: async () => ({ success: true, data }),
  });
};

const renderDashboard = () => {
  return render(<SEOAdminDashboard />);
};

// ===================================
// TESTS PRINCIPALES
// ===================================

describe('SEO Admin Dashboard', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    // Mock inicial para cargar datos
    mockFetch(mockOverviewData);
    mockFetch(mockAlerts);
  });

  // ===================================
  // TESTS DE RENDERIZADO
  // ===================================

  describe('Renderizado Inicial', () => {
    test('debe renderizar el título del dashboard', async () => {
      renderDashboard();
      
      expect(screen.getByText('SEO Dashboard')).toBeInTheDocument();
    });

    test('debe mostrar estado de carga inicial', () => {
      renderDashboard();
      
      // Verificar que se muestran skeletons de carga
      const loadingCards = screen.getAllByText('Cargando...');
      expect(loadingCards.length).toBeGreaterThan(0);
    });

    test('debe cargar y mostrar métricas principales', async () => {
      renderDashboard();
      
      await waitFor(() => {
        expect(screen.getByText('85')).toBeInTheDocument(); // Overall Score
        expect(screen.getByText('8,920')).toBeInTheDocument(); // Organic Traffic
        expect(screen.getByText('3.2')).toBeInTheDocument(); // Avg Position
      });
    });
  });

  // ===================================
  // TESTS DE MÉTRICAS
  // ===================================

  describe('Métricas del Dashboard', () => {
    test('debe mostrar todas las métricas principales', async () => {
      renderDashboard();
      
      await waitFor(() => {
        // Verificar métricas clave
        expect(screen.getByText('SEO Score General')).toBeInTheDocument();
        expect(screen.getByText('Tráfico Orgánico')).toBeInTheDocument();
        expect(screen.getByText('Posición Promedio')).toBeInTheDocument();
        expect(screen.getByText('CTR Promedio')).toBeInTheDocument();
      });
    });

    test('debe mostrar Core Web Vitals correctamente', async () => {
      renderDashboard();
      
      await waitFor(() => {
        expect(screen.getByText('Core Web Vitals')).toBeInTheDocument();
        expect(screen.getByText('2.1s')).toBeInTheDocument(); // LCP
        expect(screen.getByText('85ms')).toBeInTheDocument(); // FID
        expect(screen.getByText('0.08')).toBeInTheDocument(); // CLS
      });
    });

    test('debe mostrar progreso con barras de progreso', async () => {
      renderDashboard();
      
      await waitFor(() => {
        const progressBars = screen.getAllByTestId('progress');
        expect(progressBars.length).toBeGreaterThan(0);
        
        // Verificar que tienen valores
        progressBars.forEach(bar => {
          expect(bar).toHaveAttribute('data-value');
        });
      });
    });
  });

  // ===================================
  // TESTS DE ALERTAS
  // ===================================

  describe('Sistema de Alertas', () => {
    test('debe mostrar alertas activas', async () => {
      renderDashboard();
      
      await waitFor(() => {
        expect(screen.getByText('Meta Description Faltante')).toBeInTheDocument();
        expect(screen.getByText('Error en Sitemap')).toBeInTheDocument();
      });
    });

    test('debe mostrar diferentes tipos de alertas', async () => {
      renderDashboard();
      
      await waitFor(() => {
        // Verificar que se muestran alertas de warning y error
        expect(screen.getByText('Se detectaron 5 páginas sin meta description')).toBeInTheDocument();
        expect(screen.getByText('El sitemap contiene URLs inválidas')).toBeInTheDocument();
      });
    });

    test('debe permitir descartar alertas', async () => {
      mockFetch({ success: true }); // Mock para dismiss alert
      
      renderDashboard();
      
      await waitFor(() => {
        const dismissButtons = screen.getAllByText('×');
        expect(dismissButtons.length).toBeGreaterThan(0);
      });
      
      // Simular click en descartar
      const dismissButton = screen.getAllByText('×')[0];
      fireEvent.click(dismissButton);
      
      await waitFor(() => {
        expect(global.fetch).toHaveBeenCalledWith(
          expect.stringContaining('/api/admin/seo/dashboard'),
          expect.objectContaining({
            method: 'POST',
            body: expect.stringContaining('dismiss-alert')
          })
        );
      });
    });
  });

  // ===================================
  // TESTS DE ACCIONES RÁPIDAS
  // ===================================

  describe('Acciones Rápidas', () => {
    test('debe mostrar botones de acciones rápidas', async () => {
      renderDashboard();
      
      await waitFor(() => {
        expect(screen.getByText('Ejecutar Auditoría')).toBeInTheDocument();
        expect(screen.getByText('Generar Reporte')).toBeInTheDocument();
        expect(screen.getByText('Optimizar Contenido')).toBeInTheDocument();
        expect(screen.getByText('Actualizar Sitemap')).toBeInTheDocument();
      });
    });

    test('debe ejecutar auditoría rápida', async () => {
      mockFetch({ success: true, data: { score: 88 } }); // Mock para quick audit
      
      renderDashboard();
      
      await waitFor(() => {
        const auditButton = screen.getByText('Ejecutar Auditoría');
        fireEvent.click(auditButton);
      });
      
      await waitFor(() => {
        expect(global.fetch).toHaveBeenCalledWith(
          expect.stringContaining('/api/admin/seo/dashboard'),
          expect.objectContaining({
            method: 'POST',
            body: expect.stringContaining('run-quick-audit')
          })
        );
      });
    });

    test('debe actualizar datos del dashboard', async () => {
      mockFetch({ success: true }); // Mock para refresh
      
      renderDashboard();
      
      await waitFor(() => {
        const refreshButton = screen.getByText('Actualizar');
        fireEvent.click(refreshButton);
      });
      
      await waitFor(() => {
        expect(global.fetch).toHaveBeenCalledWith(
          expect.stringContaining('/api/admin/seo/dashboard?type=overview')
        );
      });
    });
  });

  // ===================================
  // TESTS DE NAVEGACIÓN
  // ===================================

  describe('Navegación', () => {
    test('debe mostrar enlaces a secciones especializadas', async () => {
      renderDashboard();
      
      await waitFor(() => {
        expect(screen.getByText('Ver Analytics Detallado')).toBeInTheDocument();
        expect(screen.getByText('Gestionar Tests')).toBeInTheDocument();
        expect(screen.getByText('Herramientas de Optimización')).toBeInTheDocument();
        expect(screen.getByText('Gestionar Sitemap')).toBeInTheDocument();
      });
    });

    test('debe tener breadcrumbs correctos', () => {
      renderDashboard();
      
      // Verificar que AdminLayout recibe breadcrumbs
      expect(screen.getByText('SEO Dashboard')).toBeInTheDocument();
    });
  });

  // ===================================
  // TESTS DE ESTADO DE SISTEMAS
  // ===================================

  describe('Estado de Sistemas', () => {
    test('debe mostrar estado de testing', async () => {
      renderDashboard();
      
      await waitFor(() => {
        expect(screen.getByText('Tests Recientes')).toBeInTheDocument();
        expect(screen.getByText('18 passed')).toBeInTheDocument();
        expect(screen.getByText('3 failed')).toBeInTheDocument();
        expect(screen.getByText('3 warnings')).toBeInTheDocument();
      });
    });

    test('debe mostrar estado del sitemap', async () => {
      renderDashboard();
      
      await waitFor(() => {
        expect(screen.getByText('Estado del Sitemap')).toBeInTheDocument();
        expect(screen.getByText('1,247 URLs')).toBeInTheDocument();
        expect(screen.getByText('2 errores')).toBeInTheDocument();
      });
    });

    test('debe mostrar estado de optimización', async () => {
      renderDashboard();
      
      await waitFor(() => {
        expect(screen.getByText('Herramientas de Optimización')).toBeInTheDocument();
        expect(screen.getByText('4 activas')).toBeInTheDocument();
        expect(screen.getByText('12 mejoras')).toBeInTheDocument();
        expect(screen.getByText('5 issues')).toBeInTheDocument();
      });
    });
  });

  // ===================================
  // TESTS DE MANEJO DE ERRORES
  // ===================================

  describe('Manejo de Errores', () => {
    test('debe manejar errores de API gracefully', async () => {
      (global.fetch as jest.Mock).mockRejectedValueOnce(new Error('API Error'));
      
      renderDashboard();
      
      await waitFor(() => {
        expect(screen.getByText(/Error cargando datos/)).toBeInTheDocument();
      });
    });

    test('debe mostrar mensaje cuando no hay datos', async () => {
      mockFetch(null);
      
      renderDashboard();
      
      await waitFor(() => {
        expect(screen.getByText(/No hay datos disponibles/)).toBeInTheDocument();
      });
    });

    test('debe deshabilitar botones durante carga', async () => {
      renderDashboard();
      
      // Los botones deben estar deshabilitados durante la carga inicial
      const buttons = screen.getAllByRole('button');
      buttons.forEach(button => {
        if (button.textContent?.includes('Ejecutar') || button.textContent?.includes('Generar')) {
          expect(button).toBeDisabled();
        }
      });
    });
  });

  // ===================================
  // TESTS DE PERFORMANCE
  // ===================================

  describe('Performance', () => {
    test('debe cargar datos de forma eficiente', async () => {
      const startTime = Date.now();
      
      renderDashboard();
      
      await waitFor(() => {
        expect(screen.getByText('85')).toBeInTheDocument();
      });
      
      const loadTime = Date.now() - startTime;
      expect(loadTime).toBeLessThan(5000); // Debe cargar en menos de 5 segundos
    });

    test('debe usar caché para evitar llamadas redundantes', async () => {
      renderDashboard();
      
      await waitFor(() => {
        expect(screen.getByText('85')).toBeInTheDocument();
      });
      
      // Verificar que no se hacen llamadas adicionales innecesarias
      const fetchCalls = (global.fetch as jest.Mock).mock.calls.length;
      expect(fetchCalls).toBeLessThanOrEqual(3); // Overview + Alerts + posible refresh
    });
  });

  // ===================================
  // TESTS DE ACCESIBILIDAD
  // ===================================

  describe('Accesibilidad', () => {
    test('debe tener estructura semántica correcta', async () => {
      renderDashboard();
      
      await waitFor(() => {
        // Verificar headings
        expect(screen.getByRole('heading', { level: 1 })).toBeInTheDocument();
        
        // Verificar que las alertas tienen role="alert"
        const alerts = screen.getAllByRole('alert');
        expect(alerts.length).toBeGreaterThan(0);
      });
    });

    test('debe ser navegable por teclado', async () => {
      renderDashboard();
      
      await waitFor(() => {
        const buttons = screen.getAllByRole('button');
        buttons.forEach(button => {
          expect(button).toHaveAttribute('tabIndex');
        });
      });
    });

    test('debe tener textos alternativos para elementos visuales', async () => {
      renderDashboard();
      
      await waitFor(() => {
        // Verificar que los iconos tienen labels apropiados
        const progressBars = screen.getAllByTestId('progress');
        progressBars.forEach(bar => {
          expect(bar).toHaveAttribute('data-value');
        });
      });
    });
  });
});

// ===================================
// TESTS DE INTEGRACIÓN
// ===================================

describe('Integración SEO Dashboard', () => {
  test('debe integrar correctamente con todos los managers SEO', async () => {
    renderDashboard();
    
    await waitFor(() => {
      // Verificar que se muestran datos de todos los sistemas
      expect(screen.getByText('SEO Score General')).toBeInTheDocument();
      expect(screen.getByText('Tests Recientes')).toBeInTheDocument();
      expect(screen.getByText('Estado del Sitemap')).toBeInTheDocument();
      expect(screen.getByText('Herramientas de Optimización')).toBeInTheDocument();
    });
  });

  test('debe actualizar datos en tiempo real', async () => {
    renderDashboard();
    
    // Simular actualización de datos
    mockFetch({
      ...mockOverviewData,
      overallScore: 90 // Score actualizado
    });
    
    const refreshButton = screen.getByText('Actualizar');
    fireEvent.click(refreshButton);
    
    await waitFor(() => {
      expect(screen.getByText('90')).toBeInTheDocument();
    });
  });
});
