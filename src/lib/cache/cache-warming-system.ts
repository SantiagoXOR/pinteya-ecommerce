// ===================================
// PINTEYA E-COMMERCE - CACHE WARMING SYSTEM
// ===================================

import { logger, LogCategory } from '../enterprise/logger';
import { multiLayerCacheManager } from './multi-layer-cache-manager';
import { advancedCacheStrategyManager } from './advanced-cache-strategy-manager';
import { supabase } from '../supabase';

/**
 * Estrategias de precalentamiento
 */
export enum WarmupStrategy {
  IMMEDIATE = 'immediate',        // Inmediato al iniciar
  SCHEDULED = 'scheduled',        // Programado por horarios
  LAZY = 'lazy',                 // Bajo demanda
  PREDICTIVE = 'predictive',     // Basado en predicciones
  POPULAR = 'popular',           // Basado en popularidad
  CRITICAL = 'critical'          // Solo datos críticos
}

/**
 * Configuración de precalentamiento
 */
export interface WarmupConfig {
  strategy: WarmupStrategy;
  priority: 'low' | 'normal' | 'high' | 'critical';
  schedule?: {
    enabled: boolean;
    cron?: string;
    interval?: number;
    timezone?: string;
  };
  conditions?: {
    minCacheHitRate?: number;
    maxServerLoad?: number;
    timeWindows?: Array<{ start: string; end: string }>;
  };
  retryPolicy?: {
    maxRetries: number;
    backoffMultiplier: number;
    initialDelay: number;
  };
  batchSize?: number;
  concurrency?: number;
  timeout?: number;
}

/**
 * Tarea de precalentamiento
 */
export interface WarmupTask {
  id: string;
  name: string;
  description: string;
  config: WarmupConfig;
  fetcher: () => Promise<any>;
  cacheKey: string;
  strategyName: string;
  dependencies?: string[];
  estimatedDuration?: number;
  lastRun?: number;
  nextRun?: number;
  successCount: number;
  errorCount: number;
  avgDuration: number;
}

/**
 * Resultado de precalentamiento
 */
export interface WarmupResult {
  taskId: string;
  success: boolean;
  duration: number;
  cacheKey: string;
  dataSize: number;
  error?: string;
  timestamp: number;
}

/**
 * Estadísticas de precalentamiento
 */
export interface WarmupStats {
  totalTasks: number;
  activeTasks: number;
  completedTasks: number;
  failedTasks: number;
  totalDuration: number;
  avgDuration: number;
  cacheHitImprovement: number;
  lastRun: number;
}

/**
 * Configuraciones predefinidas de precalentamiento
 */
export const WARMUP_CONFIGS: Record<string, WarmupConfig> = {
  // Datos críticos del sistema
  CRITICAL_SYSTEM: {
    strategy: WarmupStrategy.IMMEDIATE,
    priority: 'critical',
    batchSize: 5,
    concurrency: 2,
    timeout: 30000,
    retryPolicy: {
      maxRetries: 3,
      backoffMultiplier: 2,
      initialDelay: 1000
    }
  },

  // Productos populares
  POPULAR_PRODUCTS: {
    strategy: WarmupStrategy.SCHEDULED,
    priority: 'high',
    schedule: {
      enabled: true,
      interval: 3600000, // 1 hora
      timezone: 'America/Argentina/Buenos_Aires'
    },
    batchSize: 20,
    concurrency: 5,
    timeout: 15000,
    conditions: {
      maxServerLoad: 0.7,
      timeWindows: [
        { start: '02:00', end: '06:00' }, // Madrugada
        { start: '14:00', end: '16:00' }  // Siesta
      ]
    }
  },

  // Categorías principales
  MAIN_CATEGORIES: {
    strategy: WarmupStrategy.SCHEDULED,
    priority: 'normal',
    schedule: {
      enabled: true,
      interval: 7200000, // 2 horas
      timezone: 'America/Argentina/Buenos_Aires'
    },
    batchSize: 10,
    concurrency: 3,
    timeout: 10000
  },

  // Búsquedas frecuentes
  FREQUENT_SEARCHES: {
    strategy: WarmupStrategy.PREDICTIVE,
    priority: 'normal',
    batchSize: 15,
    concurrency: 4,
    timeout: 12000,
    conditions: {
      minCacheHitRate: 0.6
    }
  },

  // Datos de usuario activos
  ACTIVE_USERS: {
    strategy: WarmupStrategy.LAZY,
    priority: 'low',
    batchSize: 10,
    concurrency: 2,
    timeout: 8000
  }
};

