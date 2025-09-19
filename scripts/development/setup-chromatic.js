#!/usr/bin/env node

/**
 * Script para configurar Chromatic para testing visual regression
 * Pinteya E-commerce Design System
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

console.log('🎨 Configurando Chromatic para Testing Visual Regression...\n');

// Verificar si Chromatic está instalado
try {
  execSync('npx chromatic --version', { stdio: 'pipe' });
  console.log('✅ Chromatic está instalado');
} catch (error) {
  console.log('📦 Instalando Chromatic...');
  execSync('npm install --save-dev chromatic', { stdio: 'inherit' });
  console.log('✅ Chromatic instalado');
}

// Verificar configuración de Storybook
const storybookConfigPath = '.storybook/main.ts';
if (fs.existsSync(storybookConfigPath)) {
  console.log('✅ Configuración de Storybook encontrada');
} else {
  console.error('❌ No se encontró configuración de Storybook');
  process.exit(1);
}

// Crear archivo .env.example si no existe
const envExamplePath = '.env.example';
if (!fs.existsSync(envExamplePath)) {
  const envExample = `# Chromatic Configuration
CHROMATIC_PROJECT_TOKEN=your_chromatic_project_token_here

# Storybook Configuration
STORYBOOK_BASE_URL=http://localhost:6006
`;
  fs.writeFileSync(envExamplePath, envExample);
  console.log('✅ Archivo .env.example creado con configuración de Chromatic');
}

// Verificar si existe .env y agregar configuración de Chromatic
const envPath = '.env.local';
if (fs.existsSync(envPath)) {
  const envContent = fs.readFileSync(envPath, 'utf8');
  if (!envContent.includes('CHROMATIC_PROJECT_TOKEN')) {
    const chromaticConfig = `
# Chromatic Configuration
CHROMATIC_PROJECT_TOKEN=your_chromatic_project_token_here
`;
    fs.appendFileSync(envPath, chromaticConfig);
    console.log('✅ Configuración de Chromatic agregada a .env.local');
  }
} else {
  console.log('⚠️  Archivo .env.local no encontrado. Créalo y agrega CHROMATIC_PROJECT_TOKEN');
}

// Crear configuración de test-runner para accesibilidad
const testRunnerConfigPath = '.storybook/test-runner.ts';
const testRunnerConfig = `import type { TestRunnerConfig } from '@storybook/test-runner';
import { injectAxe, checkA11y, configureAxe } from 'axe-playwright';

const config: TestRunnerConfig = {
  setup() {
    // Configuración global antes de ejecutar tests
  },
  
  async preVisit(page) {
    // Inyectar axe-core para tests de accesibilidad
    await injectAxe(page);
  },
  
  async postVisit(page) {
    // Configurar axe para tests de accesibilidad
    await configureAxe(page, {
      rules: [
        // Reglas específicas para e-commerce
        { id: 'color-contrast', enabled: true },
        { id: 'focus-order-semantics', enabled: true },
        { id: 'keyboard-navigation', enabled: true },
        { id: 'aria-labels', enabled: true },
      ],
    });

    // Ejecutar tests de accesibilidad
    await checkA11y(page, '#storybook-root', {
      detailedReport: true,
      detailedReportOptions: {
        html: true,
      },
    });
  },
};

export default config;
`;

if (!fs.existsSync(testRunnerConfigPath)) {
  fs.writeFileSync(testRunnerConfigPath, testRunnerConfig);
  console.log('✅ Configuración de test-runner creada para tests de accesibilidad');
}

// Crear workflow de GitHub Actions para Chromatic
const workflowDir = '.github/workflows';
const chromaticWorkflowPath = path.join(workflowDir, 'chromatic.yml');

if (!fs.existsSync(workflowDir)) {
  fs.mkdirSync(workflowDir, { recursive: true });
}

const chromaticWorkflow = `name: 'Chromatic Visual Tests'

on:
  push:
    branches: [ main, develop ]
  pull_request:
    branches: [ main ]

jobs:
  chromatic-deployment:
    runs-on: ubuntu-latest
    
    steps:
      - name: Checkout code
        uses: actions/checkout@v4
        with:
          fetch-depth: 0
          
      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: '18'
          cache: 'npm'
          
      - name: Install dependencies
        run: npm ci
        
      - name: Run Chromatic
        uses: chromaui/action@v1
        with:
          projectToken: \${{ secrets.CHROMATIC_PROJECT_TOKEN }}
          buildScriptName: build-storybook
          exitZeroOnChanges: true
          onlyChanged: true
`;

if (!fs.existsSync(chromaticWorkflowPath)) {
  fs.writeFileSync(chromaticWorkflowPath, chromaticWorkflow);
  console.log('✅ Workflow de GitHub Actions para Chromatic creado');
}

console.log('\n🎯 Configuración de Chromatic completada!');
console.log('\n📋 Próximos pasos:');
console.log('1. Ve a https://chromatic.com y crea un proyecto');
console.log('2. Obtén tu PROJECT_TOKEN');
console.log('3. Agrega CHROMATIC_PROJECT_TOKEN a tu .env.local');
console.log('4. Agrega CHROMATIC_PROJECT_TOKEN a GitHub Secrets');
console.log('5. Ejecuta: npm run chromatic');
console.log('\n🚀 ¡Listo para testing visual regression!');
