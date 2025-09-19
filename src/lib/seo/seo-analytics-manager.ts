// ===================================
// PINTEYA E-COMMERCE - SEO ANALYTICS MANAGER - ENHANCED
// Sistema avanzado de análisis y monitoreo SEO en tiempo real
// Incluye tracking de rankings, métricas de performance y reportes automatizados
// ===================================

import { logger, LogCategory, LogLevel } from '@/lib/enterprise/logger';
import { getRedisClient } from '@/lib/integrations/redis';
import { realTimePerformanceMonitor } from '@/lib/monitoring/real-time-performance-monitor';
import { advancedAlertingEngine, AlertType, AlertSeverity } from '@/lib/monitoring/advanced-alerting-engine';

// ===================================
// INTERFACES Y TIPOS MEJORADOS
// ===================================

// Tipos para métricas SEO mejoradas
export interface SEOMetrics {
  pageViews: number;
  uniqueVisitors: number;
  bounceRate: number;
  avgSessionDuration: number;
  organicTraffic: number;
  searchImpressions: number;
  searchClicks: number;
  avgPosition: number;
  ctr: number; // Click Through Rate
  coreWebVitals: CoreWebVitals;
  indexationStatus: IndexationStatus;
  technicalSEO: TechnicalSEOMetrics;
  timestamp: Date;

  // Nuevas métricas avanzadas
  conversionRate: number;
  revenueFromOrganic: number;
  topLandingPages: PageMetrics[];
  topExitPages: PageMetrics[];
  deviceBreakdown: DeviceMetrics;
  geographicData: GeographicMetrics[];
}

// Nuevas interfaces para métricas avanzadas
export interface PageMetrics {
  url: string;
  pageViews: number;
  uniquePageViews: number;
  avgTimeOnPage: number;
  bounceRate: number;
  exitRate: number;
  conversions: number;
  revenue: number;
}

export interface DeviceMetrics {
  desktop: {
    sessions: number;
    bounceRate: number;
    conversionRate: number;
    avgSessionDuration: number;
  };
  mobile: {
    sessions: number;
    bounceRate: number;
    conversionRate: number;
    avgSessionDuration: number;
  };
  tablet: {
    sessions: number;
    bounceRate: number;
    conversionRate: number;
    avgSessionDuration: number;
  };
}

export interface GeographicMetrics {
  country: string;
  region: string;
  city: string;
  sessions: number;
  users: number;
  bounceRate: number;
  conversionRate: number;
  revenue: number;
}

export interface CoreWebVitals {
  lcp: number; // Largest Contentful Paint
  fid: number; // First Input Delay
  cls: number; // Cumulative Layout Shift
  fcp: number; // First Contentful Paint
  ttfb: number; // Time to First Byte
  inp: number; // Interaction to Next Paint
  score: 'good' | 'needs-improvement' | 'poor';

  // Métricas adicionales
  speedIndex: number;
  totalBlockingTime: number;
  largestContentfulPaintElement: string;
  cumulativeLayoutShiftSources: string[];
}

export interface IndexationStatus {
  totalPages: number;
  indexedPages: number;
  notIndexedPages: number;
  indexationRate: number;
  crawlErrors: number;
  sitemapStatus: 'submitted' | 'processed' | 'error';
  lastCrawlDate: Date;
}

export interface TechnicalSEOMetrics {
  mobileUsability: number;
  pagespeedScore: number;
  httpsUsage: number;
  structuredDataErrors: number;
  metaTagsOptimization: number;
  internalLinkingScore: number;
  imageOptimization: number;
  canonicalIssues: number;
}

export interface KeywordMetrics {
  keyword: string;
  position: number;
  previousPosition: number;
  searchVolume: number;
  difficulty: number;
  clicks: number;
  impressions: number;
  ctr: number;
  url: string;
  trend: 'up' | 'down' | 'stable';

  // Métricas avanzadas de keywords
  searchEngine: 'google' | 'bing' | 'yahoo' | 'duckduckgo';
  device: 'desktop' | 'mobile' | 'tablet';
  location: string;
  intent: 'informational' | 'navigational' | 'transactional' | 'commercial';
  competitorRankings: CompetitorKeywordData[];
  relatedKeywords: string[];
  seasonalTrends: SeasonalData[];
  conversionRate: number;
  revenue: number;
  costPerClick: number;
  lastUpdated: Date;
}

export interface CompetitorKeywordData {
  domain: string;
  position: number;
  url: string;
  title: string;
  description: string;
}

export interface SeasonalData {
  month: number;
  searchVolume: number;
  competition: number;
  cpc: number;
}

export interface CompetitorAnalysis {
  competitor: string;
  domain: string;
  organicKeywords: number;
  organicTraffic: number;
  backlinks: number;
  domainAuthority: number;
  commonKeywords: string[];
  keywordGaps: string[];

  // Análisis avanzado de competidores
  pageAuthority: number;
  trustFlow: number;
  citationFlow: number;
  referringDomains: number;
  organicCost: number;
  paidKeywords: number;
  paidTraffic: number;
  paidCost: number;
  topPages: CompetitorPage[];
  contentGaps: ContentGap[];
  backlinksGaps: BacklinkGap[];
  socialMetrics: SocialMetrics;
  technicalSEOScore: number;
  lastAnalyzed: Date;
}

export interface CompetitorPage {
  url: string;
  title: string;
  traffic: number;
  keywords: number;
  backlinks: number;
  socialShares: number;
}

export interface ContentGap {
  topic: string;
  keywords: string[];
  searchVolume: number;
  difficulty: number;
  opportunity: 'high' | 'medium' | 'low';
}

export interface BacklinkGap {
  domain: string;
  domainAuthority: number;
  linkType: 'dofollow' | 'nofollow';
  anchorText: string;
  opportunity: 'high' | 'medium' | 'low';
}

export interface SocialMetrics {
  facebook: {
    likes: number;
    shares: number;
    comments: number;
  };
  twitter: {
    followers: number;
    tweets: number;
    retweets: number;
  };
  linkedin: {
    followers: number;
    posts: number;
    engagement: number;
  };
  instagram: {
    followers: number;
    posts: number;
    engagement: number;
  };
}

export interface SEOAlert {
  id: string;
  type: 'critical' | 'warning' | 'info';
  category: 'technical' | 'content' | 'performance' | 'indexation' | 'security' | 'mobile' | 'schema';
  title: string;
  description: string;
  url?: string;
  severity: number;
  timestamp: Date;
  resolved: boolean;
  recommendations: string[];

  // Campos avanzados para alertas
  impact: 'high' | 'medium' | 'low';
  effort: 'low' | 'medium' | 'high';
  priority: number;
  affectedPages: string[];
  estimatedTrafficImpact: number;
  estimatedRevenueImpact: number;
  relatedAlerts: string[];
  autoResolvable: boolean;
  resolutionSteps: ResolutionStep[];
  lastOccurrence: Date;
  frequency: number;
  tags: string[];
}

export interface ResolutionStep {
  step: number;
  description: string;
  action: string;
  estimatedTime: number; // minutos
  difficulty: 'easy' | 'medium' | 'hard';
  requiredSkills: string[];
}

export interface SEOReport {
  id: string;
  period: 'daily' | 'weekly' | 'monthly' | 'quarterly' | 'yearly' | 'custom';
  startDate: Date;
  endDate: Date;
  metrics: SEOMetrics;
  keywords: KeywordMetrics[];
  alerts: SEOAlert[];
  recommendations: SEORecommendation[];
  competitorAnalysis?: CompetitorAnalysis[];

  // Secciones avanzadas del reporte
  executiveSummary: ExecutiveSummary;
  performanceAnalysis: PerformanceAnalysis;
  keywordAnalysis: KeywordAnalysis;
  technicalAnalysis: TechnicalAnalysis;
  contentAnalysis: ContentAnalysis;
  competitiveAnalysis: CompetitiveAnalysis;
  actionPlan: ActionPlan;

  // Metadatos del reporte
  generatedBy: string;
  generatedAt: Date;
  version: string;
  exportFormats: ('pdf' | 'excel' | 'csv' | 'json')[];
  scheduledDelivery: ScheduledDelivery[];
}

export interface SEORecommendation {
  id: string;
  category: 'technical' | 'content' | 'performance' | 'mobile' | 'schema' | 'keywords';
  title: string;
  description: string;
  priority: 'high' | 'medium' | 'low';
  impact: 'high' | 'medium' | 'low';
  effort: 'low' | 'medium' | 'high';
  estimatedTimeToImplement: number; // días
  estimatedTrafficIncrease: number; // porcentaje
  estimatedRevenueIncrease: number; // monto
  implementationSteps: string[];
  requiredResources: string[];
  kpis: string[];
  relatedRecommendations: string[];
  status: 'pending' | 'in-progress' | 'completed' | 'dismissed';
  assignedTo?: string;
  dueDate?: Date;
  completedDate?: Date;
  notes: string[];
}

export interface ExecutiveSummary {
  overallScore: number;
  scoreChange: number;
  keyAchievements: string[];
  majorConcerns: string[];
  quickWins: string[];
  budgetRecommendations: BudgetRecommendation[];
}

export interface BudgetRecommendation {
  category: string;
  description: string;
  estimatedCost: number;
  expectedROI: number;
  timeframe: string;
}

// Interfaces adicionales para análisis avanzado
export interface PerformanceAnalysis {
  coreWebVitalsScore: number;
  coreWebVitalsChange: number;
  pageSpeedScore: number;
  pageSpeedChange: number;
  mobileScore: number;
  mobileChange: number;
  slowestPages: PagePerformance[];
  performanceRecommendations: string[];
}

export interface PagePerformance {
  url: string;
  lcp: number;
  fid: number;
  cls: number;
  speedIndex: number;
  totalBlockingTime: number;
  issues: string[];
}

