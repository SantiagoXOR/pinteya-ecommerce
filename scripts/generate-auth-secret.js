#!/usr/bin/env node

/**
 * Script para Generar AUTH_SECRET
 * Genera un string aleatorio seguro de 32 caracteres para NextAuth
 */

const crypto = require('crypto')

console.log('🔐 Generando AUTH_SECRET para NextAuth...\n')

const secret = crypto.randomBytes(32).toString('base64')

console.log('✅ AUTH_SECRET generado exitosamente:\n')
console.log('─────────────────────────────────────────────────────────')
console.log(secret)
console.log('─────────────────────────────────────────────────────────')
console.log('\n📋 Cópialo y agrégalo a tus variables de entorno:\n')
console.log('En .env.local (desarrollo):')
console.log(`AUTH_SECRET=${secret}`)
console.log('\nEn Vercel (producción):')
console.log('Key: AUTH_SECRET')
console.log(`Value: ${secret}`)
console.log('\n⚠️  Importante: Guarda este valor de forma segura y no lo compartas.\n')

