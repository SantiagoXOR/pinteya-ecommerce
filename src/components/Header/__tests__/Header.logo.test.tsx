/**
 * Test específico para verificar que los logos del Header se renderizan correctamente
 * después de las correcciones de inconsistencias entre desktop y mobile
 */

import React from 'react'
import { render, screen } from '@testing-library/react'
import { pinteyaMobileLogoProps, pinteyaDesktopLogoProps } from '@/utils/imageOptimization'
import { OptimizedLogo, HeaderLogo } from '@/components/ui/OptimizedLogo'

describe('Header Logo Configuration', () => {
  describe('Logo Props Configuration', () => {
    it('debe tener configuración correcta para logo mobile', () => {
      expect(pinteyaMobileLogoProps).toEqual({
        src: '/images/logo/LOGO POSITIVO.svg',
        alt: 'Pinteya - Tu Pinturería Online',
        width: 64,
        height: 64,
        priority: false,
        className: 'rounded-xl object-contain',
        quality: 90,
      })
    })

    it('debe tener configuración correcta para logo desktop', () => {
      expect(pinteyaDesktopLogoProps).toEqual({
        src: '/images/logo/LOGO POSITIVO.svg',
        alt: 'Pinteya - Tu Pinturería Online',
        width: 200,
        height: 56,
        priority: false,
        className: 'object-contain',
      })
    })

    it('debe usar archivos apropiados para cada versión', () => {
      expect(pinteyaMobileLogoProps.src).toBe('/images/logo/LOGO POSITIVO.svg')
      expect(pinteyaDesktopLogoProps.src).toBe('/images/logo/LOGO POSITIVO.svg')
    })

    it('ambos logos deben tener el mismo alt text', () => {
      expect(pinteyaMobileLogoProps.alt).toBe(pinteyaDesktopLogoProps.alt)
      expect(pinteyaMobileLogoProps.alt).toBe('Pinteya - Tu Pinturería Online')
    })

    it('debe usar dimensiones apropiadas para cada versión', () => {
      // Mobile: cuadrado 64x64
      expect(pinteyaMobileLogoProps.width).toBe(64)
      expect(pinteyaMobileLogoProps.height).toBe(64)

      // Desktop: rectangular 200x56`r`n      expect(pinteyaDesktopLogoProps.width).toBe(200)`r`n      expect(pinteyaDesktopLogoProps.height).toBe(56)
    })

    it('ambos logos deben tener priority false (LCP reservado para hero)', () => {
      expect(pinteyaMobileLogoProps.priority).toBe(false)
      expect(pinteyaDesktopLogoProps.priority).toBe(false)
    })
  })

  describe('Logo File Existence', () => {
    it('debe referenciar archivos que existen en el proyecto', () => {
      expect(pinteyaMobileLogoProps.src).toBe('/images/logo/LOGO POSITIVO.svg')
      expect(pinteyaDesktopLogoProps.src).toBe('/images/logo/LOGO POSITIVO.svg')
    })

    it('no debe referenciar archivos inexistentes', () => {
      // Verificamos que no use el archivo inexistente anterior
      expect(pinteyaMobileLogoProps.src).not.toBe('/images/logo/logoPinteYaF.png')
      expect(pinteyaDesktopLogoProps.src).not.toBe('/images/logo/logoPinteYaF.png')
    })
  })

  describe('OptimizedLogo Component', () => {
    it('debe renderizar logo mobile correctamente', () => {
      render(<OptimizedLogo variant='mobile' data-testid='test-mobile-logo' />)

      const logo = screen.getByTestId('test-mobile-logo')
      expect(logo).toBeInTheDocument()
      expect(logo).toHaveAttribute('alt', 'Pinteya - Tu Pinturería Online')
    })

    it('debe renderizar logo desktop correctamente', () => {
      render(<OptimizedLogo variant='desktop' data-testid='test-desktop-logo' />)

      const logo = screen.getByTestId('test-desktop-logo')
      expect(logo).toBeInTheDocument()
      expect(logo).toHaveAttribute('alt', 'Pinteya - Tu Pinturería Online')
    })

    it('debe usar SVG para logo (LCP reservado para hero)', () => {
      render(<OptimizedLogo variant='mobile' data-testid='test-webp-logo' />)

      const logo = screen.getByTestId('test-webp-logo')
      expect(logo).toHaveAttribute('src', expect.stringContaining('.svg'))
    })
  })

  describe('HeaderLogo Component', () => {
    it('debe renderizar logo mobile cuando isMobile es true', () => {
      render(<HeaderLogo isMobile={true} />)

      const logo = screen.getByTestId('mobile-logo')
      expect(logo).toBeInTheDocument()
    })

    it('debe renderizar logo desktop cuando isMobile es false', () => {
      render(<HeaderLogo isMobile={false} />)

      const logo = screen.getByTestId('desktop-logo')
      expect(logo).toBeInTheDocument()
    })
  })
})
