/**
 * Hook para geolocalización automática y detección de zona de entrega
 * Detecta la ubicación del usuario y determina la zona de entrega más cercana
 */

'use client';

import { useState, useEffect, useCallback } from 'react';

export interface DeliveryZone {
  id: string;
  name: string;
  available: boolean;
  coordinates?: {
    lat: number;
    lng: number;
  };
  radius?: number; // Radio en km
}

export interface GeolocationState {
  location: {
    lat: number;
    lng: number;
  } | null;
  isLoading: boolean;
  error: string | null;
  permissionStatus: 'granted' | 'denied' | 'prompt' | 'unknown';
  detectedZone: DeliveryZone | null;
}

// Zonas de entrega con coordenadas aproximadas
const DELIVERY_ZONES: DeliveryZone[] = [
  {
    id: "cordoba-capital",
    name: "Córdoba Capital",
    available: true,
    coordinates: { lat: -31.4201, lng: -64.1888 },
    radius: 15
  },
  {
    id: "cordoba-interior",
    name: "Interior de Córdoba",
    available: true,
    coordinates: { lat: -31.4201, lng: -64.1888 },
    radius: 100
  },
  {
    id: "buenos-aires",
    name: "Buenos Aires",
    available: false,
    coordinates: { lat: -34.6118, lng: -58.3960 },
    radius: 50
  },
  {
    id: "rosario",
    name: "Rosario",
    available: false,
    coordinates: { lat: -32.9442, lng: -60.6505 },
    radius: 30
  },
];

