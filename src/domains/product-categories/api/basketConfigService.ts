import { PostgrestResponse, QueryData, PostgrestSingleResponse } from '@supabase/supabase-js';
import { supabase } from '@/lib/supabase';

// Define the enum types as TypeScript union types
export type basket_supplier_type = 'AUTHORIZED_AGENT' | 'HOME_CLIENT' | 'SCHOOL' | 'RESTAURANT' | 'OFFICE' | 'OTHER';
export type basket_size = 'SMALL' | 'MEDIUM' | 'LARGE' | 'EXTRA_LARGE';

// Define the types based on your SQL schema
export interface CategoryBucketConfig {
  id: string;
  created_at: string;
  updated_at: string;
  category_id: string;
  supplier_type: basket_supplier_type;
  basket_size: basket_size;
  basket_empty_weight_kg: number;
  max_net_weight_kg: number;
  max_volume_liters: number | null;
  min_fill_percentage: number;
  description: string | null;
  is_active: boolean;
  allocated_net_weight_kg: number;
  allocated_volume_liters: number | null;
}

export interface SubCategoryBucketConfig {
  id: string;
  created_at: string;
  updated_at: string;
  subcategory_id: string;
  supplier_type: basket_supplier_type;
  basket_size: basket_size;
  basket_empty_weight_kg: number;
  max_net_weight_kg: number;
  max_volume_liters: number | null;
  min_fill_percentage: number;
  max_items_count: number | null;
  requires_separation: boolean;
  special_handling_notes: string | null;
  is_active: boolean;
}

// New interfaces for details
export interface CategoryDetails {
  id: string;
  name: string;
  description: string;
}

export interface SubcategoryDetails {
  id: string;
  name: string;
  description: string;
  categories: CategoryDetails;
}

export interface CategoryBucketConfigWithDetails extends CategoryBucketConfig {
  categories: CategoryDetails;
}

export interface SubCategoryBucketConfigWithDetails extends SubCategoryBucketConfig {
  subcategories: SubcategoryDetails;
}

// Helper to get subcategory details (needed for category_id)
export async function getSubcategoryById(subcategoryId: string): Promise<{ id: string; category_id: string } | null> {
  if (!supabase) throw new Error('Supabase client not initialized');

  const { data, error } = await supabase
    .from('subcategories')
    .select('id, category_id')
    .eq('id', subcategoryId)
    .single();

  if (error && error.code !== 'PGRST116') throw error; // PGRST116 is no rows
  return data;
}

export async function getCategoryBucketConfigs(): Promise<CategoryBucketConfig[]> {
  if (!supabase) throw new Error('Supabase client not initialized');
  
  const { data, error } = await supabase
    .from('category_bucket_config')
    .select('*');
    
  if (error) throw error;
  return (data || []) as CategoryBucketConfig[];
}

export async function addCategoryBucketConfig(
  config: Omit<CategoryBucketConfig, 'id' | 'created_at' | 'updated_at'>
): Promise<CategoryBucketConfig> {
  if (!supabase) throw new Error('Supabase client not initialized');
  
  const { data, error }: PostgrestSingleResponse<CategoryBucketConfig> = await supabase
    .from('category_bucket_config')
    .insert(config)
    .select()
    .single();
    
  if (error) throw error;
  if (!data) throw new Error('No data returned from insert operation');
  return data;
}

export async function updateCategoryBucketConfig(
  id: string, 
  config: Partial<Omit<CategoryBucketConfig, 'id' | 'created_at' | 'updated_at'>>
): Promise<CategoryBucketConfig> {
  if (!supabase) throw new Error('Supabase client not initialized');
  
  const { data, error }: PostgrestSingleResponse<CategoryBucketConfig> = await supabase
    .from('category_bucket_config')
    .update(config)
    .eq('id', id)
    .select()
    .single();
    
  if (error) throw error;
  if (!data) throw new Error('No data returned from update operation');
  return data;
}

export async function getSubCategoryBucketConfigs(subcategoryId?: string): Promise<SubCategoryBucketConfig[]> {
  if (!supabase) throw new Error('Supabase client not initialized');

  let query = supabase.from('subcategory_bucket_config').select('*');

  if (subcategoryId) {
    query = query.eq('subcategory_id', subcategoryId);
  }
  
  const { data, error } = await query;
  
  if (error) throw error;
  return (data || []) as SubCategoryBucketConfig[];
}

