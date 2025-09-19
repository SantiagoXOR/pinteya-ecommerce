/**
 * Componente de debugging en tiempo real para geolocalización
 * Se muestra temporalmente en el header para diagnosticar problemas
 */

'use client';

import React from 'react';
import { useGeolocation } from '@/hooks/useGeolocation';

const GeolocationDebugger = () => {
  const {
    detectedZone,
    requestLocation,
    permissionStatus,
    isLoading,
    error,
    location,
    getAvailableZones,
    testLocation
  } = useGeolocation();

  const [renderCount, setRenderCount] = React.useState(0);

  React.useEffect(() => {
    setRenderCount(prev => prev + 1);
  }, [detectedZone, permissionStatus, isLoading, error, location]); // Solo re-render cuando cambie el estado de geolocalización

  return (
    <div className="fixed top-0 left-0 right-0 z-[99999] bg-black/90 text-white p-2 text-xs font-mono">
      <div className="max-w-4xl mx-auto grid grid-cols-2 md:grid-cols-4 gap-2">
        <div>
          <strong>Renders:</strong> {renderCount}
        </div>
        <div>
          <strong>Status:</strong> {permissionStatus}
        </div>
        <div>
          <strong>Loading:</strong> {isLoading ? 'YES' : 'NO'}
        </div>
        <div>
          <strong>Error:</strong> {error ? 'YES' : 'NO'}
        </div>
        <div>
          <strong>Location:</strong> {location ? `${location.lat.toFixed(4)}, ${location.lng.toFixed(4)}` : 'NULL'}
        </div>
        <div>
          <strong>Zone:</strong> {detectedZone?.name || 'NULL'}
        </div>
        <div>
          <strong>Zone ID:</strong> {detectedZone?.id || 'NULL'}
        </div>
        <div className="flex gap-1">
          <button
            onClick={requestLocation}
            className="bg-blue-600 px-2 py-1 rounded text-xs hover:bg-blue-700"
            disabled={isLoading}
          >
            {isLoading ? 'Loading...' : 'Test Geo'}
          </button>
          <button
            onClick={() => {
              testLocation(-31.4201, -64.1888);
            }}
            className="bg-green-600 px-2 py-1 rounded text-xs hover:bg-green-700"
          >
            Force Test
          </button>
        </div>
      </div>
      
      {error && (
        <div className="mt-1 text-red-300">
          <strong>Error Details:</strong> {error instanceof Error ? error.message : String(error) || 'Error desconocido'}
        </div>
      )}
      
      <div className="mt-1 text-gray-300">
        <strong>Available Zones:</strong> {getAvailableZones().map(z => z.name).join(', ')}
      </div>
    </div>
  );
};

export default GeolocationDebugger;









