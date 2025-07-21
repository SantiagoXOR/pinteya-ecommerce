"use client";

import { useEffect } from 'react';
import { initializeJsonSafety } from '@/lib/json-utils';
import { setupDebugHelpers } from '@/utils/cleanLocalStorage';

/**
 * Componente que inicializa la limpieza de localStorage corrupto
 * Se ejecuta una vez al cargar la aplicación
 */
export default function JsonSafetyInitializer() {
  useEffect(() => {
    // Ejecutar limpieza de localStorage corrupto
    initializeJsonSafety();

    // Configurar helpers de debug en desarrollo
    if (process.env.NODE_ENV === 'development') {
      setupDebugHelpers();
    }
  }, []);

  // Este componente no renderiza nada
  return null;
}
