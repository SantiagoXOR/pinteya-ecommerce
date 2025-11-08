const { chromium } = require(\"playwright\");

(async () => {
  const browser = await chromium.launch({ headless: false });
  const page = await browser.newPage();

  try {
    console.log(\"🔍 Navegando a la página principal\");
    
    await page.goto(\"http://localhost:3000\");
    await page.waitForLoadState(\"networkidle\");
    
    console.log(\"✅ Página cargada. Tomando captura de pantalla...\");
    await page.screenshot({ path: \"homepage-verification.png\", fullPage: true });
    
    console.log(\"📸 Captura guardada como homepage-verification.png\");
    console.log(\"🔍 Por favor, verifica manualmente:\");
    console.log(\"   1. Busca \\\"cinta papel\\\" en la página\");
    console.log(\"   2. Haz clic en un producto de cinta papel\");
    console.log(\"   3. Verifica que solo aparezcan las opciones: 18mm, 24mm, 36mm, 48mm\");
    console.log(\"   4. Confirma que NO aparezca la opción de 72mm\");
    
    await page.waitForTimeout(10000); // Mantener abierto 10 segundos

  } catch (error) {
    console.error(\"Error:\", error);
  } finally {
    await browser.close();
  }
})();