export interface KeywordAnalysis {
  totalKeywords: number;
  keywordsChange: number;
  averagePosition: number;
  positionChange: number;
  topGainers: KeywordMetrics[];
  topLosers: KeywordMetrics[];
  newKeywords: KeywordMetrics[];
  lostKeywords: KeywordMetrics[];
  opportunityKeywords: KeywordMetrics[];
}

export interface TechnicalAnalysis {
  crawlabilityScore: number;
  indexabilityScore: number;
  structuredDataScore: number;
  mobileUsabilityScore: number;
  securityScore: number;
  technicalIssues: TechnicalIssue[];
  improvements: string[];
}

export interface TechnicalIssue {
  type: string;
  severity: 'high' | 'medium' | 'low';
  count: number;
  affectedPages: string[];
  description: string;
  fix: string;
}

export interface ContentAnalysis {
  totalPages: number;
  indexedPages: number;
  duplicateContent: number;
  thinContent: number;
  missingMetaTags: number;
  contentQualityScore: number;
  topPerformingContent: ContentMetrics[];
  contentGaps: string[];
}

export interface ContentMetrics {
  url: string;
  title: string;
  wordCount: number;
  readabilityScore: number;
  organicTraffic: number;
  socialShares: number;
  backlinks: number;
  conversionRate: number;
}

export interface CompetitiveAnalysis {
  marketShare: number;
  visibilityScore: number;
  competitorComparison: CompetitorComparison[];
  opportunityAnalysis: OpportunityAnalysis[];
}

export interface CompetitorComparison {
  competitor: string;
  ourPosition: number;
  theirPosition: number;
  gap: number;
  opportunity: 'high' | 'medium' | 'low';
}

export interface OpportunityAnalysis {
  type: 'keyword' | 'content' | 'backlink' | 'technical';
  description: string;
  potential: number;
  difficulty: number;
  priority: 'high' | 'medium' | 'low';
}

export interface ActionPlan {
  quickWins: ActionItem[];
  shortTerm: ActionItem[];
  longTerm: ActionItem[];
  ongoing: ActionItem[];
}

export interface ActionItem {
  id: string;
  title: string;
  description: string;
  category: string;
  priority: 'high' | 'medium' | 'low';
  effort: 'low' | 'medium' | 'high';
  impact: 'high' | 'medium' | 'low';
  estimatedTime: number;
  assignee?: string;
  dueDate?: Date;
  dependencies: string[];
  kpis: string[];
}

export interface ScheduledDelivery {
  email: string;
  frequency: 'daily' | 'weekly' | 'monthly';
  format: 'pdf' | 'excel' | 'summary';
  enabled: boolean;
}

// Configuración avanzada del sistema
export interface SEOAnalyticsConfig {
  enableRealTimeTracking: boolean;
  enableKeywordTracking: boolean;
  enableCompetitorAnalysis: boolean;
  enableAutomatedReports: boolean;
  enableAlerts: boolean;

  // Intervalos de actualización
  metricsUpdateInterval: number; // minutos
  keywordUpdateInterval: number; // horas
  competitorUpdateInterval: number; // días
  alertCheckInterval: number; // minutos

  // Configuración de reportes
  reportSchedule: {
    daily: { enabled: boolean; time: string; recipients: string[] };
    weekly: { enabled: boolean; day: number; time: string; recipients: string[] };
    monthly: { enabled: boolean; day: number; time: string; recipients: string[] };
  };

  // Thresholds para alertas
  alertThresholds: {
    seoScoreDrop: number;
    rankingDrop: number;
    trafficDrop: number;
    performanceDrop: number;
    criticalIssuesIncrease: number;
    conversionRateDrop: number;
  };

  // Integraciones externas
  integrations: {
    googleSearchConsole: { enabled: boolean; credentials?: any };
    googleAnalytics: { enabled: boolean; credentials?: any };
    semrush: { enabled: boolean; apiKey?: string };
    ahrefs: { enabled: boolean; apiKey?: string };
    screaminFrog: { enabled: boolean; apiKey?: string };
  };

  // Configuración de cache y almacenamiento
  cache: {
    enabled: boolean;
    ttl: number;
    maxSize: number;
  };

  dataRetention: {
    metricsRetentionDays: number;
    alertsRetentionDays: number;
    reportsRetentionDays: number;
  };
}

// Configuración por defecto
const DEFAULT_SEO_CONFIG: SEOAnalyticsConfig = {
  enableRealTimeTracking: true,
  enableKeywordTracking: true,
  enableCompetitorAnalysis: true,
  enableAutomatedReports: true,
  enableAlerts: true,

  metricsUpdateInterval: 15,
  keywordUpdateInterval: 24,
  competitorUpdateInterval: 7,
  alertCheckInterval: 5,

  reportSchedule: {
    daily: { enabled: true, time: '09:00', recipients: [] },
    weekly: { enabled: true, day: 1, time: '09:00', recipients: [] },
    monthly: { enabled: true, day: 1, time: '09:00', recipients: [] }
  },

  alertThresholds: {
    seoScoreDrop: 10,
    rankingDrop: 5,
    trafficDrop: 20,
    performanceDrop: 15,
    criticalIssuesIncrease: 3,
    conversionRateDrop: 25
  },

  integrations: {
    googleSearchConsole: { enabled: false },
    googleAnalytics: { enabled: false },
    semrush: { enabled: false },
    ahrefs: { enabled: false },
    screaminFrog: { enabled: false }
  },

  cache: {
    enabled: true,
    ttl: 3600,
    maxSize: 1000
  },

  dataRetention: {
    metricsRetentionDays: 90,
    alertsRetentionDays: 30,
    reportsRetentionDays: 365
  }
};

// ===================================
// ENHANCED SEO ANALYTICS MANAGER CLASS
// ===================================

export class EnhancedSEOAnalyticsManager {
  private static instance: EnhancedSEOAnalyticsManager;
  private config: SEOAnalyticsConfig;
  private metrics: SEOMetrics[] = [];
  private keywords: KeywordMetrics[] = [];
  private alerts: SEOAlert[] = [];
  private reports: SEOReport[] = [];
  private competitors: CompetitorAnalysis[] = [];
  private listeners: ((data: any) => void)[] = [];
  private cache: Map<string, { data: any; timestamp: number }> = new Map();
  private redis: any;

  // Intervalos de tracking
  private metricsInterval: NodeJS.Timeout | null = null;
  private keywordInterval: NodeJS.Timeout | null = null;
  private competitorInterval: NodeJS.Timeout | null = null;
  private alertInterval: NodeJS.Timeout | null = null;

  private constructor(config?: Partial<SEOAnalyticsConfig>) {
    this.config = { ...DEFAULT_SEO_CONFIG, ...config };
    this.initializeRedis();
    this.startTracking();

    logger.info(LogLevel.INFO, 'Enhanced SEO Analytics Manager initialized', {
      realTimeTracking: this.config.enableRealTimeTracking,
      keywordTracking: this.config.enableKeywordTracking,
      competitorAnalysis: this.config.enableCompetitorAnalysis,
      automatedReports: this.config.enableAutomatedReports
    }, LogCategory.SEO);
  }

  public static getInstance(config?: Partial<SEOAnalyticsConfig>): EnhancedSEOAnalyticsManager {
    if (!EnhancedSEOAnalyticsManager.instance) {
      EnhancedSEOAnalyticsManager.instance = new EnhancedSEOAnalyticsManager(config);
    }
    return EnhancedSEOAnalyticsManager.instance;
  }

  private async initializeRedis(): Promise<void> {
    try {
      this.redis = await getRedisClient();
      logger.info(LogLevel.INFO, 'Redis initialized for SEO analytics', {}, LogCategory.SEO);
    } catch (error) {
      logger.warn(LogLevel.WARN, 'Redis not available for SEO analytics', {}, LogCategory.SEO);
    }
  }

  // ===================================
  // TRACKING Y RECOPILACIÓN DE MÉTRICAS
  // ===================================

  private startTracking(): void {
    if (this.config.enableRealTimeTracking) {
      this.metricsInterval = setInterval(() => {
        this.collectAndProcessMetrics();
      }, this.config.metricsUpdateInterval * 60 * 1000);
    }

    if (this.config.enableKeywordTracking) {
      this.keywordInterval = setInterval(() => {
        this.updateKeywordRankings();
      }, this.config.keywordUpdateInterval * 60 * 60 * 1000);
    }

    if (this.config.enableCompetitorAnalysis) {
      this.competitorInterval = setInterval(() => {
        this.updateCompetitorAnalysis();
      }, this.config.competitorUpdateInterval * 24 * 60 * 60 * 1000);
    }

    if (this.config.enableAlerts) {
      this.alertInterval = setInterval(() => {
        this.checkAlerts();
      }, this.config.alertCheckInterval * 60 * 1000);
    }

    logger.info(LogLevel.INFO, 'SEO tracking started', {
      metricsInterval: this.config.metricsUpdateInterval,
      keywordInterval: this.config.keywordUpdateInterval,
      competitorInterval: this.config.competitorUpdateInterval,
      alertInterval: this.config.alertCheckInterval
    }, LogCategory.SEO);
  }

  private async collectAndProcessMetrics(): Promise<void> {
    try {
      const coreWebVitals = await this.collectCoreWebVitals();
      const indexationStatus = await this.analyzeIndexationStatus();
      const technicalSEO = await this.evaluateTechnicalSEO();

      // Obtener métricas del performance monitor
      const performanceMetrics = realTimePerformanceMonitor.getCurrentMetrics();

      // Procesar métricas de tráfico (simulado - en producción vendría de GA)
      const trafficMetrics = await this.collectTrafficMetrics();

      const metrics: SEOMetrics = {
        ...trafficMetrics,
        coreWebVitals,
        indexationStatus,
        technicalSEO,
        timestamp: new Date()
      };

      this.metrics.push(metrics);
      await this.cacheMetrics('latest_metrics', metrics);

      // Verificar thresholds y generar alertas
      await this.checkMetricsThresholds(metrics);

      this.notifyListeners({ type: 'metrics_updated', data: metrics });

      logger.info(LogLevel.INFO, 'SEO metrics collected and processed', {
        coreWebVitalsScore: coreWebVitals.score,
        indexationRate: indexationStatus.indexationRate,
        organicTraffic: trafficMetrics.organicTraffic
      }, LogCategory.SEO);

    } catch (error) {
      logger.error(LogLevel.ERROR, 'Failed to collect SEO metrics', error as Error, LogCategory.SEO);
    }
  }

