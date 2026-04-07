// ═══════════════════════════════════════════════════════════════
// ملف: archetypeEngine.service.ts
// الوصف: محرك النماذج الشخصية + كشف التحول العاطفي
// التاريخ: 2026-02-18
// ═══════════════════════════════════════════════════════════════

import { createClient } from '@/lib/supabase/client';

const supabase = createClient();

// ═══════════════════════════════════════════════════════════════
// الأنواع (Types)
// ═══════════════════════════════════════════════════════════════

export type ArchetypeName = 'strategist' | 'operator' | 'connector' | 'creator' | 'stabilizer';

export interface ArchetypeResult {
  primary: ArchetypeName;
  secondary: ArchetypeName;
  scores: Record<ArchetypeName, number>;
  toneInstruction: string;
  toneKeywords: {
    greetingStyle: string;
    emojiLevel: 'none' | 'minimal' | 'moderate' | 'heavy';
    responseLength: 'short' | 'medium' | 'detailed';
    formalityLevel: 'formal' | 'semi-formal' | 'casual';
  };
}

export type MoodLevel = 'very_positive' | 'positive' | 'neutral' | 'negative' | 'very_negative';

export interface MoodSnapshot {
  mood: MoodLevel;
  confidence: number;
  dominantEmotion: string;
  shouldOverrideTone: boolean;
  overrideToneInstruction?: string;
}

export interface SessionToneState {
  baseTone: string;
  currentTone: string;
  archetype: ArchetypeName;
  moodHistory: MoodLevel[];
  lastCheckedAt: number;
  shiftDetected: boolean;
}

// ═══════════════════════════════════════════════════════════════
// ثوابت النبرة لكل نمط (Archetype Tone Configs)
// ═══════════════════════════════════════════════════════════════

const ARCHETYPE_TONE_CONFIG: Record<ArchetypeName, ArchetypeResult['toneKeywords']> = {
  strategist: {
    greetingStyle: 'أهلاً بك',
    emojiLevel: 'minimal',
    responseLength: 'detailed',
    formalityLevel: 'formal',
  },
  operator: {
    greetingStyle: 'أهلاً',
    emojiLevel: 'none',
    responseLength: 'short',
    formalityLevel: 'semi-formal',
  },
  connector: {
    greetingStyle: 'يا أهلاً وسهلاً! 😊',
    emojiLevel: 'heavy',
    responseLength: 'medium',
    formalityLevel: 'casual',
  },
  creator: {
    greetingStyle: 'أهلاً يا مبدع ✨',
    emojiLevel: 'moderate',
    responseLength: 'medium',
    formalityLevel: 'casual',
  },
  stabilizer: {
    greetingStyle: 'أهلاً بك، نورتنا',
    emojiLevel: 'minimal',
    responseLength: 'detailed',
    formalityLevel: 'semi-formal',
  },
};

const ARCHETYPE_TONE_INSTRUCTIONS: Record<ArchetypeName, string> = {
  strategist: 'User Archetype: Strategist. Tone: Formal, analytical. Focus on vision, data, and future plans. Use structured responses.',
  operator: 'User Archetype: Operator. Tone: Direct, concise, practical. Focus on steps and results. Keep responses short.',
  connector: 'User Archetype: Connector. Tone: Warm, enthusiastic, social. Use emojis freely. Ask about their community.',
  creator: 'User Archetype: Creator. Tone: Inspiring, unconventional. Encourage new ideas. Be creative in responses.',
  stabilizer: 'User Archetype: Stabilizer. Tone: Calm, reassuring. Use phrases like "لا تقلق" and "نحن معك". Be gentle.',
};

// ═══════════════════════════════════════════════════════════════
// كلمات كشف المزاج اللحظي (Mood Detection Keywords)
// ═══════════════════════════════════════════════════════════════

const MOOD_KEYWORDS: Record<MoodLevel, string[]> = {
  very_positive: ['ممتاز', 'رائع جداً', 'أحسن حاجة', 'عظيم', 'مبهر', 'فوق الوصف'],
  positive: ['شكراً', 'رائع', 'حلو', 'كويس', 'تمام', 'جميل', 'أتفق', 'ممتنّ'],
  neutral: ['طيب', 'اوكي', 'ماشي', 'فاهم', 'تقريباً', 'يعني'],
  negative: ['مش كويس', 'زعلان', 'محبط', 'مش عاجبني', 'صعب', 'مشكلة', 'مفيش فايدة'],
  very_negative: ['أسوأ', 'كارثة', 'مستحيل', 'بكره', 'محدش بيرد', 'ضايع', 'غير مقبول'],
};

