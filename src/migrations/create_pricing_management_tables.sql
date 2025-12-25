-- Create pricing management tables for financial management system

-- Customer types enum
CREATE TYPE customer_type AS ENUM('retail', 'agent', 'wholesale', 'other');

-- Invoice status enum
CREATE TYPE invoice_status AS ENUM('pending', 'received', 'priced', 'approved', 'rejected');

-- Pricing status enum
CREATE TYPE pricing_status AS ENUM('draft', 'pending_approval', 'approved', 'active', 'inactive');

-- 1. Warehouse Invoices Table
CREATE TABLE warehouse_invoices (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    invoice_number VARCHAR(50) NOT NULL UNIQUE,
    warehouse_id INTEGER NOT NULL,
    supplier_id INTEGER,
    invoice_date DATE NOT NULL DEFAULT CURRENT_DATE,
    received_date DATE,
    total_amount DECIMAL(12, 2) NOT NULL DEFAULT 0,
    status invoice_status NOT NULL DEFAULT 'pending',
    notes TEXT,
    created_by UUID,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    CONSTRAINT fk_warehouse_invoices_warehouse 
        FOREIGN KEY (warehouse_id) REFERENCES warehouses(id) ON DELETE CASCADE,
    CONSTRAINT fk_warehouse_invoices_supplier 
        FOREIGN KEY (supplier_id) REFERENCES suppliers(id) ON DELETE SET NULL,
    CONSTRAINT fk_warehouse_invoices_created_by 
        FOREIGN KEY (created_by) REFERENCES auth.users(id) ON DELETE SET NULL
);

-- 2. Invoice Items Table
CREATE TABLE warehouse_invoice_items (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    invoice_id UUID NOT NULL,
    product_id UUID NOT NULL,
    quantity DECIMAL(10, 3) NOT NULL,
    unit_price DECIMAL(10, 2) NOT NULL,
    total_price DECIMAL(12, 2) NOT NULL,
    measurement_unit measurement_unit NOT NULL DEFAULT 'piece',
    batch_number VARCHAR(100),
    expiry_date DATE,
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    CONSTRAINT fk_invoice_items_invoice 
        FOREIGN KEY (invoice_id) REFERENCES warehouse_invoices(id) ON DELETE CASCADE,
    CONSTRAINT fk_invoice_items_product 
        FOREIGN KEY (product_id) REFERENCES store_products(id) ON DELETE CASCADE,
    CONSTRAINT chk_invoice_items_quantity CHECK (quantity > 0),
    CONSTRAINT chk_invoice_items_unit_price CHECK (unit_price >= 0),
    CONSTRAINT chk_invoice_items_total_price CHECK (total_price >= 0)
);

-- 3. Customer Pricing Rules Table
CREATE TABLE customer_pricing_rules (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    customer_type customer_type NOT NULL,
    name_ar VARCHAR(255) NOT NULL,
    name_en VARCHAR(255),
    description_ar TEXT,
    description_en TEXT,
    markup_percentage DECIMAL(5, 2) DEFAULT 0,
    discount_percentage DECIMAL(5, 2) DEFAULT 0,
    min_order_amount DECIMAL(10, 2),
    max_discount_amount DECIMAL(10, 2),
    is_active BOOLEAN DEFAULT true,
    priority INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    CONSTRAINT chk_pricing_rules_markup CHECK (markup_percentage >= 0),
    CONSTRAINT chk_pricing_rules_discount CHECK (discount_percentage >= 0 AND discount_percentage <= 100),
    CONSTRAINT chk_pricing_rules_min_order CHECK (min_order_amount >= 0),
    CONSTRAINT chk_pricing_rules_max_discount CHECK (max_discount_amount >= 0)
);