export async function getExistingSubCategoryBucketConfig(
  subcategory_id: string,
  supplier_type: basket_supplier_type,
  basket_size: basket_size
): Promise<SubCategoryBucketConfig | null> {
  if (!supabase) throw new Error('Supabase client not initialized');

  console.log('Backend: getExistingSubCategoryBucketConfig - Attempting to fetch with:', { subcategory_id, supplier_type, basket_size });

  const { data, error }: PostgrestSingleResponse<SubCategoryBucketConfig | null> = await supabase
    .from('subcategory_bucket_config')
    .select('*')
    .eq('subcategory_id', subcategory_id)
    .eq('supplier_type', supplier_type)
    .eq('basket_size', basket_size)
    .maybeSingle();

  if (error) {
    console.error('Backend: getExistingSubCategoryBucketConfig - Error fetching:', error);
    if (error.code === 'PGRST116') {
      console.log('Backend: getExistingSubCategoryBucketConfig - No rows found (PGRST116), returning null.');
      return null; // No rows found, return null as expected
    }
    throw error; // Other errors still throw
  }
  if (!data) return null;
  console.log('Backend: getExistingSubCategoryBucketConfig - Successfully fetched:', data);
  return data;
}

export async function addSubCategoryBucketConfig(
  config: Omit<SubCategoryBucketConfig, 'id' | 'created_at' | 'updated_at'>
): Promise<SubCategoryBucketConfig> {
  if (!supabase) throw new Error('Supabase client not initialized');

  // 1. Get the category_id from the subcategory
  const subcategory = await getSubcategoryById(config.subcategory_id);
  if (!subcategory) {
    throw new Error('Subcategory not found.');
  }

  // 2. Fetch the corresponding CategoryBucketConfig
  const { data: categoryConfig, error: categoryConfigError } = await supabase
    .from('category_bucket_config')
    .select('*')
    .eq('category_id', subcategory.category_id)
    .eq('supplier_type', config.supplier_type)
    .eq('basket_size', config.basket_size)
    .single();

  if (categoryConfigError && categoryConfigError.code !== 'PGRST116') {
    throw categoryConfigError;
  }

  if (!categoryConfig) {
    throw new Error('No matching main category basket configuration found for this subcategory, supplier type, and basket size.');
  }

  // 3. Validate against main category limits
  // The validation should check against the original max limits minus already allocated amounts
  const currentAvailableNetWeight = categoryConfig.max_net_weight_kg - (categoryConfig.allocated_net_weight_kg || 0);
  const currentAvailableVolume = (categoryConfig.max_volume_liters !== null && categoryConfig.allocated_volume_liters !== null)
    ? categoryConfig.max_volume_liters - categoryConfig.allocated_volume_liters
    : categoryConfig.max_volume_liters; // If one is null, keep it as is

  if (config.max_net_weight_kg > currentAvailableNetWeight) {
    throw new Error(`Maximum net weight (${config.max_net_weight_kg} kg) exceeds available main category limit (${currentAvailableNetWeight} kg).`);
  }
  if (config.max_volume_liters !== null && currentAvailableVolume !== null && config.max_volume_liters > currentAvailableVolume) {
    throw new Error(`Maximum volume (${config.max_volume_liters} liters) exceeds available main category limit (${currentAvailableVolume} liters).`);
  }

  const { data, error }: PostgrestSingleResponse<SubCategoryBucketConfig> = await supabase
    .from('subcategory_bucket_config')
    .insert(config)
    .select()
    .single();

  if (error) throw error;
  if (!data) throw new Error('No data returned from insert operation');

  // 4. Update the main category bucket config (increment allocated capacity)
  const updatedMainCategoryConfig: Partial<CategoryBucketConfig> = {
    allocated_net_weight_kg: (categoryConfig.allocated_net_weight_kg || 0) + (config.max_net_weight_kg || 0),
    allocated_volume_liters: (categoryConfig.allocated_volume_liters !== null && config.max_volume_liters !== null)
      ? categoryConfig.allocated_volume_liters + config.max_volume_liters
      : categoryConfig.allocated_volume_liters, 
  };

  console.log("Backend: addSubCategoryBucketConfig - Updating main category config with:", updatedMainCategoryConfig);

  const { error: updateError } = await supabase
    .from('category_bucket_config')
    .update(updatedMainCategoryConfig)
    .eq('id', categoryConfig.id);

  if (updateError) {
    console.error("Backend: addSubCategoryBucketConfig - Failed to update main category bucket config:", updateError);
  }
  console.log("Backend: addSubCategoryBucketConfig - Main category config update result (error if any):", updateError);

  return data;
}