/**
 * Sistema de precalentamiento de cache
 */
export class CacheWarmingSystem {
  private static instance: CacheWarmingSystem;
  private tasks = new Map<string, WarmupTask>();
  private activeJobs = new Map<string, Promise<WarmupResult>>();
  private scheduledJobs = new Map<string, NodeJS.Timeout>();
  private stats: WarmupStats = {
    totalTasks: 0,
    activeTasks: 0,
    completedTasks: 0,
    failedTasks: 0,
    totalDuration: 0,
    avgDuration: 0,
    cacheHitImprovement: 0,
    lastRun: 0
  };

  private constructor() {
    this.initializePredefinedTasks();
  }

  static getInstance(): CacheWarmingSystem {
    if (!CacheWarmingSystem.instance) {
      CacheWarmingSystem.instance = new CacheWarmingSystem();
    }
    return CacheWarmingSystem.instance;
  }

  /**
   * Inicializa tareas predefinidas
   */
  private initializePredefinedTasks(): void {
    // Tarea para productos populares
    this.registerTask({
      id: 'popular-products',
      name: 'Productos Populares',
      description: 'Precalienta cache de productos más vendidos',
      config: WARMUP_CONFIGS.POPULAR_PRODUCTS,
      fetcher: this.fetchPopularProducts.bind(this),
      cacheKey: 'products:popular',
      strategyName: 'PRODUCT_DATA',
      estimatedDuration: 5000,
      successCount: 0,
      errorCount: 0,
      avgDuration: 0
    });

    // Tarea para categorías principales
    this.registerTask({
      id: 'main-categories',
      name: 'Categorías Principales',
      description: 'Precalienta cache de categorías principales',
      config: WARMUP_CONFIGS.MAIN_CATEGORIES,
      fetcher: this.fetchMainCategories.bind(this),
      cacheKey: 'categories:main',
      strategyName: 'PRODUCT_DATA',
      estimatedDuration: 3000,
      successCount: 0,
      errorCount: 0,
      avgDuration: 0
    });

    // Tarea para configuración del sistema
    this.registerTask({
      id: 'system-config',
      name: 'Configuración del Sistema',
      description: 'Precalienta configuraciones críticas del sistema',
      config: WARMUP_CONFIGS.CRITICAL_SYSTEM,
      fetcher: this.fetchSystemConfig.bind(this),
      cacheKey: 'system:config',
      strategyName: 'CRITICAL_SYSTEM_DATA',
      estimatedDuration: 2000,
      successCount: 0,
      errorCount: 0,
      avgDuration: 0
    });

    // Tarea para búsquedas frecuentes
    this.registerTask({
      id: 'frequent-searches',
      name: 'Búsquedas Frecuentes',
      description: 'Precalienta resultados de búsquedas más frecuentes',
      config: WARMUP_CONFIGS.FREQUENT_SEARCHES,
      fetcher: this.fetchFrequentSearches.bind(this),
      cacheKey: 'search:frequent',
      strategyName: 'SEARCH_RESULTS',
      estimatedDuration: 4000,
      successCount: 0,
      errorCount: 0,
      avgDuration: 0
    });
  }

  /**
   * Registra una nueva tarea de precalentamiento
   */
  registerTask(task: WarmupTask): void {
    this.tasks.set(task.id, task);
    this.stats.totalTasks = this.tasks.size;
    
    // Programar tarea si es necesario
    if (task.config.schedule?.enabled) {
      this.scheduleTask(task);
    }
    
    // Ejecutar inmediatamente si es estrategia immediate
    if (task.config.strategy === WarmupStrategy.IMMEDIATE) {
      this.executeTask(task.id);
    }
    
    logger.info(LogCategory.CACHE, `Tarea de precalentamiento registrada: ${task.name}`);
  }

