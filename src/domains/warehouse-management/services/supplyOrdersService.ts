import { supabase } from '@/lib/supabase';

export type InvoiceStatus = 'pending' | 'received' | 'priced' | 'approved' | 'rejected';

export interface SupplyOrderHeader {
  id?: string;
  invoice_number: string;
  warehouse_id: number;
  supplier_id?: number | null;
  invoice_date?: string | null;
  received_date?: string | null;
  total_amount?: number | null;
  status?: InvoiceStatus;
  notes?: string | null;
}

export interface SupplyOrderItem {
  id?: string;
  invoice_id: string;
  product_id?: string | null; // Optional: for store_products (UUID)
  catalog_product_id?: string | number | null; // Optional: for catalog_products (BigInt)
  quantity: number;
  unit_price: number;
  total_price?: number;
  measurement_unit?: string; // matches measurement_unit enum in DB (text for now via prisma enum)
}

const supplyOrdersService = {
  async list() {
    const { data, error } = await supabase!
      .from('warehouse_invoices')
      .select('id, invoice_number, warehouse_id, supplier_id, invoice_date, received_date, total_amount, status')
      .order('invoice_date', { ascending: false });
    if (error) throw error;
    return data as SupplyOrderHeader[];
  },

  async getItems(invoiceId: string) {
    const { data, error } = await supabase!
      .from('warehouse_invoice_items')
      .select('id, invoice_id, product_id, quantity, unit_price, total_price, measurement_unit')
      .eq('invoice_id', invoiceId);
    if (error) throw error;
    return data as SupplyOrderItem[];
  },

  async create(header: Omit<SupplyOrderHeader, 'id'>, items: Omit<SupplyOrderItem, 'id'>[]) {
    const { data: hData, error: hErr } = await supabase!
      .from('warehouse_invoices')
      .insert([{ ...header, total_amount: items.reduce((s, it) => s + it.quantity * it.unit_price, 0) }])
      .select()
      .single();
    if (hErr) throw hErr;
    const invoice_id = hData.id as string;

    const prepared = items.map((it) => {
      const item: any = {
        ...it,
        invoice_id,
        total_price: it.quantity * it.unit_price,
      };
      
      // تحويل catalog_product_id من string إلى number إذا كان موجودًا
      if (it.catalog_product_id !== null && it.catalog_product_id !== undefined) {
        const catalogId = typeof it.catalog_product_id === 'string' 
          ? parseInt(it.catalog_product_id, 10) 
          : it.catalog_product_id;
        if (!isNaN(catalogId as number)) {
          item.catalog_product_id = catalogId;
        } else {
          throw new Error(`قيمة catalog_product_id غير صحيحة: ${it.catalog_product_id}`);
        }
      }
      
      // إزالة catalog_product_id إذا كان null أو undefined
      if (item.catalog_product_id === null || item.catalog_product_id === undefined) {
        delete item.catalog_product_id;
      }
      
      // إزالة product_id إذا كان null
      if (item.product_id === null || item.product_id === undefined) {
        delete item.product_id;
      }
      
      return item;
    });
    
    const { error: iErr } = await supabase!
      .from('warehouse_invoice_items')
      .insert(prepared);
    if (iErr) throw iErr;
    return invoice_id;
  },

  async markReceived(invoiceId: string, receivedDate?: string) {
    const { error } = await supabase!
      .from('warehouse_invoices')
      .update({ status: 'received', received_date: receivedDate ?? new Date().toISOString() })
      .eq('id', invoiceId);
    if (error) throw error;
    return true;
  },
};

export default supplyOrdersService;

















