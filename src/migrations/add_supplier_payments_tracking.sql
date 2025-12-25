-- Add payment tracking fields to warehouse_invoices
ALTER TABLE public.warehouse_invoices
ADD COLUMN IF NOT EXISTS payment_status VARCHAR(20) DEFAULT 'pending',
ADD COLUMN IF NOT EXISTS paid_amount DECIMAL(12, 2) DEFAULT 0,
ADD COLUMN IF NOT EXISTS payment_date TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS payment_method VARCHAR(50),
ADD COLUMN IF NOT EXISTS payment_reference VARCHAR(100),
ADD COLUMN IF NOT EXISTS payment_notes TEXT;

-- Create indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_warehouse_invoices_payment_status 
ON public.warehouse_invoices(payment_status);

CREATE INDEX IF NOT EXISTS idx_warehouse_invoices_payment_date 
ON public.warehouse_invoices(payment_date);

-- Add comments
COMMENT ON COLUMN public.warehouse_invoices.payment_status IS 'حالة الدفع: pending, partial, paid, overdue';
COMMENT ON COLUMN public.warehouse_invoices.paid_amount IS 'المبلغ المدفوع حتى الآن';
COMMENT ON COLUMN public.warehouse_invoices.payment_date IS 'تاريخ آخر دفعة';
COMMENT ON COLUMN public.warehouse_invoices.payment_method IS 'طريقة الدفع: cash, bank_transfer, check, etc.';
COMMENT ON COLUMN public.warehouse_invoices.payment_reference IS 'رقم مرجع الدفعة (رقم الشيك، رقم التحويل، إلخ)';

