/**
 * Tests de Penetración para Rate Limiting Enterprise
 * Simula ataques reales para validar la robustez del sistema
 */

// Mock de Redis para tests
jest.mock('ioredis', () => {
  const mockRedis = {
    get: jest.fn(),
    set: jest.fn(),
    incr: jest.fn(),
    expire: jest.fn(),
    del: jest.fn(),
    pipeline: jest.fn(() => ({
      get: jest.fn(),
      incr: jest.fn(),
      expire: jest.fn(),
      exec: jest.fn().mockResolvedValue([[null, '1'], [null, 'OK']])
    })),
    disconnect: jest.fn()
  };
  return jest.fn(() => mockRedis);
});

jest.mock('@/lib/security/enterprise-audit-system', () => ({
  enterpriseAuditSystem: {
    logEnterpriseEvent: jest.fn()
  }
}));

import { NextRequest } from 'next/server';
import {
  checkEnterpriseRateLimit,
  ENTERPRISE_RATE_LIMIT_CONFIGS,
  metricsCollector,
  type EnterpriseRateLimitResult
} from '@/lib/rate-limiting/enterprise-rate-limiter';
import { withEnterpriseRateLimit } from '@/lib/rate-limiting/enterprise-middleware';

describe('Tests de Penetración - Rate Limiting Enterprise', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    // Reset metrics collector
    (metricsCollector as any).metrics = {
      totalRequests: 0,
      allowedRequests: 0,
      blockedRequests: 0,
      redisHits: 0,
      memoryFallbacks: 0,
      errors: 0,
      averageResponseTime: 0,
      topBlockedIPs: [],
      topEndpoints: []
    };
  });

  describe('Ataque de Fuerza Bruta - Admin APIs', () => {
    it('debe bloquear múltiples requests rápidos desde la misma IP', async () => {
      const attackerIP = '192.168.1.100';
      const config = ENTERPRISE_RATE_LIMIT_CONFIGS.ADMIN_CRITICAL;
      const results: EnterpriseRateLimitResult[] = [];

      // Simular 20 requests rápidos (límite admin es 15/min)
      for (let i = 0; i < 20; i++) {
        const mockRequest = {
          headers: new Map([
            ['x-forwarded-for', attackerIP],
            ['user-agent', 'AttackBot/1.0']
          ]),
          nextUrl: { pathname: '/api/admin/products' },
          method: 'POST'
        } as any;

        const result = await checkEnterpriseRateLimit(
          mockRequest,
          config,
          `admin_attack_${i}`
        );
        results.push(result);
      }

      // Verificar que los primeros requests pasan
      expect(results.slice(0, 15).every(r => r.allowed)).toBe(true);
      
      // Verificar que los siguientes son bloqueados
      expect(results.slice(15).every(r => !r.allowed)).toBe(true);
      
      // Verificar métricas de ataque
      const metrics = metricsCollector.getMetrics();
      expect(metrics.blockedRequests).toBeGreaterThan(0);
      expect(metrics.topBlockedIPs.some(ip => ip.ip === attackerIP)).toBe(true);
    });

    it('debe detectar ataque distribuido desde múltiples IPs', async () => {
      const attackerIPs = [
        '192.168.1.100',
        '192.168.1.101', 
        '192.168.1.102',
        '192.168.1.103',
        '192.168.1.104'
      ];
      const config = ENTERPRISE_RATE_LIMIT_CONFIGS.ADMIN_CRITICAL;
      let totalBlocked = 0;

      // Simular ataque distribuido
      for (const ip of attackerIPs) {
        for (let i = 0; i < 20; i++) {
          const mockRequest = {
            headers: new Map([
              ['x-forwarded-for', ip],
              ['user-agent', 'DistributedBot/1.0']
            ]),
            nextUrl: { pathname: '/api/admin/users' },
            method: 'DELETE'
          } as any;

          const result = await checkEnterpriseRateLimit(
            mockRequest,
            config,
            `distributed_attack_${ip}_${i}`
          );

          if (!result.allowed) {
            totalBlocked++;
          }
        }
      }

      // Verificar que se bloquearon múltiples requests
      expect(totalBlocked).toBeGreaterThan(20); // 5 IPs * 5 requests bloqueados cada una

      // Verificar que múltiples IPs están en la lista de bloqueados
      const metrics = metricsCollector.getMetrics();
      expect(metrics.topBlockedIPs.length).toBeGreaterThan(3);
    });

    it('debe resistir ataque de bypass con headers falsos', async () => {
      const config = ENTERPRISE_RATE_LIMIT_CONFIGS.ADMIN_CRITICAL;
      const results: EnterpriseRateLimitResult[] = [];

      // Intentar bypass con diferentes headers
      const bypassAttempts = [
        { 'x-forwarded-for': '127.0.0.1', 'x-real-ip': '192.168.1.100' },
        { 'x-forwarded-for': '192.168.1.100', 'x-real-ip': '127.0.0.1' },
        { 'x-forwarded-for': '192.168.1.100, 127.0.0.1' },
        { 'x-forwarded-for': '192.168.1.100', 'cf-connecting-ip': '127.0.0.1' },
        { 'x-forwarded-for': '192.168.1.100', 'x-client-ip': '10.0.0.1' }
      ];

      for (let attempt = 0; attempt < bypassAttempts.length; attempt++) {
        for (let i = 0; i < 20; i++) {
          const mockRequest = {
            headers: new Map(Object.entries({
              ...bypassAttempts[attempt],
              'user-agent': 'BypassBot/1.0'
            })),
            nextUrl: { pathname: '/api/admin/settings' },
            method: 'PUT'
          } as any;

          const result = await checkEnterpriseRateLimit(
            mockRequest,
            config,
            `bypass_attempt_${attempt}_${i}`
          );
          results.push(result);
        }
      }

      // Verificar que el sistema no fue burlado
      const blockedCount = results.filter(r => !r.allowed).length;
      expect(blockedCount).toBeGreaterThan(50); // Debería bloquear la mayoría
    });
  });

  describe('Ataque de Agotamiento de Recursos', () => {
    it('debe manejar requests con payloads extremadamente grandes', async () => {
      const config = ENTERPRISE_RATE_LIMIT_CONFIGS.PAYMENT_HIGH;
      const attackerIP = '10.0.0.50';

      // Simular requests con diferentes tamaños de payload
      const payloadSizes = [1000, 10000, 100000, 1000000]; // Bytes
      const results: EnterpriseRateLimitResult[] = [];

      for (const size of payloadSizes) {
        for (let i = 0; i < 10; i++) {
          const mockRequest = {
            headers: new Map([
              ['x-forwarded-for', attackerIP],
              ['content-length', size.toString()],
              ['user-agent', 'ResourceExhaustionBot/1.0']
            ]),
            nextUrl: { pathname: '/api/payments/process' },
            method: 'POST'
          } as any;

          const result = await checkEnterpriseRateLimit(
            mockRequest,
            config,
            `resource_attack_${size}_${i}`
          );
          results.push(result);
        }
      }

      // Verificar que el sistema mantiene performance
      const metrics = metricsCollector.getMetrics();
      expect(metrics.averageResponseTime).toBeLessThan(100); // < 100ms
      
      // Verificar que se aplicó rate limiting
      const blockedCount = results.filter(r => !r.allowed).length;
      expect(blockedCount).toBeGreaterThan(0);
    });

    it('debe detectar patrones de scraping automatizado', async () => {
      const config = ENTERPRISE_RATE_LIMIT_CONFIGS.PUBLIC_STANDARD;
      const scraperIP = '203.0.113.100';
      const results: EnterpriseRateLimitResult[] = [];

      // Simular scraping con patrones regulares
      const endpoints = [
        '/api/products',
        '/api/categories', 
        '/api/search',
        '/api/products/1',
        '/api/products/2'
      ];

      // Requests muy rápidos y regulares (típico de bots)
      for (let round = 0; round < 10; round++) {
        for (const endpoint of endpoints) {
          const mockRequest = {
            headers: new Map([
              ['x-forwarded-for', scraperIP],
              ['user-agent', 'ScrapingBot/2.0 (automated)']
            ]),
            nextUrl: { pathname: endpoint },
            method: 'GET'
          } as any;

          const result = await checkEnterpriseRateLimit(
            mockRequest,
            config,
            `scraping_${round}_${endpoint.replace('/', '_')}`
          );
          results.push(result);
        }
      }

      // Verificar detección de scraping
      const blockedCount = results.filter(r => !r.allowed).length;
      expect(blockedCount).toBeGreaterThan(20); // Debería bloquear muchos requests

      // Verificar que el endpoint está en top blocked
      const metrics = metricsCollector.getMetrics();
      expect(metrics.topEndpoints.length).toBeGreaterThan(0);
    });
  });

  describe('Ataques de Timing y Concurrencia', () => {
    it('debe manejar requests concurrentes masivos', async () => {
      const config = ENTERPRISE_RATE_LIMIT_CONFIGS.PUBLIC_STANDARD;
      const attackerIP = '198.51.100.50';

      // Simular 100 requests concurrentes
      const concurrentRequests = Array.from({ length: 100 }, (_, i) => {
        const mockRequest = {
          headers: new Map([
            ['x-forwarded-for', attackerIP],
            ['user-agent', 'ConcurrencyBot/1.0']
          ]),
          nextUrl: { pathname: '/api/products' },
          method: 'GET'
        } as any;

        return checkEnterpriseRateLimit(
          mockRequest,
          config,
          `concurrent_${i}`
        );
      });

      const results = await Promise.all(concurrentRequests);

      // Verificar que el sistema mantuvo consistencia
      const allowedCount = results.filter(r => r.allowed).length;
      const blockedCount = results.filter(r => !r.allowed).length;
      
      expect(allowedCount + blockedCount).toBe(100);
      expect(blockedCount).toBeGreaterThan(50); // Debería bloquear la mayoría
    });

    it('debe resistir ataques de timing para encontrar ventanas', async () => {
      const config = ENTERPRISE_RATE_LIMIT_CONFIGS.ADMIN_CRITICAL;
      const attackerIP = '172.16.0.100';
      const results: EnterpriseRateLimitResult[] = [];

      // Intentar encontrar ventanas de tiempo donde el rate limit se resetea
      for (let window = 0; window < 5; window++) {
        // Burst inicial
        for (let i = 0; i < 20; i++) {
          const mockRequest = {
            headers: new Map([
              ['x-forwarded-for', attackerIP],
              ['user-agent', 'TimingAttackBot/1.0']
            ]),
            nextUrl: { pathname: '/api/admin/critical' },
            method: 'POST'
          } as any;

          const result = await checkEnterpriseRateLimit(
            mockRequest,
            config,
            `timing_window_${window}_${i}`
          );
          results.push(result);
        }

        // Esperar un poco (simular espera para reset)
        await new Promise(resolve => setTimeout(resolve, 100));
      }

      // Verificar que no se pudo explotar timing
      const totalBlocked = results.filter(r => !r.allowed).length;
      expect(totalBlocked).toBeGreaterThan(60); // Debería bloquear la mayoría
    });
  });

  describe('Middleware de Rate Limiting bajo Ataque', () => {
    it('debe mantener funcionalidad durante ataque DDoS simulado', async () => {
      const mockHandler = jest.fn().mockResolvedValue(
        new Response(JSON.stringify({ success: true }), { status: 200 })
      );

      const protectedHandler = withEnterpriseRateLimit({
        configName: 'PUBLIC_STANDARD',
        enableLogging: true
      })(mockHandler);

      // Simular DDoS con múltiples IPs
      const attackIPs = Array.from({ length: 50 }, (_, i) => `10.0.${Math.floor(i/255)}.${i%255}`);
      const results: Response[] = [];

      for (const ip of attackIPs) {
        for (let i = 0; i < 10; i++) {
          const mockRequest = {
            headers: new Map([
              ['x-forwarded-for', ip],
              ['user-agent', 'DDoSBot/1.0']
            ]),
            nextUrl: { pathname: '/api/public/test' },
            method: 'GET'
          } as any;

          try {
            const response = await protectedHandler(mockRequest);
            results.push(response);
          } catch (error) {
            // Rate limit debería devolver respuesta, no error
            expect(error).toBeUndefined();
          }
        }
      }

      // Verificar que el sistema respondió a todos los requests
      expect(results.length).toBe(500);
      
      // Verificar que muchos fueron bloqueados (status 429)
      const blockedResponses = results.filter(r => r.status === 429);
      expect(blockedResponses.length).toBeGreaterThan(300);
      
      // Verificar que algunos requests legítimos pasaron
      const successResponses = results.filter(r => r.status === 200);
      expect(successResponses.length).toBeGreaterThan(0);
    });

    it('debe mantener performance durante ataque sostenido', async () => {
      const mockHandler = jest.fn().mockResolvedValue(
        new Response(JSON.stringify({ data: 'test' }), { status: 200 })
      );

      const protectedHandler = withEnterpriseRateLimit({
        configName: 'ADMIN_CRITICAL',
        enableLogging: false // Disable para performance
      })(mockHandler);

      const attackerIP = '192.0.2.100';
      const startTime = Date.now();
      const results: Response[] = [];

      // Ataque sostenido por 1000 requests
      for (let i = 0; i < 1000; i++) {
        const mockRequest = {
          headers: new Map([
            ['x-forwarded-for', attackerIP],
            ['user-agent', 'SustainedAttackBot/1.0']
          ]),
          nextUrl: { pathname: '/api/admin/test' },
          method: 'GET'
        } as any;

        const response = await protectedHandler(mockRequest);
        results.push(response);
      }

      const endTime = Date.now();
      const totalTime = endTime - startTime;
      const avgResponseTime = totalTime / 1000;

      // Verificar performance (< 5ms por request en promedio)
      expect(avgResponseTime).toBeLessThan(5);
      
      // Verificar que el rate limiting funcionó
      const blockedCount = results.filter(r => r.status === 429).length;
      expect(blockedCount).toBeGreaterThan(900); // Debería bloquear casi todos
    });
  });

  describe('Recuperación y Resilencia', () => {
    it('debe recuperarse después de un ataque masivo', async () => {
      const config = ENTERPRISE_RATE_LIMIT_CONFIGS.PUBLIC_STANDARD;
      const attackerIP = '203.0.113.200';

      // Fase 1: Ataque masivo
      for (let i = 0; i < 100; i++) {
        const mockRequest = {
          headers: new Map([
            ['x-forwarded-for', attackerIP],
            ['user-agent', 'MassiveAttackBot/1.0']
          ]),
          nextUrl: { pathname: '/api/products' },
          method: 'GET'
        } as any;

        await checkEnterpriseRateLimit(mockRequest, config, `massive_attack_${i}`);
      }

      // Verificar que el atacante está bloqueado
      const duringAttackRequest = {
        headers: new Map([
          ['x-forwarded-for', attackerIP],
          ['user-agent', 'MassiveAttackBot/1.0']
        ]),
        nextUrl: { pathname: '/api/products' },
        method: 'GET'
      } as any;

      const duringAttackResult = await checkEnterpriseRateLimit(
        duringAttackRequest, 
        config, 
        'during_attack_check'
      );
      expect(duringAttackResult.allowed).toBe(false);

      // Fase 2: Usuario legítimo debe poder acceder
      const legitimateUserIP = '198.51.100.200';
      const legitimateRequest = {
        headers: new Map([
          ['x-forwarded-for', legitimateUserIP],
          ['user-agent', 'Mozilla/5.0 (legitimate browser)']
        ]),
        nextUrl: { pathname: '/api/products' },
        method: 'GET'
      } as any;

      const legitimateResult = await checkEnterpriseRateLimit(
        legitimateRequest,
        config,
        'legitimate_user'
      );
      expect(legitimateResult.allowed).toBe(true);

      // Verificar métricas de recuperación
      const metrics = metricsCollector.getMetrics();
      expect(metrics.totalRequests).toBeGreaterThan(100);
      expect(metrics.allowedRequests).toBeGreaterThan(0);
    });
  });
});
