import { supabase } from '@/lib/supabase';

export interface PsychologicalProfile {
  user_id: string;
  openness_score: number;
  conscientiousness_score: number;
  extraversion_score: number;
  agreeableness_score: number;
  neuroticism_score: number;
}

export interface CompatibilityResult {
  score: number;
  factors: {
    personality: number;
    interests: number;
    complementarity: number;
  };
}

export interface PostDimensions {
  intellectual: number;   // 0-100
  social: number;         // 0-100
  values: number;         // 0-100
}

export interface Big5Traits {
  openness: number;
  conscientiousness: number;
  extraversion: number;
  agreeableness: number;
  neuroticism: number;
}

export const psychologicalFeatures = {
  /**
   * المشتقات الأساسية (Core Derived Features)
   * تحويل 5 أرقام إلى 8 مؤشرات سلوكية دقيقة
   */
  extractCoreFeatures: (profile: PsychologicalProfile) => {
    const { openness_score: O, conscientiousness_score: C,
            extraversion_score: E, agreeableness_score: A,
            neuroticism_score: N } = profile;
    
    return {
      emotional_stability: 100 - N,
      social_confidence: (E + (100 - N)) / 2,
      empathy_score: (A + (100 - N)) / 2,
      work_ethic: (C + (100 - N)) / 2,
      leadership_potential: (E * C) / 100,
      creativity_index: (O * (100 - C)) / 100,
      adaptability: (O + (100 - C)) / 2,
      conflict_tendency: ((100 - A) + N) / 2
    };
  },
  
  /**
   * تصنيف النمط (Pattern Classification)
   */
  detectArchetype: (profile: PsychologicalProfile) => {
    const { openness_score: O, conscientiousness_score: C,
            extraversion_score: E, agreeableness_score: A,
            neuroticism_score: N } = profile;
    
    if (E > 70 && C > 70) return 'LEADER';
    if (O > 70 && C < 50) return 'INNOVATOR';
    if (A > 75 && N < 40) return 'HARMONIZER';
    if (C > 75 && E < 50) return 'ANALYST';
    if (E > 70 && O > 70) return 'ENTHUSIAST';
    if (C > 70 && A > 70) return 'GUARDIAN';
    if (O > 70 && E < 50) return 'DREAMER';
    if (C > 70 && O < 50) return 'REALIST';
    
    return 'BALANCED';
  },
  
  /**
   * مؤشرات المخاطر (Risk Indicators)
   */
  calculateRiskIndicators: (profile: PsychologicalProfile) => {
    const { neuroticism_score: N, agreeableness_score: A, 
            conscientiousness_score: C } = profile;
    
    return {
      emotional_volatility: N,
      conflict_proneness: 100 - A,
      reliability_concern: 100 - C,
      overall_risk: (N + (100 - A) + (100 - C)) / 3
    };
  }
};

