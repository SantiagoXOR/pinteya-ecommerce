/**
 * TESTS UNITARIOS - WhatsApp Popup Pintura Flash Days
 * 
 * Suite completa de tests para el modal de Pintura Flash Days
 * que captura números de WhatsApp para el sorteo de gift cards
 */

import React from 'react'
import { render, screen, fireEvent, waitFor, act } from '@testing-library/react'
import '@testing-library/jest-dom'
import WhatsAppPopup from '../WhatsAppPopup'

// ===================================
// MOCKS
// ===================================

// Mock de Google Analytics
const mockTrackEvent = jest.fn()
jest.mock('@/lib/google-analytics', () => ({
  trackEvent: mockTrackEvent,
}))

// Mock de window.open
const mockWindowOpen = jest.fn()

// Mock de localStorage
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
  // Mock window.open
  global.window.open = mockWindowOpen as any
  
  // Mock localStorage
  Object.defineProperty(window, 'localStorage', {
    value: mockLocalStorage,
    writable: true,
  })
  
  // Mock window.innerWidth para tests responsive
  Object.defineProperty(window, 'innerWidth', {
    writable: true,
    configurable: true,
    value: 1024,
  })
  
  // Habilitar fake timers
  jest.useFakeTimers()
})

afterAll(() => {
  jest.useRealTimers()
})

beforeEach(() => {
  mockLocalStorage.clear()
  mockTrackEvent.mockClear()
  mockWindowOpen.mockClear()
  
  // Reset innerWidth a desktop por defecto
  Object.defineProperty(window, 'innerWidth', {
    writable: true,
    configurable: true,
    value: 1024,
  })
})

// ===================================
// A. TESTS DE RENDERIZADO Y VISIBILIDAD
// ===================================

describe('WhatsAppPopup - Renderizado y Visibilidad', () => {
  test('no se muestra inmediatamente al montar', () => {
    render(<WhatsAppPopup />)
    
    // El modal no debe estar visible
    expect(screen.queryByText(/participá por 1 de las/i)).not.toBeInTheDocument()
  })

  test('se muestra después de 5 segundos', async () => {
    render(<WhatsAppPopup />)
    
    // Avanzar 5 segundos
    act(() => {
      jest.advanceTimersByTime(5000)
    })

    // El modal debe estar visible
    await waitFor(() => {
      expect(screen.getByText(/participá por 1 de las/i)).toBeInTheDocument()
    })
  })

  test('no se muestra si ya fue visto (localStorage)', () => {
    mockLocalStorage.setItem('pinturaFlashDaysShown', 'true')
    
    render(<WhatsAppPopup />)
    
    act(() => {
      jest.advanceTimersByTime(5000)
    })

    // El modal NO debe estar visible
    expect(screen.queryByText(/participá por 1 de las/i)).not.toBeInTheDocument()
  })

  test('se puede cerrar con el botón X', async () => {
    render(<WhatsAppPopup />)
    
    act(() => {
      jest.advanceTimersByTime(5000)
    })

    await waitFor(() => {
      expect(screen.getByText(/participá por 1 de las/i)).toBeInTheDocument()
    })

    // Click en el botón cerrar
    const closeButton = screen.getByLabelText('Cerrar')
    fireEvent.click(closeButton)

    // El modal debe cerrarse
    await waitFor(() => {
      expect(screen.queryByText(/participá por 1 de las/i)).not.toBeInTheDocument()
    })

    // Debe trackear el evento de cierre
    expect(mockTrackEvent).toHaveBeenCalledWith(
      'flash_days_popup_closed',
      'engagement',
      'closed_without_submit'
    )
  })

  test('se cierra al hacer clic en el backdrop', async () => {
    render(<WhatsAppPopup />)
    
    act(() => {
      jest.advanceTimersByTime(5000)
    })

    await waitFor(() => {
      expect(screen.getByText(/participá por 1 de las/i)).toBeInTheDocument()
    })

    // Click en el backdrop (el div fixed con z-[9999])
    const backdrop = screen.getByText(/participá por 1 de las/i).closest('.fixed')
    if (backdrop) {
      fireEvent.click(backdrop)
    }

    // El modal debe cerrarse
    await waitFor(() => {
      expect(screen.queryByText(/participá por 1 de las/i)).not.toBeInTheDocument()
    })
  })
})

// ===================================
// B. TESTS DE DISEÑO RESPONSIVE
// ===================================

