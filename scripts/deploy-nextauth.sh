#!/bin/bash

# Script de deployment para migración NextAuth.js
echo "🚀 INICIANDO DEPLOYMENT CON NEXTAUTH.JS..."

# 1. Verificar que las variables estén configuradas
echo "📋 Verificando variables de entorno..."
vercel env ls

# 2. Hacer build local para verificar
echo "🔨 Verificando build local..."
npm run build

# 3. Deploy a producción
echo "🚀 Deploying a producción..."
vercel --prod

# 4. Verificar deployment
echo "✅ Deployment completado!"
echo "🔍 Verificar en: https://pinteya.com"
echo "🔒 Probar autenticación en: https://pinteya.com/api/auth/signin"

echo "📋 PRÓXIMOS PASOS:"
echo "1. Verificar que /api/auth/providers responda 200"
echo "2. Verificar que /api/auth/session responda 200"
echo "3. Probar login con Google"
echo "4. Verificar protección de rutas /admin/*"
