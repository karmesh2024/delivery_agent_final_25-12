-- Migration: Add timestamps for each fulfillment stage
-- This tracks the exact time when each fulfillment stage was reached

-- Add timestamp columns for each fulfillment stage
ALTER TABLE public.store_orders
ADD COLUMN IF NOT EXISTS pending_at TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS collecting_at TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS verifying_at TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS packaging_at TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS ready_at TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS completed_at TIMESTAMPTZ;

-- Set pending_at for existing orders with pending status
UPDATE public.store_orders
SET pending_at = created_at
WHERE fulfillment_status = 'pending' AND pending_at IS NULL;

-- Set timestamps for existing orders based on their current fulfillment_status
UPDATE public.store_orders
SET collecting_at = updated_at
WHERE fulfillment_status IN ('collecting', 'verifying', 'packaging', 'ready', 'completed') 
  AND collecting_at IS NULL;

UPDATE public.store_orders
SET verifying_at = updated_at
WHERE fulfillment_status IN ('verifying', 'packaging', 'ready', 'completed') 
  AND verifying_at IS NULL;

UPDATE public.store_orders
SET packaging_at = updated_at
WHERE fulfillment_status IN ('packaging', 'ready', 'completed') 
  AND packaging_at IS NULL;

UPDATE public.store_orders
SET ready_at = updated_at
WHERE fulfillment_status IN ('ready', 'completed') 
  AND ready_at IS NULL;

UPDATE public.store_orders
SET completed_at = updated_at
WHERE fulfillment_status = 'completed' 
  AND completed_at IS NULL;

-- Create a trigger to automatically set pending_at when a new order is created
CREATE OR REPLACE FUNCTION set_pending_at_on_order_create()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.pending_at IS NULL THEN
    NEW.pending_at = NEW.created_at;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_set_pending_at_on_order_create ON public.store_orders;
CREATE TRIGGER trigger_set_pending_at_on_order_create
  BEFORE INSERT ON public.store_orders
  FOR EACH ROW
  EXECUTE FUNCTION set_pending_at_on_order_create();

-- Add comments
COMMENT ON COLUMN public.store_orders.pending_at IS 'وقت بدء انتظار التجميع';
COMMENT ON COLUMN public.store_orders.collecting_at IS 'وقت بدء التجميع';
COMMENT ON COLUMN public.store_orders.verifying_at IS 'وقت بدء التحقق';
COMMENT ON COLUMN public.store_orders.packaging_at IS 'وقت بدء التغليف';
COMMENT ON COLUMN public.store_orders.ready_at IS 'وقت جاهزية الطلب للتسليم';
COMMENT ON COLUMN public.store_orders.completed_at IS 'وقت إتمام التسليم';

