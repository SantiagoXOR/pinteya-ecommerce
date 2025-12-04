// ===================================
// SUPABASE CONNECTION POOL MANAGER
// ===================================

import { createClient, SupabaseClient } from '@supabase/supabase-js'
import { CONNECTION_POOL_CONFIG } from '../config/api-timeouts'

interface PoolConnection {
  client: SupabaseClient
  createdAt: number
  lastUsed: number
  inUse: boolean
  id: string
}

interface PoolStats {
  totalConnections: number
  activeConnections: number
  idleConnections: number
  maxConnections: number
  minConnections: number
}

class SupabaseConnectionPool {
  private connections: Map<string, PoolConnection> = new Map()
  private config = CONNECTION_POOL_CONFIG.supabase
  private cleanupInterval: NodeJS.Timeout | null = null

  constructor() {
    this.initializePool()
    this.startCleanupProcess()
  }

  private initializePool(): void {
    // Crear conexiones mínimas al inicializar
    for (let i = 0; i < this.config.minConnections; i++) {
      this.createConnection()
    }
  }

  private createConnection(): PoolConnection {
    const connectionId = `conn_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`

    const client = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        auth: {
          persistSession: false, // No persistir sesiones en el pool
          autoRefreshToken: false,
        },
        global: {
          headers: {
            'x-connection-pool': 'true',
            'x-connection-id': connectionId,
          },
        },
      }
    )

    const connection: PoolConnection = {
      client,
      createdAt: Date.now(),
      lastUsed: Date.now(),
      inUse: false,
      id: connectionId,
    }

    this.connections.set(connectionId, connection)
    return connection
  }

  public async acquireConnection(): Promise<{ client: SupabaseClient; release: () => void }> {
    return new Promise((resolve, reject) => {
      const timeout = setTimeout(() => {
        reject(new Error('Connection acquire timeout'))
      }, this.config.acquireTimeout)

      // Buscar conexión disponible
      for (const [id, connection] of Array.from(this.connections.entries())) {
        if (!connection.inUse && this.isConnectionValid(connection)) {
          clearTimeout(timeout)
          connection.inUse = true
          connection.lastUsed = Date.now()

          const release = () => {
            connection.inUse = false
            connection.lastUsed = Date.now()
          }

          resolve({ client: connection.client, release })
          return
        }
      }

      // Si no hay conexiones disponibles y podemos crear más
      if (this.connections.size < this.config.maxConnections) {
        clearTimeout(timeout)
        const newConnection = this.createConnection()
        newConnection.inUse = true

        const release = () => {
          newConnection.inUse = false
          newConnection.lastUsed = Date.now()
        }

        resolve({ client: newConnection.client, release })
        return
      }

      // Si llegamos aquí, no hay conexiones disponibles
      reject(new Error('No connections available in pool'))
    })
  }

  private isConnectionValid(connection: PoolConnection): boolean {
    const now = Date.now()
    const age = now - connection.createdAt
    const idleTime = now - connection.lastUsed

    // Verificar si la conexión ha expirado
    if (age > this.config.connectionLifetime) {
      return false
    }

    // Verificar si ha estado inactiva demasiado tiempo
    if (idleTime > this.config.idleTimeout) {
      return false
    }

    return true
  }

  private startCleanupProcess(): void {
    this.cleanupInterval = setInterval(() => {
      this.cleanup()
    }, this.config.cleanupInterval)
  }

  private cleanup(): void {
    const now = Date.now()
    const connectionsToRemove: string[] = []

    // Usar Array.from para iterar sobre las conexiones
    for (const [id, connection] of Array.from(this.connections.entries())) {
      // Remover conexiones expiradas o inválidas
      if (now - connection.lastUsed > this.config.idleTimeout || !connection.client) {
        connectionsToRemove.push(id)
      }
    }

    // Remover conexiones identificadas
    connectionsToRemove.forEach(id => this.connections.delete(id))

    // Asegurar que mantenemos el mínimo de conexiones
    while (this.connections.size < this.config.minConnections) {
      this.createConnection()
    }
  }

  public getPoolStats() {
    const total = this.connections.size
    const inUse = Array.from(this.connections.values()).filter(c => c.inUse).length
    const available = total - inUse

    return {
      total,
      inUse,
      available,
      maxConnections: this.config.maxConnections,
      minConnections: this.config.minConnections,
    }
  }

  public getStats(): PoolStats {
    return {
      totalConnections: this.connections.size,
      activeConnections: Array.from(this.connections.values()).filter(c => c.inUse).length,
      idleConnections: Array.from(this.connections.values()).filter(c => !c.inUse).length,
      maxConnections: this.config.maxConnections,
      minConnections: this.config.minConnections,
    }
  }

  public destroy(): void {
    if (this.cleanupInterval) {
      clearInterval(this.cleanupInterval)
    }
    this.connections.clear()
  }
}

// Singleton instance
let poolInstance: SupabaseConnectionPool | null = null

export function getConnectionPool(): SupabaseConnectionPool {
  if (!poolInstance) {
    poolInstance = new SupabaseConnectionPool()
  }
  return poolInstance
}

export function destroyConnectionPool(): void {
  if (poolInstance) {
    poolInstance.destroy()
    poolInstance = null
  }
}

// Hook para usar el pool en componentes React
export function useSupabasePool() {
  const pool = getConnectionPool()

  return {
    acquireConnection: pool.acquireConnection.bind(pool),
    getStats: pool.getPoolStats.bind(pool),
  }
}
