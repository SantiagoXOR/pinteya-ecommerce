// =====================================================
// SCRIPT: GENERADOR DE REPORTE HTML
// Descripción: Convierte el reporte JSON en un HTML visual
// =====================================================

const fs = require('fs').promises;
const path = require('path');

async function generateHTMLReport() {
  try {
    // Buscar el reporte más reciente
    const reportsDir = 'tests/reports';
    const files = await fs.readdir(reportsDir);
    const reportFiles = files.filter(f => f.startsWith('diagnostic-report-') && f.endsWith('.json'));
    
    if (reportFiles.length === 0) {
      console.log('❌ No se encontraron reportes de diagnóstico');
      return;
    }

    // Obtener el más reciente
    const latestReport = reportFiles.sort().reverse()[0];
    const reportPath = path.join(reportsDir, latestReport);
    const reportData = JSON.parse(await fs.readFile(reportPath, 'utf8'));

    // Generar HTML
    const html = generateHTML(reportData);
    
    // Guardar HTML
    const htmlPath = path.join(reportsDir, `diagnostic-report-${Date.now()}.html`);
    await fs.writeFile(htmlPath, html);
    
    console.log(`✅ Reporte HTML generado: ${htmlPath}`);
    
    // Mostrar resumen en consola
    console.log('\n📊 RESUMEN EJECUTIVO');
    console.log('===================');
    console.log(`📅 Fecha: ${new Date(reportData.timestamp).toLocaleString()}`);
    console.log(`📋 Total Funcionalidades: ${reportData.totalTests}`);
    console.log(`✅ Implementadas: ${reportData.implemented} (${((reportData.implemented / reportData.totalTests) * 100).toFixed(1)}%)`);
    console.log(`🚧 Placeholders: ${reportData.placeholders} (${((reportData.placeholders / reportData.totalTests) * 100).toFixed(1)}%)`);
    console.log(`❌ Errores: ${reportData.errors} (${((reportData.errors / reportData.totalTests) * 100).toFixed(1)}%)`);
    
    console.log('\n📊 ESTADO POR MÓDULO:');
    Object.entries(reportData.summary).forEach(([module, stats]) => {
      const percentage = stats.total > 0 ? ((stats.implemented / stats.total) * 100).toFixed(1) : '0';
      const status = percentage >= 90 ? '🟢' : percentage >= 70 ? '🟡' : '🔴';
      console.log(`  ${status} ${module.toUpperCase()}: ${stats.implemented}/${stats.total} (${percentage}%)`);
    });

  } catch (error) {
    console.error('❌ Error generando reporte:', error);
  }
}