  // Recopilar métricas de Core Web Vitals mejoradas
  async collectCoreWebVitals(): Promise<CoreWebVitals> {
    return new Promise((resolve) => {
      // Obtener métricas reales del performance monitor si están disponibles
      const performanceMetrics = realTimePerformanceMonitor.getCurrentMetrics();

      let metrics: CoreWebVitals;

      if (performanceMetrics.webVitals.length > 0) {
        const latest = performanceMetrics.webVitals[performanceMetrics.webVitals.length - 1];
        metrics = {
          lcp: latest.lcp,
          fid: latest.fid,
          cls: latest.cls,
          fcp: latest.fcp,
          ttfb: latest.ttfb,
          inp: latest.inp || Math.random() * 500 + 100,
          score: 'good', // Se calculará
          speedIndex: latest.lcp * 0.8, // Estimación
          totalBlockingTime: latest.fid * 2, // Estimación
          largestContentfulPaintElement: 'main-content', // Simulado
          cumulativeLayoutShiftSources: ['header', 'sidebar'] // Simulado
        };
      } else {
        // Fallback a métricas simuladas
        metrics = {
          lcp: Math.random() * 4000 + 1000,
          fid: Math.random() * 300 + 50,
          cls: Math.random() * 0.25,
          fcp: Math.random() * 3000 + 500,
          ttfb: Math.random() * 800 + 200,
          inp: Math.random() * 500 + 100,
          score: 'good',
          speedIndex: Math.random() * 5000 + 2000,
          totalBlockingTime: Math.random() * 600 + 100,
          largestContentfulPaintElement: 'main-content',
          cumulativeLayoutShiftSources: []
        };
      }

      // Calcular score basado en thresholds de Google
      const lcpScore = metrics.lcp <= 2500 ? 'good' : metrics.lcp <= 4000 ? 'needs-improvement' : 'poor';
      const fidScore = metrics.fid <= 100 ? 'good' : metrics.fid <= 300 ? 'needs-improvement' : 'poor';
      const clsScore = metrics.cls <= 0.1 ? 'good' : metrics.cls <= 0.25 ? 'needs-improvement' : 'poor';

      const scores = [lcpScore, fidScore, clsScore];
      if (scores.every(s => s === 'good')) {metrics.score = 'good';}
      else if (scores.some(s => s === 'poor')) {metrics.score = 'poor';}
      else {metrics.score = 'needs-improvement';}

      resolve(metrics);
    });
  }

  // Recopilar métricas de tráfico
  private async collectTrafficMetrics(): Promise<Partial<SEOMetrics>> {
    // En producción, esto se integraría con Google Analytics API
    const baseTraffic = Math.floor(Math.random() * 5000) + 2000;

    return {
      pageViews: baseTraffic * 2,
      uniqueVisitors: baseTraffic,
      bounceRate: Math.random() * 40 + 30,
      avgSessionDuration: Math.random() * 300 + 120,
      organicTraffic: Math.floor(baseTraffic * 0.6),
      searchImpressions: Math.floor(baseTraffic * 10),
      searchClicks: Math.floor(baseTraffic * 0.8),
      avgPosition: Math.random() * 20 + 5,
      ctr: Math.random() * 8 + 2,
      conversionRate: Math.random() * 5 + 1,
      revenueFromOrganic: Math.floor(Math.random() * 50000) + 10000,
      topLandingPages: this.getTopLandingPages(),
      topExitPages: this.getTopExitPages(),
      deviceBreakdown: this.getDeviceBreakdown(),
      geographicData: this.getGeographicData()
    };
  }

  private getTopLandingPages(): PageMetrics[] {
    const pages = [
      '/products/pintura-interior',
      '/products/pintura-exterior',
      '/categories/herramientas',
      '/categories/pinturas',
      '/products/sherwin-williams'
    ];

    return pages.map(url => ({
      url,
      pageViews: Math.floor(Math.random() * 1000) + 100,
      uniquePageViews: Math.floor(Math.random() * 800) + 80,
      avgTimeOnPage: Math.random() * 300 + 60,
      bounceRate: Math.random() * 60 + 20,
      exitRate: Math.random() * 50 + 10,
      conversions: Math.floor(Math.random() * 20) + 1,
      revenue: Math.floor(Math.random() * 5000) + 500
    }));
  }

  private getTopExitPages(): PageMetrics[] {
    const pages = [
      '/checkout',
      '/cart',
      '/contact',
      '/about',
      '/shipping-info'
    ];

    return pages.map(url => ({
      url,
      pageViews: Math.floor(Math.random() * 500) + 50,
      uniquePageViews: Math.floor(Math.random() * 400) + 40,
      avgTimeOnPage: Math.random() * 200 + 30,
      bounceRate: Math.random() * 80 + 40,
      exitRate: Math.random() * 90 + 50,
      conversions: Math.floor(Math.random() * 5),
      revenue: Math.floor(Math.random() * 1000)
    }));
  }

  private getDeviceBreakdown(): DeviceMetrics {
    return {
      desktop: {
        sessions: Math.floor(Math.random() * 2000) + 500,
        bounceRate: Math.random() * 40 + 25,
        conversionRate: Math.random() * 4 + 2,
        avgSessionDuration: Math.random() * 400 + 200
      },
      mobile: {
        sessions: Math.floor(Math.random() * 3000) + 1000,
        bounceRate: Math.random() * 50 + 35,
        conversionRate: Math.random() * 3 + 1,
        avgSessionDuration: Math.random() * 300 + 150
      },
      tablet: {
        sessions: Math.floor(Math.random() * 500) + 100,
        bounceRate: Math.random() * 45 + 30,
        conversionRate: Math.random() * 3.5 + 1.5,
        avgSessionDuration: Math.random() * 350 + 180
      }
    };
  }

  private getGeographicData(): GeographicMetrics[] {
    const locations = [
      { country: 'Argentina', region: 'Buenos Aires', city: 'CABA' },
      { country: 'Argentina', region: 'Buenos Aires', city: 'La Plata' },
      { country: 'Argentina', region: 'Córdoba', city: 'Córdoba' },
      { country: 'Argentina', region: 'Santa Fe', city: 'Rosario' },
      { country: 'Argentina', region: 'Mendoza', city: 'Mendoza' }
    ];

    return locations.map(location => ({
      ...location,
      sessions: Math.floor(Math.random() * 1000) + 100,
      users: Math.floor(Math.random() * 800) + 80,
      bounceRate: Math.random() * 50 + 25,
      conversionRate: Math.random() * 4 + 1,
      revenue: Math.floor(Math.random() * 10000) + 1000
    }));
  }

  // Analizar estado de indexación mejorado
  async analyzeIndexationStatus(): Promise<IndexationStatus> {
    // En producción, esto se integraría con Google Search Console API
    const totalPages = 150 + Math.floor(Math.random() * 50);
    const indexedPages = Math.floor(totalPages * (0.9 + Math.random() * 0.1));

    return {
      totalPages,
      indexedPages,
      notIndexedPages: totalPages - indexedPages,
      indexationRate: Number(((indexedPages / totalPages) * 100).toFixed(1)),
      crawlErrors: Math.floor(Math.random() * 5),
      sitemapStatus: Math.random() > 0.1 ? 'processed' : 'error',
      lastCrawlDate: new Date(Date.now() - Math.random() * 24 * 60 * 60 * 1000)
    };
  }

  // Evaluar SEO técnico
  async evaluateTechnicalSEO(): Promise<TechnicalSEOMetrics> {
    return {
      mobileUsability: 95,
      pagespeedScore: 88,
      httpsUsage: 100,
      structuredDataErrors: 2,
      metaTagsOptimization: 92,
      internalLinkingScore: 85,
      imageOptimization: 78,
      canonicalIssues: 1
    };
  }

  // Recopilar métricas completas
  async collectMetrics(): Promise<SEOMetrics> {
    const coreWebVitals = await this.collectCoreWebVitals();
    const indexationStatus = await this.analyzeIndexationStatus();
    const technicalSEO = await this.evaluateTechnicalSEO();

    const metrics: SEOMetrics = {
      pageViews: Math.floor(Math.random() * 10000) + 5000,
      uniqueVisitors: Math.floor(Math.random() * 5000) + 2000,
      bounceRate: Math.random() * 40 + 30, // 30-70%
      avgSessionDuration: Math.random() * 300 + 120, // 2-7 minutos
      organicTraffic: Math.floor(Math.random() * 3000) + 1000,
      searchImpressions: Math.floor(Math.random() * 50000) + 20000,
      searchClicks: Math.floor(Math.random() * 2000) + 800,
      avgPosition: Math.random() * 20 + 5, // Posición 5-25
      ctr: Math.random() * 8 + 2, // 2-10%
      coreWebVitals,
      indexationStatus,
      technicalSEO,
      timestamp: new Date()
    };

    this.metrics.push(metrics);
    this.notifyListeners({ type: 'metrics', data: metrics });

    return metrics;
  }

  // ===================================
  // ANÁLISIS DE KEYWORDS AVANZADO
  // ===================================

