"use client"

import React from 'react'
import { ThemeProvider, ThemeConfigPanel, ThemeModeToggle, useTheme } from '@/components/theme/theme-provider'
import { PriceDisplay } from '@/components/ui/price-display'
import { StockIndicator } from '@/components/ui/stock-indicator'
import { ShippingInfo } from '@/components/ui/shipping-info'
import { EnhancedProductCard } from '@/components/ui/product-card-enhanced'

function ThemeSystemContent() {
  const { theme, mode, context } = useTheme()

  return (
    <div className="min-h-screen bg-background-primary text-text-primary transition-colors duration-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        
        {/* Header */}
        <div className="text-center mb-12">
          <div className="flex items-center justify-center gap-4 mb-4">
            <h1 className="text-4xl font-bold">
              🎨 Sistema de Temas - Pinteya Design System
            </h1>
            <ThemeModeToggle />
          </div>
          <p className="text-xl text-text-secondary max-w-3xl mx-auto">
            Sistema de temas dinámico con soporte para modo claro/oscuro y contextos personalizados.
            Actualmente usando: <strong>{mode}</strong> en contexto <strong>{context}</strong>
          </p>
        </div>

        {/* Configuración del tema */}
        <section className="mb-12">
          <h2 className="text-2xl font-semibold mb-6">⚙️ Configuración</h2>
          <div className="max-w-md">
            <ThemeConfigPanel />
          </div>
        </section>

        {/* Paleta de colores */}
        <section className="mb-12">
          <h2 className="text-2xl font-semibold mb-6">🎨 Paleta de Colores</h2>
          
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            
            {/* Colores principales */}
            <div className="space-y-4">
              <h3 className="text-lg font-medium">Colores Principales</h3>
              <div className="grid grid-cols-5 gap-2">
                {Object.entries(theme.colors.primary).map(([key, value]) => (
                  <div key={key} className="text-center">
                    <div 
                      className="w-12 h-12 rounded-lg border shadow-sm mx-auto mb-2"
                      style={{ backgroundColor: value }}
                    />
                    <div className="text-xs font-mono">{key}</div>
                    <div className="text-xs text-text-tertiary">{value}</div>
                  </div>
                ))}
              </div>
            </div>

            {/* Colores e-commerce */}
            <div className="space-y-4">
              <h3 className="text-lg font-medium">Colores E-commerce</h3>
              <div className="space-y-3">
                <div>
                  <h4 className="text-sm font-medium mb-2">Precios</h4>
                  <div className="flex gap-2">
                    {Object.entries(theme.colors.ecommerce.price).map(([key, value]) => (
                      <div key={key} className="text-center">
                        <div 
                          className="w-8 h-8 rounded border"
                          style={{ backgroundColor: value }}
                        />
                        <div className="text-xs mt-1">{key}</div>
                      </div>
                    ))}
                  </div>
                </div>
                
                <div>
                  <h4 className="text-sm font-medium mb-2">Stock</h4>
                  <div className="flex gap-2">
                    {Object.entries(theme.colors.ecommerce.stock).map(([key, value]) => (
                      <div key={key} className="text-center">
                        <div 
                          className="w-8 h-8 rounded border"
                          style={{ backgroundColor: value }}
                        />
                        <div className="text-xs mt-1">{key}</div>
                      </div>
                    ))}
                  </div>
                </div>
                
                <div>
                  <h4 className="text-sm font-medium mb-2">Envío</h4>
                  <div className="flex gap-2">
                    {Object.entries(theme.colors.ecommerce.shipping).map(([key, value]) => (
                      <div key={key} className="text-center">
                        <div 
                          className="w-8 h-8 rounded border"
                          style={{ backgroundColor: value }}
                        />
                        <div className="text-xs mt-1">{key}</div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>

          </div>
        </section>

        {/* Componentes con tema */}
        <section className="mb-12">
          <h2 className="text-2xl font-semibold mb-6">🧩 Componentes con Tema</h2>
          
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            
            {/* PriceDisplay */}
            <div className="space-y-4">
              <h3 className="text-lg font-medium">PriceDisplay</h3>
              <div className="space-y-3">
                <PriceDisplay 
                  amount={8500}
                  originalAmount={10000}
                  showDiscountPercentage
                />
                <PriceDisplay 
                  amount={15000}
                  installments={{
                    quantity: 6,
                    amount: 2500,
                    interestFree: true
                  }}
                  showFreeShipping
                />
              </div>
            </div>

            {/* StockIndicator */}
            <div className="space-y-4">
              <h3 className="text-lg font-medium">StockIndicator</h3>
              <div className="space-y-3">
                <StockIndicator quantity={15} showExactQuantity />
                <StockIndicator 
                  quantity={3} 
                  lowStockThreshold={5}
                  showExactQuantity 
                  unit="latas"
                />
                <StockIndicator quantity={0} />
              </div>
            </div>

            {/* ShippingInfo */}
            <div className="space-y-4">
              <h3 className="text-lg font-medium">ShippingInfo</h3>
              <div className="space-y-3">
                <ShippingInfo highlightFreeShipping />
                <ShippingInfo variant="badge" type="fast" />
                <ShippingInfo 
                  variant="inline"
                  showCalculator
                />
              </div>
            </div>

          </div>
        </section>

        {/* ProductCard con tema */}
        <section className="mb-12">
          <h2 className="text-2xl font-semibold mb-6">🛒 ProductCard con Tema</h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            <EnhancedProductCard
              context="demo"
              title="Pintura Sherwin Williams 4L"
              price={8500}
              originalPrice={10000}
              stock={12}
              stockUnit="latas"
              image="https://aakzspzfulgftqlgwkpb.supabase.co/storage/v1/object/public/products/sherwin-williams/pintura-sherwin-williams.jpg"
              onAddToCart={() => alert('Agregado al carrito')}
            />
            
            <EnhancedProductCard
              context="demo"
              title="Esmalte Petrilac 1L"
              price={1850}
              originalPrice={2200}
              stock={3}
              stockUnit="latas"
              lowStockThreshold={5}
              image="https://aakzspzfulgftqlgwkpb.supabase.co/storage/v1/object/public/products/petrilac/esmalte-petrilac.jpg"
              onAddToCart={() => alert('Agregado al carrito')}
            />
            
            <EnhancedProductCard
              context="demo"
              title="Lija El Galgo"
              price={450}
              stock={0}
              image="https://aakzspzfulgftqlgwkpb.supabase.co/storage/v1/object/public/products/galgo/lija-galgo.jpg"
              onAddToCart={() => alert('Sin stock')}
            />
          </div>
        </section>

        {/* Variables CSS */}
        <section className="mb-12">
          <h2 className="text-2xl font-semibold mb-6">💻 Variables CSS</h2>
          
          <div className="bg-background-secondary p-6 rounded-lg border">
            <h3 className="text-lg font-medium mb-4">Variables CSS Dinámicas</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm font-mono">
              <div>
                <h4 className="font-semibold mb-2">Colores Principales</h4>
                <div className="space-y-1 text-text-tertiary">
                  <div>--color-primary-500: {theme.colors.primary[500]}</div>
                  <div>--color-background-primary: {theme.colors.background.primary}</div>
                  <div>--color-text-primary: {theme.colors.text.primary}</div>
                </div>
              </div>
              
              <div>
                <h4 className="font-semibold mb-2">E-commerce</h4>
                <div className="space-y-1 text-text-tertiary">
                  <div>--color-ecommerce-price-current: {theme.colors.ecommerce.price.current}</div>
                  <div>--color-ecommerce-stock-available: {theme.colors.ecommerce.stock.available}</div>
                  <div>--color-ecommerce-shipping-free: {theme.colors.ecommerce.shipping.free}</div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Información del tema actual */}
        <section className="mb-12">
          <h2 className="text-2xl font-semibold mb-6">📊 Información del Tema</h2>
          
          <div className="bg-background-secondary p-6 rounded-lg border">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div>
                <h3 className="font-medium mb-2">Configuración Actual</h3>
                <div className="space-y-1 text-sm text-text-secondary">
                  <div>Modo: <span className="font-mono">{mode}</span></div>
                  <div>Contexto: <span className="font-mono">{context}</span></div>
                  <div>Tema: <span className="font-mono">{theme.name}</span></div>
                </div>
              </div>
              
              <div>
                <h3 className="font-medium mb-2">Características</h3>
                <div className="space-y-1 text-sm text-text-secondary">
                  <div>✅ Persistencia en localStorage</div>
                  <div>✅ Detección automática del sistema</div>
                  <div>✅ Variables CSS dinámicas</div>
                  <div>✅ Contextos personalizados</div>
                </div>
              </div>
              
              <div>
                <h3 className="font-medium mb-2">Compatibilidad</h3>
                <div className="space-y-1 text-sm text-text-secondary">
                  <div>✅ Componentes e-commerce</div>
                  <div>✅ Tailwind CSS</div>
                  <div>✅ Next.js 15</div>
                  <div>✅ SSR/SSG</div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Footer */}
        <div className="text-center py-8 border-t border-border-primary">
          <p className="text-text-secondary">
            🎨 Sistema de Temas Pinteya - Fase 2 completada
          </p>
          <p className="text-sm text-text-tertiary mt-2">
            Soporte completo para temas dinámicos y contextos personalizados
          </p>
        </div>

      </div>
    </div>
  )
}

export default function ThemeSystemDemo() {
  return (
    <ThemeProvider defaultMode="light" defaultContext="default" enablePersistence={true}>
      <ThemeSystemContent />
    </ThemeProvider>
  )
}
