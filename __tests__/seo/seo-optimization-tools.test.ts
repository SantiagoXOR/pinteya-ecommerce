// ===================================
// TESTS - SEO OPTIMIZATION TOOLS
// Tests para herramientas de optimización SEO
// ===================================

import { seoOptimizationTools, SEOOptimizationTools } from '@/lib/seo/seo-optimization-tools'

interface MockElement {
  getAttribute: (attr: string) => string | null
  textContent?: string
}

interface MockDocument {
  querySelectorAll: (selector: string) => MockElement[]
  body?: {
    textContent?: string
    innerHTML?: string
  }
}

// Mock DOM Parser para tests
global.DOMParser = class DOMParser {
  parseFromString(html: string, type: string) {
    // Simulación básica de DOM parsing
    const mockDoc: MockDocument = {
      body: {
        textContent: html
          .replace(/<[^>]*>/g, ' ')
          .replace(/\s+/g, ' ')
          .trim(),
      },
      querySelectorAll: (selector: string) => {
        const matches: MockElement[] = []

        if (selector === 'h1') {
          const h1Matches = html.match(/<h1[^>]*>/g)
          return h1Matches ? Array(h1Matches.length).fill({ textContent: 'H1 Title' }) : []
        }
        if (selector === 'h2') {
          const h2Matches = html.match(/<h2[^>]*>/g)
          return h2Matches ? Array(h2Matches.length).fill({ textContent: 'H2 Title' }) : []
        }
        if (selector === 'h3') {
          const h3Matches = html.match(/<h3[^>]*>/g)
          return h3Matches ? Array(h3Matches.length).fill({ textContent: 'H3 Title' }) : []
        }
        if (selector === 'img') {
          const imgMatches = html.match(/<img[^>]*>/g)
          return imgMatches
            ? imgMatches.map(img => ({
                getAttribute: (attr: string) => {
                  if (attr === 'alt') return img.includes('alt=') ? 'Alt text' : null
                  if (attr === 'src') return img.includes('large') ? 'large-image.jpg' : 'image.jpg'
                  return null
                },
              }))
            : []
        }
        if (selector === 'a[href]') {
          const linkMatches = html.match(/<a[^>]*href[^>]*>/g)
          return linkMatches
            ? linkMatches.map(link => ({
                getAttribute: (attr: string) => {
                  if (attr === 'href') {
                    if (link.includes('http') && !link.includes('pinteya-ecommerce.vercel.app')) {
                      return 'https://external.com'
                    }
                    return '/internal-link'
                  }
                  if (attr === 'rel') return link.includes('nofollow') ? 'nofollow' : null
                  return null
                },
                textContent: 'Link text',
              }))
            : []
        }

        return matches
      },
    }

    return mockDoc as MockDocument
  }
}

