import { supabase } from '@/lib/supabase';
import { Admin } from '@/domains/admins/types'; // تصحيح مسار استيراد Admin

// واجهة لبيانات المجموعة عند الإنشاء أو التحديث
export interface GroupData {
  name: string;
  description?: string;
  department_id?: string | null; // <-- تعديل هنا ليقبل null أيضًا
}

// واجهة لبيانات المجموعة المسترجعة من قاعدة البيانات
export interface AdminGroup extends GroupData {
  id: string;
  created_at: string;
  updated_at: string;
}

// واجهة لاستجابة قائمة المجموعات
export interface GroupsListResponse {
  success: boolean;
  message?: string;
  groups?: AdminGroup[];
}

// واجهة لاستجابة مجموعة واحدة
export interface GroupResponse {
  success: boolean;
  message?: string;
  group?: AdminGroup;
}

// تعريف نوع لخطأ قاعدة البيانات من Supabase (مبسط)
interface SupabaseError {
  message: string;
  code: string;
  details?: string;
  hint?: string;
}

// Helper type guard لخطأ Supabase
function isSupabaseError(error: unknown): error is SupabaseError {
  // فحص أكثر أمانًا للخصائص والأنواع
  return (
    typeof error === 'object' &&
    error !== null &&
    Object.prototype.hasOwnProperty.call(error, 'code') &&
    typeof (error as Record<string, unknown>).code === 'string' &&
    Object.prototype.hasOwnProperty.call(error, 'message') &&
    typeof (error as Record<string, unknown>).message === 'string'
  );
}

/**
 * واجهة برمجة التطبيق للتعامل مع مجموعات المسؤولين
 */
export const groupsApi = {
  /**
   * جلب جميع مجموعات المسؤولين
   */
  getGroups: async (): Promise<GroupsListResponse> => {
    try {
      if (!supabase) {
        return { success: false, message: 'Supabase client is not available' };
      }
      const { data, error } = await supabase
        .from('admin_groups')
        .select('*')
        .order('name'); // ترتيب حسب الاسم

      if (error) throw error;
      return { success: true, groups: data || [] };
    } catch (error: unknown) {
      console.error('Error fetching admin groups:', error);
      return { success: false, message: (error instanceof Error ? error.message : String(error)) || 'Failed to fetch groups' };
    }
  },

  /**
   * إضافة مجموعة مسؤولين جديدة
   */
  addGroup: async (groupData: GroupData): Promise<GroupResponse> => {
    try {
      if (!supabase) {
        return { success: false, message: 'Supabase client is not available' };
      }
      const { data, error } = await supabase
        .from('admin_groups')
        .insert({
          name: groupData.name,
          description: groupData.description,
          department_id: groupData.department_id || null,
        })
        .select()
        .single(); // نتوقع إضافة مجموعة واحدة

      if (error) throw error;
      return { success: true, group: data, message: 'Group added successfully' };
    } catch (error: unknown) {
      console.error('Error adding admin group:', error);
      return { success: false, message: (error instanceof Error ? error.message : String(error)) || 'Failed to add group' };
    }
  },

  /**
   * تعديل مجموعة مسؤولين موجودة
   */
  updateGroup: async (groupId: string, groupData: GroupData): Promise<GroupResponse> => {
    try {
      if (!supabase) {
        return { success: false, message: 'Supabase client is not available' };
      }
      const { data, error } = await supabase
        .from('admin_groups')
        .update({
          name: groupData.name,
          description: groupData.description,
          department_id: groupData.department_id || null,
          updated_at: new Date().toISOString(), // تحديث الوقت يدوياً إذا لم يكن الـ trigger يعمل بشكل صحيح
        })
        .eq('id', groupId)
        .select()
        .single();

      if (error) throw error;
      return { success: true, group: data, message: 'Group updated successfully' };
    } catch (error: unknown) {
      console.error('Error updating admin group:', error);
      return { success: false, message: (error instanceof Error ? error.message : String(error)) || 'Failed to update group' };
    }
  },

  /**
   * حذف مجموعة مسؤولين
   */
  deleteGroup: async (groupId: string): Promise<{ success: boolean; message?: string }> => {
    try {
      if (!supabase) {
        return { success: false, message: 'Supabase client is not available' };
      }
      const { error } = await supabase
        .from('admin_groups')
        .delete()
        .eq('id', groupId);

      if (error) throw error;
      return { success: true, message: 'Group deleted successfully' };
    } catch (error: unknown) {
      console.error('Error deleting admin group:', error);
      return { success: false, message: (error instanceof Error ? error.message : String(error)) || 'Failed to delete group' };
    }
  },

  // --- دوال إدارة الأعضاء ---

  /**
   * جلب أعضاء مجموعة محددة (قائمة بالمسؤولين)
   */
  getGroupMembers: async (groupId: string): Promise<{ success: boolean; members?: Admin[]; message?: string }> => {
    try {
      if (!supabase) {
        return { success: false, message: 'Supabase client is not available' };
      }
      const { data, error } = await supabase
        .from('admin_group_members')
        .select('admins(*)')
        .eq('group_id', groupId);

      if (error) throw error;
      // استخراج بيانات المسؤولين فقط والتأكد من النوع
      const members = data?.map(item => item.admins)
                         .filter(admin => admin !== null) // التأكد من أنه ليس null
                         .map(admin => admin as unknown as Admin) || []; // استخدام as unknown as Admin
      return { success: true, members: members };
    } catch (error: unknown) {
      console.error('Error fetching group members:', error);
      return { success: false, message: (error instanceof Error ? error.message : String(error)) || 'Failed to fetch members' };
    }
  },

  /**
   * إضافة مسؤول إلى مجموعة
   */
  addMemberToGroup: async (groupId: string, adminId: string): Promise<{ success: boolean; message?: string }> => {
    try {
      if (!supabase) {
        return { success: false, message: 'Supabase client is not available' };
      }
      const { error } = await supabase
        .from('admin_group_members')
        .insert({
          group_id: groupId,
          admin_id: adminId,
        });

      if (error) {
        if (isSupabaseError(error) && error.code === '23505') {
           return { success: false, message: 'Admin is already a member of this group.' };
        }
        throw error;
      }
      return { success: true, message: 'Member added successfully' };
    } catch (error: unknown) {
      console.error('Error adding member to group:', error);
      if (isSupabaseError(error) && error.code === '23505') { 
         return { success: false, message: 'Admin is already a member of this group.' };
      }
      return { success: false, message: (error instanceof Error ? error.message : String(error)) || 'Failed to add member' };
    }
  },

  /**
   * إزالة مسؤول من مجموعة
   */
  removeMemberFromGroup: async (groupId: string, adminId: string): Promise<{ success: boolean; message?: string }> => {
    try {
      if (!supabase) {
        return { success: false, message: 'Supabase client is not available' };
      }
      const { error } = await supabase
        .from('admin_group_members')
        .delete()
        .eq('group_id', groupId)
        .eq('admin_id', adminId);

      if (error) throw error;
      return { success: true, message: 'Member removed successfully' };
    } catch (error: unknown) {
      console.error('Error removing member from group:', error);
      return { success: false, message: (error instanceof Error ? error.message : String(error)) || 'Failed to remove member' };
    }
  },
}; 