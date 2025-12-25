import { supabase } from '@/lib/supabase';

export interface Product {
  id: string;
  category_id: string | null;
  subcategory_id: string | null;
  name: string;
  description: string | null;
  image_url: string | null;
  weight: number;
  price: number;
  quantity: number;
  points: number;
  initial_points: number;
  created_at?: string;
  updated_at?: string;
}

export const productService = {
  async getProducts() {
    const { data, error } = await supabase
      .from('waste_data_admin')
      .select('*');
    
    if (error) {
      console.error('Error fetching products:', error);
      throw error;
    }
    
    return data || [];
  },

  async getProductsBySubcategory(subcategoryId: string) {
    const { data, error } = await supabase
      .from('waste_data_admin')
      .select('*')
      .eq('subcategory_id', subcategoryId);
    
    if (error) {
      console.error(`Error fetching products for subcategory ${subcategoryId}:`, error);
      throw error;
    }
    
    return data || [];
  },

  async getProductById(productId: string) {
    const { data, error } = await supabase
      .from('waste_data_admin')
      .select('*')
      .eq('id', productId)
      .single();
    
    if (error) {
      console.error(`Error fetching product ${productId}:`, error);
      throw error;
    }
    
    return data;
  },

  async createProduct(product: Omit<Product, 'id' | 'created_at' | 'updated_at'>) {
    const { data, error } = await supabase
      .from('waste_data_admin')
      .insert(product)
      .select('*')
      .single();
    
    if (error) {
      console.error('Error creating product:', error);
      throw error;
    }
    
    return data;
  },

  async updateProduct(productId: string, product: Partial<Omit<Product, 'id' | 'created_at' | 'updated_at'>>) {
    const { data, error } = await supabase
      .from('waste_data_admin')
      .update(product)
      .eq('id', productId)
      .select('*')
      .single();
    
    if (error) {
      console.error(`Error updating product ${productId}:`, error);
      throw error;
    }
    
    return data;
  },

  async deleteProduct(productId: string) {
    const { error } = await supabase
      .from('waste_data_admin')
      .delete()
      .eq('id', productId);
    
    if (error) {
      console.error(`Error deleting product ${productId}:`, error);
      throw error;
    }
    
    return true;
  },

  async uploadProductImage(file: File) {
    const fileExt = file.name.split('.').pop();
    const fileName = `${Math.random().toString(36).substring(2, 15)}.${fileExt}`;
    const filePath = `products/${fileName}`;
    
    const { error: uploadError } = await supabase.storage
      .from('categories_pic')
      .upload(filePath, file);
    
    if (uploadError) {
      console.error('Error uploading product image:', uploadError);
      throw uploadError;
    }
    
    const { data: urlData } = supabase.storage
      .from('categories_pic')
      .getPublicUrl(filePath);
    
    return urlData.publicUrl;
  },
}; 