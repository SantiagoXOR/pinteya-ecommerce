/**
 * Tests unitarios para formatCurrency
 * Verifica todos los casos edge: 0, null, muy grandes, decimales
 */

import { formatCurrency } from '../consolidated-utils'

describe('formatCurrency', () => {
  describe('Casos básicos', () => {
    it('debe formatear un precio entero correctamente', () => {
      expect(formatCurrency(100)).toBe('$100')
    })

    it('debe formatear un precio con decimales correctamente', () => {
      expect(formatCurrency(100.50)).toBe('$100,50')
    })

    it('debe formatear un precio con 2 decimales', () => {
      expect(formatCurrency(13.621)).toBe('$13,62')
    })

    it('debe formatear un precio grande con separadores de miles', () => {
      expect(formatCurrency(1000000)).toBe('$1.000.000')
    })

    it('debe formatear un precio muy grande con decimales', () => {
      expect(formatCurrency(1234567.89)).toBe('$1.234.567,89')
    })
  })

  describe('Casos edge', () => {
    it('debe manejar precio 0', () => {
      expect(formatCurrency(0)).toBe('$0')
    })

    it('debe manejar null', () => {
      expect(formatCurrency(null)).toBe('$0')
    })

    it('debe manejar undefined', () => {
      expect(formatCurrency(undefined)).toBe('$0')
    })

    it('debe manejar string numérico', () => {
      expect(formatCurrency('100.50')).toBe('$100,50')
    })

    it('debe manejar string inválido', () => {
      expect(formatCurrency('invalid')).toBe('$0')
    })

    it('debe remover decimales .00 de enteros', () => {
      expect(formatCurrency(100.00)).toBe('$100')
    })

    it('debe mantener decimales cuando no son .00', () => {
      expect(formatCurrency(100.30)).toBe('$100,30')
    })

    it('debe manejar precios con 1 decimal y convertirlo a 2', () => {
      // El formato siempre usa 2 decimales, así que 100.3 se convierte a 100.30
      expect(formatCurrency(100.3)).toBe('$100,30')
    })
  })

  describe('Formato argentino (es-AR)', () => {
    it('debe usar punto para separador de miles', () => {
      expect(formatCurrency(1000)).toBe('$1.000')
    })

    it('debe usar coma para decimales', () => {
      expect(formatCurrency(100.50)).toBe('$100,50')
    })

    it('debe formatear correctamente números grandes', () => {
      expect(formatCurrency(1234567.89)).toBe('$1.234.567,89')
    })
  })

  describe('Casos del diagnóstico original', () => {
    it('debe corregir el bug de $13,621.3 a $13.621,30', () => {
      // Simulando el bug original donde se mostraba .3
      expect(formatCurrency(13621.3)).toBe('$13.621,30')
    })

    it('debe formatear $100.50 correctamente', () => {
      expect(formatCurrency(100.50)).toBe('$100,50')
    })

    it('debe formatear $1.000.000,00 correctamente', () => {
      expect(formatCurrency(1000000)).toBe('$1.000.000')
    })
  })
})

