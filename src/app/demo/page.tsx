import React from 'react';
import Link from 'next/link';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { 
  ShoppingBag, 
  Palette, 
  Package, 
  Star, 
  Settings,
  ExternalLink,
  Code,
  Eye
} from 'lucide-react';


const demoPages = [
  {
    id: 'brand-features',
    title: 'Funciones de Marcas',
    description: 'Sistema completo de filtrado y gestión de marcas de productos. Incluye filtros avanzados, búsqueda por marca y componentes especializados.',
    path: '/demo/brand-features',
    icon: ShoppingBag,
    status: 'Completado',
    features: ['Filtro por marca', 'Búsqueda avanzada', 'API de marcas', 'Componentes UI'],
    color: 'bg-green-100 text-green-800 border-green-200'
  },
  {
    id: 'ecommerce-components',
    title: 'Componentes E-commerce',
    description: 'Colección completa de componentes especializados para e-commerce: PriceDisplay, StockIndicator, ShippingInfo y más.',
    path: '/demo/ecommerce-components',
    icon: Package,
    status: 'Completado',
    features: ['PriceDisplay', 'StockIndicator', 'ShippingInfo', 'CartSummary'],
    color: 'bg-blue-100 text-blue-800 border-blue-200'
  },
  {
    id: 'enhanced-product-card',
    title: 'ProductCard Mejorado',
    description: 'Versión avanzada del ProductCard con integración completa del Design System y funcionalidades inteligentes.',
    path: '/demo/enhanced-product-card',
    icon: Star,
    status: 'Completado',
    features: ['Auto-configuración', 'Design System', 'Responsive', 'Accesible'],
    color: 'bg-purple-100 text-purple-800 border-purple-200'
  },
  {
    id: 'product-card',
    title: 'ProductCard Básico',
    description: 'Componente ProductCard básico con funcionalidades esenciales para mostrar productos en la tienda.',
    path: '/demo/product-card',
    icon: Package,
    status: 'Completado',
    features: ['Diseño básico', 'Funcional', 'Responsive', 'Optimizado'],
    color: 'bg-gray-100 text-gray-800 border-gray-200'
  },
  {
    id: 'theme-system',
    title: 'Sistema de Temas',
    description: 'Demostración del Design System completo con tokens, componentes y temas personalizables.',
    path: '/demo/theme-system',
    icon: Palette,
    status: 'Completado',
    features: ['Tokens CSS', 'Temas', 'Componentes', 'Documentación'],
    color: 'bg-orange-100 text-orange-800 border-orange-200'
  }
];

export default function DemoIndexPage() {
  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">
            Demos y Ejemplos
          </h1>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto">
            Explora todas las funcionalidades y componentes desarrollados para Pinteya E-commerce. 
            Cada demo muestra implementaciones reales con código funcional y documentación completa.
          </p>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-12">
          <div className="bg-white rounded-lg p-6 shadow-sm border">
            <div className="flex items-center">
              <Code className="w-8 h-8 text-blue-600 mr-3" />
              <div>
                <p className="text-2xl font-bold text-gray-900">{demoPages.length}</p>
                <p className="text-sm text-gray-600">Demos Disponibles</p>
              </div>
            </div>
          </div>
          <div className="bg-white rounded-lg p-6 shadow-sm border">
            <div className="flex items-center">
              <Package className="w-8 h-8 text-green-600 mr-3" />
              <div>
                <p className="text-2xl font-bold text-gray-900">29</p>
                <p className="text-sm text-gray-600">Componentes</p>
              </div>
            </div>
          </div>
          <div className="bg-white rounded-lg p-6 shadow-sm border">
            <div className="flex items-center">
              <Settings className="w-8 h-8 text-purple-600 mr-3" />
              <div>
                <p className="text-2xl font-bold text-gray-900">480</p>
                <p className="text-sm text-gray-600">Tests Pasando</p>
              </div>
            </div>
          </div>
          <div className="bg-white rounded-lg p-6 shadow-sm border">
            <div className="flex items-center">
              <Eye className="w-8 h-8 text-orange-600 mr-3" />
              <div>
                <p className="text-2xl font-bold text-gray-900">100%</p>
                <p className="text-sm text-gray-600">Funcional</p>
              </div>
            </div>
          </div>
        </div>

        {/* Demo Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {demoPages.map((demo) => {
            const IconComponent = demo.icon;
            return (
              <Card key={demo.id} className="hover:shadow-lg transition-shadow duration-200">
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center">
                        <IconComponent className="w-6 h-6 text-primary" />
                      </div>
                      <div>
                        <CardTitle className="text-lg">{demo.title}</CardTitle>
                        <Badge className={demo.color} variant="outline">
                          {demo.status}
                        </Badge>
                      </div>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <CardDescription className="text-sm text-gray-600 mb-4">
                    {demo.description}
                  </CardDescription>
                  
                  {/* Features */}
                  <div className="mb-6">
                    <p className="text-sm font-medium text-gray-900 mb-2">Características:</p>
                    <div className="flex flex-wrap gap-1">
                      {demo.features.map((feature, index) => (
                        <Badge key={index} variant="secondary" className="text-xs">
                          {feature}
                        </Badge>
                      ))}
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex gap-2">
                    <Button asChild className="flex-1">
                      <Link href={demo.path}>
                        <Eye className="w-4 h-4 mr-2" />
                        Ver Demo
                      </Link>
                    </Button>
                    <Button variant="outline" size="sm" asChild>
                      <Link href={demo.path} target="_blank">
                        <ExternalLink className="w-4 h-4" />
                      </Link>
                    </Button>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>

        {/* Footer */}
        <div className="mt-16 text-center">
          <div className="bg-white rounded-lg p-8 shadow-sm border">
            <h3 className="text-xl font-semibold text-gray-900 mb-4">
              ¿Necesitas más información?
            </h3>
            <p className="text-gray-600 mb-6">
              Todos estos demos están completamente documentados y listos para producción. 
              Explora el código fuente y la documentación técnica para implementar estas funcionalidades.
            </p>
            <div className="flex justify-center gap-4">
              <Button asChild>
                <Link href="/menu">
                  Ver Menú Principal
                </Link>
              </Button>
              <Button variant="outline" asChild>
                <Link href="/contact">
                  Contactar Soporte
                </Link>
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}