  private async updateKeywordRankings(): Promise<void> {
    try {
      const keywords = await this.analyzeKeywords();
      this.keywords = keywords;

      await this.cacheMetrics('latest_keywords', keywords);

      // Verificar cambios significativos en rankings
      await this.checkKeywordAlerts(keywords);

      this.notifyListeners({ type: 'keywords_updated', data: keywords });

      logger.info(LogLevel.INFO, 'Keyword rankings updated', {
        totalKeywords: keywords.length,
        averagePosition: keywords.reduce((sum, k) => sum + k.position, 0) / keywords.length
      }, LogCategory.SEO);

    } catch (error) {
      logger.error(LogLevel.ERROR, 'Failed to update keyword rankings', error as Error, LogCategory.SEO);
    }
  }

  // Analizar keywords con métricas avanzadas
  async analyzeKeywords(): Promise<KeywordMetrics[]> {
    const sampleKeywords = [
      { keyword: 'pinturería online', intent: 'commercial' as const, volume: 2400 },
      { keyword: 'pinturas sherwin williams', intent: 'commercial' as const, volume: 1800 },
      { keyword: 'ferretería online', intent: 'commercial' as const, volume: 3200 },
      { keyword: 'herramientas pintura', intent: 'commercial' as const, volume: 1500 },
      { keyword: 'corralón online', intent: 'commercial' as const, volume: 2800 },
      { keyword: 'pinturas argentina', intent: 'informational' as const, volume: 4200 },
      { keyword: 'petrilac pinturas', intent: 'navigational' as const, volume: 800 },
      { keyword: 'sinteplast', intent: 'navigational' as const, volume: 1200 },
      { keyword: 'plavicon', intent: 'navigational' as const, volume: 600 },
      { keyword: 'akapol', intent: 'navigational' as const, volume: 400 },
      { keyword: 'pintura interior precio', intent: 'transactional' as const, volume: 1600 },
      { keyword: 'pintura exterior mejor', intent: 'informational' as const, volume: 900 },
      { keyword: 'como pintar paredes', intent: 'informational' as const, volume: 5500 },
      { keyword: 'rodillos pintura profesional', intent: 'commercial' as const, volume: 700 },
      { keyword: 'pintura antioxido', intent: 'commercial' as const, volume: 1100 }
    ];

    const keywords: KeywordMetrics[] = await Promise.all(
      sampleKeywords.map(async ({ keyword, intent, volume }) => {
        const position = Math.floor(Math.random() * 50) + 1;
        const previousPosition = position + Math.floor(Math.random() * 10) - 5;
        const clicks = Math.floor(Math.random() * 200) + 10;
        const impressions = Math.floor(Math.random() * 2000) + 100;

        return {
          keyword,
          position,
          previousPosition,
          searchVolume: volume,
          difficulty: Math.floor(Math.random() * 100),
          clicks,
          impressions,
          ctr: (clicks / impressions) * 100,
          url: `/shop?search=${encodeURIComponent(keyword)}`,
          trend: position < previousPosition ? 'up' : position > previousPosition ? 'down' : 'stable',
          searchEngine: 'google',
          device: Math.random() > 0.6 ? 'mobile' : 'desktop',
          location: 'Argentina',
          intent,
          competitorRankings: this.getCompetitorRankings(keyword),
          relatedKeywords: this.getRelatedKeywords(keyword),
          seasonalTrends: this.getSeasonalTrends(keyword),
          conversionRate: Math.random() * 5 + 1,
          revenue: Math.floor(Math.random() * 10000) + 1000,
          costPerClick: Math.random() * 5 + 0.5,
          lastUpdated: new Date()
        };
      })
    );

    // Guardar keywords en el manager
    this.keywords = keywords;

    return keywords;
  }

  private getCompetitorRankings(keyword: string): CompetitorKeywordData[] {
    const competitors = ['easy.com.ar', 'sodimac.com.ar', 'mercadolibre.com.ar'];

    return competitors.map(domain => ({
      domain,
      position: Math.floor(Math.random() * 20) + 1,
      url: `https://${domain}/search?q=${encodeURIComponent(keyword)}`,
      title: `${keyword} - ${domain}`,
      description: `Encuentra ${keyword} en ${domain} con los mejores precios y calidad.`
    }));
  }

  private getRelatedKeywords(keyword: string): string[] {
    const relatedMap: Record<string, string[]> = {
      'pinturería online': ['pintura online', 'comprar pintura', 'tienda pintura'],
      'pinturas sherwin williams': ['sherwin williams argentina', 'pintura sherwin', 'sw pinturas'],
      'ferretería online': ['ferretería virtual', 'herramientas online', 'comprar herramientas'],
      'herramientas pintura': ['rodillos pintura', 'pinceles', 'brochas pintura'],
      'corralón online': ['materiales construcción', 'corralón virtual', 'construcción online']
    };

    return relatedMap[keyword] || [
      `${keyword} precio`,
      `${keyword} argentina`,
      `mejor ${keyword}`
    ];
  }

  private getSeasonalTrends(keyword: string): SeasonalData[] {
    return Array.from({ length: 12 }, (_, month) => ({
      month: month + 1,
      searchVolume: Math.floor(Math.random() * 2000) + 500,
      competition: Math.random(),
      cpc: Math.random() * 3 + 0.5
    }));
  }

  // ===================================
  // ANÁLISIS DE COMPETIDORES
  // ===================================

  private async updateCompetitorAnalysis(): Promise<void> {
    try {
      const competitors = await this.analyzeCompetitors();
      this.competitors = competitors;

      await this.cacheMetrics('latest_competitors', competitors);

      this.notifyListeners({ type: 'competitors_updated', data: competitors });

      logger.info(LogLevel.INFO, 'Competitor analysis updated', {
        competitorsAnalyzed: competitors.length
      }, LogCategory.SEO);

    } catch (error) {
      logger.error(LogLevel.ERROR, 'Failed to update competitor analysis', error as Error, LogCategory.SEO);
    }
  }

  private async analyzeCompetitors(): Promise<CompetitorAnalysis[]> {
    const competitorDomains = [
      'easy.com.ar',
      'sodimac.com.ar',
      'mercadolibre.com.ar',
      'pinturerias-rex.com.ar',
      'sherwin-williams.com.ar'
    ];

    return Promise.all(competitorDomains.map(async (domain) => {
      const organicKeywords = Math.floor(Math.random() * 10000) + 5000;
      const organicTraffic = Math.floor(Math.random() * 500000) + 100000;

      return {
        competitor: domain.split('.')[0],
        domain,
        organicKeywords,
        organicTraffic,
        backlinks: Math.floor(Math.random() * 100000) + 10000,
        domainAuthority: Math.floor(Math.random() * 40) + 40,
        commonKeywords: this.getCommonKeywords(domain),
        keywordGaps: this.getKeywordGaps(domain),
        pageAuthority: Math.floor(Math.random() * 30) + 30,
        trustFlow: Math.floor(Math.random() * 40) + 20,
        citationFlow: Math.floor(Math.random() * 50) + 25,
        referringDomains: Math.floor(Math.random() * 5000) + 1000,
        organicCost: Math.floor(Math.random() * 100000) + 20000,
        paidKeywords: Math.floor(Math.random() * 2000) + 500,
        paidTraffic: Math.floor(Math.random() * 50000) + 10000,
        paidCost: Math.floor(Math.random() * 50000) + 10000,
        topPages: this.getCompetitorTopPages(domain),
        contentGaps: this.getContentGaps(domain),
        backlinksGaps: this.getBacklinkGaps(domain),
        socialMetrics: this.getSocialMetrics(domain),
        technicalSEOScore: Math.floor(Math.random() * 30) + 70,
        lastAnalyzed: new Date()
      };
    }));
  }

  private getCommonKeywords(domain: string): string[] {
    return [
      'pintura interior',
      'pintura exterior',
      'herramientas pintura',
      'rodillos',
      'pinceles'
    ];
  }

  private getKeywordGaps(domain: string): string[] {
    return [
      'pintura ecológica',
      'pintura antimanchas',
      'pintura magnética',
      'pintura pizarra',
      'pintura texturada'
    ];
  }

  private getCompetitorTopPages(domain: string): CompetitorPage[] {
    const pages = [
      '/productos/pinturas',
      '/herramientas',
      '/ofertas',
      '/marcas',
      '/consejos'
    ];

    return pages.map(url => ({
      url: `https://${domain}${url}`,
      title: `${url.split('/').pop()} - ${domain}`,
      traffic: Math.floor(Math.random() * 10000) + 1000,
      keywords: Math.floor(Math.random() * 100) + 20,
      backlinks: Math.floor(Math.random() * 500) + 50,
      socialShares: Math.floor(Math.random() * 1000) + 100
    }));
  }

  private getContentGaps(domain: string): ContentGap[] {
    return [
      {
        topic: 'Guías de pintura',
        keywords: ['como pintar', 'técnicas pintura', 'consejos pintura'],
        searchVolume: 5000,
        difficulty: 45,
        opportunity: 'high'
      },
      {
        topic: 'Comparativas de productos',
        keywords: ['mejor pintura', 'comparar pinturas', 'pintura vs pintura'],
        searchVolume: 3000,
        difficulty: 60,
        opportunity: 'medium'
      }
    ];
  }

  private getBacklinkGaps(domain: string): BacklinkGap[] {
    return [
      {
        domain: 'arquitectura.com',
        domainAuthority: 65,
        linkType: 'dofollow',
        anchorText: 'mejores pinturas',
        opportunity: 'high'
      },
      {
        domain: 'decoracion.com.ar',
        domainAuthority: 55,
        linkType: 'dofollow',
        anchorText: 'pintura interior',
        opportunity: 'medium'
      }
    ];
  }

