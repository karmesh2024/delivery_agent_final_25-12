-- ═══════════════════════════════════════════════════════════════
-- Migration: Adaptive Scoring V5.2 (Production-Grade)
-- Fixes: EXP decay, per-event tracking, data threshold,
--        secondary tone blend, search_path, GIN index
-- Date: 2026-02-18
-- ═══════════════════════════════════════════════════════════════

-- ───────────────────────────────────────────────────────────────
-- PART 1: جدول تتبع تكرار الكلمات (Keyword Usage Tracker)
-- يمنع الانحراف عبر "التناقص التدريجي"
-- ───────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS keyword_usage_tracker (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    keyword_id UUID REFERENCES psychological_keywords_dictionary(id) ON DELETE CASCADE,
    keyword_text TEXT NOT NULL,
    trait TEXT NOT NULL,
    usage_count INTEGER DEFAULT 1,
    total_impact DECIMAL(8,4) DEFAULT 0,
    last_used_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(user_id, keyword_text)
);

CREATE INDEX IF NOT EXISTS idx_keyword_tracker_user ON keyword_usage_tracker(user_id);
CREATE INDEX IF NOT EXISTS idx_keyword_tracker_keyword ON keyword_usage_tracker(keyword_text);
CREATE INDEX IF NOT EXISTS idx_keyword_tracker_last_used ON keyword_usage_tracker(last_used_at DESC);

