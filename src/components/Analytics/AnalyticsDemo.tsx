/**
 * Componente de demostración del sistema de Analytics
 * Muestra cómo integrar tracking en componentes existentes
 */

'use client';

import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { 
  BarChart3, 
  MousePointer, 
  Eye, 
  ShoppingCart, 
  TrendingUp,
  Activity,
  Zap
} from 'lucide-react';
import { useOptimizedAnalytics } from '@/components/Analytics/OptimizedAnalyticsProvider';
import { useAnalytics } from '@/hooks/useAnalytics';

const AnalyticsDemo: React.FC = () => {
  const [clickCount, setClickCount] = useState(0);
  const [hoverCount, setHoverCount] = useState(0);
  const { trackEvent } = useOptimizedAnalytics();
  const { sessionMetrics } = useAnalytics();

  // Funciones de tracking usando el sistema optimizado
  const trackClick = (element: string, metadata?: Record<string, any>) => {
    trackEvent('click', 'interaction', 'click', element, undefined, metadata);
  };

  const trackHover = (element: string, metadata?: Record<string, any>) => {
    trackEvent('hover', 'interaction', 'hover', element, undefined, metadata);
  };

  const trackSearch = (query: string, resultsCount: number) => {
    trackEvent('search', 'search', 'search', query.substring(0, 30), resultsCount);
  };

  const trackProductView = (productId: string, productName: string, category: string, price: number) => {
    trackEvent('product_view', 'ecommerce', 'view', productId, price, {
      item_name: productName,
      item_category: category,
      currency: 'ARS'
    });
  };

  const trackAddToCart = (productId: string, productName: string, price: number, quantity: number) => {
    trackEvent('cart_add', 'ecommerce', 'add', productId, price * quantity, {
      item_name: productName,
      quantity: quantity,
      currency: 'ARS'
    });
  };

  const handleDemoClick = () => {
    setClickCount(prev => prev + 1);
    trackClick('demo-button', { 
      clickNumber: clickCount + 1,
      timestamp: Date.now() 
    });
  };

  const handleDemoHover = () => {
    setHoverCount(prev => prev + 1);
    trackHover('demo-hover-area', { 
      hoverNumber: hoverCount + 1 
    });
  };

  const handleProductView = () => {
    trackProductView(
      'demo-product-001',
      'Pintura Demo Premium',
      'Pinturas',
      2500
    );
  };

  const handleAddToCart = () => {
    trackAddToCart(
      'demo-product-001',
      'Pintura Demo Premium',
      2500,
      1
    );
  };

  const handleSearch = () => {
    trackSearch('pintura blanca', 15);
  };

  return (
    <div className="max-w-4xl mx-auto p-6 space-y-8">
      {/* Header */}
      <div className="text-center">
        <h1 className="text-3xl font-bold text-gray-900 mb-4">
          🎯 Demo del Sistema de Analytics
        </h1>
        <p className="text-gray-600 max-w-2xl mx-auto">
          Interactúa con los elementos de esta página para ver cómo funciona el sistema de tracking.
          Todos los eventos se registran automáticamente en nuestro sistema de analytics.
        </p>
      </div>

      {/* Métricas en tiempo real */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-gradient-to-r from-blue-50 to-purple-50 rounded-xl p-6"
      >
        <h2 className="text-xl font-semibold text-gray-900 mb-4 flex items-center gap-2">
          <Activity className="w-6 h-6 text-blue-600" />
          Métricas de Sesión Actual
        </h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="text-center">
            <p className="text-2xl font-bold text-blue-600">{sessionMetrics.productViews}</p>
            <p className="text-sm text-gray-600">Vistas de productos</p>
          </div>
          <div className="text-center">
            <p className="text-2xl font-bold text-green-600">{sessionMetrics.cartAdditions}</p>
            <p className="text-sm text-gray-600">Agregados al carrito</p>
          </div>
          <div className="text-center">
            <p className="text-2xl font-bold text-purple-600">{sessionMetrics.checkoutStarts}</p>
            <p className="text-sm text-gray-600">Checkouts iniciados</p>
          </div>
          <div className="text-center">
            <p className="text-2xl font-bold text-yellow-600">{sessionMetrics.searchQueries}</p>
            <p className="text-sm text-gray-600">Búsquedas</p>
          </div>
        </div>
      </motion.div>

      {/* Área de interacciones */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Tracking de clicks */}
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          className="bg-white rounded-xl p-6 shadow-sm border border-gray-100"
        >
          <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
            <MousePointer className="w-5 h-5 text-red-500" />
            Tracking de Clicks
          </h3>
          <p className="text-gray-600 mb-4">
            Cada click en este botón se registra automáticamente con metadatos.
          </p>
          <button
            onClick={handleDemoClick}
            className="w-full bg-red-500 text-white py-3 px-6 rounded-lg hover:bg-red-600 transition-colors font-medium"
          >
            Click aquí ({clickCount} clicks)
          </button>
        </motion.div>

        {/* Tracking de hover */}
        <motion.div
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          className="bg-white rounded-xl p-6 shadow-sm border border-gray-100"
        >
          <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
            <Eye className="w-5 h-5 text-green-500" />
            Tracking de Hover
          </h3>
          <p className="text-gray-600 mb-4">
            Pasa el mouse sobre esta área para registrar eventos de hover.
          </p>
          <div
            onMouseEnter={handleDemoHover}
            className="w-full bg-green-100 border-2 border-dashed border-green-300 py-8 px-6 rounded-lg text-center text-green-700 hover:bg-green-200 transition-colors cursor-pointer"
          >
            Hover aquí ({hoverCount} hovers)
          </div>
        </motion.div>
      </div>

      {/* E-commerce tracking */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-white rounded-xl p-6 shadow-sm border border-gray-100"
      >
        <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
          <ShoppingCart className="w-5 h-5 text-blue-500" />
          Tracking de E-commerce
        </h3>
        <p className="text-gray-600 mb-6">
          Simula eventos de e-commerce como vista de producto y agregar al carrito.
        </p>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <button
            onClick={handleProductView}
            className="bg-blue-500 text-white py-3 px-6 rounded-lg hover:bg-blue-600 transition-colors font-medium"
          >
            Ver Producto
          </button>
          <button
            onClick={handleAddToCart}
            className="bg-green-500 text-white py-3 px-6 rounded-lg hover:bg-green-600 transition-colors font-medium"
          >
            Agregar al Carrito
          </button>
          <button
            onClick={handleSearch}
            className="bg-purple-500 text-white py-3 px-6 rounded-lg hover:bg-purple-600 transition-colors font-medium"
          >
            Buscar Productos
          </button>
        </div>
      </motion.div>

      {/* Información técnica */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-gray-50 rounded-xl p-6"
      >
        <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
          <BarChart3 className="w-5 h-5 text-gray-600" />
          Información Técnica
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <h4 className="font-medium text-gray-900 mb-2">Eventos Trackeados</h4>
            <ul className="text-sm text-gray-600 space-y-1">
              <li>• Clicks con coordenadas y metadatos</li>
              <li>• Hovers con tiempo de permanencia</li>
              <li>• Vistas de productos con detalles</li>
              <li>• Agregados al carrito con valores</li>
              <li>• Búsquedas con términos y resultados</li>
            </ul>
          </div>
          <div>
            <h4 className="font-medium text-gray-900 mb-2">Destinos de Datos</h4>
            <ul className="text-sm text-gray-600 space-y-1">
              <li>• Base de datos Supabase (analytics_events)</li>
              <li>• Google Analytics 4 (si está configurado)</li>
              <li>• Métricas en tiempo real en memoria</li>
              <li>• Dashboard de administración</li>
            </ul>
          </div>
        </div>
      </motion.div>

      {/* Call to action */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-yellow-50 border border-yellow-200 rounded-xl p-6 text-center"
      >
        <Zap className="w-12 h-12 text-yellow-500 mx-auto mb-4" />
        <h3 className="text-lg font-semibold text-gray-900 mb-2">
          ¡Sistema de Analytics Activo!
        </h3>
        <p className="text-gray-600 mb-4">
          Todos los eventos de esta página se están registrando en tiempo real.
          Ve al dashboard de administración para ver las métricas completas.
        </p>
        <a
          href="/admin/analytics"
          className="inline-flex items-center gap-2 bg-yellow-400 text-gray-900 py-2 px-6 rounded-lg hover:bg-yellow-500 transition-colors font-medium"
        >
          <TrendingUp className="w-4 h-4" />
          Ver Dashboard
        </a>
      </motion.div>
    </div>
  );
};

export default AnalyticsDemo;
