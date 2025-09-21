const { chromium } = require('playwright');

async function debugFramerMotionIssue() {
  const browser = await chromium.launch({ headless: false });
  const page = await browser.newPage();

  try {
    console.log('🔍 DIAGNÓSTICO COMPLETO DE FRAMER MOTION');
    console.log('='.repeat(50));

    await page.goto('http://localhost:3000/demo/commercial-product-card', { 
      waitUntil: 'networkidle',
      timeout: 30000 
    });

    // Esperar carga completa
    await page.waitForTimeout(2000);

    // 1. Verificar si Framer Motion está cargado
    console.log('\n1️⃣ VERIFICANDO CARGA DE FRAMER MOTION:');
    const framerMotionLoaded = await page.evaluate(() => {
      return typeof window !== 'undefined' && 
             window.FramerMotion !== undefined ||
             document.querySelector('[data-framer-motion]') !== null ||
             document.querySelector('.motion-div') !== null;
    });
    console.log(`✅ Framer Motion detectado: ${framerMotionLoaded}`);

    // 2. Verificar elementos motion
    const motionElements = await page.evaluate(() => {
      const elements = document.querySelectorAll('[data-framer-motion], [data-framer-motion-id]');
      return Array.from(elements).map(el => ({
        tagName: el.tagName,
        className: el.className,
        hasDataFramerMotion: el.hasAttribute('data-framer-motion'),
        hasDataFramerMotionId: el.hasAttribute('data-framer-motion-id'),
        style: el.style.cssText
      }));
    });
    console.log(`🎭 Elementos motion encontrados: ${motionElements.length}`);
    motionElements.forEach((el, i) => {
      console.log(`  ${i + 1}. ${el.tagName} - ${el.className.substring(0, 50)}...`);
    });

    // 3. Verificar CSS y estilos computados
    console.log('\n2️⃣ VERIFICANDO ESTILOS CSS:');
    const firstCard = page.locator('[data-testid-commercial="commercial-product-card"]').first();
    await firstCard.waitFor({ state: 'visible' });

    const cssInfo = await firstCard.evaluate(el => {
      const styles = window.getComputedStyle(el);
      return {
        position: styles.position,
        transform: styles.transform,
        transition: styles.transition,
        willChange: styles.willChange,
        backfaceVisibility: styles.backfaceVisibility,
        transformStyle: styles.transformStyle,
        perspective: styles.perspective,
        zIndex: styles.zIndex,
        overflow: styles.overflow
      };
    });
    console.log('📊 Estilos computados del card:', JSON.stringify(cssInfo, null, 2));

    // 4. Verificar si hay conflictos de CSS
    console.log('\n3️⃣ VERIFICANDO CONFLICTOS CSS:');
    const cssConflicts = await page.evaluate(() => {
      const card = document.querySelector('[data-testid-commercial="commercial-product-card"]');
      if (!card) return null;
      
      const styles = window.getComputedStyle(card);
      const conflicts = [];
      
      // Verificar si hay !important que pueda estar bloqueando
      const allRules = Array.from(document.styleSheets).flatMap(sheet => {
        try {
          return Array.from(sheet.cssRules || sheet.rules || []);
        } catch (e) {
          return [];
        }
      });
      
      const importantRules = allRules.filter(rule => 
        rule.style && rule.style.cssText.includes('!important')
      ).map(rule => rule.cssText);
      
      return {
        hasImportantRules: importantRules.length > 0,
        importantRulesCount: importantRules.length,
        sampleImportantRules: importantRules.slice(0, 3)
      };
    });
    console.log('⚠️ Conflictos CSS:', JSON.stringify(cssConflicts, null, 2));

    // 5. Verificar JavaScript errors
    console.log('\n4️⃣ VERIFICANDO ERRORES JAVASCRIPT:');
    const jsErrors = [];
    page.on('console', msg => {
      if (msg.type() === 'error') {
        jsErrors.push(msg.text());
      }
    });
    
    page.on('pageerror', error => {
      jsErrors.push(`Page Error: ${error.message}`);
    });

    // Esperar un poco para capturar errores
    await page.waitForTimeout(1000);
    console.log(`🚨 Errores JS encontrados: ${jsErrors.length}`);
    jsErrors.forEach((error, i) => {
      console.log(`  ${i + 1}. ${error}`);
    });

    // 6. Probar animaciones manualmente con JavaScript
    console.log('\n5️⃣ PROBANDO ANIMACIONES MANUALMENTE:');
    const manualAnimationTest = await firstCard.evaluate(el => {
      // Intentar aplicar transform manualmente
      const originalTransform = el.style.transform;
      el.style.transform = 'scale(1.05)';
      el.style.transition = 'transform 0.3s ease';
      
      setTimeout(() => {
        el.style.transform = originalTransform;
      }, 500);
      
      return {
        originalTransform,
        manualTransformApplied: el.style.transform === 'scale(1.05)',
        hasTransition: el.style.transition.includes('transform')
      };
    });
    console.log('🔧 Prueba manual:', JSON.stringify(manualAnimationTest, null, 2));

    // 7. Verificar configuración de reducción de movimiento
    console.log('\n6️⃣ VERIFICANDO PREFERENCIAS DE MOVIMIENTO:');
    const motionPreferences = await page.evaluate(() => {
      return {
        prefersReducedMotion: window.matchMedia('(prefers-reduced-motion: reduce)').matches,
        userAgent: navigator.userAgent,
        hasTouch: 'ontouchstart' in window
      };
    });
    console.log('🎛️ Preferencias:', JSON.stringify(motionPreferences, null, 2));

    // 8. Verificar versión de Framer Motion
    console.log('\n7️⃣ VERIFICANDO VERSIÓN DE FRAMER MOTION:');
    const framerVersion = await page.evaluate(() => {
      // Intentar obtener la versión de diferentes maneras
      if (typeof window !== 'undefined') {
        // Buscar en el código fuente
        const scripts = Array.from(document.scripts);
        const framerScript = scripts.find(script => 
          script.src.includes('framer-motion') || 
          script.textContent?.includes('framer-motion')
        );
        
        return {
          hasFramerScript: !!framerScript,
          scriptSrc: framerScript?.src || 'inline',
          windowFramer: typeof window.FramerMotion !== 'undefined'
        };
      }
      return null;
    });
    console.log('📦 Información de Framer Motion:', JSON.stringify(framerVersion, null, 2));

    // 9. Verificar el DOM después de hover
    console.log('\n8️⃣ ANÁLISIS DETALLADO DE HOVER:');
    
    // Estado inicial
    const initialDOM = await firstCard.evaluate(el => {
      return {
        outerHTML: el.outerHTML.substring(0, 200) + '...',
        computedStyle: {
          transform: window.getComputedStyle(el).transform,
          transition: window.getComputedStyle(el).transition,
          scale: window.getComputedStyle(el).scale
        },
        inlineStyle: el.style.cssText
      };
    });
    
    // Hacer hover
    await firstCard.hover();
    await page.waitForTimeout(500);
    
    // Estado después del hover
    const hoverDOM = await firstCard.evaluate(el => {
      return {
        outerHTML: el.outerHTML.substring(0, 200) + '...',
        computedStyle: {
          transform: window.getComputedStyle(el).transform,
          transition: window.getComputedStyle(el).transition,
          scale: window.getComputedStyle(el).scale
        },
        inlineStyle: el.style.cssText
      };
    });
    
    console.log('📊 Estado inicial:', JSON.stringify(initialDOM, null, 2));
    console.log('📊 Estado hover:', JSON.stringify(hoverDOM, null, 2));
    
    const domChanged = JSON.stringify(initialDOM) !== JSON.stringify(hoverDOM);
    console.log(`🔄 DOM cambió durante hover: ${domChanged}`);

    // Screenshot final
    await page.screenshot({ path: 'debug-framer-motion-issue.png', fullPage: true });
    console.log('\n📸 Screenshot guardado como: debug-framer-motion-issue.png');

    console.log('\n🎯 RESUMEN DEL DIAGNÓSTICO:');
    console.log('='.repeat(50));
    console.log(`✅ Framer Motion cargado: ${framerMotionLoaded}`);
    console.log(`🎭 Elementos motion: ${motionElements.length}`);
    console.log(`🚨 Errores JS: ${jsErrors.length}`);
    console.log(`⚠️ Reglas !important: ${cssConflicts?.importantRulesCount || 0}`);
    console.log(`🎛️ Movimiento reducido: ${motionPreferences.prefersReducedMotion}`);
    console.log(`🔄 DOM cambió en hover: ${domChanged}`);

  } catch (error) {
    console.error('❌ Error durante el diagnóstico:', error.message);
  } finally {
    await browser.close();
  }
}

debugFramerMotionIssue();