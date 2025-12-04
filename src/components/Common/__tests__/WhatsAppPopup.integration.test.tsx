/**
 * TESTS DE INTEGRACIÓN - WhatsApp Popup Pintura Flash Days
 * 
 * Tests de integración entre el componente y servicios externos
 */

import React from 'react'
import { render, screen, fireEvent, waitFor, act } from '@testing-library/react'
import '@testing-library/jest-dom'
import WhatsAppPopup from '../WhatsAppPopup'

// ===================================
// MOCKS
// ===================================

const mockTrackEvent = jest.fn()
jest.mock('@/lib/google-analytics', () => ({
  trackEvent: mockTrackEvent,
}))

const mockWindowOpen = jest.fn()

const mockLocalStorage = (() => {
  let store: Record<string, string> = {}
  
  return {
    getItem: (key: string) => store[key] || null,
    setItem: (key: string, value: string) => {
      store[key] = value
    },
    clear: () => {
      store = {}
    },
    removeItem: (key: string) => {
      delete store[key]
    },
  }
})()

// ===================================
// SETUP
// ===================================

beforeAll(() => {
  global.window.open = mockWindowOpen as any
  
  Object.defineProperty(window, 'localStorage', {
    value: mockLocalStorage,
    writable: true,
  })
  
  Object.defineProperty(window, 'innerWidth', {
    writable: true,
    configurable: true,
    value: 1024,
  })
  
  jest.useFakeTimers()
})

afterAll(() => {
  jest.useRealTimers()
})

beforeEach(() => {
  mockLocalStorage.clear()
  mockTrackEvent.mockClear()
  mockWindowOpen.mockClear()
})

// ===================================
// TESTS DE INTEGRACIÓN
// ===================================

describe('WhatsAppPopup - Integración con Google Analytics', () => {
  test('trackea apertura del modal', async () => {
    render(<WhatsAppPopup />)
    
    act(() => {
      jest.advanceTimersByTime(5000)
    })

    await waitFor(() => {
      expect(mockTrackEvent).toHaveBeenCalledWith(
        'flash_days_popup_shown',
        'engagement',
        'timed_popup'
      )
    })
  })

  test('trackea cierre del modal', async () => {
    render(<WhatsAppPopup />)
    
    act(() => {
      jest.advanceTimersByTime(5000)
    })

    await waitFor(() => {
      expect(screen.getByText(/participá por 1 de las/i)).toBeInTheDocument()
    })

    const closeButton = screen.getByLabelText('Cerrar')
    fireEvent.click(closeButton)

    expect(mockTrackEvent).toHaveBeenCalledWith(
      'flash_days_popup_closed',
      'engagement',
      'closed_without_submit'
    )
  })

  test('trackea envío de formulario con número', async () => {
    render(<WhatsAppPopup />)
    
    act(() => {
      jest.advanceTimersByTime(5000)
    })

    await waitFor(() => {
      expect(screen.getByText(/participá por 1 de las/i)).toBeInTheDocument()
    })

    const input = screen.getByPlaceholderText(/ej: 3513411796/i)
    const form = input.closest('form')

    fireEvent.change(input, { target: { value: '3513411796' } })

    if (form) {
      fireEvent.submit(form)
    }

    expect(mockTrackEvent).toHaveBeenCalledWith(
      'flash_days_phone_submitted',
      'conversion',
      '3513411796'
    )

    expect(mockTrackEvent).toHaveBeenCalledWith(
      'flash_days_whatsapp_opened',
      'conversion',
      'redirect'
    )
  })

  test('trackea eventos en el orden correcto', async () => {
    render(<WhatsAppPopup />)
    
    act(() => {
      jest.advanceTimersByTime(5000)
    })

    await waitFor(() => {
      expect(screen.getByText(/participá por 1 de las/i)).toBeInTheDocument()
    })

    const input = screen.getByPlaceholderText(/ej: 3513411796/i)
    const form = input.closest('form')

    fireEvent.change(input, { target: { value: '3513411796' } })

    if (form) {
      fireEvent.submit(form)
    }

    // Verificar orden de eventos
    expect(mockTrackEvent.mock.calls[0][0]).toBe('flash_days_popup_shown')
    expect(mockTrackEvent.mock.calls[1][0]).toBe('flash_days_phone_submitted')
    expect(mockTrackEvent.mock.calls[2][0]).toBe('flash_days_whatsapp_opened')
  })
})

describe('WhatsAppPopup - Integración con localStorage', () => {
  test('persiste el estado de visualización', async () => {
    const { unmount } = render(<WhatsAppPopup />)
    
    act(() => {
      jest.advanceTimersByTime(5000)
    })

    await waitFor(() => {
      expect(screen.getByText(/participá por 1 de las/i)).toBeInTheDocument()
    })

    expect(mockLocalStorage.getItem('pinturaFlashDaysShown')).toBe('true')

    unmount()

    // Renderizar de nuevo
    render(<WhatsAppPopup />)
    
    act(() => {
      jest.advanceTimersByTime(5000)
    })

    // No debe mostrarse de nuevo
    expect(screen.queryByText(/participá por 1 de las/i)).not.toBeInTheDocument()
  })

  test('maneja localStorage no disponible', () => {
    // Simular localStorage no disponible
    const originalLocalStorage = window.localStorage
    Object.defineProperty(window, 'localStorage', {
      value: undefined,
      writable: true,
    })

    // No debe lanzar error
    expect(() => {
      render(<WhatsAppPopup />)
    }).not.toThrow()

    // Restaurar localStorage
    Object.defineProperty(window, 'localStorage', {
      value: originalLocalStorage,
      writable: true,
    })
  })
})

