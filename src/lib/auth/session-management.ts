/**
 * Sistema de Gestión Avanzada de Sesiones
 * Maneja sincronización entre Clerk y Supabase, invalidación automática y cleanup
 */

import { clerkClient } from '@clerk/nextjs/server';
import { supabaseAdmin } from '@/lib/supabase';
import { logSecurityEvent, logAdminAction } from './security-audit';
import { CacheManager, CACHE_CONFIGS } from '@/lib/cache-manager';

// =====================================================
// TIPOS Y INTERFACES
// =====================================================

export interface SessionData {
  id: string;
  user_id: string;
  clerk_session_id: string;
  status: SessionStatus;
  created_at: string;
  updated_at: string;
  expires_at: string;
  last_activity: string;
  ip_address?: string;
  user_agent?: string;
  device_info?: DeviceInfo;
  metadata?: SessionMetadata;
}

export interface DeviceInfo {
  type: 'desktop' | 'mobile' | 'tablet' | 'unknown';
  os?: string;
  browser?: string;
  version?: string;
}

export interface SessionMetadata {
  login_method?: string;
  location?: string;
  timezone?: string;
  language?: string;
  features_used?: string[];
  last_page?: string;
  session_duration?: number;
}

export type SessionStatus = 'active' | 'expired' | 'revoked' | 'invalid';

export interface SessionSyncResult {
  success: boolean;
  action: 'created' | 'updated' | 'deleted' | 'found_existing' | 'error';
  sessionId?: string;
  error?: string;
  details?: Record<string, any>;
}

export interface SessionCleanupResult {
  success: boolean;
  cleaned: number;
  errors: number;
  details: {
    expired: number;
    orphaned: number;
    invalid: number;
  };
}

// =====================================================
// CONFIGURACIÓN
// =====================================================

const SESSION_CONFIG = {
  maxSessionsPerUser: 5,
  sessionTimeout: 24 * 60 * 60 * 1000, // 24 horas
  cleanupInterval: 60 * 60 * 1000, // 1 hora
  maxInactiveTime: 2 * 60 * 60 * 1000, // 2 horas
  cacheTimeout: 10 * 60 * 1000 // 10 minutos
};

// =====================================================
// FUNCIONES DE UTILIDAD
// =====================================================

/**
 * Extrae información del dispositivo desde User-Agent
 */
function parseDeviceInfo(userAgent?: string): DeviceInfo {
  if (!userAgent) {
    return { type: 'unknown' };
  }

  const ua = userAgent.toLowerCase();
  
  // Detectar tipo de dispositivo
  let type: DeviceInfo['type'] = 'desktop';
  if (ua.includes('mobile')) type = 'mobile';
  else if (ua.includes('tablet') || ua.includes('ipad')) type = 'tablet';

  // Detectar OS
  let os: string | undefined;
  if (ua.includes('windows')) os = 'Windows';
  else if (ua.includes('mac')) os = 'macOS';
  else if (ua.includes('linux')) os = 'Linux';
  else if (ua.includes('android')) os = 'Android';
  else if (ua.includes('ios') || ua.includes('iphone')) os = 'iOS';

  // Detectar browser
  let browser: string | undefined;
  if (ua.includes('chrome')) browser = 'Chrome';
  else if (ua.includes('firefox')) browser = 'Firefox';
  else if (ua.includes('safari')) browser = 'Safari';
  else if (ua.includes('edge')) browser = 'Edge';

  return { type, os, browser };
}

/**
 * Genera ID único para sesión
 */
