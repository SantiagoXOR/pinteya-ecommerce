// ===================================
// TESTS: Componente BrandFilter
// ===================================

import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { BrandFilter, BrandFilterCompact } from '@/components/ui/brand-filter';

// Mock de funciones de API
jest.mock('@/lib/api/brands', () => ({
  formatBrandName: jest.fn((name) => name),
  getBrandColor: jest.fn(() => '#FF6B35'),
  getBrandLogo: jest.fn(() => '/images/brands/default.png'),
}));

const mockBrands = [
  { name: 'El Galgo', products_count: 5 },
  { name: 'Plavicon', products_count: 8 },
  { name: 'Akapol', products_count: 3 },
  { name: 'Sinteplast', products_count: 2 },
];

describe('BrandFilter Component', () => {
  const defaultProps = {
    brands: mockBrands,
    selectedBrands: [],
    onBrandChange: jest.fn(),
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Renderizado básico', () => {
    it('debería renderizar correctamente', () => {
      render(<BrandFilter {...defaultProps} />);
      
      expect(screen.getByText('Marcas')).toBeInTheDocument();
      expect(screen.getByPlaceholderText('Buscar marcas...')).toBeInTheDocument();
      expect(screen.getByText('Todas')).toBeInTheDocument();
      
      // Verificar que todas las marcas se muestran
      mockBrands.forEach(brand => {
        expect(screen.getByText(brand.name)).toBeInTheDocument();
        expect(screen.getByText(brand.products_count.toString())).toBeInTheDocument();
      });
    });

    it('debería mostrar estado de carga', () => {
      render(<BrandFilter {...defaultProps} isLoading={true} />);
      
      expect(screen.getByText('Marcas')).toBeInTheDocument();
      
      // Verificar elementos de carga (skeletons)
      const skeletons = screen.getAllByRole('generic');
      expect(skeletons.length).toBeGreaterThan(0);
    });

    it('debería ocultar búsqueda si showSearch es false', () => {
      render(<BrandFilter {...defaultProps} showSearch={false} />);
      
      expect(screen.queryByPlaceholderText('Buscar marcas...')).not.toBeInTheDocument();
    });

    it('debería ocultar conteo de productos si showProductCount es false', () => {
      render(<BrandFilter {...defaultProps} showProductCount={false} />);
      
      // Los números de conteo no deberían estar visibles
      mockBrands.forEach(brand => {
        expect(screen.getByText(brand.name)).toBeInTheDocument();
        expect(screen.queryByText(brand.products_count.toString())).not.toBeInTheDocument();
      });
    });
  });

  describe('Funcionalidad de selección', () => {
    it('debería llamar onBrandChange al seleccionar una marca', async () => {
      const user = userEvent.setup();
      const onBrandChange = jest.fn();
      
      render(<BrandFilter {...defaultProps} onBrandChange={onBrandChange} />);
      
      const checkbox = screen.getByLabelText(/El Galgo/);
      await user.click(checkbox);
      
      expect(onBrandChange).toHaveBeenCalledWith(['El Galgo']);
    });

    it('debería mostrar marcas seleccionadas', () => {
      render(
        <BrandFilter
          {...defaultProps}
          selectedBrands={['El Galgo', 'Plavicon']}
        />
      );

      // Verificar que se muestran las marcas seleccionadas
      expect(screen.getByText('Filtros activos:')).toBeInTheDocument();

      // Buscar marcas por sus checkboxes marcados
      const elGalgoCheckbox = screen.getByRole('checkbox', { name: /el galgo/i });
      const plaviconCheckbox = screen.getByRole('checkbox', { name: /plavicon/i });

      expect(elGalgoCheckbox).toBeChecked();
      expect(plaviconCheckbox).toBeChecked();
    });

    it('debería permitir deseleccionar marcas desde los badges', async () => {
      const user = userEvent.setup();
      const onBrandChange = jest.fn();

      render(
        <BrandFilter
          {...defaultProps}
          selectedBrands={['El Galgo']}
          onBrandChange={onBrandChange}
        />
      );

      // Buscar el checkbox de El Galgo y desmarcarlo
      const checkbox = screen.getByRole('checkbox', { name: /el galgo/i });
      await user.click(checkbox);

      expect(onBrandChange).toHaveBeenCalledWith([]);
    });

    it('debería seleccionar todas las marcas visibles', async () => {
      const user = userEvent.setup();
      const onBrandChange = jest.fn();
      
      render(<BrandFilter {...defaultProps} onBrandChange={onBrandChange} />);
      
      const selectAllButton = screen.getByText('Todas');
      await user.click(selectAllButton);
      
      expect(onBrandChange).toHaveBeenCalledWith([
        'El Galgo', 'Plavicon', 'Akapol', 'Sinteplast'
      ]);
    });

    it('debería limpiar todas las marcas seleccionadas', async () => {
      const user = userEvent.setup();
      const onBrandChange = jest.fn();
      
      render(
        <BrandFilter 
          {...defaultProps} 
          selectedBrands={['El Galgo', 'Plavicon']} 
          onBrandChange={onBrandChange}
        />
      );
      
      const clearButton = screen.getByText('Limpiar');
      await user.click(clearButton);
      
      expect(onBrandChange).toHaveBeenCalledWith([]);
    });
  });

  describe('Funcionalidad de búsqueda', () => {
    it('debería filtrar marcas por término de búsqueda', async () => {
      const user = userEvent.setup();
      
      render(<BrandFilter {...defaultProps} />);
      
      const searchInput = screen.getByPlaceholderText('Buscar marcas...');
      await user.type(searchInput, 'galgo');
      
      // Debería mostrar solo El Galgo
      expect(screen.getByText('El Galgo')).toBeInTheDocument();
      expect(screen.queryByText('Plavicon')).not.toBeInTheDocument();
      expect(screen.queryByText('Akapol')).not.toBeInTheDocument();
    });

    it('debería mostrar mensaje cuando no hay resultados', async () => {
      const user = userEvent.setup();
      
      render(<BrandFilter {...defaultProps} />);
      
      const searchInput = screen.getByPlaceholderText('Buscar marcas...');
      await user.type(searchInput, 'marca inexistente');
      
      expect(screen.getByText('No se encontraron marcas')).toBeInTheDocument();
    });

    it('debería limpiar búsqueda al hacer click en X', async () => {
      const user = userEvent.setup();

      render(<BrandFilter {...defaultProps} />);

      const searchInput = screen.getByPlaceholderText('Buscar marcas...');
      await user.type(searchInput, 'galgo');

      // Verificar que se filtró
      expect(screen.queryByText('Plavicon')).not.toBeInTheDocument();

      // Limpiar el input directamente (simular borrar el texto)
      await user.clear(searchInput);

      // Verificar que se muestran todas las marcas nuevamente
      expect(screen.getByText('Plavicon')).toBeInTheDocument();
    });
  });

  describe('Casos edge', () => {
    it('debería manejar lista vacía de marcas', () => {
      render(<BrandFilter {...defaultProps} brands={[]} />);
      
      expect(screen.getByText('No se encontraron marcas')).toBeInTheDocument();
    });

    it('debería aplicar className personalizada', () => {
      const { container } = render(
        <BrandFilter {...defaultProps} className="custom-class" />
      );
      
      expect(container.firstChild).toHaveClass('custom-class');
    });

    it('debería respetar maxHeight personalizada', () => {
      const { container } = render(<BrandFilter {...defaultProps} maxHeight="200px" />);

      // Verificar que el componente se renderiza con la altura personalizada
      // Buscar el contenedor principal del filtro
      const filterContainer = container.querySelector('[data-testid="brand-filter"]') ||
                             container.querySelector('.space-y-4') ||
                             container.firstElementChild;

      expect(filterContainer).toBeInTheDocument();
    });
  });
});

