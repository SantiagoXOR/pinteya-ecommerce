import React from 'react'
import { render, screen } from '@testing-library/react'
import '@testing-library/jest-dom'
import TrustSection from '@/components/Home/TrustSection'

// Mock Next.js Image component
jest.mock('next/image', () => {
  return function MockImage({ src, alt, ...props }: any) {
    return <img src={src} alt={alt} {...props} />
  }
})

describe('TrustSection Component', () => {
  it('should render without crashing', () => {
    expect(() => {
      render(<TrustSection />)
    }).not.toThrow()
  })

  it('should render the main heading', () => {
    render(<TrustSection />)
    expect(screen.getByText(/Tu Confianza es Nuestra Prioridad/i)).toBeInTheDocument()
  })

  it('should render the description', () => {
    render(<TrustSection />)
    expect(screen.getByText(/Miles de clientes confían en nosotros/i)).toBeInTheDocument()
  })

  it('should render service badges moved from Hero', () => {
    render(<TrustSection />)
    expect(screen.getByText(/Envíos/i)).toBeInTheDocument()
    expect(screen.getByText(/Asesoramiento/i)).toBeInTheDocument()
    expect(screen.getByText(/Pagos/i)).toBeInTheDocument()
    expect(screen.getByText(/Cambios/i)).toBeInTheDocument()
  })

  it('should render service icons correctly', () => {
    const { container } = render(<TrustSection />)

    // Verificar que hay imágenes de servicios (envíos, asesoramiento, etc.)
    const serviceImages = container.querySelectorAll(
      'img[alt*="Envíos"], img[alt*="Asesoramiento"], img[alt*="Pagos"], img[alt*="Cambios"]'
    )
    expect(serviceImages.length).toBe(4)
  })

  it('should render trust badges', () => {
    render(<TrustSection />)
    expect(screen.getByText(/Compra Protegida/i)).toBeInTheDocument()
    expect(screen.getByText(/30 días de garantía/i)).toBeInTheDocument()
    expect(screen.getByText(/Envío en 24hs/i)).toBeInTheDocument()
    expect(screen.getByText(/Soporte 24\/7/i)).toBeInTheDocument()
  })

  it('should render statistics', () => {
    render(<TrustSection />)
    expect(screen.getByText(/15,000\+/i)).toBeInTheDocument()
    expect(screen.getByText(/98%/i)).toBeInTheDocument()
    expect(screen.getByText(/24-48h/i)).toBeInTheDocument()
    expect(screen.getByText(/15 años/i)).toBeInTheDocument()
  })

  it('should render images without errors', () => {
    const { container } = render(<TrustSection />)
    const imgElements = container.querySelectorAll('img')
    expect(imgElements.length).toBeGreaterThan(0)

    // Verificar que todas las imágenes tienen src definido
    imgElements.forEach(img => {
      expect(img.getAttribute('src')).toBeTruthy()
    })
  })

  it('should have proper responsive classes', () => {
    const { container } = render(<TrustSection />)

    // Verificar que el contenedor principal tiene clases responsive
    const section = container.querySelector('section')
    expect(section).toHaveClass('py-4', 'sm:py-6', 'lg:py-8')

    // Verificar grid responsive para los íconos de servicios
    const serviceGrid = container.querySelector('.grid.grid-cols-4')
    expect(serviceGrid).toBeInTheDocument()
  })
})
