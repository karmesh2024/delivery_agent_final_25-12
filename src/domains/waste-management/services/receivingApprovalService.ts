import { supabase } from '@/lib/supabase';
import { toast } from 'sonner';

/**
 * حالة استلام المخلفات
 */
export type ReceivingStatus = 'pending_verification' | 'verified' | 'approved' | 'rejected';

/**
 * مصدر الاستلام
 */
export type ReceivingSource = 'delivery_boy' | 'supplier' | 'agent' | 'direct';

/**
 * طلب موافقة على استلام المخلفات
 */
export interface ReceivingApprovalRequest {
  id?: string;
  source: ReceivingSource; // مصدر الاستلام: delivery_boy, supplier, agent, direct
  collection_session_id?: string; // من waste_collection_sessions (إذا كان source = delivery_boy)
  supplier_invoice_id?: string; // من warehouse_invoices (إذا كان source = supplier) - UUID
  delivery_agent_id?: string; // من delivery_boys (إذا كان source = delivery_boy)
  supplier_id?: number; // من suppliers (إذا كان source = supplier)
  agent_id?: string; // من agents (إذا كان source = agent)
  warehouse_id: number; // المخزن المستلم
  waste_items: Array<{
    waste_material_id: string;
    quantity: number;
    unit: string;
    quality_grade?: string;
    notes?: string;
  }>;
  total_weight?: number;
  total_value?: number;
  verification_notes?: string;
  verified_by?: string;
  verified_at?: string;
  approved_by?: string;
  approval_notes?: string;
  status: ReceivingStatus;
  created_at?: string;
  approved_at?: string;
  rejected_at?: string;
  rejection_reason?: string;
}

/**
 * خدمة الموافقة على استلام المخلفات
 */
