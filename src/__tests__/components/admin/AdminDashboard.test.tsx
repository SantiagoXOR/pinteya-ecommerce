// ===================================
// TESTS DE COMPONENTES - ADMIN DASHBOARD
// Tests para el panel de administración
// ===================================

import { render, screen, fireEvent, waitFor, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { AdminDashboard } from '@/components/admin/AdminDashboard'
import { AuthProvider } from '@/contexts/AuthContext'
import { supabase } from '@/lib/integrations/supabase'
import { toast } from 'sonner'
import React from 'react'

// Mocks
jest.mock('@/lib/supabase', () => ({
  supabase: {
    auth: {
      getUser: jest.fn(),
    },
    from: jest.fn(() => ({
      select: jest.fn(() => ({
        eq: jest.fn(() => ({
          gte: jest.fn(() => ({
            lte: jest.fn(() => ({
              order: jest.fn(() => ({
                limit: jest.fn(),
              })),
            })),
          })),
        })),
        count: jest.fn(),
        single: jest.fn(),
      })),
    })),
  },
}))

jest.mock('sonner', () => ({
  toast: {
    success: jest.fn(),
    error: jest.fn(),
    loading: jest.fn(),
  },
}))

jest.mock('next/navigation', () => ({
  useRouter: () => ({
    push: jest.fn(),
    replace: jest.fn(),
    refresh: jest.fn(),
  }),
}))

// Mock de Chart.js
jest.mock('react-chartjs-2', () => ({
  Line: ({ data, options }: any) => (
    <div data-testid='line-chart' data-chart-data={JSON.stringify(data)}>
      Chart: {data.datasets[0].label}
    </div>
  ),
  Bar: ({ data, options }: any) => (
    <div data-testid='bar-chart' data-chart-data={JSON.stringify(data)}>
      Chart: {data.datasets[0].label}
    </div>
  ),
  Doughnut: ({ data, options }: any) => (
    <div data-testid='doughnut-chart' data-chart-data={JSON.stringify(data)}>
      Chart: {data.datasets[0].label}
    </div>
  ),
}))

// Datos de prueba
const mockAdminUser = {
  id: 'admin-123',
  email: 'admin@example.com',
  user_metadata: {
    full_name: 'Admin User',
    role: 'admin',
  },
}

const mockDashboardData = {
  stats: {
    totalOrders: 150,
    totalRevenue: 45000,
    totalProducts: 89,
    totalUsers: 1250,
    pendingOrders: 12,
    lowStockProducts: 5,
  },
  recentOrders: [
    {
      id: 'order-1',
      user_email: 'user1@example.com',
      total: 299.99,
      status: 'pending',
      created_at: '2024-01-15T10:30:00Z',
      items: [{ product_name: 'Laptop Gaming', quantity: 1, price: 299.99 }],
    },
    {
      id: 'order-2',
      user_email: 'user2@example.com',
      total: 149.5,
      status: 'completed',
      created_at: '2024-01-15T09:15:00Z',
      items: [{ product_name: 'Mouse Inalámbrico', quantity: 2, price: 74.75 }],
    },
  ],
  salesData: {
    daily: [
      { date: '2024-01-10', sales: 1200 },
      { date: '2024-01-11', sales: 1500 },
      { date: '2024-01-12', sales: 1800 },
      { date: '2024-01-13', sales: 1300 },
      { date: '2024-01-14', sales: 2100 },
      { date: '2024-01-15', sales: 1900 },
    ],
    monthly: [
      { month: 'Dic 2023', sales: 35000 },
      { month: 'Ene 2024', sales: 45000 },
    ],
  },
  topProducts: [
    { id: 1, name: 'Laptop Gaming', sales: 25, revenue: 7499.75 },
    { id: 2, name: 'Mouse Inalámbrico', sales: 45, revenue: 3367.5 },
    { id: 3, name: 'Teclado Mecánico', sales: 32, revenue: 4800.0 },
  ],
  lowStockProducts: [
    { id: 1, name: 'Laptop Gaming', stock: 2, min_stock: 5 },
    { id: 2, name: 'Monitor 4K', stock: 1, min_stock: 3 },
  ],
}

// Wrapper de providers
const createWrapper = () => {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: { retry: false },
      mutations: { retry: false },
    },
  })

  return ({ children }: { children: React.ReactNode }) => (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>{children}</AuthProvider>
    </QueryClientProvider>
  )
}

