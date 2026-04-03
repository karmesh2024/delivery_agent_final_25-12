import { supabase } from '@/lib/supabase';
import type {
  GoalType,
  GoalStage,
  GoalVector,
  ComplementarityMode,
  GovernanceRules,
  CircleRole,
  MemberStatus,
  CircleFitResult,
} from '../types/goalDrivenTypes';

export interface ZoonCircleCategory {
  id: string;
  owner_id: string;
  name: string;
  icon: string;
  color: string;
}

export interface ZoonCircle {
  id: string;
  owner_id: string;
  name: string;
  type: string; // أصبحت نصية لتدعم الأنواع الديناميكية
  color: string;
  icon: string;
  description: string;
  position_x: number;
  position_y: number;
  scale: number;
  is_public: boolean;
  
  // حقول التصميم الذكي (Smart Design)
  constitution?: string | string[]; // دستور التقارب (السياسات)
  essence?: string | string[];      // نبض الدائرة (القيم)
  compass?: string | string[];      // بوصلة الاهتمام (الأولويات)
  soul_filter?: string | string[];  // فلتر الأرواح (من يدخل ومن لا يدخل)
  visibility: 'PUBLIC' | 'PRIVATE' | 'MIXED'; // بعد الدائرة
  
  // ═══ Goal-Driven Architecture Fields (V2) ═══
  goal_type?: GoalType;
  goal_stage?: GoalStage;
  goal_vector?: GoalVector;
  complementarity_mode?: ComplementarityMode;
  core_values?: string[];
  governance_rules?: GovernanceRules;
  max_members?: number;
  auto_match_enabled?: boolean;
  
  created_at: string;
}

export interface ZoonCircleMember {
  id: string;
  circle_id: string;
  user_id?: string;
  phone_number?: string;
  name: string;
  avatar_url?: string;
  compatibility: number;
  archetype?: string; // النمط السلوكي المستنتج
  role: string;
  joined_at: string;
  is_host?: boolean;
  status?: MemberStatus;
  
  // ═══ Role-Driven Fields (V2) ═══
  assigned_role?: CircleRole;
  value_alignment_score?: number;     // 0-100
  role_complementarity_score?: number; // 0-100
  contribution_score?: number;        // 0-100
}

export interface ZoonCircleResource {
  id: string;
  circle_id: string;
  type: 'BOOK' | 'AI_ASSISTANT' | 'GIFT' | 'AUDIO' | 'DOCUMENT';
  name: string;
  data: any;
  added_at: string;
}

export interface ZoonCircleConnection {
  id: string;
  from_circle_id: string;
  to_circle_id: string;
  from_member_id?: string;
  to_member_id?: string;
  connection_type: 'FAMILY' | 'WORK' | 'SOCIAL' | 'INTEREST' | 'TRANSFER' | 'COPY' | 'EVOLUTION' | 'INTERSECTION' | 'PROJECT';
  color: string;
  strength: number;
  shared_members_count?: number;
  reason?: string;
  created_at: string;
}

export interface CircleResourceStatus {
  isLocked: boolean;
  harmonyScore: number;
  unlockedFeatures: {
    chat: boolean;
    library: boolean;
    aiAssistant: boolean;
    events: boolean;
  };
  nextUnlock?: {
    feature: string;
    requiredScore: number;
  };
  members?: ZoonCircleMember[]; // ✅ قائمة الأعضاء
}