describe('WhatsAppPopup - Integración con window.open (WhatsApp)', () => {
  test('abre WhatsApp en nueva ventana', async () => {
    render(<WhatsAppPopup />)
    
    act(() => {
      jest.advanceTimersByTime(5000)
    })

    await waitFor(() => {
      expect(screen.getByText(/participá por 1 de las/i)).toBeInTheDocument()
    })

    const input = screen.getByPlaceholderText(/ej: 3513411796/i)
    const form = input.closest('form')

    fireEvent.change(input, { target: { value: '3513411796' } })

    if (form) {
      fireEvent.submit(form)
    }

    expect(mockWindowOpen).toHaveBeenCalledWith(
      expect.stringContaining('https://wa.me/5493513411796'),
      '_blank',
      'noopener,noreferrer'
    )
  })

  test('construye URL de WhatsApp con mensaje correcto', async () => {
    render(<WhatsAppPopup />)
    
    act(() => {
      jest.advanceTimersByTime(5000)
    })

    await waitFor(() => {
      expect(screen.getByText(/participá por 1 de las/i)).toBeInTheDocument()
    })

    const input = screen.getByPlaceholderText(/ej: 3513411796/i)
    const form = input.closest('form')

    fireEvent.change(input, { target: { value: '3513411796' } })

    if (form) {
      fireEvent.submit(form)
    }

    const whatsappUrl = mockWindowOpen.mock.calls[0][0]
    
    // Decodificar URL para verificar mensaje
    const decodedUrl = decodeURIComponent(whatsappUrl)
    
    expect(decodedUrl).toContain('3 Gift Cards')
    expect(decodedUrl).toContain('$75.000')
    expect(decodedUrl).toContain('Pintura Flash Days Pinteya')
    expect(decodedUrl).toContain('🎁')
  })

  test('incluye número de WhatsApp correcto en URL', async () => {
    render(<WhatsAppPopup />)
    
    act(() => {
      jest.advanceTimersByTime(5000)
    })

    await waitFor(() => {
      expect(screen.getByText(/participá por 1 de las/i)).toBeInTheDocument()
    })

    const input = screen.getByPlaceholderText(/ej: 3513411796/i)
    const form = input.closest('form')

    fireEvent.change(input, { target: { value: '3513411796' } })

    if (form) {
      fireEvent.submit(form)
    }

    const whatsappUrl = mockWindowOpen.mock.calls[0][0]
    
    // Debe incluir el número de WhatsApp de Pinteya
    expect(whatsappUrl).toContain('wa.me/5493513411796')
  })
})

describe('WhatsAppPopup - Detección de viewport con window.resize', () => {
  test('responde a cambios de viewport', async () => {
    const { rerender } = render(<WhatsAppPopup />)
    
    // Simular cambio de desktop a mobile
    Object.defineProperty(window, 'innerWidth', {
      writable: true,
      configurable: true,
      value: 375,
    })

    act(() => {
      window.dispatchEvent(new Event('resize'))
    })

    rerender(<WhatsAppPopup />)

    act(() => {
      jest.advanceTimersByTime(5000)
    })

    await waitFor(() => {
      expect(screen.getByText(/participá por 1 de las/i)).toBeInTheDocument()
    })

    // Verificar que se muestra diseño mobile
    const modal = screen.getByText(/participá por 1 de las/i).closest('.rounded-3xl')
    expect(modal).toHaveClass('max-w-[500px]')
  })

  test('limpia event listeners al desmontar', () => {
    const removeEventListenerSpy = jest.spyOn(window, 'removeEventListener')

    const { unmount } = render(<WhatsAppPopup />)

    unmount()

    expect(removeEventListenerSpy).toHaveBeenCalledWith('resize', expect.any(Function))

    removeEventListenerSpy.mockRestore()
  })
})

describe('WhatsAppPopup - Flujo completo de integración', () => {
  test('flujo completo: mostrar → interactuar → enviar → cerrar', async () => {
    render(<WhatsAppPopup />)
    
    // 1. Modal aparece después de 5 segundos
    act(() => {
      jest.advanceTimersByTime(5000)
    })

    await waitFor(() => {
      expect(screen.getByText(/participá por 1 de las/i)).toBeInTheDocument()
    })

    expect(mockTrackEvent).toHaveBeenCalledWith(
      'flash_days_popup_shown',
      'engagement',
      'timed_popup'
    )

    expect(mockLocalStorage.getItem('pinturaFlashDaysShown')).toBe('true')

    // 2. Usuario ingresa número
    const input = screen.getByPlaceholderText(/ej: 3513411796/i)
    fireEvent.change(input, { target: { value: '3513411796' } })

    // 3. Usuario envía formulario
    const form = input.closest('form')
    if (form) {
      fireEvent.submit(form)
    }

    // 4. Se trackean eventos
    expect(mockTrackEvent).toHaveBeenCalledWith(
      'flash_days_phone_submitted',
      'conversion',
      '3513411796'
    )

    expect(mockTrackEvent).toHaveBeenCalledWith(
      'flash_days_whatsapp_opened',
      'conversion',
      'redirect'
    )

    // 5. Se abre WhatsApp
    expect(mockWindowOpen).toHaveBeenCalled()

    // 6. Modal se cierra
    await waitFor(() => {
      expect(screen.queryByText(/participá por 1 de las/i)).not.toBeInTheDocument()
    })
  })
})