-- ───────────────────────────────────────────────────────────────
-- PART 1B: جدول أحداث التأثير (لحساب Time Decay حقيقي)
-- كل حدث = سطر منفصل بدل التراكم فقط
-- ───────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS keyword_impact_events (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    keyword_text TEXT NOT NULL,
    trait TEXT NOT NULL,
    impact DECIMAL(8,4) NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_impact_events_user_time
    ON keyword_impact_events(user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_impact_events_trait
    ON keyword_impact_events(trait, created_at DESC);

-- ───────────────────────────────────────────────────────────────
-- PART 1C: GIN Index لتسريع البحث بدل regex loop
-- ───────────────────────────────────────────────────────────────
ALTER TABLE psychological_keywords_dictionary
    ADD COLUMN IF NOT EXISTS keyword_tsv TSVECTOR;

-- تحديث الـ tsvector للكلمات الموجودة
UPDATE psychological_keywords_dictionary SET keyword_tsv = to_tsvector('simple', keyword)
    WHERE keyword_tsv IS NULL;

CREATE INDEX IF NOT EXISTS idx_dictionary_tsv
    ON psychological_keywords_dictionary USING GIN(keyword_tsv);

-- ───────────────────────────────────────────────────────────────
-- PART 2: حقل الموافقة على التخصيص (Privacy Opt-In)
-- ───────────────────────────────────────────────────────────────
ALTER TABLE user_psychological_profile
ADD COLUMN IF NOT EXISTS ai_personalization_opt_in BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS archetype_primary TEXT,
ADD COLUMN IF NOT EXISTS archetype_secondary TEXT,
ADD COLUMN IF NOT EXISTS archetype_tone_instruction TEXT;

-- ───────────────────────────────────────────────────────────────
-- PART 3: وظيفة التحليل المتطورة (Diminishing Returns)
-- تستبدل analyze_comment_psychology القديمة بالكامل
-- ───────────────────────────────────────────────────────────────
CREATE OR REPLACE FUNCTION analyze_comment_psychology_v2(
    p_user_id UUID,
    p_comment_text TEXT
)
RETURNS JSONB AS $$
DECLARE
    v_keyword RECORD;
    v_usage RECORD;
    v_raw_weight DECIMAL;
    v_actual_impact DECIMAL;
    v_current_count INTEGER;
    v_openness DECIMAL := 0;
    v_conscientiousness DECIMAL := 0;
    v_extraversion DECIMAL := 0;
    v_agreeableness DECIMAL := 0;
    v_neuroticism DECIMAL := 0;
    v_total_keywords_found INTEGER := 0;
    v_ceiling_cap CONSTANT DECIMAL := 15.0;
BEGIN
    -- التمرير على كل كلمة في القاموس الديناميكي
    FOR v_keyword IN
        SELECT id, keyword, trait, weight, category
        FROM psychological_keywords_dictionary
        WHERE p_comment_text ~* keyword
    LOOP
        v_total_keywords_found := v_total_keywords_found + 1;

        -- الخطوة 1: جلب/إنشاء سجل الاستخدام لهذا المستخدم + الكلمة
        SELECT * INTO v_usage
        FROM keyword_usage_tracker
        WHERE user_id = p_user_id AND keyword_text = v_keyword.keyword;

        IF v_usage IS NULL THEN
            v_current_count := 0;
        ELSE
            v_current_count := v_usage.usage_count;
        END IF;

        -- الخطوة 2: 🔥 EXP Decay (أسرع وأنعم من linear)
        -- impact = base_weight × EXP(-count × 0.25)
        v_raw_weight := v_keyword.weight;
        v_actual_impact := v_raw_weight * EXP(-v_current_count * 0.25);

        -- الخطوة 3: Ceiling Cap - لا يتجاوز المجموع 15 نقطة من مصدر واحد
        IF v_usage IS NOT NULL AND v_usage.total_impact >= v_ceiling_cap THEN
            v_actual_impact := 0; -- تشبع كامل
        ELSIF v_usage IS NOT NULL AND (v_usage.total_impact + v_actual_impact) > v_ceiling_cap THEN
            v_actual_impact := v_ceiling_cap - v_usage.total_impact; -- ملء الباقي فقط
        END IF;

        -- الخطوة 4: تحديث المتتبع (تراكمي)
        INSERT INTO keyword_usage_tracker (user_id, keyword_id, keyword_text, trait, usage_count, total_impact)
        VALUES (p_user_id, v_keyword.id, v_keyword.keyword, v_keyword.trait, 1, v_actual_impact)
        ON CONFLICT (user_id, keyword_text) DO UPDATE SET
            usage_count = keyword_usage_tracker.usage_count + 1,
            total_impact = keyword_usage_tracker.total_impact + v_actual_impact,
            last_used_at = NOW();

        -- الخطوة 4B: تسجيل الحدث المنفصل (للـ Time Decay الحقيقي)
        INSERT INTO keyword_impact_events (user_id, keyword_text, trait, impact)
        VALUES (p_user_id, v_keyword.keyword, v_keyword.trait, v_actual_impact);

        -- الخطوة 5: توزيع التأثير على السمة المناسبة
        CASE v_keyword.trait
            WHEN 'openness' THEN v_openness := v_openness + v_actual_impact;
            WHEN 'conscientiousness' THEN v_conscientiousness := v_conscientiousness + v_actual_impact;
            WHEN 'extraversion' THEN v_extraversion := v_extraversion + v_actual_impact;
            WHEN 'agreeableness' THEN v_agreeableness := v_agreeableness + v_actual_impact;
            WHEN 'neuroticism' THEN v_neuroticism := v_neuroticism + v_actual_impact;
        END CASE;
    END LOOP;

    RETURN jsonb_build_object(
        'openness', ROUND(v_openness::NUMERIC, 3),
        'conscientiousness', ROUND(v_conscientiousness::NUMERIC, 3),
        'extraversion', ROUND(v_extraversion::NUMERIC, 3),
        'agreeableness', ROUND(v_agreeableness::NUMERIC, 3),
        'neuroticism', ROUND(v_neuroticism::NUMERIC, 3),
        'keywords_found', v_total_keywords_found,
        'scoring_model', 'exp_decay_v5.2'
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- ───────────────────────────────────────────────────────────────
-- PART 4: تحديث الملف النفسي بالنتائج
-- ───────────────────────────────────────────────────────────────
CREATE OR REPLACE FUNCTION apply_comment_to_profile(
    p_user_id UUID,
    p_comment_text TEXT
)
RETURNS JSONB AS $$
DECLARE
    v_analysis JSONB;
BEGIN
    -- تحليل التعليق
    v_analysis := analyze_comment_psychology_v2(p_user_id, p_comment_text);

    -- تحديث الملف النفسي مع ضمان عدم تجاوز 0-100
    UPDATE user_psychological_profile SET
        openness = LEAST(100, GREATEST(0, openness + COALESCE((v_analysis->>'openness')::DECIMAL, 0))),
        conscientiousness = LEAST(100, GREATEST(0, conscientiousness + COALESCE((v_analysis->>'conscientiousness')::DECIMAL, 0))),
        extraversion = LEAST(100, GREATEST(0, extraversion + COALESCE((v_analysis->>'extraversion')::DECIMAL, 0))),
        agreeableness = LEAST(100, GREATEST(0, agreeableness + COALESCE((v_analysis->>'agreeableness')::DECIMAL, 0))),
        neuroticism = LEAST(100, GREATEST(0, neuroticism + COALESCE((v_analysis->>'neuroticism')::DECIMAL, 0))),
        updated_at = NOW()
    WHERE user_id = p_user_id;

    -- تحديث النمط الشخصي (Archetype)
    PERFORM update_user_archetype(p_user_id);

    RETURN v_analysis;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- ───────────────────────────────────────────────────────────────
-- PART 5: حساب النمط الشخصي مع Time Decay (Archetype Mapper)
-- التفاعلات الأخيرة (30 يوم) لها وزن أعلى من القديمة
-- ───────────────────────────────────────────────────────────────
CREATE OR REPLACE FUNCTION update_user_archetype(p_user_id UUID)
RETURNS VOID AS $$
DECLARE
    v_profile RECORD;
    v_recent_bias RECORD;
    v_total_events INTEGER;
    v_primary TEXT;
    v_secondary TEXT;
    v_primary_tone TEXT;
    v_secondary_tone TEXT;
    v_tone TEXT;
    v_scores JSONB;
    v_sorted RECORD;
    v_O DECIMAL; v_C DECIMAL; v_E DECIMAL; v_A DECIMAL; v_N DECIMAL;
BEGIN
    SELECT * INTO v_profile FROM user_psychological_profile WHERE user_id = p_user_id;
    IF v_profile IS NULL THEN RETURN; END IF;

    -- ───────────────────────────────────────────────────────────
    -- Minimum Data Threshold: لو البيانات أقل من 20 حدث، النمط = 'emerging'
    -- ───────────────────────────────────────────────────────────
    SELECT COUNT(*) INTO v_total_events FROM keyword_impact_events WHERE user_id = p_user_id;
    IF v_total_events < 20 THEN
        UPDATE user_psychological_profile SET
            archetype_primary = 'emerging',
            archetype_secondary = NULL,
            archetype_tone_instruction = 'ودودة ومحترمة. المستخدم جديد، كن مرحباً ومشجعاً.'
        WHERE user_id = p_user_id;
        RETURN;
    END IF;

    -- ───────────────────────────────────────────────────────────
    -- Time Decay الحقيقي: من جدول الأحداث المنفصل (آخر 30 يوم)
    -- ───────────────────────────────────────────────────────────
    SELECT
        COALESCE(SUM(CASE WHEN trait = 'openness' THEN impact ELSE 0 END), 0) AS recent_o,
        COALESCE(SUM(CASE WHEN trait = 'conscientiousness' THEN impact ELSE 0 END), 0) AS recent_c,
        COALESCE(SUM(CASE WHEN trait = 'extraversion' THEN impact ELSE 0 END), 0) AS recent_e,
        COALESCE(SUM(CASE WHEN trait = 'agreeableness' THEN impact ELSE 0 END), 0) AS recent_a,
        COALESCE(SUM(CASE WHEN trait = 'neuroticism' THEN impact ELSE 0 END), 0) AS recent_n
    INTO v_recent_bias
    FROM keyword_impact_events
    WHERE user_id = p_user_id
      AND created_at > NOW() - INTERVAL '30 days';

    -- الدمج: 70% من الملف الكلي + 30% انحياز للحديث
    -- مع تطبيع الانحياز الحديث (max 15 per trait)
    v_O := v_profile.openness * 0.7 + LEAST(v_recent_bias.recent_o, 15) * 2.0 * 0.3;
    v_C := v_profile.conscientiousness * 0.7 + LEAST(v_recent_bias.recent_c, 15) * 2.0 * 0.3;
    v_E := v_profile.extraversion * 0.7 + LEAST(v_recent_bias.recent_e, 15) * 2.0 * 0.3;
    v_A := v_profile.agreeableness * 0.7 + LEAST(v_recent_bias.recent_a, 15) * 2.0 * 0.3;
    v_N := v_profile.neuroticism * 0.7 + LEAST(v_recent_bias.recent_n, 15) * 2.0 * 0.3;

    -- حساب درجات كل نمط
    v_scores := jsonb_build_object(
        'strategist', (v_O * 0.5 + v_C * 0.5),
        'operator', (v_C * 0.7 + (100 - v_O) * 0.3),
        'connector', (v_E * 0.5 + v_A * 0.5),
        'creator', (v_O * 0.6 + (100 - v_C) * 0.4),
        'stabilizer', ((100 - v_N) * 0.5 + v_A * 0.5)
    );

    -- الفرز للحصول على الأول والثاني
    SELECT key, value::DECIMAL INTO v_sorted
    FROM jsonb_each_text(v_scores)
    ORDER BY value::DECIMAL DESC
    LIMIT 1;
    v_primary := v_sorted.key;

    SELECT key INTO v_secondary
    FROM jsonb_each_text(v_scores)
    WHERE key != v_primary
    ORDER BY value::DECIMAL DESC
    LIMIT 1;

    -- تحديد تعليمات النبرة: 70% primary + 30% secondary (لمنع Echo Chamber)
    v_primary_tone := CASE v_primary
        WHEN 'strategist' THEN 'رسمية وتحليلية. ركز على الرؤية والمستقبل.'
        WHEN 'operator' THEN 'مختصرة وعملية. ركز على الخطوات.'
        WHEN 'connector' THEN 'ودودة وحماسية. استخدم ايموجي.'
        WHEN 'creator' THEN 'ملهمة ومبتكرة. شجع الأفكار الجديدة.'
        WHEN 'stabilizer' THEN 'هادئة ومطمئنة. استخدم: لا تقلق، نحن معك.'
        ELSE 'ودودة بشكل عام.'
    END;

    v_secondary_tone := CASE v_secondary
        WHEN 'strategist' THEN 'بلمسة تحليلية أحياناً.'
        WHEN 'operator' THEN 'باختصار أحياناً.'
        WHEN 'connector' THEN 'بود أحياناً.'
        WHEN 'creator' THEN 'بإبداع أحياناً.'
        WHEN 'stabilizer' THEN 'بطمأنة أحياناً.'
        ELSE ''
    END;

    v_tone := v_primary_tone || ' ' || v_secondary_tone;

    -- حفظ في الملف النفسي
    UPDATE user_psychological_profile SET
        archetype_primary = v_primary,
        archetype_secondary = v_secondary,
        archetype_tone_instruction = v_tone
    WHERE user_id = p_user_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- ═══════════════════════════════════════════════════════════════
-- RLS Policies
-- ═══════════════════════════════════════════════════════════════
ALTER TABLE keyword_usage_tracker ENABLE ROW LEVEL SECURITY;

-- المستخدم يرى بياناته فقط
CREATE POLICY "Users can view own keyword usage" ON keyword_usage_tracker
    FOR SELECT USING (auth.uid() = user_id);

-- الكتابة فقط للمالك أو service_role (الدوال الـ SECURITY DEFINER)
CREATE POLICY "Owner or service can manage keyword usage" ON keyword_usage_tracker
    FOR ALL USING (
        auth.uid() = user_id
        OR current_setting('role') = 'service_role'
    );

-- RLS للجدول الجديد
ALTER TABLE keyword_impact_events ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own impact events" ON keyword_impact_events
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Owner or service can manage impact events" ON keyword_impact_events
    FOR ALL USING (
        auth.uid() = user_id
        OR current_setting('role') = 'service_role'
    );

-- ═══════════════════════════════════════════════════════════════
DO $$ BEGIN
    RAISE NOTICE 'Migration V5.2: EXP Decay + Per-Event + Data Threshold + Tone Blend + GIN. 🧠';
END $$;
