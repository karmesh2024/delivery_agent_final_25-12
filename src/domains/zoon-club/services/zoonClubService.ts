import { supabase } from '@/lib/supabase';
import { zoonMindEngineService } from './zoonMindEngineService';

export interface ZoonRoom {
  id: string;
  name: string;
  name_ar: string;
  icon: string;
  description: string;
  color: string;
  display_order: number;
  is_active: boolean;
  created_at: string;
  // New 2026 Fields
  satisfaction_rate?: number;
  active_members_count?: number;
  total_members?: number;
}

export interface ZoonQuestion {
  id: string;
  room_id: string;
  category: 'ENTRY' | 'EXIT' | 'ENGAGEMENT' | 'FOLLOW_UP';
  trigger_type: string;
  question_text_ar: string;
  question_type: 'SINGLE_CHOICE' | 'MULTIPLE_CHOICE' | 'RATING' | 'TEXT' | 'RANKING';
  options: any;
  points_reward: number;
  is_active: boolean;
  // New 2026 Fields
  trigger_context?: 'ENTRY' | 'ENGAGEMENT' | 'EXIT';
  trigger_logic?: any;
  psychological_impact?: any;
}

export type PostStatus = 'PENDING' | 'APPROVED' | 'REJECTED';

export interface ZoonPost {
  id: string;
  room_id: string;
  user_id?: string;
  content: string;
  media_urls: string[];
  is_approved: boolean; // Legacy
  status: PostStatus;
  rejection_note?: string;
  post_type: string;
  is_featured: boolean;
  likes_count: number;
  comments_count: number;
  created_at: string;
  // V2.2 Psychological Dimensions
  intellectual_pct?: number;
  social_pct?: number;
  values_pct?: number;
  template_used?: string;
  classification_source?: 'publisher_manual' | 'publisher_template' | 'admin_review' | 'system_neutral';
  confidence_level?: 'low' | 'medium' | 'high';
  accuracy_score?: number;
  zoon_rooms?: {
    name_ar: string;
    icon: string;
  };
}

export interface BazzzzType {
  id: string;
  name_en: string;
  name_ar: string;
  icon: string;
  points_given: number;
  is_primary: boolean;
  allows_comment: boolean;
  psychological_impact: any;
}

export interface ZoonCircle {
  id: string;
  name: string;
  room_id: string;
  circle_type?: 'PERSONAL' | 'BUSINESS' | 'FRIENDS' | 'INTEREST';
  goal_type?: 'business' | 'social' | 'impact' | 'learning' | 'creative';
  goal_stage?: 'exploration' | 'building' | 'scaling' | 'maintaining';
  description?: string;
  member_count: number;
  matching_weights: any;
  created_at: string;
  icon?: string;
}

export interface ZoonComment {
  id: string;
  post_id: string;
  user_id: string;
  content: string;
  bazzzz_type_id?: string;
  is_diamond_buzz: boolean;
  created_at: string;
  user_name?: string;
}

export interface ZoonMessage {
  id: string;
  circle_id: string;
  sender_id: string;
  content: string;
  media_url?: string;
  message_type: 'TEXT' | 'IMAGE' | 'VOICE';
  created_at: string;
  sender_name?: string;
}

export interface ZoonInteraction {
  id: string;
  post_id: string;
  user_id: string;
  bazzzz_type_id: string;
  created_at: string;
}

