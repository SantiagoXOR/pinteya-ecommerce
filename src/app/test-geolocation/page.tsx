/**
 * Página de testing para geolocalización
 * Accesible en /test-geolocation para debugging
 */

import React from 'react';
import GeolocationTester from '@/components/Header/GeolocationTester';

export default function TestGeolocationPage() {
  return (
    <div className="min-h-screen bg-gray-100 py-8">
      <div className="container mx-auto px-4">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-800 mb-2">
            🧪 Página de Testing - Geolocalización
          </h1>
          <p className="text-gray-600">
            Herramienta para probar y debuggear la funcionalidad de geolocalización del header
          </p>
        </div>
        
        <GeolocationTester />
        
        <div className="mt-8 text-center">
          <a 
            href="/" 
            className="inline-flex items-center px-4 py-2 bg-orange-500 text-white rounded-lg hover:bg-orange-600 transition-colors"
          >
            ← Volver al Header Principal
          </a>
        </div>
      </div>
    </div>
  );
}
