import { Prisma } from '@prisma/client';

// Define a common base structure for product data for form state, matching page.tsx
export type MeasurementUnit = 'piece' | 'dozen' | 'kg' | 'liter' | 'pack' | 'box' | 'set' | 'other';

export type CommonProductFormData = {
  id?: string; // Explicitly optional for form data
  shop_id: string;
  main_category_id: string | null;
  subcategory_id: string | null;
  brand_id: string | null;
  name_ar: string;
  name_en: string | null;
  description_ar: string | null;
  description_en: string | null;
  short_description_ar: string | null;
  short_description_en: string | null;
  sku: string;
  barcode: string | null;
  cost_price: Prisma.Decimal | null;
  stock_quantity: number | null;
  min_stock_level: number | null;
  weight: Prisma.Decimal | null;
  dimensions: Prisma.JsonObject | null;
  measurement_unit: MeasurementUnit;
  loyalty_points_earned: number | null;
  gift_description_ar: string | null;
  gift_description_en: string | null;
  is_active: boolean;
  is_featured: boolean;
  meta_title_ar: string | null;
  meta_title_en: string | null;
  meta_description_ar: string | null;
  meta_description_en: string | null;
  tags: string[] | null;
  product_type_id: string | null;
  dynamic_attributes: Prisma.JsonObject | null;
  default_selling_price?: Prisma.Decimal | null;
  default_profit_margin?: Prisma.Decimal | null;
  auto_calculate_prices?: boolean;
  catalog_product_id?: string | null; // ربط المنتج بكتالوج المخازن
  prices: ProductPriceFormData[];
  images: ImageUploadData[];
};

export interface Product {
  id: string;
  shop_id: string;
  main_category_id: string | null;
  subcategory_id: string | null;
  brand_id: string | null;
  name_ar: string;
  name_en: string | null;
  description_ar: string | null;
  description_en: string | null;
  short_description_ar: string | null;
  short_description_en: string | null;
  sku: string;
  barcode: string | null;
  cost_price: Prisma.Decimal | null;
  stock_quantity: number | null;
  min_stock_level: number | null;
  weight: Prisma.Decimal | null;
  dimensions: Prisma.JsonObject | null;
  measurement_unit: MeasurementUnit;
  loyalty_points_earned: number | null;
  gift_description_ar: string | null;
  gift_description_en: string | null;
  is_active: boolean;
  is_featured: boolean;
  meta_title_ar: string | null;
  meta_title_en: string | null;
  meta_description_ar: string | null;
  meta_description_en: string | null;
  tags: string[] | null;
  average_rating: Prisma.Decimal | null;
  ratings_count: number | null;
  created_at: Date;
  updated_at: Date;
  product_type_id: string | null;
  dynamic_attributes: Prisma.JsonObject | null;
  default_selling_price?: Prisma.Decimal | null;
  default_profit_margin?: Prisma.Decimal | null;
  auto_calculate_prices?: boolean;
  catalog_product_id?: string | null; // ربط المنتج بكتالوج المخازن
  store_product_images?: {
    image_url: string;
    alt_text_ar?: string | null;
    alt_text_en?: string | null;
    is_primary?: boolean | null;
    media_type?: string | null;
  }[];
  store_product_prices?: {
    price: Prisma.Decimal;
    price_name_ar: string;
    price_name_en: string | null;
    is_on_sale: boolean | null;
    sale_price: Prisma.Decimal | null;
    price_type?: string | null;
  }[];
}

export interface ProductType {
  id: string;
  name_ar: string;
  name_en: string | null;
  store_id: string;
  is_active: boolean;
  schema_template: Prisma.JsonObject | null;
}

export interface ImageUploadData {
  id?: string;
  file?: File; // For new uploads
  url: string;
  image_url?: string;
  alt_text_ar: string;
  alt_text_en: string | null;
  is_primary: boolean;
  type: 'image' | 'video';
}

export interface ProductPriceData {
  id?: string;
  product_id: string;
  price: Prisma.Decimal;
  price_name_ar: string;
  price_name_en: string | null;
  target_audience_id: string | null;
  is_on_sale: boolean | null;
  sale_price: Prisma.Decimal | null;
  price_type?: 'cost' | 'selling' | 'wholesale' | 'retail' | 'special';
  profit_margin?: Prisma.Decimal | null;
  min_price?: Prisma.Decimal | null;
  max_discount_percentage?: Prisma.Decimal | null;
  is_negotiable?: boolean;
  effective_from?: Date;
  effective_to?: Date | null;
  created_at?: Date;
  updated_at?: Date;
}

export interface ProductPriceFormData extends Omit<ProductPriceData, 'product_id'> {
  product_id?: string;
}

export interface TargetAudience {
  id: string;
  shop_id: string;
  name_ar: string;
  name_en: string | null;
  description_ar: string | null;
  description_en: string | null;
  discount_percentage: Prisma.Decimal | null;
  markup_percentage: Prisma.Decimal | null;
  min_order_amount: Prisma.Decimal | null;
  max_discount_amount: Prisma.Decimal | null;
  is_active: boolean;
  priority: number;
  audience_type: string;
  payment_terms_days: number;
  created_at: Date;
  updated_at: Date;
  store_target_audience_geographic_zones?: {
    geographic_zone_id: string;
    geographic_zones?: {
      id: string;
      name: string;
    };
  }[];
}

export interface TargetAudienceFormData extends Omit<TargetAudience, 'id' | 'created_at' | 'updated_at'> {
  id?: string;
  geographic_zone_ids: string[];
}

export interface MainCategory {
  id: string;
  shop_id: string;
  name_ar: string;
  name_en: string | null;
  sort_order: number;
  slug: string | null;
  is_active: boolean;
}

export interface SubCategory {
  id: string;
  main_category_id: string;
  name_ar: string;
  name_en: string | null;
  sort_order: number;
  slug: string | null;
  is_active: boolean;
  shop_id: string;
}

export interface Brand {
  id: string;
  shop_id: string;
  name_ar: string;
  name_en: string | null;
  logo_url: string | null;
  description_ar: string | null;
  description_en: string | null;
  website: string | null;
  is_active: boolean | null;
  created_at: Date | null;
  updated_at: Date | null;
} 