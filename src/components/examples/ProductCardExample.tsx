import React from 'react'
import { ProductCard } from '@/components/ui/card'

export function ProductCardExample() {
  const handleAddToCart = () => {
    console.log('Producto agregado al carrito')
  }

  return (
    <div className="p-8 bg-gray-50 min-h-screen">
      <div className="max-w-6xl mx-auto">
        <h1 className="text-3xl font-bold text-gray-900 mb-8 text-center">
          🧱 Nuevo ProductCard Component
        </h1>
        
        {/* Ejemplo individual */}
        <div className="mb-12">
          <h2 className="text-xl font-semibold mb-4">📱 Ejemplo Individual</h2>
          <div className="max-w-sm mx-auto">
            <ProductCard
              image="/productos/loxon-20l.png"
              title="Pintura Látex Premium Sherwin Williams"
              price={2500}
              originalPrice={3200}
              discount="25%"
              badge="Llega gratis hoy"
              cta="Agregar al carrito"
              onAddToCart={handleAddToCart}
            />
          </div>
        </div>

        {/* Grid de productos */}
        <div className="mb-12">
          <h2 className="text-xl font-semibold mb-4">🏪 Grid de Productos</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            <ProductCard
              image="https://aakzspzfulgftqlgwkpb.supabase.co/storage/v1/object/public/products/sherwin-williams/pintura-sherwin-williams.jpg"
              title="Pintura Látex Premium Sherwin Williams"
              price={2500}
              originalPrice={3200}
              discount="25%"
              badge="Llega gratis hoy"
              cta="Agregar al carrito"
              onAddToCart={handleAddToCart}
            />
            
            <ProductCard
              image="https://aakzspzfulgftqlgwkpb.supabase.co/storage/v1/object/public/products/petrilac/esmalte-petrilac.jpg"
              title="Esmalte Sintético Petrilac Brillante"
              price={1850}
              originalPrice={2200}
              discount="15%"
              badge="Envío rápido"
              cta="Comprar ahora"
              onAddToCart={handleAddToCart}
            />
            
            <ProductCard
              image="https://aakzspzfulgftqlgwkpb.supabase.co/storage/v1/object/public/products/sinteplast/latex-sinteplast.jpg"
              title="Látex Interior Sinteplast Blanco"
              price={1200}
              badge="Stock limitado"
              cta="Agregar al carrito"
              onAddToCart={handleAddToCart}
            />
            
            <ProductCard
              image="https://aakzspzfulgftqlgwkpb.supabase.co/storage/v1/object/public/products/plavicon/impermeabilizante-plavicon.jpg"
              title="Impermeabilizante Plavicon 20L"
              price={4500}
              originalPrice={5200}
              discount="13%"
              badge="Oferta especial"
              cta="Ver detalles"
              onAddToCart={handleAddToCart}
            />
            
            <ProductCard
              title="Producto sin imagen"
              price={999}
              badge="Nuevo"
              cta="Agregar al carrito"
              onAddToCart={handleAddToCart}
            />
            
            <ProductCard
              image="https://aakzspzfulgftqlgwkpb.supabase.co/storage/v1/object/public/products/poximix/adhesivo-poximix.jpg"
              title="Adhesivo Estructural Poximix"
              price={0}
              stock={0}
              cta="Sin stock"
              onAddToCart={handleAddToCart}
            />
          </div>
        </div>

        {/* Variaciones de diseño */}
        <div className="mb-12">
          <h2 className="text-xl font-semibold mb-4">🎨 Variaciones de Diseño</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Solo precio */}
            <ProductCard
              image="https://aakzspzfulgftqlgwkpb.supabase.co/storage/v1/object/public/products/galgo/lija-galgo.jpg"
              title="Lija El Galgo Grano 120"
              price={350}
              cta="Agregar"
              onAddToCart={handleAddToCart}
            />
            
            {/* Con descuento grande */}
            <ProductCard
              image="https://aakzspzfulgftqlgwkpb.supabase.co/storage/v1/object/public/products/genericos/pincel-angular.jpg"
              title="Kit Completo de Pinceles Profesionales"
              price={1500}
              originalPrice={2500}
              discount="40%"
              badge="Liquidación"
              cta="¡Aprovechá!"
              onAddToCart={handleAddToCart}
            />
          </div>
        </div>

        {/* Especificaciones técnicas */}
        <div className="bg-white rounded-lg p-6 shadow-sm">
          <h2 className="text-xl font-semibold mb-4">📋 Especificaciones Técnicas</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-sm">
            <div>
              <h3 className="font-semibold mb-2">🎨 Estilos Visuales</h3>
              <ul className="space-y-1 text-gray-600">
                <li>• Fondo: gradiente amarillo claro a blanco</li>
                <li>• Bordes: suaves y redondeados</li>
                <li>• Hover: elevación con sombra</li>
                <li>• Tipografía: jerarquía clara</li>
                <li>• Íconos: carrito de compras integrado</li>
              </ul>
            </div>
            <div>
              <h3 className="font-semibold mb-2">⚡ Funcionalidades</h3>
              <ul className="space-y-1 text-gray-600">
                <li>• Adaptable a grillas 2-3 columnas</li>
                <li>• Animaciones de hover y click</li>
                <li>• Estados de carga y sin stock</li>
                <li>• Badges personalizables</li>
                <li>• CTA configurable</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default ProductCardExample
