/**
 * Contexto global para la aplicación de drivers
 * Maneja estado de ubicación, rutas asignadas y sincronización en tiempo real
 */

'use client';

import React, { createContext, useContext, useReducer, useEffect } from 'react';
import { useSession } from 'next-auth/react';

// =====================================================
// TIPOS E INTERFACES
// =====================================================

interface Driver {
  id: string;
  name: string;
  email: string;
  phone: string;
  vehicle_type: string;
  license_plate: string;
  status: 'available' | 'busy' | 'offline';
  current_location?: {
    lat: number;
    lng: number;
  };
}

interface RouteAssignment {
  id: string;
  name: string;
  status: 'planned' | 'active' | 'completed';
  shipments: any[];
  waypoints: Array<{ lat: number; lng: number }>;
  total_distance: number;
  estimated_time: number;
  optimization_score: number;
}

interface DriverState {
  driver: Driver | null;
  currentRoute: RouteAssignment | null;
  assignedRoutes: RouteAssignment[];
  currentLocation: { lat: number; lng: number } | null;
  isTracking: boolean;
  isOnline: boolean;
  notifications: any[];
  loading: boolean;
  error: string | null;
}

type DriverAction =
  | { type: 'SET_DRIVER'; payload: Driver }
  | { type: 'SET_CURRENT_ROUTE'; payload: RouteAssignment }
  | { type: 'SET_ASSIGNED_ROUTES'; payload: RouteAssignment[] }
  | { type: 'UPDATE_LOCATION'; payload: { lat: number; lng: number } }
  | { type: 'SET_TRACKING'; payload: boolean }
  | { type: 'SET_ONLINE'; payload: boolean }
  | { type: 'ADD_NOTIFICATION'; payload: any }
  | { type: 'SET_LOADING'; payload: boolean }
  | { type: 'SET_ERROR'; payload: string | null }
  | { type: 'COMPLETE_DELIVERY'; payload: string }
  | { type: 'START_ROUTE'; payload: string }
  | { type: 'COMPLETE_ROUTE'; payload: string };

// =====================================================
// REDUCER
// =====================================================

const initialState: DriverState = {
  driver: null,
  currentRoute: null,
  assignedRoutes: [],
  currentLocation: null,
  isTracking: false,
  isOnline: false,
  notifications: [],
  loading: false,
  error: null,
};

function driverReducer(state: DriverState, action: DriverAction): DriverState {
  switch (action.type) {
    case 'SET_DRIVER':
      return { ...state, driver: action.payload };
    
    case 'SET_CURRENT_ROUTE':
      return { ...state, currentRoute: action.payload };
    
    case 'SET_ASSIGNED_ROUTES':
      return { ...state, assignedRoutes: action.payload };
    
    case 'UPDATE_LOCATION':
      return { 
        ...state, 
        currentLocation: action.payload,
        driver: state.driver ? {
          ...state.driver,
          current_location: action.payload
        } : null
      };
    
    case 'SET_TRACKING':
      return { ...state, isTracking: action.payload };
    
    case 'SET_ONLINE':
      return { ...state, isOnline: action.payload };
    
    case 'ADD_NOTIFICATION':
      return { 
        ...state, 
        notifications: [action.payload, ...state.notifications.slice(0, 9)]
      };
    
    case 'SET_LOADING':
      return { ...state, loading: action.payload };
    
    case 'SET_ERROR':
      return { ...state, error: action.payload };
    
    case 'START_ROUTE':
      return {
        ...state,
        currentRoute: state.assignedRoutes.find(r => r.id === action.payload) || null,
        assignedRoutes: state.assignedRoutes.map(route =>
          route.id === action.payload
            ? { ...route, status: 'active' as const }
            : route
        )
      };
    
    case 'COMPLETE_ROUTE':
      return {
        ...state,
        currentRoute: null,
        assignedRoutes: state.assignedRoutes.map(route =>
          route.id === action.payload
            ? { ...route, status: 'completed' as const }
            : route
        )
      };
    
    default:
      return state;
  }
}

// =====================================================
// CONTEXTO
// =====================================================

interface DriverContextType {
  state: DriverState;
  dispatch: React.Dispatch<DriverAction>;
  
  // Acciones específicas
  startLocationTracking: () => void;
  stopLocationTracking: () => void;
  updateDriverLocation: (location: { lat: number; lng: number }) => void;
  startRoute: (routeId: string) => void;
  completeRoute: (routeId: string) => void;
  completeDelivery: (shipmentId: string) => void;
  goOnline: () => void;
  goOffline: () => void;
}