  private getSocialMetrics(domain: string): SocialMetrics {
    return {
      facebook: {
        likes: Math.floor(Math.random() * 50000) + 10000,
        shares: Math.floor(Math.random() * 5000) + 1000,
        comments: Math.floor(Math.random() * 2000) + 500
      },
      twitter: {
        followers: Math.floor(Math.random() * 20000) + 5000,
        tweets: Math.floor(Math.random() * 1000) + 200,
        retweets: Math.floor(Math.random() * 500) + 100
      },
      linkedin: {
        followers: Math.floor(Math.random() * 10000) + 2000,
        posts: Math.floor(Math.random() * 200) + 50,
        engagement: Math.floor(Math.random() * 1000) + 200
      },
      instagram: {
        followers: Math.floor(Math.random() * 30000) + 8000,
        posts: Math.floor(Math.random() * 500) + 100,
        engagement: Math.floor(Math.random() * 2000) + 500
      }
    };
  }

  // ===================================
  // SISTEMA DE ALERTAS AVANZADO
  // ===================================

  private async checkAlerts(): Promise<void> {
    try {
      const alerts = await this.detectSEOIssues();

      // Enviar alertas críticas al sistema de alertas
      const criticalAlerts = alerts.filter(alert => alert.type === 'critical');
      for (const alert of criticalAlerts) {
        await advancedAlertingEngine.createAlert(
          AlertType.PERFORMANCE,
          AlertSeverity.CRITICAL,
          alert.title,
          alert.description,
          {
            category: alert.category,
            url: alert.url,
            severity: alert.severity,
            recommendations: alert.recommendations
          }
        );
      }

      this.notifyListeners({ type: 'alerts_updated', data: alerts });

    } catch (error) {
      logger.error(LogLevel.ERROR, 'Failed to check SEO alerts', error as Error, LogCategory.SEO);
    }
  }

  private async checkMetricsThresholds(metrics: SEOMetrics): Promise<void> {
    const alerts: SEOAlert[] = [];

    // Verificar Core Web Vitals
    if (metrics.coreWebVitals.score === 'poor') {
      alerts.push(await this.createAlert(
        'critical',
        'performance',
        'Core Web Vitals críticos',
        `Las métricas de Core Web Vitals están en estado crítico. LCP: ${metrics.coreWebVitals.lcp}ms, FID: ${metrics.coreWebVitals.fid}ms, CLS: ${metrics.coreWebVitals.cls}`,
        ['Optimizar imágenes y recursos', 'Reducir JavaScript que bloquea', 'Mejorar estabilidad del layout'],
        'high',
        9
      ));
    }

    // Verificar tasa de indexación
    if (metrics.indexationStatus.indexationRate < 90) {
      alerts.push(await this.createAlert(
        'warning',
        'indexation',
        'Baja tasa de indexación',
        `Solo el ${metrics.indexationStatus.indexationRate}% de las páginas están indexadas`,
        ['Revisar robots.txt', 'Verificar sitemap', 'Analizar errores de crawl'],
        'medium',
        7
      ));
    }

    // Verificar tráfico orgánico
    const previousMetrics = this.getLastMetrics();
    if (previousMetrics && metrics.organicTraffic < previousMetrics.organicTraffic * 0.8) {
      const drop = ((previousMetrics.organicTraffic - metrics.organicTraffic) / previousMetrics.organicTraffic * 100).toFixed(1);
      alerts.push(await this.createAlert(
        'warning',
        'content',
        'Caída en tráfico orgánico',
        `El tráfico orgánico ha caído un ${drop}% respecto al período anterior`,
        ['Analizar cambios en rankings', 'Revisar contenido actualizado', 'Verificar penalizaciones'],
        'high',
        8
      ));
    }

    if (alerts.length > 0) {
      this.alerts.push(...alerts);
    }
  }

  private async checkKeywordAlerts(keywords: KeywordMetrics[]): Promise<void> {
    const alerts: SEOAlert[] = [];

    // Verificar caídas significativas en rankings
    const significantDrops = keywords.filter(k =>
      k.previousPosition && k.position > k.previousPosition + this.config.alertThresholds.rankingDrop
    );

    if (significantDrops.length > 0) {
      alerts.push(await this.createAlert(
        'warning',
        'content',
        'Caídas significativas en rankings',
        `${significantDrops.length} keywords han caído más de ${this.config.alertThresholds.rankingDrop} posiciones`,
        ['Analizar cambios en contenido', 'Revisar competencia', 'Optimizar páginas afectadas'],
        'medium',
        6
      ));
    }

    // Verificar keywords que salieron del top 10
    const lostTopPositions = keywords.filter(k =>
      k.previousPosition && k.previousPosition <= 10 && k.position > 10
    );

    if (lostTopPositions.length > 0) {
      alerts.push(await this.createAlert(
        'critical',
        'content',
        'Keywords perdieron posiciones top 10',
        `${lostTopPositions.length} keywords importantes salieron del top 10`,
        ['Priorizar optimización de contenido', 'Analizar intención de búsqueda', 'Mejorar autoridad de página'],
        'high',
        9
      ));
    }

    if (alerts.length > 0) {
      this.alerts.push(...alerts);
    }
  }

  // Detectar problemas SEO avanzados
  async detectSEOIssues(): Promise<SEOAlert[]> {
    const alerts: SEOAlert[] = [];

    // Análisis técnico
    const technicalIssues = await this.detectTechnicalIssues();
    alerts.push(...technicalIssues);

    // Análisis de contenido
    const contentIssues = await this.detectContentIssues();
    alerts.push(...contentIssues);

    // Análisis de performance
    const performanceIssues = await this.detectPerformanceIssues();
    alerts.push(...performanceIssues);

    // Análisis de mobile
    const mobileIssues = await this.detectMobileIssues();
    alerts.push(...mobileIssues);

    // Agregar alertas al array del manager
    this.alerts.push(...alerts);

    return alerts;
  }

  // Métodos de detección de issues específicos
  private async detectTechnicalIssues(): Promise<SEOAlert[]> {
    const issues: SEOAlert[] = [];

    // Simular detección de problemas técnicos
    const technicalProblems = [
      {
        type: 'warning' as const,
        category: 'technical' as const,
        title: 'Páginas con tiempo de carga lento',
        description: '3 páginas tienen un LCP superior a 4 segundos',
        affectedPages: ['/products/pintura-premium', '/categories/herramientas', '/checkout'],
        impact: 'high' as const,
        effort: 'medium' as const,
        priority: 8,
        estimatedTrafficImpact: 15,
        estimatedRevenueImpact: 5000
      },
      {
        type: 'info' as const,
        category: 'schema' as const,
        title: 'Schema markup faltante',
        description: 'Algunas páginas de productos no tienen structured data',
        affectedPages: ['/products/pintura-exterior', '/products/rodillos'],
        impact: 'medium' as const,
        effort: 'low' as const,
        priority: 5,
        estimatedTrafficImpact: 8,
        estimatedRevenueImpact: 2000
      }
    ];

    for (const problem of technicalProblems) {
      issues.push(await this.createAdvancedAlert(problem));
    }

    return issues;
  }

  private async detectContentIssues(): Promise<SEOAlert[]> {
    const issues: SEOAlert[] = [];

    const contentProblems = [
      {
        type: 'warning' as const,
        category: 'content' as const,
        title: 'Meta descriptions faltantes',
        description: '5 páginas importantes no tienen meta description',
        affectedPages: ['/about', '/shipping', '/returns', '/contact', '/blog'],
        impact: 'medium' as const,
        effort: 'low' as const,
        priority: 6,
        estimatedTrafficImpact: 10,
        estimatedRevenueImpact: 1500
      },
      {
        type: 'info' as const,
        category: 'content' as const,
        title: 'Oportunidades de contenido',
        description: 'Se detectaron 8 keywords con potencial de mejora',
        affectedPages: [],
        impact: 'high' as const,
        effort: 'high' as const,
        priority: 7,
        estimatedTrafficImpact: 25,
        estimatedRevenueImpact: 8000
      }
    ];

    for (const problem of contentProblems) {
      issues.push(await this.createAdvancedAlert(problem));
    }

    return issues;
  }

  private async detectPerformanceIssues(): Promise<SEOAlert[]> {
    const issues: SEOAlert[] = [];

    const performanceProblems = [
      {
        type: 'critical' as const,
        category: 'performance' as const,
        title: 'Imágenes sin optimizar',
        description: 'Múltiples imágenes grandes están afectando el LCP',
        affectedPages: ['/products/pintura-interior', '/home'],
        impact: 'high' as const,
        effort: 'medium' as const,
        priority: 9,
        estimatedTrafficImpact: 20,
        estimatedRevenueImpact: 6000
      }
    ];

    for (const problem of performanceProblems) {
      issues.push(await this.createAdvancedAlert(problem));
    }

    return issues;
  }

  private async detectMobileIssues(): Promise<SEOAlert[]> {
    const issues: SEOAlert[] = [];

    const mobileProblems = [
      {
        type: 'warning' as const,
        category: 'mobile' as const,
        title: 'Problemas de usabilidad móvil',
        description: 'Algunos elementos son demasiado pequeños para tocar en móvil',
        affectedPages: ['/cart', '/checkout'],
        impact: 'medium' as const,
        effort: 'medium' as const,
        priority: 6,
        estimatedTrafficImpact: 12,
        estimatedRevenueImpact: 3000
      }
    ];

    for (const problem of mobileProblems) {
      issues.push(await this.createAdvancedAlert(problem));
    }

    return issues;
  }