describe('AdminDashboard Component', () => {
  beforeEach(() => {
    jest.clearAllMocks()

    // Mock usuario admin autenticado
    ;(supabase.auth.getUser as jest.Mock).mockResolvedValue({
      data: { user: mockAdminUser },
      error: null,
    })
  })

  describe('Renderizado Inicial', () => {
    it('debe renderizar el dashboard correctamente', async () => {
      // Mock de datos del dashboard
      ;(supabase.from as jest.Mock).mockImplementation(table => {
        const mockQueries = {
          orders: {
            select: jest.fn(() => ({
              count: jest.fn().mockResolvedValue({ count: mockDashboardData.stats.totalOrders }),
            })),
          },
          products: {
            select: jest.fn(() => ({
              count: jest.fn().mockResolvedValue({ count: mockDashboardData.stats.totalProducts }),
            })),
          },
          users: {
            select: jest.fn(() => ({
              count: jest.fn().mockResolvedValue({ count: mockDashboardData.stats.totalUsers }),
            })),
          },
        }

        return (
          mockQueries[table as keyof typeof mockQueries] || {
            select: jest.fn(() => ({
              eq: jest.fn(() => ({
                order: jest.fn(() => ({
                  limit: jest.fn().mockResolvedValue({ data: [] }),
                })),
              })),
            })),
          }
        )
      })

      render(<AdminDashboard />, { wrapper: createWrapper() })

      // Verificar título principal
      expect(screen.getByText('Panel de Administración')).toBeInTheDocument()

      // Verificar que se muestran las secciones principales
      expect(screen.getByText('Estadísticas Generales')).toBeInTheDocument()
      expect(screen.getByText('Órdenes Recientes')).toBeInTheDocument()
      expect(screen.getByText('Análisis de Ventas')).toBeInTheDocument()
    })

    it('debe mostrar loading state inicialmente', () => {
      render(<AdminDashboard />, { wrapper: createWrapper() })

      expect(screen.getByTestId('dashboard-loading')).toBeInTheDocument()
      expect(screen.getByText('Cargando dashboard...')).toBeInTheDocument()
    })

    it('debe manejar errores de carga', async () => {
      ;(supabase.from as jest.Mock).mockImplementation(() => ({
        select: jest.fn(() => ({
          count: jest.fn().mockRejectedValue(new Error('Database error')),
        })),
      }))

      render(<AdminDashboard />, { wrapper: createWrapper() })

      await waitFor(() => {
        expect(screen.getByText('Error al cargar el dashboard')).toBeInTheDocument()
        expect(screen.getByText('Reintentar')).toBeInTheDocument()
      })
    })
  })

  describe('Estadísticas Generales', () => {
    beforeEach(() => {
      // Mock exitoso de estadísticas
      ;(supabase.from as jest.Mock).mockImplementation(table => {
        const responses = {
          orders: {
            select: jest.fn(() => ({
              count: jest.fn().mockResolvedValue({ count: mockDashboardData.stats.totalOrders }),
              eq: jest.fn(() => ({
                count: jest
                  .fn()
                  .mockResolvedValue({ count: mockDashboardData.stats.pendingOrders }),
              })),
            })),
          },
          products: {
            select: jest.fn(() => ({
              count: jest.fn().mockResolvedValue({ count: mockDashboardData.stats.totalProducts }),
              lt: jest.fn(() => ({
                count: jest
                  .fn()
                  .mockResolvedValue({ count: mockDashboardData.stats.lowStockProducts }),
              })),
            })),
          },
          users: {
            select: jest.fn(() => ({
              count: jest.fn().mockResolvedValue({ count: mockDashboardData.stats.totalUsers }),
            })),
          },
        }

        return responses[table as keyof typeof responses]
      })
    })

    it('debe mostrar las estadísticas correctamente', async () => {
      render(<AdminDashboard />, { wrapper: createWrapper() })

      await waitFor(() => {
        expect(screen.getByText('150')).toBeInTheDocument() // Total órdenes
        expect(screen.getByText('89')).toBeInTheDocument() // Total productos
        expect(screen.getByText('1,250')).toBeInTheDocument() // Total usuarios
        expect(screen.getByText('12')).toBeInTheDocument() // Órdenes pendientes
      })

      // Verificar etiquetas
      expect(screen.getByText('Total Órdenes')).toBeInTheDocument()
      expect(screen.getByText('Total Productos')).toBeInTheDocument()
      expect(screen.getByText('Total Usuarios')).toBeInTheDocument()
      expect(screen.getByText('Órdenes Pendientes')).toBeInTheDocument()
    })

    it('debe mostrar alertas para productos con bajo stock', async () => {
      render(<AdminDashboard />, { wrapper: createWrapper() })

      await waitFor(() => {
        const lowStockAlert = screen.getByTestId('low-stock-alert')
        expect(lowStockAlert).toBeInTheDocument()
        expect(within(lowStockAlert).getByText('5 productos con bajo stock')).toBeInTheDocument()
      })
    })

    it('debe permitir navegar a secciones específicas', async () => {
      const user = userEvent.setup()
      render(<AdminDashboard />, { wrapper: createWrapper() })

      await waitFor(() => {
        expect(screen.getByText('Ver todas las órdenes')).toBeInTheDocument()
      })

      // Click en "Ver todas las órdenes"
      await user.click(screen.getByText('Ver todas las órdenes'))

      // Verificar navegación (esto dependería de la implementación real)
      // En un test real, verificaríamos que se llama al router
    })
  })

  describe('Órdenes Recientes', () => {
    beforeEach(() => {
      ;(supabase.from as jest.Mock).mockImplementation(table => {
        if (table === 'orders') {
          return {
            select: jest.fn(() => ({
              order: jest.fn(() => ({
                limit: jest.fn().mockResolvedValue({
                  data: mockDashboardData.recentOrders,
                }),
              })),
            })),
          }
        }
        return {
          select: jest.fn(() => ({
            count: jest.fn().mockResolvedValue({ count: 0 }),
          })),
        }
      })
    })

    it('debe mostrar las órdenes recientes', async () => {
      render(<AdminDashboard />, { wrapper: createWrapper() })

      await waitFor(() => {
        expect(screen.getByText('user1@example.com')).toBeInTheDocument()
        expect(screen.getByText('user2@example.com')).toBeInTheDocument()
        expect(screen.getByText('$299.99')).toBeInTheDocument()
        expect(screen.getByText('$149.50')).toBeInTheDocument()
      })
    })

    it('debe mostrar el estado de las órdenes con colores apropiados', async () => {
      render(<AdminDashboard />, { wrapper: createWrapper() })

      await waitFor(() => {
        const pendingStatus = screen.getByText('pending')
        const completedStatus = screen.getByText('completed')

        expect(pendingStatus).toHaveClass('status-pending')
        expect(completedStatus).toHaveClass('status-completed')
      })
    })

    it('debe permitir ver detalles de una orden', async () => {
      const user = userEvent.setup()
      render(<AdminDashboard />, { wrapper: createWrapper() })

      await waitFor(() => {
        expect(screen.getByText('Ver detalles')).toBeInTheDocument()
      })

      await user.click(screen.getAllByText('Ver detalles')[0])

      // Verificar que se abre el modal o navega a la página de detalles
      await waitFor(() => {
        expect(screen.getByText('Detalles de la Orden')).toBeInTheDocument()
      })
    })

    it('debe permitir cambiar el estado de una orden', async () => {
      const user = userEvent.setup()

      // Mock para actualización de orden
      ;(supabase.from as jest.Mock).mockImplementation(table => {
        if (table === 'orders') {
          return {
            select: jest.fn(() => ({
              order: jest.fn(() => ({
                limit: jest.fn().mockResolvedValue({
                  data: mockDashboardData.recentOrders,
                }),
              })),
            })),
            update: jest.fn(() => ({
              eq: jest.fn().mockResolvedValue({
                data: [{ ...mockDashboardData.recentOrders[0], status: 'processing' }],
                error: null,
              }),
            })),
          }
        }
        return { select: jest.fn(() => ({ count: jest.fn().mockResolvedValue({ count: 0 }) })) }
      })

      render(<AdminDashboard />, { wrapper: createWrapper() })

      await waitFor(() => {
        expect(screen.getAllByText('Cambiar Estado')[0]).toBeInTheDocument()
      })

      await user.click(screen.getAllByText('Cambiar Estado')[0])

      // Seleccionar nuevo estado
      const statusSelect = screen.getByTestId('status-select')
      await user.selectOptions(statusSelect, 'processing')

      await user.click(screen.getByText('Actualizar'))

      await waitFor(() => {
        expect(toast.success).toHaveBeenCalledWith('Estado de orden actualizado')
      })
    })
  })

  describe('Gráficos y Análisis', () => {
    beforeEach(() => {
      // Mock de datos de ventas
      ;(supabase.from as jest.Mock).mockImplementation(table => {
        if (table === 'orders') {
          return {
            select: jest.fn(() => ({
              gte: jest.fn(() => ({
                lte: jest.fn(() => ({
                  order: jest.fn().mockResolvedValue({
                    data: mockDashboardData.salesData.daily,
                  }),
                })),
              })),
            })),
          }
        }
        return { select: jest.fn(() => ({ count: jest.fn().mockResolvedValue({ count: 0 }) })) }
      })
    })

    it('debe mostrar gráfico de ventas diarias', async () => {
      render(<AdminDashboard />, { wrapper: createWrapper() })

      await waitFor(() => {
        expect(screen.getByTestId('line-chart')).toBeInTheDocument()
      })

      const chart = screen.getByTestId('line-chart')
      const chartData = JSON.parse(chart.getAttribute('data-chart-data') || '{}')

      expect(chartData.datasets[0].label).toBe('Ventas Diarias')
      expect(chartData.labels).toContain('2024-01-15')
    })

    it('debe mostrar gráfico de productos más vendidos', async () => {
      // Mock para productos más vendidos
      ;(supabase.from as jest.Mock).mockImplementation(table => {
        if (table === 'order_items') {
          return {
            select: jest.fn(() => ({
              order: jest.fn(() => ({
                limit: jest.fn().mockResolvedValue({
                  data: mockDashboardData.topProducts,
                }),
              })),
            })),
          }
        }
        return { select: jest.fn(() => ({ count: jest.fn().mockResolvedValue({ count: 0 }) })) }
      })

      render(<AdminDashboard />, { wrapper: createWrapper() })

      await waitFor(() => {
        expect(screen.getByTestId('bar-chart')).toBeInTheDocument()
      })

      const chart = screen.getByTestId('bar-chart')
      const chartData = JSON.parse(chart.getAttribute('data-chart-data') || '{}')

      expect(chartData.datasets[0].label).toBe('Productos Más Vendidos')
    })

    it('debe permitir cambiar el período de análisis', async () => {
      const user = userEvent.setup()
      render(<AdminDashboard />, { wrapper: createWrapper() })

      await waitFor(() => {
        expect(screen.getByTestId('period-selector')).toBeInTheDocument()
      })

      // Cambiar a vista mensual
      await user.selectOptions(screen.getByTestId('period-selector'), 'monthly')

      await waitFor(() => {
        // Verificar que se actualiza el gráfico
        expect(screen.getByText('Ventas Mensuales')).toBeInTheDocument()
      })
    })
  })

  describe('Funcionalidades de Administración', () => {
    it('debe mostrar acciones rápidas', async () => {
      render(<AdminDashboard />, { wrapper: createWrapper() })

      await waitFor(() => {
        expect(screen.getByText('Acciones Rápidas')).toBeInTheDocument()
        expect(screen.getByText('Agregar Producto')).toBeInTheDocument()
        expect(screen.getByText('Ver Inventario')).toBeInTheDocument()
        expect(screen.getByText('Gestionar Usuarios')).toBeInTheDocument()
      })
    })

    it('debe permitir exportar datos', async () => {
      const user = userEvent.setup()
      render(<AdminDashboard />, { wrapper: createWrapper() })

      await waitFor(() => {
        expect(screen.getByText('Exportar Datos')).toBeInTheDocument()
      })

      await user.click(screen.getByText('Exportar Datos'))

      // Verificar opciones de exportación
      expect(screen.getByText('Exportar Órdenes')).toBeInTheDocument()
      expect(screen.getByText('Exportar Productos')).toBeInTheDocument()
      expect(screen.getByText('Exportar Usuarios')).toBeInTheDocument()
    })

    it('debe mostrar notificaciones importantes', async () => {
      render(<AdminDashboard />, { wrapper: createWrapper() })

      await waitFor(() => {
        expect(screen.getByTestId('notifications-panel')).toBeInTheDocument()
      })

      // Verificar notificaciones de stock bajo
      expect(screen.getByText('Productos con stock bajo')).toBeInTheDocument()

      // Verificar notificaciones de órdenes pendientes
      expect(screen.getByText('Órdenes pendientes de procesamiento')).toBeInTheDocument()
    })

    it('debe actualizar datos en tiempo real', async () => {
      const { rerender } = render(<AdminDashboard />, { wrapper: createWrapper() })

      // Simular actualización de datos
      const updatedStats = {
        ...mockDashboardData.stats,
        totalOrders: 155, // 5 órdenes más
        pendingOrders: 15, // 3 órdenes pendientes más
      }

      ;(supabase.from as jest.Mock).mockImplementation(table => {
        if (table === 'orders') {
          return {
            select: jest.fn(() => ({
              count: jest.fn().mockResolvedValue({ count: updatedStats.totalOrders }),
              eq: jest.fn(() => ({
                count: jest.fn().mockResolvedValue({ count: updatedStats.pendingOrders }),
              })),
            })),
          }
        }
        return { select: jest.fn(() => ({ count: jest.fn().mockResolvedValue({ count: 0 }) })) }
      })

      rerender(<AdminDashboard />)

      await waitFor(() => {
        expect(screen.getByText('155')).toBeInTheDocument()
        expect(screen.getByText('15')).toBeInTheDocument()
      })
    })
  })

  describe('Responsive Design', () => {
    it('debe adaptarse a pantallas móviles', () => {
      // Simular viewport móvil
      Object.defineProperty(window, 'innerWidth', {
        writable: true,
        configurable: true,
        value: 375,
      })

      render(<AdminDashboard />, { wrapper: createWrapper() })

      // Verificar que se muestra la versión móvil
      expect(screen.getByTestId('mobile-dashboard')).toBeInTheDocument()

      // Verificar que las estadísticas se muestran en formato de tarjetas apiladas
      expect(screen.getByTestId('mobile-stats-grid')).toBeInTheDocument()
    })

    it('debe mostrar menú hamburguesa en móvil', async () => {
      const user = userEvent.setup()

      Object.defineProperty(window, 'innerWidth', {
        writable: true,
        configurable: true,
        value: 375,
      })

      render(<AdminDashboard />, { wrapper: createWrapper() })

      const hamburgerMenu = screen.getByTestId('mobile-menu-toggle')
      expect(hamburgerMenu).toBeInTheDocument()

      await user.click(hamburgerMenu)

      expect(screen.getByTestId('mobile-navigation-menu')).toBeVisible()
    })
  })

  describe('Accesibilidad', () => {
    it('debe tener etiquetas ARIA apropiadas', () => {
      render(<AdminDashboard />, { wrapper: createWrapper() })

      expect(screen.getByRole('main')).toHaveAttribute('aria-label', 'Panel de administración')
      expect(screen.getByRole('region', { name: 'Estadísticas generales' })).toBeInTheDocument()
      expect(screen.getByRole('region', { name: 'Órdenes recientes' })).toBeInTheDocument()
    })

    it('debe ser navegable por teclado', async () => {
      const user = userEvent.setup()
      render(<AdminDashboard />, { wrapper: createWrapper() })

      // Verificar que los elementos interactivos son focusables
      await user.tab()
      expect(screen.getByText('Ver todas las órdenes')).toHaveFocus()

      await user.tab()
      expect(screen.getByText('Agregar Producto')).toHaveFocus()
    })

    it('debe anunciar cambios importantes a lectores de pantalla', async () => {
      render(<AdminDashboard />, { wrapper: createWrapper() })

      // Verificar región de anuncios
      expect(screen.getByRole('status')).toBeInTheDocument()

      // Simular actualización de datos
      await waitFor(() => {
        expect(screen.getByRole('status')).toHaveTextContent(
          'Dashboard actualizado con nuevos datos'
        )
      })
    })
  })
})
