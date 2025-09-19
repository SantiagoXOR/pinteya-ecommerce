/**
 * Componente de mapa GPS para navegación en tiempo real
 * Integra Google Maps con navegación turn-by-turn y tracking de ubicación
 * Incluye dashboard de métricas, información de ruta y controles avanzados
 */

'use client';

import React, { useEffect, useRef, useState, useCallback } from 'react';
import { APIProvider, Map, Marker } from '@vis.gl/react-google-maps';
import { cn } from '@/lib/core/utils';
import { RouteInfoDashboard } from './RouteInfoDashboard';
import { TurnByTurnNavigation } from './TurnByTurnNavigation';
import { RealTimeTracker } from './RealTimeTracker';
import { AdvancedNavigationControls } from './AdvancedNavigationControls';
import { FloatingActionButtons } from './FloatingActionButtons';
import { NavigationModalOverlay, InfoModalOverlay, FullscreenModalOverlay } from './MobileModalOverlay';
import { useModal, useModalActions } from '@/contexts/ModalContext';
import GPSDebugInfo from './GPSDebugInfo';

interface RouteInfo {
  totalDistance: string;
  totalDuration: string;
  remainingDistance: string;
  remainingDuration: string;
  averageSpeed: number;
  currentSpeed: number;
  elapsedTime: number;
  eta: Date | null;
  trafficDelay: number;
}

interface RouteOptions {
  avoidTolls: boolean;
  avoidHighways: boolean;
  avoidFerries: boolean;
  travelMode: any; // Usar any en lugar de google.maps.TravelMode
  optimizeWaypoints: boolean;
  provideRouteAlternatives: boolean;
}

interface AlternativeRoute {
  routeIndex: number;
  summary: string;
  distance: string;
  duration: string;
  warnings: string[];
}

interface GPSNavigationMapProps {
  currentLocation: { lat: number; lng: number } | null;
  destination: any;
  waypoints: Array<{ lat: number; lng: number }>;
  isNavigating: boolean;
  driverId?: string;
  orderId?: string;
  onLocationUpdate: (location: { lat: number; lng: number }) => void;
  onRouteInfoUpdate?: (routeInfo: RouteInfo) => void;
  onRouteRecalculation?: () => void;
}

