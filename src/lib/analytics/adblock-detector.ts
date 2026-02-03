/**
 * Detector de bloqueadores de anuncios
 * Detecta si las solicitudes a endpoints de analytics están siendo bloqueadas
 */

interface AdBlockDetectionResult {
  isBlocked: boolean
  method: 'fetch' | 'sendBeacon' | 'unknown'
  reason?: string
}

class AdBlockDetector {
  private detectionCache: Map<string, AdBlockDetectionResult> = new Map()
  private cacheTTL = 5 * 60 * 1000 // 5 minutos
  private detectionNode: HTMLDivElement | null = null
  private adblockDetectionResult: boolean | null = null
  private adblockDetectionScheduled = false

  /**
   * Detectar si un endpoint está siendo bloqueado
   */
  async detectBlocking(endpoint: string): Promise<AdBlockDetectionResult> {
    const cacheKey = `detection_${endpoint}`
    const cached = this.detectionCache.get(cacheKey)

    if (cached) {
      return cached
    }

    // Test con fetch
    const fetchResult = await this.testFetch(endpoint)
    if (fetchResult.isBlocked) {
      this.detectionCache.set(cacheKey, fetchResult)
      return fetchResult
    }

    // Si fetch funciona, no hay bloqueo
    const result: AdBlockDetectionResult = {
      isBlocked: false,
      method: 'fetch',
    }

    this.detectionCache.set(cacheKey, result)

    // Limpiar cache después de TTL
    setTimeout(() => {
      this.detectionCache.delete(cacheKey)
    }, this.cacheTTL)

    return result
  }

  /**
   * Test de conectividad con fetch
   */
  private async testFetch(endpoint: string): Promise<AdBlockDetectionResult> {
    try {
      const controller = new AbortController()
      const timeoutId = setTimeout(() => controller.abort(), 3000) // 3 segundos timeout

      const response = await fetch(endpoint, {
        method: 'HEAD',
        signal: controller.signal,
        cache: 'no-cache',
      })

      clearTimeout(timeoutId)

      if (!response.ok && response.status !== 404) {
        return {
          isBlocked: false,
          method: 'fetch',
        }
      }

      return {
        isBlocked: false,
        method: 'fetch',
      }
    } catch (error: any) {
      // ERR_BLOCKED_BY_CLIENT o network error indica bloqueo
      if (
        error.name === 'TypeError' ||
        error.message?.includes('Failed to fetch') ||
        error.message?.includes('ERR_BLOCKED_BY_CLIENT') ||
        error.name === 'AbortError'
      ) {
        return {
          isBlocked: true,
          method: 'fetch',
          reason: error.message || 'Request blocked',
        }
      }

      return {
        isBlocked: false,
        method: 'fetch',
      }
    }
  }

  /**
   * Verificar si sendBeacon está disponible
   */
  isSendBeaconAvailable(): boolean {
    return typeof navigator !== 'undefined' && typeof navigator.sendBeacon === 'function'
  }

  /**
   * Detectar bloqueadores de forma proactiva
   * Verifica si elementos comunes de bloqueadores están presentes
   */
  detectAdBlockers(): boolean {
    if (typeof window === 'undefined') {
      return false
    }

    // Detectar extensiones comunes
    const adBlockSigns = [
      // uBlock Origin
      window.getComputedStyle(document.body).getPropertyValue('--abp-display'),
      // AdBlock Plus
      (window as any).getComputedStyle,
      // Detectar scripts bloqueados
      document.querySelector('script[src*="analytics"]') === null &&
        document.querySelector('script[src*="track"]') === null,
    ]

    // Verificar si hay elementos ocultos que indican bloqueadores
    const recordResult = () => {
      const node = this.ensureDetectionNode()
      if (!node) {
        this.adblockDetectionResult = false
        return
      }

      const computed = window.getComputedStyle(node)
      const isHidden =
        computed.display === 'none' ||
        computed.visibility === 'hidden' ||
        node.clientHeight === 0 ||
        node.offsetParent === null

      this.adblockDetectionResult = isHidden
    }

    if (!this.adblockDetectionScheduled) {
      this.adblockDetectionScheduled = true

      if (typeof requestAnimationFrame === 'function') {
        requestAnimationFrame(() => {
          recordResult()
          this.adblockDetectionScheduled = false
        })
      } else {
        recordResult()
        this.adblockDetectionScheduled = false
      }
    }

    return this.adblockDetectionResult ?? false
  }

  /**
   * Limpiar cache de detección
   */
  clearCache(): void {
    this.detectionCache.clear()
    this.adblockDetectionResult = null
  }

  private ensureDetectionNode(): HTMLDivElement | null {
    if (typeof document === 'undefined') {
      return null
    }

    if (this.detectionNode && document.body.contains(this.detectionNode)) {
      return this.detectionNode
    }

    const testDiv = document.createElement('div')
    testDiv.innerHTML = '&nbsp;'
    testDiv.className = 'adsbox'
    testDiv.style.position = 'absolute'
    testDiv.style.left = '-9999px'
    testDiv.setAttribute('data-adblock-test', 'true')

    document.body.appendChild(testDiv)
    this.detectionNode = testDiv

    return testDiv
  }
}

export const adBlockDetector = new AdBlockDetector()