export const zoonCirclesService = {
  // ... existing methods

  /**
   * 🔓 Result Loop: تحديد حالة موارد الدائرة بناءً على التوافق
   */
  getCircleResourcesStatus: async (circleId: string): Promise<CircleResourceStatus> => {
      // 1. جلب أعضاء الدائرة
      const members = await zoonCirclesService.getCircleMembers(circleId);
      
      // 2. حساب التوافق (Harmony) باستخدام المحرك المتقدم
      // (نستخدم المنطق الموجود في calculateCircleDynamics لكن بشكل مبسط هنا)
      const { advancedPsychologicalEngine } = await import('./zoonAdvancedPsychologicalEngine.service');
      const { zoonMindEngineService } = await import('./zoonMindEngineService');
      
      const userIds = members.map(m => m.user_id).filter(id => id && id !== 'null' && id !== 'undefined') as string[];
      
      // Enriched profiles (يمكن تخزينها مؤقتاً لتقليل الضغط)
      const profiles = await Promise.all(
        userIds.map(id => advancedPsychologicalEngine.enrichProfile(id).then(advancedPsychologicalEngine.toSimpleProfile))
      );
      
      // 🔌 Adapter: Mapping to older MindEngine interface (with _score suffixes)
      const compatibleProfiles = profiles.map(p => ({
        user_id: p.user_id,
        openness_score: p.openness,
        conscientiousness_score: p.conscientiousness,
        extraversion_score: p.extraversion,
        agreeableness_score: p.agreeableness,
        neuroticism_score: p.neuroticism
      }));
      
      const harmonyAnalysis = zoonMindEngineService.calculateGroupHarmony(compatibleProfiles as any);
      const score = harmonyAnalysis.harmonyScore;

      // 3. تحديد الميزات المفتوحة (The Game Logic)
      return {
          isLocked: score < 30, // أقل من 30% تعتبر دائرة فاشلة/مغلقة
          harmonyScore: score,
          unlockedFeatures: {
              chat: score >= 40,        // الشات يفتح عند 40%
              library: score >= 60,     // المكتبة تفتح عند 60%
              events: score >= 75,      // الفعاليات تفتح عند 75%
              aiAssistant: score >= 90  // المساعد الذكي يتطلب توافقاً ممتازاً 90%
          },
          nextUnlock: 
            score < 40 ? { feature: 'الدردشة الجماعية', requiredScore: 40 } :
            score < 60 ? { feature: 'مكتبة المعرفة', requiredScore: 60 } :
            score < 75 ? { feature: 'تنظيم الفعاليات', requiredScore: 75 } :
            score < 90 ? { feature: 'المساعد الذكي (AI)', requiredScore: 90 } : undefined,
          members: members // ✅ إضافة الأعضاء ليتم عرضهم
      };
  },
  // Categories (أنواع الدوائر)
  getCategories: async () => {
    const { data, error } = await supabase!
      .from('zoon_circle_categories')
      .select('*')
      .order('name');
    if (error) throw error;
    return data as ZoonCircleCategory[];
  },

  createCategory: async (category: Partial<ZoonCircleCategory>) => {
    const { data, error } = await supabase!
      .from('zoon_circle_categories')
      .insert(category)
      .select()
      .single();
    if (error) throw error;
    return data as ZoonCircleCategory;
  },

  deleteCategory: async (id: string) => {
    const { error } = await supabase!
      .from('zoon_circle_categories')
      .delete()
      .eq('id', id);
    if (error) throw error;
    return true;
  },

  // Circles
  getCircles: async (ownerId?: string) => {
    let query = supabase!.from('zoon_circles').select('*');
    if (ownerId) query = query.eq('owner_id', ownerId);
    
    const { data, error } = await query.order('created_at', { ascending: false });
    if (error) throw error;
    return data as ZoonCircle[];
  },

  createCircle: async (circleData: Partial<ZoonCircle>) => {
    const { data, error } = await supabase!
      .from('zoon_circles')
      .insert(circleData)
      .select()
      .single();
    
    if (error) throw error;
    return data as ZoonCircle;
  },

  updateCircle: async (id: string, updates: Partial<ZoonCircle>) => {
    const { data, error } = await supabase!
      .from('zoon_circles')
      .update(updates)
      .eq('id', id)
      .select()
      .single();
    
    if (error) throw error;
    return data as ZoonCircle;
  },

  deleteCircle: async (id: string) => {
    const { error } = await supabase!
      .from('zoon_circles')
      .delete()
      .eq('id', id);
    
    if (error) throw error;
    return true;
  },

  // Members
// Members
  getCircleMembers: async (circleId: string) => {
    // 1. Get member relationships
    const { data: relations, error: relError } = await supabase!
      .from('zoon_circle_members')
      .select('*')
      .eq('circle_id', circleId);
    
    if (relError) throw relError;
    if (!relations || relations.length === 0) return [];

    // 2. Enhance with profile data from 'new_profiles'
    const memberIds = relations.map(r => r.user_id).filter(id => id !== null && id !== undefined);
    
    // Check if we have IDs to fetch
    if (memberIds.length === 0) return relations as ZoonCircleMember[];

    const { data: profiles, error: profError } = await supabase!
      .from('new_profiles')
      .select('id, full_name, avatar_url') // ✅ استخدام الأعمدة الصحيحة كما في getAvailableClubMembers
      .in('id', memberIds);

    if (profError) {
       console.warn('Failed to fetch profiles details', profError);
       return relations as ZoonCircleMember[];
    }

    // 3. Merge data
    const enrichedMembers = relations.map(rel => {
      const profile = profiles?.find(p => p.id === rel.user_id);
      return {
        ...rel,
        name: profile?.full_name || rel.name || 'عضو مجهول', // Fallback
        avatar_url: profile?.avatar_url || rel.avatar_url,
      };
    });
    
    return enrichedMembers as ZoonCircleMember[];
  },

  addMember: async (memberData: Partial<ZoonCircleMember>) => {
    const { data, error } = await supabase!
      .from('zoon_circle_members')
      .insert(memberData)
      .select()
      .single();
    
    if (error) throw error;
    return data as ZoonCircleMember;
  },

  deleteMember: async (id: string) => {
    const { error } = await supabase!
      .from('zoon_circle_members')
      .delete()
      .eq('id', id);
    
    if (error) throw error;
    return true;
  },

  // Connections
  getConnections: async (circleIds: string[]) => {
    const { data, error } = await supabase!
      .from('zoon_circle_connections')
      .select('*')
      .or(`from_circle_id.in.(${circleIds.join(',')}),to_circle_id.in.(${circleIds.join(',')})`);
    
    if (error) throw error;
    return data as ZoonCircleConnection[];
  },

  // Resources
  getResources: async (circleId: string) => {
    const { data, error } = await supabase!
      .from('zoon_circle_resources')
      .select('*')
      .eq('circle_id', circleId);
    
    if (error) throw error;
    return data as ZoonCircleResource[];
  },

  addResource: async (resourceData: Partial<ZoonCircleResource>) => {
    const { data, error } = await supabase!
      .from('zoon_circle_resources')
      .insert(resourceData)
      .select()
      .single();
    
    if (error) throw error;
    return data as ZoonCircleResource;
  },

  createConnection: async (connectionData: Partial<ZoonCircleConnection>) => {
    const { data, error } = await supabase!
      .from('zoon_circle_connections')
      .insert(connectionData)
      .select()
      .single();
    
    if (error) throw error;
    return data as ZoonCircleConnection;
  },

  updateConnection: async (id: string, updates: Partial<ZoonCircleConnection>) => {
    const { data, error } = await supabase!
      .from('zoon_circle_connections')
      .update(updates)
      .eq('id', id)
      .select()
      .single();
    if (error) throw error;
    return data as ZoonCircleConnection;
  },

  deleteConnection: async (id: string) => {
    const { error } = await supabase!
      .from('zoon_circle_connections')
      .delete()
      .eq('id', id);
    if (error) throw error;
    return true;
  },

  // جلب الأعضاء المتاحين في النادي الذين لم ينضموا لدوائر بعد
  getAvailableClubMembers: async () => {
    // 1. جلب عضويات النادي النشطة مع بيانات البروفايل
    const { data: memberships, error: membershipsError } = await supabase!
      .from('club_memberships')
      .select(`
        user_id,
        membership_level,
        is_active,
        new_profiles:user_id (
          id,
          full_name,
          avatar_url,
          phone_number
        )
      `)
      .eq('is_active', true);

    if (membershipsError) throw membershipsError;

    // 2. جلب الأعضاء المسجلين بالفعل في أي دائرة لاستبعادهم
    const { data: circleMembers, error: circleMembersError } = await supabase!
      .from('zoon_circle_members')
      .select('user_id')
      .not('user_id', 'is', null);

    if (circleMembersError) throw circleMembersError;

    const existingMemberIds = new Set(circleMembers.map(cm => cm.user_id));

    // 3. جلب وتحليل البروفايلات النفسية المتقدمة (تشمل السلوك)
    const availableUserIds = (memberships || [])
      .filter(m => !existingMemberIds.has(m.user_id) && m.new_profiles)
      .map(m => m.user_id);

    const { advancedPsychologicalEngine } = await import('./zoonAdvancedPsychologicalEngine.service');

    const enrichedPromises = availableUserIds.map(async (id) => {
        try {
            return await advancedPsychologicalEngine.enrichProfile(id);
        } catch (e) {
            return null;
        }
    });
    
    const enrichedList = (await Promise.all(enrichedPromises)).filter(p => p !== null);

    const enrichedMap: Record<string, any> = {};
    enrichedList.forEach(p => { if(p) enrichedMap[p.user_id] = p; });

    // 4. تصفية الأعضاء وتحويلهم للتنسيق الذكي
    const { psychologicalFeatures } = await import('./zoonMindEngineService');

    const availableMembers = (memberships || [])
      .filter(m => !existingMemberIds.has(m.user_id) && m.new_profiles)
      .map(m => {
        const profile = m.new_profiles as any;
        const enrichedProfile = enrichedMap[m.user_id];
        
        let archetype = 'BALANCED';
        let compatibility = 50;
        let confidence = 0; // مؤشر الثقة في البيانات

        if (enrichedProfile) {
          confidence = enrichedProfile.profile_quality?.reliability || 0;
          
          // نحول للنموذج البسيط لحساب النمط
          const simple = advancedPsychologicalEngine.toSimpleProfile(enrichedProfile);
          const compatibleProfile = {
            user_id: simple.user_id,
            openness_score: simple.openness,
            conscientiousness_score: simple.conscientiousness,
            extraversion_score: simple.extraversion,
            agreeableness_score: simple.agreeableness,
            neuroticism_score: simple.neuroticism
          };
          archetype = psychologicalFeatures.detectArchetype(compatibleProfile as any);
          
          // توافق مبدئي عام أو عشوائي ذكي بناءً على النمط
          compatibility = Math.floor(Math.random() * 20) + (archetype === 'BALANCED' ? 60 : 75);
        }

        return {
          id: m.user_id,
          name: profile.full_name || 'Zoner',
          avatar_url: profile.avatar_url,
          phone_number: profile.phone_number,
          membership_level: m.membership_level,
          archetype,
          compatibility,
          confidence
        };
      });

    return availableMembers;
  },

  // Analytics
  calculateCircleDynamics: async (circleId: string) => {
    // 1. Get member IDs
    const { data: members, error: mError } = await supabase!
        .from('zoon_circle_members')
        .select('user_id')
        .eq('circle_id', circleId);
    
    if (mError) throw mError;
    if (!members || members.length === 0) return null;

    // 2. Fetch profiles using Advanced Engine
    const userIds = members.map(m => m.user_id).filter(id => id !== undefined && id !== null) as string[];
    
    const { advancedPsychologicalEngine } = await import('./zoonAdvancedPsychologicalEngine.service');
    const { zoonMindEngineService } = await import('./zoonMindEngineService');

    // جلب البروفايلات المحسنة (الموزونة بالسلوك)
    const enrichedPromises = userIds.map(async (id) => {
      try {
        const enriched = await advancedPsychologicalEngine.enrichProfile(id);
        return advancedPsychologicalEngine.toSimpleProfile(enriched);
      } catch (e) {
        // في حال عدم وجود بيانات، ارجع بروفايل افتراضي متوازن
        return {
          user_id: id,
          openness_score: 50,
          conscientiousness_score: 50,
          extraversion_score: 50,
          agreeableness_score: 50,
          neuroticism_score: 50
        };
      }
    });

    const fullProfiles = (await Promise.all(enrichedPromises)).map(p => {
      // 🔌 Adapter: Mapping to older MindEngine interface
      return {
        user_id: p.user_id,
        openness_score: (p as any).openness_score ?? (p as any).openness,
        conscientiousness_score: (p as any).conscientiousness_score ?? (p as any).conscientiousness,
        extraversion_score: (p as any).extraversion_score ?? (p as any).extraversion,
        agreeableness_score: (p as any).agreeableness_score ?? (p as any).agreeableness,
        neuroticism_score: (p as any).neuroticism_score ?? (p as any).neuroticism
      };
    });

    // 3. Compute Harmony
    return zoonMindEngineService.calculateGroupHarmony(fullProfiles as any);
  }
};
