-- ============================================================================
-- MIGRACIÓN: Actualizar datos de contacto del tenant Pintemas
-- ============================================================================
-- Teléfono: 5493547637630
-- Email: pintureriaspintemas@gmail.com
-- Horarios: abierto de 7:30 a 21:00 de lunes a viernes
-- ============================================================================

UPDATE tenants
SET
  contact_phone = '5493547637630',
  whatsapp_number = '5493547637630',
  support_email = 'pintureriaspintemas@gmail.com',
  business_hours = '{
    "monday": {"open": "07:30", "close": "21:00"},
    "tuesday": {"open": "07:30", "close": "21:00"},
    "wednesday": {"open": "07:30", "close": "21:00"},
    "thursday": {"open": "07:30", "close": "21:00"},
    "friday": {"open": "07:30", "close": "21:00"},
    "saturday": null,
    "sunday": null
  }'::jsonb,
  updated_at = NOW()
WHERE slug = 'pintemas';
