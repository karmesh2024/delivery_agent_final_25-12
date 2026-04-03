// ═══════════════════════════════════════════════════════
// ملف: advancedPsychologicalEngine.service.ts
// ═══════════════════════════════════════════════════════

import { supabase } from '@/lib/supabase';
import { UserInitialSurvey } from '../types/goalDrivenTypes';

// ═══════════════════════════════════════════════════════
// الأنواع (Types)
// ═══════════════════════════════════════════════════════

export interface PsychologicalProfile {
  user_id: string;
  openness: number;
  conscientiousness: number;
  extraversion: number;
  agreeableness: number;
  neuroticism: number;
  created_at: string;  // 🆕 لتتبع الوقت
}

export interface BehaviorData {
  user_id: string;
  total_visits: number;
  total_time_minutes: number;
  posts_created: number;
  posts_viewed: number;
  posts_liked: number;
  comments_made: number;
  tasks_started: number;
  tasks_completed: number;
  events_total: number;
  events_attended_on_time: number;
  visit_pattern: 'regular' | 'semi-regular' | 'irregular';
}

export interface DimensionScore {
  from_questionnaire: number;
  from_behavior: number | null;
  final: number;
  confidence: number;
  source_weight: {
    questionnaire: number;
    behavior: number;
  };
}

export interface EnrichedProfile {
  user_id: string;
  days_since_registration: number;
  
  // السمات الأساسية (مع مصادرها)
  dimensions: {
    openness: DimensionScore;
    conscientiousness: DimensionScore;
    extraversion: DimensionScore;
    agreeableness: DimensionScore;
    neuroticism: DimensionScore;
  };
  
  // المشتقات الذكية (من Feature Engineering)
  computed_traits: {
    emotional_stability: number;
    social_confidence: number;
    work_ethic: number;
    leadership_potential: number;
    creativity_index: number;
    empathy_score: number;
    conflict_tendency: number;
    adaptability: number;
  };
  
  // النمط الشخصي
  archetype: {
    primary: string;
    secondary: string;
    confidence: number;
  };
  
  // مؤشرات الجودة
  profile_quality: {
    data_completeness: number;  // 0-100
    reliability: number;         // 0-100
    freshness: number;           // 0-100
  };
}

// ═══════════════════════════════════════════════════════
// الخدمة الرئيسية
// ═══════════════════════════════════════════════════════

