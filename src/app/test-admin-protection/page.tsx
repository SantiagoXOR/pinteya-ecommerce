/**
 * Página de Prueba de Protección Admin
 * Para verificar que solo santiago@xor.com.ar tenga acceso admin
 */

'use client';

import { useState } from 'react';
import { Shield, CheckCircle, XCircle, AlertTriangle } from 'lucide-react';

// Forzar renderizado dinámico para evitar problemas con prerendering
export const dynamic = 'force-dynamic';

interface TestResult {
  test: string;
  status: 'success' | 'error' | 'warning';
  message: string;
  details?: any;
}

export default function TestAdminProtectionPage() {
  const [results, setResults] = useState<TestResult[]>([]);
  const [testing, setTesting] = useState(false);

  const runTests = async () => {
    setTesting(true);
    setResults([]);
    const testResults: TestResult[] = [];

    // Test 1: Verificar acceso a /admin
    try {
      const adminResponse = await fetch('/admin');
      testResults.push({
        test: 'Acceso a /admin',
        status: adminResponse.ok ? 'success' : 'error',
        message: adminResponse.ok 
          ? 'Acceso permitido (usuario admin)' 
          : `Acceso denegado (${adminResponse.status})`,
        details: { status: adminResponse.status, url: '/admin' }
      });
    } catch (error) {
      testResults.push({
        test: 'Acceso a /admin',
        status: 'error',
        message: 'Error de conexión',
        details: error
      });
    }

    // Test 2: Verificar acceso a API admin
    try {
      const apiResponse = await fetch('/api/admin/products');
      testResults.push({
        test: 'API /api/admin/products',
        status: apiResponse.ok ? 'success' : 'error',
        message: apiResponse.ok 
          ? 'API accesible (usuario admin)' 
          : `API bloqueada (${apiResponse.status})`,
        details: { status: apiResponse.status, url: '/api/admin/products' }
      });
    } catch (error) {
      testResults.push({
        test: 'API /api/admin/products',
        status: 'error',
        message: 'Error de conexión',
        details: error
      });
    }

    // Test 3: Verificar sesión actual
    try {
      const sessionResponse = await fetch('/api/auth/session');
      const sessionData = await sessionResponse.json();
      testResults.push({
        test: 'Sesión actual',
        status: sessionData?.user ? 'success' : 'warning',
        message: sessionData?.user 
          ? `Usuario: ${sessionData.user.email}` 
          : 'No hay sesión activa',
        details: sessionData
      });
    } catch (error) {
      testResults.push({
        test: 'Sesión actual',
        status: 'error',
        message: 'Error obteniendo sesión',
        details: error
      });
    }

    // Test 4: Verificar protección de middleware
    try {
      const protectedRoutes = [
        '/api/admin/orders',
        '/api/admin/users',
        '/api/admin/analytics'
      ];

      for (const route of protectedRoutes) {
        const response = await fetch(route);
        testResults.push({
          test: `Protección ${route}`,
          status: response.ok ? 'success' : 'error',
          message: response.ok 
            ? 'Acceso permitido' 
            : `Bloqueado (${response.status})`,
          details: { status: response.status, url: route }
        });
      }
    } catch (error) {
      testResults.push({
        test: 'Protección de rutas',
        status: 'error',
        message: 'Error probando rutas protegidas',
        details: error
      });
    }

    setResults(testResults);
    setTesting(false);
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'success':
        return <CheckCircle className="w-5 h-5 text-green-500" />;
      case 'error':
        return <XCircle className="w-5 h-5 text-red-500" />;
      case 'warning':
        return <AlertTriangle className="w-5 h-5 text-yellow-500" />;
      default:
        return <Shield className="w-5 h-5 text-gray-500" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'success':
        return 'bg-green-50 border-green-200';
      case 'error':
        return 'bg-red-50 border-red-200';
      case 'warning':
        return 'bg-yellow-50 border-yellow-200';
      default:
        return 'bg-gray-50 border-gray-200';
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-4xl mx-auto px-4">
        {/* Header */}
        <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
          <div className="flex items-center gap-3 mb-4">
            <Shield className="w-8 h-8 text-blaze-orange-600" />
            <div>
              <h1 className="text-2xl font-bold text-gray-900">
                Test de Protección Admin
              </h1>
              <p className="text-gray-600">
                Verificar que solo santiago@xor.com.ar tenga acceso al panel administrativo
              </p>
            </div>
          </div>

          <button
            onClick={runTests}
            disabled={testing}
            className="bg-blaze-orange-600 hover:bg-blaze-orange-700 disabled:bg-gray-400 text-white px-6 py-2 rounded-lg font-medium transition-colors"
          >
            {testing ? 'Ejecutando Tests...' : 'Ejecutar Tests de Seguridad'}
          </button>
        </div>

        {/* Results */}
        {results.length > 0 && (
          <div className="bg-white rounded-lg shadow-sm p-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">
              Resultados de las Pruebas
            </h2>

            <div className="space-y-4">
              {results.map((result, index) => (
                <div
                  key={index}
                  className={`border rounded-lg p-4 ${getStatusColor(result.status)}`}
                >
                  <div className="flex items-start gap-3">
                    {getStatusIcon(result.status)}
                    <div className="flex-1">
                      <h3 className="font-semibold text-gray-900">
                        {result.test}
                      </h3>
                      <p className="text-gray-700 mt-1">
                        {result.message}
                      </p>
                      {result.details && (
                        <details className="mt-2">
                          <summary className="text-sm text-gray-600 cursor-pointer">
                            Ver detalles
                          </summary>
                          <pre className="mt-2 text-xs bg-gray-100 p-2 rounded overflow-auto">
                            {JSON.stringify(result.details, null, 2)}
                          </pre>
                        </details>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Summary */}
            <div className="mt-6 p-4 bg-gray-100 rounded-lg">
              <h3 className="font-semibold text-gray-900 mb-2">Resumen</h3>
              <div className="grid grid-cols-3 gap-4 text-center">
                <div>
                  <div className="text-2xl font-bold text-green-600">
                    {results.filter(r => r.status === 'success').length}
                  </div>
                  <div className="text-sm text-gray-600">Exitosos</div>
                </div>
                <div>
                  <div className="text-2xl font-bold text-red-600">
                    {results.filter(r => r.status === 'error').length}
                  </div>
                  <div className="text-sm text-gray-600">Errores</div>
                </div>
                <div>
                  <div className="text-2xl font-bold text-yellow-600">
                    {results.filter(r => r.status === 'warning').length}
                  </div>
                  <div className="text-sm text-gray-600">Advertencias</div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Instructions */}
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-6 mt-6">
          <h3 className="font-semibold text-blue-900 mb-2">
            Instrucciones de Prueba
          </h3>
          <div className="text-blue-800 space-y-2">
            <p>
              <strong>Para usuario admin (santiago@xor.com.ar):</strong> 
              Todos los tests deben ser exitosos (verde).
            </p>
            <p>
              <strong>Para usuarios no-admin:</strong> 
              Los accesos a /admin y APIs admin deben fallar (rojo).
            </p>
            <p>
              <strong>Sin autenticación:</strong> 
              Debe redirigir a login o mostrar 401/403.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}









