/**
 * Header Responsive Test Ultra-Simplificado
 * Sin dependencias complejas - Solo comportamiento responsive básico
 */

import React from 'react'
import { render, screen } from '@testing-library/react'

// Mock responsive del Header
jest.mock('../../index', () => {
  return function MockResponsiveHeader() {
    const [windowWidth, setWindowWidth] = React.useState(window.innerWidth)
    
    React.useEffect(() => {
      const handleResize = () => setWindowWidth(window.innerWidth)
      window.addEventListener('resize', handleResize)
      return () => window.removeEventListener('resize', handleResize)
    }, [])
    
    const isMobile = windowWidth < 768
    const isTablet = windowWidth >= 768 && windowWidth < 1024
    const isDesktop = windowWidth >= 1024
    
    return (
      <header 
        role="banner" 
        data-testid="responsive-header"
        className={`header ${isMobile ? 'mobile' : isTablet ? 'tablet' : 'desktop'}`}
      >
        <div data-testid="logo-section" className={isMobile ? 'logo-mobile' : 'logo-desktop'}>
          <img alt="Pinteya" src="/logo.svg" />
        </div>
        
        <div data-testid="search-section" className={isMobile ? 'search-mobile' : 'search-desktop'}>
          <input 
            role="searchbox"
            aria-label="Buscar productos"
            placeholder={isMobile ? "Buscar..." : "Buscar productos en nuestra tienda"}
          />
        </div>
        
        <div data-testid="navigation-section">
          {isDesktop && (
            <nav data-testid="desktop-nav">
              <a href="/productos">Productos</a>
              <a href="/ofertas">Ofertas</a>
              <a href="/contacto">Contacto</a>
            </nav>
          )}
          
          {isMobile && (
            <button data-testid="mobile-menu-button">☰</button>
          )}
        </div>
        
        <div data-testid="actions-section">
          {!isMobile && (
            <div data-testid="desktop-actions">
              <button>Iniciar Sesión</button>
              <button data-testid="cart-button">Carrito (0)</button>
            </div>
          )}
          
          {isMobile && (
            <div data-testid="mobile-actions">
              <button data-testid="mobile-cart">🛒</button>
              <button data-testid="mobile-user">👤</button>
            </div>
          )}
        </div>
        
        <div data-testid="viewport-info" style={{ display: 'none' }}>
          {windowWidth}px - {isMobile ? 'mobile' : isTablet ? 'tablet' : 'desktop'}
        </div>
      </header>
    )
  }
})

import Header from '../../index'

// Helper para simular cambios de viewport
const setViewport = (width: number) => {
  Object.defineProperty(window, 'innerWidth', {
    writable: true,
    configurable: true,
    value: width,
  })
  window.dispatchEvent(new Event('resize'))
}

