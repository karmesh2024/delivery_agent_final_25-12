-- Migration: Add timestamps for each fulfillment stage (Simplified Version)
-- قم بتطبيق هذا الملف خطوة بخطوة في Supabase SQL Editor

-- Step 1: Add columns one by one (إذا فشل ALTER TABLE مع عدة أعمدة)
ALTER TABLE public.store_orders ADD COLUMN IF NOT EXISTS pending_at TIMESTAMPTZ;
ALTER TABLE public.store_orders ADD COLUMN IF NOT EXISTS collecting_at TIMESTAMPTZ;
ALTER TABLE public.store_orders ADD COLUMN IF NOT EXISTS verifying_at TIMESTAMPTZ;
ALTER TABLE public.store_orders ADD COLUMN IF NOT EXISTS packaging_at TIMESTAMPTZ;
ALTER TABLE public.store_orders ADD COLUMN IF NOT EXISTS ready_at TIMESTAMPTZ;
ALTER TABLE public.store_orders ADD COLUMN IF NOT EXISTS completed_at TIMESTAMPTZ;

-- Step 2: Update existing orders (قم بتطبيق هذا بعد إضافة الأعمدة)
UPDATE public.store_orders
SET pending_at = created_at
WHERE fulfillment_status = 'pending' AND pending_at IS NULL;

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

-- Step 3: Create trigger function
CREATE OR REPLACE FUNCTION set_pending_at_on_order_create()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.pending_at IS NULL THEN
    NEW.pending_at = NEW.created_at;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Step 4: Create trigger
DROP TRIGGER IF EXISTS trigger_set_pending_at_on_order_create ON public.store_orders;
CREATE TRIGGER trigger_set_pending_at_on_order_create
  BEFORE INSERT ON public.store_orders
  FOR EACH ROW
  EXECUTE FUNCTION set_pending_at_on_order_create();

-- Step 5: Add comments
COMMENT ON COLUMN public.store_orders.pending_at IS 'وقت بدء انتظار التجميع';
COMMENT ON COLUMN public.store_orders.collecting_at IS 'وقت بدء التجميع';
COMMENT ON COLUMN public.store_orders.verifying_at IS 'وقت بدء التحقق';
COMMENT ON COLUMN public.store_orders.packaging_at IS 'وقت بدء التغليف';
COMMENT ON COLUMN public.store_orders.ready_at IS 'وقت جاهزية الطلب للتسليم';
COMMENT ON COLUMN public.store_orders.completed_at IS 'وقت إتمام التسليم';

