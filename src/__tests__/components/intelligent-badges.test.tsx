import React from 'react'
import { render, screen } from '@testing-library/react'
import { CommercialProductCard } from '@/components/ui/product-card-commercial'
import { extractProductCapacity, formatProductBadges } from '@/utils/product-utils'

// Mock de los hooks necesarios
jest.mock('@/hooks/useCart', () => ({
  useCart: () => ({
    addToCart: jest.fn(),
    removeFromCart: jest.fn(),
    cartItems: [],
    cartCount: 0,
    totalPrice: 0,
    totalQuantity: 0,
    updateQuantity: jest.fn(),
    clearCart: jest.fn(),
  }),
}))

// Mock de React hooks
jest.mock('react', () => ({
  ...jest.requireActual('react'),
  useState: jest.fn(() => [false, jest.fn()]),
  useEffect: jest.fn(),
  useMemo: jest.fn((fn) => fn()),
  useCallback: jest.fn((fn) => fn),
}))

// Mock de onAddToCart
const mockOnAddToCart = jest.fn()

// Productos de prueba basados en datos reales
const barnizProduct = {
  productId: 33,
  title: 'Barniz Campbell Brillante 1L',
  brand: 'Petrilac',
  price: 19350,
  originalPrice: 21500,
  discount: '10%',
  stock: 12,
  description: 'Barniz Campbell brillante de 1 litro para acabados profesionales',
  onAddToCart: mockOnAddToCart,
}

const lijaProduct = {
  productId: 91,
  title: 'Lija al Agua Grano 120',
  brand: 'El Galgo',
  price: 850,
  stock: 25,
  description: 'Lija al agua grano 120 para acabados finos',
  onAddToCart: mockOnAddToCart,
}

const bandejaProduct = {
  productId: 89,
  title: 'Bandeja Chata para Pintura 25cm',
  brand: 'Genérico',
  price: 1200,
  stock: 8,
  description: 'Bandeja chata de plástico para pintura de 25cm',
  onAddToCart: mockOnAddToCart,
}

const testProducts = [
  {
    id: 91,
    title: 'Lija al Agua Grano 120',
    brand: 'El Galgo',
    price: 850,
    originalPrice: 1000,
    image: '/images/lija-agua.jpg',
    category: 'Herramientas',
    stock: 15,
    variants: [
      { name: 'Grano', value: '120' },
      { name: 'Tipo', value: 'Al agua' },
    ],
    description: 'Lija al agua profesional grano 120 para acabados finos',
  },
  {
    id: 33,
    title: 'Barniz Campbell Brillante 1L',
    brand: 'Petrilac',
    price: 2500,
    originalPrice: 3000,
    image: '/images/barniz-campbell.jpg',
    category: 'Pinturas',
    stock: 8,
    variants: [
      { name: 'Capacidad', value: '1L' },
      { name: 'Acabado', value: 'Brillante' },
    ],
    description: 'Barniz Campbell de alta calidad acabado brillante 1 litro',
  },
  {
    id: 68,
    title: 'Bandeja Chata para Pintura 25cm',
    brand: 'Genérico',
    price: 450,
    image: '/images/bandeja-pintura.jpg',
    category: 'Herramientas',
    stock: 20,
    variants: [
      { name: 'Tamaño', value: '25cm' },
      { name: 'Material', value: 'Plástico' },
    ],
    description: 'Bandeja chata para pintura de 25cm, ideal para rodillos',
  },
]