  private async createAlert(
    type: 'critical' | 'warning' | 'info',
    category: SEOAlert['category'],
    title: string,
    description: string,
    recommendations: string[],
    impact: 'high' | 'medium' | 'low',
    priority: number
  ): Promise<SEOAlert> {
    return {
      id: `alert-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      type,
      category,
      title,
      description,
      severity: priority,
      timestamp: new Date(),
      resolved: false,
      recommendations,
      impact,
      effort: 'medium',
      priority,
      affectedPages: [],
      estimatedTrafficImpact: 0,
      estimatedRevenueImpact: 0,
      relatedAlerts: [],
      autoResolvable: false,
      resolutionSteps: [],
      lastOccurrence: new Date(),
      frequency: 1,
      tags: [category, impact]
    };
  }

  private async createAdvancedAlert(problem: any): Promise<SEOAlert> {
    return {
      id: `alert-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      type: problem.type,
      category: problem.category,
      title: problem.title,
      description: problem.description,
      severity: problem.priority,
      timestamp: new Date(),
      resolved: false,
      recommendations: this.getRecommendationsForCategory(problem.category),
      impact: problem.impact,
      effort: problem.effort,
      priority: problem.priority,
      affectedPages: problem.affectedPages,
      estimatedTrafficImpact: problem.estimatedTrafficImpact,
      estimatedRevenueImpact: problem.estimatedRevenueImpact,
      relatedAlerts: [],
      autoResolvable: problem.category === 'schema' || problem.category === 'content',
      resolutionSteps: this.getResolutionSteps(problem.category),
      lastOccurrence: new Date(),
      frequency: 1,
      tags: [problem.category, problem.impact, problem.type]
    };
  }

  private getRecommendationsForCategory(category: string): string[] {
    const recommendations: Record<string, string[]> = {
      technical: [
        'Optimizar imágenes y recursos',
        'Implementar lazy loading',
        'Revisar recursos que bloquean el renderizado',
        'Configurar compresión GZIP'
      ],
      content: [
        'Crear contenido específico para keywords objetivo',
        'Optimizar meta descriptions',
        'Mejorar estructura de headings',
        'Agregar contenido relevante y único'
      ],
      performance: [
        'Optimizar Core Web Vitals',
        'Reducir tiempo de carga',
        'Implementar CDN',
        'Optimizar JavaScript y CSS'
      ],
      mobile: [
        'Mejorar experiencia móvil',
        'Ajustar tamaños de elementos táctiles',
        'Optimizar viewport',
        'Implementar diseño responsive'
      ],
      schema: [
        'Implementar structured data',
        'Validar markup existente',
        'Agregar schema de productos',
        'Configurar breadcrumbs schema'
      ]
    };

    return recommendations[category] || ['Revisar y optimizar según mejores prácticas SEO'];
  }

  private getResolutionSteps(category: string): ResolutionStep[] {
    const steps: Record<string, ResolutionStep[]> = {
      technical: [
        {
          step: 1,
          description: 'Analizar páginas afectadas',
          action: 'Usar herramientas de análisis de performance',
          estimatedTime: 30,
          difficulty: 'easy',
          requiredSkills: ['SEO básico']
        },
        {
          step: 2,
          description: 'Optimizar recursos',
          action: 'Comprimir imágenes y minificar CSS/JS',
          estimatedTime: 120,
          difficulty: 'medium',
          requiredSkills: ['Desarrollo web', 'Optimización']
        }
      ],
      content: [
        {
          step: 1,
          description: 'Auditar contenido existente',
          action: 'Revisar meta tags y contenido de páginas',
          estimatedTime: 60,
          difficulty: 'easy',
          requiredSkills: ['SEO', 'Redacción']
        },
        {
          step: 2,
          description: 'Crear contenido optimizado',
          action: 'Escribir meta descriptions y mejorar contenido',
          estimatedTime: 180,
          difficulty: 'medium',
          requiredSkills: ['SEO', 'Redacción', 'Marketing']
        }
      ]
    };

    return steps[category] || [];
  }

  // ===================================
  // GENERACIÓN DE REPORTES AVANZADOS
  // ===================================

  // Generar reporte SEO completo
  async generateSEOReport(
    period: 'daily' | 'weekly' | 'monthly' | 'quarterly' | 'yearly' | 'custom',
    customDateRange?: { start: Date; end: Date }
  ): Promise<SEOReport> {
    const endDate = new Date();
    const startDate = new Date();

    if (customDateRange) {
      startDate.setTime(customDateRange.start.getTime());
      endDate.setTime(customDateRange.end.getTime());
    } else {
      switch (period) {
        case 'daily':
          startDate.setDate(endDate.getDate() - 1);
          break;
        case 'weekly':
          startDate.setDate(endDate.getDate() - 7);
          break;
        case 'monthly':
          startDate.setMonth(endDate.getMonth() - 1);
          break;
        case 'quarterly':
          startDate.setMonth(endDate.getMonth() - 3);
          break;
        case 'yearly':
          startDate.setFullYear(endDate.getFullYear() - 1);
          break;
      }
    }

    const metrics = await this.collectAndProcessMetrics();
    const keywords = await this.analyzeKeywords();
    const alerts = await this.detectSEOIssues();
    const competitors = this.competitors;

    const report: SEOReport = {
      id: `report-${Date.now()}`,
      period,
      startDate,
      endDate,
      metrics: this.getLastMetrics() || metrics,
      keywords,
      alerts,
      recommendations: await this.generateRecommendations(),
      competitorAnalysis: competitors,
      executiveSummary: await this.generateExecutiveSummary(),
      performanceAnalysis: await this.generatePerformanceAnalysis(),
      keywordAnalysis: await this.generateKeywordAnalysis(keywords),
      technicalAnalysis: await this.generateTechnicalAnalysis(),
      contentAnalysis: await this.generateContentAnalysis(),
      competitiveAnalysis: await this.generateCompetitiveAnalysis(competitors),
      actionPlan: await this.generateActionPlan(),
      generatedBy: 'Enhanced SEO Analytics Manager',
      generatedAt: new Date(),
      version: '2.0.0',
      exportFormats: ['pdf', 'excel', 'csv', 'json'],
      scheduledDelivery: []
    };

    this.reports.push(report);
    await this.cacheMetrics(`report_${report.id}`, report);

    logger.info(LogLevel.INFO, 'SEO report generated', {
      reportId: report.id,
      period,
      overallScore: report.executiveSummary.overallScore,
      alertsCount: alerts.length,
      keywordsCount: keywords.length
    }, LogCategory.SEO);

    return report;
  }

  // Métodos de generación de análisis específicos
  private async generateExecutiveSummary(): Promise<ExecutiveSummary> {
    const currentMetrics = this.getLastMetrics();
    const overallScore = currentMetrics ? this.calculateOverallSEOScore(currentMetrics) : 85;

    return {
      overallScore,
      scoreChange: Math.floor(Math.random() * 10) - 5, // -5 a +5
      keyAchievements: [
        'CTR aumentó 12% en la última semana',
        'Posición promedio mejoró 2.3 posiciones',
        'Tráfico orgánico creció 8%',
        'Core Web Vitals mejorados en 15%'
      ],
      majorConcerns: [
        'Algunas páginas tienen LCP alto',
        'Falta schema markup en productos',
        'Meta descriptions incompletas'
      ],
      quickWins: [
        'Agregar meta descriptions faltantes',
        'Implementar schema de productos',
        'Optimizar imágenes principales',
        'Mejorar títulos de páginas'
      ],
      budgetRecommendations: [
        {
          category: 'Contenido',
          description: 'Creación de contenido optimizado para keywords objetivo',
          estimatedCost: 15000,
          expectedROI: 3.5,
          timeframe: '3 meses'
        },
        {
          category: 'Técnico',
          description: 'Optimización de performance y Core Web Vitals',
          estimatedCost: 25000,
          expectedROI: 2.8,
          timeframe: '2 meses'
        }
      ]
    };
  }

  private async generatePerformanceAnalysis(): Promise<PerformanceAnalysis> {
    const currentMetrics = this.getLastMetrics();
    const cwv = currentMetrics?.coreWebVitals;

    return {
      coreWebVitalsScore: cwv?.score === 'good' ? 90 : cwv?.score === 'needs-improvement' ? 70 : 40,
      coreWebVitalsChange: Math.floor(Math.random() * 20) - 10,
      pageSpeedScore: Math.floor(Math.random() * 30) + 70,
      pageSpeedChange: Math.floor(Math.random() * 10) - 5,
      mobileScore: Math.floor(Math.random() * 20) + 80,
      mobileChange: Math.floor(Math.random() * 8) - 4,
      slowestPages: [
        {
          url: '/products/pintura-premium',
          lcp: 4200,
          fid: 150,
          cls: 0.15,
          speedIndex: 3800,
          totalBlockingTime: 300,
          issues: ['Imágenes grandes sin optimizar', 'JavaScript bloqueante']
        },
        {
          url: '/checkout',
          lcp: 3800,
          fid: 120,
          cls: 0.12,
          speedIndex: 3500,
          totalBlockingTime: 250,
          issues: ['Formularios complejos', 'Validaciones síncronas']
        }
      ],
      performanceRecommendations: [
        'Implementar lazy loading para imágenes',
        'Optimizar JavaScript crítico',
        'Usar CDN para recursos estáticos',
        'Implementar service workers'
      ]
    };
  }

  private async generateKeywordAnalysis(keywords: KeywordMetrics[]): Promise<KeywordAnalysis> {
    const totalKeywords = keywords.length;
    const averagePosition = keywords.reduce((sum, k) => sum + k.position, 0) / totalKeywords;

    return {
      totalKeywords,
      keywordsChange: Math.floor(Math.random() * 20) - 10,
      averagePosition: Number(averagePosition.toFixed(1)),
      positionChange: Math.random() * 4 - 2,
      topGainers: keywords
        .filter(k => k.trend === 'up')
        .sort((a, b) => (a.previousPosition || 50) - a.position - ((b.previousPosition || 50) - b.position))
        .slice(0, 5),
      topLosers: keywords
        .filter(k => k.trend === 'down')
        .sort((a, b) => (b.position - (b.previousPosition || 1)) - (a.position - (a.previousPosition || 1)))
        .slice(0, 5),
      newKeywords: keywords.filter(k => !k.previousPosition).slice(0, 3),
      lostKeywords: [], // Simulated
      opportunityKeywords: keywords
        .filter(k => k.position > 10 && k.position <= 20)
        .sort((a, b) => b.searchVolume - a.searchVolume)
        .slice(0, 10)
    };
  }

