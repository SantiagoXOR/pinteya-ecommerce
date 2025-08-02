"use client";

import { useUser, useAuth } from '@clerk/nextjs';
import { useEffect, useState } from 'react';

/**
 * PÁGINA DE DIAGNÓSTICO DE AUTENTICACIÓN ADMIN
 * 
 * Esta página ayuda a diagnosticar problemas de autenticación
 * y verificación de roles en el área admin
 */
export default function AdminDebugAuthPage() {
  const { user, isLoaded, isSignedIn } = useUser();
  const { getToken, sessionId, userId } = useAuth();
  const [logs, setLogs] = useState<string[]>([]);
  const [tokenInfo, setTokenInfo] = useState<any>(null);

  const addLog = (message: string) => {
    const timestamp = new Date().toLocaleTimeString();
    setLogs(prev => [...prev, `[${timestamp}] ${message}`]);
  };

  useEffect(() => {
    addLog('🔍 Página de diagnóstico de autenticación admin cargada');
    addLog(`📍 isLoaded: ${isLoaded}`);
    addLog(`🔐 isSignedIn: ${isSignedIn}`);
    addLog(`🆔 userId: ${userId || 'null'}`);
    addLog(`📋 sessionId: ${sessionId || 'null'}`);
  }, [isLoaded, isSignedIn, userId, sessionId]);

  useEffect(() => {
    if (user) {
      addLog(`👤 Usuario cargado: ${user.id}`);
      addLog(`📧 Email: ${user.primaryEmailAddress?.emailAddress || 'null'}`);
      addLog(`🎭 Public Role: ${user.publicMetadata?.role as string || 'null'}`);
      addLog(`🔒 Private Role: ${user.privateMetadata?.role as string || 'null'}`);
      addLog(`📅 Created: ${user.createdAt}`);
      addLog(`🕐 Last Sign In: ${user.lastSignInAt}`);
    }
  }, [user]);

  const getTokenDetails = async () => {
    try {
      addLog('🔄 Obteniendo detalles del token...');
      const token = await getToken();
      const tokenWithClaims = await getToken({ template: 'integration_clerk' });
      
      setTokenInfo({
        token: token ? 'Token exists' : 'No token',
        tokenWithClaims: tokenWithClaims ? 'Token with claims exists' : 'No token with claims',
        timestamp: new Date().toISOString()
      });
      
      addLog('✅ Detalles del token obtenidos');
    } catch (error) {
      addLog(`❌ Error obteniendo token: ${error}`);
    }
  };

  const testApiCall = async () => {
    try {
      addLog('🧪 Probando llamada a API admin...');
      const response = await fetch('/api/admin/test', {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });
      
      addLog(`📊 Status: ${response.status}`);
      const data = await response.text();
      addLog(`📄 Response: ${data.substring(0, 100)}...`);
    } catch (error) {
      addLog(`❌ Error en API call: ${error}`);
    }
  };

  const clearLogs = () => {
    setLogs([]);
  };

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold text-gray-900 mb-8">
          🔍 Diagnóstico de Autenticación Admin
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
              <strong>User ID:</strong> {userId || 'null'}
            </div>
            <div>
              <strong>Session ID:</strong> {sessionId || 'null'}
            </div>
            <div>
              <strong>Email:</strong> {user?.primaryEmailAddress?.emailAddress || 'null'}
            </div>
            <div>
              <strong>Public Role:</strong> {user?.publicMetadata?.role as string || 'null'}
            </div>
            <div>
              <strong>Private Role:</strong> {user?.privateMetadata?.role as string || 'null'}
            </div>
            <div>
              <strong>Created At:</strong> {user?.createdAt?.toLocaleString() || 'null'}
            </div>
          </div>
        </div>

        {/* Metadata Completa */}
        <div className="bg-white rounded-lg shadow-md p-6 mb-6">
          <h2 className="text-xl font-semibold mb-4">📋 Metadata Completa</h2>
          <div className="space-y-4">
            <div>
              <h3 className="font-semibold">Public Metadata:</h3>
              <pre className="bg-gray-100 p-4 rounded text-sm overflow-auto">
                {JSON.stringify(user?.publicMetadata, null, 2)}
              </pre>
            </div>
            <div>
              <h3 className="font-semibold">Private Metadata:</h3>
              <pre className="bg-gray-100 p-4 rounded text-sm overflow-auto">
                {JSON.stringify(user?.privateMetadata, null, 2)}
              </pre>
            </div>
            <div>
              <h3 className="font-semibold">Unsafe Metadata:</h3>
              <pre className="bg-gray-100 p-4 rounded text-sm overflow-auto">
                {JSON.stringify(user?.unsafeMetadata, null, 2)}
              </pre>
            </div>
          </div>
        </div>

        {/* Pruebas */}
        <div className="bg-white rounded-lg shadow-md p-6 mb-6">
          <h2 className="text-xl font-semibold mb-4">🧪 Pruebas</h2>
          <div className="space-y-2 mb-4">
            <button
              onClick={getTokenDetails}
              className="bg-blue-500 text-white px-4 py-2 rounded mr-2"
            >
              Obtener Token Details
            </button>
            <button
              onClick={testApiCall}
              className="bg-green-500 text-white px-4 py-2 rounded mr-2"
            >
              Probar API Admin
            </button>
          </div>

          {/* Resultados de Token */}
          {tokenInfo && (
            <div className="mt-4">
              <h3 className="font-semibold mb-2">🔑 Token Info:</h3>
              <pre className="bg-gray-100 p-4 rounded text-sm overflow-auto">
                {JSON.stringify(tokenInfo, null, 2)}
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
              <strong>URL actual:</strong> {typeof window !== 'undefined' ? window.location.href : 'N/A'}
            </div>
            <div>
              <strong>Pathname:</strong> {typeof window !== 'undefined' ? window.location.pathname : 'N/A'}
            </div>
            <div>
              <strong>User Agent:</strong> {typeof navigator !== 'undefined' ? navigator.userAgent.substring(0, 50) + '...' : 'N/A'}
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
