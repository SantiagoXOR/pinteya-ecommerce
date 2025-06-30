import React from 'react';
import { Metadata } from 'next';
import Image from 'next/image';
import Link from 'next/link';

export const metadata: Metadata = {
  title: "Test Favicon | Pinteya E-commerce",
  description: "Página de prueba para verificar la implementación de favicons",
};

export default function TestFaviconPage() {
  return (
    <div className="min-h-screen bg-gray-50 py-12">
      <div className="max-w-4xl mx-auto px-4">
        <h1 className="text-3xl font-bold text-center mb-8 text-gray-900">
          🎨 Test de Favicons - Pinteya E-commerce
        </h1>
        
        <div className="bg-white rounded-lg shadow-lg p-8">
          <h2 className="text-2xl font-semibold mb-6 text-gray-800">
            Favicons Implementados
          </h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            
            {/* Favicon Principal */}
            <div className="border rounded-lg p-4 text-center">
              <h3 className="font-semibold mb-3">Favicon Principal (32x32)</h3>
              <div className="flex justify-center mb-3">
                <Image 
                  src="/favicon-32x32.png" 
                  alt="Favicon 32x32" 
                  width={32} 
                  height={32}
                  className="border"
                />
              </div>
              <p className="text-sm text-gray-600">favicon-32x32.png</p>
            </div>

            {/* Apple Touch Icon */}
            <div className="border rounded-lg p-4 text-center">
              <h3 className="font-semibold mb-3">Apple Touch Icon (180x180)</h3>
              <div className="flex justify-center mb-3">
                <Image 
                  src="/apple-touch-icon.png" 
                  alt="Apple Touch Icon" 
                  width={64} 
                  height={64}
                  className="border rounded-lg"
                />
              </div>
              <p className="text-sm text-gray-600">apple-touch-icon.png</p>
            </div>

            {/* PWA Icon 192 */}
            <div className="border rounded-lg p-4 text-center">
              <h3 className="font-semibold mb-3">PWA Icon (192x192)</h3>
              <div className="flex justify-center mb-3">
                <Image 
                  src="/favicon-192x192.png" 
                  alt="PWA Icon 192" 
                  width={64} 
                  height={64}
                  className="border rounded-lg"
                />
              </div>
              <p className="text-sm text-gray-600">favicon-192x192.png</p>
            </div>

            {/* PWA Icon 512 */}
            <div className="border rounded-lg p-4 text-center">
              <h3 className="font-semibold mb-3">PWA Icon (512x512)</h3>
              <div className="flex justify-center mb-3">
                <Image 
                  src="/favicon-512x512.png" 
                  alt="PWA Icon 512" 
                  width={64} 
                  height={64}
                  className="border rounded-lg"
                />
              </div>
              <p className="text-sm text-gray-600">favicon-512x512.png</p>
            </div>

            {/* Favicon ICO */}
            <div className="border rounded-lg p-4 text-center">
              <h3 className="font-semibold mb-3">Favicon ICO (Legacy)</h3>
              <div className="flex justify-center mb-3">
                <Image 
                  src="/favicon.ico" 
                  alt="Favicon ICO" 
                  width={32} 
                  height={32}
                  className="border"
                />
              </div>
              <p className="text-sm text-gray-600">favicon.ico</p>
            </div>

            {/* Favicon SVG */}
            <div className="border rounded-lg p-4 text-center">
              <h3 className="font-semibold mb-3">Favicon SVG (Vector)</h3>
              <div className="flex justify-center mb-3">
                <Image 
                  src="/favicon.svg" 
                  alt="Favicon SVG" 
                  width={32} 
                  height={32}
                  className="border"
                />
              </div>
              <p className="text-sm text-gray-600">favicon.svg</p>
            </div>

          </div>

          <div className="mt-8 p-4 bg-blue-50 rounded-lg">
            <h3 className="font-semibold text-blue-900 mb-2">✅ Verificaciones:</h3>
            <ul className="text-sm text-blue-800 space-y-1">
              <li>• Favicon visible en la pestaña del navegador</li>
              <li>• Apple Touch Icon para dispositivos iOS</li>
              <li>• Iconos PWA para Android y aplicaciones web</li>
              <li>• Compatibilidad con navegadores legacy (ICO)</li>
              <li>• Favicon vectorial para alta resolución (SVG)</li>
            </ul>
          </div>

          <div className="mt-6 text-center">
            <Link
              href="/"
              className="inline-block bg-blaze-orange-600 text-white px-6 py-3 rounded-lg hover:bg-blaze-orange-700 transition-colors"
            >
              ← Volver al Inicio
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
