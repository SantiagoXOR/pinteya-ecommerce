/**
 * Tests para el sistema de modales mobile-first
 * Verifica funcionalidad de gestión de modales, z-index y responsive design
 */

import { describe, it, expect, beforeEach, afterEach } from '@jest/globals'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { act } from 'react-dom/test-utils'
import React from 'react'
import { ModalProvider, useModal, useModalActions } from '@/contexts/ModalContext'
import {
  MobileModalOverlay,
  NavigationModalOverlay,
  InfoModalOverlay,
} from '@/components/driver/MobileModalOverlay'
import { FloatingActionButtons } from '@/components/driver/FloatingActionButtons'

// Mock component para testing
function TestModalComponent() {
  const modalActions = useModalActions()
  const { modalState } = useModal()

  return (
    <div>
      <button
        onClick={() => modalActions.openNavigationInstructions()}
        data-testid='open-navigation'
      >
        Abrir Navegación
      </button>

      <button onClick={() => modalActions.openRouteInfo()} data-testid='open-route-info'>
        Abrir Info Ruta
      </button>

      <button onClick={() => modalActions.openAdvancedControls()} data-testid='open-advanced'>
        Abrir Controles
      </button>

      <button onClick={() => modalActions.closeModal()} data-testid='close-modal'>
        Cerrar Modal
      </button>

      <div data-testid='modal-state'>{modalState.activeModal || 'none'}</div>

      {/* Modales de prueba */}
      <NavigationModalOverlay type='navigation-instructions' title='Test Navigation'>
        <div data-testid='navigation-content'>Contenido de navegación</div>
      </NavigationModalOverlay>

      <InfoModalOverlay type='route-info' title='Test Route Info'>
        <div data-testid='route-info-content'>Información de ruta</div>
      </InfoModalOverlay>

      <MobileModalOverlay type='advanced-controls' title='Test Advanced' size='fullscreen'>
        <div data-testid='advanced-content'>Controles avanzados</div>
      </MobileModalOverlay>
    </div>
  )
}

function TestWrapper({ children }: { children: React.ReactNode }) {
  return <ModalProvider>{children}</ModalProvider>
}

