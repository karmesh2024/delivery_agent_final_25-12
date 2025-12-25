-- Extend invoice status enum with new workflow values
ALTER TYPE public.invoice_status ADD VALUE IF NOT EXISTS 'draft';
ALTER TYPE public.invoice_status ADD VALUE IF NOT EXISTS 'pending_approval';
ALTER TYPE public.invoice_status ADD VALUE IF NOT EXISTS 'assigned_to_warehouse';
ALTER TYPE public.invoice_status ADD VALUE IF NOT EXISTS 'partially_received';
ALTER TYPE public.invoice_status ADD VALUE IF NOT EXISTS 'received_in_warehouse';
ALTER TYPE public.invoice_status ADD VALUE IF NOT EXISTS 'ready_for_pricing';
ALTER TYPE public.invoice_status ADD VALUE IF NOT EXISTS 'cancelled';

-- Create purchase order status enum if not exists
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'purchase_order_status') THEN
    CREATE TYPE purchase_order_status AS ENUM (
      'draft',
      'pending_approval',
      'approved',
      'sent_to_supplier',
      'cancelled'
    );
  END IF;
END$$;

-- Create warehouse assignment status enum if not exists
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'warehouse_assignment_status') THEN
    CREATE TYPE warehouse_assignment_status AS ENUM (
      'pending',
      'partial',
      'completed',
      'cancelled'
    );
  END IF;
END$$;

-- Create warehouse assignment item status enum if not exists
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'warehouse_assignment_item_status') THEN
    CREATE TYPE warehouse_assignment_item_status AS ENUM (
      'pending',
      'received',
      'shortage',
      'damaged'
    );
  END IF;
END$$;

-- Purchase orders table
CREATE TABLE IF NOT EXISTS public.purchase_orders (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  supplier_id INTEGER,
  warehouse_id INTEGER,
  expected_delivery_date DATE,
  total_amount DECIMAL(12, 2),
  status purchase_order_status NOT NULL DEFAULT 'draft',
  notes TEXT,
  created_by UUID,
  approved_by UUID,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  CONSTRAINT fk_purchase_orders_supplier
    FOREIGN KEY (supplier_id) REFERENCES public.suppliers(id) ON DELETE SET NULL,
  CONSTRAINT fk_purchase_orders_warehouse
    FOREIGN KEY (warehouse_id) REFERENCES public.warehouses(id) ON DELETE SET NULL,
  CONSTRAINT fk_purchase_orders_created_by
    FOREIGN KEY (created_by) REFERENCES auth.users(id) ON DELETE SET NULL,
  CONSTRAINT fk_purchase_orders_approved_by
    FOREIGN KEY (approved_by) REFERENCES auth.users(id) ON DELETE SET NULL
);

CREATE INDEX IF NOT EXISTS idx_purchase_orders_supplier ON public.purchase_orders(supplier_id);
CREATE INDEX IF NOT EXISTS idx_purchase_orders_warehouse ON public.purchase_orders(warehouse_id);
CREATE INDEX IF NOT EXISTS idx_purchase_orders_status ON public.purchase_orders(status);

-- Warehouse assignments table
CREATE TABLE IF NOT EXISTS public.warehouse_assignments (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  purchase_order_id UUID,
  invoice_id UUID,
  warehouse_id INTEGER NOT NULL,
  expected_date DATE,
  assigned_by UUID,
  received_by UUID,
  received_at TIMESTAMPTZ,
  status warehouse_assignment_status NOT NULL DEFAULT 'pending',
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  CONSTRAINT fk_warehouse_assignments_po
    FOREIGN KEY (purchase_order_id) REFERENCES public.purchase_orders(id) ON DELETE SET NULL,
  CONSTRAINT fk_warehouse_assignments_invoice
    FOREIGN KEY (invoice_id) REFERENCES public.warehouse_invoices(id) ON DELETE SET NULL,
  CONSTRAINT fk_warehouse_assignments_wh
    FOREIGN KEY (warehouse_id) REFERENCES public.warehouses(id) ON DELETE CASCADE,
  CONSTRAINT fk_warehouse_assignments_assigned_by
    FOREIGN KEY (assigned_by) REFERENCES auth.users(id) ON DELETE SET NULL,
  CONSTRAINT fk_warehouse_assignments_received_by
    FOREIGN KEY (received_by) REFERENCES auth.users(id) ON DELETE SET NULL
);

CREATE INDEX IF NOT EXISTS idx_warehouse_assignments_wh ON public.warehouse_assignments(warehouse_id);
CREATE INDEX IF NOT EXISTS idx_warehouse_assignments_po ON public.warehouse_assignments(purchase_order_id);
CREATE INDEX IF NOT EXISTS idx_warehouse_assignments_invoice ON public.warehouse_assignments(invoice_id);

-- Warehouse assignment items table
CREATE TABLE IF NOT EXISTS public.warehouse_assignment_items (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  assignment_id UUID NOT NULL,
  product_id UUID,
  catalog_product_id BIGINT,
  ordered_quantity DECIMAL(12, 3) NOT NULL,
  received_quantity DECIMAL(12, 3),
  damaged_quantity DECIMAL(12, 3),
  status warehouse_assignment_item_status NOT NULL DEFAULT 'pending',
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  CONSTRAINT fk_assignment_items_assignment
    FOREIGN KEY (assignment_id) REFERENCES public.warehouse_assignments(id) ON DELETE CASCADE,
  CONSTRAINT fk_assignment_items_product
    FOREIGN KEY (product_id) REFERENCES public.store_products(id) ON DELETE SET NULL,
  CONSTRAINT fk_assignment_items_catalog
    FOREIGN KEY (catalog_product_id) REFERENCES public.catalog_products(id) ON DELETE SET NULL
);

CREATE INDEX IF NOT EXISTS idx_assignment_items_assignment ON public.warehouse_assignment_items(assignment_id);
CREATE INDEX IF NOT EXISTS idx_assignment_items_product ON public.warehouse_assignment_items(product_id);

-- Alter warehouse invoices with new relationships
ALTER TABLE public.warehouse_invoices
  ADD COLUMN IF NOT EXISTS purchase_order_id UUID,
  ADD COLUMN IF NOT EXISTS assigned_to_pricing_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS priced_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS pricing_approved_by UUID;

ALTER TABLE public.warehouse_invoices
  ALTER COLUMN status SET DEFAULT 'draft';

ALTER TABLE public.warehouse_invoices
  ADD CONSTRAINT fk_warehouse_invoices_purchase_order
    FOREIGN KEY (purchase_order_id) REFERENCES public.purchase_orders(id) ON DELETE SET NULL;

ALTER TABLE public.warehouse_invoices
  ADD CONSTRAINT fk_warehouse_invoices_pricing_approver
    FOREIGN KEY (pricing_approved_by) REFERENCES auth.users(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS idx_warehouse_invoices_po ON public.warehouse_invoices(purchase_order_id);

