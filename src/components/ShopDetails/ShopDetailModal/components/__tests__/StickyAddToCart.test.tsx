/**
 * Tests para StickyAddToCart
 * Verifica: móvil/desktop, z-index, padding, funcionalidad
 */

import React from 'react'
import { render, screen } from '@testing-library/react'
import { StickyAddToCart } from '../StickyAddToCart'
import { useIsMobile } from '@/hooks/use-mobile'

// Mock del hook useIsMobile
jest.mock('@/hooks/use-mobile', () => ({
  useIsMobile: jest.fn(),
}))

const mockUseIsMobile = useIsMobile as jest.MockedFunction<typeof useIsMobile>

describe('StickyAddToCart', () => {
  const mockOnAddToCart = jest.fn()

  beforeEach(() => {
    jest.clearAllMocks()
  })

  describe('Visibilidad en móvil/desktop', () => {
    it('debe renderizar en móvil (< 768px)', () => {
      mockUseIsMobile.mockReturnValue(true)

      render(
        <StickyAddToCart
          price={1000}
          onAddToCart={mockOnAddToCart}
        />
      )

      expect(screen.getByText('Agregar al Carrito')).toBeInTheDocument()
    })

    it('NO debe renderizar en desktop (>= 768px)', () => {
      mockUseIsMobile.mockReturnValue(false)

      const { container } = render(
        <StickyAddToCart
          price={1000}
          onAddToCart={mockOnAddToCart}
        />
      )

      expect(container.firstChild).toBeNull()
    })
  })

  describe('Z-index y estilos', () => {
    it('debe tener z-50 para estar sobre bottom nav', () => {
      mockUseIsMobile.mockReturnValue(true)

      const { container } = render(
        <StickyAddToCart
          price={1000}
          onAddToCart={mockOnAddToCart}
        />
      )

      const stickyElement = container.firstChild as HTMLElement
      expect(stickyElement).toHaveClass('z-50')
    })

    it('debe tener position fixed', () => {
      mockUseIsMobile.mockReturnValue(true)

      const { container } = render(
        <StickyAddToCart
          price={1000}
          onAddToCart={mockOnAddToCart}
        />
      )

      const stickyElement = container.firstChild as HTMLElement
      expect(stickyElement).toHaveClass('fixed')
    })

    it('debe estar oculto en desktop con md:hidden', () => {
      mockUseIsMobile.mockReturnValue(true)

      const { container } = render(
        <StickyAddToCart
          price={1000}
          onAddToCart={mockOnAddToCart}
        />
      )

      const stickyElement = container.firstChild as HTMLElement
      expect(stickyElement).toHaveClass('md:hidden')
    })
  })

  describe('Funcionalidad', () => {
    it('debe mostrar el precio formateado correctamente', () => {
      mockUseIsMobile.mockReturnValue(true)

      render(
        <StickyAddToCart
          price={13621.30}
          onAddToCart={mockOnAddToCart}
        />
      )

      // El precio debe estar formateado
      expect(screen.getByText(/13.621/)).toBeInTheDocument()
    })

    it('debe llamar onAddToCart al hacer click', () => {
      mockUseIsMobile.mockReturnValue(true)

      render(
        <StickyAddToCart
          price={1000}
          onAddToCart={mockOnAddToCart}
        />
      )

      const button = screen.getByText('Agregar al Carrito')
      button.click()

      expect(mockOnAddToCart).toHaveBeenCalledTimes(1)
    })

    it('debe estar deshabilitado cuando disabled es true', () => {
      mockUseIsMobile.mockReturnValue(true)

      render(
        <StickyAddToCart
          price={1000}
          onAddToCart={mockOnAddToCart}
          disabled={true}
        />
      )

      const button = screen.getByText('Agregar al Carrito')
      expect(button).toBeDisabled()
    })

    it('debe mostrar estado de loading cuando isLoading es true', () => {
      mockUseIsMobile.mockReturnValue(true)

      render(
        <StickyAddToCart
          price={1000}
          onAddToCart={mockOnAddToCart}
          isLoading={true}
        />
      )

      expect(screen.getByText('Agregando...')).toBeInTheDocument()
    })
  })

  describe('Accesibilidad', () => {
    it('debe tener aria-label descriptivo', () => {
      mockUseIsMobile.mockReturnValue(true)

      const { container } = render(
        <StickyAddToCart
          price={1000}
          onAddToCart={mockOnAddToCart}
        />
      )

      const region = container.querySelector('[role="region"]')
      expect(region).toHaveAttribute('aria-label', 'Agregar producto al carrito')
    })

    it('debe tener aria-label en el botón', () => {
      mockUseIsMobile.mockReturnValue(true)

      render(
        <StickyAddToCart
          price={1000}
          onAddToCart={mockOnAddToCart}
        />
      )

      const button = screen.getByLabelText('Agregar al carrito')
      expect(button).toBeInTheDocument()
    })
  })
})