export const advancedPsychologicalEngine = {
  
  /**
   * 🔥 الوظيفة الرئيسية: إثراء البروفايل بالكامل
   */
  enrichProfile: async (userId: string): Promise<EnrichedProfile> => {
    
    // 1️⃣ جلب البيانات الأساسية
    const questionnaire = await advancedPsychologicalEngine.getQuestionnaire(userId);
    const behavior = await advancedPsychologicalEngine.getBehaviorData(userId);
    const daysSinceReg = advancedPsychologicalEngine.calculateDaysSinceRegistration(
      questionnaire.created_at || new Date().toISOString()
    );

    // 2️⃣ تعيين المستخدم للتجربة وتسجيله (مع التتبع)
    // نستخدم await هنا لضمان تسجيل البيانات، لكن يمكن جعله غير متزامن للسرعة إذا لزم الأمر
    const { abTestingService } = await import('./zoonABTestingService');
    const variant = await abTestingService.assignAndTrack(userId, { daysSinceReg });
    
    // 3️⃣ حساب الأوزان التدريجية (مع المتغير المحدد)
    const weights = advancedPsychologicalEngine.getProgressiveWeights(daysSinceReg, variant);
    
    // 4️⃣ حساب كل بُعد (dimension) مع مصادره
    const dimensions = {
      openness: advancedPsychologicalEngine.calculateDimension(
        'openness',
        questionnaire.openness,
        behavior,
        weights
      ),
      conscientiousness: advancedPsychologicalEngine.calculateDimension(
        'conscientiousness',
        questionnaire.conscientiousness,
        behavior,
        weights
      ),
      extraversion: advancedPsychologicalEngine.calculateDimension(
        'extraversion',
        questionnaire.extraversion,
        behavior,
        weights
      ),
      agreeableness: advancedPsychologicalEngine.calculateDimension(
        'agreeableness',
        questionnaire.agreeableness,
        behavior,
        weights
      ),
      neuroticism: advancedPsychologicalEngine.calculateDimension(
        'neuroticism',
        questionnaire.neuroticism,
        behavior,
        weights
      )
    };
    
    // 5️⃣ حساب المشتقات الذكية
    const computed_traits = advancedPsychologicalEngine.computeDerivedTraits(dimensions);
    
    // 6️⃣ كشف النمط الشخصي
    const archetype = advancedPsychologicalEngine.detectArchetype(dimensions);
    
    // 7️⃣ تقييم جودة البروفايل
    const profile_quality = advancedPsychologicalEngine.assessProfileQuality(
      questionnaire,
      behavior,
      daysSinceReg
    );

    // تسجيل حدث نجاح الإثراء (اختياري لكن مفيد للتحليل)
    abTestingService.trackEvent(userId, variant, 'profile_enriched', { 
      quality: profile_quality.reliability,
      archetype: archetype.primary 
    }).catch(console.error);
    
    return {
      user_id: userId,
      days_since_registration: daysSinceReg,
      dimensions,
      computed_traits,
      archetype,
      profile_quality
    };
  },
  
  // ───────────────────────────────────────────────────────
  // الدوال المساعدة
  // ───────────────────────────────────────────────────────
  
  /**
   * جلب بيانات الاستبيان (Profile)
   */
  getQuestionnaire: async (userId: string): Promise<PsychologicalProfile> => {
    const { data, error } = await supabase!
      .from('user_psychological_profile') // ✅ Corrected table name
      .select('*')
      .eq('user_id', userId)
      .single();
    
    if (error || !data) {
       // Cold Start: Return default profile
       return {
         user_id: userId,
         openness: 50,
         conscientiousness: 50,
         extraversion: 50,
         agreeableness: 50,
         neuroticism: 50,
         created_at: new Date().toISOString()
       };
    }
    
    return data;
  },

  /**
   * 🆕 تقديم الاستبيان الأولي (Initial Survey)
   * هذا هو مفتاح حل مشكلة Cold Start
   */
  submitInitialSurvey: async (surveyData: UserInitialSurvey): Promise<boolean> => {
    const { error } = await supabase!
      .from('user_initial_survey')
      .upsert(surveyData);

    if (error) {
      console.error('Error submitting initial survey details:', {
        code: error.code,
        message: error.message,
        details: error.details,
        hint: error.hint
      });
      return false;
    }
    return true;
  },

  
  /**
   * جلب بيانات السلوك
   */
  getBehaviorData: async (userId: string): Promise<BehaviorData | null> => {
    // Note: 'user_behavior_summary' table might not exist yet. 
    // This is a placeholder for the future table or view.
    // For now, we'll return null to simulate "no behavior data yet".
    
    const { data, error } = await supabase!
      .from('user_behavior_summary')  // جدول ملخص السلوك
      .select('*')
      .eq('user_id', userId)
      .single();
    
    if (error || !data) {
      return null;  // لا توجد بيانات سلوكية بعد
    }
    
    return data;
  },
  
  /**
   * حساب عدد الأيام منذ التسجيل
   */
  calculateDaysSinceRegistration: (createdAt: string): number => {
    const registrationDate = new Date(createdAt);
    const now = new Date();
    const diffTime = Math.abs(now.getTime() - registrationDate.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays;
  },
  
  /**
   * 🔥 حساب الأوزان التدريجية (قلب النظام!)
   */
  /**
   * 🧪 A/B Testing: تحديد نسخة التجربة للمستخدم
   * نستخدم توزيعاً قطعياً (Deterministic) بناءً على آخر حرف في الـ ID
   */
  getExperimentVariant: (userId: string): 'A' | 'B' => {
    // توزيع عشوائي ثابت
    const charCode = userId.charCodeAt(userId.length - 1);
    return charCode % 2 === 0 ? 'A' : 'B';
  },

  /**
   * 🔥 حساب الأوزان التدريجية (يدعم A/B Testing)
   */
  getProgressiveWeights: (daysSinceReg: number, variant: 'A' | 'B' = 'A') => {
    // المجموعة المرجعية A: الاستراتيجية المحافظة
    // المجموعة التجريبية B: الاستراتيجية الجريئة (أوزان أعلى للسلوك)
    
    const isAggressive = variant === 'B';

    if (daysSinceReg <= 1) {
      return { questionnaire: 1.0, behavior: 0.0 };
    } else if (daysSinceReg < 7) {
      return { questionnaire: 0.9, behavior: 0.1 };
    } else if (daysSinceReg < 30) {
      // شهر 1: انتقال تدريجي (أسرع في B)
      const progress = daysSinceReg / 30;
      const baseQ = 0.9;
      const targetQ = isAggressive ? 0.2 : 0.3; // B تستهدف 0.2
      const decay = progress * (baseQ - targetQ);
      
      const wQ = Math.max(targetQ, baseQ - decay);
      return {
        questionnaire: Number(wQ.toFixed(2)),
        behavior: Number((1 - wQ).toFixed(2))
      };
    } else if (daysSinceReg < 90) {
      // شهر 2-3
      return {
        questionnaire: isAggressive ? 0.2 : 0.3,
        behavior: isAggressive ? 0.8 : 0.7
      };
    } else {
      // بعد 3 أشهر
      return {
        questionnaire: isAggressive ? 0.1 : 0.2, // B تثق 90% بالسلوك
        behavior: isAggressive ? 0.9 : 0.8
      };
    }
  },
  
  /**
   * 🔥 حساب بُعد واحد مع مصادره
   */
  calculateDimension: (
    dimension: 'openness' | 'conscientiousness' | 'extraversion' | 'agreeableness' | 'neuroticism',
    questionnaireScore: number,
    behavior: BehaviorData | null,
    weights: { questionnaire: number; behavior: number }
  ): DimensionScore => {
    
    // 1. الدرجة من الاستبيان
    const from_questionnaire = questionnaireScore;
    
    // 2. الدرجة من السلوك (إن وجد)
    let from_behavior: number | null = null;
    
    if (behavior && weights.behavior > 0) {
      from_behavior = advancedPsychologicalEngine.calculateDimensionFromBehavior(
        dimension,
        behavior
      );
    }
    
    // 3. الدرجة النهائية (موزونة)
    let final: number;
    
    if (from_behavior === null) {
      // لا توجد بيانات سلوكية
      final = from_questionnaire;
    } else {
      // دمج المصدرين
      final = Math.round(
        (from_questionnaire * weights.questionnaire) +
        (from_behavior * weights.behavior)
      );
    }
    
    // 4. حساب الثقة
    const confidence = advancedPsychologicalEngine.calculateConfidence(
      from_questionnaire,
      from_behavior,
      weights
    );
    
    return {
      from_questionnaire,
      from_behavior,
      final,
      confidence,
      source_weight: weights
    };
  },
  
  /**
   * 🔥 حساب البُعد من السلوك
   */
  calculateDimensionFromBehavior: (
    dimension: string,
    behavior: BehaviorData
  ): number => {
    
    switch (dimension) {
      
      case 'conscientiousness':
        // الالتزام = الانتظام + إكمال المهام + الدقة
        let score = 0;
        
        // الانتظام (0-30)
        if (behavior.visit_pattern === 'regular') score += 30;
        else if (behavior.visit_pattern === 'semi-regular') score += 20;
        else score += 10;
        
        // إكمال المهام (0-40)
        const completionRate = behavior.tasks_started > 0
          ? behavior.tasks_completed / behavior.tasks_started
          : 0.5;
        score += completionRate * 40;
        
        // الالتزام بالمواعيد (0-30)
        const punctualityRate = behavior.events_total > 0
          ? behavior.events_attended_on_time / behavior.events_total
          : 0.5;
        score += punctualityRate * 30;
        
        return Math.min(Math.round(score), 100);
      
      case 'extraversion':
        // الانفتاح الاجتماعي = التفاعل + المشاركة
        let extScore = 0;
        
        // عدد المنشورات (0-25)
        extScore += Math.min(behavior.posts_created * 2.5, 25);
        
        // عدد التعليقات (0-25)
        extScore += Math.min(behavior.comments_made * 1.25, 25);
        
        // الإعجابات (0-20)
        extScore += Math.min(behavior.posts_liked * 0.5, 20);
        
        // الوقت المقضي (0-30)
        const avgTimePerVisit = behavior.total_visits > 0
          ? behavior.total_time_minutes / behavior.total_visits
          : 0;
        extScore += Math.min(avgTimePerVisit * 2, 30);
        
        return Math.min(Math.round(extScore), 100);
      
      case 'openness':
        // الانفتاح = تنوع النشاط
        let openScore = 50;  // قاعدة
        
        // تنوع الأنشطة
        const hasCreatedPosts = behavior.posts_created > 0;
        const hasCommented = behavior.comments_made > 0;
        const hasLiked = behavior.posts_liked > 0;
        const hasViewed = behavior.posts_viewed > 0;
        
        const diversityScore = [hasCreatedPosts, hasCommented, hasLiked, hasViewed]
          .filter(Boolean).length;
        
        openScore += diversityScore * 12.5;  // 0-50
        
        return Math.min(Math.round(openScore), 100);
      
      case 'agreeableness':
        // المقبولية = نسبة التفاعل الإيجابي
        let agreeScore = 50;
        
        // نسبة الإعجابات إلى المشاهدات
        const likeRate = behavior.posts_viewed > 0
          ? behavior.posts_liked / behavior.posts_viewed
          : 0;
        agreeScore += likeRate * 50;
        
        return Math.min(Math.round(agreeScore), 100);
      
      case 'neuroticism':
        // العصابية = عدم الانتظام + التقلب
        let neuroScore = 50;
        
        // عدم الانتظام
        if (behavior.visit_pattern === 'irregular') neuroScore += 20;
        else if (behavior.visit_pattern === 'semi-regular') neuroScore += 10;
        
        // عدم إكمال المهام (علامة قلق)
        const incompletionRate = behavior.tasks_started > 0
          ? 1 - (behavior.tasks_completed / behavior.tasks_started)
          : 0.5;
        neuroScore += incompletionRate * 30;
        
        return Math.min(Math.round(neuroScore), 100);
      
      default:
        return 50;  // محايد
    }
  },
  
  /**
   * حساب الثقة في النتيجة
   */
  calculateConfidence: (
    questionnaireScore: number,
    behaviorScore: number | null,
    weights: { questionnaire: number; behavior: number }
  ): number => {
    
    if (behaviorScore === null) {
      // لا يوجد سلوك = ثقة متوسطة
      return 70;
    }
    
    // فرق كبير بين المصدرين = ثقة أقل
    const diff = Math.abs(questionnaireScore - behaviorScore);
    
    if (diff < 10) return 95;  // تطابق ممتاز
    if (diff < 20) return 85;  // تطابق جيد
    if (diff < 30) return 75;  // تطابق مقبول
    if (diff < 40) return 65;  // اختلاف ملحوظ
    return 50;  // اختلاف كبير
  },
  
  /**
   * 🔥 حساب المشتقات الذكية (من Feature Engineering)
   */
  computeDerivedTraits: (dimensions: EnrichedProfile['dimensions']) => {
    // استخدام الدرجات النهائية (المدمجة)
    const O = dimensions.openness.final;
    const C = dimensions.conscientiousness.final;
    const E = dimensions.extraversion.final;
    const A = dimensions.agreeableness.final;
    const N = dimensions.neuroticism.final;
    
    return {
      emotional_stability: 100 - N,
      social_confidence: Math.round((E + (100 - N)) / 2),
      work_ethic: Math.round((C + (100 - N)) / 2),
      leadership_potential: Math.round((E * C) / 100),
      creativity_index: Math.round((O * (100 - C)) / 100),
      empathy_score: Math.round((A + (100 - N)) / 2),
      conflict_tendency: Math.round(((100 - A) + N) / 2),
      adaptability: O - C
    };
  },
  
  /**
   * كشف النمط الشخصي
   */
  detectArchetype: (dimensions: EnrichedProfile['dimensions']) => {
    const O = dimensions.openness.final;
    const C = dimensions.conscientiousness.final;
    const E = dimensions.extraversion.final;
    const A = dimensions.agreeableness.final;
    const N = dimensions.neuroticism.final;
    
    const patterns = [
      { type: 'LEADER', score: E * 0.5 + C * 0.3 + (100 - N) * 0.2 },
      { type: 'INNOVATOR', score: O * 0.6 + (100 - C) * 0.4 },
      { type: 'HARMONIZER', score: A * 0.5 + (100 - N) * 0.5 },
      { type: 'ANALYST', score: C * 0.6 + (100 - E) * 0.4 },
      { type: 'ENTHUSIAST', score: E * 0.5 + O * 0.5 },
      { type: 'GUARDIAN', score: C * 0.5 + A * 0.5 },
      { type: 'DREAMER', score: O * 0.6 + (100 - C) * 0.4 },
      { type: 'REALIST', score: C * 0.6 + (100 - O) * 0.4 }
    ].sort((a, b) => b.score - a.score);
    
    return {
      primary: patterns[0].type,
      secondary: patterns[1].type,
      confidence: Math.min(100, Math.round(patterns[0].score - patterns[1].score + 50))
    };
  },
  
  /**
   * تقييم جودة البروفايل
   */
  assessProfileQuality: (
    questionnaire: PsychologicalProfile,
    behavior: BehaviorData | null,
    daysSinceReg: number
  ) => {
    // 1. اكتمال البيانات
    const hasQuestionnaire = true;  // لأنه موجود
    const hasBehavior = behavior !== null;
    const data_completeness = hasBehavior ? 100 : 50;
    
    // 2. الموثوقية
    let reliability = 70;  // قاعدة
    
    if (hasBehavior) {
      // كلما زادت البيانات السلوكية = زادت الموثوقية
      const behaviorDataPoints = 
        (behavior!.total_visits || 0) +
        (behavior!.posts_created || 0) +
        (behavior!.comments_made || 0);
      
      reliability += Math.min(behaviorDataPoints / 10, 30);
    }
    
    // 3. الحداثة
    const freshness = daysSinceReg < 30 ? 100 : 
                      daysSinceReg < 90 ? 80 :
                      daysSinceReg < 180 ? 60 : 40;
    
    return {
      data_completeness: Math.round(data_completeness),
      reliability: Math.round(reliability),
      freshness
    };
  },

  /**
   * 🔌 Adapter: تحويل البروفايل الغني إلى البروفايل البسيط (للتوافق مع باقي النظام)
   */
  toSimpleProfile: (enriched: EnrichedProfile): PsychologicalProfile => {
    return {
      user_id: enriched.user_id,
      openness: enriched.dimensions.openness.final,
      conscientiousness: enriched.dimensions.conscientiousness.final,
      extraversion: enriched.dimensions.extraversion.final,
      agreeableness: enriched.dimensions.agreeableness.final,
      neuroticism: enriched.dimensions.neuroticism.final,
      created_at: new Date().toISOString() // Or keep original if available
    };
  },

  /**
   * 🎯 حساب التوافق مع الدائرة
   */
  calculateFit: async (userId: string, circleId: string) => {
    const { data, error } = await supabase!
      .rpc('calculate_circle_fit', {
        p_user_id: userId,
        p_circle_id: circleId
      });
    
    if (error) {
      console.error('Error calculating fit:', error);
      return null;
    }
    
    // RPC returns a single row if called this way usually, but it's a set returning function.
    // If it returns an array, take the first element.
    const result = Array.isArray(data) ? data[0] : data;
    
    return {
      alignment_score: Math.round(result.alignment_score || 0),
      complementarity_score: Math.round(result.complementarity_score || 0),
      overall_fit: Math.round(result.overall_fit || 0),
      recommended_role: result.recommended_role as string
    };
  },

  /**
   * 📖 إدارة القاموس النفسي
   */
  getDictionary: async () => {
    const { data, error } = await supabase!
      .from('psychological_keywords_dictionary')
      .select('*')
      .order('created_at', { ascending: false });
    if (error) throw error;
    return data;
  },

  addKeyword: async (keyword: string, trait: string, weight: number = 1.0, category: string = 'general') => {
    const { data, error } = await supabase!
      .from('psychological_keywords_dictionary')
      .insert({ keyword, trait, weight, category })
      .select()
      .single();
    if (error) throw error;
    return data;
  },

  deleteKeyword: async (id: string) => {
    const { error } = await supabase!
      .from('psychological_keywords_dictionary')
      .delete()
      .eq('id', id);
    if (error) throw error;
    return true;
  },

  // ═══════════════════════════════════════════════════════════════
  // 🧠 Archetype & Adaptive Scoring Integration
  // ═══════════════════════════════════════════════════════════════

  /**
   * جلب النمط الشخصي (Archetype) وتعليمات النبرة لمستخدم
   * يُستخدم من الشات لتكييف الردود
   */
  getArchetypeForUser: async (userId: string) => {
    const { data, error } = await supabase!
      .from('user_psychological_profile')
      .select('archetype_primary, archetype_secondary, archetype_tone_instruction, ai_personalization_opt_in')
      .eq('user_id', userId)
      .single();

    if (error || !data) {
      return {
        archetype: null,
        toneInstruction: null,
        hasOptedIn: false,
      };
    }

    return {
      archetype: data.archetype_primary,
      secondary: data.archetype_secondary,
      toneInstruction: data.archetype_tone_instruction,
      hasOptedIn: data.ai_personalization_opt_in ?? false,
    };
  },

  /**
   * تحليل تعليق باستخدام النظام التكيفي الجديد (V2)
   * يستدعي الـ SQL Function مباشرة ويُرجع النتائج
   */
  analyzeCommentAdaptive: async (userId: string, commentText: string) => {
    const { data, error } = await supabase!
      .rpc('apply_comment_to_profile', {
        p_user_id: userId,
        p_comment_text: commentText,
      });

    if (error) {
      console.error('Adaptive comment analysis error:', {
        code: error.code,
        message: error.message,
        hint: error.hint,
      });
      return null;
    }
    return data;
  },

  /**
   * تحديث موافقة الخصوصية (Opt-in/Opt-out)
   */
  setPersonalizationConsent: async (userId: string, optIn: boolean) => {
    const { error } = await supabase!
      .from('user_psychological_profile')
      .update({ ai_personalization_opt_in: optIn })
      .eq('user_id', userId);

    if (error) {
      console.error('Error setting personalization consent:', error);
      return false;
    }
    return true;
  },

  /**
   * جلب إحصائيات استخدام الكلمات لمستخدم (للوحة التحكم)
   */
  getKeywordUsageStats: async (userId: string) => {
    const { data, error } = await supabase!
      .from('keyword_usage_tracker')
      .select('keyword_text, trait, usage_count, total_impact, last_used_at')
      .eq('user_id', userId)
      .order('total_impact', { ascending: false })
      .limit(20);

    if (error) {
      console.error('Error fetching keyword stats:', error);
      return [];
    }
    return data || [];
  },

  /**
   * 🤖 Gemini AI Text Generation
   * استدعاء مباشر لـ Gemini 1.5 Flash
   */
  generateTextWithGemini: async (prompt: string): Promise<string> => {
    try {
      const response = await fetch('/api/ai/gemini', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          prompt,
          config: {
            temperature: 0.7,
            maxOutputTokens: 1000,
          }
        })
      });

      const data = await response.json();
      if (!response.ok) throw new Error(data.error || 'Gemini API Error');
      
      return data.text;
    } catch (error: any) {
      console.error('Gemini Service Error:', error);
      throw error;
    }
  }
};