-- 4. Product Pricing Table
CREATE TABLE product_pricing (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    invoice_item_id UUID NOT NULL,
    customer_type customer_type NOT NULL,
    cost_price DECIMAL(10, 2) NOT NULL,
    selling_price DECIMAL(10, 2) NOT NULL,
    markup_percentage DECIMAL(5, 2) NOT NULL DEFAULT 0,
    profit_margin DECIMAL(10, 2) NOT NULL DEFAULT 0,
    status pricing_status NOT NULL DEFAULT 'draft',
    effective_from DATE NOT NULL DEFAULT CURRENT_DATE,
    effective_to DATE,
    approved_by UUID,
    approved_at TIMESTAMP WITH TIME ZONE,
    notes TEXT,
    created_by UUID,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    CONSTRAINT fk_product_pricing_invoice_item 
        FOREIGN KEY (invoice_item_id) REFERENCES warehouse_invoice_items(id) ON DELETE CASCADE,
    CONSTRAINT fk_product_pricing_approved_by 
        FOREIGN KEY (approved_by) REFERENCES auth.users(id) ON DELETE SET NULL,
    CONSTRAINT fk_product_pricing_created_by 
        FOREIGN KEY (created_by) REFERENCES auth.users(id) ON DELETE SET NULL,
    CONSTRAINT chk_product_pricing_cost_price CHECK (cost_price >= 0),
    CONSTRAINT chk_product_pricing_selling_price CHECK (selling_price >= 0),
    CONSTRAINT chk_product_pricing_markup CHECK (markup_percentage >= 0),
    CONSTRAINT chk_product_pricing_profit_margin CHECK (profit_margin >= 0),
    CONSTRAINT chk_product_pricing_effective_dates CHECK (effective_to IS NULL OR effective_to >= effective_from)
);

-- 5. Pricing History Table (for audit trail)
CREATE TABLE pricing_history (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    product_pricing_id UUID NOT NULL,
    old_cost_price DECIMAL(10, 2),
    old_selling_price DECIMAL(10, 2),
    new_cost_price DECIMAL(10, 2),
    new_selling_price DECIMAL(10, 2),
    change_reason TEXT,
    changed_by UUID NOT NULL,
    changed_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    CONSTRAINT fk_pricing_history_product_pricing 
        FOREIGN KEY (product_pricing_id) REFERENCES product_pricing(id) ON DELETE CASCADE,
    CONSTRAINT fk_pricing_history_changed_by 
        FOREIGN KEY (changed_by) REFERENCES auth.users(id) ON DELETE CASCADE
);

-- Create indexes for better performance
CREATE INDEX idx_warehouse_invoices_status ON warehouse_invoices(status);
CREATE INDEX idx_warehouse_invoices_date ON warehouse_invoices(invoice_date);
CREATE INDEX idx_warehouse_invoices_warehouse ON warehouse_invoices(warehouse_id);

CREATE INDEX idx_invoice_items_invoice ON warehouse_invoice_items(invoice_id);
CREATE INDEX idx_invoice_items_product ON warehouse_invoice_items(product_id);

CREATE INDEX idx_customer_pricing_rules_type ON customer_pricing_rules(customer_type);
CREATE INDEX idx_customer_pricing_rules_active ON customer_pricing_rules(is_active);

CREATE INDEX idx_product_pricing_invoice_item ON product_pricing(invoice_item_id);
CREATE INDEX idx_product_pricing_customer_type ON product_pricing(customer_type);
CREATE INDEX idx_product_pricing_status ON product_pricing(status);
CREATE INDEX idx_product_pricing_effective_dates ON product_pricing(effective_from, effective_to);

CREATE INDEX idx_pricing_history_product_pricing ON pricing_history(product_pricing_id);
CREATE INDEX idx_pricing_history_changed_at ON pricing_history(changed_at);

-- Create triggers for updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_warehouse_invoices_updated_at 
    BEFORE UPDATE ON warehouse_invoices 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_warehouse_invoice_items_updated_at 
    BEFORE UPDATE ON warehouse_invoice_items 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_customer_pricing_rules_updated_at 
    BEFORE UPDATE ON customer_pricing_rules 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_product_pricing_updated_at 
    BEFORE UPDATE ON product_pricing 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Insert default customer pricing rules
INSERT INTO customer_pricing_rules (customer_type, name_ar, name_en, markup_percentage, priority) VALUES
('retail', 'عملاء التجزئة', 'Retail Customers', 30.00, 1),
('agent', 'الوكلاء المعتمدون', 'Approved Agents', 20.00, 2),
('wholesale', 'تجار الجملة', 'Wholesale Traders', 15.00, 3),
('other', 'عملاء آخرون', 'Other Customers', 25.00, 4);

-- Add comments
COMMENT ON TABLE warehouse_invoices IS 'فواتير المخازن الواردة من الموردين';
COMMENT ON TABLE warehouse_invoice_items IS 'عناصر فواتير المخازن';
COMMENT ON TABLE customer_pricing_rules IS 'قواعد التسعير لأنواع العملاء المختلفة';
COMMENT ON TABLE product_pricing IS 'أسعار المنتجات للعملاء المختلفين';
COMMENT ON TABLE pricing_history IS 'تاريخ تغييرات الأسعار للمراجعة';
