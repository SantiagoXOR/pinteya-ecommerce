# 🚨 MERCADOPAGO TEMPORALMENTE DESHABILITADO

## MOTIVO:

- Filtración de credenciales detectada
- Sin acceso inmediato a cuenta MercadoPago para rotación
- Deshabilitado como medida de seguridad preventiva

## VARIABLES REMOVIDAS TEMPORALMENTE:

- MERCADOPAGO_ACCESS_TOKEN
- MERCADOPAGO_CLIENT_SECRET
- MERCADOPAGO_CLIENT_ID
- MERCADOPAGO_WEBHOOK_SECRET

## VARIABLE MANTENIDA (PÚBLICA):

- NEXT_PUBLIC_MERCADOPAGO_PUBLIC_KEY

## PLAN DE REACTIVACIÓN:

1. Obtener acceso a cuenta MercadoPago
2. Rotar todas las credenciales
3. Actualizar variables en Vercel
4. Reactivar funcionalidad de pagos
5. Eliminar este archivo

## FECHA: 2 Septiembre 2025

## RESPONSABLE: Santiago XOR

## IMPACTO:

- Funcionalidad de pagos temporalmente deshabilitada
- Resto del sistema funcionando normalmente
- Seguridad mejorada significativamente
