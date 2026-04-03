import { supabase } from '@/lib/supabase';
import { ZoonCircle } from './zoonClubService';
import { EnrichedProfile } from './zoonAdvancedPsychologicalEngine.service.ts';

export const zoonMatchingService = {
  /**
   * حساب نسبة التوافق بين المستخدم ودائرة برمجية معينة
   */
  calculateMatchScore: (profile: EnrichedProfile, circle: ZoonCircle): number => {
    const weights = circle.matching_weights || {};
    let totalScore = 0;
    let totalWeight = 0;

    // 1. حساب المطابقة النفسية (Big Five)
    const traits = ['openness', 'conscientiousness', 'extraversion', 'agreeableness', 'neuroticism'];
    traits.forEach(trait => {
        const weight = weights[trait] || 0;
        if (weight > 0) {
            // قارن قيمة المستخدم في هذا البعد مع الوزن (هنا نفترض نموذجاً بسيطاً للمطابقة)
            // في الواقع، قد يكون المطابقة هي أن الدائرة "تستهدف" قيمة معينة، 
            // لكن هنا سنفترض أن الوزن العالي يعني أن هذه السمة مهمة جداً للانتماء.
            const userValue = (profile.dimensions as any)[trait]?.final || 50;
            const diff = 100 - Math.abs(userValue - 80); // مثال: الدوائر النشطة تستهدف سكور عالي
            totalScore += (diff * weight);
            totalWeight += weight;
        }
    });

    // 2. معايير إضافية (الاهتمامات، السلوك)
    const socialFactors = ['interests', 'behavioral_score'];
    socialFactors.forEach(factor => {
        const weight = weights[factor] || 0;
        if (weight > 0) {
            const userValue = 70; // قيمة افتراضية حتى نربطها بمحرك السلوك
            totalScore += (userValue * weight);
            totalWeight += weight;
        }
    });

    const finalScore = totalWeight > 0 ? Math.round(totalScore / totalWeight) : 50;
    return Math.min(finalScore, 100);
  },

  /**
   * جلب أفضل المقترحات للمستخدم في غرفة معينة
   */
  getSuggestedCircles: async (userId: string, roomId: string, profile: EnrichedProfile) => {
    const { data: circles, error } = await supabase!
      .from('scope_circles')
      .select('*')
      .eq('room_id', roomId);

    if (error || !circles) return [];

    const scoredCircles = circles.map(circle => ({
      ...circle,
      match_score: zoonMatchingService.calculateMatchScore(profile, circle)
    }));

    // ترتيب حسب الأعلى توافقاً
    return scoredCircles.sort((a, b) => b.match_score - a.match_score).slice(0, 3);
  }
};
