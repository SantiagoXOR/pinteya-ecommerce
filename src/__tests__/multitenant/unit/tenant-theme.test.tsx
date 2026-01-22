/**
 * Tests Unitarios - Tenant Theme
 * 
 * Verifica:
 * - Generación de CSS variables correctas
 * - Aplicación de colores del tenant
 * - Fallback a valores por defecto
 * - Variables CSS en formato correcto
 * - Conversión HEX a HSL
 */

import { describe, it, expect } from '@jest/globals'
import React from 'react'
import { render } from '@testing-library/react'
import { TenantThemeStyles, getTenantThemeCSS } from '@/components/theme/TenantThemeStyles'
import { extractPublicConfig, mockTenants } from '../setup'

describe('Tenant Theme', () => {
  const pinteyaPublic = extractPublicConfig(mockTenants.pinteya)
  const pintemasPublic = extractPublicConfig(mockTenants.pintemas)

  describe('TenantThemeStyles Component', () => {
    it('should generate CSS variables with tenant colors', () => {
      const { container } = render(<TenantThemeStyles tenant={pinteyaPublic} />)
      const styleElement = container.querySelector('#tenant-theme-styles')

      expect(styleElement).toBeDefined()
      const cssContent = styleElement?.innerHTML || ''

      // Verificar que contiene las variables CSS del tenant
      expect(cssContent).toContain('--tenant-primary: #f27a1d')
      expect(cssContent).toContain('--tenant-primary-dark: #bd4811')
      expect(cssContent).toContain('--tenant-primary-light: #f9be78')
      expect(cssContent).toContain('--tenant-secondary: #00f269')
      expect(cssContent).toContain('--tenant-accent: #f9a007')
      expect(cssContent).toContain('--tenant-header-bg: #bd4811')
    })

    it('should generate HSL variables for Tailwind compatibility', () => {
      const { container } = render(<TenantThemeStyles tenant={pinteyaPublic} />)
      const styleElement = container.querySelector('#tenant-theme-styles')
      const cssContent = styleElement?.innerHTML || ''

      // Verificar que contiene variables HSL
      expect(cssContent).toContain('--tenant-primary-hsl:')
      expect(cssContent).toContain('--tenant-primary-dark-hsl:')
      expect(cssContent).toContain('--tenant-primary-light-hsl:')
    })

    it('should map to blaze-orange variables for compatibility', () => {
      const { container } = render(<TenantThemeStyles tenant={pinteyaPublic} />)
      const styleElement = container.querySelector('#tenant-theme-styles')
      const cssContent = styleElement?.innerHTML || ''

      // Verificar mapeo a blaze-orange
      expect(cssContent).toContain('--blaze-orange-500:')
      expect(cssContent).toContain('--blaze-orange-600:')
      expect(cssContent).toContain('--blaze-orange-700:')
    })

    it('should include theme config variables', () => {
      const { container } = render(<TenantThemeStyles tenant={pinteyaPublic} />)
      const styleElement = container.querySelector('#tenant-theme-styles')
      const cssContent = styleElement?.innerHTML || ''

      expect(cssContent).toContain('--tenant-border-radius: 0.5rem')
      expect(cssContent).toContain('--tenant-font-family:')
      expect(cssContent).toContain('Plus Jakarta Sans')
    })

    it('should generate different CSS for different tenants', () => {
      const { container: container1 } = render(
        <TenantThemeStyles tenant={pinteyaPublic} />
      )
      const { container: container2 } = render(
        <TenantThemeStyles tenant={pintemasPublic} />
      )

      const css1 = container1.querySelector('#tenant-theme-styles')?.innerHTML || ''
      const css2 = container2.querySelector('#tenant-theme-styles')?.innerHTML || ''

      // Deberían ser diferentes
      expect(css1).not.toBe(css2)
      // Pinteya debería tener su color primario
      expect(css1).toContain('#f27a1d')
      // Pintemas debería tener su color primario
      expect(css2).toContain('#0066cc')
    })

    it('should include global styles for header and buttons', () => {
      const { container } = render(<TenantThemeStyles tenant={pinteyaPublic} />)
      const styleElement = container.querySelector('#tenant-theme-styles')
      const cssContent = styleElement?.innerHTML || ''

      // Verificar estilos globales
      expect(cssContent).toContain('header,')
      expect(cssContent).toContain('.header-bg')
      expect(cssContent).toContain('.btn-primary')
      expect(cssContent).toContain('.gradient-bg')
    })
  })

  describe('getTenantThemeCSS', () => {
    it('should generate CSS string with tenant colors', () => {
      const css = getTenantThemeCSS(pinteyaPublic)

      expect(css).toContain(':root')
      expect(css).toContain('--tenant-primary: #f27a1d')
      expect(css).toContain('--tenant-primary-dark: #bd4811')
      expect(css).toContain('--tenant-primary-light: #f9be78')
    })

    it('should include HSL conversion', () => {
      const css = getTenantThemeCSS(pinteyaPublic)

      expect(css).toContain('--tenant-primary-hsl:')
      expect(css).toContain('--primary:')
    })

    it('should generate different CSS for different tenants', () => {
      const css1 = getTenantThemeCSS(pinteyaPublic)
      const css2 = getTenantThemeCSS(pintemasPublic)

      expect(css1).not.toBe(css2)
      expect(css1).toContain('#f27a1d')
      expect(css2).toContain('#0066cc')
    })
  })

  describe('Color Format Validation', () => {
    it('should generate valid HEX color variables', () => {
      const { container } = render(<TenantThemeStyles tenant={pinteyaPublic} />)
      const styleElement = container.querySelector('#tenant-theme-styles')
      const cssContent = styleElement?.innerHTML || ''

      // Verificar formato HEX válido (# seguido de 6 caracteres hex)
      const hexColorRegex = /--tenant-primary: #([0-9A-Fa-f]{6})/
      const match = cssContent.match(hexColorRegex)
      expect(match).toBeTruthy()
      expect(match?.[1]).toBe('f27a1d')
    })

    it('should generate valid HSL color variables', () => {
      const { container } = render(<TenantThemeStyles tenant={pinteyaPublic} />)
      const styleElement = container.querySelector('#tenant-theme-styles')
      const cssContent = styleElement?.innerHTML || ''

      // Verificar formato HSL (número espacio porcentaje espacio porcentaje)
      const hslColorRegex = /--tenant-primary-hsl: (\d+) (\d+)% (\d+)%/
      const match = cssContent.match(hslColorRegex)
      expect(match).toBeTruthy()
      // HSL debería tener valores válidos
      expect(parseInt(match?.[1] || '0')).toBeGreaterThanOrEqual(0)
      expect(parseInt(match?.[1] || '0')).toBeLessThanOrEqual(360)
    })
  })
})
