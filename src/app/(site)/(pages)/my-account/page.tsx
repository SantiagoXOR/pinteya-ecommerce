import { redirect } from 'next/navigation';

/**
 * PÁGINA TEMPORAL DE REDIRECCIÓN - SERVER SIDE
 *
 * Esta página existe únicamente para romper el ciclo recursivo
 * causado por configuraciones de Clerk que redirigen a /my-account.
 *
 * FUNCIÓN: Redirigir inmediatamente a /admin usando Server Side Redirect
 * ESTADO: TEMPORAL - Eliminar cuando se corrijan las configuraciones de Clerk
 */
export default function MyAccountRedirectPage() {
  // Redirección inmediata del lado del servidor
  // Esto es más confiable que redirecciones del lado del cliente
  console.log('[MY_ACCOUNT_REDIRECT] 🔄 Server-side redirect a /admin');
  redirect('/admin');
}
