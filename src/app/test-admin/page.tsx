'use client';

import { useUser } from '@clerk/nextjs';
import { useState } from 'react';

export default function TestAdminPage() {
  const { user, isLoaded } = useUser();
  const [result, setResult] = useState<any>(null);
  const [loading, setLoading] = useState(false);

  const testAdminAPI = async () => {
    if (!user) {
      setResult({ error: 'Usuario no autenticado' });
      return;
    }

    setLoading(true);
    try {
      const response = await fetch('/api/admin/products', {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'x-clerk-user-id': user.id
        }
      });

      const data = await response.json();
      setResult({
        status: response.status,
        data: data
      });
    } catch (error) {
      setResult({
        error: error instanceof Error ? error.message : 'Error desconocido'
      });
    } finally {
      setLoading(false);
    }
  };

  if (!isLoaded) {
    return <div className="p-8">Cargando...</div>;
  }

  if (!user) {
    return <div className="p-8">Por favor, inicia sesión para probar la API de administración.</div>;
  }

  return (
    <div className="p-8 max-w-4xl mx-auto">
      <h1 className="text-2xl font-bold mb-6">Test Admin API</h1>
      
      <div className="mb-6 p-4 bg-gray-100 rounded">
        <h2 className="text-lg font-semibold mb-2">Usuario Actual:</h2>
        <p><strong>ID:</strong> {user.id}</p>
        <p><strong>Email:</strong> {user.emailAddresses?.[0]?.emailAddress}</p>
        <p><strong>Nombre:</strong> {user.firstName} {user.lastName}</p>
      </div>

      <button
        onClick={testAdminAPI}
        disabled={loading}
        className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded disabled:opacity-50"
      >
        {loading ? 'Probando...' : 'Probar API Admin Products'}
      </button>

      {result && (
        <div className="mt-6 p-4 bg-gray-50 rounded">
          <h3 className="text-lg font-semibold mb-2">Resultado:</h3>
          <pre className="text-sm overflow-auto">
            {JSON.stringify(result, null, 2)}
          </pre>
        </div>
      )}
    </div>
  );
}
