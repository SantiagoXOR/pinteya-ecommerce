// Configuración para Node.js Runtime
export const runtime = 'nodejs'

import { NextRequest, NextResponse } from 'next/server'

// Datos simulados básicos para órdenes
const mockOrders = [
  {
    id: 'ORD-1757119001-abc123',
    status: 'confirmed',
    createdAt: '2024-01-15T10:30:00Z',
    customerInfo: {
      firstName: 'Juan',
      lastName: 'Pérez',
      email: 'juan.perez@email.com',
    },
    items: [
      {
        id: 'prod-001',
        name: 'Pintura Látex Interior Blanco 20L',
        price: 15000,
        quantity: 2,
      },
    ],
    totals: {
      total: 37500,
    },
  },
  {
    id: 'ORD-1757119002-def456',
    status: 'pending',
    createdAt: '2024-01-15T14:20:00Z',
    customerInfo: {
      firstName: 'María',
      lastName: 'González',
      email: 'maria.gonzalez@email.com',
    },
    items: [
      {
        id: 'prod-003',
        name: 'Esmalte Sintético Azul 1L',
        price: 8500,
        quantity: 3,
      },
    ],
    totals: {
      total: 25450,
    },
  },
]

export async function GET(request: NextRequest) {
  try {
    return NextResponse.json({
      success: true,
      data: {
        orders: mockOrders,
        total: mockOrders.length,
      },
    })
  } catch (error) {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
