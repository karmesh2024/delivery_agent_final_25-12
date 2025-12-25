import { createClient } from '@supabase/supabase-js';
import { SupabaseClient } from '@supabase/supabase-js';

// Define a placeholder type for item data
interface ItemData {
  [key: string]: string | number | boolean | null;
}

const supabaseUrl: string = process.env.SUPABASE_URL || '';
const supabaseKey: string = process.env.SUPABASE_KEY || '';
export const supabase: SupabaseClient = createClient(supabaseUrl, supabaseKey);

// CRUD operations
export const getItems = async () => {
    const { data, error } = await supabase.from('items').select('*');
    if (error) throw error;
    return data;
};

export const addItem = async (item: ItemData) => {
    const { data, error } = await supabase.from('items').insert([item]);
    if (error) throw error;
    return data;
};

export const updateItem = async (id: string, updates: ItemData) => {
    const { data, error } = await supabase.from('items').update(updates).eq('id', id);
    if (error) throw error;
    return data;
};

export const deleteItem = async (id: string) => {
    const { data, error } = await supabase.from('items').delete().eq('id', id);
    if (error) throw error;
    return data;
};