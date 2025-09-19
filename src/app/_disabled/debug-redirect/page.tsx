"use client";

import { useEffect, useState } from 'react';
import { useUser } from '@clerk/nextjs';
import { useRouter, usePathname } from 'next/navigation';

/**
 * PÁGINA DE DIAGNÓSTICO DE REDIRECCIONES
 * 
 * Esta página ayuda a diagnosticar problemas de redirección
 * y muestra información detallada sobre el estado de autenticación
 */
export default function DebugRedirectPage() {
  const { user, isLoaded, isSignedIn } = useUser();
  const router = useRouter();
  const pathname = usePathname();
  const [logs, setLogs] = useState<string[]>([]);
  const [testResults, setTestResults] = useState<any>({});

  const addLog = (message: string) => {
    const timestamp = new Date().toLocaleTimeString();
    setLogs(prev => [...prev, `[${timestamp}] ${message}`]);
  };

  useEffect(() => {
    addLog('🔍 Página de diagnóstico cargada');
    addLog(`📍 Pathname actual: ${pathname}`);
    addLog(`🔐 isLoaded: ${isLoaded}`);
    addLog(`👤 isSignedIn: ${isSignedIn}`);
    addLog(`🆔 userId: ${user?.id || 'null'}`);
    addLog(`🎭 userRole: ${user?.publicMetadata?.role || 'null'}`);
  }, [isLoaded, isSignedIn, user, pathname]);

  const testRedirect = async (path: string) => {
    addLog(`🧪 Probando redirección a: ${path}`);
    try {
      const response = await fetch(path, { 
        method: 'HEAD',
        redirect: 'manual'
      });
      addLog(`📊 Status: ${response.status}`);
      addLog(`🔄 Redirect: ${response.headers.get('location') || 'none'}`);
      
      setTestResults(prev => ({
        ...prev,
        [path]: {
          status: response.status,
          redirect: response.headers.get('location'),
          timestamp: new Date().toISOString()
        }
      }));
    } catch (error) {
      addLog(`❌ Error: ${error}`);
    }
  };

  const clearLogs = () => {
    setLogs([]);
  };

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold text-gray-900 mb-8">
          🔍 Diagnóstico de Redirecciones - Pinteya E-commerce
        </h1>

        {/* Estado de Autenticación */}
        <div className="bg-white rounded-lg shadow-md p-6 mb-6">
          <h2 className="text-xl font-semibold mb-4">🔐 Estado de Autenticación</h2>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <strong>isLoaded:</strong> {isLoaded ? '✅' : '❌'}
            </div>
            <div>
              <strong>isSignedIn:</strong> {isSignedIn ? '✅' : '❌'}
            </div>
            <div>
              <strong>User ID:</strong> {user?.id || 'null'}
            </div>
            <div>
              <strong>Email:</strong> {user?.primaryEmailAddress?.emailAddress || 'null'}
            </div>
            <div>
              <strong>Role (public):</strong> {user?.publicMetadata?.role as string || 'null'}
            </div>
            <div>
              <strong>Role (private):</strong> {user?.privateMetadata?.role as string || 'null'}
            </div>
          </div>
        </div>

        {/* Pruebas de Redirección */}
        <div className="bg-white rounded-lg shadow-md p-6 mb-6">
          <h2 className="text-xl font-semibold mb-4">🧪 Pruebas de Redirección</h2>
          <div className="space-y-2 mb-4">
            <button
              onClick={() => testRedirect('/my-account')}
              className="bg-blue-500 text-white px-4 py-2 rounded mr-2"
            >
              Probar /my-account
            </button>
            <button
              onClick={() => testRedirect('/admin')}
              className="bg-green-500 text-white px-4 py-2 rounded mr-2"
            >
              Probar /admin
            </button>
            <button
              onClick={() => router.push('/my-account')}
              className="bg-red-500 text-white px-4 py-2 rounded mr-2"
            >
              Ir a /my-account
            </button>
            <button
              onClick={() => router.push('/admin')}
              className="bg-purple-500 text-white px-4 py-2 rounded mr-2"
            >
              Ir a /admin
            </button>
          </div>

          {/* Resultados de Pruebas */}
          {Object.keys(testResults).length > 0 && (
            <div className="mt-4">
              <h3 className="font-semibold mb-2">📊 Resultados:</h3>
              <pre className="bg-gray-100 p-4 rounded text-sm overflow-auto">
                {JSON.stringify(testResults, null, 2)}
              </pre>
            </div>
          )}
        </div>

        {/* Logs */}
        <div className="bg-white rounded-lg shadow-md p-6">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-semibold">📝 Logs de Diagnóstico</h2>
            <button
              onClick={clearLogs}
              className="bg-gray-500 text-white px-4 py-2 rounded text-sm"
            >
              Limpiar Logs
            </button>
          </div>
          <div className="bg-black text-green-400 p-4 rounded font-mono text-sm h-64 overflow-auto">
            {logs.map((log, index) => (
              <div key={index}>{log}</div>
            ))}
          </div>
        </div>

        {/* Información del Sistema */}
        <div className="bg-white rounded-lg shadow-md p-6 mt-6">
          <h2 className="text-xl font-semibold mb-4">⚙️ Información del Sistema</h2>
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <strong>URL actual:</strong> {window.location.href}
            </div>
            <div>
              <strong>Pathname:</strong> {pathname}
            </div>
            <div>
              <strong>User Agent:</strong> {navigator.userAgent.substring(0, 50)}...
            </div>
            <div>
              <strong>Timestamp:</strong> {new Date().toISOString()}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}









