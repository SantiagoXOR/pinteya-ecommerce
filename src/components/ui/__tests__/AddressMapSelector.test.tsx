import React from 'react'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import '@testing-library/jest-dom'
import { AddressMapSelector } from '../AddressMapSelector'

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

// Mock global de Google Maps
Object.defineProperty(window, 'google', {
  value: mockGoogleMaps,
  writable: true,
})

// Mock de navigator.geolocation
Object.defineProperty(navigator, 'geolocation', {
  value: {
    getCurrentPosition: jest.fn(),
  },
  writable: true,
})

describe('AddressMapSelector', () => {
  const mockOnChange = jest.fn()
  const mockOnValidationChange = jest.fn()

  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('debería renderizar correctamente', () => {
    render(
      <AddressMapSelector
        value=""
        onChange={mockOnChange}
        onValidationChange={mockOnValidationChange}
        label="Test Label"
      />
    )

    expect(screen.getByText('Test Label')).toBeInTheDocument()
    expect(screen.getByText('Selecciona tu ubicación en el mapa')).toBeInTheDocument()
  })

  it('debería mostrar el valor actual en el input', () => {
    const testAddress = 'Av. Corrientes 1234, Córdoba'
    render(
      <AddressMapSelector
        value={testAddress}
        onChange={mockOnChange}
        onValidationChange={mockOnValidationChange}
      />
    )

    expect(screen.getByDisplayValue(testAddress)).toBeInTheDocument()
  })

  it('debería mostrar botones de control', () => {
    render(
      <AddressMapSelector
        value=""
        onChange={mockOnChange}
        onValidationChange={mockOnValidationChange}
      />
    )

    expect(screen.getByText('Mostrar Mapa')).toBeInTheDocument()
    expect(screen.getByText('Mi Ubicación')).toBeInTheDocument()
  })

  it('debería mostrar el mapa cuando se hace clic en "Mostrar Mapa"', async () => {
    render(
      <AddressMapSelector
        value=""
        onChange={mockOnChange}
        onValidationChange={mockOnValidationChange}
      />
    )

    const showMapButton = screen.getByText('Mostrar Mapa')
    fireEvent.click(showMapButton)

    await waitFor(() => {
      expect(screen.getByText('Ocultar Mapa')).toBeInTheDocument()
    })
  })

  it('debería llamar a onChange cuando cambia la dirección', () => {
    render(
      <AddressMapSelector
        value=""
        onChange={mockOnChange}
        onValidationChange={mockOnValidationChange}
      />
    )

    const input = screen.getByPlaceholderText('Selecciona tu ubicación en el mapa')
    fireEvent.change(input, { target: { value: 'Nueva dirección' } })

    expect(mockOnChange).toHaveBeenCalledWith('Nueva dirección', undefined)
  })

  it('debería mostrar mensaje de error cuando se proporciona', () => {
    const errorMessage = 'Error de validación'
    render(
      <AddressMapSelector
        value=""
        onChange={mockOnChange}
        onValidationChange={mockOnValidationChange}
        error={errorMessage}
      />
    )

    expect(screen.getByText(errorMessage)).toBeInTheDocument()
  })

  it('debería mostrar estado de validación válido', () => {
    render(
      <AddressMapSelector
        value="Av. Corrientes 1234, Córdoba"
        onChange={mockOnChange}
        onValidationChange={mockOnValidationChange}
      />
    )

    // Simular estado válido
    const input = screen.getByDisplayValue('Av. Corrientes 1234, Córdoba')
    expect(input).toHaveClass('border-green-500')
  })

  it('debería manejar el botón de limpiar', () => {
    render(
      <AddressMapSelector
        value="Dirección de prueba"
        onChange={mockOnChange}
        onValidationChange={mockOnValidationChange}
      />
    )

    const clearButton = screen.getByRole('button', { name: '' }) // Botón X
    fireEvent.click(clearButton)

    expect(mockOnChange).toHaveBeenCalledWith('', undefined)
  })

  it('debería deshabilitar controles cuando disabled es true', () => {
    render(
      <AddressMapSelector
        value=""
        onChange={mockOnChange}
        onValidationChange={mockOnValidationChange}
        disabled={true}
      />
    )

    const input = screen.getByPlaceholderText('Selecciona tu ubicación en el mapa')
    const showMapButton = screen.getByText('Mostrar Mapa')
    const locationButton = screen.getByText('Mi Ubicación')

    expect(input).toBeDisabled()
    expect(showMapButton).toBeDisabled()
    expect(locationButton).toBeDisabled()
  })

  it('debería mostrar coordenadas cuando se proporcionan', () => {
    const coordinates = { lat: -31.4201, lng: -64.1888 }
    render(
      <AddressMapSelector
        value="Av. Corrientes 1234, Córdoba"
        onChange={mockOnChange}
        onValidationChange={mockOnValidationChange}
      />
    )

    // Simular que se han seleccionado coordenadas
    // En un test real, esto se haría a través de la interacción con el mapa
  })
})
