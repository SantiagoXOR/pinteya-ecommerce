-- Add whatsapp_message column to orders to persist raw WhatsApp text
ALTER TABLE public.orders
  ADD COLUMN IF NOT EXISTS whatsapp_message TEXT;