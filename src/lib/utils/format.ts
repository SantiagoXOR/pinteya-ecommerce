// =====================================================
// UTILIDADES: FORMATEO DE DATOS
// Descripción: Funciones para formatear fechas, números, monedas, etc.
// Basado en: Intl API + date-fns + patrones enterprise
// =====================================================

import { format, formatDistance, formatDistanceToNow, parseISO, isValid, es } from '@/lib/optimized-imports';

// =====================================================
// FORMATEO DE FECHAS
// =====================================================

export function formatDate(date: string | Date, pattern: string = 'dd/MM/yyyy'): string {
  try {
    const dateObj = typeof date === 'string' ? new Date(date) : date;
    if (isNaN(dateObj.getTime())) {
      return 'Fecha inválida';
    }

    // Usar formateo nativo para evitar problemas con date-fns
    const day = dateObj.getDate().toString().padStart(2, '0');
    const month = (dateObj.getMonth() + 1).toString().padStart(2, '0');
    const year = dateObj.getFullYear();
    const hours = dateObj.getHours().toString().padStart(2, '0');
    const minutes = dateObj.getMinutes().toString().padStart(2, '0');

    if (pattern === 'dd/MM/yyyy hh:mm') {
      return `${day}/${month}/${year} ${hours}:${minutes}`;
    }

    return `${day}/${month}/${year}`;
  } catch (error) {
    console.error('Error formatting date:', error);
    return 'Fecha inválida';
  }
}

export function formatDateTime(date: string | Date): string {
  return formatDate(date, 'dd/MM/yyyy hh:mm');
}

export function formatTimeAgo(date: string | Date): string {
  try {
    const dateObj = typeof date === 'string' ? parseISO(date) : date;
    if (!isValid(dateObj)) {
      return 'Fecha inválida';
    }

    // Usar implementación simple sin locale para evitar errores de formato
    const now = new Date();
    const diffInSeconds = Math.floor((now.getTime() - dateObj.getTime()) / 1000);

    if (diffInSeconds < 60) {
      return 'hace menos de un minuto';
    }

    const diffInMinutes = Math.floor(diffInSeconds / 60);
    if (diffInMinutes < 60) {
      return `hace ${diffInMinutes} minuto${diffInMinutes > 1 ? 's' : ''}`;
    }

    const diffInHours = Math.floor(diffInMinutes / 60);
    if (diffInHours < 24) {
      return `hace ${diffInHours} hora${diffInHours > 1 ? 's' : ''}`;
    }

    const diffInDays = Math.floor(diffInHours / 24);
    if (diffInDays < 30) {
      return `hace ${diffInDays} día${diffInDays > 1 ? 's' : ''}`;
    }

    const diffInMonths = Math.floor(diffInDays / 30);
    if (diffInMonths < 12) {
      return `hace ${diffInMonths} mes${diffInMonths > 1 ? 'es' : ''}`;
    }

    const diffInYears = Math.floor(diffInMonths / 12);
    return `hace ${diffInYears} año${diffInYears > 1 ? 's' : ''}`;
  } catch (error) {
    console.error('Error formatting time ago:', error);
    return 'Fecha inválida';
  }
}

export function formatRelativeTime(date: string | Date): string {
  return formatTimeAgo(date);
}

// =====================================================
// FORMATEO DE NÚMEROS Y MONEDAS
// =====================================================

export function formatCurrency(
  amount: number, 
  currency: string = 'ARS',
  locale: string = 'es-AR'
): string {
  try {
    return new Intl.NumberFormat(locale, {
      style: 'currency',
      currency: currency,
      minimumFractionDigits: 0,
      maximumFractionDigits: 2
    }).format(amount);
  } catch (error) {
    console.error('Error formatting currency:', error);
    return `$${amount.toFixed(2)}`;
  }
}

export function formatNumber(
  number: number,
  locale: string = 'es-AR',
  options?: Intl.NumberFormatOptions
): string {
  try {
    return new Intl.NumberFormat(locale, options).format(number);
  } catch (error) {
    console.error('Error formatting number:', error);
    return number.toString();
  }
}

export function formatPercentage(
  value: number,
  decimals: number = 1,
  locale: string = 'es-AR'
): string {
  try {
    return new Intl.NumberFormat(locale, {
      style: 'percent',
      minimumFractionDigits: decimals,
      maximumFractionDigits: decimals
    }).format(value / 100);
  } catch (error) {
    console.error('Error formatting percentage:', error);
    return `${value.toFixed(decimals)}%`;
  }
}

// =====================================================
// FORMATEO DE TEXTO
// =====================================================

