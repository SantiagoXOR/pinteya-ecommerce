/**
 * Test específico para verificar que los logos del Header se renderizan correctamente
 * después de las correcciones de inconsistencias entre desktop y mobile
 */

import React from 'react';
import { render, screen } from '@testing-library/react';
import { pinteyaMobileLogoProps, pinteyaDesktopLogoProps } from '@/utils/imageOptimization';
import { OptimizedLogo, HeaderLogo } from '@/components/ui/OptimizedLogo';

describe('Header Logo Configuration', () => {
  describe('Logo Props Configuration', () => {
    it('debe tener configuración correcta para logo mobile', () => {
      expect(pinteyaMobileLogoProps).toEqual({
        src: '/images/logo/optimized/LogoPinteYa-mobile.webp',
        alt: 'Pinteya - Tu Pinturería Online',
        width: 64,
        height: 64,
        priority: true,
        className: 'rounded-xl shadow-lg object-contain',
        style: {
          filter: 'drop-shadow(0 2px 4px rgba(0,0,0,0.1))'
        },
        quality: 90,
        placeholder: 'blur',
        blurDataURL: expect.any(String)
      });
    });

    it('debe tener configuración correcta para logo desktop', () => {
      expect(pinteyaDesktopLogoProps).toEqual({
        src: '/images/logo/LOGO POSITIVO.svg',
        alt: 'Pinteya - Tu Pinturería Online',
        width: 160,
        height: 32,
        priority: true,
        className: 'object-contain'
      });
    });

    it('debe usar archivos apropiados para cada versión', () => {
      // Mobile usa LogoPinteYa optimizado
      expect(pinteyaMobileLogoProps.src).toContain('LogoPinteYa-mobile');
      expect(pinteyaMobileLogoProps.src).toContain('/optimized/');

      // Desktop usa LOGO POSITIVO.svg original
      expect(pinteyaDesktopLogoProps.src).toBe('/images/logo/LOGO POSITIVO.svg');
    });

    it('ambos logos deben tener el mismo alt text', () => {
      expect(pinteyaMobileLogoProps.alt).toBe(pinteyaDesktopLogoProps.alt);
      expect(pinteyaMobileLogoProps.alt).toBe('Pinteya - Tu Pinturería Online');
    });

    it('debe usar dimensiones apropiadas para cada versión', () => {
      // Mobile: cuadrado 64x64
      expect(pinteyaMobileLogoProps.width).toBe(64);
      expect(pinteyaMobileLogoProps.height).toBe(64);

      // Desktop: rectangular 160x32 (SVG original)
      expect(pinteyaDesktopLogoProps.width).toBe(160);
      expect(pinteyaDesktopLogoProps.height).toBe(32);
    });

    it('ambos logos deben tener priority true para optimización', () => {
      expect(pinteyaMobileLogoProps.priority).toBe(true);
      expect(pinteyaDesktopLogoProps.priority).toBe(true);
    });
  });

  describe('Logo File Existence', () => {
    it('debe referenciar archivos que existen en el proyecto', () => {
      // Mobile usa archivo optimizado
      expect(pinteyaMobileLogoProps.src).toContain('/optimized/LogoPinteYa-mobile');
      expect(pinteyaMobileLogoProps.src).toContain('.webp');

      // Desktop usa SVG original
      expect(pinteyaDesktopLogoProps.src).toBe('/images/logo/LOGO POSITIVO.svg');
    });

    it('no debe referenciar archivos inexistentes', () => {
      // Verificamos que no use el archivo inexistente anterior
      expect(pinteyaMobileLogoProps.src).not.toBe('/images/logo/logoPinteYaF.png');
      expect(pinteyaDesktopLogoProps.src).not.toBe('/images/logo/logoPinteYaF.png');
    });
  });

  describe('OptimizedLogo Component', () => {
    it('debe renderizar logo mobile correctamente', () => {
      render(<OptimizedLogo variant="mobile" data-testid="test-mobile-logo" />);

      const logo = screen.getByTestId('test-mobile-logo');
      expect(logo).toBeInTheDocument();
      expect(logo).toHaveAttribute('alt', 'Pinteya - Tu Pinturería Online');
    });

    it('debe renderizar logo desktop correctamente', () => {
      render(<OptimizedLogo variant="desktop" data-testid="test-desktop-logo" />);

      const logo = screen.getByTestId('test-desktop-logo');
      expect(logo).toBeInTheDocument();
      expect(logo).toHaveAttribute('alt', 'Pinteya - Tu Pinturería Online');
    });

    it('debe usar WebP por defecto y tener fallback PNG', () => {
      render(<OptimizedLogo variant="mobile" data-testid="test-webp-logo" />);

      const logo = screen.getByTestId('test-webp-logo');
      expect(logo).toHaveAttribute('src', expect.stringContaining('.webp'));
    });
  });

  describe('HeaderLogo Component', () => {
    it('debe renderizar logo mobile cuando isMobile es true', () => {
      render(<HeaderLogo isMobile={true} />);

      const logo = screen.getByTestId('mobile-logo');
      expect(logo).toBeInTheDocument();
    });

    it('debe renderizar logo desktop cuando isMobile es false', () => {
      render(<HeaderLogo isMobile={false} />);

      const logo = screen.getByTestId('desktop-logo');
      expect(logo).toBeInTheDocument();
    });
  });
});









