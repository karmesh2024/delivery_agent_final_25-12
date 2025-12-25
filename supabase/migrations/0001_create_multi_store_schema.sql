-- =================================================================
--          SCHEMA FOR ADVANCED MULTI-STORE E-COMMERCE
-- =================================================================
-- This schema is designed to support multiple independent stores,
-- each with its own categories, products, pricing, and audiences.
-- =================================================================

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- =================================================================
-- 1. CORE STORE SETUP
-- =================================================================

-- Function to automatically update 'updated_at' timestamps
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Table to manage the different stores (e.g., Cosmetics Store, Stationery Store)
CREATE TABLE store_shops (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name_ar TEXT NOT NULL,
  name_en TEXT,
  description_ar TEXT,
  description_en TEXT,
  logo_url TEXT,
  cover_image_url TEXT,
  slug TEXT UNIQUE NOT NULL,
  is_active BOOLEAN DEFAULT TRUE,
  sort_order INTEGER DEFAULT 0,
  settings JSONB,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
COMMENT ON TABLE store_shops IS 'Manages the individual stores within the platform.';

CREATE TRIGGER update_store_shops_updated_at BEFORE UPDATE ON store_shops FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- =================================================================
-- 2. CATEGORIES AND BRANDS (scoped to each store)
-- =================================================================

CREATE TABLE store_main_categories (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  shop_id UUID NOT NULL REFERENCES store_shops(id) ON DELETE CASCADE,
  name_ar TEXT NOT NULL,
  name_en TEXT,
  description_ar TEXT,
  description_en TEXT,
  image_url TEXT,
  slug TEXT NOT NULL,
  is_active BOOLEAN DEFAULT TRUE,
  sort_order INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(shop_id, slug)
);
COMMENT ON TABLE store_main_categories IS 'Main product categories, scoped to a specific store.';

CREATE TRIGGER update_store_main_categories_updated_at BEFORE UPDATE ON store_main_categories FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TABLE store_subcategories (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  main_category_id UUID NOT NULL REFERENCES store_main_categories(id) ON DELETE CASCADE,
  name_ar TEXT NOT NULL,
  name_en TEXT,
  description_ar TEXT,
  description_en TEXT,
  image_url TEXT,
  slug TEXT NOT NULL,
  is_active BOOLEAN DEFAULT TRUE,
  sort_order INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(main_category_id, slug)
);
COMMENT ON TABLE store_subcategories IS 'Sub-categories, belonging to a main category.';

CREATE TRIGGER update_store_subcategories_updated_at BEFORE UPDATE ON store_subcategories FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TABLE store_brands (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  shop_id UUID NOT NULL REFERENCES store_shops(id) ON DELETE CASCADE,
  name_ar TEXT NOT NULL,
  name_en TEXT,
  logo_url TEXT,
  description_ar TEXT,
  description_en TEXT,
  website TEXT,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(shop_id, name_ar)
);
COMMENT ON TABLE store_brands IS 'Product brands, scoped to a specific store.';

CREATE TRIGGER update_store_brands_updated_at BEFORE UPDATE ON store_brands FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- =================================================================
-- 3. PRODUCTS AND PRICING (highly flexible)
-- =================================================================

CREATE TABLE store_products (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  shop_id UUID NOT NULL REFERENCES store_shops(id) ON DELETE CASCADE,
  main_category_id UUID NOT NULL REFERENCES store_main_categories(id),
  subcategory_id UUID REFERENCES store_subcategories(id),
  brand_id UUID REFERENCES store_brands(id),
  name_ar TEXT NOT NULL,
  name_en TEXT,
  description_ar TEXT,
  description_en TEXT,
  short_description_ar TEXT,
  short_description_en TEXT,
  sku TEXT NOT NULL,
  barcode TEXT,
  cost_price DECIMAL(10, 2),
  stock_quantity INTEGER DEFAULT 0,
  min_stock_level INTEGER DEFAULT 5,
  weight DECIMAL(10, 2),
  dimensions JSONB,
  loyalty_points_earned INTEGER DEFAULT 0,
  gift_description_ar TEXT,
  gift_description_en TEXT,
  is_active BOOLEAN DEFAULT TRUE,
  is_featured BOOLEAN DEFAULT FALSE,
  meta_title_ar TEXT,
  meta_title_en TEXT,
  meta_description_ar TEXT,
  meta_description_en TEXT,
  tags TEXT[],
  average_rating DECIMAL(3, 2) DEFAULT 0,
  ratings_count INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(shop_id, sku)
);
COMMENT ON TABLE store_products IS 'Core product table with details, loyalty points, and gifts.';

CREATE TRIGGER update_store_products_updated_at BEFORE UPDATE ON store_products FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TABLE store_product_images (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  product_id UUID NOT NULL REFERENCES store_products(id) ON DELETE CASCADE,
  image_url TEXT NOT NULL,
  alt_text_ar TEXT,
  alt_text_en TEXT,
  is_primary BOOLEAN DEFAULT FALSE,
  sort_order INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
COMMENT ON TABLE store_product_images IS 'Holds multiple images for each product.';

-- Table for target audiences (e.g., Retail, Wholesale, Agents)
CREATE TABLE store_target_audiences (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  shop_id UUID NOT NULL REFERENCES store_shops(id) ON DELETE CASCADE,
  name_ar TEXT NOT NULL,
  name_en TEXT,
  description_ar TEXT,
  description_en TEXT,
  UNIQUE(shop_id, name_ar)
);
COMMENT ON TABLE store_target_audiences IS 'Defines customer segments for targeted pricing.';

-- Table for flexible, audience-specific pricing
CREATE TABLE store_product_prices (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  product_id UUID NOT NULL REFERENCES store_products(id) ON DELETE CASCADE,
  price DECIMAL(10, 2) NOT NULL,
  price_name_ar TEXT NOT NULL, -- e.g., 'سعر التجزئة', 'سعر الجملة'
  price_name_en TEXT, -- e.g., 'Retail Price', 'Wholesale Price'
  target_audience_id UUID REFERENCES store_target_audiences(id) ON DELETE SET NULL, -- If NULL, it's the default/public price
  is_on_sale BOOLEAN DEFAULT FALSE,
  sale_price DECIMAL(10, 2),
  UNIQUE(product_id, target_audience_id, price_name_ar)
);
COMMENT ON TABLE store_product_prices IS 'Manages multiple prices per product, optionally targeting specific audiences.';


-- =================================================================
-- 4. ORDERS AND FULFILLMENT
-- =================================================================

CREATE TYPE store_order_status AS ENUM ('pending', 'processing', 'shipped', 'delivered', 'cancelled', 'refunded', 'completed');
CREATE TYPE store_payment_method AS ENUM ('cash_on_delivery', 'credit_card', 'bank_transfer', 'wallet');
CREATE TYPE store_payment_status AS ENUM ('pending', 'completed', 'failed', 'refunded');

CREATE TABLE store_orders (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  order_number TEXT UNIQUE NOT NULL,
  customer_id UUID, -- Can be linked to a central users table
  shop_id UUID NOT NULL REFERENCES store_shops(id) ON DELETE CASCADE,
  status store_order_status DEFAULT 'pending',
  final_amount DECIMAL(10, 2) NOT NULL,
  payment_method store_payment_method,
  payment_status store_payment_status DEFAULT 'pending',
  shipping_address JSONB,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
COMMENT ON TABLE store_orders IS 'Main table for customer orders.';

CREATE TRIGGER update_store_orders_updated_at BEFORE UPDATE ON store_orders FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TABLE store_order_items (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  order_id UUID NOT NULL REFERENCES store_orders(id) ON DELETE CASCADE,
  product_id UUID NOT NULL REFERENCES store_products(id),
  quantity INTEGER NOT NULL DEFAULT 1,
  unit_price DECIMAL(10, 2) NOT NULL, -- The price at the time of purchase
  product_data JSONB, -- A snapshot of the product details at time of order
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
COMMENT ON TABLE store_order_items IS 'Individual items within a customer order.';

-- =================================================================
-- 5. REVIEWS
-- =================================================================

CREATE TABLE store_product_reviews (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  product_id UUID NOT NULL REFERENCES store_products(id) ON DELETE CASCADE,
  customer_id UUID,
  rating INTEGER NOT NULL CHECK (rating >= 1 AND rating <= 5),
  review TEXT,
  is_approved BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
COMMENT ON TABLE store_product_reviews IS 'Customer reviews for products.';

-- =================================================================
-- 6. INDEXES FOR PERFORMANCE
-- =================================================================

CREATE INDEX ON store_main_categories (shop_id);
CREATE INDEX ON store_subcategories (main_category_id);
CREATE INDEX ON store_brands (shop_id);
CREATE INDEX ON store_products (shop_id);
CREATE INDEX ON store_products (main_category_id);
CREATE INDEX ON store_products (subcategory_id);
CREATE INDEX ON store_product_images (product_id);
CREATE INDEX ON store_target_audiences (shop_id);
CREATE INDEX ON store_product_prices (product_id);
CREATE INDEX ON store_product_prices (target_audience_id);
CREATE INDEX ON store_orders (shop_id);
CREATE INDEX ON store_orders (customer_id);
CREATE INDEX ON store_order_items (order_id);
CREATE INDEX ON store_order_items (product_id);
CREATE INDEX ON store_product_reviews (product_id);

-- =================================================================
-- 7. INITIAL DATA (for demonstration)
-- =================================================================

INSERT INTO store_shops (name_ar, name_en, slug)
VALUES
('متجر المنظفات والكوزماتكس', 'Detergents & Cosmetics', 'detergents-cosmetics'),
('متجر الأدوات المكتبية', 'Stationery Store', 'stationery');

-- You can add more initial data for categories, products etc. here

-- =================================================================
--                            END OF SCHEMA
-- ================================================================= 