export const receivingApprovalService = {
  /**
   * إنشاء طلب موافقة على الاستلام
   * يدعم مصادر متعددة: delivery_boy, supplier, agent, direct
   */
  async createReceivingRequest(
    request: Omit<ReceivingApprovalRequest, 'id' | 'status' | 'created_at'>
  ): Promise<ReceivingApprovalRequest | null> {
    try {
      console.log('createReceivingRequest called with:', request);
      
      if (!supabase) {
        console.error('Supabase is not available');
        toast.error('خدمة Supabase غير متاحة');
        return null;
      }

      const receivingRequest: any = {
        source: request.source,
        warehouse_id: request.warehouse_id,
        waste_items: request.waste_items,
        status: 'pending_verification',
      };

      // إضافة الحقول المشروطة حسب المصدر
      if (request.source === 'delivery_boy') {
        if (request.delivery_agent_id) receivingRequest.delivery_agent_id = request.delivery_agent_id;
        if (request.collection_session_id) receivingRequest.collection_session_id = request.collection_session_id;
      } else if (request.source === 'supplier') {
        if (request.supplier_id) receivingRequest.supplier_id = request.supplier_id;
        if (request.supplier_invoice_id) receivingRequest.supplier_invoice_id = request.supplier_invoice_id;
      } else if (request.source === 'agent') {
        if (request.agent_id) receivingRequest.agent_id = request.agent_id;
      }

      // إضافة الحقول الاختيارية
      if (request.total_weight !== undefined) receivingRequest.total_weight = request.total_weight;
      if (request.total_value !== undefined) receivingRequest.total_value = request.total_value;

      console.log('Inserting request:', receivingRequest);

      const { data, error } = await supabase!
        .from('waste_receiving_approval_requests')
        .insert([receivingRequest])
        .select()
        .single();

      if (error) {
        console.error('خطأ في إنشاء طلب الاستلام:', error);
        toast.error(`فشل في إنشاء طلب الاستلام: ${error.message}`);
        return null;
      }

      console.log('Request created successfully:', data);
      toast.success('تم إنشاء طلب الاستلام بنجاح');
      return data as ReceivingApprovalRequest;
    } catch (error: any) {
      console.error('خطأ في إنشاء طلب الاستلام:', error);
      toast.error(`حدث خطأ أثناء إنشاء طلب الاستلام: ${error?.message || 'خطأ غير معروف'}`);
      return null;
    }
  },

  /**
   * التحقق من جودة المخلفات المستلمة
   */
  async verifyReceiving(
    requestId: string,
    verifierId: string,
    verificationData: {
      waste_items: Array<{
        waste_material_id: string;
        quality_grade: string;
        verified_quantity: number;
        notes?: string;
      }>;
      verification_notes?: string;
    }
  ): Promise<boolean> {
    try {
      if (!supabase) {
        toast.error('خدمة Supabase غير متاحة');
        return false;
      }

      const { error } = await supabase!
        .from('waste_receiving_approval_requests')
        .update({
          status: 'verified',
          verified_by: verifierId,
          verified_at: new Date().toISOString(),
          verification_notes: verificationData.verification_notes,
          waste_items: verificationData.waste_items,
        })
        .eq('id', requestId)
        .eq('status', 'pending_verification');

      if (error) {
        console.error('خطأ في التحقق من الاستلام:', error);
        toast.error('فشل في التحقق من الاستلام');
        return false;
      }

      toast.success('تم التحقق من المخلفات المستلمة');
      return true;
    } catch (error) {
      console.error('خطأ في التحقق من الاستلام:', error);
      toast.error('حدث خطأ أثناء التحقق من الاستلام');
      return false;
    }
  },

  /**
   * الموافقة على استلام المخلفات
   */
  async approveReceiving(
    requestId: string,
    approverId: string,
    notes?: string
  ): Promise<boolean> {
    try {
      if (!supabase) {
        toast.error('خدمة Supabase غير متاحة');
        return false;
      }

      // جلب طلب الاستلام
      const { data: request, error: fetchError } = await supabase!
        .from('waste_receiving_approval_requests')
        .select('*')
        .eq('id', requestId)
        .eq('status', 'verified')
        .single();

      if (fetchError || !request) {
        toast.error('طلب الاستلام غير موجود أو لم يتم التحقق منه');
        return false;
      }

      // تحديث حالة الطلب
      const { error: updateError } = await supabase!
        .from('waste_receiving_approval_requests')
        .update({
          status: 'approved',
          approved_by: approverId,
          approval_notes: notes,
          approved_at: new Date().toISOString(),
        })
        .eq('id', requestId);

      if (updateError) {
        console.error('خطأ في الموافقة على الاستلام:', updateError);
        toast.error('فشل في الموافقة على الاستلام');
        return false;
      }

      // ✅ تحديث المخزون في المخازن
      const wasteItems = request.waste_items as Array<{
        waste_material_id: string; // waste_no من catalog_waste_materials
        quantity: number;
        unit: string;
        quality_grade?: string;
        notes?: string;
        verified_quantity?: number; // الكمية المحققة بعد التحقق
      }>;

      // جلب معلومات المخلفات من catalog_waste_materials للحصول على category_id و subcategory_id
      const wasteMaterialIds = wasteItems.map(item => item.waste_material_id);
      const { data: catalogWasteMaterials, error: catalogError } = await supabase!
        .from('catalog_waste_materials')
        .select('waste_no, main_category_id, sub_category_id, notes')
        .in('waste_no', wasteMaterialIds);

      if (catalogError) {
        console.warn('تحذير: فشل في جلب معلومات المخلفات من الكتالوج:', catalogError);
      }

      // إنشاء map للوصول السريع
      const catalogMap = new Map(
        (catalogWasteMaterials || []).map(item => [item.waste_no, item])
      );

      // إضافة حركات المخزون لكل مخلف
      const movementErrors: string[] = [];

      for (const item of wasteItems) {
        try {
          // استخدام الكمية المحققة إذا كانت موجودة، وإلا الكمية الأصلية
          const quantity = item.verified_quantity || item.quantity;
          
          if (quantity <= 0) {
            console.warn(`تخطي مخلف بكمية صفرية أو سالبة: ${item.waste_material_id}`);
            continue;
          }

          // جلب معلومات المخلف من الكتالوج
          const catalogWaste = catalogMap.get(item.waste_material_id);
          
          // جلب catalog_waste_id من catalog_waste_materials
          let catalogWasteId: number | null = null;
          if (catalogWaste) {
            // البحث عن catalog_waste_materials.id من waste_no
            const { data: catalogWasteData } = await supabase!
              .from('catalog_waste_materials')
              .select('id')
              .eq('waste_no', item.waste_material_id)
              .limit(1)
              .maybeSingle();
            
            if (catalogWasteData) {
              catalogWasteId = catalogWasteData.id;
              console.log(`تم العثور على catalog_waste_id للمخلف ${item.waste_material_id}: ${catalogWasteId}`);
            }
          }
          
          // البحث عن waste_data_admin باستخدام عدة طرق
          let productId: string | null = null;
          
          // الطريقة 1: البحث باستخدام name = waste_no مباشرة
          const { data: wasteDataDirect, error: directError } = await supabase!
            .from('waste_data_admin')
            .select('id, name')
            .eq('name', item.waste_material_id)
            .limit(1)
            .maybeSingle();

          if (!directError && wasteDataDirect) {
            productId = wasteDataDirect.id;
            console.log(`تم العثور على waste_data_admin للمخلف ${item.waste_material_id}: ${productId}`);
          } else {
            // الطريقة 2: البحث باستخدام name يحتوي على waste_no
            const { data: wasteDataPartial, error: partialError } = await supabase!
              .from('waste_data_admin')
              .select('id, name')
              .ilike('name', `%${item.waste_material_id}%`)
              .limit(1)
              .maybeSingle();

            if (!partialError && wasteDataPartial) {
              productId = wasteDataPartial.id;
              console.log(`تم العثور على waste_data_admin للمخلف ${item.waste_material_id} (بحث جزئي): ${productId}`);
            } else {
              // الطريقة 3: البحث باستخدام description
              const { data: wasteDataDesc, error: descError } = await supabase!
                .from('waste_data_admin')
                .select('id, name, description')
                .or(`name.ilike.%${item.waste_material_id}%,description.ilike.%${item.waste_material_id}%`)
                .limit(1)
                .maybeSingle();

              if (!descError && wasteDataDesc) {
                productId = wasteDataDesc.id;
                console.log(`تم العثور على waste_data_admin للمخلف ${item.waste_material_id} (من الوصف): ${productId}`);
              } else {
                console.warn(`لم يتم العثور على waste_data_admin للمخلف: ${item.waste_material_id}`);
                // سنستخدم catalog_waste_id كبديل
              }
            }
          }

          // جلب category_id و subcategory_id من catalog_waste_materials
          // ثم البحث عن UUIDs من categories و subcategories
          let categoryId: string | null = null;
          let subcategoryId: string | null = null;

          if (catalogWaste) {
            // إذا كان هناك main_category_id، نحتاج للبحث عن category_id المقابل
            // ملاحظة: قد نحتاج إلى ربط مباشر أو جدول وسيط
            // حالياً سنستخدم null ونعتمد على product_id فقط
          }

          // إضافة حركة المخزون
          const movementData: any = {
            warehouse_id: request.warehouse_id,
            product_id: productId, // قد يكون null إذا لم نجد waste_data_admin
            catalog_waste_id: catalogWasteId, // ✅ إضافة catalog_waste_id للربط المباشر
            category_id: categoryId,
            subcategory_id: subcategoryId,
            movement_type: 'in',
            quantity: quantity,
            unit: item.unit || 'كجم',
            source_type: 'waste_receiving',
            source_id: `${requestId}:${item.waste_material_id}`, // يجمع request ID و waste_no
            notes: `استلام مخلفات: ${item.waste_material_id}${item.quality_grade ? ` - الجودة: ${item.quality_grade}` : ''}${item.notes ? ` - ${item.notes}` : ''}`,
            created_by: approverId,
          };

          const { error: movementError } = await supabase!
            .from('inventory_movements')
            .insert([movementData]);

          if (movementError) {
            console.error(`خطأ في إضافة حركة المخزون للمخلف ${item.waste_material_id}:`, movementError);
            movementErrors.push(`${item.waste_material_id}: ${movementError.message}`);
          } else {
            console.log(`تمت إضافة حركة المخزون بنجاح للمخلف: ${item.waste_material_id}`);
          }
        } catch (itemError) {
          console.error(`خطأ في معالجة المخلف ${item.waste_material_id}:`, itemError);
          movementErrors.push(`${item.waste_material_id}: ${itemError instanceof Error ? itemError.message : 'خطأ غير معروف'}`);
        }
      }

      // إذا كانت هناك أخطاء، نعرض تحذير لكن لا نوقف العملية
      if (movementErrors.length > 0) {
        console.warn('تحذير: فشل في إضافة بعض حركات المخزون:', movementErrors);
        toast.warn(`تمت الموافقة، لكن حدثت أخطاء في تحديث المخزون لبعض المخلفات: ${movementErrors.length}`);
      } else {
        toast.success('تمت الموافقة على استلام المخلفات وتحديث المخزون بنجاح');
      }

      return true;
    } catch (error) {
      console.error('خطأ في الموافقة على الاستلام:', error);
      toast.error('حدث خطأ أثناء الموافقة على الاستلام');
      return false;
    }
  },

  /**
   * رفض استلام المخلفات
   */
  async rejectReceiving(
    requestId: string,
    approverId: string,
    reason: string
  ): Promise<boolean> {
    try {
      if (!supabase) {
        toast.error('خدمة Supabase غير متاحة');
        return false;
      }

      const { error } = await supabase!
        .from('waste_receiving_approval_requests')
        .update({
          status: 'rejected',
          approved_by: approverId,
          rejection_reason: reason,
          rejected_at: new Date().toISOString(),
        })
        .eq('id', requestId);

      if (error) {
        console.error('خطأ في رفض الاستلام:', error);
        toast.error('فشل في رفض الاستلام');
        return false;
      }

      toast.success('تم رفض استلام المخلفات');
      return true;
    } catch (error) {
      console.error('خطأ في رفض الاستلام:', error);
      toast.error('حدث خطأ أثناء رفض الاستلام');
      return false;
    }
  },

  /**
   * جلب طلبات الاستلام المعلقة
   */
  async getPendingReceivingRequests(): Promise<ReceivingApprovalRequest[]> {
    try {
      if (!supabase) {
        return [];
      }

      const { data, error } = await supabase!
        .from('waste_receiving_approval_requests')
        .select('*')
        .in('status', ['pending_verification', 'verified'])
        .order('created_at', { ascending: false });

      if (error) {
        console.error('خطأ في جلب طلبات الاستلام:', error);
        return [];
      }

      return (data || []) as ReceivingApprovalRequest[];
    } catch (error) {
      console.error('خطأ في جلب طلبات الاستلام:', error);
      return [];
    }
  },
};