  /**
   * Ejecuta una tarea de precalentamiento
   */
  async executeTask(taskId: string): Promise<WarmupResult> {
    const task = this.tasks.get(taskId);
    if (!task) {
      throw new Error(`Tarea no encontrada: ${taskId}`);
    }

    // Verificar si ya está ejecutándose
    if (this.activeJobs.has(taskId)) {
      logger.warn(LogCategory.CACHE, `Tarea ya en ejecución: ${taskId}`);
      return this.activeJobs.get(taskId)!;
    }

    // Verificar condiciones
    if (!await this.checkConditions(task.config)) {
      throw new Error(`Condiciones no cumplidas para tarea: ${taskId}`);
    }

    const startTime = Date.now();
    this.stats.activeTasks++;

    const jobPromise = this.executeTaskWithRetry(task);
    this.activeJobs.set(taskId, jobPromise);

    try {
      const result = await jobPromise;
      
      // Actualizar estadísticas de la tarea
      task.successCount++;
      task.lastRun = Date.now();
      task.avgDuration = ((task.avgDuration * (task.successCount - 1)) + result.duration) / task.successCount;
      
      // Actualizar estadísticas globales
      this.stats.completedTasks++;
      this.stats.totalDuration += result.duration;
      this.stats.avgDuration = this.stats.totalDuration / this.stats.completedTasks;
      this.stats.lastRun = Date.now();
      
      logger.info(LogCategory.CACHE, `Tarea completada: ${task.name} (${result.duration}ms)`);
      return result;
      
    } catch (error) {
      // Actualizar estadísticas de error
      task.errorCount++;
      this.stats.failedTasks++;
      
      logger.error(LogCategory.CACHE, `Error en tarea: ${task.name}`, error as Error);
      throw error;
      
    } finally {
      this.activeJobs.delete(taskId);
      this.stats.activeTasks--;
    }
  }

  /**
   * Ejecuta tarea con reintentos
   */
  private async executeTaskWithRetry(task: WarmupTask): Promise<WarmupResult> {
    const { retryPolicy } = task.config;
    let lastError: Error | null = null;
    
    const maxRetries = retryPolicy?.maxRetries || 1;
    const backoffMultiplier = retryPolicy?.backoffMultiplier || 2;
    const initialDelay = retryPolicy?.initialDelay || 1000;

    for (let attempt = 0; attempt < maxRetries; attempt++) {
      try {
        return await this.executeSingleTask(task);
      } catch (error) {
        lastError = error as Error;
        
        if (attempt < maxRetries - 1) {
          const delay = initialDelay * Math.pow(backoffMultiplier, attempt);
          logger.warn(LogCategory.CACHE, `Reintentando tarea ${task.name} en ${delay}ms (intento ${attempt + 1}/${maxRetries})`);
          await new Promise(resolve => setTimeout(resolve, delay));
        }
      }
    }

    throw lastError;
  }

  /**
   * Ejecuta una sola tarea
   */
  private async executeSingleTask(task: WarmupTask): Promise<WarmupResult> {
    const startTime = Date.now();
    
    try {
      // Ejecutar fetcher con timeout
      const timeoutPromise = new Promise((_, reject) => {
        setTimeout(() => reject(new Error('Timeout')), task.config.timeout || 30000);
      });
      
      const dataPromise = task.fetcher();
      const data = await Promise.race([dataPromise, timeoutPromise]);
      
      // Guardar en cache usando la estrategia especificada
      await advancedCacheStrategyManager.execute(
        task.cacheKey,
        () => Promise.resolve(data),
        task.strategyName
      );
      
      const duration = Date.now() - startTime;
      const dataSize = JSON.stringify(data).length;
      
      return {
        taskId: task.id,
        success: true,
        duration,
        cacheKey: task.cacheKey,
        dataSize,
        timestamp: Date.now()
      };
      
    } catch (error) {
      const duration = Date.now() - startTime;
      
      return {
        taskId: task.id,
        success: false,
        duration,
        cacheKey: task.cacheKey,
        dataSize: 0,
        error: (error as Error).message,
        timestamp: Date.now()
      };
    }
  }

