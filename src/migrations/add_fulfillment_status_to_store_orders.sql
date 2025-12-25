-- Migration: Add fulfillment_status to store_orders for warehouse order fulfillment board
-- This allows tracking the fulfillment stages: collecting, verifying, packaging, ready

-- Create fulfillment_status enum type
DO $$ BEGIN
  CREATE TYPE store_order_fulfillment_status AS ENUM (
    'pending',           -- في انتظار التجميع
    'collecting',         -- قيد التجميع
    'verifying',         -- قيد التحقق
    'packaging',         -- قيد التغليف
    'ready',             -- جاهز للتسليم
    'completed'          -- تم التسليم
  );
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

-- Add fulfillment_status column to store_orders
ALTER TABLE public.store_orders
ADD COLUMN IF NOT EXISTS fulfillment_status store_order_fulfillment_status DEFAULT 'pending';

-- Create index for better query performance
CREATE INDEX IF NOT EXISTS idx_store_orders_fulfillment_status
ON public.store_orders(fulfillment_status);

-- Add comment
COMMENT ON COLUMN public.store_orders.fulfillment_status IS 'Tracks the fulfillment stage of the order in the warehouse (collecting, verifying, packaging, ready)';