export function GPSNavigationMap({
  currentLocation,
  destination,
  waypoints,
  isNavigating,
  driverId = 'default-driver',
  orderId = 'default-order',
  onLocationUpdate,
  onRouteInfoUpdate,
  onRouteRecalculation
}: GPSNavigationMapProps) {
  const mapRef = useRef<any>(null);
  const directionsRendererRef = useRef<any>(null);
  const [directions, setDirections] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(false);
  const watchIdRef = useRef<number | null>(null);

  // Modal management
  const { modalState } = useModal();
  const modalActions = useModalActions();

  // Estados para información de ruta y métricas
  const [routeInfo, setRouteInfo] = useState<RouteInfo>({
    totalDistance: '0 km',
    totalDuration: '0 min',
    remainingDistance: '0 km',
    remainingDuration: '0 min',
    averageSpeed: 0,
    currentSpeed: 0,
    elapsedTime: 0,
    eta: null,
    trafficDelay: 0
  });
  const [startTime, setStartTime] = useState<Date | null>(null);
  const [showTrafficLayer, setShowTrafficLayer] = useState(true);
  const [trafficLayer, setTrafficLayer] = useState<any>(null);
  const [previousLocation, setPreviousLocation] = useState<{ lat: number; lng: number } | null>(null);
  const [speedHistory, setSpeedHistory] = useState<number[]>([]);
  const [showTurnByTurn, setShowTurnByTurn] = useState(true);
  const [currentNavigationStep, setCurrentNavigationStep] = useState(0);
  const [needsRecalculation, setNeedsRecalculation] = useState(false);
  const [routeDeviation, setRouteDeviation] = useState(0);

  // Estados para controles avanzados
  const [routeOptions, setRouteOptions] = useState<RouteOptions>({
    avoidTolls: false,
    avoidHighways: false,
    avoidFerries: false,
    travelMode: 'DRIVING' as any, // Usar string en lugar de google.maps.TravelMode.DRIVING
    optimizeWaypoints: true,
    provideRouteAlternatives: false
  });
  const [alternativeRoutes, setAlternativeRoutes] = useState<AlternativeRoute[]>([]);
  const [selectedRouteIndex, setSelectedRouteIndex] = useState(0);
  const [showAdvancedControls, setShowAdvancedControls] = useState(false);

  // Configuración del mapa optimizada para navegación
  const mapOptions = {
    zoom: 16,
    center: currentLocation || { lat: -34.6037, lng: -58.3816 }, // Buenos Aires por defecto
    mapTypeId: 'roadmap',
    disableDefaultUI: true,
    zoomControl: true,
    gestureHandling: 'greedy',
    styles: [
      {
        featureType: 'poi',
        elementType: 'labels',
        stylers: [{ visibility: 'off' }]
      }
    ]
  };

  // Inicializar Traffic Layer
  useEffect(() => {
    if (mapRef.current && showTrafficLayer && !trafficLayer && typeof google !== 'undefined') {
      const traffic = new google.maps.TrafficLayer();
      traffic.setMap(mapRef.current);
      setTrafficLayer(traffic);
    } else if (trafficLayer && !showTrafficLayer) {
      trafficLayer.setMap(null);
      setTrafficLayer(null);
    }
  }, [mapRef.current, showTrafficLayer]);

  // Iniciar tracking de ubicación cuando se activa la navegación
  useEffect(() => {
    if (isNavigating && 'geolocation' in navigator) {
      setStartTime(new Date());
      startLocationTracking();
    } else {
      stopLocationTracking();
      setStartTime(null);
    }

    return () => stopLocationTracking();
  }, [isNavigating]);

  // Calcular ruta cuando cambia el destino o se necesita recálculo
  useEffect(() => {
    if (currentLocation && destination && (isNavigating || needsRecalculation)) {
      calculateRoute();
      setNeedsRecalculation(false);
    }
  }, [currentLocation, destination, isNavigating, needsRecalculation]);

  // Centrar mapa en ubicación actual
  useEffect(() => {
    if (mapRef.current && currentLocation) {
      mapRef.current.setCenter(currentLocation);
    }
  }, [currentLocation]);

  // Calcular velocidad y actualizar métricas
  const calculateSpeed = useCallback((newLocation: { lat: number; lng: number }) => {
    if (!previousLocation || !startTime || typeof google === 'undefined') return 0;

    const distance = google.maps.geometry.spherical.computeDistanceBetween(
      new google.maps.LatLng(previousLocation.lat, previousLocation.lng),
      new google.maps.LatLng(newLocation.lat, newLocation.lng)
    );

    const timeElapsed = (Date.now() - startTime.getTime()) / 1000; // segundos
    const speed = (distance / 1000) / (timeElapsed / 3600); // km/h

    return Math.max(0, Math.min(speed, 200)); // Limitar velocidad entre 0-200 km/h
  }, [previousLocation, startTime]);

  // Actualizar información de ruta
  const updateRouteInfo = useCallback(() => {
    if (!directions || !startTime) return;

    const route = directions.routes[0];
    const leg = route.legs[0];
    const now = new Date();
    const elapsedSeconds = (now.getTime() - startTime.getTime()) / 1000;

    // Calcular velocidad promedio
    const avgSpeed = speedHistory.length > 0
      ? speedHistory.reduce((a, b) => a + b, 0) / speedHistory.length
      : 0;

    // Calcular ETA
    const remainingDurationSeconds = leg.duration?.value || 0;
    const eta = new Date(now.getTime() + remainingDurationSeconds * 1000);

    // Detectar demoras por tráfico
    const expectedDuration = leg.duration?.value || 0;
    const durationInTraffic = leg.duration_in_traffic?.value || expectedDuration;
    const trafficDelay = Math.max(0, durationInTraffic - expectedDuration);

    const newRouteInfo: RouteInfo = {
      totalDistance: leg.distance?.text || '0 km',
      totalDuration: leg.duration?.text || '0 min',
      remainingDistance: leg.distance?.text || '0 km',
      remainingDuration: leg.duration?.text || '0 min',
      averageSpeed: Math.round(avgSpeed),
      currentSpeed: speedHistory[speedHistory.length - 1] || 0,
      elapsedTime: Math.round(elapsedSeconds),
      eta,
      trafficDelay: Math.round(trafficDelay / 60) // minutos
    };

    setRouteInfo(newRouteInfo);
    onRouteInfoUpdate?.(newRouteInfo);
  }, [directions, startTime, speedHistory, onRouteInfoUpdate]);

  const startLocationTracking = async () => {
    if (watchIdRef.current) return;

    try {
      // Importar utilidades de geolocalización mejoradas
      const { GeolocationTracker, HIGH_ACCURACY_OPTIONS, isGeolocationSupported } = await import('@/lib/utils/geolocation');

      if (!isGeolocationSupported()) {
        console.error('Geolocation is not supported by this browser');
        return;
      }

      // Crear tracker con manejo mejorado de errores
      const tracker = new GeolocationTracker(
        HIGH_ACCURACY_OPTIONS,
        (position) => {
          const newLocation = {
            lat: position.lat,
            lng: position.lng
          };

          // Calcular velocidad actual
          const currentSpeed = calculateSpeed(newLocation);

          // Actualizar historial de velocidades (mantener últimas 10 mediciones)
          setSpeedHistory(prev => {
            const newHistory = [...prev, currentSpeed].slice(-10);
            return newHistory;
          });

          setPreviousLocation(newLocation);
          onLocationUpdate(newLocation);

          // Actualizar métricas de ruta
          updateRouteInfo();

          console.log('GPS location updated:', {
            lat: position.lat,
            lng: position.lng,
            accuracy: position.accuracy,
            timestamp: new Date(position.timestamp).toISOString()
          });
        },
        (error) => {
          console.error('GPS Navigation Error:', {
            code: error.code,
            message: error.message,
            type: error.type,
            retryable: error.retryable,
            timestamp: new Date(error.timestamp).toISOString(),
            originalError: error.originalError
          });

          // Mostrar notificación al usuario solo para errores no retryables
          if (!error.retryable) {
            console.warn('GPS Error (no retryable):', error.message);
          }
        }
      );

      // Guardar referencia del tracker
      watchIdRef.current = tracker as any;

      // Iniciar tracking
      await tracker.start();

    } catch (error) {
      console.error('Error initializing enhanced location tracking:', error);
    }
  };

  const stopLocationTracking = () => {
    if (watchIdRef.current) {
      // Si es el nuevo tracker, usar su método stop
      if (typeof watchIdRef.current === 'object' && 'stop' in watchIdRef.current) {
        (watchIdRef.current as any).stop();
      } else {
        // Fallback para el método anterior
        navigator.geolocation.clearWatch(watchIdRef.current as number);
      }
      watchIdRef.current = null;
    }
  };

  const calculateRoute = async () => {
    if (!currentLocation || !destination || typeof google === 'undefined') return;

    setIsLoading(true);

    try {
      const directionsService = new google.maps.DirectionsService();
      
      const request: google.maps.DirectionsRequest = {
        origin: currentLocation,
        destination: destination.coordinates || destination,
        waypoints: waypoints.map(point => ({
          location: point,
          stopover: true
        })),
        travelMode: google.maps.TravelMode.DRIVING,
        optimizeWaypoints: routeOptions.optimizeWaypoints,
        avoidHighways: routeOptions.avoidHighways,
        avoidTolls: routeOptions.avoidTolls,
        avoidFerries: routeOptions.avoidFerries,
        provideRouteAlternatives: routeOptions.provideRouteAlternatives,
        drivingOptions: {
          departureTime: new Date(),
          trafficModel: google.maps.TrafficModel.BEST_GUESS
        }
      };

      const result = await directionsService.route(request);
      setDirections(result);

      // Procesar rutas alternativas si están disponibles
      if (result.routes.length > 1 && routeOptions.provideRouteAlternatives) {
        const alternatives: AlternativeRoute[] = result.routes.slice(1).map((route, index) => ({
          routeIndex: index + 1,
          summary: route.summary || `Ruta ${index + 2}`,
          distance: route.legs[0]?.distance?.text || '0 km',
          duration: route.legs[0]?.duration?.text || '0 min',
          warnings: route.warnings || []
        }));
        setAlternativeRoutes(alternatives);
      } else {
        setAlternativeRoutes([]);
      }

      // Inicializar información de ruta (usar ruta seleccionada)
      const selectedRoute = result.routes[selectedRouteIndex] || result.routes[0];
      if (selectedRoute) {
        const leg = selectedRoute.legs[0];

        const initialRouteInfo: RouteInfo = {
          totalDistance: leg.distance?.text || '0 km',
          totalDuration: leg.duration?.text || '0 min',
          remainingDistance: leg.distance?.text || '0 km',
          remainingDuration: leg.duration?.text || '0 min',
          averageSpeed: 0,
          currentSpeed: 0,
          elapsedTime: 0,
          eta: startTime ? new Date(startTime.getTime() + (leg.duration?.value || 0) * 1000) : null,
          trafficDelay: leg.duration_in_traffic ?
            Math.round((leg.duration_in_traffic.value - (leg.duration?.value || 0)) / 60) : 0
        };

        setRouteInfo(initialRouteInfo);
        onRouteInfoUpdate?.(initialRouteInfo);
      }

      // Ajustar vista del mapa para mostrar toda la ruta
      if (mapRef.current && result.routes[0] && typeof google !== 'undefined') {
        const bounds = new google.maps.LatLngBounds();
        result.routes[0].legs.forEach(leg => {
          bounds.extend(leg.start_location);
          bounds.extend(leg.end_location);
        });
        mapRef.current.fitBounds(bounds, { padding: 50 });
      }

    } catch (error) {
      console.error('Error calculating route:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleMapLoad = (map: any) => {
    mapRef.current = map;
  };

  // Manejar solicitud de recálculo de ruta
  const handleRouteRecalculation = useCallback(() => {
    setNeedsRecalculation(true);
    onRouteRecalculation?.();
  }, [onRouteRecalculation]);

  // Manejar desviación de ruta
  const handleRouteDeviation = useCallback((deviation: number) => {
    setRouteDeviation(deviation);
  }, []);

  // Manejar cambio de opciones de ruta
  const handleRouteOptionsChange = useCallback((newOptions: RouteOptions) => {
    setRouteOptions(newOptions);
    setNeedsRecalculation(true);
  }, []);

  // Manejar selección de ruta alternativa
  const handleRouteSelect = useCallback((routeIndex: number) => {
    setSelectedRouteIndex(routeIndex);
    setNeedsRecalculation(true);
  }, []);

  // Manejar recálculo de emergencia
  const handleEmergencyRecalculation = useCallback(() => {
    // Resetear opciones a valores seguros para emergencia
    setRouteOptions(prev => ({
      ...prev,
      avoidTolls: false,
      avoidHighways: false,
      avoidFerries: false,
      provideRouteAlternatives: true
    }));
    setNeedsRecalculation(true);
  }, []);

  // Helper para crear iconos de marcadores
  const createMarkerIcon = (url: string, width: number, height: number, anchorX: number, anchorY: number) => {
    if (typeof google === 'undefined' || !google.maps || !google.maps.Size) return undefined;
    try {
      return {
        url,
        scaledSize: new google.maps.Size(width, height),
        anchor: new google.maps.Point(anchorX, anchorY)
      };
    } catch (error) {
      console.warn('Error creating marker icon:', error);
      return undefined;
    }
  };

  // Componente personalizado para DirectionsRenderer
  const CustomDirectionsRenderer = ({ directions }: { directions: any }) => {
    useEffect(() => {
      if (!mapRef.current || !directions || typeof google === 'undefined') return;

      // Crear DirectionsRenderer si no existe
      if (!directionsRendererRef.current) {
        directionsRendererRef.current = new google.maps.DirectionsRenderer({
          suppressMarkers: true,
          polylineOptions: {
            strokeColor: '#2563eb',
            strokeWeight: 6,
            strokeOpacity: 0.8
          }
        });
        directionsRendererRef.current.setMap(mapRef.current);
      }

      // Actualizar direcciones
      directionsRendererRef.current.setDirections(directions);
      directionsRendererRef.current.setRouteIndex(selectedRouteIndex);

      return () => {
        if (directionsRendererRef.current) {
          directionsRendererRef.current.setMap(null);
        }
      };
    }, [directions, selectedRouteIndex]);

    return null;
  };

  return (
    <div className="relative w-full h-full">
      <APIProvider apiKey={process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY!}>
        <Map
          {...mapOptions}
          onLoad={handleMapLoad}
          className="w-full h-full"
        >
          {/* Marcador de ubicación actual */}
          {currentLocation && (
            <Marker
              position={currentLocation}
              icon={createMarkerIcon('/icons/driver-location.png', 40, 40, 20, 20)}
              title="Mi ubicación"
            />
          )}

          {/* Marcador de destino */}
          {destination && (
            <Marker
              position={destination.coordinates || destination}
              icon={createMarkerIcon('/icons/delivery-destination.png', 35, 35, 17, 35)}
              title="Destino de entrega"
            />
          )}

          {/* Marcadores de waypoints */}
          {waypoints.map((waypoint, index) => (
            <Marker
              key={index}
              position={waypoint}
              icon={createMarkerIcon('/icons/waypoint.png', 25, 25, 12, 25)}
              title={`Punto ${index + 1}`}
            />
          ))}

          {/* Renderizar direcciones */}
          <CustomDirectionsRenderer directions={directions} />
        </Map>
      </APIProvider>

      {/* Indicador de carga */}
      {isLoading && (
        <div className="absolute top-4 left-1/2 transform -translate-x-1/2 bg-white rounded-lg shadow-lg px-4 py-2">
          <div className="flex items-center space-x-2">
            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600"></div>
            <span className="text-sm font-medium">Calculando ruta...</span>
          </div>
        </div>
      )}

      {/* Indicador de navegación activa - Solo en desktop */}
      {isNavigating && (
        <div className="absolute top-4 left-4 bg-green-600 text-white rounded-lg px-3 py-1 hidden md:block">
          <div className="flex items-center space-x-2">
            <div className="w-2 h-2 bg-white rounded-full animate-pulse"></div>
            <span className="text-sm font-medium">GPS Activo</span>
          </div>
        </div>
      )}

      {/* Botones flotantes para activar modales */}
      <FloatingActionButtons
        isNavigating={isNavigating}
        hasActiveRoute={!!directions}
        onRecalculateRoute={() => setNeedsRecalculation(true)}
        onEmergencyStop={handleEmergencyRecalculation}
      />

      {/* Modales Mobile-First */}

      {/* Modal de Navegación Turn-by-Turn */}
      <NavigationModalOverlay
        type="navigation-instructions"
        title="Navegación GPS"
        showBackButton={false}
      >
        {isNavigating && directions && (
          <TurnByTurnNavigation
            directions={directions}
            currentLocation={currentLocation}
            isNavigating={isNavigating}
            onStepComplete={(stepIndex) => setCurrentNavigationStep(stepIndex)}
          />
        )}
      </NavigationModalOverlay>

      {/* Modal de Información de Ruta */}
      <NavigationModalOverlay
        type="route-info"
        title="Información de Ruta"
      >
        {isNavigating && directions && (
          <RouteInfoDashboard
            routeInfo={routeInfo}
            isNavigating={isNavigating}
            showTrafficLayer={showTrafficLayer}
            onToggleTrafficLayer={() => setShowTrafficLayer(!showTrafficLayer)}
          />
        )}
      </NavigationModalOverlay>

      {/* Modal de Real-Time Tracker */}
      <InfoModalOverlay
        type="real-time-tracker"
        title="Tracking en Tiempo Real"
      >
        {isNavigating && (
          <RealTimeTracker
            driverId={driverId}
            orderId={orderId}
            currentLocation={currentLocation}
            plannedRoute={directions}
            isNavigating={isNavigating}
            onLocationUpdate={onLocationUpdate}
            onRouteDeviation={handleRouteDeviation}
            onNeedRecalculation={handleRouteRecalculation}
          />
        )}
      </InfoModalOverlay>

      {/* Modal de Controles Avanzados */}
      <FullscreenModalOverlay
        type="advanced-controls"
        title="Controles Avanzados"
      >
        <AdvancedNavigationControls
          currentOptions={routeOptions}
          alternativeRoutes={alternativeRoutes}
          isCalculating={isLoading}
          onOptionsChange={handleRouteOptionsChange}
          onRouteSelect={handleRouteSelect}
          onRecalculateRoute={() => setNeedsRecalculation(true)}
          onEmergencyRecalculation={handleEmergencyRecalculation}
        />
      </FullscreenModalOverlay>

      {/* Modal de Debug GPS */}
      <InfoModalOverlay
        type="gps-debug"
        title="Debug GPS"
      >
        <GPSDebugInfo showDetails={true} />
      </InfoModalOverlay>

      {/* Modal de Opciones de Emergencia */}
      <InfoModalOverlay
        type="emergency-options"
        title="Opciones de Emergencia"
      >
        <div className="p-4 space-y-4">
          <div className="text-center">
            <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg className="w-8 h-8 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
              </svg>
            </div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">Emergencia Detectada</h3>
            <p className="text-gray-600 mb-6">¿Necesitas recalcular la ruta o reportar un problema?</p>
          </div>

          <div className="space-y-3">
            <button
              onClick={() => {
                setNeedsRecalculation(true);
                modalActions.closeModal();
              }}
              className="w-full bg-yellow-600 hover:bg-yellow-700 text-white font-medium py-3 px-4 rounded-lg transition-colors"
            >
              Recalcular Ruta
            </button>

            <button
              onClick={() => {
                handleEmergencyRecalculation();
                modalActions.closeModal();
              }}
              className="w-full bg-red-600 hover:bg-red-700 text-white font-medium py-3 px-4 rounded-lg transition-colors"
            >
              Emergencia - Ruta Alternativa
            </button>

            <button
              onClick={() => modalActions.closeModal()}
              className="w-full bg-gray-300 hover:bg-gray-400 text-gray-700 font-medium py-3 px-4 rounded-lg transition-colors"
            >
              Cancelar
            </button>
          </div>
        </div>
      </InfoModalOverlay>
    </div>
  );
}