export function formatPhoneNumber(phone: string): string {
  // Formato argentino: +54 9 351 123 4567
  const cleaned = phone.replace(/\D/g, '');
  
  if (cleaned.length === 10) {
    // Formato local: 351 123 4567
    return cleaned.replace(/(\d{3})(\d{3})(\d{4})/, '$1 $2 $3');
  } else if (cleaned.length === 13 && cleaned.startsWith('549')) {
    // Formato internacional: +54 9 351 123 4567
    return cleaned.replace(/(\d{2})(\d{1})(\d{3})(\d{3})(\d{4})/, '+$1 $2 $3 $4 $5');
  }
  
  return phone;
}

export function formatAddress(address: {
  street: string;
  number: string;
  apartment?: string;
  neighborhood: string;
  city: string;
  state: string;
  postal_code: string;
}): string {
  const parts = [
    `${address.street} ${address.number}`,
    address.apartment ? `Depto ${address.apartment}` : '',
    address.neighborhood,
    address.city,
    address.state,
    `CP ${address.postal_code}`
  ].filter(Boolean);
  
  return parts.join(', ');
}

export function truncateText(text: string, maxLength: number = 50): string {
  if (text.length <= maxLength) {
    return text;
  }
  return text.substring(0, maxLength - 3) + '...';
}

export function capitalizeFirst(text: string): string {
  if (!text) {return '';}
  return text.charAt(0).toUpperCase() + text.slice(1).toLowerCase();
}

export function formatSlug(text: string): string {
  return text
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '') // Remover acentos
    .replace(/[^a-z0-9\s-]/g, '') // Remover caracteres especiales
    .replace(/\s+/g, '-') // Reemplazar espacios con guiones
    .replace(/-+/g, '-') // Remover guiones múltiples
    .trim();
}

// =====================================================
// FORMATEO DE ESTADOS Y BADGES
// =====================================================

export function formatShipmentStatus(status: string): {
  label: string;
  color: 'default' | 'secondary' | 'destructive' | 'outline';
} {
  const statusMap: Record<string, { label: string; color: any }> = {
    pending: { label: 'Pendiente', color: 'secondary' },
    confirmed: { label: 'Confirmado', color: 'default' },
    picked_up: { label: 'Retirado', color: 'default' },
    in_transit: { label: 'En Tránsito', color: 'default' },
    out_for_delivery: { label: 'En Reparto', color: 'default' },
    delivered: { label: 'Entregado', color: 'default' },
    exception: { label: 'Excepción', color: 'destructive' },
    cancelled: { label: 'Cancelado', color: 'destructive' },
    returned: { label: 'Devuelto', color: 'outline' }
  };
  
  return statusMap[status] || { label: status, color: 'outline' };
}

export function formatOrderStatus(status: string): {
  label: string;
  color: 'default' | 'secondary' | 'destructive' | 'outline';
} {
  const statusMap: Record<string, { label: string; color: any }> = {
    pending: { label: 'Pendiente', color: 'secondary' },
    confirmed: { label: 'Confirmado', color: 'default' },
    processing: { label: 'Procesando', color: 'default' },
    shipped: { label: 'Enviado', color: 'default' },
    delivered: { label: 'Entregado', color: 'default' },
    cancelled: { label: 'Cancelado', color: 'destructive' },
    refunded: { label: 'Reembolsado', color: 'outline' },
    returned: { label: 'Devuelto', color: 'outline' }
  };
  
  return statusMap[status] || { label: status, color: 'outline' };
}

// =====================================================
// FORMATEO DE ARCHIVOS Y TAMAÑOS
// =====================================================

export function formatFileSize(bytes: number): string {
  if (bytes === 0) {return '0 Bytes';}
  
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}

// =====================================================
// FORMATEO DE COORDENADAS
// =====================================================

export function formatCoordinates(lat: number, lng: number): string {
  const latDir = lat >= 0 ? 'N' : 'S';
  const lngDir = lng >= 0 ? 'E' : 'O';
  
  return `${Math.abs(lat).toFixed(6)}°${latDir}, ${Math.abs(lng).toFixed(6)}°${lngDir}`;
}

// =====================================================
// FORMATEO DE DURACIÓN
// =====================================================

export function formatDuration(minutes: number): string {
  if (minutes < 60) {
    return `${minutes} min`;
  }
  
  const hours = Math.floor(minutes / 60);
  const remainingMinutes = minutes % 60;
  
  if (remainingMinutes === 0) {
    return `${hours}h`;
  }
  
  return `${hours}h ${remainingMinutes}min`;
}









