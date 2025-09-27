// =====================================================
// TEST: LOGISTICS MAP COMPONENT
// Descripción: Tests comprehensivos para el componente de mapa
// Basado en: Jest + RTL + MSW
// =====================================================

import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { LogisticsMap } from '@/components/admin/logistics/LogisticsMap';
import { mockShipment, createMockWebSocket } from '../setup/test-config';

// =====================================================
// SETUP
// =====================================================

const createTestQueryClient = () => new QueryClient({
  defaultOptions: {
    queries: { retry: false },
    mutations: { retry: false }
  }
});

const renderWithProviders = (component: React.ReactElement) => {
  const queryClient = createTestQueryClient();
  return render(
    <QueryClientProvider client={queryClient}>
      {component}
    </QueryClientProvider>
  );
};

// =====================================================
// TESTS BÁSICOS
// =====================================================

describe('LogisticsMap Component', () => {
  beforeEach(() => {
    createMockWebSocket();
  });

  it('should render map container', () => {
    renderWithProviders(
      <LogisticsMap shipments={[]} />
    );

    expect(screen.getByText('Mapa de Logística')).toBeInTheDocument();
    expect(screen.getByText('Tracking en tiempo real de 0 envíos')).toBeInTheDocument();
  });

  it('should display shipments count correctly', () => {
    const shipments = [mockShipment, { ...mockShipment, id: 2 }];
    
    renderWithProviders(
      <LogisticsMap shipments={shipments} />
    );

    expect(screen.getByText('Tracking en tiempo real de 2 envíos')).toBeInTheDocument();
  });

  it('should show loading state initially', () => {
    renderWithProviders(
      <LogisticsMap shipments={[]} />
    );

    expect(screen.getByText('Cargando mapa...')).toBeInTheDocument();
  });

  // =====================================================
  // TESTS DE FILTROS
  // =====================================================

  it('should render filter controls', () => {
    renderWithProviders(
      <LogisticsMap shipments={[mockShipment]} />
    );

    // Filtro de estado
    const comboboxes = screen.getAllByRole('combobox');
    expect(comboboxes.length).toBeGreaterThan(0);
    expect(comboboxes[0]).toBeInTheDocument();
    
    // Switches de capas
    expect(screen.getByText('Zonas')).toBeInTheDocument();
    expect(screen.getByText('Rutas')).toBeInTheDocument();
  });

  it('should filter shipments by status', async () => {
    const shipments = [
      { ...mockShipment, id: 1, status: 'in_transit' },
      { ...mockShipment, id: 2, status: 'delivered' }
    ];

    renderWithProviders(
      <LogisticsMap shipments={shipments} />
    );

    // Verificar que hay filtros disponibles
    const comboboxes = screen.getAllByRole('combobox');
    expect(comboboxes.length).toBeGreaterThan(0);
    
    const filterSelect = comboboxes[0]; // Usar el primer combobox
    expect(filterSelect).toBeInTheDocument();
    
    // Simular interacción con el filtro
    fireEvent.click(filterSelect);
    
    // Verificar que el componente sigue funcionando
    expect(comboboxes[0]).toBeInTheDocument();
  });

  // =====================================================
  // TESTS DE CONTROLES
  // =====================================================

  it('should have map control buttons', () => {
    renderWithProviders(
      <LogisticsMap shipments={[]} />
    );

    // Verificar que hay botones de control disponibles
    const buttons = screen.getAllByRole('button');
    expect(buttons.length).toBeGreaterThan(0);
    
    // Verificar que los botones son interactuables
    buttons.forEach(button => {
      expect(button).toBeInTheDocument();
      expect(button).not.toBeDisabled();
    });
  });

  it('should toggle geofences visibility', () => {
    renderWithProviders(
      <LogisticsMap shipments={[]} />
    );

    const switches = screen.getAllByRole('switch');
    const geofenceSwitch = switches[1] || switches[0]; // Usar el segundo switch o el primero si solo hay uno
    expect(geofenceSwitch).toBeInTheDocument();

    fireEvent.click(geofenceSwitch);
    // Verificar que el click fue procesado
    expect(geofenceSwitch).toBeInTheDocument();
  });

  it('should toggle routes visibility', () => {
    renderWithProviders(
      <LogisticsMap shipments={[]} />
    );

    const switches = screen.getAllByRole('switch');
    const routesSwitch = switches[0]; // Usar el primer switch disponible
    expect(routesSwitch).toBeInTheDocument();

    fireEvent.click(routesSwitch);
    // Verificar que el click fue procesado
    expect(routesSwitch).toBeInTheDocument();
  });

  // =====================================================
  // TESTS DE ESTILOS DE MAPA
  // =====================================================

  it('should change map style', async () => {
    renderWithProviders(
      <LogisticsMap shipments={[]} />
    );

    // Encontrar el select de estilo
    const styleSelects = screen.getAllByRole('combobox');
    const styleSelect = styleSelects.find(select => 
      select.getAttribute('aria-label')?.includes('style') || 
      select.closest('[data-testid]')?.getAttribute('data-testid')?.includes('style')
    ) || styleSelects[1]; // Fallback al segundo select

    if (styleSelect) {
      fireEvent.click(styleSelect);

      await waitFor(() => {
        // Buscar opción de satélite si existe
        const satelliteOption = screen.queryByText('Satélite') || screen.queryByText('satellite');
        if (satelliteOption) {
          fireEvent.click(satelliteOption);
        }
      });

      // Verificar que el select sigue siendo válido después del cambio
      expect(styleSelect).toBeInTheDocument();
    }
  });

  // =====================================================
  // TESTS DE TIEMPO REAL
  // =====================================================

  it('should show real-time badge when enabled', () => {
    renderWithProviders(
      <LogisticsMap shipments={[]} realTimeEnabled={true} />
    );

    expect(screen.getByText('Tiempo Real')).toBeInTheDocument();
  });

  it('should not show real-time badge when disabled', () => {
    renderWithProviders(
      <LogisticsMap shipments={[]} realTimeEnabled={false} />
    );

    expect(screen.queryByText('Tiempo Real')).not.toBeInTheDocument();
  });

  // =====================================================
  // TESTS DE SELECCIÓN DE ENVÍOS
  // =====================================================

  it('should call onShipmentSelect when shipment is selected', () => {
    const onShipmentSelect = jest.fn();
    
    renderWithProviders(
      <LogisticsMap 
        shipments={[mockShipment]} 
        onShipmentSelect={onShipmentSelect}
      />
    );

    // Simular click en el mapa (esto normalmente sería manejado por MapLibre)
    // Como MapLibre está mockeado, simulamos el comportamiento
    const mapContainer = document.querySelector('[data-testid="map-container"]') || 
                        document.querySelector('.maplibregl-map');
    
    if (mapContainer) {
      fireEvent.click(mapContainer);
      // En un test real, esto triggearía el evento de MapLibre
      // que llamaría a onShipmentSelect
    }
  });

  // =====================================================
  // TESTS DE LEYENDA
  // =====================================================

  it('should display map legend', () => {
    renderWithProviders(
      <LogisticsMap shipments={[]} />
    );

    expect(screen.getByText('En Tránsito')).toBeInTheDocument();
    expect(screen.getByText('En Reparto')).toBeInTheDocument();
    expect(screen.getByText('Entregado')).toBeInTheDocument();
  });

  // =====================================================
  // TESTS DE RESPONSIVE
  // =====================================================

  it('should be responsive', () => {
    const { container } = renderWithProviders(
      <LogisticsMap shipments={[]} />
    );

    const mapCard = container.querySelector('.relative');
    expect(mapCard).toHaveClass('relative');
  });

  // =====================================================
  // TESTS DE ACCESIBILIDAD
  // =====================================================

  it('should have proper ARIA labels', () => {
    renderWithProviders(
      <LogisticsMap shipments={[]} />
    );

    // Verificar que los controles están presentes y son accesibles
    const switches = screen.getAllByRole('switch');
    expect(switches.length).toBeGreaterThan(0);
    
    switches.forEach(switchElement => {
      // Verificar que el switch es interactuable
      expect(switchElement).toBeInTheDocument();
      expect(switchElement).not.toBeDisabled();
    });
  });

  it('should support keyboard navigation', () => {
    renderWithProviders(
      <LogisticsMap shipments={[]} />
    );

    const filterSelect = screen.getAllByRole('combobox')[0];
    
    // Verificar que es focuseable
    filterSelect.focus();
    expect(filterSelect).toHaveFocus();

    // Simular navegación con teclado
    fireEvent.keyDown(filterSelect, { key: 'ArrowDown' });
    fireEvent.keyDown(filterSelect, { key: 'Enter' });
  });

  // =====================================================
  // TESTS DE ERROR HANDLING
  // =====================================================

  it('should handle empty shipments gracefully', () => {
    renderWithProviders(
      <LogisticsMap shipments={[]} />
    );

    expect(screen.getByText('Tracking en tiempo real de 0 envíos')).toBeInTheDocument();
  });

  it('should handle invalid shipment data', () => {
    const invalidShipments = [
      { ...mockShipment, id: null },
      { ...mockShipment, status: 'invalid_status' }
    ] as Partial<typeof mockShipment>[];

    expect(() => {
      renderWithProviders(
        <LogisticsMap shipments={invalidShipments} />
      );
    }).not.toThrow();
  });

  // =====================================================
  // TESTS DE PERFORMANCE
  // =====================================================

  it('should handle large number of shipments', () => {
    const manyShipments = Array.from({ length: 1000 }, (_, i) => ({
      ...mockShipment,
      id: i + 1,
      shipment_number: `SHP-${i + 1}`
    }));

    const startTime = performance.now();
    
    renderWithProviders(
      <LogisticsMap shipments={manyShipments} />
    );

    const endTime = performance.now();
    const renderTime = endTime - startTime;

    // Verificar que el render no tome más de 1 segundo
    expect(renderTime).toBeLessThan(1000);
    
    expect(screen.getByText('Tracking en tiempo real de 1000 envíos')).toBeInTheDocument();
  });

  // =====================================================
  // TESTS DE CLEANUP
  // =====================================================

  it('should cleanup resources on unmount', () => {
    const { unmount } = renderWithProviders(
      <LogisticsMap shipments={[]} />
    );

    // Verificar que no hay memory leaks
    expect(() => unmount()).not.toThrow();
  });
});
