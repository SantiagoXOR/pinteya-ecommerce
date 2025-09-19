// ===================================
// PINTEYA E-COMMERCE - PÁGINA TEST EMAIL
// ===================================

import React from 'react';
import EmailTester from '../../../components/admin/EmailTester';

export default function EmailTestPage() {
  return (
    <div className="min-h-screen bg-gray-100 py-8">
      <div className="container mx-auto px-4">
        <div className="mb-8 text-center">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Panel de Administración - Emails
          </h1>
          <p className="text-gray-600">
            Prueba y configura los emails personalizados de Pinteya
          </p>
        </div>

        <EmailTester />

        {/* Información adicional */}
        <div className="mt-8 max-w-2xl mx-auto">
          <div className="bg-white rounded-lg shadow-lg p-6">
            <h2 className="text-xl font-bold text-gray-900 mb-4">
              📚 Configuración de Resend
            </h2>
            
            <div className="space-y-4 text-sm text-gray-700">
              <div>
                <h3 className="font-semibold text-gray-900">1. Crear cuenta en Resend</h3>
                <p>Visita <a href="https://resend.com" target="_blank" rel="noopener noreferrer" className="text-blaze-orange-600 hover:underline">resend.com</a> y crea una cuenta</p>
              </div>

              <div>
                <h3 className="font-semibold text-gray-900">2. Configurar dominio</h3>
                <p>Agrega el dominio <code className="bg-gray-100 px-2 py-1 rounded">pinteya.com</code> en tu dashboard de Resend</p>
              </div>

              <div>
                <h3 className="font-semibold text-gray-900">3. Obtener API Key</h3>
                <p>Genera una API Key en el dashboard y agrégala a las variables de entorno</p>
              </div>

              <div>
                <h3 className="font-semibold text-gray-900">4. Variables de entorno requeridas</h3>
                <div className="bg-gray-100 p-3 rounded-md font-mono text-xs">
                  <div>RESEND_API_KEY=re_your-api-key</div>
                  <div>RESEND_FROM_EMAIL=noreply@pinteya.com</div>
                  <div>RESEND_SUPPORT_EMAIL=soporte@pinteya.com</div>
                </div>
              </div>

              <div>
                <h3 className="font-semibold text-gray-900">5. Configurar DNS</h3>
                <p>Agrega los registros DNS que Resend te proporcione para verificar el dominio</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}









