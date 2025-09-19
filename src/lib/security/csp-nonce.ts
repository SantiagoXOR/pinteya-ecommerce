/**
 * Utilidad para generar y gestionar nonces de CSP (Content Security Policy)
 * Permite eliminar 'unsafe-inline' de la CSP para mayor seguridad
 */

import { randomBytes } from 'crypto';
import { headers } from 'next/headers';

// ===================================
// GENERACIÓN DE NONCES
// ===================================

/**
 * Genera un nonce criptográficamente seguro para CSP
 */
export function generateNonce(): string {
  return randomBytes(16).toString('base64');
}

/**
 * Genera múltiples nonces para diferentes tipos de contenido
 */
export function generateNonces() {
  return {
    script: generateNonce(),
    style: generateNonce(),
    img: generateNonce(),
    connect: generateNonce()
  };
}

// ===================================
// GESTIÓN DE NONCES EN REQUESTS
// ===================================

/**
 * Obtiene el nonce actual del request (si existe)
 */
export function getCurrentNonce(type: 'script' | 'style' = 'script'): string | null {
  try {
    const headersList = headers();
    return headersList.get(`x-nonce-${type}`) || null;
  } catch {
    return null;
  }
}

/**
 * Crea headers con nonces para el response
 */
export function createNonceHeaders(nonces: ReturnType<typeof generateNonces>) {
  return {
    'X-Nonce-Script': nonces.script,
    'X-Nonce-Style': nonces.style,
    'X-Nonce-Img': nonces.img,
    'X-Nonce-Connect': nonces.connect
  };
}

// ===================================
// CONSTRUCCIÓN DE CSP CON NONCES
// ===================================

/**
 * Construye una CSP estricta usando nonces
 */
export function buildStrictCSP(nonces: ReturnType<typeof generateNonces>): string {
  const cspDirectives = [
    `default-src 'self'`,
    `script-src 'self' 'nonce-${nonces.script}' https://js.stripe.com https://checkout.stripe.com https://maps.googleapis.com https://www.google-analytics.com https://www.googletagmanager.com https://connect.facebook.net`,
    `style-src 'self' 'nonce-${nonces.style}' https://fonts.googleapis.com https://cdn.jsdelivr.net`,
    `img-src 'self' 'nonce-${nonces.img}' data: https: blob:`,
    `font-src 'self' https://fonts.gstatic.com https://cdn.jsdelivr.net`,
    `connect-src 'self' 'nonce-${nonces.connect}' https://api.stripe.com https://checkout.stripe.com https://www.google-analytics.com https://vitals.vercel-analytics.com wss: https:`,
    `frame-src 'self' https://js.stripe.com https://checkout.stripe.com https://www.google.com`,
    `object-src 'none'`,
    `base-uri 'self'`,
    `form-action 'self' https://checkout.stripe.com`,
    `frame-ancestors 'none'`,
    `upgrade-insecure-requests`
  ];

  return cspDirectives.join('; ');
}

/**
 * Construye una CSP para desarrollo (más permisiva)
 */
export function buildDevelopmentCSP(nonces: ReturnType<typeof generateNonces>): string {
  const cspDirectives = [
    `default-src 'self'`,
    `script-src 'self' 'nonce-${nonces.script}' 'unsafe-eval' https://js.stripe.com https://checkout.stripe.com https://maps.googleapis.com`,
    `style-src 'self' 'nonce-${nonces.style}' 'unsafe-inline' https://fonts.googleapis.com`,
    `img-src 'self' 'nonce-${nonces.img}' data: https: blob:`,
    `font-src 'self' https://fonts.gstatic.com`,
    `connect-src 'self' 'nonce-${nonces.connect}' https: wss: ws:`,
    `frame-src 'self' https://js.stripe.com https://checkout.stripe.com`,
    `object-src 'none'`,
    `base-uri 'self'`
  ];

  return cspDirectives.join('; ');
}

// ===================================
// UTILIDADES PARA COMPONENTES
// ===================================

/**
 * Hook para obtener nonces en componentes React
 */
export function useNonces() {
  const scriptNonce = getCurrentNonce('script');
  const styleNonce = getCurrentNonce('style');
  
  return {
    script: scriptNonce,
    style: styleNonce,
    // Función helper para agregar nonce a scripts inline
    addScriptNonce: (content: string) => 
      scriptNonce ? `<script nonce="${scriptNonce}">${content}</script>` : content,
    // Función helper para agregar nonce a estilos inline
    addStyleNonce: (content: string) => 
      styleNonce ? `<style nonce="${styleNonce}">${content}</style>` : content
  };
}

/**
 * Componente wrapper para scripts con nonce
 */
export function NonceScript({ 
  children, 
  nonce 
}: { 
  children: string; 
  nonce?: string; 
}) {
  const currentNonce = nonce || getCurrentNonce('script');
  
  if (!currentNonce) {
    console.warn('No nonce available for script. CSP may block execution.');
    return null;
  }
  
  return (
    <script 
      nonce={currentNonce}
      dangerouslySetInnerHTML={{ __html: children }}
    />
  );
}

/**
 * Componente wrapper para estilos con nonce
 */
export function NonceStyle({ 
  children, 
  nonce 
}: { 
  children: string; 
  nonce?: string; 
}) {
  const currentNonce = nonce || getCurrentNonce('style');
  
  if (!currentNonce) {
    console.warn('No nonce available for style. CSP may block execution.');
    return null;
  }
  
  return (
    <style 
      nonce={currentNonce}
      dangerouslySetInnerHTML={{ __html: children }}
    />
  );
}