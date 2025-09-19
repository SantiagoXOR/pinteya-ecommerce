import { NextRequest, NextResponse } from 'next/server';
import { exec } from 'child_process';
import { promisify } from 'util';
import fs from 'fs';
import path from 'path';

const execAsync = promisify(exec);

export async function POST(request: NextRequest) {
  try {
    console.log('🚀 Iniciando simulación de flujo de compra...');
    
    // Ruta al script de simulación
    const scriptPath = path.join(process.cwd(), 'complete-purchase-flow-simulation.js');
    const logsPath = path.join(process.cwd(), 'purchase-flow-logs.json');
    
    // Verificar que el script existe
    if (!fs.existsSync(scriptPath)) {
      return NextResponse.json({
        success: false,
        error: 'Script de simulación no encontrado'
      }, { status: 404 });
    }
    
    // Ejecutar el script de simulación
    console.log('📝 Ejecutando script:', scriptPath);
    
    const { stdout, stderr } = await execAsync(`node "${scriptPath}"`, {
      cwd: process.cwd(),
      timeout: 30000 // 30 segundos timeout
    });
    
    console.log('✅ Script ejecutado exitosamente');
    console.log('📤 Stdout:', stdout);
    
    if (stderr) {
      console.warn('⚠️ Stderr:', stderr);
    }
    
    // Leer los logs generados
    let logs = null;
    if (fs.existsSync(logsPath)) {
      try {
        const logsContent = fs.readFileSync(logsPath, 'utf8');
        logs = JSON.parse(logsContent);
        console.log('📊 Logs cargados exitosamente');
      } catch (parseError) {
        console.error('❌ Error parseando logs:', parseError);
      }
    }
    
    return NextResponse.json({
      success: true,
      message: 'Simulación completada exitosamente',
      logs,
      output: stdout,
      timestamp: new Date().toISOString()
    });
    
  } catch (error) {
    console.error('❌ Error en simulación:', error);
    
    // Si es un error de timeout o ejecución
    if (error instanceof Error) {
      return NextResponse.json({
        success: false,
        error: error.message,
        details: {
          name: error.name,
          stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
        }
      }, { status: 500 });
    }
    
    return NextResponse.json({
      success: false,
      error: 'Error desconocido en la simulación'
    }, { status: 500 });
  }
}

// Método GET para verificar el estado del endpoint
export async function GET() {
  const scriptPath = path.join(process.cwd(), 'complete-purchase-flow-simulation.js');
  const logsPath = path.join(process.cwd(), 'purchase-flow-logs.json');
  
  return NextResponse.json({
    status: 'ready',
    scriptExists: fs.existsSync(scriptPath),
    logsExist: fs.existsSync(logsPath),
    lastRun: fs.existsSync(logsPath) ? fs.statSync(logsPath).mtime : null,
    timestamp: new Date().toISOString()
  });
}









