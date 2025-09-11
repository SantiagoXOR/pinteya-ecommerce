#!/bin/bash

# 🧪 SCRIPT DE PRUEBA SIMPLE - Webhook MercadoPago
# Prueba el webhook usando curl (sin dependencias adicionales)

WEBHOOK_URL="${WEBHOOK_URL:-http://localhost:3000/api/payments/webhook}"

echo "🚀 INICIANDO PRUEBAS DEL WEBHOOK MERCADOPAGO"
echo "=================================================="
echo "🎯 URL del webhook: $WEBHOOK_URL"
echo ""

# Payload de prueba
PAYLOAD='{
  "action": "payment.updated",
  "api_version": "v1",
  "data": {
    "id": "test_payment_id_123"
  },
  "date_created": "2024-01-01T00:00:00Z",
  "id": 123456,
  "live_mode": false,
  "type": "payment",
  "user_id": "123456789"
}'

# Función para ejecutar prueba
run_test() {
    local test_name="$1"
    local description="$2"
    local expected_status="$3"
    shift 3
    local curl_args="$@"
    
    echo "🧪 Ejecutando: $test_name"
    echo "📝 $description"
    
    # Ejecutar curl y capturar status code
    response=$(curl -s -w "\n%{http_code}" $curl_args "$WEBHOOK_URL" -d "$PAYLOAD")
    status_code=$(echo "$response" | tail -n1)
    response_body=$(echo "$response" | head -n -1)
    
    if [ "$status_code" = "$expected_status" ]; then
        echo "✅ Status: $status_code (esperado: $expected_status)"
    else
        echo "❌ Status: $status_code (esperado: $expected_status)"
    fi
    
    if [ ! -z "$response_body" ]; then
        echo "📄 Respuesta: $response_body"
    fi
    echo ""
}

# Prueba 1: Simulación Dashboard MercadoPago
run_test \
    "🎯 Simulación Dashboard MercadoPago" \
    "Simula webhook desde dashboard de MercadoPago" \
    "200" \
    -X POST \
    -H "Content-Type: application/json" \
    -H "User-Agent: MercadoPago-Webhook-Simulator/1.0" \
    -H "Referer: https://www.mercadopago.com/developers" \
    -H "x-signature: ts=1640995200,v1=test_signature" \
    -H "x-request-id: test-request-dashboard-123"

# Prueba 2: Webhook Real MercadoPago
run_test \
    "🔧 Webhook Real MercadoPago" \
    "Simula webhook real de MercadoPago" \
    "200" \
    -X POST \
    -H "Content-Type: application/json" \
    -H "User-Agent: MercadoPago-Webhook/1.0" \
    -H "x-signature: ts=1640995200,v1=test_signature" \
    -H "x-request-id: test-request-real-456"

# Prueba 3: Herramientas de Testing
run_test \
    "📱 Postman/Insomnia" \
    "Debe permitir herramientas de testing" \
    "200" \
    -X POST \
    -H "Content-Type: application/json" \
    -H "User-Agent: PostmanRuntime/7.29.0" \
    -H "x-signature: ts=1640995200,v1=test_signature" \
    -H "x-request-id: test-request-postman-111"

# Prueba 4: Desarrollo Local
run_test \
    "🧪 Desarrollo Local" \
    "Debe permitir en desarrollo local" \
    "200" \
    -X POST \
    -H "Content-Type: application/json" \
    -H "User-Agent: curl/7.68.0" \
    -H "Host: localhost:3000" \
    -H "x-signature: ts=1640995200,v1=test_signature" \
    -H "x-request-id: test-request-local-999"

# Prueba 5: Origen Sospechoso (debe fallar)
run_test \
    "🚫 Origen Sospechoso" \
    "Debe rechazar origen sospechoso" \
    "403" \
    -X POST \
    -H "Content-Type: application/json" \
    -H "User-Agent: BadBot/1.0" \
    -H "Origin: https://malicious-site.com" \
    -H "x-signature: ts=1640995200,v1=test_signature" \
    -H "x-request-id: test-request-bad-789"

echo "=================================================="
echo "📊 PRUEBAS COMPLETADAS"
echo ""
echo "📋 PRÓXIMOS PASOS:"
echo "1. Si las pruebas pasaron, prueba desde el dashboard de MercadoPago"
echo "2. Verifica que MERCADOPAGO_WEBHOOK_SECRET esté configurado"
echo "3. Revisa los logs del servidor para más detalles"
echo "4. Consulta SOLUCION_ERROR_403_WEBHOOK_MERCADOPAGO.md"
echo ""
echo "🔧 Para ejecutar:"
echo "chmod +x test-webhook-simple.sh"
echo "./test-webhook-simple.sh"