export const zoonMindEngineService = {
  /**
   * جلب البروفايل النفسي للعضو
   */
  getPsychologicalProfile: async (userId: string): Promise<PsychologicalProfile | null> => {
    const { data, error } = await supabase!
      .from('user_psychological_profile')
      .select('user_id, openness, conscientiousness, extraversion, agreeableness, neuroticism')
      .eq('user_id', userId)
      .single();

    if (error || !data) return null;
    
    // Map database field names to interface
    return {
      user_id: data.user_id,
      openness_score: Number(data.openness),
      conscientiousness_score: Number(data.conscientiousness),
      extraversion_score: Number(data.extraversion),
      agreeableness_score: Number(data.agreeableness),
      neuroticism_score: Number(data.neuroticism)
    };
  },

  /**
   * خوارزمية حساب التوافق الذكي المتقدمة
   */
  calculateCompatibility: (profileA: PsychologicalProfile, profileB: PsychologicalProfile): CompatibilityResult => {
    // 1. الميزات المشتقة
    const featuresA = psychologicalFeatures.extractCoreFeatures(profileA);
    const featuresB = psychologicalFeatures.extractCoreFeatures(profileB);
    
    // 2. حساب تقارب الشخصية (Similarity)
    const traits = ['openness_score', 'conscientiousness_score', 'extraversion_score', 'agreeableness_score', 'neuroticism_score'] as const;
    let totalDiff = 0;
    traits.forEach(trait => totalDiff += Math.abs(profileA[trait] - profileB[trait]));
    const personalityScore = Math.max(0, 100 - (totalDiff / traits.length));

    // 3. حساب التكامل المهني (Leadership vs Analysis etc)
    const archA = psychologicalFeatures.detectArchetype(profileA);
    const archB = psychologicalFeatures.detectArchetype(profileB);
    
    let synergyBonus = 0;
    // توافق الأنماط الشهير (Leader + Analyst = Success)
    if ((archA === 'LEADER' && archB === 'ANALYST') || (archB === 'LEADER' && archA === 'ANALYST')) synergyBonus = 15;
    if ((archA === 'INNOVATOR' && archB === 'REALIST') || (archB === 'INNOVATOR' && archA === 'REALIST')) synergyBonus = 20;
    if ((archA === 'HARMONIZER' && archB === 'ENTHUSIAST') || (archB === 'HARMONIZER' && archA === 'ENTHUSIAST')) synergyBonus = 10;

    // 4. مؤشر التكامل العملي (Complementarity)
    const complementarity = 100 - (Math.abs(featuresA.work_ethic - featuresB.work_ethic) + Math.abs(featuresA.social_confidence - featuresB.social_confidence)) / 4;

    // 5. النتيجة النهائية الموزونة
    const finalScore = Math.floor(
      Math.min(100, (personalityScore * 0.5) + (complementarity * 0.3) + synergyBonus)
    );

    return {
      score: finalScore,
      factors: {
        personality: Math.floor(personalityScore),
        interests: 75,
        complementarity: Math.floor(complementarity + synergyBonus)
      }
    };
  },

  /**
   * حفظ أو تحديث نسبة التوافق في قاعدة البيانات
   */
  saveCompatibility: async (memberAId: string, memberBId: string, result: CompatibilityResult) => {
    const [firstId, secondId] = [memberAId, memberBId].sort();
    const { error } = await supabase!
      .from('zones_member_compatibility')
      .upsert({
        member_a_id: firstId,
        member_b_id: secondId,
        compatibility_score: result.score,
        compatibility_factors: result.factors,
        updated_at: new Date().toISOString()
      });
    if (error) console.error('Error saving compatibility:', error);
  },

  /**
   * جلب درجة التوافق من قاعدة البيانات أو حسابها فوراً إذا لم توجد
   */
  getOrCalculateCompatibility: async (memberAId: string, memberBId: string): Promise<number> => {
    const [firstId, secondId] = [memberAId, memberBId].sort();
    const { data: cached } = await supabase!
      .from('zones_member_compatibility')
      .select('compatibility_score')
      .eq('member_a_id', firstId)
      .eq('member_b_id', secondId)
      .single();

    if (cached) return cached.compatibility_score;

    const [profileA, profileB] = await Promise.all([
      zoonMindEngineService.getPsychologicalProfile(memberAId),
      zoonMindEngineService.getPsychologicalProfile(memberBId)
    ]);

    if (!profileA || !profileB) return 50;

    const result = zoonMindEngineService.calculateCompatibility(profileA, profileB);
    zoonMindEngineService.saveCompatibility(memberAId, memberBId, result).catch(console.error);
    return result.score;
  },

  /**
   * تحليل توازن مجموعة من الأعضاء (دائرة)
   * يعطي مؤشرات عن طبيعة الدائرة: هل هي مبتكرة؟ قيادية؟ اجتماعية؟
   */
   calculateGroupHarmony: (profiles: PsychologicalProfile[]): GroupHarmonyAnalysis => {
    // حالة الدائرة الفارغة أو الجديدة
    if (profiles.length === 0) return {
      harmonyScore: 100, // طاقة كامنة كاملة
      dominantArchetype: 'POTENTIAL', // إمكانية، وليست فراغاً
      energySpectrum: { innovation: 50, execution: 50, cohesion: 50, stability: 50 },
      emotionalDensity: 0
    };

    // 1. حساب المتوسطات
    const avgTraits = {
      O: profiles.reduce((sum, p) => sum + p.openness_score, 0) / profiles.length,
      C: profiles.reduce((sum, p) => sum + p.conscientiousness_score, 0) / profiles.length,
      E: profiles.reduce((sum, p) => sum + p.extraversion_score, 0) / profiles.length,
      A: profiles.reduce((sum, p) => sum + p.agreeableness_score, 0) / profiles.length,
      N: profiles.reduce((sum, p) => sum + p.neuroticism_score, 0) / profiles.length,
    };

    // 2. تحليل الطيف الطاقي
    const spectrum = {
      innovation: (avgTraits.O * 0.7) + (avgTraits.E * 0.3), // ابتكار
      execution: (avgTraits.C * 0.8) + (100 - avgTraits.N) * 0.2, // تنفيذ
      cohesion: (avgTraits.A * 0.6) + (avgTraits.E * 0.4), // تماسك
      stability: (100 - avgTraits.N) // استقرار
    };

    // 3. تحديد النمط السائد للمجموعة
    let dominant = 'BALANCED';
    // Cold Start Check: إذا كانت القيم كلها متساوية (الافتراضية 50)، نعتبرها متوازنة لكن بنتيجة جيدة
    const isColdStart = profiles.every(p => p.openness_score === 50 && p.conscientiousness_score === 50);
    
    if (isColdStart) {
        dominant = 'BALANCED';
        spectrum.cohesion = 75; // دفعة تشجيعية للبداية
    } else {
        if (spectrum.innovation > 70) dominant = 'CREATIVE_HUB';
        else if (spectrum.execution > 70) dominant = 'POWERHOUSE';
        else if (spectrum.cohesion > 70) dominant = 'COMMUNITY';
        else if (spectrum.stability < 40) dominant = 'VOLATILE';
    }

    // 4. حساب درجة هارموني المجموعة (مدى تنوعها وتكاملها)
    // التنوع المعتدل جيد، التطرف سيء
    const nScores = profiles.map(p => p.neuroticism_score);
    const diversityPenalty = Math.max(0, profiles.length > 3 ? (Math.max(...nScores) - Math.min(...nScores)) : 0);
    const harmonyScore = Math.floor(Math.min(100, spectrum.cohesion - (diversityPenalty * 0.3))); // خففنا العقوبة قليلاً

    return {
      harmonyScore,
      dominantArchetype: dominant,
      energySpectrum: {
        innovation: Math.floor(spectrum.innovation),
        execution: Math.floor(spectrum.execution),
        cohesion: Math.floor(spectrum.cohesion),
        stability: Math.floor(spectrum.stability)
      },
      emotionalDensity: Math.floor(avgTraits.E + avgTraits.N) / 2
    };
  },

  /**
   * محاكاة بروفايل نفسي بناءً على نمط مستهدف
   * تُستخدم لأغراض الاختبار وتوليد شخصيات افتراضية
   */
  simulateProfile: (userId: string, targetArchetype: string): PsychologicalProfile => {
    // توليد قيم عشوائية ضمن نطاق معين (min, max)
    const rand = (min: number, max: number) => Math.floor(Math.random() * (max - min + 1)) + min;
    
    let profile: PsychologicalProfile = {
      user_id: userId,
      openness_score: 50,
      conscientiousness_score: 50,
      extraversion_score: 50,
      agreeableness_score: 50,
      neuroticism_score: 50
    };

    switch (targetArchetype) {
      case 'LEADER':
        profile = { ...profile, extraversion_score: rand(75, 95), conscientiousness_score: rand(70, 90), neuroticism_score: rand(10, 40) };
        break;
      case 'INNOVATOR':
        profile = { ...profile, openness_score: rand(80, 100), conscientiousness_score: rand(30, 60), extraversion_score: rand(60, 80) };
        break;
      case 'ANALYST':
        profile = { ...profile, conscientiousness_score: rand(80, 95), extraversion_score: rand(20, 50), openness_score: rand(40, 70) };
        break;
      case 'HARMONIZER':
        profile = { ...profile, agreeableness_score: rand(80, 100), neuroticism_score: rand(10, 30), extraversion_score: rand(40, 70) };
        break;
      case 'ENTHUSIAST':
        profile = { ...profile, extraversion_score: rand(80, 100), openness_score: rand(70, 90), conscientiousness_score: rand(30, 60) };
        break;
      case 'REALIST':
        profile = { ...profile, conscientiousness_score: rand(70, 90), openness_score: rand(20, 45), agreeableness_score: rand(50, 70) };
        break;
      default: // BALANCED
        profile = { ...profile, openness_score: rand(45, 65), conscientiousness_score: rand(45, 65), extraversion_score: rand(45, 65), agreeableness_score: rand(45, 65), neuroticism_score: rand(45, 65) };
    }
    return profile;
  },

  /**
   * 🗺️ تحويل أبعاد المنشور إلى سمات Big Five (V2.2 Logic)
   */
  mapDimensionsToTraits: (dimensions: PostDimensions): Big5Traits => {
    return {
      // 🧠 الفكري → الانفتاح والضمير
      openness: dimensions.intellectual,
      conscientiousness: dimensions.intellectual * 0.7,
      
      // 🤝 الاجتماعي → الانبساط والوفاق
      extraversion: dimensions.social,
      agreeableness: dimensions.social * 0.8,
      
      // 💡 القيمي → الاستقرار العاطفي
      neuroticism: Math.max(0, 100 - dimensions.values)
    };
  },

  /**
   * 🔥 خوارزمية حساب التأثير السياقي (The Contextual Impact Algorithm)
   */
  calculateContextualImpact: (
    baseWeights: Big5Traits,
    postDimensions: PostDimensions
  ): Big5Traits => {
    const postTraits = zoonMindEngineService.mapDimensionsToTraits(postDimensions);
    
    return {
      openness: baseWeights.openness * (postTraits.openness / 100),
      conscientiousness: baseWeights.conscientiousness * (postTraits.conscientiousness / 100),
      extraversion: baseWeights.extraversion * (postTraits.extraversion / 100),
      agreeableness: baseWeights.agreeableness * (postTraits.agreeableness / 100),
      neuroticism: baseWeights.neuroticism * (postTraits.neuroticism / 100)
    };
  },

  /**
   * 📊 تسجيل التأثير النفسي في السجل التراكمي
   */
  logPsychologicalImpact: async (userId: string, impact: Big5Traits, sourceId: string, sourceType: string = 'reaction', contextData: any = {}) => {
    const { error } = await supabase!
      .from('psychological_impact_log')
      .insert({
        user_id: userId,
        openness_delta: impact.openness,
        conscientiousness_delta: impact.conscientiousness,
        extraversion_delta: impact.extraversion,
        agreeableness_delta: impact.agreeableness,
        neuroticism_delta: impact.neuroticism,
        source_type: sourceType,
        source_id: sourceId,
        context_data: contextData
      });
    
    if (error) console.error('Error logging psychological impact:', error);
  },

  /**
   * 🛠️ جلب أوزان الـ Bazzzz من قاعدة البيانات
   */
  getBazzzzTypeWeights: async (bazzzzTypeId: string): Promise<Big5Traits | null> => {
    const { data, error } = await supabase!
      .from('zoon_bazzzz_types')
      .select('psychological_impact')
      .eq('id', bazzzzTypeId)
      .single();
    
    if (error || !data) return null;
    return data.psychological_impact as Big5Traits;
  },

  /**
   * ⚡ العملية الكبرى: معالجة تأثير التفاعل بالكامل (Interaction Pipeline)
   */
  processInteractionImpact: async (userId: string, postId: string, bazzzzTypeId: string) => {
    try {
      // 1. جلب بيانات المنشور (الأبعاد)
      const { data: post, error: postErr } = await supabase!
        .from('zoon_posts')
        .select('intellectual_pct, social_pct, values_pct')
        .eq('id', postId)
        .single();
      
      if (postErr || !post) return;

      // 2. جلب أوزان التفاعل
      const baseWeights = await zoonMindEngineService.getBazzzzTypeWeights(bazzzzTypeId);
      if (!baseWeights) return;

      // 3. حساب التأثير السياقي (Contextual Impact)
      const postDimensions: PostDimensions = {
        intellectual: post.intellectual_pct,
        social: post.social_pct,
        values: post.values_pct
      };

      const finalImpact = zoonMindEngineService.calculateContextualImpact(baseWeights, postDimensions);

      // 4. تسجيل التأثير
      await zoonMindEngineService.logPsychologicalImpact(
        userId, 
        finalImpact, 
        postId, 
        'reaction',
        { bazzzz_type_id: bazzzzTypeId, post_dimensions: postDimensions }
      );

    } catch (err) {
      console.error('Error in interaction pipeline:', err);
    }
  }
};

export interface GroupHarmonyAnalysis {
  harmonyScore: number;
  dominantArchetype: string;
  energySpectrum: {
    innovation: number;
    execution: number;
    cohesion: number;
    stability: number;
  };
  emotionalDensity: number;
}
