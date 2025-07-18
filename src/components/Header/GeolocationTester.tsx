/**
 * Componente de prueba para verificar la funcionalidad de geolocalización
 * Útil para debugging y testing manual
 */

'use client';

import React, { useState } from 'react';
import { useGeolocation } from '@/hooks/useGeolocation';
import { MapPin, Loader2, CheckCircle, XCircle, AlertCircle } from 'lucide-react';

const GeolocationTester = () => {
  const {
    detectedZone,
    requestLocation,
    permissionStatus,
    isLoading,
    error,
    location,
    getAvailableZones,
    selectZone
  } = useGeolocation();

  const [logs, setLogs] = useState<string[]>([]);

  const addLog = (message: string) => {
    const timestamp = new Date().toLocaleTimeString();
    setLogs(prev => [`[${timestamp}] ${message}`, ...prev.slice(0, 9)]);
  };

  const handleTestLocation = () => {
    addLog('🗺️ Iniciando test de geolocalización...');
    requestLocation();
  };

  const handleSelectZone = (zoneId: string) => {
    addLog(`🗺️ Seleccionando zona manualmente: ${zoneId}`);
    selectZone(zoneId);
  };

  const getStatusIcon = () => {
    if (isLoading) return <Loader2 className="w-5 h-5 animate-spin text-blue-500" />;
    if (permissionStatus === 'granted') return <CheckCircle className="w-5 h-5 text-green-500" />;
    if (permissionStatus === 'denied') return <XCircle className="w-5 h-5 text-red-500" />;
    return <AlertCircle className="w-5 h-5 text-yellow-500" />;
  };

  const getStatusColor = () => {
    if (permissionStatus === 'granted') return 'text-green-600 bg-green-50';
    if (permissionStatus === 'denied') return 'text-red-600 bg-red-50';
    if (isLoading) return 'text-blue-600 bg-blue-50';
    return 'text-yellow-600 bg-yellow-50';
  };

  return (
    <div className="max-w-2xl mx-auto p-6 bg-white rounded-lg shadow-lg">
      <h2 className="text-2xl font-bold mb-6 text-gray-800">
        🧪 Geolocation Tester
      </h2>

      {/* Estado Actual */}
      <div className={`p-4 rounded-lg mb-6 ${getStatusColor()}`}>
        <div className="flex items-center gap-3 mb-2">
          {getStatusIcon()}
          <h3 className="font-semibold">Estado Actual</h3>
        </div>
        <div className="space-y-1 text-sm">
          <p><strong>Permisos:</strong> {permissionStatus}</p>
          <p><strong>Cargando:</strong> {isLoading ? 'Sí' : 'No'}</p>
          <p><strong>Error:</strong> {error || 'Ninguno'}</p>
          <p><strong>Ubicación:</strong> {location ? `${location.lat}, ${location.lng}` : 'No detectada'}</p>
          <p><strong>Zona detectada:</strong> {detectedZone?.name || 'Ninguna'}</p>
        </div>
      </div>

      {/* Controles */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
        <button
          onClick={handleTestLocation}
          disabled={isLoading}
          className="flex items-center justify-center gap-2 px-4 py-3 bg-blue-500 text-white rounded-lg hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          <MapPin className="w-4 h-4" />
          {isLoading ? 'Detectando...' : 'Detectar Ubicación'}
        </button>

        <button
          onClick={() => addLog('🔄 Refrescando página...')}
          className="flex items-center justify-center gap-2 px-4 py-3 bg-gray-500 text-white rounded-lg hover:bg-gray-600 transition-colors"
        >
          Limpiar Logs
        </button>
      </div>

      {/* Zonas Disponibles */}
      <div className="mb-6">
        <h3 className="font-semibold mb-3 text-gray-800">Zonas Disponibles</h3>
        <div className="grid grid-cols-2 gap-2">
          {getAvailableZones().map((zone) => (
            <button
              key={zone.id}
              onClick={() => handleSelectZone(zone.id)}
              className={`p-2 text-sm rounded border transition-colors ${
                detectedZone?.id === zone.id
                  ? 'bg-blue-100 border-blue-300 text-blue-700'
                  : 'bg-gray-50 border-gray-200 hover:bg-gray-100'
              }`}
            >
              {zone.name}
              {zone.available ? ' ✅' : ' ❌'}
            </button>
          ))}
        </div>
      </div>

      {/* Logs */}
      <div>
        <h3 className="font-semibold mb-3 text-gray-800">Logs de Actividad</h3>
        <div className="bg-gray-900 text-green-400 p-4 rounded-lg h-48 overflow-y-auto font-mono text-sm">
          {logs.length === 0 ? (
            <p className="text-gray-500">No hay logs aún...</p>
          ) : (
            logs.map((log, index) => (
              <div key={index} className="mb-1">
                {log}
              </div>
            ))
          )}
        </div>
      </div>

      {/* Información del Navegador */}
      <div className="mt-6 p-4 bg-gray-50 rounded-lg">
        <h3 className="font-semibold mb-2 text-gray-800">Información del Navegador</h3>
        <div className="text-sm space-y-1 text-gray-600">
          <p><strong>Geolocation API:</strong> {'geolocation' in navigator ? '✅ Soportado' : '❌ No soportado'}</p>
          <p><strong>Permissions API:</strong> {'permissions' in navigator ? '✅ Soportado' : '❌ No soportado'}</p>
          <p><strong>HTTPS:</strong> {typeof window !== 'undefined' && window.location?.protocol === 'https:' ? '✅ Seguro' : '⚠️ HTTP (puede requerir HTTPS)'}</p>
          <p><strong>User Agent:</strong> {navigator.userAgent.substring(0, 50)}...</p>
        </div>
      </div>

      {/* Instrucciones */}
      <div className="mt-6 p-4 bg-blue-50 rounded-lg">
        <h3 className="font-semibold mb-2 text-blue-800">📋 Instrucciones de Prueba</h3>
        <ol className="text-sm text-blue-700 space-y-1">
          <li>1. Haz click en "Detectar Ubicación" para solicitar permisos</li>
          <li>2. Acepta o rechaza los permisos en el popup del navegador</li>
          <li>3. Observa los logs y el estado actual</li>
          <li>4. Prueba seleccionar zonas manualmente</li>
          <li>5. Verifica que la información se actualiza correctamente</li>
        </ol>
      </div>
    </div>
  );
};

export default GeolocationTester;