const MOOD_OVERRIDE_TONES: Record<MoodLevel, string | null> = {
  very_positive: null, // لا تغيير - النبرة الأصلية كافية
  positive: null,
  neutral: null,
  negative: 'MOOD OVERRIDE: User seems frustrated. Switch to empathetic and reassuring tone. Acknowledge their concern first, then help.',
  very_negative: 'MOOD OVERRIDE: User is very upset. Be extra gentle, apologize for any inconvenience, offer direct solutions. No jokes or emojis.',
};

// ═══════════════════════════════════════════════════════════════
// الخدمة الرئيسية
// ═══════════════════════════════════════════════════════════════

export const archetypeEngine = {

  // ─────────────────────────────────────────────────────────────
  // 1. حساب النمط من الأرقام (Client-Side)
  // ─────────────────────────────────────────────────────────────
  calculateArchetype(profile: {
    openness: number;
    conscientiousness: number;
    extraversion: number;
    agreeableness: number;
    neuroticism: number;
  }): ArchetypeResult {
    const { openness: O, conscientiousness: C, extraversion: E, agreeableness: A, neuroticism: N } = profile;

    const scores: Record<ArchetypeName, number> = {
      strategist: O * 0.5 + C * 0.5,
      operator: C * 0.7 + (100 - O) * 0.3,
      connector: E * 0.5 + A * 0.5,
      creator: O * 0.6 + (100 - C) * 0.4,
      stabilizer: (100 - N) * 0.5 + A * 0.5,
    };

    const sorted = Object.entries(scores).sort(([, a], [, b]) => b - a);
    const primary = sorted[0][0] as ArchetypeName;
    const secondary = sorted[1][0] as ArchetypeName;

    return {
      primary,
      secondary,
      scores,
      toneInstruction: ARCHETYPE_TONE_INSTRUCTIONS[primary],
      toneKeywords: ARCHETYPE_TONE_CONFIG[primary],
    };
  },

  // ─────────────────────────────────────────────────────────────
  // 2. جلب النبرة المخزنة من قاعدة البيانات 
  // ─────────────────────────────────────────────────────────────
  async getUserTone(userId: string): Promise<{
    archetype: ArchetypeName | null;
    toneInstruction: string | null;
    hasOptedIn: boolean;
  }> {
    const { data, error } = await supabase
      .from('user_psychological_profile')
      .select('archetype_primary, archetype_tone_instruction, ai_personalization_opt_in')
      .eq('user_id', userId)
      .single();

    if (error || !data) {
      return { archetype: null, toneInstruction: null, hasOptedIn: false };
    }

    return {
      archetype: data.archetype_primary as ArchetypeName | null,
      toneInstruction: data.archetype_tone_instruction,
      hasOptedIn: data.ai_personalization_opt_in ?? false,
    };
  },

  // ─────────────────────────────────────────────────────────────
  // 3. تحديث موافقة الخصوصية
  // ─────────────────────────────────────────────────────────────
  async setPersonalizationOptIn(userId: string, optIn: boolean): Promise<boolean> {
    const { error } = await supabase
      .from('user_psychological_profile')
      .update({ ai_personalization_opt_in: optIn })
      .eq('user_id', userId);

    return !error;
  },

  // ─────────────────────────────────────────────────────────────
  // 4. 🔥 كشف التحول العاطفي (Emotional Shift Detection)
  // يعمل على آخر 3 رسائل فقط لتوفير الـ Tokens
  // ─────────────────────────────────────────────────────────────
  detectMoodShift(recentMessages: string[]): MoodSnapshot {
    const last3 = recentMessages.slice(-3);
    const moodScores: Record<MoodLevel, number> = {
      very_positive: 0,
      positive: 0,
      neutral: 0,
      negative: 0,
      very_negative: 0,
    };

    // حساب درجة كل مزاج
    for (const message of last3) {
      const lowerMsg = message.toLowerCase();
      for (const [mood, keywords] of Object.entries(MOOD_KEYWORDS)) {
        for (const keyword of keywords) {
          if (lowerMsg.includes(keyword)) {
            moodScores[mood as MoodLevel] += 1;
          }
        }
      }
    }

    // تحديد المزاج الغالب
    const sorted = Object.entries(moodScores).sort(([, a], [, b]) => b - a);
    const dominant = sorted[0];
    const totalHits = Object.values(moodScores).reduce((a, b) => a + b, 0);
    
    const mood = (totalHits > 0 ? dominant[0] : 'neutral') as MoodLevel;
    const confidence = totalHits > 0 ? Math.min(100, Math.round((dominant[1] / totalHits) * 100)) : 30;

    const shouldOverride = mood === 'negative' || mood === 'very_negative';
    const overrideInstruction = MOOD_OVERRIDE_TONES[mood];

    const emotionMap: Record<MoodLevel, string> = {
      very_positive: 'حماس شديد',
      positive: 'إيجابية',
      neutral: 'محايد',
      negative: 'إحباط',
      very_negative: 'غضب/حزن',
    };

    return {
      mood,
      confidence,
      dominantEmotion: emotionMap[mood],
      shouldOverrideTone: shouldOverride,
      overrideToneInstruction: overrideInstruction ?? undefined,
    };
  },

  // ─────────────────────────────────────────────────────────────
  // 5. 🧠 بناء الـ System Prompt النهائي لـ Gemini
  // يجمع بين النمط الثابت والمزاج اللحظي
  // ─────────────────────────────────────────────────────────────
  buildSystemPrompt(params: {
    baseToneInstruction: string;
    moodSnapshot: MoodSnapshot | null;
    hasOptedIn: boolean;
    userName?: string;
  }): string {
    // بدون موافقة = رد عام بدون تخصيص
    if (!params.hasOptedIn) {
      return 'أنت مساعد ذكي ودود لتطبيق كارمش لإدارة المخلفات في حي محرم بك بالإسكندرية. أجب بالعامية المصرية باختصار واحترام.';
    }

    let prompt = `أنت مساعد ذكي لتطبيق كارمش في حي محرم بك. `;
    prompt += `${params.baseToneInstruction} `;

    if (params.userName) {
      prompt += `اسم المستخدم: ${params.userName}. `;
    }

    // لو فيه تحول عاطفي - يأخذ الأولوية
    if (params.moodSnapshot?.shouldOverrideTone && params.moodSnapshot.overrideToneInstruction) {
      prompt += `\n\n⚠️ ${params.moodSnapshot.overrideToneInstruction}`;
    }

    prompt += '\n\nأجب بالعامية المصرية. كن مختصراً ومفيداً.';

    return prompt;
  },

  // ─────────────────────────────────────────────────────────────
  // 6. إدارة حالة الجلسة (Session State)
  // ─────────────────────────────────────────────────────────────
  createSessionState(archetype: ArchetypeName, baseTone: string): SessionToneState {
    return {
      baseTone,
      currentTone: baseTone,
      archetype,
      moodHistory: [],
      lastCheckedAt: Date.now(),
      shiftDetected: false,
    };
  },

  updateSessionWithMessages(session: SessionToneState, messages: string[]): SessionToneState {
    const moodSnapshot = this.detectMoodShift(messages);
    
    const newSession = { ...session };
    newSession.moodHistory.push(moodSnapshot.mood);
    newSession.lastCheckedAt = Date.now();

    if (moodSnapshot.shouldOverrideTone) {
      newSession.shiftDetected = true;
      newSession.currentTone = moodSnapshot.overrideToneInstruction || session.baseTone;
    } else {
      newSession.shiftDetected = false;
      newSession.currentTone = session.baseTone;
    }

    return newSession;
  },

  // ─────────────────────────────────────────────────────────────
  // 7. جلب إحصائيات الكلمات لمستخدم (للوحة التحكم)
  // ─────────────────────────────────────────────────────────────
  async getKeywordUsageStats(userId: string) {
    const { data, error } = await supabase
      .from('keyword_usage_tracker')
      .select('keyword_text, trait, usage_count, total_impact, last_used_at')
      .eq('user_id', userId)
      .order('total_impact', { ascending: false })
      .limit(20);

    if (error) {
      console.error('Error fetching keyword usage stats:', error);
      return [];
    }
    return data || [];
  },
};