export async function updateSubCategoryBucketConfig(
  id: string,
  config: Partial<Omit<SubCategoryBucketConfig, 'id' | 'created_at' | 'updated_at'>>
): Promise<SubCategoryBucketConfig> {
  if (!supabase) throw new Error('Supabase client not initialized');

  // First, retrieve the existing subcategory bucket config to get its subcategory_id and current values
  const { data: existingConfig, error: existingConfigError } = await supabase
    .from('subcategory_bucket_config')
    .select('*')
    .eq('id', id)
    .single();

  if (existingConfigError) throw existingConfigError;
  if (!existingConfig) throw new Error('SubCategoryBucketConfig not found.');

  // Use the subcategory_id from the existing config or the one being updated
  const subcategoryIdToUse = config.subcategory_id || existingConfig.subcategory_id;

  // Get the category_id from the subcategory
  const subcategory = await getSubcategoryById(subcategoryIdToUse);
  if (!subcategory) {
    throw new Error('Subcategory not found for validation.');
  }

  // Calculate the change in net weight and volume
  const oldNetWeightKg = existingConfig.max_net_weight_kg || 0;
  const newNetWeightKg = config.max_net_weight_kg || 0;
  const netWeightDiff = newNetWeightKg - oldNetWeightKg;

  const oldVolumeLiters = existingConfig.max_volume_liters || 0;
  const newVolumeLiters = config.max_volume_liters || 0;
  const volumeDiff = newVolumeLiters - oldVolumeLiters;

  // Fetch the corresponding CategoryBucketConfig (main category)
  const { data: categoryConfig, error: categoryConfigError } = await supabase
    .from('category_bucket_config')
    .select('*')
    .eq('category_id', subcategory.category_id)
    .eq('supplier_type', config.supplier_type || existingConfig.supplier_type) // Use existing if not provided
    .eq('basket_size', config.basket_size || existingConfig.basket_size) // Use existing if not provided
    .single();

  if (categoryConfigError && categoryConfigError.code !== 'PGRST116') {
    throw categoryConfigError;
  }

  if (!categoryConfig) {
    throw new Error('No matching main category basket configuration found for this subcategory, supplier type, and basket size for update validation.');
  }

  // Validate against main category limits considering existing allocated amounts and the new difference
  const currentAllocatedNetWeight = categoryConfig.allocated_net_weight_kg || 0;
  const currentAllocatedVolume = categoryConfig.allocated_volume_liters || 0;

  const potentialNewAllocatedNetWeight = currentAllocatedNetWeight + netWeightDiff;
  const potentialNewAllocatedVolume = currentAllocatedVolume + volumeDiff;

  if (potentialNewAllocatedNetWeight > categoryConfig.max_net_weight_kg) {
    throw new Error(`Total allocated net weight (${potentialNewAllocatedNetWeight} kg) exceeds main category limit (${categoryConfig.max_net_weight_kg} kg).`);
  }
  if (potentialNewAllocatedVolume !== null && categoryConfig.max_volume_liters !== null && potentialNewAllocatedVolume > categoryConfig.max_volume_liters) {
    throw new Error(`Total allocated volume (${potentialNewAllocatedVolume} liters) exceeds main category limit (${categoryConfig.max_volume_liters} liters).`);
  }

  const { data, error }: PostgrestSingleResponse<SubCategoryBucketConfig> = await supabase
    .from('subcategory_bucket_config')
    .update(config)
    .eq('id', id)
    .select()
    .single();

  if (error) throw error;
  if (!data) throw new Error('No data returned from update operation');

  // Update the main category bucket config (adjust allocated capacity by the difference)
  const updatedMainCategoryConfig: Partial<CategoryBucketConfig> = {
    allocated_net_weight_kg: potentialNewAllocatedNetWeight,
    allocated_volume_liters: (categoryConfig.max_volume_liters !== null && potentialNewAllocatedVolume !== null)
      ? potentialNewAllocatedVolume
      : categoryConfig.allocated_volume_liters, 
  };

  console.log("Backend: updateSubCategoryBucketConfig - Updating main category config with:", updatedMainCategoryConfig);

  const { error: updateError } = await supabase
    .from('category_bucket_config')
    .update(updatedMainCategoryConfig)
    .eq('id', categoryConfig.id);

  if (updateError) {
    console.error("Backend: updateSubCategoryBucketConfig - Failed to update main category bucket config:", updateError);
  }
  console.log("Backend: updateSubCategoryBucketConfig - Main category config update result (error if any):", updateError);

  return data;
}

