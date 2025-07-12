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
  let nearestZone: DeliveryZone | null = null;
  let minDistance = Infinity;

  for (const zone of DELIVERY_ZONES) {
    if (zone.coordinates) {
      const distance = calculateDistance(
        userLat, 
        userLng, 
        zone.coordinates.lat, 
        zone.coordinates.lng
      );
      
      // Verificar si está dentro del radio de la zona
      if (zone.radius && distance <= zone.radius && distance < minDistance) {
        nearestZone = zone;
        minDistance = distance;
      }
    }
  }

  // Si no encuentra una zona específica, usar Córdoba Interior como fallback
  return nearestZone || DELIVERY_ZONES.find(zone => zone.id === "cordoba-interior") || null;
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
    if (!navigator.geolocation) {
      setState(prev => ({
        ...prev,
        error: 'Geolocalización no soportada por este navegador',
        permissionStatus: 'denied'
      }));
      return;
    }

    setState(prev => ({ ...prev, isLoading: true, error: null }));

    navigator.geolocation.getCurrentPosition(
      (position) => {
        const { latitude, longitude } = position.coords;
        const detectedZone = detectNearestZone(latitude, longitude);
        
        setState(prev => ({
          ...prev,
          location: { lat: latitude, lng: longitude },
          detectedZone,
          isLoading: false,
          permissionStatus: 'granted'
        }));
      },
      (error) => {
        let errorMessage = 'Error al obtener ubicación';
        let permissionStatus: 'denied' | 'unknown' = 'unknown';

        switch (error.code) {
          case error.PERMISSION_DENIED:
            errorMessage = 'Permisos de ubicación denegados';
            permissionStatus = 'denied';
            break;
          case error.POSITION_UNAVAILABLE:
            errorMessage = 'Ubicación no disponible';
            break;
          case error.TIMEOUT:
            errorMessage = 'Tiempo de espera agotado';
            break;
        }

        setState(prev => ({
          ...prev,
          error: errorMessage,
          isLoading: false,
          permissionStatus
        }));
      },
      {
        enableHighAccuracy: false,
        timeout: 10000,
        maximumAge: 300000 // 5 minutos
      }
    );
  }, []);

  // Verificar permisos al montar el componente
  useEffect(() => {
    if ('permissions' in navigator) {
      navigator.permissions.query({ name: 'geolocation' }).then((result) => {
        setState(prev => ({ ...prev, permissionStatus: result.state as any }));
        
        // Si ya tiene permisos, solicitar ubicación automáticamente
        if (result.state === 'granted') {
          requestLocation();
        }
      });
    }
  }, [requestLocation]);

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

  return {
    ...state,
    requestLocation,
    getAvailableZones,
    selectZone,
    deliveryZones: DELIVERY_ZONES
  };
};