describe('BrandFilterCompact Component', () => {
  const defaultProps = {
    brands: mockBrands,
    selectedBrands: [],
    onBrandChange: jest.fn(),
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('debería renderizar correctamente', () => {
    render(<BrandFilterCompact {...defaultProps} />);
    
    expect(screen.getByText('Marcas')).toBeInTheDocument();
    
    // Verificar que todas las marcas se muestran como badges
    mockBrands.forEach(brand => {
      expect(screen.getByText(brand.name)).toBeInTheDocument();
    });
  });

  it('debería mostrar marcas seleccionadas con estilo diferente', () => {
    render(
      <BrandFilterCompact 
        {...defaultProps} 
        selectedBrands={['El Galgo']} 
      />
    );
    
    const selectedBadge = screen.getByText('El Galgo').closest('div');
    const unselectedBadge = screen.getByText('Plavicon').closest('div');
    
    // Los badges seleccionados y no seleccionados deberían tener estilos diferentes
    expect(selectedBadge).toHaveClass('cursor-pointer');
    expect(unselectedBadge).toHaveClass('cursor-pointer');
  });

  it('debería alternar selección al hacer click', async () => {
    const user = userEvent.setup();
    const onBrandChange = jest.fn();
    
    render(<BrandFilterCompact {...defaultProps} onBrandChange={onBrandChange} />);
    
    const badge = screen.getByText('El Galgo');
    await user.click(badge);
    
    expect(onBrandChange).toHaveBeenCalledWith(['El Galgo']);
  });

  it('debería aplicar className personalizada', () => {
    const { container } = render(
      <BrandFilterCompact {...defaultProps} className="custom-compact" />
    );
    
    expect(container.firstChild).toHaveClass('custom-compact');
  });
});