  /**
   * Programa una tarea
   */
  private scheduleTask(task: WarmupTask): void {
    const { schedule } = task.config;
    if (!schedule?.enabled) {return;}

    // Limpiar programación anterior si existe
    const existingJob = this.scheduledJobs.get(task.id);
    if (existingJob) {
      clearInterval(existingJob);
    }

    // Programar nueva ejecución
    if (schedule.interval) {
      const interval = setInterval(() => {
        this.executeTask(task.id).catch(error => {
          logger.error(LogCategory.CACHE, `Error en tarea programada: ${task.name}`, error);
        });
      }, schedule.interval);
      
      this.scheduledJobs.set(task.id, interval);
      
      // Calcular próxima ejecución
      task.nextRun = Date.now() + schedule.interval;
    }
  }

  /**
   * Verifica condiciones para ejecutar tarea
   */
  private async checkConditions(config: WarmupConfig): Promise<boolean> {
    const { conditions } = config;
    if (!conditions) {return true;}

    // Verificar carga del servidor
    if (conditions.maxServerLoad) {
      const serverLoad = await this.getServerLoad();
      if (serverLoad > conditions.maxServerLoad) {
        return false;
      }
    }

    // Verificar ventanas de tiempo
    if (conditions.timeWindows) {
      const now = new Date();
      const currentTime = `${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}`;
      
      const isInTimeWindow = conditions.timeWindows.some(window => {
        return currentTime >= window.start && currentTime <= window.end;
      });
      
      if (!isInTimeWindow) {
        return false;
      }
    }

    // Verificar hit rate mínimo
    if (conditions.minCacheHitRate) {
      const hitRate = await this.getCacheHitRate();
      if (hitRate < conditions.minCacheHitRate) {
        return false;
      }
    }

    return true;
  }

  /**
   * Obtiene carga del servidor (placeholder)
   */
  private async getServerLoad(): Promise<number> {
    // Implementar lógica real de monitoreo de carga
    return Math.random() * 0.8; // Placeholder
  }

  /**
   * Obtiene hit rate del cache
   */
  private async getCacheHitRate(): Promise<number> {
    const metrics = advancedCacheStrategyManager.getAllMetrics();
    const totalRequests = Object.values(metrics).reduce((sum, m) => sum + m.totalRequests, 0);
    const totalHits = Object.values(metrics).reduce((sum, m) => sum + m.hits, 0);
    
    return totalRequests > 0 ? totalHits / totalRequests : 0;
  }

  /**
   * Ejecuta todas las tareas de una estrategia
   */
  async executeStrategy(strategy: WarmupStrategy): Promise<WarmupResult[]> {
    const strategyTasks = Array.from(this.tasks.values())
      .filter(task => task.config.strategy === strategy);

    const results = await Promise.allSettled(
      strategyTasks.map(task => this.executeTask(task.id))
    );

    return results.map((result, index) => {
      if (result.status === 'fulfilled') {
        return result.value;
      } else {
        return {
          taskId: strategyTasks[index].id,
          success: false,
          duration: 0,
          cacheKey: strategyTasks[index].cacheKey,
          dataSize: 0,
          error: result.reason.message,
          timestamp: Date.now()
        };
      }
    });
  }

  /**
   * Obtiene estadísticas del sistema
   */
  getStats(): WarmupStats {
    return { ...this.stats };
  }

  /**
   * Obtiene todas las tareas
   */
  getTasks(): WarmupTask[] {
    return Array.from(this.tasks.values());
  }

  /**
   * Obtiene una tarea específica
   */
  getTask(taskId: string): WarmupTask | undefined {
    return this.tasks.get(taskId);
  }

  /**
   * Elimina una tarea
   */
  removeTask(taskId: string): boolean {
    const task = this.tasks.get(taskId);
    if (!task) {return false;}

    // Limpiar programación
    const scheduledJob = this.scheduledJobs.get(taskId);
    if (scheduledJob) {
      clearInterval(scheduledJob);
      this.scheduledJobs.delete(taskId);
    }

    // Eliminar tarea
    this.tasks.delete(taskId);
    this.stats.totalTasks = this.tasks.size;
    
    logger.info(LogCategory.CACHE, `Tarea eliminada: ${task.name}`);
    return true;
  }