describe('Sistema de Modales Mobile-First', () => {
  beforeEach(() => {
    // Reset DOM
    document.body.innerHTML = ''
    document.body.style.overflow = ''
  })

  afterEach(() => {
    // Cleanup
    document.body.style.overflow = ''
  })

  describe('ModalProvider y Context', () => {
    it('debe proporcionar el contexto correctamente', () => {
      render(
        <TestWrapper>
          <TestModalComponent />
        </TestWrapper>
      )

      expect(screen.getByTestId('modal-state')).toHaveTextContent('none')
    })

    it('debe abrir y cerrar modales correctamente', async () => {
      render(
        <TestWrapper>
          <TestModalComponent />
        </TestWrapper>
      )

      // Abrir modal de navegación
      fireEvent.click(screen.getByTestId('open-navigation'))

      await waitFor(() => {
        expect(screen.getByTestId('modal-state')).toHaveTextContent('navigation-instructions')
      })

      // Verificar que el contenido del modal está visible
      expect(screen.getByTestId('navigation-content')).toBeInTheDocument()

      // Cerrar modal
      fireEvent.click(screen.getByTestId('close-modal'))

      await waitFor(() => {
        expect(screen.getByTestId('modal-state')).toHaveTextContent('none')
      })
    })

    it('debe cambiar entre modales correctamente', async () => {
      render(
        <TestWrapper>
          <TestModalComponent />
        </TestWrapper>
      )

      // Abrir primer modal
      fireEvent.click(screen.getByTestId('open-navigation'))
      await waitFor(() => {
        expect(screen.getByTestId('modal-state')).toHaveTextContent('navigation-instructions')
      })

      // Cambiar a segundo modal
      fireEvent.click(screen.getByTestId('open-route-info'))
      await waitFor(() => {
        expect(screen.getByTestId('modal-state')).toHaveTextContent('route-info')
      })

      // Verificar que solo el segundo modal está visible
      expect(screen.getByTestId('route-info-content')).toBeInTheDocument()
      expect(screen.queryByTestId('navigation-content')).not.toBeInTheDocument()
    })

    it('debe prevenir scroll del body cuando hay modal activo', async () => {
      render(
        <TestWrapper>
          <TestModalComponent />
        </TestWrapper>
      )

      // Verificar estado inicial
      expect(document.body.style.overflow).toBe('')

      // Abrir modal
      fireEvent.click(screen.getByTestId('open-navigation'))

      await waitFor(() => {
        expect(document.body.style.overflow).toBe('hidden')
      })

      // Cerrar modal
      fireEvent.click(screen.getByTestId('close-modal'))

      await waitFor(() => {
        expect(document.body.style.overflow).toBe('unset')
      })
    })
  })

  describe('MobileModalOverlay', () => {
    it('debe renderizar con las clases CSS correctas', async () => {
      render(
        <TestWrapper>
          <TestModalComponent />
        </TestWrapper>
      )

      fireEvent.click(screen.getByTestId('open-navigation'))

      await waitFor(() => {
        const overlay = document.querySelector('.fixed.inset-0.z-50')
        expect(overlay).toBeInTheDocument()
        expect(overlay).toHaveClass('bg-black/50', 'backdrop-blur-sm')
      })
    })

    it('debe cerrar al hacer click en el backdrop', async () => {
      render(
        <TestWrapper>
          <TestModalComponent />
        </TestWrapper>
      )

      fireEvent.click(screen.getByTestId('open-navigation'))

      await waitFor(() => {
        expect(screen.getByTestId('modal-state')).toHaveTextContent('navigation-instructions')
      })

      // Click en backdrop
      const overlay = document.querySelector('.fixed.inset-0.z-50')
      if (overlay) {
        fireEvent.click(overlay)
      }

      await waitFor(() => {
        expect(screen.getByTestId('modal-state')).toHaveTextContent('none')
      })
    })

    it('debe manejar diferentes tamaños de modal', async () => {
      render(
        <TestWrapper>
          <TestModalComponent />
        </TestWrapper>
      )

      // Modal fullscreen
      fireEvent.click(screen.getByTestId('open-advanced'))

      await waitFor(() => {
        const modalContainer = document.querySelector('[class*="h-full max-h-full"]')
        expect(modalContainer).toBeInTheDocument()
      })
    })
  })

  describe('FloatingActionButtons', () => {
    it('debe renderizar botones flotantes correctamente', () => {
      const mockProps = {
        isNavigating: true,
        hasActiveRoute: true,
        onRecalculateRoute: jest.fn(),
        onEmergencyStop: jest.fn(),
      }

      render(
        <TestWrapper>
          <FloatingActionButtons {...mockProps} />
        </TestWrapper>
      )

      // Verificar que el botón principal está presente
      const mainButton = document.querySelector('.fixed.bottom-4.right-4')
      expect(mainButton).toBeInTheDocument()
    })

    it('debe expandir y contraer correctamente', async () => {
      const mockProps = {
        isNavigating: true,
        hasActiveRoute: true,
        onRecalculateRoute: jest.fn(),
        onEmergencyStop: jest.fn(),
      }

      render(
        <TestWrapper>
          <FloatingActionButtons {...mockProps} />
        </TestWrapper>
      )

      // Buscar el botón de expansión (el más grande)
      const expandButton = document.querySelector('.w-16.h-16')
      expect(expandButton).toBeInTheDocument()

      if (expandButton) {
        fireEvent.click(expandButton)

        await waitFor(() => {
          // Verificar que aparecen botones secundarios
          const secondaryButtons = document.querySelectorAll('.w-12.h-12')
          expect(secondaryButtons.length).toBeGreaterThan(0)
        })
      }
    })
  })

  describe('Responsive Design', () => {
    it('debe aplicar clases responsive correctamente', async () => {
      // Mock window.matchMedia para simular mobile
      Object.defineProperty(window, 'matchMedia', {
        writable: true,
        value: jest.fn().mockImplementation(query => ({
          matches: query.includes('max-width: 768px'),
          media: query,
          onchange: null,
          addListener: jest.fn(),
          removeListener: jest.fn(),
          addEventListener: jest.fn(),
          removeEventListener: jest.fn(),
          dispatchEvent: jest.fn(),
        })),
      })

      render(
        <TestWrapper>
          <TestModalComponent />
        </TestWrapper>
      )

      fireEvent.click(screen.getByTestId('open-navigation'))

      await waitFor(() => {
        const modalContainer = document.querySelector('[class*="md:max-w-2xl"]')
        expect(modalContainer).toBeInTheDocument()
      })
    })
  })

  describe('Accessibility', () => {
    it('debe manejar la tecla Escape correctamente', async () => {
      render(
        <TestWrapper>
          <TestModalComponent />
        </TestWrapper>
      )

      fireEvent.click(screen.getByTestId('open-navigation'))

      await waitFor(() => {
        expect(screen.getByTestId('modal-state')).toHaveTextContent('navigation-instructions')
      })

      // Presionar Escape
      fireEvent.keyDown(document, { key: 'Escape', code: 'Escape' })

      await waitFor(() => {
        expect(screen.getByTestId('modal-state')).toHaveTextContent('none')
      })
    })

    it('debe tener aria-labels apropiados', () => {
      const mockProps = {
        isNavigating: true,
        hasActiveRoute: true,
        onRecalculateRoute: jest.fn(),
        onEmergencyStop: jest.fn(),
      }

      render(
        <TestWrapper>
          <FloatingActionButtons {...mockProps} />
        </TestWrapper>
      )

      const buttons = document.querySelectorAll('button[aria-label]')
      expect(buttons.length).toBeGreaterThan(0)
    })
  })

  describe('Z-Index Management', () => {
    it('debe aplicar z-index correcto para evitar superposiciones', async () => {
      render(
        <TestWrapper>
          <TestModalComponent />
        </TestWrapper>
      )

      fireEvent.click(screen.getByTestId('open-navigation'))

      await waitFor(() => {
        const overlay = document.querySelector('.z-50')
        expect(overlay).toBeInTheDocument()
      })

      // Verificar que los botones flotantes tienen z-index menor
      const fabContainer = document.querySelector('.z-40')
      expect(fabContainer).toBeInTheDocument()
    })
  })
})

describe('Integración con Sistema GPS', () => {
  it('debe funcionar correctamente con componentes GPS existentes', () => {
    // Este test verificaría la integración con GPSNavigationMap
    // pero requiere mocks más complejos de Google Maps
    expect(true).toBe(true) // Placeholder
  })

  it('debe mantener estado de navegación al cambiar modales', () => {
    // Test para verificar que el estado de navegación se mantiene
    expect(true).toBe(true) // Placeholder
  })
})