export const zoonClubService = {
  // Rooms
  getRooms: async () => {
    const { data, error } = await supabase!
      .from('zoon_rooms')
      .select('*')
      .order('display_order', { ascending: true });
    
    if (error) throw error;
    return data as ZoonRoom[];
  },

  createRoom: async (roomData: Partial<ZoonRoom>) => {
    const { data, error } = await supabase!
      .from('zoon_rooms')
      .insert({ 
        ...roomData, 
        name: roomData.name || roomData.name_ar,
        display_order: roomData.display_order || 0
      })
      .select()
      .single();
    
    if (error) throw error;
    return data as ZoonRoom;
  },

  updateRoom: async (id: string, updates: Partial<ZoonRoom>) => {
    const { data, error } = await supabase!
      .from('zoon_rooms')
      .update(updates)
      .eq('id', id)
      .select()
      .single();
    
    if (error) throw error;
    return data as ZoonRoom;
  },

  // Questions
  getQuestions: async (roomId?: string) => {
    let query = supabase!.from('zoon_questions').select('*, zoon_rooms(name_ar)');
    if (roomId) query = query.eq('room_id', roomId);
    
    const { data, error } = await query.order('created_at', { ascending: false });
    if (error) throw error;
    return data;
  },

  createQuestion: async (questionData: Partial<ZoonQuestion>) => {
    const { data, error } = await supabase!
      .from('zoon_questions')
      .insert(questionData)
      .select()
      .single();
    
    if (error) throw error;
    return data as ZoonQuestion;
  },

  updateQuestion: async (id: string, updates: Partial<ZoonQuestion>) => {
    const { data, error } = await supabase!
      .from('zoon_questions')
      .update(updates)
      .eq('id', id)
      .select()
      .single();
    
    if (error) throw error;
    return data as ZoonQuestion;
  },

  deleteQuestion: async (id: string) => {
    const { error } = await supabase!
      .from('zoon_questions')
      .delete()
      .eq('id', id);
    
    if (error) throw error;
    return true;
  },

  // Posts
  getPosts: async (roomId?: string) => {
    let query = supabase!.from('zoon_posts').select('*, zoon_rooms(name_ar, icon)');
    if (roomId) query = query.eq('room_id', roomId);
    
    const { data, error } = await query
      .order('ranking_score', { ascending: false })
      .order('created_at', { ascending: false });
    if (error) throw error;
    return data as ZoonPost[];
  },

  createPost: async (postData: Partial<ZoonPost>) => {
    const { data, error } = await supabase!
      .from('zoon_posts')
      .insert({ 
        ...postData, 
        status: postData.status || 'APPROVED', // Default to approved for admin-created posts
        is_approved: postData.status !== 'REJECTED', // Sync with legacy
        intellectual_pct: postData.intellectual_pct ?? 33,
        social_pct: postData.social_pct ?? 33,
        values_pct: postData.values_pct ?? 34,
        classification_source: postData.classification_source || 'system_neutral',
        confidence_level: postData.confidence_level || 'low'
      })
      .select()
      .single();
    
    if (error) throw error;
    return data as ZoonPost;
  },

  updatePostStatus: async (id: string, status: PostStatus, rejectionNote?: string) => {
    const { data, error } = await supabase!
      .from('zoon_posts')
      .update({ 
        status, 
        rejection_note: rejectionNote,
        is_approved: status === 'APPROVED'
      })
      .eq('id', id)
      .select()
      .single();
    
    if (error) throw error;
    return data as ZoonPost;
  },
  
  deletePost: async (id: string) => {
    const { error } = await supabase!
      .from('zoon_posts')
      .delete()
      .eq('id', id);
    
    if (error) throw error;
    return true;
  },

  // Bazzzz
  getBazzzzTypes: async () => {
    const { data, error } = await supabase!
      .from('zoon_bazzzz_types')
      .select('*')
      .order('points_given', { ascending: true });
    
    if (error) throw error;
    return data as BazzzzType[];
  },

  createBazzzzType: async (bazzzzData: Partial<BazzzzType>) => {
    const { data, error } = await supabase!
      .from('zoon_bazzzz_types')
      .insert(bazzzzData)
      .select()
      .single();
    
    if (error) throw error;
    return data as BazzzzType;
  },

  updateBazzzzType: async (id: string, updates: Partial<BazzzzType>) => {
    const { data, error } = await supabase!
      .from('zoon_bazzzz_types')
      .update(updates)
      .eq('id', id)
      .select()
      .single();
    
    if (error) throw error;
    return data as BazzzzType;
  },

  deleteBazzzzType: async (id: string) => {
    const { error } = await supabase!
      .from('zoon_bazzzz_types')
      .delete()
      .eq('id', id);
    
    if (error) throw error;
    return true;
  },

  // Circles
  getCircles: async (roomId?: string) => {
    let query = supabase!.from('zoon_circles').select('*, zoon_rooms(name_ar)');
    if (roomId) query = query.eq('room_id', roomId);
    
    const { data, error } = await query.order('created_at', { ascending: false });
    if (error) throw error;
    return data as ZoonCircle[];
  },

  updateCircleWeights: async (id: string, weights: any) => {
    const { data, error } = await supabase!
      .from('zoon_circles')
      .update({ matching_weights: weights })
      .eq('id', id)
      .select()
      .single();
    
    if (error) throw error;
    return data as ZoonCircle;
  },

  // Circle Membership
  joinCircle: async (circleId: string, userId: string) => {
    const { data, error } = await supabase!
      .from('zoon_circle_members')
      .insert({ circle_id: circleId, user_id: userId })
      .select()
    if (error) throw error;
    return data;
  },

  getJoinedCircles: async (userId: string) => {
    const { data, error } = await supabase!
      .from('zoon_circle_members')
      .select('circle_id, zoon_circles(*)')
      .eq('user_id', userId);
    
    if (error) throw error;
    return data;
  },

  // Comments & Interactions
  getPostComments: async (postId: string) => {
    const { data, error } = await supabase!
      .from('zoon_post_comments')
      .select('*, zoon_bazzzz_types(*)')
      .eq('post_id', postId)
      .order('created_at', { ascending: true });
    
    if (error) throw error;
    return data;
  },

  addPostComment: async (commentData: Partial<ZoonComment>) => {
    const { data, error } = await supabase!
      .from('zoon_post_comments')
      .insert({
        post_id: commentData.post_id,
        user_id: commentData.user_id,
        content: commentData.content,
        bazzzz_type_id: commentData.bazzzz_type_id,
        is_diamond_buzz: commentData.is_diamond_buzz || false
      })
      .select('*, zoon_bazzzz_types(*)')
      .single();
    
    if (error) {
      console.error('Supabase AddComment Error:', error);
      throw error;
    }

    // 🔥 V2.2: Trigger psychological impact for the Bazzzz attached to the comment
    if (data.bazzzz_type_id) {
        zoonMindEngineService.processInteractionImpact(data.user_id, data.post_id, data.bazzzz_type_id).catch(err => {
            console.error('Failed to process comment bazzzz impact:', err);
        });
    }

    return data as ZoonComment;
  },

  addPostInteraction: async (postId: string, userId: string, typeId: string) => {
    const { data, error } = await supabase!
      .from('zoon_post_interactions')
      .upsert({ post_id: postId, user_id: userId, bazzzz_type_id: typeId }, { onConflict: 'post_id,user_id' })
      .select()
      .single();
    
    if (error) throw error;

    // 🔥 V2.2: Trigger psychological impact processing
    zoonMindEngineService.processInteractionImpact(userId, postId, typeId).catch(err => {
      console.error('Failed to process mind engine impact:', err);
    });

    return data as ZoonInteraction;
  },

  getPostInteractions: async (postId: string) => {
    const { data, error } = await supabase!
      .from('zoon_post_interactions')
      .select('*')
      .eq('post_id', postId);
    
    if (error) throw error;
    return data as ZoonInteraction[];
  },

  // Circle Chat
  getCircleMessages: async (circleId: string) => {
    const { data, error } = await supabase!
      .from('zoon_circle_messages')
      .select('*')
      .eq('circle_id', circleId)
      .order('created_at', { ascending: true });
    
    if (error) throw error;
    return data as ZoonMessage[];
  },

  sendCircleMessage: async (messageData: Partial<ZoonMessage>) => {
    const { data, error } = await supabase!
      .from('zoon_circle_messages')
      .insert({
        circle_id: messageData.circle_id,
        sender_id: messageData.sender_id,
        content: messageData.content,
        media_url: messageData.media_url,
        message_type: messageData.message_type || 'TEXT'
      })
      .select()
      .single();
    
    if (error) throw error;
    return data as ZoonMessage;
  }
};
