import { supabase } from '@/lib/supabase';

export interface ZoonResource {
  id: string;
  circle_id: string;
  title: string;
  description?: string;
  resource_type: 'LINK' | 'PDF' | 'IMAGE' | 'VIDEO' | 'NOTE';
  url?: string;
  votes_count: number;
  created_at: string;
  added_by?: string;
  author_name?: string; // For display
  is_voted_by_me?: boolean; // For UI state
}

export const zoonLibraryService = {
  
  /**
   * 📚 جلب مصادر المكتبة لدائرة معينة
   */
  getResources: async (circleId: string, currentUserId?: string): Promise<ZoonResource[]> => {
    // 1. جلب الموارد
    const { data: resources, error } = await supabase!
      .from('zoon_circle_resources')
      .select(`
        *,
        author:added_by (full_name)
      `)
      .eq('circle_id', circleId)
      .order('votes_count', { ascending: false }); // الأكثر شعبية أولاً

    if (error) throw error;
    if (!resources) return [];

    // 2. التحقق من تصويتي (إذا كان المستخدم مسجلاً)
    let myVotes: string[] = [];
    if (currentUserId) {
      const { data: votes } = await supabase!
        .from('zoon_resource_votes')
        .select('resource_id')
        .eq('user_id', currentUserId)
        .in('resource_id', resources.map(r => r.id));
      
      if (votes) myVotes = votes.map(v => v.resource_id);
    }

    // 3. تنسيق البيانات
    return resources.map((r: any) => ({
      ...r,
      author_name: r.author?.full_name || 'فاعل خير',
      is_voted_by_me: myVotes.includes(r.id)
    }));
  },

  /**
   * ➕ إضافة مورد جديد
   */
  addResource: async (resource: Partial<ZoonResource>) => {
    const { data, error } = await supabase!
      .from('zoon_circle_resources')
      .insert(resource)
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  /**
   * 👍 التصويت لمورد (Upvote)
   */
  toggleVote: async (resourceId: string, userId: string) => {
    // 1. تحقق هل صوت من قبل؟
    const { data: existingVote } = await supabase!
      .from('zoon_resource_votes')
      .select('id')
      .eq('resource_id', resourceId)
      .eq('user_id', userId)
      .single();

    if (existingVote) {
      // حذف التصويت (Unlike)
      await supabase!.from('zoon_resource_votes').delete().eq('id', existingVote.id);
      await supabase!.rpc('decrement_resource_vote', { row_id: resourceId });
    } else {
      // إضافة صوت (Like)
      await supabase!.from('zoon_resource_votes').insert({ resource_id: resourceId, user_id: userId });
      await supabase!.rpc('increment_resource_vote', { row_id: resourceId });
    }
  }
};
