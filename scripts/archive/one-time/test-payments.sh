#!/bin/bash

# ===================================
# PINTEYA E-COMMERCE - SCRIPT DE TESTING DE PAGOS
# ===================================

echo "🚀 Iniciando tests automatizados del sistema de pagos..."

# Colores para output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Función para logging
log_info() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

log_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

log_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

log_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Verificar que Node.js esté instalado
if ! command -v node &> /dev/null; then
    log_error "Node.js no está instalado"
    exit 1
fi

# Verificar que npm esté instalado
if ! command -v npm &> /dev/null; then
    log_error "npm no está instalado"
    exit 1
fi

# Verificar que el proyecto esté configurado
if [ ! -f "package.json" ]; then
    log_error "package.json no encontrado. Ejecutar desde la raíz del proyecto."
    exit 1
fi

# Instalar dependencias si es necesario
log_info "Verificando dependencias..."
if [ ! -d "node_modules" ]; then
    log_info "Instalando dependencias..."
    npm install
fi

# Verificar que Playwright esté instalado
if ! npx playwright --version &> /dev/null; then
    log_warning "Playwright no está instalado. Instalando..."
    npx playwright install
fi

# Configurar variables de entorno para testing
export NODE_ENV=test
export NEXT_PUBLIC_MOCK_PAYMENTS=true
export PLAYWRIGHT_TEST=true

log_info "Configuración de testing:"
log_info "- NODE_ENV: $NODE_ENV"
log_info "- MOCK_PAYMENTS: $NEXT_PUBLIC_MOCK_PAYMENTS"
log_info "- PLAYWRIGHT_TEST: $PLAYWRIGHT_TEST"

# Verificar que el servidor de desarrollo esté corriendo
log_info "Verificando servidor de desarrollo..."
if ! curl -s http://localhost:3000 > /dev/null; then
    log_warning "Servidor de desarrollo no está corriendo. Iniciando..."
    npm run dev &
    SERVER_PID=$!
    
    # Esperar a que el servidor esté listo
    log_info "Esperando a que el servidor esté listo..."
    for i in {1..30}; do
        if curl -s http://localhost:3000 > /dev/null; then
            log_success "Servidor listo en http://localhost:3000"
            break
        fi
        sleep 2
        if [ $i -eq 30 ]; then
            log_error "Timeout esperando al servidor"
            kill $SERVER_PID 2>/dev/null
            exit 1
        fi
    done
else
    log_success "Servidor de desarrollo ya está corriendo"
    SERVER_PID=""
fi

# Ejecutar tests específicos de pagos
log_info "Ejecutando tests de flujo de pagos..."

# Test 1: Flujo completo de pago exitoso
log_info "Test 1: Flujo completo de pago exitoso"
npx playwright test payment-flow.spec.ts --project=chromium --grep="Flujo completo.*exitoso"

if [ $? -eq 0 ]; then
    log_success "✅ Test de pago exitoso: PASÓ"
else
    log_error "❌ Test de pago exitoso: FALLÓ"
fi

# Test 2: Flujo de pago rechazado
log_info "Test 2: Flujo de pago rechazado"
npx playwright test payment-flow.spec.ts --project=chromium --grep="pago rechazado"

if [ $? -eq 0 ]; then
    log_success "✅ Test de pago rechazado: PASÓ"
else
    log_error "❌ Test de pago rechazado: FALLÓ"
fi

# Test 3: Validación de webhook
log_info "Test 3: Validación de webhook"
npx playwright test payment-flow.spec.ts --project=chromium --grep="webhook"

if [ $? -eq 0 ]; then
    log_success "✅ Test de webhook: PASÓ"
else
    log_error "❌ Test de webhook: FALLÓ"
fi

# Test 4: Performance del checkout
log_info "Test 4: Performance del checkout"
npx playwright test payment-flow.spec.ts --project=chromium --grep="Performance"

if [ $? -eq 0 ]; then
    log_success "✅ Test de performance: PASÓ"
else
    log_error "❌ Test de performance: FALLÓ"
fi

# Ejecutar todos los tests de pagos
log_info "Ejecutando suite completa de tests de pagos..."
npx playwright test payment-flow.spec.ts --project=chromium

TESTS_EXIT_CODE=$?

# Generar reporte
log_info "Generando reporte de tests..."
npx playwright show-report --host=0.0.0.0 --port=9323 &
REPORT_PID=$!

if [ $TESTS_EXIT_CODE -eq 0 ]; then
    log_success "🎉 Todos los tests de pagos pasaron exitosamente!"
    log_info "📊 Reporte disponible en: http://localhost:9323"
else
    log_error "❌ Algunos tests fallaron. Revisar el reporte para más detalles."
    log_info "📊 Reporte disponible en: http://localhost:9323"
fi

# Limpiar procesos si los iniciamos nosotros
if [ ! -z "$SERVER_PID" ]; then
    log_info "Deteniendo servidor de desarrollo..."
    kill $SERVER_PID 2>/dev/null
fi

# Mantener el reporte abierto por un momento
sleep 5
kill $REPORT_PID 2>/dev/null

log_info "Tests de pagos completados."
exit $TESTS_EXIT_CODE
