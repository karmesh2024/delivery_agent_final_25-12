import { createClient } from '@supabase/supabase-js';
import { generateEmbedding } from './embeddings';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export interface GraphTriplet {
  subject: string;
  predicate: string;
  object: string;
  team_id?: string | null;   // ← جديد
  scope?: 'personal' | 'team'; // ← جديد
  confidence?: number;
  metadata?: any;
}

/**
 * 🕸️ خدمة الشبكة المعرفية (Knowledge Graph Service)
 * المسؤولة عن بناء الروابط المنطقية بين الحقائق
 */
export const GraphService = {
  /**
   * إضافة رابط جديد للشبكة
   */
  async addRelation(userId: string, triplet: GraphTriplet, sourceId?: string) {
    try {
      const content = `${triplet.subject} ${triplet.predicate} ${triplet.object}`;
      const embedding = await generateEmbedding(content);

      const { error } = await supabase
        .from('zoon_knowledge_graph')
        .insert({
          user_id: userId,
          team_id: triplet.team_id || null,
          scope: triplet.scope || 'personal',
          subject: triplet.subject.trim(),
          predicate: triplet.predicate.trim(),
          object: triplet.object.trim(),
          source_id: sourceId,
          confidence: triplet.confidence || 1.0,
          embedding
        });

      if (error) throw error;
      console.log(`🕸️ [Graph] ${triplet.scope || 'personal'} fact stored: ${triplet.subject} -> ${triplet.predicate}`);
    } catch (e: any) {
      console.error('❌ [GraphService Error]:', e.message);
    }
  },

  /**
   * إضافة أو تحديث رابط (Smart Upsert)
   * يمنع التعارض بتحديث المعلومة القديمة إذا وجد نفس الفاعل والفعل في نفس النطاق
   */
  async upsertRelation(userId: string, triplet: GraphTriplet, sourceId?: string) {
    try {
      const scope = triplet.scope || 'personal';
      
      // 1. التحقق من وجود معلومة مسبقة لنفس الفاعل والمبتدأ في نفس النطاق
      let query = supabase
        .from('zoon_knowledge_graph')
        .select('id')
        .eq('subject', triplet.subject.trim())
        .eq('predicate', triplet.predicate.trim())
        .eq('scope', scope);

      if (scope === 'team' && triplet.team_id) {
        query = query.eq('team_id', triplet.team_id);
      } else {
        query = query.eq('user_id', userId);
      }

      const { data: existing } = await query.single();

      const content = `${triplet.subject} ${triplet.predicate} ${triplet.object}`;
      const embedding = await generateEmbedding(content);

      if (existing) {
        const { error } = await supabase
          .from('zoon_knowledge_graph')
          .update({
            object: triplet.object.trim(),
            confidence: triplet.confidence || 1.0,
            embedding,
            updated_at: new Date().toISOString()
          })
          .eq('id', existing.id);
        
        if (error) throw error;
        console.log(`🧠 [Graph Update] Adjusted [${scope}]: ${triplet.subject} -> ${triplet.object}`);
      } else {
        await this.addRelation(userId, triplet, sourceId);
      }
    } catch (e: any) {
      console.error('❌ [Graph Upsert Error]:', e.message);
      await this.addRelation(userId, triplet, sourceId);
    }
  },

  /**
   * جلب الحقائق المرتبطة بكيان معين (Exploration)
   * تدعم الهوية الهجينة (UserID + TeamID)
   */
  async getEntityConnections(userId: string, entity: string, teamId: string | null = null) {
    try {
      let query = supabase
        .from('zoon_knowledge_graph')
        .select('subject, predicate, object, confidence, scope')
        .or(`subject.eq.${entity},object.eq.${entity}`);

      // استرجاع هجين: ما يخص المستخدم + ما يخص فريقه
      if (teamId) {
        query = query.or(`user_id.eq.${userId},and(team_id.eq.${teamId},scope.eq.team)`);
      } else {
        query = query.eq('user_id', userId);
      }

      const { data, error } = await query.order('confidence', { ascending: false });

      if (error) throw error;
      return data || [];
    } catch (e: any) {
      console.error('❌ [GraphService Query Error]:', e.message);
      return [];
    }
  }
};
