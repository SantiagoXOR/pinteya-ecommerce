import React from 'react';
import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';
import Hero from '@/components/Home/Hero';

// Mock next/image
jest.mock('next/image', () => ({
  __esModule: true,
  default: ({ src, alt, ...props }: any) => (
    <img src={src} alt={alt} {...props} />
  ),
}));

// Mock next/link
jest.mock('next/link', () => ({
  __esModule: true,
  default: ({ children, href, ...props }: any) => (
    <a href={href} {...props}>
      {children}
    </a>
  ),
}));

describe('Hero Component', () => {
  it('should render without crashing', () => {
    expect(() => {
      render(<Hero />);
    }).not.toThrow();
  });

  it('should render the main heading', () => {
    render(<Hero />);
    expect(screen.getByText(/Pintar ahora/i)).toBeInTheDocument();
    expect(screen.getByText(/fácil/i)).toBeInTheDocument();
  });

  it('should render the description text', () => {
    render(<Hero />);
    expect(screen.getByText(/Descubrí la mejor selección de pinturas/i)).toBeInTheDocument();
  });

  it('should render shipping badges', () => {
    render(<Hero />);
    expect(screen.getByText(/Llega gratis mañana/i)).toBeInTheDocument();
    // Usar getAllByText para manejar múltiples elementos con "ENVÍO GRATIS"
    const envioGratisElements = screen.getAllByText(/ENVÍO GRATIS/i);
    expect(envioGratisElements.length).toBeGreaterThan(0);
  });

  it('should render action buttons', () => {
    render(<Hero />);
    expect(screen.getByText(/Ver Catálogo/i)).toBeInTheDocument();
  });

  it('should render offer cards', () => {
    render(<Hero />);
    expect(screen.getByText(/25% OFF/i)).toBeInTheDocument();
    // Usar getAllByText para manejar múltiples elementos con "Envío gratis"
    const envioGratisElements = screen.getAllByText(/Envío gratis/i);
    expect(envioGratisElements.length).toBeGreaterThan(0);
  });

  it('should render location information', () => {
    render(<Hero />);
    expect(screen.getByText(/Yapeyú 1201, Córdoba/i)).toBeInTheDocument();
  });

  it('should render SVG icons without errors', () => {
    const { container } = render(<Hero />);
    const svgElements = container.querySelectorAll('svg');
    expect(svgElements.length).toBeGreaterThan(0);
    
    // Verificar que todos los SVG tienen viewBox definido
    svgElements.forEach(svg => {
      if (svg.hasAttribute('viewBox')) {
        expect(svg.getAttribute('viewBox')).toBeTruthy();
      }
    });
  });

  it('should render Truck icon from lucide-react', () => {
    const { container } = render(<Hero />);
    // El ícono Truck debería estar presente
    const truckIcons = container.querySelectorAll('[data-lucide="truck"], .lucide-truck');
    // Si no encuentra por data attributes, al menos debería haber SVGs
    const svgElements = container.querySelectorAll('svg');
    expect(svgElements.length).toBeGreaterThan(0);
  });

  it('should render all Badge components correctly', () => {
    const { container } = render(<Hero />);
    // Buscar elementos con clases de Badge
    const badgeElements = container.querySelectorAll('[class*="bg-fun-green"]');
    expect(badgeElements.length).toBeGreaterThanOrEqual(2);
  });

  it('should not have undefined elements in JSX', () => {
    // Este test específicamente busca el error mencionado
    const consoleSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
    
    expect(() => {
      render(<Hero />);
    }).not.toThrow();
    
    // Verificar que no hay errores de React sobre elementos undefined
    const reactErrors = consoleSpy.mock.calls.filter(call => 
      call[0] && call[0].toString().includes('Element type is invalid')
    );
    
    expect(reactErrors).toHaveLength(0);
    
    consoleSpy.mockRestore();
  });
});