function generateSessionId(): string {
  return `sess_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
}

/**
 * Calcula fecha de expiración
 */
function calculateExpirationDate(): string {
  return new Date(Date.now() + SESSION_CONFIG.sessionTimeout).toISOString();
}

// =====================================================
// FUNCIONES PRINCIPALES DE GESTIÓN DE SESIONES
// =====================================================

/**
 * Crea una nueva sesión en Supabase
 */
export async function createSession(
  userId: string,
  clerkSessionId: string,
  request?: Request
): Promise<SessionSyncResult> {
  try {
    console.log(`[SESSION] Creando sesión para usuario ${userId}`);

    if (!supabaseAdmin) {
      throw new Error('Supabase admin client no disponible');
    }

    // Extraer información de la request
    const ipAddress = request?.headers.get('x-forwarded-for') || 
                     request?.headers.get('x-real-ip') || 
                     'unknown';
    const userAgent = request?.headers.get('user-agent') || 'unknown';
    const deviceInfo = parseDeviceInfo(userAgent);

    // Verificar límite de sesiones por usuario
    const { data: existingSessions, error: countError } = await supabaseAdmin
      .from('user_sessions')
      .select('id')
      .eq('user_id', userId)
      .eq('status', 'active');

    if (countError) {
      throw new Error(`Error verificando sesiones existentes: ${countError.message}`);
    }

    // Si hay demasiadas sesiones, eliminar las más antiguas
    if (existingSessions && existingSessions.length >= SESSION_CONFIG.maxSessionsPerUser) {
      console.log(`[SESSION] Usuario ${userId} tiene ${existingSessions.length} sesiones, limpiando...`);
      await cleanupOldSessions(userId, SESSION_CONFIG.maxSessionsPerUser - 1);
    }

    // Crear nueva sesión
    const sessionData: Omit<SessionData, 'id'> = {
      user_id: userId,
      clerk_session_id: clerkSessionId,
      status: 'active',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      expires_at: calculateExpirationDate(),
      last_activity: new Date().toISOString(),
      ip_address: ipAddress,
      user_agent: userAgent,
      device_info: deviceInfo,
      metadata: {
        login_method: 'clerk',
        timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
        session_duration: 0
      }
    };

    const { data: newSession, error: insertError } = await supabaseAdmin
      .from('user_sessions')
      .insert(sessionData)
      .select('*')
      .single();

    if (insertError) {
      throw new Error(`Error creando sesión: ${insertError.message}`);
    }

    // Log evento de seguridad
    await logSecurityEvent({
      user_id: userId,
      event_type: 'AUTH_SUCCESS',
      event_category: 'authentication',
      severity: 'low',
      description: 'Nueva sesión creada',
      metadata: {
        session_id: newSession.id,
        clerk_session_id: clerkSessionId,
        device_info: deviceInfo,
        ip_address: ipAddress
      }
    });

    // Invalidar cache de sesiones del usuario
    const cache = CacheManager.getInstance();
    await cache.delete(CACHE_CONFIGS.USER_SESSION, `sessions_${userId}`);

    return {
      success: true,
      action: 'created',
      sessionId: newSession.id,
      details: { sessionData: newSession }
    };
  } catch (error) {
    console.error('[SESSION] Error creando sesión:', error);
    
    await logSecurityEvent({
      user_id: userId,
      event_type: 'SECURITY_VIOLATION',
      event_category: 'authentication',
      severity: 'medium',
      description: 'Error creando sesión',
      metadata: {
        error: error.message,
        clerk_session_id: clerkSessionId
      }
    });

    return {
      success: false,
      action: 'error',
      error: error.message
    };
  }
}

/**
 * Actualiza una sesión existente
 */
export async function updateSession(
  clerkSessionId: string,
  updates: Partial<SessionData>
): Promise<SessionSyncResult> {
  try {
    console.log(`[SESSION] Actualizando sesión ${clerkSessionId}`);

    if (!supabaseAdmin) {
      throw new Error('Supabase admin client no disponible');
    }

    const updateData = {
      ...updates,
      updated_at: new Date().toISOString(),
      last_activity: new Date().toISOString()
    };

    const { data: updatedSession, error: updateError } = await supabaseAdmin
      .from('user_sessions')
      .update(updateData)
      .eq('clerk_session_id', clerkSessionId)
      .eq('status', 'active')
      .select('*')
      .single();

    if (updateError) {
      if (updateError.code === 'PGRST116') {
        return {
          success: false,
          action: 'error',
          error: 'Sesión no encontrada o inactiva'
        };
      }
      throw new Error(`Error actualizando sesión: ${updateError.message}`);
    }

    // Invalidar cache
    const cache = CacheManager.getInstance();
    await cache.delete(CACHE_CONFIGS.USER_SESSION, `sessions_${updatedSession.user_id}`);

    return {
      success: true,
      action: 'updated',
      sessionId: updatedSession.id,
      details: { sessionData: updatedSession }
    };
  } catch (error) {
    console.error('[SESSION] Error actualizando sesión:', error);
    return {
      success: false,
      action: 'error',
      error: error.message
    };
  }
}

/**
 * Limpia sesiones antiguas de un usuario
 */
export async function cleanupOldSessions(
  userId: string,
  keepCount: number = SESSION_CONFIG.maxSessionsPerUser - 1
): Promise<SessionCleanupResult> {
  try {
    console.log(`[SESSION] Limpiando sesiones antiguas para usuario ${userId}`);

    if (!supabaseAdmin) {
      throw new Error('Supabase admin client no disponible');
    }

    // Obtener sesiones activas ordenadas por última actividad
    const { data: sessions, error: fetchError } = await supabaseAdmin
      .from('user_sessions')
      .select('*')
      .eq('user_id', userId)
      .eq('status', 'active')
      .order('last_activity', { ascending: false });

    if (fetchError) {
      throw new Error(`Error obteniendo sesiones: ${fetchError.message}`);
    }

    if (!sessions || sessions.length <= keepCount) {
      return {
        success: true,
        cleaned: 0,
        errors: 0,
        details: { expired: 0, orphaned: 0, invalid: 0 }
      };
    }

    // Sesiones a eliminar (las más antiguas)
    const sessionsToRemove = sessions.slice(keepCount);
    let cleaned = 0;
    let errors = 0;

    for (const session of sessionsToRemove) {
      try {
        const { error: deleteError } = await supabaseAdmin
          .from('user_sessions')
          .update({
            status: 'expired',
            updated_at: new Date().toISOString(),
            metadata: {
              ...session.metadata,
              expired_at: new Date().toISOString(),
              expired_reason: 'max_sessions_exceeded'
            }
          })
          .eq('id', session.id);

        if (deleteError) {
          console.error(`[SESSION] Error eliminando sesión ${session.id}:`, deleteError);
          errors++;
        } else {
          cleaned++;
        }
      } catch (error) {
        console.error(`[SESSION] Error procesando sesión ${session.id}:`, error);
        errors++;
      }
    }

    // Invalidar cache
    const cache = CacheManager.getInstance();
    await cache.delete(CACHE_CONFIGS.USER_SESSION, `sessions_${userId}`);

    return {
      success: errors === 0,
      cleaned,
      errors,
      details: { expired: cleaned, orphaned: 0, invalid: 0 }
    };
  } catch (error) {
    console.error('[SESSION] Error en cleanup de sesiones:', error);
    return {
      success: false,
      cleaned: 0,
      errors: 1,
      details: { expired: 0, orphaned: 0, invalid: 0 }
    };
  }
}

/**
 * Cleanup global de sesiones expiradas
 */
export async function cleanupExpiredSessions(): Promise<SessionCleanupResult> {
  try {
    console.log('[SESSION] Iniciando cleanup global de sesiones expiradas');

    if (!supabaseAdmin) {
      throw new Error('Supabase admin client no disponible');
    }

    const now = new Date().toISOString();
    const inactiveThreshold = new Date(Date.now() - SESSION_CONFIG.maxInactiveTime).toISOString();

    // Buscar sesiones expiradas o inactivas
    const { data: expiredSessions, error: fetchError } = await supabaseAdmin
      .from('user_sessions')
      .select('*')
      .eq('status', 'active')
      .or(`expires_at.lt.${now},last_activity.lt.${inactiveThreshold}`);

    if (fetchError) {
      throw new Error(`Error obteniendo sesiones expiradas: ${fetchError.message}`);
    }

    if (!expiredSessions || expiredSessions.length === 0) {
      return {
        success: true,
        cleaned: 0,
        errors: 0,
        details: { expired: 0, orphaned: 0, invalid: 0 }
      };
    }

    console.log(`[SESSION] Encontradas ${expiredSessions.length} sesiones para limpiar`);

    let expired = 0;
    let orphaned = 0;
    let invalid = 0;
    let errors = 0;

    for (const session of expiredSessions) {
      try {
        // Verificar si la sesión existe en Clerk
        let isOrphaned = false;
        try {
          const client = await clerkClient();
          await client.sessions.getSession(session.clerk_session_id);
        } catch (clerkError) {
          // Sesión no existe en Clerk, es huérfana
          isOrphaned = true;
        }

        const reason = isOrphaned ? 'orphaned' :
                      session.expires_at < now ? 'expired' : 'inactive';

        const { error: updateError } = await supabaseAdmin
          .from('user_sessions')
          .update({
            status: reason === 'orphaned' ? 'invalid' : 'expired',
            updated_at: new Date().toISOString(),
            metadata: {
              ...session.metadata,
              cleanup_at: new Date().toISOString(),
              cleanup_reason: reason
            }
          })
          .eq('id', session.id);

        if (updateError) {
          console.error(`[SESSION] Error actualizando sesión ${session.id}:`, updateError);
          errors++;
        } else {
          if (reason === 'orphaned') orphaned++;
          else if (reason === 'expired') expired++;
          else invalid++;

          // Log evento de limpieza
          await logSecurityEvent({
            user_id: session.user_id,
            event_type: 'ADMIN_ACTION',
            event_category: 'admin_operations',
            severity: 'low',
            description: `Sesión limpiada: ${reason}`,
            metadata: {
              session_id: session.id,
              clerk_session_id: session.clerk_session_id,
              cleanup_reason: reason
            }
          });
        }
      } catch (error) {
        console.error(`[SESSION] Error procesando sesión ${session.id}:`, error);
        errors++;
      }
    }

    console.log(`[SESSION] Cleanup completado: ${expired + orphaned + invalid} sesiones limpiadas, ${errors} errores`);

    return {
      success: errors === 0,
      cleaned: expired + orphaned + invalid,
      errors,
      details: { expired, orphaned, invalid }
    };
  } catch (error) {
    console.error('[SESSION] Error en cleanup global:', error);
    return {
      success: false,
      cleaned: 0,
      errors: 1,
      details: { expired: 0, orphaned: 0, invalid: 0 }
    };
  }
}

/**
 * Sincroniza sesiones entre Clerk y Supabase
 */
export async function syncSessionsWithClerk(userId: string): Promise<SessionSyncResult> {
  try {
    console.log(`[SESSION] Sincronizando sesiones de Clerk para usuario ${userId}`);

    const client = await clerkClient();
    const clerkSessions = await client.users.getUserList({
      userId: [userId]
    });

    if (!clerkSessions || clerkSessions.length === 0) {
      return {
        success: false,
        action: 'error',
        error: 'Usuario no encontrado en Clerk'
      };
    }

    const user = clerkSessions[0];
    const activeSessions = user.sessions?.filter(s => s.status === 'active') || [];

    // Obtener sesiones de Supabase
    const { data: supabaseSessions, error: fetchError } = await supabaseAdmin
      .from('user_sessions')
      .select('*')
      .eq('user_id', userId)
      .eq('status', 'active');

    if (fetchError) {
      throw new Error(`Error obteniendo sesiones de Supabase: ${fetchError.message}`);
    }

    const supabaseSessionIds = new Set(
      supabaseSessions?.map(s => s.clerk_session_id) || []
    );
    const clerkSessionIds = new Set(activeSessions.map(s => s.id));

    // Invalidar sesiones que no existen en Clerk
    const orphanedSessions = supabaseSessions?.filter(
      s => !clerkSessionIds.has(s.clerk_session_id)
    ) || [];

    for (const session of orphanedSessions) {
      await invalidateSession(session.clerk_session_id, 'clerk_sync_orphaned');
    }

    // Crear sesiones que existen en Clerk pero no en Supabase
    const missingSessions = activeSessions.filter(
      s => !supabaseSessionIds.has(s.id)
    );

    for (const session of missingSessions) {
      await createSession(userId, session.id);
    }

    return {
      success: true,
      action: 'updated',
      details: {
        orphaned_cleaned: orphanedSessions.length,
        missing_created: missingSessions.length,
        total_active: activeSessions.length
      }
    };
  } catch (error) {
    console.error('[SESSION] Error sincronizando con Clerk:', error);
    return {
      success: false,
      action: 'error',
      error: error.message
    };
  }
}

// =====================================================
// FUNCIONES DE CONSULTA Y UTILIDADES
// =====================================================

/**
 * Obtiene sesiones activas de un usuario
 */
export async function getUserSessions(userId: string): Promise<SessionData[]> {
  try {
    const cache = CacheManager.getInstance();
    const cacheKey = `sessions_${userId}`;

    // Intentar obtener desde cache
    const cached = await cache.get(CACHE_CONFIGS.USER_SESSION, cacheKey);
    if (cached) {
      return cached as SessionData[];
    }

    if (!supabaseAdmin) {
      throw new Error('Supabase admin client no disponible');
    }

    const { data: sessions, error } = await supabaseAdmin
      .from('user_sessions')
      .select('*')
      .eq('user_id', userId)
      .eq('status', 'active')
      .order('last_activity', { ascending: false });

    if (error) {
      throw new Error(`Error obteniendo sesiones: ${error.message}`);
    }

    const sessionsData = sessions || [];

    // Guardar en cache
    await cache.set(CACHE_CONFIGS.USER_SESSION, cacheKey, sessionsData);

    return sessionsData;
  } catch (error) {
    console.error('[SESSION] Error obteniendo sesiones de usuario:', error);
    return [];
  }
}

/**
 * Obtiene información de una sesión específica
 */
export async function getSessionInfo(clerkSessionId: string): Promise<SessionData | null> {
  try {
    if (!supabaseAdmin) {
      throw new Error('Supabase admin client no disponible');
    }

    const { data: session, error } = await supabaseAdmin
      .from('user_sessions')
      .select('*')
      .eq('clerk_session_id', clerkSessionId)
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        return null; // Sesión no encontrada
      }
      throw new Error(`Error obteniendo sesión: ${error.message}`);
    }

    return session;
  } catch (error) {
    console.error('[SESSION] Error obteniendo información de sesión:', error);
    return null;
  }
}

/**
 * Verifica si una sesión es válida
 */
export async function isSessionValid(clerkSessionId: string): Promise<boolean> {
  try {
    const session = await getSessionInfo(clerkSessionId);

    if (!session || session.status !== 'active') {
      return false;
    }

    const now = new Date();
    const expiresAt = new Date(session.expires_at);
    const lastActivity = new Date(session.last_activity);
    const maxInactive = new Date(now.getTime() - SESSION_CONFIG.maxInactiveTime);

    // Verificar expiración y actividad
    if (expiresAt < now || lastActivity < maxInactive) {
      // Invalidar sesión automáticamente
      await invalidateSession(clerkSessionId, 'auto_expired');
      return false;
    }

    return true;
  } catch (error) {
    console.error('[SESSION] Error verificando validez de sesión:', error);
    return false;
  }
}

/**
 * Actualiza la última actividad de una sesión
 */
export async function updateSessionActivity(
  clerkSessionId: string,
  metadata?: Partial<SessionMetadata>
): Promise<boolean> {
  try {
    const updateData: Partial<SessionData> = {
      last_activity: new Date().toISOString()
    };

    if (metadata) {
      const session = await getSessionInfo(clerkSessionId);
      if (session) {
        updateData.metadata = {
          ...session.metadata,
          ...metadata
        };
      }
    }

    const result = await updateSession(clerkSessionId, updateData);
    return result.success;
  } catch (error) {
    console.error('[SESSION] Error actualizando actividad de sesión:', error);
    return false;
  }
}

/**
 * Invalida todas las sesiones de un usuario
 */
export async function invalidateAllUserSessions(
  userId: string,
  reason: string = 'security_action'
): Promise<SessionCleanupResult> {
  try {
    console.log(`[SESSION] Invalidando todas las sesiones del usuario ${userId}`);

    if (!supabaseAdmin) {
      throw new Error('Supabase admin client no disponible');
    }

    const { data: sessions, error: fetchError } = await supabaseAdmin
      .from('user_sessions')
      .select('*')
      .eq('user_id', userId)
      .eq('status', 'active');

    if (fetchError) {
      throw new Error(`Error obteniendo sesiones: ${fetchError.message}`);
    }

    if (!sessions || sessions.length === 0) {
      return {
        success: true,
        cleaned: 0,
        errors: 0,
        details: { expired: 0, orphaned: 0, invalid: 0 }
      };
    }

    let cleaned = 0;
    let errors = 0;

    for (const session of sessions) {
      const result = await invalidateSession(session.clerk_session_id, reason);
      if (result.success) {
        cleaned++;
      } else {
        errors++;
      }
    }

    // Log acción administrativa
    await logAdminAction(
      userId,
      'INVALIDATE_ALL_SESSIONS',
      'user_sessions',
      {
        userId,
        userRole: 'system',
        permissions: {},
        metadata: { source: 'session_management' }
      },
      {
        reason,
        sessions_invalidated: cleaned,
        errors
      }
    );

    return {
      success: errors === 0,
      cleaned,
      errors,
      details: { expired: 0, orphaned: 0, invalid: cleaned }
    };
  } catch (error) {
    console.error('[SESSION] Error invalidando todas las sesiones:', error);
    return {
      success: false,
      cleaned: 0,
      errors: 1,
      details: { expired: 0, orphaned: 0, invalid: 0 }
    };
  }
}

/**
 * Obtiene estadísticas de sesiones
 */
export async function getSessionStats(): Promise<{
  total: number;
  active: number;
  expired: number;
  revoked: number;
  invalid: number;
  byDevice: Record<string, number>;
}> {
  try {
    if (!supabaseAdmin) {
      throw new Error('Supabase admin client no disponible');
    }

    const { data: sessions, error } = await supabaseAdmin
      .from('user_sessions')
      .select('status, device_info');

    if (error) {
      throw new Error(`Error obteniendo estadísticas: ${error.message}`);
    }

    const stats = {
      total: sessions?.length || 0,
      active: 0,
      expired: 0,
      revoked: 0,
      invalid: 0,
      byDevice: {} as Record<string, number>
    };

    sessions?.forEach(session => {
      // Contar por status
      switch (session.status) {
        case 'active':
          stats.active++;
          break;
        case 'expired':
          stats.expired++;
          break;
        case 'revoked':
          stats.revoked++;
          break;
        case 'invalid':
          stats.invalid++;
          break;
      }

      // Contar por dispositivo
      const deviceType = session.device_info?.type || 'unknown';
      stats.byDevice[deviceType] = (stats.byDevice[deviceType] || 0) + 1;
    });

    return stats;
  } catch (error) {
    console.error('[SESSION] Error obteniendo estadísticas:', error);
    return {
      total: 0,
      active: 0,
      expired: 0,
      revoked: 0,
      invalid: 0,
      byDevice: {}
    };
  }
}

// =====================================================
// FUNCIONES DE INICIALIZACIÓN Y CLEANUP AUTOMÁTICO
// =====================================================

/**
 * Inicia el cleanup automático de sesiones
 */
export function startSessionCleanup(): NodeJS.Timeout {
  console.log('[SESSION] Iniciando cleanup automático de sesiones');

  return setInterval(async () => {
    try {
      const result = await cleanupExpiredSessions();
      if (result.cleaned > 0) {
        console.log(`[SESSION] Cleanup automático: ${result.cleaned} sesiones limpiadas`);
      }
    } catch (error) {
      console.error('[SESSION] Error en cleanup automático:', error);
    }
  }, SESSION_CONFIG.cleanupInterval);
}

/**
 * Detiene el cleanup automático
 */
export function stopSessionCleanup(intervalId: NodeJS.Timeout): void {
  clearInterval(intervalId);
  console.log('[SESSION] Cleanup automático detenido');
}

/**
 * Invalida una sesión específica
 */
export async function invalidateSession(
  clerkSessionId: string,
  reason: string = 'manual_logout'
): Promise<SessionSyncResult> {
  try {
    console.log(`[SESSION] Invalidando sesión ${clerkSessionId} - Razón: ${reason}`);

    if (!supabaseAdmin) {
      throw new Error('Supabase admin client no disponible');
    }

    const { data: invalidatedSession, error: updateError } = await supabaseAdmin
      .from('user_sessions')
      .update({
        status: 'revoked',
        updated_at: new Date().toISOString(),
        metadata: {
          revoked_at: new Date().toISOString(),
          revoked_reason: reason
        }
      })
      .eq('clerk_session_id', clerkSessionId)
      .select('*')
      .single();

    if (updateError) {
      if (updateError.code === 'PGRST116') {
        return {
          success: true,
          action: 'found_existing',
          details: { message: 'Sesión ya invalidada o no encontrada' }
        };
      }
      throw new Error(`Error invalidando sesión: ${updateError.message}`);
    }

    // Log evento de seguridad
    await logSecurityEvent({
      user_id: invalidatedSession.user_id,
      event_type: 'AUTH_SUCCESS',
      event_category: 'authentication',
      severity: 'low',
      description: 'Sesión invalidada',
      metadata: {
        session_id: invalidatedSession.id,
        clerk_session_id: clerkSessionId,
        reason
      }
    });

    // Invalidar cache
    const cache = CacheManager.getInstance();
    await cache.delete(CACHE_CONFIGS.USER_SESSION, `sessions_${invalidatedSession.user_id}`);

    return {
      success: true,
      action: 'deleted',
      sessionId: invalidatedSession.id,
      details: { sessionData: invalidatedSession }
    };
  } catch (error) {
    console.error('[SESSION] Error invalidando sesión:', error);
    return {
      success: false,
      action: 'error',
      error: error.message
    };
  }
}