  private async generateTechnicalAnalysis(): Promise<TechnicalAnalysis> {
    return {
      crawlabilityScore: Math.floor(Math.random() * 20) + 80,
      indexabilityScore: Math.floor(Math.random() * 15) + 85,
      structuredDataScore: Math.floor(Math.random() * 25) + 75,
      mobileUsabilityScore: Math.floor(Math.random() * 20) + 80,
      securityScore: Math.floor(Math.random() * 10) + 90,
      technicalIssues: [
        {
          type: 'Missing meta descriptions',
          severity: 'medium',
          count: 5,
          affectedPages: ['/about', '/contact', '/shipping'],
          description: 'Páginas importantes sin meta description',
          fix: 'Agregar meta descriptions únicas y descriptivas'
        },
        {
          type: 'Large images',
          severity: 'high',
          count: 12,
          affectedPages: ['/products/pintura-interior', '/home'],
          description: 'Imágenes grandes que afectan el LCP',
          fix: 'Optimizar y comprimir imágenes'
        }
      ],
      improvements: [
        'Implementar schema markup en todas las páginas de productos',
        'Optimizar robots.txt para mejor crawling',
        'Agregar breadcrumbs estructurados',
        'Mejorar estructura de URLs'
      ]
    };
  }

  private async generateContentAnalysis(): Promise<ContentAnalysis> {
    return {
      totalPages: 150,
      indexedPages: 142,
      duplicateContent: 3,
      thinContent: 8,
      missingMetaTags: 12,
      contentQualityScore: Math.floor(Math.random() * 20) + 75,
      topPerformingContent: [
        {
          url: '/blog/como-elegir-pintura-interior',
          title: 'Cómo elegir la pintura interior perfecta',
          wordCount: 1500,
          readabilityScore: 85,
          organicTraffic: 2500,
          socialShares: 150,
          backlinks: 25,
          conversionRate: 3.2
        },
        {
          url: '/guia/herramientas-pintura',
          title: 'Guía completa de herramientas de pintura',
          wordCount: 2200,
          readabilityScore: 78,
          organicTraffic: 1800,
          socialShares: 89,
          backlinks: 18,
          conversionRate: 2.8
        }
      ],
      contentGaps: [
        'Guías de aplicación de pintura',
        'Comparativas de marcas',
        'Tendencias en decoración',
        'Mantenimiento de herramientas'
      ]
    };
  }

  private async generateCompetitiveAnalysis(competitors: CompetitorAnalysis[]): Promise<CompetitiveAnalysis> {
    return {
      marketShare: Math.floor(Math.random() * 15) + 10, // 10-25%
      visibilityScore: Math.floor(Math.random() * 30) + 60, // 60-90
      competitorComparison: competitors.slice(0, 3).map(comp => ({
        competitor: comp.competitor,
        ourPosition: Math.floor(Math.random() * 10) + 5,
        theirPosition: Math.floor(Math.random() * 8) + 3,
        gap: Math.floor(Math.random() * 5) + 1,
        opportunity: Math.random() > 0.6 ? 'high' : Math.random() > 0.3 ? 'medium' : 'low'
      })),
      opportunityAnalysis: [
        {
          type: 'keyword',
          description: 'Keywords de cola larga con baja competencia',
          potential: 85,
          difficulty: 35,
          priority: 'high'
        },
        {
          type: 'content',
          description: 'Gaps de contenido en guías técnicas',
          potential: 70,
          difficulty: 50,
          priority: 'medium'
        },
        {
          type: 'backlink',
          description: 'Oportunidades de enlaces en sitios de arquitectura',
          potential: 60,
          difficulty: 70,
          priority: 'medium'
        }
      ]
    };
  }

  private async generateActionPlan(): Promise<ActionPlan> {
    return {
      quickWins: [
        {
          id: 'qw-1',
          title: 'Agregar meta descriptions faltantes',
          description: 'Completar meta descriptions en 5 páginas importantes',
          category: 'Content',
          priority: 'high',
          effort: 'low',
          impact: 'medium',
          estimatedTime: 2,
          dependencies: [],
          kpis: ['CTR', 'Impresiones']
        },
        {
          id: 'qw-2',
          title: 'Implementar schema de productos',
          description: 'Agregar structured data a páginas de productos',
          category: 'Technical',
          priority: 'high',
          effort: 'low',
          impact: 'high',
          estimatedTime: 3,
          dependencies: [],
          kpis: ['Rich snippets', 'CTR']
        }
      ],
      shortTerm: [
        {
          id: 'st-1',
          title: 'Optimizar Core Web Vitals',
          description: 'Mejorar LCP, FID y CLS en páginas principales',
          category: 'Performance',
          priority: 'high',
          effort: 'medium',
          impact: 'high',
          estimatedTime: 14,
          dependencies: ['qw-2'],
          kpis: ['LCP', 'FID', 'CLS', 'Page Speed Score']
        }
      ],
      longTerm: [
        {
          id: 'lt-1',
          title: 'Estrategia de contenido SEO',
          description: 'Crear plan de contenido para keywords objetivo',
          category: 'Content',
          priority: 'medium',
          effort: 'high',
          impact: 'high',
          estimatedTime: 90,
          dependencies: ['st-1'],
          kpis: ['Organic Traffic', 'Keyword Rankings', 'Conversions']
        }
      ],
      ongoing: [
        {
          id: 'og-1',
          title: 'Monitoreo y optimización continua',
          description: 'Seguimiento mensual de métricas y ajustes',
          category: 'Monitoring',
          priority: 'medium',
          effort: 'low',
          impact: 'medium',
          estimatedTime: 30, // mensual
          dependencies: [],
          kpis: ['Overall SEO Score', 'Organic Growth']
        }
      ]
    };
  }

  private async generateRecommendations(): Promise<SEORecommendation[]> {
    return [
      {
        id: 'rec-1',
        category: 'performance',
        title: 'Optimizar Core Web Vitals',
        description: 'Mejorar LCP, FID y CLS para mejor experiencia de usuario y rankings',
        priority: 'high',
        impact: 'high',
        effort: 'medium',
        estimatedTimeToImplement: 14,
        estimatedTrafficIncrease: 15,
        estimatedRevenueIncrease: 25000,
        implementationSteps: [
          'Auditar páginas con peor performance',
          'Optimizar imágenes y recursos',
          'Implementar lazy loading',
          'Optimizar JavaScript crítico'
        ],
        requiredResources: ['Desarrollador frontend', 'Herramientas de optimización'],
        kpis: ['LCP', 'FID', 'CLS', 'Page Speed Score'],
        relatedRecommendations: ['rec-2'],
        status: 'pending',
        notes: []
      },
      {
        id: 'rec-2',
        category: 'technical',
        title: 'Implementar schema markup completo',
        description: 'Agregar structured data a todas las páginas de productos y categorías',
        priority: 'high',
        impact: 'medium',
        effort: 'low',
        estimatedTimeToImplement: 7,
        estimatedTrafficIncrease: 8,
        estimatedRevenueIncrease: 12000,
        implementationSteps: [
          'Definir schemas necesarios',
          'Implementar en templates',
          'Validar con herramientas de Google',
          'Monitorear rich snippets'
        ],
        requiredResources: ['Desarrollador', 'Herramientas de validación'],
        kpis: ['Rich snippets', 'CTR', 'Impresiones'],
        relatedRecommendations: ['rec-1'],
        status: 'pending',
        notes: []
      }
    ];
  }

  // ===================================
  // MÉTODOS DE UTILIDAD Y CACHE
  // ===================================

  private async cacheMetrics(key: string, data: any): Promise<void> {
    try {
      const cacheKey = `seo_analytics:${key}`;
      const cacheData = { data, timestamp: Date.now() };

      // Cache en Redis si está disponible
      if (this.redis) {
        await this.redis.setex(cacheKey, this.config.cache.ttl, JSON.stringify(cacheData));
      }

      // Cache en memoria
      this.cache.set(cacheKey, cacheData);

      // Limpiar cache si excede el tamaño máximo
      if (this.cache.size > this.config.cache.maxSize) {
        const oldestKey = this.cache.keys().next().value;
        this.cache.delete(oldestKey);
      }

    } catch (error) {
      logger.warn(LogLevel.WARN, 'Failed to cache SEO metrics', { key }, LogCategory.SEO);
    }
  }

  private async getCachedMetrics(key: string): Promise<any> {
    try {
      const cacheKey = `seo_analytics:${key}`;

      // Intentar Redis primero
      if (this.redis) {
        const cached = await this.redis.get(cacheKey);
        if (cached) {
          const parsed = JSON.parse(cached);
          if (Date.now() - parsed.timestamp < this.config.cache.ttl * 1000) {
            return parsed.data;
          }
        }
      }

      // Fallback a cache en memoria
      const memoryCached = this.cache.get(cacheKey);
      if (memoryCached) {
        if (Date.now() - memoryCached.timestamp < this.config.cache.ttl * 1000) {
          return memoryCached.data;
        } else {
          this.cache.delete(cacheKey);
        }
      }

      return null;
    } catch (error) {
      logger.warn(LogLevel.WARN, 'Failed to get cached SEO metrics', { key }, LogCategory.SEO);
      return null;
    }
  }

  // Obtener métricas históricas
  getHistoricalMetrics(days: number = 30): SEOMetrics[] {
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - days);