// Additional utility functions for better error handling and validation

export async function deleteCategoryBucketConfig(id: string): Promise<void> {
  if (!supabase) throw new Error('Supabase client not initialized');
  
  const { error } = await supabase
    .from('category_bucket_config')
    .delete()
    .eq('id', id);
    
  if (error) throw error;
}

export async function deleteSubCategoryBucketConfig(id: string): Promise<void> {
  if (!supabase) throw new Error('Supabase client not initialized');
  
  const { error } = await supabase
    .from('subcategory_bucket_config')
    .delete()
    .eq('id', id);
    
  if (error) throw error;
}

// Get configurations with related category/subcategory information
export async function getCategoryBucketConfigsWithDetails(): Promise<CategoryBucketConfigWithDetails[]> {
  if (!supabase) throw new Error('Supabase client not initialized');
  
  const query = supabase
    .from('category_bucket_config')
    .select(`
      *,
      categories (
        id,
        name,
        description
      )
    `);
  
  type QueryResultType = QueryData<typeof query>;
  const { data, error } = await query;
    
  if (error) throw error;
  return (data || []) as unknown as CategoryBucketConfigWithDetails[];
}

export async function getSubCategoryBucketConfigsWithDetails(subcategoryId?: string): Promise<SubCategoryBucketConfigWithDetails[]> {
  if (!supabase) throw new Error('Supabase client not initialized');
  
  const baseQuery = supabase
    .from('subcategory_bucket_config')
    .select(`
      *,
      subcategories (
        id,
        name,
        description,
        categories (
          id,
          name,
          description
        )
      )
    `);

  let finalQuery = baseQuery;
  if (subcategoryId) {
    finalQuery = baseQuery.eq('subcategory_id', subcategoryId);
  }
  
  type QueryResultType = QueryData<typeof finalQuery>;
  const { data, error } = await finalQuery;
  
  if (error) throw error;
  return (data || []) as unknown as SubCategoryBucketConfigWithDetails[];
}

export async function getDistinctSupplierTypes(): Promise<basket_supplier_type[]> {
  if (!supabase) throw new Error('Supabase client not initialized');
  const { data, error } = await supabase
    .from('category_bucket_config')
    .select('supplier_type')
    .order('supplier_type', { ascending: true });

  if (error) throw error;
  console.log("Fetched distinct supplier types:", data);
  return Array.from(new Set(data.map(item => item.supplier_type))) as basket_supplier_type[];
}

export async function getDistinctBasketSizes(): Promise<basket_size[]> {
  if (!supabase) throw new Error('Supabase client not initialized');
  const { data, error } = await supabase
    .from('category_bucket_config')
    .select('basket_size')
    .order('basket_size', { ascending: true });

  if (error) throw error;
  console.log("Fetched distinct basket sizes:", data);
  return Array.from(new Set(data.map(item => item.basket_size))) as basket_size[];
}

export async function getCategoryNameById(categoryId: string): Promise<string | null> {
  if (!supabase) throw new Error('Supabase client not initialized');
  const { data, error } = await supabase
    .from('categories')
    .select('name')
    .eq('id', categoryId)
    .single();

  if (error && error.code !== 'PGRST116') throw error; // PGRST116 is no rows
  return data ? data.name : null;
} 