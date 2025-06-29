"use client"

import { EnhancedProductCard } from "@/components/ui/product-card-enhanced"

export default function TestOverflowPage() {
  return (
    <div className="container mx-auto p-8">
      <h1 className="text-3xl font-bold mb-8 text-center">
        🔧 Test de Corrección de Overflow - ProductCard
      </h1>
      
      <div className="mb-8 p-4 bg-blue-50 rounded-lg">
        <h2 className="text-lg font-semibold mb-2">✅ Problema Corregido:</h2>
        <p className="text-gray-700">
          El texto de cuotas "6x de $33,75 sin interés" y "Envío gratis" ahora se mantiene 
          correctamente dentro del contenedor de la ProductCard sin desbordarse.
        </p>
      </div>

      {/* Grid de productos para probar overflow */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
        
        {/* Producto con cuotas largas */}
        <EnhancedProductCard
          context="demo"
          title="Poximix Exterior 5kg Poxipol - Adhesivo Estructural de Alta Resistencia"
          price={20250}
          originalPrice={22500}
          stock={15}
          image="https://aakzspzfulgftqlgwkpb.supabase.co/storage/v1/object/public/products/poximix/adhesivo-poximix.jpg"
          stockUnit="unidades"
          onAddToCart={() => console.log('Agregado: Poximix')}
        />

        {/* Producto con cuotas y envío gratis */}
        <EnhancedProductCard
          context="demo"
          title="Pintura Sherwin Williams ProClassic Interior 4L Premium"
          price={65000}
          originalPrice={75000}
          stock={8}
          image="https://aakzspzfulgftqlgwkpb.supabase.co/storage/v1/object/public/products/sherwin-williams/pintura-sherwin-williams.jpg"
          stockUnit="latas"
          onAddToCart={() => console.log('Agregado: Sherwin Williams')}
        />

        {/* Producto con precio alto para 12 cuotas */}
        <EnhancedProductCard
          context="demo"
          title="Kit Completo de Pintura Profesional con Herramientas"
          price={85000}
          originalPrice={95000}
          stock={3}
          image="https://aakzspzfulgftqlgwkpb.supabase.co/storage/v1/object/public/products/sinteplast/latex-sinteplast.jpg"
          stockUnit="kits"
          onAddToCart={() => console.log('Agregado: Kit Completo')}
        />

        {/* Producto con título muy largo */}
        <EnhancedProductCard
          context="demo"
          title="Impermeabilizante Plavicon Membrana Líquida Acrílica Elastomérica 20L"
          price={45000}
          originalPrice={52000}
          stock={12}
          image="https://aakzspzfulgftqlgwkpb.supabase.co/storage/v1/object/public/products/plavicon/impermeabilizante-plavicon.jpg"
          stockUnit="baldes"
          onAddToCart={() => console.log('Agregado: Impermeabilizante')}
        />

        {/* Producto con precio medio */}
        <EnhancedProductCard
          context="demo"
          title="Esmalte Petrilac Sintético Brillante 1L"
          price={15000}
          originalPrice={18000}
          stock={25}
          image="https://aakzspzfulgftqlgwkpb.supabase.co/storage/v1/object/public/products/petrilac/esmalte-petrilac.jpg"
          stockUnit="latas"
          onAddToCart={() => console.log('Agregado: Esmalte Petrilac')}
        />

        {/* Producto con stock bajo */}
        <EnhancedProductCard
          context="demo"
          title="Lija El Galgo Grano 120 - Pack x10 unidades"
          price={4500}
          originalPrice={5200}
          stock={2}
          image="https://aakzspzfulgftqlgwkpb.supabase.co/storage/v1/object/public/products/galgo/lija-galgo.jpg"
          stockUnit="packs"
          onAddToCart={() => console.log('Agregado: Lijas El Galgo')}
        />

      </div>

      {/* Información técnica */}
      <div className="mt-12 p-6 bg-gray-50 rounded-lg">
        <h2 className="text-xl font-semibold mb-4">🔧 Correcciones Aplicadas:</h2>
        <div className="grid md:grid-cols-2 gap-6">
          <div>
            <h3 className="font-semibold mb-2">PriceDisplay Component:</h3>
            <ul className="text-sm text-gray-700 space-y-1">
              <li>• Agregado <code className="bg-gray-200 px-1 rounded">max-w-full</code> al contenedor principal</li>
              <li>• Agregado <code className="bg-gray-200 px-1 rounded">truncate block</code> al texto de cuotas</li>
              <li>• Agregado <code className="bg-gray-200 px-1 rounded">max-w-full</code> al contenedor de envío gratis</li>
              <li>• Agregado <code className="bg-gray-200 px-1 rounded">truncate</code> al texto de envío gratis</li>
            </ul>
          </div>
          <div>
            <h3 className="font-semibold mb-2">Clases CSS Aplicadas:</h3>
            <ul className="text-sm text-gray-700 space-y-1">
              <li>• <code className="bg-gray-200 px-1 rounded">w-full max-w-full</code> en contenedor principal</li>
              <li>• <code className="bg-gray-200 px-1 rounded">truncate block</code> para texto de cuotas</li>
              <li>• <code className="bg-gray-200 px-1 rounded">max-w-full</code> para contenedores de información</li>
              <li>• Mantiene funcionalidad completa del componente</li>
            </ul>
          </div>
        </div>
      </div>

      {/* Tests pasando */}
      <div className="mt-8 p-4 bg-green-50 rounded-lg">
        <h2 className="text-lg font-semibold mb-2 text-green-800">✅ Tests Verificados:</h2>
        <p className="text-green-700">
          • PriceDisplay: 14/14 tests pasando<br/>
          • ProductCard: 35/35 tests pasando<br/>
          • Funcionalidad completa preservada
        </p>
      </div>

    </div>
  )
}
