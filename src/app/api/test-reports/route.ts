import { NextRequest, NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';

export async function GET(request: NextRequest) {
  try {
    const publicReportsDir = path.join(process.cwd(), 'public', 'test-reports');
    const rootReportsDir = path.join(process.cwd(), 'test-reports');
    
    let reports: string[] = [];
    
    // Verificar carpeta public/test-reports
    if (fs.existsSync(publicReportsDir)) {
      const publicFiles = fs.readdirSync(publicReportsDir)
        .filter(file => file.endsWith('.json'))
        .sort((a, b) => {
          // Ordenar por timestamp (más reciente primero)
          const timestampA = a.match(/\d+/);
          const timestampB = b.match(/\d+/);
          if (timestampA && timestampB) {
            return parseInt(timestampB[0]) - parseInt(timestampA[0]);
          }
          return b.localeCompare(a);
        });
      reports = [...reports, ...publicFiles];
    }
    
    // Si no hay reportes en public, verificar carpeta raíz
    if (reports.length === 0 && fs.existsSync(rootReportsDir)) {
      const rootFiles = fs.readdirSync(rootReportsDir)
        .filter(file => file.endsWith('.json'))
        .sort((a, b) => {
          const timestampA = a.match(/\d+/);
          const timestampB = b.match(/\d+/);
          if (timestampA && timestampB) {
            return parseInt(timestampB[0]) - parseInt(timestampA[0]);
          }
          return b.localeCompare(a);
        });
      
      // Copiar archivos a public para que sean accesibles
      if (!fs.existsSync(publicReportsDir)) {
        fs.mkdirSync(publicReportsDir, { recursive: true });
      }
      
      for (const file of rootFiles) {
        const sourcePath = path.join(rootReportsDir, file);
        const destPath = path.join(publicReportsDir, file);
        if (!fs.existsSync(destPath)) {
          fs.copyFileSync(sourcePath, destPath);
        }
      }
      
      reports = rootFiles;
    }
    
    return NextResponse.json({
      success: true,
      reports,
      total: reports.length,
      message: reports.length > 0 ? 'Reportes cargados exitosamente' : 'No se encontraron reportes'
    });
    
  } catch (error) {
    console.error('Error al cargar reportes:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Error interno del servidor',
        reports: [],
        total: 0
      },
      { status: 500 }
    );
  }
}