describe('WhatsAppPopup - Diseño Responsive', () => {
  test('muestra diseño mobile en viewports < 768px', async () => {
    // Simular viewport mobile
    Object.defineProperty(window, 'innerWidth', {
      writable: true,
      configurable: true,
      value: 375,
    })

    render(<WhatsAppPopup />)
    
    act(() => {
      jest.advanceTimersByTime(5000)
    })

    await waitFor(() => {
      expect(screen.getByText(/participá por 1 de las/i)).toBeInTheDocument()
    })

    // En mobile, debe mostrar el diseño vertical
    const modal = screen.getByText(/participá por 1 de las/i).closest('.rounded-3xl')
    expect(modal).toHaveClass('max-w-[500px]')
  })

  test('muestra diseño desktop en viewports >= 768px', async () => {
    // Simular viewport desktop
    Object.defineProperty(window, 'innerWidth', {
      writable: true,
      configurable: true,
      value: 1024,
    })

    render(<WhatsAppPopup />)
    
    act(() => {
      jest.advanceTimersByTime(5000)
    })

    await waitFor(() => {
      expect(screen.getByText(/participá por 1 de las/i)).toBeInTheDocument()
    })

    // En desktop, debe mostrar el diseño de 2 columnas
    const modal = screen.getByText(/participá por 1 de las/i).closest('.rounded-3xl')
    expect(modal).toHaveClass('max-w-[900px]')
  })

  test('detecta cambios de viewport (resize)', async () => {
    render(<WhatsAppPopup />)
    
    // Cambiar de desktop a mobile
    Object.defineProperty(window, 'innerWidth', {
      writable: true,
      configurable: true,
      value: 375,
    })

    // Disparar evento resize
    act(() => {
      window.dispatchEvent(new Event('resize'))
    })

    act(() => {
      jest.advanceTimersByTime(5000)
    })

    await waitFor(() => {
      expect(screen.getByText(/participá por 1 de las/i)).toBeInTheDocument()
    })
  })
})

// ===================================
// C. TESTS DE ELEMENTOS VISUALES
// ===================================

describe('WhatsAppPopup - Elementos Visuales', () => {
  beforeEach(async () => {
    render(<WhatsAppPopup />)
    
    act(() => {
      jest.advanceTimersByTime(5000)
    })

    await waitFor(() => {
      expect(screen.getByText(/participá por 1 de las/i)).toBeInTheDocument()
    })
  })

  test('muestra badge "PINTURA FLASH DAYS"', () => {
    expect(screen.getByText('PINTURA FLASH DAYS')).toBeInTheDocument()
  })

  test('muestra el monto correcto ($75.000)', () => {
    expect(screen.getByText(/\$75\.000/)).toBeInTheDocument()
  })

  test('muestra cantidad de premios (3)', () => {
    expect(screen.getByText(/3 GIFT CARDS/i)).toBeInTheDocument()
  })

  test('muestra texto "GIFT CARD"', () => {
    expect(screen.getByText('GIFT CARD')).toBeInTheDocument()
  })

  test('muestra fechas del sorteo', () => {
    expect(screen.getByText(/3 de noviembre/i)).toBeInTheDocument()
    expect(screen.getByText(/5 de noviembre/i)).toBeInTheDocument()
  })

  test('muestra feature "Sin obligación de compra"', () => {
    expect(screen.getByText(/sin obligación de compra/i)).toBeInTheDocument()
  })
})

// ===================================
// D. TESTS DE VALIDACIÓN DE INPUT
// ===================================

describe('WhatsAppPopup - Validación de Input', () => {
  beforeEach(async () => {
    render(<WhatsAppPopup />)
    
    act(() => {
      jest.advanceTimersByTime(5000)
    })

    await waitFor(() => {
      expect(screen.getByText(/participá por 1 de las/i)).toBeInTheDocument()
    })
  })

  test('acepta solo números', () => {
    const input = screen.getByPlaceholderText(/ej: 3513411796/i) as HTMLInputElement

    fireEvent.change(input, { target: { value: 'abc123def456' } })

    // Solo los números deben quedar
    expect(input.value).toBe('123456')
  })

  test('remueve el 0 inicial', () => {
    const input = screen.getByPlaceholderText(/ej: 3513411796/i) as HTMLInputElement

    fireEvent.change(input, { target: { value: '03513411796' } })

    // El 0 inicial debe ser removido
    expect(input.value).toBe('3513411796')
  })

  test('remueve el 15 inicial', () => {
    const input = screen.getByPlaceholderText(/ej: 3513411796/i) as HTMLInputElement

    fireEvent.change(input, { target: { value: '153513411796' } })

    // El 15 inicial debe ser removido
    expect(input.value).toBe('3513411796')
  })

  test('limita a 10 dígitos', () => {
    const input = screen.getByPlaceholderText(/ej: 3513411796/i) as HTMLInputElement

    fireEvent.change(input, { target: { value: '12345678901234567890' } })

    // Solo debe permitir 10 dígitos
    expect(input.value).toBe('1234567890')
  })

  test('valida longitud mínima (8 dígitos)', () => {
    const input = screen.getByPlaceholderText(/ej: 3513411796/i) as HTMLInputElement
    const form = input.closest('form')

    // Ingresar menos de 8 dígitos
    fireEvent.change(input, { target: { value: '1234567' } })

    // Intentar enviar
    if (form) {
      fireEvent.submit(form)
    }

    // Debe mostrar alerta
    expect(mockWindowOpen).not.toHaveBeenCalled()
  })

  test('acepta longitud válida (8-10 dígitos)', () => {
    const input = screen.getByPlaceholderText(/ej: 3513411796/i) as HTMLInputElement
    const form = input.closest('form')

    // Ingresar 10 dígitos válidos
    fireEvent.change(input, { target: { value: '3513411796' } })

    // Intentar enviar
    if (form) {
      fireEvent.submit(form)
    }

    // Debe abrir WhatsApp
    expect(mockWindowOpen).toHaveBeenCalled()
  })
})