function generateHTML(reportData) {
  const timestamp = new Date(reportData.timestamp).toLocaleString();
  const implementedPercentage = ((reportData.implemented / reportData.totalTests) * 100).toFixed(1);
  
  return `
<!DOCTYPE html>
<html lang="es">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Reporte de Diagnóstico - Panel Admin Enterprise</title>
    <style>
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body { 
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
            background: #f8fafc;
            color: #334155;
            line-height: 1.6;
        }
        .container { max-width: 1200px; margin: 0 auto; padding: 20px; }
        .header { 
            background: linear-gradient(135deg, #ea5a17 0%, #f97316 100%);
            color: white;
            padding: 40px 20px;
            border-radius: 12px;
            margin-bottom: 30px;
            text-align: center;
        }
        .header h1 { font-size: 2.5rem; margin-bottom: 10px; }
        .header p { font-size: 1.1rem; opacity: 0.9; }
        
        .summary-grid { 
            display: grid; 
            grid-template-columns: repeat(auto-fit, minmax(250px, 1fr)); 
            gap: 20px; 
            margin-bottom: 30px; 
        }
        .summary-card { 
            background: white; 
            padding: 25px; 
            border-radius: 12px; 
            box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);
            border-left: 4px solid #ea5a17;
        }
        .summary-card h3 { color: #1e293b; margin-bottom: 10px; }
        .summary-card .number { font-size: 2rem; font-weight: bold; color: #ea5a17; }
        .summary-card .percentage { font-size: 0.9rem; color: #64748b; }
        
        .modules-grid { 
            display: grid; 
            grid-template-columns: repeat(auto-fit, minmax(300px, 1fr)); 
            gap: 20px; 
            margin-bottom: 30px; 
        }
        .module-card { 
            background: white; 
            border-radius: 12px; 
            box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);
            overflow: hidden;
        }
        .module-header { 
            padding: 20px; 
            background: #f1f5f9; 
            border-bottom: 1px solid #e2e8f0;
        }
        .module-header h3 { color: #1e293b; }
        .module-progress { 
            width: 100%; 
            height: 8px; 
            background: #e2e8f0; 
            border-radius: 4px; 
            margin-top: 10px;
            overflow: hidden;
        }
        .module-progress-bar { 
            height: 100%; 
            background: linear-gradient(90deg, #10b981, #059669); 
            transition: width 0.3s ease;
        }
        
        .results-table { 
            background: white; 
            border-radius: 12px; 
            box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);
            overflow: hidden;
        }
        .results-table h3 { 
            padding: 20px; 
            background: #f1f5f9; 
            border-bottom: 1px solid #e2e8f0;
            color: #1e293b;
        }
        table { width: 100%; border-collapse: collapse; }
        th, td { padding: 12px 20px; text-align: left; border-bottom: 1px solid #e2e8f0; }
        th { background: #f8fafc; font-weight: 600; color: #475569; }
        
        .status-badge { 
            padding: 4px 12px; 
            border-radius: 20px; 
            font-size: 0.8rem; 
            font-weight: 500;
        }
        .status-implemented { background: #dcfce7; color: #166534; }
        .status-placeholder { background: #fef3c7; color: #92400e; }
        .status-error { background: #fee2e2; color: #991b1b; }
        .status-not-found { background: #f1f5f9; color: #475569; }
        
        .footer { 
            text-align: center; 
            padding: 20px; 
            color: #64748b; 
            font-size: 0.9rem;
        }
        
        @media (max-width: 768px) {
            .header h1 { font-size: 2rem; }
            .summary-grid, .modules-grid { grid-template-columns: 1fr; }
            .container { padding: 10px; }
        }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>🚀 Panel Administrativo Enterprise</h1>
            <p>Reporte de Diagnóstico Completo - Pinteya E-commerce</p>
            <p>Generado el ${timestamp}</p>
        </div>

        <div class="summary-grid">
            <div class="summary-card">
                <h3>📋 Total Funcionalidades</h3>
                <div class="number">${reportData.totalTests}</div>
                <div class="percentage">Funcionalidades evaluadas</div>
            </div>
            <div class="summary-card">
                <h3>✅ Implementadas</h3>
                <div class="number">${reportData.implemented}</div>
                <div class="percentage">${implementedPercentage}% del total</div>
            </div>
            <div class="summary-card">
                <h3>🚧 En Desarrollo</h3>
                <div class="number">${reportData.placeholders}</div>
                <div class="percentage">${((reportData.placeholders / reportData.totalTests) * 100).toFixed(1)}% del total</div>
            </div>
            <div class="summary-card">
                <h3>❌ Con Errores</h3>
                <div class="number">${reportData.errors}</div>
                <div class="percentage">${((reportData.errors / reportData.totalTests) * 100).toFixed(1)}% del total</div>
            </div>
        </div>

        <div class="modules-grid">
            ${Object.entries(reportData.summary).map(([module, stats]) => {
              const percentage = stats.total > 0 ? ((stats.implemented / stats.total) * 100) : 0;
              const moduleIcon = {
                orders: '📋',
                products: '📦', 
                logistics: '🚚',
                integration: '🔗'
              }[module] || '📊';
              
              return `
                <div class="module-card">
                    <div class="module-header">
                        <h3>${moduleIcon} ${module.charAt(0).toUpperCase() + module.slice(1)}</h3>
                        <div>${stats.implemented}/${stats.total} funcionalidades (${percentage.toFixed(1)}%)</div>
                        <div class="module-progress">
                            <div class="module-progress-bar" style="width: ${percentage}%"></div>
                        </div>
                    </div>
                </div>
              `;
            }).join('')}
        </div>

        <div class="results-table">
            <h3>📊 Detalle de Funcionalidades</h3>
            <table>
                <thead>
                    <tr>
                        <th>Módulo</th>
                        <th>Funcionalidad</th>
                        <th>Estado</th>
                        <th>Detalles</th>
                    </tr>
                </thead>
                <tbody>
                    ${reportData.results.map(result => {
                      const statusClass = `status-${result.status.toLowerCase().replace('_', '-')}`;
                      const statusIcon = {
                        'IMPLEMENTED': '✅',
                        'PLACEHOLDER': '🚧',
                        'ERROR': '❌',
                        'NOT_FOUND': '🔍'
                      }[result.status] || '❓';
                      
                      return `
                        <tr>
                            <td><strong>${result.module.toUpperCase()}</strong></td>
                            <td>${result.functionality}</td>
                            <td><span class="status-badge ${statusClass}">${statusIcon} ${result.status}</span></td>
                            <td>${result.details}</td>
                        </tr>
                      `;
                    }).join('')}
                </tbody>
            </table>
        </div>

        <div class="footer">
            <p>🔧 Reporte generado automáticamente por Playwright E2E Testing Suite</p>
            <p>Panel Administrativo Enterprise - Pinteya E-commerce</p>
        </div>
    </div>
</body>
</html>
  `;
}

// Ejecutar si se llama directamente
if (require.main === module) {
  generateHTMLReport();
}

module.exports = { generateHTMLReport };
