'use client';

import React, { useState } from 'react';
import { SimpleAddressForm } from '@/components/Address/SimpleAddressForm';
import { AddressFormAdvanced, AdvancedAddress } from '@/components/Address/AddressFormAdvanced';

export default function TestAddressPage() {
  const [result, setResult] = useState<any>(null);
  const [simpleResult, setSimpleResult] = useState<any>(null);

  const handleSubmit = async (data: Omit<AdvancedAddress, 'id' | 'user_id' | 'created_at' | 'updated_at'>) => {
    console.log('Advanced form submitted with data:', data);
    setResult(data);
  };

  const handleSimpleSubmit = (data: any) => {
    console.log('Simple form submitted with data:', data);
    setSimpleResult(data);
  };

  const handleCancel = () => {
    console.log('Form cancelled');
  };

  return (
    <div className="min-h-screen bg-gray-50 py-12">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-8">
          Test Address Forms
        </h1>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Simple Form */}
          <div>
            <h2 className="text-xl font-semibold mb-4">Simple Form</h2>
            <SimpleAddressForm onSubmit={handleSimpleSubmit} />
            <div className="mt-4">
              <h3 className="text-lg font-medium mb-2">Simple Form Data:</h3>
              <pre className="bg-gray-100 p-4 rounded-lg overflow-auto text-xs">
                {simpleResult ? JSON.stringify(simpleResult, null, 2) : 'No data submitted yet'}
              </pre>
            </div>

            <div className="mt-4 p-4 bg-blue-50 rounded-lg">
              <h4 className="font-medium text-blue-900 mb-2">Instrucciones de Prueba:</h4>
              <ul className="text-sm text-blue-800 space-y-1">
                <li>• Completa todos los campos</li>
                <li>• Prueba diferentes tipos de dirección</li>
                <li>• Haz clic en "Validar" para probar la validación</li>
                <li>• Observa los badges de estado</li>
              </ul>
            </div>
          </div>

          {/* Advanced Form */}
          <div>
            <h2 className="text-xl font-semibold mb-4">Advanced Form</h2>
            <AddressFormAdvanced
              mode="create"
              onSubmit={handleSubmit}
              onCancel={handleCancel}
            />
          </div>

          {/* Results */}
          <div>
            <h2 className="text-xl font-semibold mb-4">Advanced Form Data:</h2>
            <pre className="bg-gray-100 p-4 rounded-lg overflow-auto text-xs">
              {result ? JSON.stringify(result, null, 2) : 'No data submitted yet'}
            </pre>
          </div>
        </div>
      </div>
    </div>
  );
}