// ===================================
// E. TESTS DE ENVÍO DEL FORMULARIO
// ===================================

describe('WhatsAppPopup - Envío del Formulario', () => {
  beforeEach(async () => {
    render(<WhatsAppPopup />)
    
    act(() => {
      jest.advanceTimersByTime(5000)
    })

    await waitFor(() => {
      expect(screen.getByText(/participá por 1 de las/i)).toBeInTheDocument()
    })
  })

  test('no se envía con número inválido', () => {
    const input = screen.getByPlaceholderText(/ej: 3513411796/i) as HTMLInputElement
    const form = input.closest('form')

    fireEvent.change(input, { target: { value: '123' } })

    if (form) {
      fireEvent.submit(form)
    }

    expect(mockWindowOpen).not.toHaveBeenCalled()
  })

  test('abre WhatsApp con número válido', () => {
    const input = screen.getByPlaceholderText(/ej: 3513411796/i) as HTMLInputElement
    const form = input.closest('form')

    fireEvent.change(input, { target: { value: '3513411796' } })

    if (form) {
      fireEvent.submit(form)
    }

    expect(mockWindowOpen).toHaveBeenCalled()
  })

  test('construye URL correcta de WhatsApp', () => {
    const input = screen.getByPlaceholderText(/ej: 3513411796/i) as HTMLInputElement
    const form = input.closest('form')

    fireEvent.change(input, { target: { value: '3513411796' } })

    if (form) {
      fireEvent.submit(form)
    }

    const whatsappUrl = mockWindowOpen.mock.calls[0][0]
    expect(whatsappUrl).toContain('https://wa.me/5493513411796')
  })

  test('incluye mensaje de Pintura Flash Days', () => {
    const input = screen.getByPlaceholderText(/ej: 3513411796/i) as HTMLInputElement
    const form = input.closest('form')

    fireEvent.change(input, { target: { value: '3513411796' } })

    if (form) {
      fireEvent.submit(form)
    }

    const whatsappUrl = mockWindowOpen.mock.calls[0][0]
    expect(whatsappUrl).toContain('Gift%20Cards')
    expect(whatsappUrl).toContain('Cyber%20Monday')
  })

  test('cierra el modal después de enviar', async () => {
    const input = screen.getByPlaceholderText(/ej: 3513411796/i) as HTMLInputElement
    const form = input.closest('form')

    fireEvent.change(input, { target: { value: '3513411796' } })

    if (form) {
      fireEvent.submit(form)
    }

    await waitFor(() => {
      expect(screen.queryByText(/participá por 1 de las/i)).not.toBeInTheDocument()
    })
  })

  test('trackea eventos en Google Analytics', () => {
    const input = screen.getByPlaceholderText(/ej: 3513411796/i) as HTMLInputElement
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
})

// ===================================
// F. TESTS DE LOCALSTORAGE
// ===================================

describe('WhatsAppPopup - LocalStorage', () => {
  test('guarda flag en localStorage al mostrarse', async () => {
    render(<WhatsAppPopup />)
    
    act(() => {
      jest.advanceTimersByTime(5000)
    })

    await waitFor(() => {
      expect(screen.getByText(/participá por 1 de las/i)).toBeInTheDocument()
    })

    expect(mockLocalStorage.getItem('pinturaFlashDaysShown')).toBe('true')
  })

  test('usa clave "pinturaFlashDaysShown"', async () => {
    render(<WhatsAppPopup />)
    
    act(() => {
      jest.advanceTimersByTime(5000)
    })

    await waitFor(() => {
      expect(screen.getByText(/participá por 1 de las/i)).toBeInTheDocument()
    })

    expect(mockLocalStorage.getItem('pinturaFlashDaysShown')).not.toBeNull()
  })

  test('respeta el flag al recargar', () => {
    mockLocalStorage.setItem('pinturaFlashDaysShown', 'true')
    
    render(<WhatsAppPopup />)
    
    act(() => {
      jest.advanceTimersByTime(5000)
    })

    expect(screen.queryByText(/participá por 1 de las/i)).not.toBeInTheDocument()
  })

  test('trackea evento al mostrarse', async () => {
    render(<WhatsAppPopup />)
    
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
  })
})