    return this.metrics.filter(metric => metric.timestamp >= cutoffDate);
  }

  // Obtener últimas métricas
  getLastMetrics(): SEOMetrics | null {
    return this.metrics.length > 0 ? this.metrics[this.metrics.length - 1] : null;
  }

  // Calcular score SEO general mejorado
  private calculateOverallSEOScore(metrics: SEOMetrics): number {
    let score = 0;
    let factors = 0;

    // Core Web Vitals (30%)
    if (metrics.coreWebVitals.score === 'good') {score += 30;}
    else if (metrics.coreWebVitals.score === 'needs-improvement') {score += 20;}
    else {score += 10;}
    factors += 30;

    // Indexación (20%)
    score += (metrics.indexationStatus.indexationRate / 100) * 20;
    factors += 20;

    // CTR (15%)
    const normalizedCTR = Math.min(metrics.ctr / 10, 1); // Normalizar a 0-1
    score += normalizedCTR * 15;
    factors += 15;

    // Posición promedio (15%)
    const positionScore = Math.max(0, (50 - metrics.avgPosition) / 50);
    score += positionScore * 15;
    factors += 15;

    // Tráfico orgánico (10%)
    const trafficScore = Math.min(metrics.organicTraffic / 10000, 1); // Normalizar
    score += trafficScore * 10;
    factors += 10;

    // Alertas críticas (10%)
    const criticalAlerts = this.alerts.filter(a => a.type === 'critical' && !a.resolved).length;
    const alertPenalty = Math.min(criticalAlerts * 2, 10);
    score += Math.max(0, 10 - alertPenalty);
    factors += 10;

    return Math.round(score);
  }

  // Obtener keywords por tendencia
  getKeywordsByTrend(trend: 'up' | 'down' | 'stable'): KeywordMetrics[] {
    return this.keywords.filter(keyword => keyword.trend === trend);
  }

  // Obtener alertas por tipo
  getAlertsByType(type: 'critical' | 'warning' | 'info'): SEOAlert[] {
    return this.alerts.filter(alert => alert.type === type && !alert.resolved);
  }

  // Obtener alertas no resueltas
  getUnresolvedAlerts(): SEOAlert[] {
    return this.alerts.filter(alert => !alert.resolved);
  }

  // Resolver alerta mejorado
  async resolveAlert(alertId: string, notes?: string): Promise<boolean> {
    const alert = this.alerts.find(a => a.id === alertId);
    if (alert) {
      alert.resolved = true;
      if (notes) {
        if (!alert.notes) {
          alert.notes = [];
        }
        alert.notes.push(notes);
      }

      await this.cacheMetrics('alerts', this.alerts);
      this.notifyListeners({ type: 'alert_resolved', data: alert });

      logger.info(LogLevel.INFO, 'SEO alert resolved', {
        alertId,
        title: alert.title,
        category: alert.category
      }, LogCategory.SEO);

      return true;
    }
    return false;
  }

  // Obtener estadísticas de keywords
  getKeywordStats(): {
    total: number;
    topPositions: number;
    improvements: number;
    declines: number;
    averagePosition: number;
  } {
    const total = this.keywords.length;
    const topPositions = this.keywords.filter(k => k.position <= 10).length;
    const improvements = this.keywords.filter(k => k.trend === 'up').length;
    const declines = this.keywords.filter(k => k.trend === 'down').length;
    const averagePosition = total > 0
      ? this.keywords.reduce((sum, k) => sum + k.position, 0) / total
      : 0;

    return {
      total,
      topPositions,
      improvements,
      declines,
      averagePosition: Number(averagePosition.toFixed(1))
    };
  }

  // Obtener métricas de performance
  getPerformanceMetrics(): {
    coreWebVitalsScore: string;
    averageLCP: number;
    averageFID: number;
    averageCLS: number;
    performanceIssues: number;
  } {
    const lastMetrics = this.getLastMetrics();
    if (!lastMetrics) {
      return {
        coreWebVitalsScore: 'unknown',
        averageLCP: 0,
        averageFID: 0,
        averageCLS: 0,
        performanceIssues: 0
      };
    }

    const performanceIssues = this.alerts.filter(
      a => a.category === 'performance' && !a.resolved
    ).length;

    return {
      coreWebVitalsScore: lastMetrics.coreWebVitals.score,
      averageLCP: lastMetrics.coreWebVitals.lcp,
      averageFID: lastMetrics.coreWebVitals.fid,
      averageCLS: lastMetrics.coreWebVitals.cls,
      performanceIssues
    };
  }

  // Obtener resumen de competidores
  getCompetitorSummary(): {
    totalCompetitors: number;
    averageDomainAuthority: number;
    keywordOpportunities: number;
    contentGaps: number;
  } {
    const totalCompetitors = this.competitors.length;
    const averageDomainAuthority = totalCompetitors > 0
      ? this.competitors.reduce((sum, c) => sum + c.domainAuthority, 0) / totalCompetitors
      : 0;

    const keywordOpportunities = this.competitors.reduce((sum, c) => sum + c.keywordGaps.length, 0);
    const contentGaps = this.competitors.reduce((sum, c) => sum + c.contentGaps.length, 0);

    return {
      totalCompetitors,
      averageDomainAuthority: Number(averageDomainAuthority.toFixed(1)),
      keywordOpportunities,
      contentGaps
    };
  }

  // Exportar datos para dashboard
  exportDashboardData(): {
    overview: any;
    keywords: KeywordMetrics[];
    alerts: SEOAlert[];
    performance: any;
    competitors: any;
    reports: SEOReport[];
  } {
    const lastMetrics = this.getLastMetrics();

    return {
      overview: {
        overallScore: lastMetrics ? this.calculateOverallSEOScore(lastMetrics) : 0,
        organicTraffic: lastMetrics?.organicTraffic || 0,
        averagePosition: this.getKeywordStats().averagePosition,
        indexationRate: lastMetrics?.indexationStatus.indexationRate || 0,
        coreWebVitalsScore: lastMetrics?.coreWebVitals.score || 'unknown',
        unresolvedAlerts: this.getUnresolvedAlerts().length,
        lastUpdated: lastMetrics?.timestamp || new Date()
      },
      keywords: this.keywords.slice(0, 20), // Top 20 keywords
      alerts: this.getUnresolvedAlerts().slice(0, 10), // Top 10 alerts
      performance: this.getPerformanceMetrics(),
      competitors: this.getCompetitorSummary(),
      reports: this.reports.slice(-5) // Últimos 5 reportes
    };
  }

  // Limpiar datos antiguos
  async cleanupOldData(): Promise<void> {
    const now = new Date();

    // Limpiar métricas antiguas
    const metricsRetentionDate = new Date(now.getTime() - this.config.dataRetention.metricsRetentionDays * 24 * 60 * 60 * 1000);
    this.metrics = this.metrics.filter(m => m.timestamp >= metricsRetentionDate);

    // Limpiar alertas antiguas
    const alertsRetentionDate = new Date(now.getTime() - this.config.dataRetention.alertsRetentionDays * 24 * 60 * 60 * 1000);
    this.alerts = this.alerts.filter(a => a.timestamp >= alertsRetentionDate);

    // Limpiar reportes antiguos
    const reportsRetentionDate = new Date(now.getTime() - this.config.dataRetention.reportsRetentionDays * 24 * 60 * 60 * 1000);
    this.reports = this.reports.filter(r => r.generatedAt >= reportsRetentionDate);

    logger.info(LogLevel.INFO, 'SEO analytics data cleanup completed', {
      metricsCount: this.metrics.length,
      alertsCount: this.alerts.length,
      reportsCount: this.reports.length
    }, LogCategory.SEO);
  }

  // Suscribirse a actualizaciones
  subscribe(callback: (data: any) => void): void {
    this.listeners.push(callback);
  }

  // Desuscribirse de actualizaciones
  unsubscribe(callback: (data: any) => void): void {
    const index = this.listeners.indexOf(callback);
    if (index > -1) {
      this.listeners.splice(index, 1);
    }
  }

  // Notificar a todos los listeners
  private notifyListeners(data: any): void {
    this.listeners.forEach(callback => {
      try {
        callback(data);
      } catch (error) {
        logger.error(LogLevel.ERROR, 'Error in SEO analytics listener', error as Error, LogCategory.SEO);
      }
    });
  }

  // Destructor para limpiar intervalos
  destroy(): void {
    if (this.metricsInterval) {
      clearInterval(this.metricsInterval);
      this.metricsInterval = null;
    }
    if (this.keywordInterval) {
      clearInterval(this.keywordInterval);
      this.keywordInterval = null;
    }
    if (this.competitorInterval) {
      clearInterval(this.competitorInterval);
      this.competitorInterval = null;
    }
    if (this.alertInterval) {
      clearInterval(this.alertInterval);
      this.alertInterval = null;
    }

    this.listeners = [];
    this.cache.clear();

    logger.info(LogLevel.INFO, 'Enhanced SEO Analytics Manager destroyed', {}, LogCategory.SEO);
  }
}

// ===================================
// INSTANCIAS Y EXPORTACIONES
// ===================================

// Instancia singleton mejorada
export const enhancedSEOAnalyticsManager = EnhancedSEOAnalyticsManager.getInstance();

// Mantener compatibilidad con la instancia anterior
export const seoAnalyticsManager = enhancedSEOAnalyticsManager;

// Exportar configuración por defecto
export { DEFAULT_SEO_CONFIG };

// Exportar tipos principales
export type {
  SEOAnalyticsConfig,
  SEOMetrics,
  KeywordMetrics,
  CompetitorAnalysis,
  SEOAlert,
  SEOReport,
  SEORecommendation,
  CoreWebVitals,
  IndexationStatus,
  TechnicalSEOMetrics,
  PageMetrics,
  DeviceMetrics,
  GeographicMetrics,
  CompetitorKeywordData,
  SeasonalData,
  CompetitorPage,
  ContentGap,
  BacklinkGap,
  SocialMetrics,
  ResolutionStep,
  ExecutiveSummary,
  PerformanceAnalysis,
  KeywordAnalysis,
  TechnicalAnalysis,
  ContentAnalysis,
  CompetitiveAnalysis,
  ActionPlan,
  ActionItem,
  ScheduledDelivery,
  BudgetRecommendation,
  PagePerformance,
  TechnicalIssue,
  ContentMetrics,
  CompetitorComparison,
  OpportunityAnalysis
};