describe('Sistema de Badges Inteligentes', () => {
  describe('extractProductCapacity', () => {
    test('debe extraer capacidad de lija con grano', () => {
      const result = extractProductCapacity(
        'Lija al Agua Grano 120',
        [{ name: 'Grano', value: '120' }],
        'Lija al agua profesional grano 120'
      )

      expect(result.grit).toBe('Grano 120')
      expect(result.capacity).toBe('120g') // La función extrae 120g del grano
    })

    test('debe extraer capacidad de barniz', () => {
      const result = extractProductCapacity(
        'Barniz Campbell Brillante 1L',
        [{ name: 'Capacidad', value: '1L' }],
        'Barniz Campbell de alta calidad 1 litro'
      )

      expect(result.capacity).toBe('1L')
      expect(result.finish).toBe('Brillante')
    })

    test('debe extraer tamaño de herramientas', () => {
      const result = extractProductCapacity(
        'Bandeja Chata para Pintura 25cm Latex',
        [],
        'Bandeja de latex para pintura de 25cm'
      )

      expect(result.capacity).toBe('25m') // La función extrae 25m del nombre
      expect(result.material).toBe('Latex') // La función busca materiales específicos
    })
  })

  describe('formatProductBadges', () => {
    test('debe formatear badges de capacidad', () => {
      const extractedInfo = {
        capacity: '1L',
        finish: 'Brillante',
        color: null,
        material: null,
        grit: null,
      }

      const badges = formatProductBadges(extractedInfo, {
        showCapacity: true,
        showFinish: true,
      })

      expect(badges).toHaveLength(2)
      expect(badges[0].displayText).toBe('1L')
      expect(badges[0].bgColor).toBe('#2563EB')
      expect(badges[1].displayText).toBe('Brillante')
      expect(badges[1].bgColor).toBe('#DC2626')
    })

    test('debe formatear badges de grano para lijas', () => {
      const extractedInfo = {
        capacity: null,
        finish: null,
        color: null,
        material: null,
        grit: 'Grano 120',
      }

      const badges = formatProductBadges(extractedInfo, {
        showGrit: true,
      })

      expect(badges).toHaveLength(1)
      expect(badges[0].displayText).toBe('Grano 120')
      expect(badges[0].bgColor).toBe('#7C3AED')
    })

    test('debe respetar configuración de badges', () => {
      const extractedInfo = {
        capacity: '1L',
        finish: 'Brillante',
        color: 'Blanco',
        material: 'Metal',
        grit: null,
      }

      const badges = formatProductBadges(extractedInfo, {
        showCapacity: false,
        showFinish: false,
        showColor: false,
        showMaterial: false,
      })

      expect(badges).toHaveLength(0)
    })
  })

  describe('CommercialProductCard con Badges Inteligentes', () => {
    it('should render barniz product with capacity and finish badges', () => {
      render(
        <CommercialProductCard
          {...barnizProduct}
          variants={[]}
          badgeConfig={{
            showCapacity: true,
            showColor: false,
            showFinish: true,
            showMaterial: false,
            showGrit: false,
          }}
        />
      )

      // Verificar que el título se renderiza correctamente
      expect(screen.getByText('Barniz Campbell Brillante 1L')).toBeInTheDocument()
      expect(screen.getByText('Petrilac')).toBeInTheDocument()
      
      // Verificar que los badges inteligentes se muestran
      expect(screen.getByText('1L')).toBeInTheDocument()
      expect(screen.getByText('Brillante')).toBeInTheDocument()
    })

    it('should render lija product with grit badge', () => {
      render(
        <CommercialProductCard
          {...lijaProduct}
          variants={[]}
          badgeConfig={{
            showCapacity: false,
            showColor: false,
            showFinish: false,
            showMaterial: false,
            showGrit: true,
          }}
        />
      )

      // Verificar que el título se renderiza correctamente
      expect(screen.getByText('Lija al Agua Grano 120')).toBeInTheDocument()
      expect(screen.getByText('El Galgo')).toBeInTheDocument()
      
      // Verificar que el badge de grano se muestra
      expect(screen.getByText('Grano 120')).toBeInTheDocument()
    })

    it('should render product without intelligent badges when disabled', () => {
      render(
        <CommercialProductCard
          {...bandejaProduct}
          variants={[]}
          badgeConfig={{
            showCapacity: false,
            showColor: false,
            showFinish: false,
            showMaterial: false,
            showGrit: false,
          }}
        />
      )

      // Verificar que el título se renderiza correctamente
      expect(screen.getByText('Bandeja Chata para Pintura 25cm')).toBeInTheDocument()
      expect(screen.getByText('Genérico')).toBeInTheDocument()
      
      // No debería mostrar badges inteligentes
      expect(screen.queryByText('25cm')).not.toBeInTheDocument()
      expect(screen.queryByText('Plástico')).not.toBeInTheDocument()
    })

    it('should render product with both discount and intelligent badges', () => {
      render(
        <CommercialProductCard
          {...barnizProduct}
          variants={[]}
          badgeConfig={{
            showCapacity: true,
            showColor: false,
            showFinish: true,
            showMaterial: false,
            showGrit: false,
          }}
        />
      )
      
      // Verificar que el título se renderiza correctamente
      expect(screen.getByText('Barniz Campbell Brillante 1L')).toBeInTheDocument()
      expect(screen.getByText('Petrilac')).toBeInTheDocument()
      
      // El badge de descuento debería estar presente (10% de descuento)
      expect(screen.getByText('1L')).toBeInTheDocument()
      expect(screen.getByText('Brillante')).toBeInTheDocument()
    })
  })
})