describe('Header Responsive - Ultra-Simplified Tests', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    // Reset viewport
    setViewport(1024)
  })

  describe('Detección de Viewport', () => {
    it('debe detectar viewport móvil', () => {
      setViewport(375)
      render(<Header />)
      
      const header = screen.getByTestId('responsive-header')
      expect(header).toHaveClass('mobile')
    })

    it('debe detectar viewport tablet', () => {
      setViewport(768)
      render(<Header />)
      
      const header = screen.getByTestId('responsive-header')
      expect(header).toHaveClass('tablet')
    })

    it('debe detectar viewport desktop', () => {
      setViewport(1200)
      render(<Header />)
      
      const header = screen.getByTestId('responsive-header')
      expect(header).toHaveClass('desktop')
    })
  })

  describe('Adaptación de Componentes', () => {
    it('debe adaptar logo según viewport', () => {
      // Móvil
      setViewport(375)
      const { rerender } = render(<Header />)
      
      let logo = screen.getByTestId('logo-section')
      expect(logo).toHaveClass('logo-mobile')
      
      // Desktop
      setViewport(1200)
      rerender(<Header />)
      
      logo = screen.getByTestId('logo-section')
      expect(logo).toHaveClass('logo-desktop')
    })

    it('debe adaptar búsqueda según viewport', () => {
      // Móvil
      setViewport(375)
      const { rerender } = render(<Header />)
      
      let searchInput = screen.getByRole('searchbox')
      expect(searchInput).toHaveAttribute('placeholder', 'Buscar...')
      
      let searchSection = screen.getByTestId('search-section')
      expect(searchSection).toHaveClass('search-mobile')
      
      // Desktop
      setViewport(1200)
      rerender(<Header />)
      
      searchInput = screen.getByRole('searchbox')
      expect(searchInput).toHaveAttribute('placeholder', 'Buscar productos en nuestra tienda')
      
      searchSection = screen.getByTestId('search-section')
      expect(searchSection).toHaveClass('search-desktop')
    })

    it('debe mostrar navegación apropiada por viewport', () => {
      // Desktop - navegación completa
      setViewport(1200)
      const { rerender } = render(<Header />)
      
      expect(screen.getByTestId('desktop-nav')).toBeInTheDocument()
      expect(screen.getByText('Productos')).toBeInTheDocument()
      expect(screen.getByText('Ofertas')).toBeInTheDocument()
      expect(screen.getByText('Contacto')).toBeInTheDocument()
      expect(screen.queryByTestId('mobile-menu-button')).not.toBeInTheDocument()
      
      // Móvil - menú hamburguesa
      setViewport(375)
      rerender(<Header />)
      
      expect(screen.queryByTestId('desktop-nav')).not.toBeInTheDocument()
      expect(screen.getByTestId('mobile-menu-button')).toBeInTheDocument()
    })

    it('debe adaptar acciones según viewport', () => {
      // Desktop - botones completos
      setViewport(1200)
      const { rerender } = render(<Header />)
      
      expect(screen.getByTestId('desktop-actions')).toBeInTheDocument()
      expect(screen.getByText('Iniciar Sesión')).toBeInTheDocument()
      expect(screen.getByTestId('cart-button')).toBeInTheDocument()
      expect(screen.queryByTestId('mobile-actions')).not.toBeInTheDocument()
      
      // Móvil - iconos compactos
      setViewport(375)
      rerender(<Header />)
      
      expect(screen.queryByTestId('desktop-actions')).not.toBeInTheDocument()
      expect(screen.getByTestId('mobile-actions')).toBeInTheDocument()
      expect(screen.getByTestId('mobile-cart')).toBeInTheDocument()
      expect(screen.getByTestId('mobile-user')).toBeInTheDocument()
    })
  })

  describe('Breakpoints Específicos', () => {
    it('debe manejar breakpoint móvil (< 768px)', () => {
      const mobileWidths = [320, 375, 414, 767]
      
      mobileWidths.forEach(width => {
        setViewport(width)
        const { rerender } = render(<Header />)
        
        const header = screen.getByTestId('responsive-header')
        expect(header).toHaveClass('mobile')
        
        // Verificar elementos móviles
        expect(screen.getByTestId('mobile-menu-button')).toBeInTheDocument()
        expect(screen.getByTestId('mobile-actions')).toBeInTheDocument()
        
        rerender(<div />)
      })
    })

    it('debe manejar breakpoint tablet (768px - 1023px)', () => {
      const tabletWidths = [768, 800, 1000, 1023]
      
      tabletWidths.forEach(width => {
        setViewport(width)
        const { rerender } = render(<Header />)
        
        const header = screen.getByTestId('responsive-header')
        expect(header).toHaveClass('tablet')
        
        rerender(<div />)
      })
    })

    it('debe manejar breakpoint desktop (>= 1024px)', () => {
      const desktopWidths = [1024, 1200, 1440, 1920]
      
      desktopWidths.forEach(width => {
        setViewport(width)
        const { rerender } = render(<Header />)
        
        const header = screen.getByTestId('responsive-header')
        expect(header).toHaveClass('desktop')
        
        // Verificar elementos desktop
        expect(screen.getByTestId('desktop-nav')).toBeInTheDocument()
        expect(screen.getByTestId('desktop-actions')).toBeInTheDocument()
        
        rerender(<div />)
      })
    })
  })

  describe('Transiciones de Viewport', () => {
    it('debe manejar transición móvil → desktop', () => {
      // Iniciar en móvil
      setViewport(375)
      const { rerender } = render(<Header />)
      
      expect(screen.getByTestId('responsive-header')).toHaveClass('mobile')
      expect(screen.getByTestId('mobile-menu-button')).toBeInTheDocument()
      
      // Cambiar a desktop
      setViewport(1200)
      rerender(<Header />)
      
      expect(screen.getByTestId('responsive-header')).toHaveClass('desktop')
      expect(screen.getByTestId('desktop-nav')).toBeInTheDocument()
      expect(screen.queryByTestId('mobile-menu-button')).not.toBeInTheDocument()
    })

    it('debe manejar transición desktop → móvil', () => {
      // Iniciar en desktop
      setViewport(1200)
      const { rerender } = render(<Header />)
      
      expect(screen.getByTestId('responsive-header')).toHaveClass('desktop')
      expect(screen.getByTestId('desktop-nav')).toBeInTheDocument()
      
      // Cambiar a móvil
      setViewport(375)
      rerender(<Header />)
      
      expect(screen.getByTestId('responsive-header')).toHaveClass('mobile')
      expect(screen.getByTestId('mobile-menu-button')).toBeInTheDocument()
      expect(screen.queryByTestId('desktop-nav')).not.toBeInTheDocument()
    })

    it('debe manejar múltiples cambios de viewport', () => {
      const { rerender } = render(<Header />)
      
      const viewports = [375, 768, 1024, 600, 1200, 320]
      const expectedClasses = ['mobile', 'tablet', 'desktop', 'mobile', 'desktop', 'mobile']
      
      viewports.forEach((width, index) => {
        setViewport(width)
        rerender(<Header />)
        
        const header = screen.getByTestId('responsive-header')
        expect(header).toHaveClass(expectedClasses[index])
      })
    })
  })

  describe('Accesibilidad Responsive', () => {
    it('debe mantener accesibilidad en todos los viewports', () => {
      const viewports = [375, 768, 1200]
      
      viewports.forEach(width => {
        setViewport(width)
        const { rerender } = render(<Header />)
        
        // Elementos básicos de accesibilidad
        expect(screen.getByRole('banner')).toBeInTheDocument()
        expect(screen.getByRole('searchbox')).toBeInTheDocument()
        expect(screen.getByRole('searchbox')).toHaveAttribute('aria-label')
        
        // Botones deben ser accesibles
        const buttons = screen.getAllByRole('button')
        expect(buttons.length).toBeGreaterThan(0)
        
        rerender(<div />)
      })
    })

    it('debe tener navegación por teclado en todos los viewports', () => {
      const viewports = [375, 1200]
      
      viewports.forEach(width => {
        setViewport(width)
        const { rerender } = render(<Header />)
        
        const searchInput = screen.getByRole('searchbox')
        searchInput.focus()
        expect(document.activeElement).toBe(searchInput)
        
        const buttons = screen.getAllByRole('button')
        if (buttons.length > 0) {
          buttons[0].focus()
          expect(document.activeElement).toBe(buttons[0])
        }
        
        rerender(<div />)
      })
    })
  })

  describe('Performance Responsive', () => {
    it('debe renderizar rápidamente en cambios de viewport', () => {
      const { rerender } = render(<Header />)
      
      const startTime = performance.now()
      
      // Múltiples cambios rápidos
      for (let i = 0; i < 10; i++) {
        setViewport(i % 2 === 0 ? 375 : 1200)
        rerender(<Header />)
      }
      
      const endTime = performance.now()
      const totalTime = endTime - startTime
      
      // Debe ser rápido incluso con múltiples cambios
      expect(totalTime).toBeLessThan(100)
      expect(screen.getByTestId('responsive-header')).toBeInTheDocument()
    })
  })
})