describe('SEOOptimizationTools', () => {
  describe('Singleton Pattern', () => {
    test('mantiene una sola instancia', () => {
      const instance1 = SEOOptimizationTools.getInstance()
      const instance2 = SEOOptimizationTools.getInstance()

      expect(instance1).toBe(instance2)
      expect(instance1).toBe(seoOptimizationTools)
    })
  })

  describe('Content Analysis', () => {
    const sampleHTML = `
      <html>
        <body>
          <h1>Título Principal</h1>
          <h2>Subtítulo</h2>
          <p>Este es un párrafo de contenido con palabras clave como pintura y herramientas. 
             El contenido debe ser suficientemente largo para el análisis SEO.</p>
          <img src="image1.jpg" alt="Imagen con alt text" />
          <img src="large-image.jpg" />
          <a href="/internal-link">Enlace interno</a>
          <a href="https://external.com">Enlace externo</a>
          <a href="/nofollow-link" rel="nofollow">Enlace nofollow</a>
        </body>
      </html>
    `

    test('analiza contenido correctamente', () => {
      const analysis = seoOptimizationTools.analyzeContent(sampleHTML, ['pintura', 'herramientas'])

      expect(analysis.wordCount).toBeGreaterThan(0)
      expect(analysis.readabilityScore).toBeGreaterThan(0)
      expect(analysis.keywordDensity).toHaveProperty('pintura')
      expect(analysis.keywordDensity).toHaveProperty('herramientas')
      expect(analysis.seoScore).toBeGreaterThan(0)
      expect(analysis.recommendations).toBeInstanceOf(Array)
    })

    test('analiza estructura de headings', () => {
      const analysis = seoOptimizationTools.analyzeContent(sampleHTML)

      expect(analysis.headingStructure.h1Count).toBe(1)
      expect(analysis.headingStructure.h2Count).toBe(1)
      expect(analysis.headingStructure.hasProperStructure).toBe(true)
    })

    test('analiza imágenes correctamente', () => {
      const analysis = seoOptimizationTools.analyzeContent(sampleHTML)

      expect(analysis.imageAnalysis.totalImages).toBe(2)
      expect(analysis.imageAnalysis.imagesWithAlt).toBe(1)
      expect(analysis.imageAnalysis.imagesWithoutAlt).toBe(1)
      expect(analysis.imageAnalysis.oversizedImages).toBe(1)
    })

    test('analiza enlaces correctamente', () => {
      const analysis = seoOptimizationTools.analyzeContent(sampleHTML)

      expect(analysis.linkAnalysis.internalLinks).toBe(2)
      expect(analysis.linkAnalysis.externalLinks).toBe(1)
      expect(analysis.linkAnalysis.noFollowLinks).toBe(1)
    })

    test('calcula densidad de keywords', () => {
      const analysis = seoOptimizationTools.analyzeContent(sampleHTML, ['pintura', 'herramientas'])

      expect(analysis.keywordDensity['pintura']).toBeGreaterThan(0)
      expect(analysis.keywordDensity['herramientas']).toBeGreaterThan(0)
    })

    test('genera recomendaciones relevantes', () => {
      const shortHTML = '<html><body><p>Contenido muy corto</p></body></html>'
      const analysis = seoOptimizationTools.analyzeContent(shortHTML)

      expect(analysis.recommendations).toContain('Aumentar el contenido a al menos 300 palabras')
    })
  })

  describe('Title Optimization', () => {
    test('optimiza título agregando keyword', () => {
      const currentTitle = 'Productos de Calidad'
      const targetKeyword = 'pinturas'

      const suggestion = seoOptimizationTools.optimizeTitle(currentTitle, targetKeyword)

      expect(suggestion.type).toBe('title')
      expect(suggestion.priority).toBe('high')
      expect(suggestion.suggested).toContain('pinturas')
      expect(suggestion.impact).toBeGreaterThan(0)
    })

    test('trunca títulos muy largos', () => {
      const longTitle =
        'Este es un título extremadamente largo que definitivamente excede los 60 caracteres recomendados'
      const targetKeyword = 'pinturas'

      const suggestion = seoOptimizationTools.optimizeTitle(longTitle, targetKeyword, 60)

      expect(suggestion.suggested.length).toBeLessThanOrEqual(60)
      expect(suggestion.suggested).toContain('...')
    })

    test('mantiene títulos que ya incluyen keyword', () => {
      const currentTitle = 'Pinturas de Alta Calidad'
      const targetKeyword = 'pinturas'

      const suggestion = seoOptimizationTools.optimizeTitle(currentTitle, targetKeyword)

      expect(suggestion.suggested).not.toContain('pinturas - Pinturas')
    })
  })

  describe('Meta Description Optimization', () => {
    test('optimiza descripción agregando keyword y CTA', () => {
      const currentDescription = 'Productos de alta calidad para tu hogar.'
      const targetKeyword = 'pinturas'

      const suggestion = seoOptimizationTools.optimizeMetaDescription(
        currentDescription,
        targetKeyword
      )

      expect(suggestion.type).toBe('description')
      expect(suggestion.suggested).toContain('pinturas')
      expect(suggestion.suggested).toMatch(/compra|descubre|encuentra|explora|ver más/i)
    })

    test('trunca descripciones muy largas', () => {
      const longDescription =
        'Esta es una descripción extremadamente larga que definitivamente excede los 160 caracteres recomendados para meta descriptions y necesita ser truncada apropiadamente para SEO.'
      const targetKeyword = 'pinturas'

      const suggestion = seoOptimizationTools.optimizeMetaDescription(
        longDescription,
        targetKeyword,
        160
      )

      expect(suggestion.suggested.length).toBeLessThanOrEqual(160)
    })
  })

  describe('Keyword Suggestions', () => {
    test('genera sugerencias de keywords relacionadas', async () => {
      const suggestions = await seoOptimizationTools.suggestKeywords('pintura')

      expect(suggestions).toBeInstanceOf(Array)
      expect(suggestions.length).toBeGreaterThan(0)

      suggestions.forEach(suggestion => {
        expect(suggestion).toHaveProperty('keyword')
        expect(suggestion).toHaveProperty('searchVolume')
        expect(suggestion).toHaveProperty('difficulty')
        expect(suggestion).toHaveProperty('relevanceScore')
        expect(suggestion).toHaveProperty('opportunity')
        expect(suggestion).toHaveProperty('intent')
      })
    })

    test('incluye variaciones relevantes de keyword base', async () => {
      const suggestions = await seoOptimizationTools.suggestKeywords('pintura')

      const keywords = suggestions.map(s => s.keyword)
      expect(keywords.some(k => k.includes('pintura online'))).toBe(true)
      expect(keywords.some(k => k.includes('pintura argentina'))).toBe(true)
    })
  })

  describe('Competitor Analysis', () => {
    test('analiza competidores para keywords', async () => {
      const keywords = ['pintura', 'herramientas']
      const analysis = await seoOptimizationTools.analyzeCompetitors(keywords)

      expect(analysis).toBeInstanceOf(Array)
      expect(analysis.length).toBeGreaterThan(0)

      analysis.forEach(item => {
        expect(item).toHaveProperty('keyword')
        expect(item).toHaveProperty('competitorRanking')
        expect(item).toHaveProperty('searchVolume')
        expect(item).toHaveProperty('difficulty')
        expect(item).toHaveProperty('gap')
      })
    })
  })

  describe('Readability Calculation', () => {
    test('calcula score de legibilidad', () => {
      const text = 'Este es un texto simple. Tiene oraciones cortas. Es fácil de leer.'
      const analysis = seoOptimizationTools.analyzeContent(
        `<html><body><p>${text}</p></body></html>`
      )

      expect(analysis.readabilityScore).toBeGreaterThan(0)
      expect(analysis.readabilityScore).toBeLessThanOrEqual(100)
    })

    test('penaliza texto con oraciones muy largas', () => {
      const longText =
        'Esta es una oración extremadamente larga que contiene muchas palabras y cláusulas subordinadas que hacen que sea difícil de leer y comprender para la mayoría de los usuarios, lo cual afecta negativamente la experiencia del usuario y el SEO.'
      const shortText = 'Texto corto. Fácil de leer. Buena experiencia.'

      const longAnalysis = seoOptimizationTools.analyzeContent(
        `<html><body><p>${longText}</p></body></html>`
      )
      const shortAnalysis = seoOptimizationTools.analyzeContent(
        `<html><body><p>${shortText}</p></body></html>`
      )

      expect(shortAnalysis.readabilityScore).toBeGreaterThan(longAnalysis.readabilityScore)
    })
  })

  describe('SEO Score Calculation', () => {
    test('calcula score SEO basado en múltiples factores', () => {
      const goodHTML = `
        <html>
          <body>
            <h1>Título Principal con Keyword</h1>
            <h2>Subtítulo Relevante</h2>
            <p>Contenido extenso y bien estructurado con keywords relevantes como pintura y herramientas. 
               Este párrafo tiene suficiente longitud para ser considerado contenido de calidad.
               Incluye información valiosa para los usuarios y está optimizado para SEO.</p>
            <img src="image1.jpg" alt="Descripción detallada de la imagen" />
            <img src="image2.jpg" alt="Otra imagen con alt text" />
            <a href="/categoria-pinturas">Enlace interno relevante</a>
            <a href="/herramientas">Otro enlace interno</a>
          </body>
        </html>
      `

      const analysis = seoOptimizationTools.analyzeContent(goodHTML, ['pintura', 'herramientas'])

      expect(analysis.seoScore).toBeGreaterThan(50)
      expect(analysis.seoScore).toBeLessThanOrEqual(100)
    })

    test('penaliza contenido con problemas SEO', () => {
      const badHTML = `
        <html>
          <body>
            <p>Contenido muy corto sin estructura.</p>
            <img src="image.jpg" />
          </body>
        </html>
      `

      const analysis = seoOptimizationTools.analyzeContent(badHTML)

      expect(analysis.seoScore).toBeLessThan(50)
      expect(analysis.recommendations.length).toBeGreaterThan(0)
    })
  })
})
