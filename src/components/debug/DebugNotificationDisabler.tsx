'use client';

import { useEffect } from 'react';

/**
 * Componente para deshabilitar notificaciones de debugging persistentes
 * Solo se ejecuta en desarrollo
 */
export default function DebugNotificationDisabler() {
  useEffect(() => {
    // Solo ejecutar en desarrollo
    if (process.env.NODE_ENV !== 'development') {return;}

    console.log('🛡️ [DEBUG_DISABLER] Deshabilitando notificaciones de debugging...');

    // Interceptar y deshabilitar console.log que puedan estar causando notificaciones
    const originalConsoleLog = console.log;
    const originalConsoleWarn = console.warn;
    const originalConsoleError = console.error;

    // Filtrar logs de debugging específicos
    console.log = (...args: any[]) => {
      const message = args.join(' ');
      
      // Filtrar mensajes de debugging de hooks
      if (
        message.includes('HOOK CORRECTO') ||
        message.includes('useOrdersEnterprise') ||
        message.includes('ejecutándose') ||
        message.includes('🔵 [HOOK') ||
        message.includes('🚨 [HOOK PROBLEMÁTICO]')
      ) {
        // No mostrar estos logs
        return;
      }
      
      // Permitir otros logs
      originalConsoleLog(...args);
    };

    // Interceptar alertas del navegador
    const originalAlert = window.alert;
    window.alert = (message: string) => {
      // Filtrar alertas de debugging
      if (
        message.includes('HOOK CORRECTO') ||
        message.includes('useOrdersEnterprise') ||
        message.includes('ejecutándose')
      ) {
        console.log('🛡️ [DEBUG_DISABLER] Alerta de debugging bloqueada:', message);
        return;
      }
      
      // Permitir otras alertas
      originalAlert(message);
    };

    // Interceptar confirmaciones del navegador
    const originalConfirm = window.confirm;
    window.confirm = (message: string) => {
      // Filtrar confirmaciones de debugging
      if (
        message.includes('HOOK CORRECTO') ||
        message.includes('useOrdersEnterprise') ||
        message.includes('ejecutándose')
      ) {
        console.log('🛡️ [DEBUG_DISABLER] Confirmación de debugging bloqueada:', message);
        return false;
      }
      
      // Permitir otras confirmaciones
      return originalConfirm(message);
    };

    // Interceptar notificaciones del navegador
    if ('Notification' in window) {
      const OriginalNotification = window.Notification;
      
      // @ts-ignore
      window.Notification = class extends OriginalNotification {
        constructor(title: string, options?: NotificationOptions) {
          // Filtrar notificaciones de debugging
          if (
            title.includes('HOOK CORRECTO') ||
            title.includes('useOrdersEnterprise') ||
            title.includes('ejecutándose') ||
            options?.body?.includes('HOOK CORRECTO') ||
            options?.body?.includes('useOrdersEnterprise') ||
            options?.body?.includes('ejecutándose')
          ) {
            console.log('🛡️ [DEBUG_DISABLER] Notificación de debugging bloqueada:', title, options);
            // Crear una notificación vacía que no se muestra
            super('', { silent: true });
            return;
          }
          
          // Permitir otras notificaciones
          super(title, options);
        }
      };
    }

    console.log('✅ [DEBUG_DISABLER] Filtros de debugging activados');

    // Cleanup al desmontar
    return () => {
      console.log = originalConsoleLog;
      console.warn = originalConsoleWarn;
      console.error = originalConsoleError;
      window.alert = originalAlert;
      window.confirm = originalConfirm;
    };
  }, []);

  // Este componente no renderiza nada
  return null;
}