// Función para calcular distancia entre dos puntos (fórmula de Haversine)
function calculateDistance(lat1: number, lng1: number, lat2: number, lng2: number): number {
  const R = 6371; // Radio de la Tierra en km
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLng = (lng2 - lng1) * Math.PI / 180;
  const a = 
    Math.sin(dLat/2) * Math.sin(dLat/2) +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * 
    Math.sin(dLng/2) * Math.sin(dLng/2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
  return R * c;
}

// Función para detectar la zona más cercana
function detectNearestZone(userLat: number, userLng: number): DeliveryZone | null {
  console.log('🗺️ === DETECTING NEAREST ZONE ===');
  console.log('🗺️ User coordinates:', userLat, userLng);

  let nearestZone: DeliveryZone | null = null;
  let minDistance = Infinity;

  for (const zone of DELIVERY_ZONES) {
    console.log('🗺️ Checking zone:', zone.name, zone.id);

    if (zone.coordinates) {
      const distance = calculateDistance(
        userLat,
        userLng,
        zone.coordinates.lat,
        zone.coordinates.lng
      );

      console.log(`🗺️ Distance to ${zone.name}: ${distance.toFixed(2)}km (radius: ${zone.radius}km)`);

      // Verificar si está dentro del radio de la zona
      if (zone.radius && distance <= zone.radius && distance < minDistance) {
        console.log(`🗺️ ✅ ${zone.name} is within range and closer!`);
        nearestZone = zone;
        minDistance = distance;
      } else {
        console.log(`🗺️ ❌ ${zone.name} is out of range or farther`);
      }
    } else {
      console.log(`🗺️ ⚠️ ${zone.name} has no coordinates`);
    }
  }

  // Si no encuentra una zona específica, usar Córdoba Interior como fallback
  const fallbackZone = DELIVERY_ZONES.find(zone => zone.id === "cordoba-interior");
  const result = nearestZone || fallbackZone || null;

  console.log('🗺️ Final result:', result?.name || 'null');
  console.log('🗺️ === ZONE DETECTION COMPLETE ===');

  return result;
}

export const useGeolocation = () => {
  const [state, setState] = useState<GeolocationState>({
    location: null,
    isLoading: false,
    error: null,
    permissionStatus: 'unknown',
    detectedZone: null
  });

  // Función para solicitar geolocalización
  const requestLocation = useCallback(() => {
    console.log('🗺️ ===== REQUEST LOCATION START =====');
    console.log('🗺️ Navigator geolocation available:', !!navigator.geolocation);

    if (!navigator.geolocation) {
      console.log('🗺️ ❌ Geolocation not supported');
      setState(prev => ({
        ...prev,
        error: 'Geolocalización no soportada por este navegador',
        permissionStatus: 'denied'
      }));
      return;
    }

    console.log('🗺️ ✅ Starting geolocation request...');
    console.log('🗺️ Setting loading state to true...');

    setState(prev => {
      const newState = { ...prev, isLoading: true, error: null };
      console.log('🗺️ Loading state updated:', newState);
      return newState;
    });

    // Usar Promise para mejor manejo de errores
    const getCurrentPositionPromise = () => {
      return new Promise<GeolocationPosition>((resolve, reject) => {
        navigator.geolocation.getCurrentPosition(resolve, reject, {
          enableHighAccuracy: false,
          timeout: 30000,
          maximumAge: 0
        });
      });
    };

    // Ejecutar con async/await para mejor control
    getCurrentPositionPromise()
      .then((position) => {
        console.log('🗺️ ===== GEOLOCATION SUCCESS =====');
        console.log('🗺️ Position object:', position);
        console.log('🗺️ Coordinates:', position.coords);

        const { latitude, longitude, accuracy } = position.coords;
        console.log('🗺️ Lat:', latitude, 'Lng:', longitude, 'Accuracy:', accuracy, 'meters');

        const detectedZone = detectNearestZone(latitude, longitude);
        console.log('🗺️ Detected zone result:', detectedZone);

        console.log('🗺️ Updating state with new location...');

        // Usar setTimeout para asegurar que el setState se ejecute en el próximo tick
        setTimeout(() => {
          setState(prev => {
            const newState = {
              ...prev,
              location: { lat: latitude, lng: longitude },
              detectedZone,
              isLoading: false,
              permissionStatus: 'granted' as const,
              error: null
            };
            console.log('🗺️ New state:', newState);
            return newState;
          });
          console.log('🗺️ ===== STATE UPDATE COMPLETE =====');
        }, 0);
      })
      .catch((error) => {
        console.log('🗺️ Geolocation error:', error);
        let errorMessage = 'Error al obtener ubicación';
        let permissionStatus: 'denied' | 'unknown' = 'unknown';

        switch (error.code) {
          case error.PERMISSION_DENIED:
            errorMessage = 'Permisos de ubicación denegados';
            permissionStatus = 'denied';
            console.log('🗺️ Permission denied by user');
            break;
          case error.POSITION_UNAVAILABLE:
            errorMessage = 'Ubicación no disponible';
            console.log('🗺️ Position unavailable');
            break;
          case error.TIMEOUT:
            errorMessage = 'Tiempo de espera agotado';
            console.log('🗺️ Geolocation timeout');
            break;
        }

        // También usar setTimeout para el manejo de errores
        setTimeout(() => {
          setState(prev => ({
            ...prev,
            error: errorMessage,
            isLoading: false,
            permissionStatus
          }));
        }, 0);
      });
  }, []);

  // Verificar permisos al montar el componente
  useEffect(() => {
    console.log('🗺️ useGeolocation useEffect running');

    if ('permissions' in navigator) {
      console.log('🗺️ Permissions API supported, checking permissions...');
      navigator.permissions.query({ name: 'geolocation' }).then((result) => {
        console.log('🗺️ Permission status:', result.state);
        setState(prev => ({ ...prev, permissionStatus: result.state as any }));

        // Si ya tiene permisos, solicitar ubicación automáticamente
        if (result.state === 'granted') {
          console.log('🗺️ Permission already granted, will request location on user interaction');
          // No solicitar automáticamente para evitar bucles infinitos
        } else if (result.state === 'prompt') {
          console.log('🗺️ Permission prompt available, will request on user interaction');
          // No solicitar automáticamente si es 'prompt' para evitar popup inesperado
        } else {
          console.log('🗺️ Permission denied or unavailable, status:', result.state);
        }
      }).catch((error) => {
        console.log('🗺️ Error checking geolocation permissions:', error);
        setState(prev => ({ ...prev, permissionStatus: 'unknown' }));
      });
    } else {
      console.log('🗺️ Permissions API not supported, will try direct geolocation');
      setState(prev => ({ ...prev, permissionStatus: 'unknown' }));
    }
  }, []); // Sin dependencias para evitar bucles

  // Función para obtener todas las zonas disponibles
  const getAvailableZones = useCallback(() => {
    return DELIVERY_ZONES;
  }, []);

  // Función para seleccionar zona manualmente
  const selectZone = useCallback((zoneId: string) => {
    const zone = DELIVERY_ZONES.find(z => z.id === zoneId);
    if (zone) {
      setState(prev => ({ ...prev, detectedZone: zone }));
    }
  }, []);

  // Función de test para simular geolocalización exitosa
  const testLocation = useCallback((lat: number = -31.4201, lng: number = -64.1888) => {
    console.log('🧪 ===== TEST LOCATION SIMULATION =====');
    console.log('🧪 Simulating location:', lat, lng);

    const detectedZone = detectNearestZone(lat, lng);
    console.log('🧪 Simulated detected zone:', detectedZone);

    console.log('🧪 Updating state with simulated location...');
    setState(prev => {
      const newState = {
        ...prev,
        location: { lat, lng },
        detectedZone,
        isLoading: false,
        permissionStatus: 'granted' as const,
        error: null
      };
      console.log('🧪 Simulated new state:', newState);
      return newState;
    });

    console.log('🧪 ===== TEST SIMULATION COMPLETE =====');
  }, []);

  return {
    ...state,
    requestLocation,
    getAvailableZones,
    selectZone,
    deliveryZones: DELIVERY_ZONES,
    testLocation // Función de test para debugging
  };
};
