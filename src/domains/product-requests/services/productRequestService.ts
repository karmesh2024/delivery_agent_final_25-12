import { supabase } from "@/lib/supabase";
import type {
  ProductRequest,
  ProductRequestCreate,
  ProductRequestUpdate,
} from "../types";

const TABLE = "product_addition_requests";

export const productRequestService = {
  async getList(params?: {
    status?: string;
    department?: string;
    main_category_id?: number;
    sub_category_id?: number;
  }): Promise<ProductRequest[]> {
    if (!supabase) return [];
    let q = supabase
      .from(TABLE)
      .select(
        `
        *,
        waste_main_categories(id, name),
        waste_sub_categories(id, name)
      `
      )
      .order("created_at", { ascending: false });
    if (params?.status) q = q.eq("status", params.status);
    if (params?.department) q = q.eq("requested_by_department", params.department);
    if (params?.main_category_id != null)
      q = q.eq("main_category_id", params.main_category_id);
    if (params?.sub_category_id != null)
      q = q.eq("sub_category_id", params.sub_category_id);
    const { data, error } = await q;
    if (error) {
      console.error("productRequestService.getList", error);
      return [];
    }
    return (data || []) as ProductRequest[];
  },

  async getById(id: string): Promise<ProductRequest | null> {
    if (!supabase) return null;
    const { data, error } = await supabase
      .from(TABLE)
      .select(
        `
        *,
        waste_main_categories(id, name),
        waste_sub_categories(id, name)
      `
      )
      .eq("id", id)
      .single();
    if (error) {
      console.error("productRequestService.getById", error);
      return null;
    }
    return data as ProductRequest;
  },

  async create(
    payload: ProductRequestCreate,
    userId: string
  ): Promise<ProductRequest | null> {
    if (!supabase) return null;
    const row = {
      ...payload,
      requested_by_user_id: userId,
      request_number: payload.request_number ?? undefined,
    };
    const { data, error } = await supabase
      .from(TABLE)
      .insert([row])
      .select()
      .single();
    if (error) {
      console.error("productRequestService.create", error);
      throw new Error(error.message);
    }
    return data as ProductRequest;
  },

  async update(
    id: string,
    payload: ProductRequestUpdate
  ): Promise<ProductRequest | null> {
    if (!supabase) return null;
    const { data, error } = await supabase
      .from(TABLE)
      .update(payload)
      .eq("id", id)
      .select()
      .single();
    if (error) {
      console.error("productRequestService.update", error);
      throw new Error(error.message);
    }
    return data as ProductRequest;
  },

  async approve(
    id: string,
    userId: string,
    notes?: string
  ): Promise<ProductRequest | null> {
    return this.update(id, {
      status: "approved",
      reviewed_by_user_id: userId,
      review_notes: notes ?? null,
      reviewed_at: new Date().toISOString(),
      approved_at: new Date().toISOString(),
    });
  },

  async reject(
    id: string,
    userId: string,
    reason: string,
    notes?: string
  ): Promise<ProductRequest | null> {
    return this.update(id, {
      status: "rejected",
      reviewed_by_user_id: userId,
      rejection_reason: reason,
      review_notes: notes ?? null,
      reviewed_at: new Date().toISOString(),
    });
  },

  async requestRevision(
    id: string,
    userId: string,
    notes: string
  ): Promise<ProductRequest | null> {
    return this.update(id, {
      status: "needs_revision",
      reviewed_by_user_id: userId,
      review_notes: notes,
      reviewed_at: new Date().toISOString(),
    });
  },
};
