"use client";

import { useAuthRedirectDebug } from '@/hooks/useAuthRedirectDebug';
import { useEffect } from 'react';

/**
 * Componente de debug para rastrear redirecciones de autenticación
 * Solo se ejecuta en desarrollo
 */
export default function AuthRedirectDebugger() {
  const { forceAdminRedirect, isAdmin, debugInfo } = useAuthRedirectDebug();

  useEffect(() => {
    // Solo ejecutar en desarrollo
    if (process.env.NODE_ENV !== 'development') return;

    console.log('[AUTH_DEBUGGER] 🚀 Debugger de autenticación iniciado');
    
    // Agregar función global para debug manual
    (window as any).debugAuth = {
      forceAdminRedirect,
      isAdmin,
      debugInfo,
      info: () => {
        console.log('[AUTH_DEBUGGER] 📊 Estado actual:', debugInfo);
      }
    };

    console.log('[AUTH_DEBUGGER] 💡 Funciones de debug disponibles en window.debugAuth');
  }, [forceAdminRedirect, isAdmin, debugInfo]);

  // No renderizar nada en producción
  if (process.env.NODE_ENV !== 'development') {
    return null;
  }

  return (
    <div 
      style={{
        position: 'fixed',
        top: '10px',
        right: '10px',
        background: 'rgba(0,0,0,0.8)',
        color: 'white',
        padding: '10px',
        borderRadius: '5px',
        fontSize: '12px',
        zIndex: 9999,
        maxWidth: '300px'
      }}
    >
      <div><strong>🔍 Auth Debug</strong></div>
      <div>Signed In: {debugInfo.isSignedIn ? '✅' : '❌'}</div>
      <div>User ID: {debugInfo.userId || 'N/A'}</div>
      <div>Role: {debugInfo.userRole || 'N/A'}</div>
      <div>Private Role: {debugInfo.privateRole || 'N/A'}</div>
      <div>Is Admin: {isAdmin ? '✅' : '❌'}</div>
      <div>Path: {debugInfo.pathname || 'N/A'}</div>
      {isAdmin && debugInfo.pathname === '/my-account' && (
        <button 
          onClick={forceAdminRedirect}
          style={{
            background: '#ff4444',
            color: 'white',
            border: 'none',
            padding: '5px 10px',
            borderRadius: '3px',
            cursor: 'pointer',
            marginTop: '5px'
          }}
        >
          🚀 Force Admin Redirect
        </button>
      )}
    </div>
  );
}
