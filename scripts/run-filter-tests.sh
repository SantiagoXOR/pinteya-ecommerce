#!/bin/bash

# Script para ejecutar tests del Sistema de Filtros Avanzados
# Uso: ./scripts/run-filter-tests.sh [--headed] [--debug]

set -e

# Colores para output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
CYAN='\033[0;36m'
NC='\033[0m' # No Color

# Funciones de logging
log_header() {
    echo -e "\n${CYAN}============================================================${NC}"
    echo -e "${CYAN}🧪 $1${NC}"
    echo -e "${CYAN}============================================================${NC}"
}

log_step() {
    echo -e "\n${YELLOW}$1${NC}"
}

log_success() {
    echo -e "${GREEN}✅ $1${NC}"
}

log_error() {
    echo -e "${RED}❌ $1${NC}"
}

log_info() {
    echo -e "${BLUE}ℹ️  $1${NC}"
}

# Parsear argumentos
HEADED=""
DEBUG=""
BROWSER="chromium"

while [[ $# -gt 0 ]]; do
    case $1 in
        --headed)
            HEADED="--headed"
            shift
            ;;
        --debug)
            DEBUG="--debug"
            shift
            ;;
        --browser)
            BROWSER="$2"
            shift 2
            ;;
        *)
            echo "Uso: $0 [--headed] [--debug] [--browser chromium|firefox|webkit]"
            exit 1
            ;;
    esac
done

# Función principal
main() {
    log_header "TESTING SISTEMA DE FILTROS AVANZADOS - PINTEYA E-COMMERCE"
    
    # Verificar prerequisitos
    log_step "1. Verificando prerequisitos..."
    
    if [ ! -f "package.json" ]; then
        log_error "package.json no encontrado. Ejecutar desde la raíz del proyecto."
        exit 1
    fi
    
    if [ ! -d "tests/e2e" ]; then
        log_error "Directorio tests/e2e no encontrado."
        exit 1
    fi
    
    # Crear directorio de screenshots si no existe
    mkdir -p tests/screenshots
    
    log_success "Prerequisitos verificados"
    
    # Instalar navegadores si es necesario
    log_step "2. Verificando instalación de Playwright..."
    
    if ! npx playwright --version > /dev/null 2>&1; then
        log_error "Playwright no está instalado. Ejecutar: npm install @playwright/test"
        exit 1
    fi
    
    # Instalar navegadores
    log_info "Instalando navegadores de Playwright..."
    npx playwright install $BROWSER
    
    log_success "Playwright configurado"
    
    # Ejecutar tests
    log_step "3. Ejecutando tests del Sistema de Filtros Avanzados..."
    
    # Configurar argumentos de Playwright
    PLAYWRIGHT_ARGS="--project=$BROWSER"
    
    if [ -n "$HEADED" ]; then
        PLAYWRIGHT_ARGS="$PLAYWRIGHT_ARGS --headed"
    fi
    
    if [ -n "$DEBUG" ]; then
        PLAYWRIGHT_ARGS="$PLAYWRIGHT_ARGS --debug"
    fi
    
    # Ejecutar cada suite de tests
    TEST_SUITES=(
        "tests/e2e/advanced-filters.spec.ts"
        "tests/e2e/filter-transitions.spec.ts"
        "tests/e2e/filter-detection.spec.ts"
    )
    
    FAILED_TESTS=0
    
    for test_suite in "${TEST_SUITES[@]}"; do
        log_info "Ejecutando: $(basename $test_suite)"
        
        if npx playwright test $test_suite $PLAYWRIGHT_ARGS --reporter=list; then
            log_success "$(basename $test_suite) - PASÓ"
        else
            log_error "$(basename $test_suite) - FALLÓ"
            ((FAILED_TESTS++))
        fi
    done
    
    # Mostrar resultados
    log_step "4. Verificando resultados..."
    
    # Contar screenshots generados
    if [ -d "tests/screenshots" ]; then
        SCREENSHOT_COUNT=$(find tests/screenshots -name "*.png" 2>/dev/null | wc -l)
        if [ $SCREENSHOT_COUNT -gt 0 ]; then
            log_success "$SCREENSHOT_COUNT screenshots capturados en tests/screenshots/"
        fi
    fi
    
    # Mostrar ubicación de reportes
    log_info "Reportes disponibles en:"
    log_info "  📊 HTML: test-results/"
    log_info "  📄 JSON: test-results/results.json"
    log_info "  📸 Screenshots: tests/screenshots/"
    
    # Resultado final
    if [ $FAILED_TESTS -eq 0 ]; then
        log_header "🎉 TODOS LOS TESTS PASARON EXITOSAMENTE"
        log_success "El Sistema de Filtros Avanzados está funcionando correctamente"
        exit 0
    else
        log_header "⚠️  $FAILED_TESTS SUITE(S) DE TESTS FALLARON"
        log_error "Revisar los reportes para más detalles"
        exit 1
    fi
}

# Ejecutar función principal
main "$@"
