/**
 * Sistema de tracking en tiempo real para drivers
 * Maneja geolocalización continua, recálculo de rutas y actualizaciones de progreso
 */

'use client';

import React, { useEffect, useRef, useState, useCallback } from 'react';
import { MapPin, AlertCircle, RefreshCw, Wifi, WifiOff } from 'lucide-react';
import { cn } from '@/lib/core/utils';
import {
  GeolocationTracker,
  GeolocationPosition,
  GeolocationError,
  HIGH_ACCURACY_OPTIONS,
  isGeolocationSupported
} from '@/lib/utils/geolocation';

interface TrackingData {
  driverId: string;
  orderId: string;
  currentLocation: { lat: number; lng: number };
  timestamp: Date;
  speed: number;
  heading: number;
  accuracy: number;
  status: 'en_route' | 'arrived' | 'delayed' | 'offline';
}

interface RealTimeTrackerProps {
  driverId: string;
  orderId: string;
  currentLocation: { lat: number; lng: number } | null;
  plannedRoute: google.maps.DirectionsResult | null;
  isNavigating: boolean;
  onLocationUpdate: (location: { lat: number; lng: number }) => void;
  onRouteDeviation: (deviation: number) => void;
  onNeedRecalculation: () => void;
  className?: string;
}

export function RealTimeTracker({
  driverId,
  orderId,
  currentLocation,
  plannedRoute,
  isNavigating,
  onLocationUpdate,
  onRouteDeviation,
  onNeedRecalculation,
  className
}: RealTimeTrackerProps) {
  const [isTracking, setIsTracking] = useState(false);
  const [trackingAccuracy, setTrackingAccuracy] = useState<number>(0);
  const [lastUpdateTime, setLastUpdateTime] = useState<Date | null>(null);
  const [connectionStatus, setConnectionStatus] = useState<'online' | 'offline'>('online');
  const [deviationDistance, setDeviationDistance] = useState<number>(0);
  const [trackingHistory, setTrackingHistory] = useState<TrackingData[]>([]);
  const [geolocationError, setGeolocationError] = useState<string | null>(null);

  const trackerRef = useRef<GeolocationTracker | null>(null);
  const updateIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const lastLocationRef = useRef<{ lat: number; lng: number } | null>(null);

  // Configuración de tracking
  const TRACKING_INTERVAL = 5000; // 5 segundos
  const DEVIATION_THRESHOLD = 100; // 100 metros
  const MAX_ACCURACY_THRESHOLD = 50; // 50 metros

  // Iniciar/detener tracking basado en estado de navegación
  useEffect(() => {
    if (isNavigating) {
      startRealTimeTracking();
    } else {
      stopRealTimeTracking();
    }

    return () => stopRealTimeTracking();
  }, [isNavigating]);

  // Monitorear conectividad
  useEffect(() => {
    const handleOnline = () => setConnectionStatus('online');
    const handleOffline = () => setConnectionStatus('offline');

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  // Calcular desviación de la ruta planificada
  const calculateRouteDeviation = useCallback((
    currentPos: { lat: number; lng: number },
    route: google.maps.DirectionsResult
  ): number => {
    if (!route.routes[0] || !window.google) return 0;

    const routePath = route.routes[0].overview_path;
    if (!routePath || routePath.length === 0) return 0;

    let minDistance = Infinity;
    const currentLatLng = new google.maps.LatLng(currentPos.lat, currentPos.lng);

    // Encontrar el punto más cercano en la ruta
    for (let i = 0; i < routePath.length - 1; i++) {
      const segmentStart = routePath[i];
      const segmentEnd = routePath[i + 1];
      
      // Calcular distancia al segmento de línea
      const distance = google.maps.geometry.spherical.computeDistanceBetween(
        currentLatLng,
        segmentStart
      );
      
      minDistance = Math.min(minDistance, distance);
    }

    return minDistance;
  }, []);

  // Enviar actualización de progreso a la base de datos
  const sendProgressUpdate = useCallback(async (trackingData: TrackingData) => {
    if (connectionStatus === 'offline') return;

    try {
      const response = await fetch('/api/driver/tracking/update', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(trackingData),
      });

      if (!response.ok) {
        throw new Error('Failed to update tracking data');
      }

      setLastUpdateTime(new Date());
    } catch (error) {
      console.error('Error updating tracking data:', error);
    }
  }, [connectionStatus]);

  // Procesar nueva ubicación
  const processLocationUpdate = useCallback((position: GeolocationPosition) => {
    const newLocation = {
      lat: position.lat,
      lng: position.lng
    };

    const accuracy = position.accuracy || 0;
    const speed = (position.speed || 0) * 3.6; // Convertir m/s a km/h
    const heading = position.heading || 0;

    setTrackingAccuracy(accuracy);
    setGeolocationError(null); // Limpiar errores previos

    // Solo procesar si la precisión es aceptable
    if (accuracy > MAX_ACCURACY_THRESHOLD) {
      console.warn(`Low GPS accuracy: ${accuracy}m`);
      return;
    }

    // Calcular desviación de la ruta si existe
    let deviation = 0;
    if (plannedRoute && currentLocation) {
      deviation = calculateRouteDeviation(newLocation, plannedRoute);
      setDeviationDistance(deviation);
      onRouteDeviation(deviation);

      // Solicitar recálculo si hay desviación significativa
      if (deviation > DEVIATION_THRESHOLD) {
        onNeedRecalculation();
      }
    }

    // Crear datos de tracking
    const trackingData: TrackingData = {
      driverId,
      orderId,
      currentLocation: newLocation,
      timestamp: new Date(),
      speed: speed, // Ya convertido a km/h
      heading,
      accuracy,
      status: deviation > DEVIATION_THRESHOLD ? 'delayed' : 'en_route'
    };

    // Actualizar historial local
    setTrackingHistory(prev => [...prev.slice(-50), trackingData]); // Mantener últimas 50 ubicaciones

    // Enviar actualización a la base de datos
    sendProgressUpdate(trackingData);

    // Notificar cambio de ubicación
    onLocationUpdate(newLocation);
    lastLocationRef.current = newLocation;

  }, [
    driverId,
    orderId,
    plannedRoute,
    currentLocation,
    calculateRouteDeviation,
    onRouteDeviation,
    onNeedRecalculation,
    onLocationUpdate,
    sendProgressUpdate
  ]);

  // Manejar errores de geolocalización con información detallada
  const handleGeolocationError = useCallback((error: GeolocationError) => {
    console.error('RealTime Tracker - Geolocation error details:', {
      code: error.code,
      message: error.message,
      type: error.type,
      retryable: error.retryable,
      timestamp: new Date(error.timestamp).toISOString(),
      originalError: error.originalError
    });

    setGeolocationError(error.message);

    // Solo detener tracking si el error no es retryable
    if (!error.retryable) {
      setIsTracking(false);
    }
  }, []);

  // Iniciar tracking en tiempo real
  const startRealTimeTracking = useCallback(() => {
    if (!isGeolocationSupported()) {
      setGeolocationError('Geolocalización no soportada en este navegador');
      return;
    }

    if (isTracking || trackerRef.current?.getIsTracking()) return;

    setIsTracking(true);
    setGeolocationError(null);

    // Crear nuevo tracker si no existe
    if (!trackerRef.current) {
      trackerRef.current = new GeolocationTracker(
        HIGH_ACCURACY_OPTIONS,
        processLocationUpdate,
        handleGeolocationError
      );
    } else {
      trackerRef.current.updateCallbacks(processLocationUpdate, handleGeolocationError);
    }

    // Iniciar tracking
    trackerRef.current.start();

    // Configurar intervalo de actualizaciones regulares
    updateIntervalRef.current = setInterval(() => {
      if (lastLocationRef.current) {
        // Forzar actualización periódica incluso sin cambio de ubicación
        const trackingData: TrackingData = {
          driverId,
          orderId,
          currentLocation: lastLocationRef.current,
          timestamp: new Date(),
          speed: 0,
          heading: 0,
          accuracy: trackingAccuracy,
          status: 'en_route'
        };
        sendProgressUpdate(trackingData);
      }
    }, TRACKING_INTERVAL);

  }, [isTracking, processLocationUpdate, driverId, orderId, trackingAccuracy, sendProgressUpdate]);

  // Detener tracking
  const stopRealTimeTracking = useCallback(() => {
    setIsTracking(false);

    if (trackerRef.current) {
      trackerRef.current.stop();
    }

    if (updateIntervalRef.current) {
      clearInterval(updateIntervalRef.current);
      updateIntervalRef.current = null;
    }
  }, []);

  // Función para forzar actualización manual
  const forceUpdate = useCallback(async () => {
    if (!isGeolocationSupported()) {
      setGeolocationError('Geolocalización no soportada');
      return;
    }

    try {
      const { getCurrentPosition } = await import('@/lib/utils/geolocation');
      const position = await getCurrentPosition(HIGH_ACCURACY_OPTIONS);
      processLocationUpdate(position);
    } catch (error) {
      console.error('Manual location update failed:', error);
      setGeolocationError('Error al obtener ubicación manual');
    }
  }, [processLocationUpdate]);

  if (!isNavigating) return null;

  return (
    <div className={cn(
      "bg-white rounded-lg shadow-lg border border-gray-200 p-4",
      className
    )}>
      {/* Header de estado */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center space-x-2">
          <div className={cn(
            "w-3 h-3 rounded-full",
            isTracking ? "bg-green-500 animate-pulse" : "bg-red-500"
          )} />
          <span className="font-medium text-gray-900">
            {isTracking ? 'Tracking Activo' : 'Tracking Inactivo'}
          </span>
        </div>

        <div className="flex items-center space-x-2">
          {connectionStatus === 'online' ? (
            <Wifi className="w-4 h-4 text-green-600" />
          ) : (
            <WifiOff className="w-4 h-4 text-red-600" />
          )}
          <button
            onClick={forceUpdate}
            className="p-1 rounded hover:bg-gray-100"
            title="Forzar actualización"
          >
            <RefreshCw className="w-4 h-4 text-gray-600" />
          </button>
        </div>
      </div>

      {/* Métricas de tracking */}
      <div className="grid grid-cols-2 gap-4 text-sm">
        <div>
          <div className="text-gray-600">Precisión GPS</div>
          <div className={cn(
            "font-medium",
            trackingAccuracy <= 10 ? "text-green-600" :
            trackingAccuracy <= 25 ? "text-yellow-600" : "text-red-600"
          )}>
            ±{Math.round(trackingAccuracy)}m
          </div>
        </div>

        <div>
          <div className="text-gray-600">Última actualización</div>
          <div className="font-medium text-gray-900">
            {lastUpdateTime ? lastUpdateTime.toLocaleTimeString('es-ES') : 'Nunca'}
          </div>
        </div>

        <div>
          <div className="text-gray-600">Desviación de ruta</div>
          <div className={cn(
            "font-medium",
            deviationDistance <= 50 ? "text-green-600" :
            deviationDistance <= 100 ? "text-yellow-600" : "text-red-600"
          )}>
            {Math.round(deviationDistance)}m
          </div>
        </div>

        <div>
          <div className="text-gray-600">Estado</div>
          <div className="font-medium text-gray-900">
            {connectionStatus === 'online' ? 'En línea' : 'Sin conexión'}
          </div>
        </div>
      </div>

      {/* Alerta de error de geolocalización */}
      {geolocationError && (
        <div className="mt-4 flex items-center space-x-2 bg-red-50 border border-red-200 rounded-lg p-3">
          <AlertCircle className="w-5 h-5 text-red-600" />
          <div className="text-sm text-red-800">
            <div className="font-medium">Error de GPS</div>
            <div>{geolocationError}</div>
          </div>
        </div>
      )}

      {/* Alerta de desviación */}
      {deviationDistance > DEVIATION_THRESHOLD && !geolocationError && (
        <div className="mt-4 flex items-center space-x-2 bg-yellow-50 border border-yellow-200 rounded-lg p-3">
          <AlertCircle className="w-5 h-5 text-yellow-600" />
          <div className="text-sm text-yellow-800">
            <div className="font-medium">Desviación detectada</div>
            <div>Te has alejado {Math.round(deviationDistance)}m de la ruta planificada</div>
          </div>
        </div>
      )}
    </div>
  );
}









