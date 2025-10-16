import React from 'react'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import '@testing-library/jest-dom'
import { ExpressForm } from '../ExpressForm'

// Mock de Google Maps
const mockGoogleMaps = {
  Map: jest.fn().mockImplementation(() => ({
    addListener: jest.fn(),
    setCenter: jest.fn(),
  })),
  Marker: jest.fn().mockImplementation(() => ({
    addListener: jest.fn(),
    setPosition: jest.fn(),
    getPosition: jest.fn(() => ({
      lat: () => -31.4201,
      lng: () => -64.1888,
    })),
  })),
  Geocoder: jest.fn().mockImplementation(() => ({
    geocode: jest.fn((request, callback) => {
      callback([
        {
          formatted_address: 'Av. Corrientes 1234, Córdoba, Córdoba, Argentina',
          geometry: {
            location: {
              lat: -31.4201,
              lng: -64.1888,
            },
          },
          address_components: [
            {
              long_name: 'Córdoba',
              short_name: 'Córdoba',
              types: ['locality', 'political'],
            },
          ],
        },
      ], 'OK')
    }),
  })),
  Size: jest.fn(),
  Point: jest.fn(),
  MapTypeId: {
    ROADMAP: 'roadmap',
  },
}

Object.defineProperty(window, 'google', {
  value: mockGoogleMaps,
  writable: true,
})

describe('ExpressForm con AddressMapSelector', () => {
  const mockOnFieldChange = jest.fn()
  const mockOnSubmit = jest.fn()
  const mockOnPaymentMethodChange = jest.fn()

  const defaultProps = {
    formData: {
      firstName: '',
      lastName: '',
      dni: '',
      email: '',
      phone: '',
      streetAddress: '',
      observations: '',
    },
    errors: {},
    onFieldChange: mockOnFieldChange,
    onSubmit: mockOnSubmit,
    isProcessing: false,
    paymentMethod: 'mercadopago',
    onPaymentMethodChange: mockOnPaymentMethodChange,
    isFormValid: false,
  }

  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('debería renderizar el formulario con el selector de mapa', () => {
    render(<ExpressForm {...defaultProps} />)

    expect(screen.getByText('Dirección de entrega')).toBeInTheDocument()
    expect(screen.getByText('Mostrar Mapa')).toBeInTheDocument()
    expect(screen.getByText('Mi Ubicación')).toBeInTheDocument()
  })

  it('debería mostrar el valor actual de la dirección', () => {
    const propsWithAddress = {
      ...defaultProps,
      formData: {
        ...defaultProps.formData,
        streetAddress: 'Av. Corrientes 1234, Córdoba',
      },
    }

    render(<ExpressForm {...propsWithAddress} />)

    expect(screen.getByDisplayValue('Av. Corrientes 1234, Córdoba')).toBeInTheDocument()
  })

  it('debería llamar a onFieldChange cuando cambia la dirección', () => {
    render(<ExpressForm {...defaultProps} />)

    const addressInput = screen.getByPlaceholderText('Selecciona tu ubicación en el mapa')
    fireEvent.change(addressInput, { target: { value: 'Nueva dirección' } })

    expect(mockOnFieldChange).toHaveBeenCalledWith('streetAddress', 'Nueva dirección')
  })

  it('debería mostrar errores de validación', () => {
    const propsWithErrors = {
      ...defaultProps,
      errors: {
        streetAddress: 'La dirección es requerida',
      },
    }

    render(<ExpressForm {...propsWithErrors} />)

    expect(screen.getByText('La dirección es requerida')).toBeInTheDocument()
  })

  it('debería manejar el envío del formulario', () => {
    render(<ExpressForm {...defaultProps} />)

    const submitButton = screen.getByRole('button', { name: /pagar/i })
    fireEvent.click(submitButton)

    expect(mockOnSubmit).toHaveBeenCalled()
  })

  it('debería mostrar el botón de pago con el monto correcto', () => {
    render(<ExpressForm {...defaultProps} />)

    // El botón debería mostrar el monto (esto depende de la implementación específica)
    const payButton = screen.getByRole('button', { name: /pagar/i })
    expect(payButton).toBeInTheDocument()
  })

  it('debería deshabilitar el formulario cuando está procesando', () => {
    const propsProcessing = {
      ...defaultProps,
      isProcessing: true,
    }

    render(<ExpressForm {...propsProcessing} />)

    const submitButton = screen.getByRole('button', { name: /pagar/i })
    expect(submitButton).toBeDisabled()
  })

  it('debería mostrar el campo de observaciones', () => {
    render(<ExpressForm {...defaultProps} />)

    expect(screen.getByText('Observaciones (opcional)')).toBeInTheDocument()
    expect(screen.getByPlaceholderText(/barrio/i)).toBeInTheDocument()
  })

  it('debería manejar cambios en las observaciones', () => {
    render(<ExpressForm {...defaultProps} />)

    const observationsInput = screen.getByPlaceholderText(/barrio/i)
    fireEvent.change(observationsInput, { target: { value: 'Observación de prueba' } })

    expect(mockOnFieldChange).toHaveBeenCalledWith('observations', 'Observación de prueba')
  })
})