const DriverContext = createContext<DriverContextType | undefined>(undefined);

// =====================================================
// PROVIDER
// =====================================================

export function DriverProvider({ children }: { children: React.ReactNode }) {
  const [state, dispatch] = useReducer(driverReducer, initialState);
  const { data: session } = useSession();

  // Inicializar driver al cargar
  useEffect(() => {
    if (session?.user?.email) {
      loadDriverData();
    }
  }, [session]);

  // Funciones del contexto
  const loadDriverData = async () => {
    dispatch({ type: 'SET_LOADING', payload: true });
    try {
      const response = await fetch('/api/driver/profile');
      const data = await response.json();
      
      if (data.driver) {
        dispatch({ type: 'SET_DRIVER', payload: data.driver });
        dispatch({ type: 'SET_ASSIGNED_ROUTES', payload: data.routes || [] });
      }
    } catch (error) {
      dispatch({ type: 'SET_ERROR', payload: 'Error cargando datos del driver' });
    } finally {
      dispatch({ type: 'SET_LOADING', payload: false });
    }
  };

  const startLocationTracking = () => {
    if ('geolocation' in navigator) {
      dispatch({ type: 'SET_TRACKING', payload: true });

      // Intentar primero con alta precisión
      const tryHighAccuracy = () => {
        const watchId = navigator.geolocation.watchPosition(
          (position) => {
            const location = {
              lat: position.coords.latitude,
              lng: position.coords.longitude
            };
            updateDriverLocation(location);
          },
          (error) => {
            console.warn('High accuracy geolocation failed, trying standard accuracy:', error);
            // Si falla con alta precisión, intentar con precisión estándar
            tryStandardAccuracy();
          },
          {
            enableHighAccuracy: true,
            timeout: 10000,
            maximumAge: 30000
          }
        );

        // Guardar watchId para poder detener el tracking
        (window as any).driverLocationWatchId = watchId;
      };

      // Función de respaldo con precisión estándar
      const tryStandardAccuracy = () => {
        const watchId = navigator.geolocation.watchPosition(
          (position) => {
            const location = {
              lat: position.coords.latitude,
              lng: position.coords.longitude
            };
            updateDriverLocation(location);
          },
          (error) => {
            console.error('Error tracking location:', error);
            dispatch({ type: 'SET_ERROR', payload: 'Error obteniendo ubicación' });
          },
          {
            enableHighAccuracy: true,
            timeout: 10000,
            maximumAge: 5000
          }
        );

        // Guardar watchId para poder detener el tracking
        (window as any).driverLocationWatchId = watchId;
      };

      // Iniciar con alta precisión
      tryHighAccuracy();
    }
  };

  const stopLocationTracking = () => {
    dispatch({ type: 'SET_TRACKING', payload: false });
    if ((window as any).driverLocationWatchId) {
      navigator.geolocation.clearWatch((window as any).driverLocationWatchId);
    }
  };

  const updateDriverLocation = async (location: { lat: number; lng: number }) => {
    dispatch({ type: 'UPDATE_LOCATION', payload: location });
    
    // Enviar ubicación al servidor
    try {
      await fetch('/api/driver/location', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ location })
      });
    } catch (error) {
      console.error('Error updating location:', error);
    }
  };

  const startRoute = (routeId: string) => {
    dispatch({ type: 'START_ROUTE', payload: routeId });
    startLocationTracking();
  };

  const completeRoute = (routeId: string) => {
    dispatch({ type: 'COMPLETE_ROUTE', payload: routeId });
    stopLocationTracking();
  };

  const completeDelivery = (shipmentId: string) => {
    dispatch({ type: 'COMPLETE_DELIVERY', payload: shipmentId });
  };

  const goOnline = () => {
    dispatch({ type: 'SET_ONLINE', payload: true });
    startLocationTracking();
  };

  const goOffline = () => {
    dispatch({ type: 'SET_ONLINE', payload: false });
    stopLocationTracking();
  };

  const contextValue: DriverContextType = {
    state,
    dispatch,
    startLocationTracking,
    stopLocationTracking,
    updateDriverLocation,
    startRoute,
    completeRoute,
    completeDelivery,
    goOnline,
    goOffline,
  };

  return (
    <DriverContext.Provider value={contextValue}>
      {children}
    </DriverContext.Provider>
  );
}

// =====================================================
// HOOK
// =====================================================

export function useDriver() {
  const context = useContext(DriverContext);
  if (context === undefined) {
    throw new Error('useDriver must be used within a DriverProvider');
  }
  return context;
}









