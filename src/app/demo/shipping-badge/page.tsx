'use client'

import { CommercialProductCard } from '@/components/ui/product-card-commercial'

export default function ShippingBadgeDemoPage() {
  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="container mx-auto px-4">
        <div className="max-w-4xl mx-auto">
          <h1 className="text-3xl font-bold text-center mb-8 text-[#712F00]">
            Demo: Badge de Envío Gratis con Ícono SVG Personalizado
          </h1>
          
          <div className="mb-8 text-center">
            <p className="text-gray-600 mb-4">
              Comparación del badge de envío gratis antes y después de la implementación del ícono SVG personalizado.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
            {/* ProductCard con nuevos componentes y envío gratis */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-center">Con Nuevos Componentes</h3>
              <CommercialProductCard
                image="/images/products/placeholder.svg"
                title="Barniz Campbell 4L Petrilac"
                brand="Petrilac"
                price={19350}
                originalPrice={21500}
                discount="10%"
                stock={12}
                productId="1"
                freeShipping={true}
                installments={{
                  quantity: 3,
                  amount: 6450,
                  interestFree: true
                }}
                onAddToCart={() => console.log('Agregado al carrito')}
              />
            </div>

            {/* ProductCard legacy con badge de envío gratis */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-center">Versión Legacy</h3>
              <CommercialProductCard
                image="/images/products/placeholder.svg"
                title="Barniz Campbell 4L Petrilac"
                brand="Petrilac"
                price={19350}
                originalPrice={21500}
                discount="10%"
                stock={12}
                productId="2"
                shippingText="Envío gratis"
                onAddToCart={() => console.log('Agregado al carrito')}
              />
            </div>

            {/* ProductCard con precio alto (envío gratis automático) */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-center">Envío Gratis Automático</h3>
              <CommercialProductCard
                image="/images/products/placeholder.svg"
                title="Pintura Látex Premium 20L"
                brand="Sherwin Williams"
                price={25000}
                stock={8}
                productId="3"
                freeShipping={true}
                onAddToCart={() => console.log('Agregado al carrito')}
              />
            </div>
          </div>

          <div className="bg-white rounded-lg p-6 shadow-sm">
            <h2 className="text-xl font-semibold mb-4 text-[#712F00]">Características del Nuevo Badge</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <h3 className="font-semibold mb-2">Mejoras Visuales:</h3>
                <ul className="space-y-2 text-sm text-gray-600">
                  <li>• Ícono SVG personalizado de camión de envío</li>
                  <li>• Color verde corporativo (#007638)</li>
                  <li>• Bordes redondeados y sombra sutil</li>
                  <li>• Tipografía consistente con el design system</li>
                  <li>• Responsive y optimizado para móviles</li>
                </ul>
              </div>
              <div>
                <h3 className="font-semibold mb-2">Funcionalidad:</h3>
                <ul className="space-y-2 text-sm text-gray-600">
                  <li>• Se muestra automáticamente para productos ≥ $15.000</li>
                  <li>• Compatible con nuevos componentes e-commerce</li>
                  <li>• Evita duplicación cuando se usan PriceDisplay</li>
                  <li>• Mantiene compatibilidad con versión legacy</li>
                  <li>• Tests actualizados y funcionando</li>
                </ul>
              </div>
            </div>
          </div>

          <div className="mt-8 bg-green-50 border border-green-200 rounded-lg p-4">
            <h3 className="font-semibold text-green-800 mb-2">✅ Implementación Completada</h3>
            <p className="text-green-700 text-sm">
              El badge de envío gratis ahora usa el ícono SVG personalizado ubicado en 
              <code className="bg-green-100 px-1 rounded">public/images/icons/icon-envio.svg</code> 
              y mantiene la paleta de colores verde del sistema de diseño Pinteya.
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}









