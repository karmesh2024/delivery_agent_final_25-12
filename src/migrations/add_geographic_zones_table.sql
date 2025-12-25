-- إنشاء جدول للمناطق الجغرافية العامة
CREATE TABLE IF NOT EXISTS geographic_zones (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(100) NOT NULL,
  area_polygon GEOMETRY(POLYGON),
  center_point GEOMETRY(POINT),
  description TEXT,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- إنشاء فهرس للبحث الجغرافي
CREATE INDEX IF NOT EXISTS idx_geographic_zones_area ON geographic_zones USING GIST (area_polygon);

-- إضافة علاقة بين المندوبين والمناطق الجغرافية
ALTER TABLE delivery_zones 
ADD COLUMN IF NOT EXISTS geographic_zone_id UUID REFERENCES geographic_zones(id);

-- إضافة فهرس للبحث السريع بالمعرف
CREATE INDEX IF NOT EXISTS idx_delivery_zones_geographic_zone_id ON delivery_zones(geographic_zone_id); 