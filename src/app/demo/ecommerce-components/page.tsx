"use client"

import React from 'react'
import { CommercialProductCard } from '@/components/ui/product-card-commercial'
import { PriceDisplay } from '@/components/ui/price-display'
import { StockIndicator } from '@/components/ui/stock-indicator'
import { ShippingInfo } from '@/components/ui/shipping-info'

export default function EcommerceComponentsDemo() {
  const handleAddToCart = (productName: string) => {
    alert(`${productName} agregado al carrito`)
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Header */}
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">
            🛒 Componentes E-commerce - Pinteya Design System
          </h1>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto">
            Nuevos componentes especializados para e-commerce inspirados en MercadoPago 
            y optimizados para el mercado argentino de pinturería.
          </p>
        </div>

        {/* Componentes Individuales */}
        <section className="mb-16">
          <h2 className="text-3xl font-semibold text-gray-900 mb-8">📦 Componentes Individuales</h2>
          
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            
            {/* PriceDisplay */}
            <div className="bg-white rounded-lg p-6 shadow-sm">
              <h3 className="text-xl font-semibold mb-4">🏷️ PriceDisplay</h3>
              <div className="space-y-4">
                <div>
                  <h4 className="text-sm font-medium text-gray-600 mb-2">Precio con descuento</h4>
                  <PriceDisplay 
                    amount={8500}
                    originalAmount={10000}
                    showDiscountPercentage
                  />
                </div>
                <div>
                  <h4 className="text-sm font-medium text-gray-600 mb-2">Con cuotas sin interés</h4>
                  <PriceDisplay 
                    amount={15000}
                    installments={{
                      quantity: 12,
                      amount: 1250,
                      interestFree: true
                    }}
                  />
                </div>
                <div>
                  <h4 className="text-sm font-medium text-gray-600 mb-2">Completo con envío gratis</h4>
                  <PriceDisplay 
                    amount={15000}
                    originalAmount={20000}
                    installments={{
                      quantity: 6,
                      amount: 2500,
                      interestFree: true
                    }}
                    showDiscountPercentage
                    showFreeShipping
                    variant="center"
                  />
                </div>
              </div>
            </div>

            {/* StockIndicator */}
            <div className="bg-white rounded-lg p-6 shadow-sm">
              <h3 className="text-xl font-semibold mb-4">📦 StockIndicator</h3>
              <div className="space-y-4">
                <div>
                  <h4 className="text-sm font-medium text-gray-600 mb-2">En stock</h4>
                  <StockIndicator quantity={15} showExactQuantity />
                </div>
                <div>
                  <h4 className="text-sm font-medium text-gray-600 mb-2">Stock bajo</h4>
                  <StockIndicator 
                    quantity={3} 
                    lowStockThreshold={5}
                    showExactQuantity 
                    unit="latas"
                  />
                </div>
                <div>
                  <h4 className="text-sm font-medium text-gray-600 mb-2">Sin stock con reposición</h4>
                  <StockIndicator 
                    quantity={0}
                    restockDate={new Date(Date.now() + 5 * 24 * 60 * 60 * 1000)}
                  />
                </div>
                <div>
                  <h4 className="text-sm font-medium text-gray-600 mb-2">Pre-orden disponible</h4>
                  <StockIndicator 
                    quantity={0}
                    allowPreOrder
                  />
                </div>
              </div>
            </div>

            {/* ShippingInfo */}
            <div className="bg-white rounded-lg p-6 shadow-sm">
              <h3 className="text-xl font-semibold mb-4">🚚 ShippingInfo</h3>
              <div className="space-y-4">
                <div>
                  <h4 className="text-sm font-medium text-gray-600 mb-2">Envío gratis simple</h4>
                  <ShippingInfo highlightFreeShipping />
                </div>
                <div>
                  <h4 className="text-sm font-medium text-gray-600 mb-2">Badge de envío</h4>
                  <ShippingInfo variant="badge" type="free" />
                </div>
                <div>
                  <h4 className="text-sm font-medium text-gray-600 mb-2">Con calculadora</h4>
                  <ShippingInfo 
                    variant="inline"
                    showCalculator
                    postalCode="1425"
                  />
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* ProductCard Comparación */}
        <section className="mb-16">
          <h2 className="text-3xl font-semibold text-gray-900 mb-8">🔄 ProductCard: Antes vs Después</h2>
          
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            
            {/* ProductCard Legacy */}
            <div className="bg-white rounded-lg p-6 shadow-sm">
              <h3 className="text-xl font-semibold mb-4">📱 Versión Actual (Legacy)</h3>
              <div className="flex justify-center">
                <CommercialProductCard
                  image="https://aakzspzfulgftqlgwkpb.supabase.co/storage/v1/object/public/products/sherwin-williams/pintura-sherwin-williams.jpg"
                  title="Pintura Sherwin Williams ProClassic 4L"
                  brand="Sherwin Williams"
                  price={8500}
                  originalPrice={10000}
                  discount="15%"
                  stock={12}
                  cta="Agregar al carrito"
                  onAddToCart={() => handleAddToCart('Pintura Sherwin Williams Legacy')}
                  freeShipping={true}
                  shippingText="Envío gratis"
                />
              </div>
            </div>

            {/* ProductCard con nuevos componentes */}
            <div className="bg-white rounded-lg p-6 shadow-sm">
              <h3 className="text-xl font-semibold mb-4">✨ Nueva Versión (E-commerce)</h3>
              <div className="flex justify-center">
                <CommercialProductCard
                  image="https://aakzspzfulgftqlgwkpb.supabase.co/storage/v1/object/public/products/sherwin-williams/pintura-sherwin-williams.jpg"
                  title="Pintura Sherwin Williams ProClassic 4L"
                  brand="Sherwin Williams"
                  price={8500}
                  originalPrice={10000}
                  discount="15%"
                  stock={12}
                  installments={{
                    quantity: 6,
                    amount: 1417,
                    interestFree: true
                  }}
                  freeShipping={true}
                  shippingText="Envío gratis"
                  cta="Agregar al carrito"
                  onAddToCart={() => handleAddToCart('Pintura Sherwin Williams Nueva')}
                />
              </div>
            </div>
          </div>
        </section>

        {/* Grid de Productos Reales */}
        <section className="mb-16">
          <h2 className="text-3xl font-semibold text-gray-900 mb-8">🏪 Productos de Pinturería con Nuevos Componentes</h2>
          
          <div className="grid grid-cols-2 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 md:gap-6">
            
            {/* Pintura Sherwin Williams */}
            <CommercialProductCard
              image="https://aakzspzfulgftqlgwkpb.supabase.co/storage/v1/object/public/products/sherwin-williams/pintura-sherwin-williams.jpg"
              title="Pintura Sherwin Williams ProClassic 4L"
              brand="Sherwin Williams"
              price={8500}
              originalPrice={10000}
              discount="15%"
              stock={12}
              installments={{
                quantity: 6,
                amount: 1417,
                interestFree: true
              }}
              freeShipping={true}
              cta="Agregar al carrito"
              onAddToCart={() => handleAddToCart('Pintura Sherwin Williams')}
            />

            {/* Esmalte Petrilac */}
            <CommercialProductCard
              image="https://aakzspzfulgftqlgwkpb.supabase.co/storage/v1/object/public/products/petrilac/esmalte-petrilac.jpg"
              title="Esmalte Sintético Petrilac Brillante 1L"
              brand="Petrilac"
              price={1850}
              originalPrice={2200}
              discount="16%"
              stock={8}
              installments={{
                quantity: 3,
                amount: 617,
                interestFree: true
              }}
              cta="Comprar ahora"
              onAddToCart={() => handleAddToCart('Esmalte Petrilac')}
            />

            {/* Poximix - Stock bajo */}
            <CommercialProductCard
              image="https://aakzspzfulgftqlgwkpb.supabase.co/storage/v1/object/public/products/poximix/adhesivo-poximix.jpg"
              title="Adhesivo Estructural Poximix 250ml"
              brand="Akapol"
              price={2300}
              stock={2}
              installments={{
                quantity: 3,
                amount: 767,
                interestFree: true
              }}
              cta="Agregar al carrito"
              onAddToCart={() => handleAddToCart('Poximix')}
              shippingText="Stock bajo"
            />

            {/* Lija El Galgo - Sin stock */}
            <CommercialProductCard
              image="https://aakzspzfulgftqlgwkpb.supabase.co/storage/v1/object/public/products/galgo/lija-galgo.jpg"
              title="Lija El Galgo Grano 120"
              brand="El Galgo"
              price={450}
              stock={0}
              cta="Sin stock"
              onAddToCart={() => handleAddToCart('Lija El Galgo')}
            />

          </div>
        </section>

        {/* Opciones de Envío Detalladas */}
        <section className="mb-16">
          <h2 className="text-3xl font-semibold text-gray-900 mb-8">🚚 Opciones de Envío Completas</h2>
          
          <div className="bg-white rounded-lg p-6 shadow-sm max-w-2xl mx-auto">
            <ShippingInfo 
              variant="card"
              options={[
                {
                  id: 'free',
                  name: 'Envío gratis',
                  price: 0,
                  estimatedDays: { min: 5, max: 7 },
                  isFree: true,
                  description: 'En compras mayores a $50.000'
                },
                {
                  id: 'standard',
                  name: 'Envío estándar',
                  price: 2500,
                  estimatedDays: { min: 3, max: 5 },
                  description: 'Entrega a domicilio'
                },
                {
                  id: 'express',
                  name: 'Envío express',
                  price: 4500,
                  estimatedDays: { min: 1, max: 2 },
                  isExpress: true,
                  description: 'Entrega prioritaria'
                },
                {
                  id: 'pickup',
                  name: 'Retiro en sucursal',
                  price: 0,
                  estimatedDays: { min: 1, max: 1 },
                  isFree: true,
                  description: 'Av. Corrientes 1234, CABA'
                }
              ]}
              selectedOption="standard"
              onOptionSelect={(id) => console.log('Opción seleccionada:', id)}
              showCalculator={true}
              showGuarantees={true}
            />
          </div>
        </section>

        {/* Footer */}
        <div className="text-center py-8 border-t border-gray-200">
          <p className="text-gray-600">
            🎨 Pinteya Design System - Componentes E-commerce inspirados en MercadoPago
          </p>
          <p className="text-sm text-gray-500 mt-2">
            Fase 1 completada: PriceDisplay, StockIndicator, ShippingInfo integrados
          </p>
        </div>

      </div>
    </div>
  )
}









