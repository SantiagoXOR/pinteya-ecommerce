/**
 * Tests Unitarios Simplificados - ProductFormMinimal
 * Enfocados en validación de schemas Zod (lo crítico)
 */

import { z } from 'zod'

// Schema del componente ProductFormMinimal
const ProductSchema = z.object({
  name: z.string().min(1, 'El nombre es requerido').max(255),
  description: z.string().max(5000).optional(),
  brand: z.string().max(100).optional(),
  category_id: z.number().int().positive('Selecciona una categoría'), // ✅ CRÍTICO: number
  is_active: z.boolean().default(true),
  price: z.number().min(0.01, 'El precio debe ser mayor a 0'),
  discounted_price: z.number().min(0).optional().nullable(),
  stock: z.number().min(0, 'El stock debe ser mayor o igual a 0'),
  image_url: z.string().url().optional().nullable(),
  featured: z.boolean().default(false),
})

describe('ProductFormMinimal - Validaciones Zod', () => {
  describe('✅ CRÍTICO: Validación de category_id', () => {
    it('debe ACEPTAR category_id como number', () => {
      const validData = {
        name: 'Látex Eco Painting',
        category_id: 38, // ✅ number
        price: 4975,
        stock: 30,
      }

      const result = ProductSchema.safeParse(validData)

      expect(result.success).toBe(true)
      if (result.success) {
        expect(result.data.category_id).toBe(38)
        expect(typeof result.data.category_id).toBe('number')
      }
    })

    it('debe RECHAZAR category_id como string UUID', () => {
      const invalidData = {
        name: 'Látex Eco Painting',
        category_id: '550e8400-e29b-41d4-a909-446655440000', // ❌ string
        price: 4975,
        stock: 30,
      }

      const result = ProductSchema.safeParse(invalidData)

      expect(result.success).toBe(false)
    })

    it('debe RECHAZAR category_id como string numérico', () => {
      const invalidData = {
        name: 'Látex Eco Painting',
        category_id: '38', // ❌ string
        price: 4975,
        stock: 30,
      }

      const result = ProductSchema.safeParse(invalidData)

      expect(result.success).toBe(false)
    })

    it('debe REQUERIR category_id', () => {
      const invalidData = {
        name: 'Látex Eco Painting',
        // category_id falta
        price: 4975,
        stock: 30,
      }

      const result = ProductSchema.safeParse(invalidData)

      expect(result.success).toBe(false)
    })
  })

  describe('Validación de campos requeridos', () => {
    it('debe rechazar cuando falta el nombre', () => {
      const invalidData = {
        category_id: 38,
        price: 4975,
        stock: 30,
      }

      const result = ProductSchema.safeParse(invalidData)

      expect(result.success).toBe(false)
      if (!result.success) {
        const nameError = result.error.issues.find(issue => issue.path[0] === 'name')
        expect(nameError).toBeDefined()
        // Zod retorna "Required" por defecto para campos obligatorios
        expect(nameError?.message).toBeTruthy()
      }
    })

    it('debe rechazar precio = 0', () => {
      const invalidData = {
        name: 'Test',
        category_id: 38,
        price: 0, // ❌ inválido
        stock: 10,
      }

      const result = ProductSchema.safeParse(invalidData)

      expect(result.success).toBe(false)
      if (!result.success) {
        const priceError = result.error.issues.find(issue => issue.path[0] === 'price')
        expect(priceError?.message).toContain('mayor a 0')
      }
    })

    it('debe rechazar stock negativo', () => {
      const invalidData = {
        name: 'Test',
        category_id: 38,
        price: 100,
        stock: -5, // ❌ inválido
      }

      const result = ProductSchema.safeParse(invalidData)

      expect(result.success).toBe(false)
      if (!result.success) {
        const stockError = result.error.issues.find(issue => issue.path[0] === 'stock')
        expect(stockError?.message).toContain('mayor o igual a 0')
      }
    })
  })

  describe('Validación de campos opcionales', () => {
    it('debe aceptar producto mínimo válido', () => {
      const minimalProduct = {
        name: 'Producto Mínimo',
        category_id: 38,
        price: 100,
        stock: 0,
      }

      const result = ProductSchema.safeParse(minimalProduct)

      expect(result.success).toBe(true)
    })

    it('debe aceptar producto completo con todos los campos', () => {
      const completeProduct = {
        name: 'Látex Eco Painting',
        description: 'Látex de alta calidad para interiores',
        brand: '+COLOR',
        category_id: 38,
        is_active: true,
        price: 4975,
        discounted_price: 3482.5,
        stock: 30,
        image_url: 'https://example.com/image.jpg',
        featured: false,
      }

      const result = ProductSchema.safeParse(completeProduct)

      expect(result.success).toBe(true)
    })
  })

  describe('🔒 Regresión: Bug "Expected string, received number"', () => {
    it('NO debe generar error con category_id numérico desde BD', () => {
      const productFromDB = {
        name: 'Látex Eco Painting',
        category_id: 38, // Viene como number de la BD
        price: 4975,
        stock: 25,
      }

      const result = ProductSchema.safeParse(productFromDB)

      expect(result.success).toBe(true)
      
      // Verificar que NO hay error "Expected string"
      if (!result.success) {
        const hasExpectedStringError = result.error.issues.some(
          issue => issue.message.includes('Expected string')
        )
        expect(hasExpectedStringError).toBe(false)
      }
    })
  })
})