  /**
   * Detiene todas las tareas
   */
  stopAll(): void {
    this.scheduledJobs.forEach((job) => {
      clearInterval(job);
    });
    this.scheduledJobs.clear();
    
    logger.info(LogCategory.CACHE, 'Todas las tareas de precalentamiento detenidas');
  }

  // ===================================
  // FETCHERS PREDEFINIDOS
  // ===================================

  /**
   * Obtiene productos populares
   */
  private async fetchPopularProducts(): Promise<any> {
    const { data, error } = await supabase
      .from('products')
      .select(`
        id,
        name,
        price,
        image_url,
        category:categories(name),
        inventory:inventory(stock)
      `)
      .eq('featured', true)
      .order('sales_count', { ascending: false })
      .limit(20);

    if (error) {throw error;}
    return data;
  }

  /**
   * Obtiene categorías principales
   */
  private async fetchMainCategories(): Promise<any> {
    const { data, error } = await supabase
      .from('categories')
      .select('*')
      .eq('parent_id', null)
      .order('order_index');

    if (error) {throw error;}
    return data;
  }

  /**
   * Obtiene configuración del sistema
   */
  private async fetchSystemConfig(): Promise<any> {
    // Simular configuración del sistema
    return {
      siteName: 'Pinteya E-commerce',
      currency: 'ARS',
      timezone: 'America/Argentina/Buenos_Aires',
      features: {
        cart: true,
        wishlist: true,
        reviews: true,
        notifications: true
      },
      limits: {
        maxCartItems: 50,
        maxWishlistItems: 100,
        maxImageSize: 5242880 // 5MB
      }
    };
  }

  /**
   * Obtiene búsquedas frecuentes
   */
  private async fetchFrequentSearches(): Promise<any> {
    // Simular búsquedas frecuentes
    return [
      { query: 'pintura', count: 150 },
      { query: 'herramientas', count: 120 },
      { query: 'taladro', count: 95 },
      { query: 'martillo', count: 80 },
      { query: 'destornillador', count: 75 }
    ];
  }
}

// Instancia singleton
export const cacheWarmingSystem = CacheWarmingSystem.getInstance();

/**
 * Utilidades para precalentamiento de cache
 */
export const CacheWarmingUtils = {
  /**
   * Precalienta cache para una página específica
   */
  async warmupPage(pagePath: string): Promise<void> {
    const tasks: Array<{ key: string; fetcher: () => Promise<any>; strategy: string }> = [];

    if (pagePath === '/') {
      tasks.push(
        { key: 'home:featured-products', fetcher: () => cacheWarmingSystem['fetchPopularProducts'](), strategy: 'PRODUCT_DATA' },
        { key: 'home:main-categories', fetcher: () => cacheWarmingSystem['fetchMainCategories'](), strategy: 'PRODUCT_DATA' }
      );
    } else if (pagePath.startsWith('/shop')) {
      tasks.push(
        { key: 'shop:products', fetcher: () => cacheWarmingSystem['fetchPopularProducts'](), strategy: 'PRODUCT_DATA' },
        { key: 'shop:categories', fetcher: () => cacheWarmingSystem['fetchMainCategories'](), strategy: 'PRODUCT_DATA' }
      );
    }

    const warmupPromises = tasks.map(task =>
      advancedCacheStrategyManager.execute(task.key, task.fetcher, task.strategy)
    );

    await Promise.allSettled(warmupPromises);
  },

  /**
   * Precalienta cache basado en usuario
   */
  async warmupForUser(userId: string): Promise<void> {
    // Implementar lógica específica del usuario
    logger.info(LogCategory.CACHE, `Precalentando cache para usuario: ${userId}`);
  },

  /**
   * Precalienta cache crítico
   */
  async warmupCritical(): Promise<void> {
    await cacheWarmingSystem.executeStrategy(WarmupStrategy.CRITICAL);
  }
};









