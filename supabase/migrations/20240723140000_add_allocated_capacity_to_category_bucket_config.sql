ALTER TABLE public.category_bucket_config
ADD COLUMN allocated_net_weight_kg double precision NOT NULL DEFAULT 0;
 
ALTER TABLE public.category_bucket_config
ADD COLUMN allocated_volume_liters double precision NULL DEFAULT 0; 