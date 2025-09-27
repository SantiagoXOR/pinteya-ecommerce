import React from 'react'
import { render, screen, act } from '@testing-library/react'
import '@testing-library/jest-dom'
import PinteyaRaffle from '@/components/Home/PinteyaRaffle'

// Mock de Next.js Image
jest.mock('next/image', () => ({
  __esModule: true,
  default: ({ src, alt, ...props }: any) => <img src={src} alt={alt} {...props} />,
}))

// Mock de los iconos de Lucide
jest.mock('lucide-react', () => ({
  Gift: () => <div data-testid='gift-icon' />,
  Sparkles: () => <div data-testid='sparkles-icon' />,
  Palette: () => <div data-testid='palette-icon' />,
  Trophy: () => <div data-testid='trophy-icon' />,
  Clock: () => <div data-testid='clock-icon' />,
  Star: () => <div data-testid='star-icon' />,
}))

describe('PinteyaRaffle', () => {
  beforeEach(() => {
    // Mock de Date.now para tener un tiempo consistente en las pruebas
    jest.spyOn(Date, 'now').mockImplementation(() => new Date('2024-01-01T00:00:00Z').getTime())
  })

  afterEach(() => {
    jest.restoreAllMocks()
  })

  test('renderiza el componente correctamente', () => {
    render(<PinteyaRaffle />)

    // Verificar que el título principal está presente
    expect(screen.getByText('Ganá un Kit Completo de Pinturería')).toBeInTheDocument()

    // Verificar que los badges están presentes
    expect(screen.getByText('¡GRAN SORTEO!')).toBeInTheDocument()
    expect(screen.getByText('GRATIS')).toBeInTheDocument()
  })

  test('muestra la información del premio correctamente', () => {
    render(<PinteyaRaffle />)

    // Verificar el valor del premio (hay múltiples instancias, usar getAllByText)
    const priceElements = screen.getAllByText('$150.000')
    expect(priceElements.length).toBeGreaterThan(0)

    // Verificar la descripción del premio
    expect(screen.getByText(/productos premium de las mejores marcas/)).toBeInTheDocument()
  })

  test('muestra los productos incluidos en el kit', () => {
    render(<PinteyaRaffle />)

    // Verificar que se muestran los tipos de productos
    expect(screen.getByText('Látex Premium')).toBeInTheDocument()
    expect(screen.getByText('Esmaltes')).toBeInTheDocument()
    expect(screen.getByText('Herramientas')).toBeInTheDocument()
    expect(screen.getByText('Accesorios')).toBeInTheDocument()
  })

  test('muestra el contador regresivo', () => {
    render(<PinteyaRaffle />)

    // Verificar que las etiquetas del contador están presentes
    expect(screen.getByText('Días')).toBeInTheDocument()
    expect(screen.getByText('Horas')).toBeInTheDocument()
    expect(screen.getByText('Minutos')).toBeInTheDocument()
    expect(screen.getByText('Segundos')).toBeInTheDocument()

    // Verificar que el texto del contador está presente
    expect(screen.getByText('Tiempo restante para participar:')).toBeInTheDocument()
  })

  test('muestra el botón de participación', () => {
    render(<PinteyaRaffle />)

    const participateButton = screen.getByRole('button', { name: /participar ahora/i })
    expect(participateButton).toBeInTheDocument()
    expect(participateButton).toHaveClass('bg-bright-sun-400')
  })

  test('muestra las instrucciones de participación', () => {
    render(<PinteyaRaffle />)

    // Verificar el título de las instrucciones
    expect(screen.getByText('Cómo participar:')).toBeInTheDocument()

    // Verificar los pasos de participación
    expect(screen.getByText('Seguinos en Instagram @pinteya')).toBeInTheDocument()
    expect(screen.getByText('Compartí esta publicación en tu historia')).toBeInTheDocument()
    expect(screen.getByText('Etiquetá a 3 amigos en los comentarios')).toBeInTheDocument()
  })

  test('muestra las imágenes de productos', () => {
    render(<PinteyaRaffle />)

    // Verificar que la imagen principal está presente
    const mainImage = screen.getByAltText('Kit de Pinturería Pinteya')
    expect(mainImage).toBeInTheDocument()

    // Verificar que hay elementos decorativos (los círculos animados)
    const decorativeElements = document.querySelectorAll(
      '.animate-bounce, .animate-pulse, .animate-ping'
    )
    expect(decorativeElements.length).toBeGreaterThan(0)
  })

  test('actualiza el contador cada segundo', async () => {
    jest.useFakeTimers()

    render(<PinteyaRaffle />)

    // Avanzar el tiempo 1 segundo
    act(() => {
      jest.advanceTimersByTime(1000)
    })

    // Verificar que el componente sigue funcionando
    expect(screen.getByText('Días')).toBeInTheDocument()

    jest.useRealTimers()
  })

  test('muestra los iconos correctamente', () => {
    render(<PinteyaRaffle />)

    // Verificar que los iconos están presentes (algunos aparecen múltiples veces)
    expect(screen.getAllByTestId('gift-icon')).toHaveLength(2) // Badge y botón
    expect(screen.getByTestId('sparkles-icon')).toBeInTheDocument()
    expect(screen.getAllByTestId('palette-icon')).toHaveLength(3) // 3 iconos de paleta
    expect(screen.getByTestId('trophy-icon')).toBeInTheDocument()
    expect(screen.getByTestId('clock-icon')).toBeInTheDocument()
    expect(screen.getByTestId('star-icon')).toBeInTheDocument()
  })

  test('tiene las clases de estilo de Pinteya correctas', () => {
    render(<PinteyaRaffle />)

    // Verificar que usa los colores de la marca Pinteya
    const card = screen.getByRole('button', { name: /participar ahora/i }).closest('section')
    expect(card).toBeInTheDocument()

    // Verificar que el botón tiene los estilos correctos
    const button = screen.getByRole('button', { name: /participar ahora/i })
    expect(button).toHaveClass('bg-bright-sun-400')
  })

  test('muestra el disclaimer correctamente', () => {
    render(<PinteyaRaffle />)

    expect(
      screen.getByText('* Solo necesitás seguirnos en redes sociales. Sin compra mínima.')
    ).toBeInTheDocument()
  })
})
