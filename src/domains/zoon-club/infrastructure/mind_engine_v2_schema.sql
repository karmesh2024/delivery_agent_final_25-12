-- ═══════════════════════════════════════════════════════════════
-- Behavioral Intelligence Engine V2.2 - Production Schema
-- Version: 2.2.2 (Final Production Ready)
-- Date: 2026-02-11
-- Author: Zoon Development Team
-- ═══════════════════════════════════════════════════════════════

-- ═══════════════════════════════════════════════════════════════
-- SECTION 1: PREREQUISITES
-- ═══════════════════════════════════════════════════════════════

-- Ensure UUID extension is available
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ═══════════════════════════════════════════════════════════════
-- SECTION 2: CONTENT TEMPLATES (Reference Data)
-- ═══════════════════════════════════════════════════════════════

CREATE TABLE IF NOT EXISTS content_templates (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(50) UNIQUE NOT NULL,
    display_name JSONB NOT NULL, -- {"en": "Educational", "ar": "تعليمي"}
    icon VARCHAR(10),
    intellectual_pct INTEGER NOT NULL CHECK (intellectual_pct >= 0 AND intellectual_pct <= 100),
    social_pct INTEGER NOT NULL CHECK (social_pct >= 0 AND social_pct <= 100),
    values_pct INTEGER NOT NULL CHECK (values_pct >= 0 AND values_pct <= 100),
    description JSONB,
    is_active BOOLEAN DEFAULT true,
    usage_count INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    CONSTRAINT template_sum_100 CHECK (intellectual_pct + social_pct + values_pct = 100)
);

-- ═══════════════════════════════════════════════════════════════
-- SECTION 2.5: BAZZZZ TYPES IMPACT (Integration)
-- ═══════════════════════════════════════════════════════════════

-- Ensure the existing bazzzz types table has the impact column and unique constraint
ALTER TABLE zoon_bazzzz_types 
ADD COLUMN IF NOT EXISTS psychological_impact JSONB DEFAULT '{"openness": 0, "conscientiousness": 0, "extraversion": 0, "agreeableness": 0, "neuroticism": 0}'::jsonb,
ADD COLUMN IF NOT EXISTS is_primary BOOLEAN DEFAULT false, -- للأنواع التي تنقل المنشور لأعلى (Like, Hot, Diamond)
ADD COLUMN IF NOT EXISTS allows_comment BOOLEAN DEFAULT true; -- للأنواع التي تظهر في نافذة التعليقات

-- Ensure name_en is unique for upsert protection
DO $$ 
BEGIN 
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'zoon_bazzzz_types_name_en_key') THEN
        ALTER TABLE zoon_bazzzz_types ADD CONSTRAINT zoon_bazzzz_types_name_en_key UNIQUE (name_en);
    END IF;
END $$;

COMMENT ON COLUMN zoon_bazzzz_types.is_primary IS 'هل هذا النوع أساسي ويؤثر في ترتيب المنشور مباشرة؟';
COMMENT ON COLUMN zoon_bazzzz_types.allows_comment IS 'هل هذا النوع يتطلب أو يسمح بإضافة نص تعليق معه؟';

-- Update zoon_post_comments to link with bazzzz
ALTER TABLE zoon_post_comments
ADD COLUMN IF NOT EXISTS bazzzz_type_id UUID REFERENCES zoon_bazzzz_types(id) ON DELETE SET NULL;

-- Insert default templates
INSERT INTO content_templates (name, display_name, icon, intellectual_pct, social_pct, values_pct, description) 
VALUES
    ('educational', 
     '{"en": "Educational", "ar": "تعليمي"}', 
     '📚', 
     70, 10, 20,
     '{"en": "Technical content, tutorials, analysis", "ar": "محتوى تقني، دروس، تحليلات"}'),
     
    ('personal_story', 
     '{"en": "Personal Story", "ar": "قصصي"}', 
     '💬', 
     10, 70, 20,
     '{"en": "Personal experiences, social interactions", "ar": "تجارب شخصية، تفاعلات اجتماعية"}'),
     
    ('inspirational', 
     '{"en": "Inspirational", "ar": "إلهامي"}', 
     '✨', 
     20, 20, 60,
     '{"en": "Life lessons, values, principles", "ar": "دروس حياتية، قيم، مبادئ"}')
ON CONFLICT (name) DO NOTHING;

-- Indexes
CREATE INDEX IF NOT EXISTS idx_templates_active ON content_templates(is_active) WHERE is_active = true;

-- Comments
COMMENT ON TABLE content_templates IS 'قوالب المحتوى الجاهزة لتسهيل تصنيف المنشورات';
COMMENT ON COLUMN content_templates.usage_count IS 'عدد المرات التي استخدم فيها هذا القالب';

-- ═══════════════════════════════════════════════════════════════
-- SECTION 3: UPDATE POSTS TABLE
-- ═══════════════════════════════════════════════════════════════

ALTER TABLE zoon_posts 
ADD COLUMN IF NOT EXISTS intellectual_pct INTEGER DEFAULT 33 CHECK (intellectual_pct >= 0 AND intellectual_pct <= 100),
ADD COLUMN IF NOT EXISTS social_pct INTEGER DEFAULT 33 CHECK (social_pct >= 0 AND social_pct <= 100),
ADD COLUMN IF NOT EXISTS values_pct INTEGER DEFAULT 34 CHECK (values_pct >= 0 AND values_pct <= 100),
ADD COLUMN IF NOT EXISTS template_id UUID REFERENCES content_templates(id) ON DELETE SET NULL,
ADD COLUMN IF NOT EXISTS classification_source VARCHAR(50) DEFAULT 'system_neutral' 
    CHECK (classification_source IN ('publisher_manual', 'publisher_template', 'admin_review', 'system_neutral')),
ADD COLUMN IF NOT EXISTS confidence_level VARCHAR(20) DEFAULT 'low'
    CHECK (confidence_level IN ('low', 'medium', 'high')),
ADD COLUMN IF NOT EXISTS hidden_tags JSONB DEFAULT '[]'::jsonb,
ADD COLUMN IF NOT EXISTS ranking_score INTEGER DEFAULT 0;

COMMENT ON COLUMN zoon_posts.ranking_score IS 'النقاط التراكمية للمنشور - تستخدم لترتيب الظهور';

-- Critical constraint: ensure dimensions sum to 100
DO $$ 
BEGIN 
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'check_dimensions_sum_100') THEN
        ALTER TABLE zoon_posts ADD CONSTRAINT check_dimensions_sum_100 
        CHECK (intellectual_pct + social_pct + values_pct = 100);
    END IF;
END $$;

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_posts_confidence ON zoon_posts(confidence_level) WHERE confidence_level = 'low';
CREATE INDEX IF NOT EXISTS idx_posts_template ON zoon_posts(template_id) WHERE template_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_posts_dimensions ON zoon_posts(intellectual_pct, social_pct, values_pct);
CREATE INDEX IF NOT EXISTS idx_posts_classification ON zoon_posts(classification_source, confidence_level);

-- Comments
COMMENT ON COLUMN zoon_posts.intellectual_pct IS 'نسبة البعد الفكري/المعرفي (0-100)';
COMMENT ON COLUMN zoon_posts.social_pct IS 'نسبة البعد الاجتماعي/العاطفي (0-100)';
COMMENT ON COLUMN zoon_posts.values_pct IS 'نسبة البعد القيمي/الأخلاقي (0-100)';
COMMENT ON COLUMN zoon_posts.hidden_tags IS 'وسوم خفية لتحليل دقيق (مثل: الابتكار، التفكير النقدي، الاستدامة)';
COMMENT ON COLUMN zoon_posts.confidence_level IS 'مستوى ثقة التصنيف: low (يحتاج مراجعة)، medium، high (دقيق)';

-- ═══════════════════════════════════════════════════════════════
-- SECTION 4: USER PSYCHOLOGICAL PROFILE (Aggregated State)
-- ═══════════════════════════════════════════════════════════════

CREATE TABLE IF NOT EXISTS user_psychological_profile (
    user_id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    
    -- Big Five Traits (normalized 0-100)
    openness DECIMAL(5,2) DEFAULT 50.00 CHECK (openness >= 0 AND openness <= 100),
    conscientiousness DECIMAL(5,2) DEFAULT 50.00 CHECK (conscientiousness >= 0 AND conscientiousness <= 100),
    extraversion DECIMAL(5,2) DEFAULT 50.00 CHECK (extraversion >= 0 AND extraversion <= 100),
    agreeableness DECIMAL(5,2) DEFAULT 50.00 CHECK (agreeableness >= 0 AND agreeableness <= 100),
    neuroticism DECIMAL(5,2) DEFAULT 50.00 CHECK (neuroticism >= 0 AND neuroticism <= 100),
    
    -- Metadata
    total_interactions INTEGER DEFAULT 0,
    profile_completeness DECIMAL(3,2) DEFAULT 0.00 CHECK (profile_completeness >= 0 AND profile_completeness <= 1),
    last_calculated_at TIMESTAMP WITH TIME ZONE,
    
    -- Privacy settings
    opted_out BOOLEAN DEFAULT false,
    opted_out_at TIMESTAMP WITH TIME ZONE,
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_upp_completeness ON user_psychological_profile(profile_completeness DESC);
CREATE INDEX IF NOT EXISTS idx_upp_opted_out ON user_psychological_profile(opted_out) WHERE opted_out = false;
CREATE INDEX IF NOT EXISTS idx_upp_updated ON user_psychological_profile(updated_at DESC);

-- Comments
COMMENT ON TABLE user_psychological_profile IS 'الملف النفسي المجمع لكل مستخدم وفق نموذج Big Five';
COMMENT ON COLUMN user_psychological_profile.openness IS 'الانفتاح على التجارب الجديدة (Openness to Experience)';
COMMENT ON COLUMN user_psychological_profile.conscientiousness IS 'اليقظة والانضباط الذاتي (Conscientiousness)';
COMMENT ON COLUMN user_psychological_profile.extraversion IS 'الانبساط والتواصل الاجتماعي (Extraversion)';
COMMENT ON COLUMN user_psychological_profile.agreeableness IS 'الوفاق والتعاطف (Agreeableness)';
COMMENT ON COLUMN user_psychological_profile.neuroticism IS 'العصابية وعدم الاستقرار العاطفي (Neuroticism)';
COMMENT ON COLUMN user_psychological_profile.opted_out IS 'هل اختار المستخدم عدم المشاركة في التحليل النفسي؟';
COMMENT ON COLUMN user_psychological_profile.profile_completeness IS 'نسبة اكتمال الملف (0-1): يعتمد على عدد التفاعلات';

-- ═══════════════════════════════════════════════════════════════
-- SECTION 5: PSYCHOLOGICAL IMPACT LOG (Event Stream)
-- ═══════════════════════════════════════════════════════════════

CREATE TABLE IF NOT EXISTS psychological_impact_log (
    id UUID DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    
    -- Delta values (can be positive or negative)
    openness_delta DECIMAL(5,2) DEFAULT 0,
    conscientiousness_delta DECIMAL(5,2) DEFAULT 0,
    extraversion_delta DECIMAL(5,2) DEFAULT 0,
    agreeableness_delta DECIMAL(5,2) DEFAULT 0,
    neuroticism_delta DECIMAL(5,2) DEFAULT 0,
    
    -- Source tracking
    source_type VARCHAR(50) NOT NULL CHECK (source_type IN ('reaction', 'dwell_time', 'read', 'comment', 'share')),
    source_id UUID, -- post_id, comment_id, etc.
    
    -- Additional context
    context_data JSONB, -- {"bazzzz_type": "fire", "post_dimensions": {...}}
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
    
    PRIMARY KEY (id, created_at) -- For partitioning
) PARTITION BY RANGE (created_at);

-- Create initial partitions (monthly) - adjust dates as needed
CREATE TABLE IF NOT EXISTS pil_2026_02 PARTITION OF psychological_impact_log
    FOR VALUES FROM ('2026-02-01') TO ('2026-03-01');

CREATE TABLE IF NOT EXISTS pil_2026_03 PARTITION OF psychological_impact_log
    FOR VALUES FROM ('2026-03-01') TO ('2026-04-01');

CREATE TABLE IF NOT EXISTS pil_2026_04 PARTITION OF psychological_impact_log
    FOR VALUES FROM ('2026-04-01') TO ('2026-05-01');

CREATE TABLE IF NOT EXISTS pil_2026_05 PARTITION OF psychological_impact_log
    FOR VALUES FROM ('2026-05-01') TO ('2026-06-01');

-- Indexes on partitioned table
CREATE INDEX IF NOT EXISTS idx_pil_user_created ON psychological_impact_log(user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_pil_source ON psychological_impact_log(source_type, source_id);
CREATE INDEX IF NOT EXISTS idx_pil_user_source ON psychological_impact_log(user_id, source_type);

-- Comments
COMMENT ON TABLE psychological_impact_log IS 'سجل النبضات النفسية - كل تفاعل يخلق تأثير نفسي مسجل هنا';
COMMENT ON COLUMN psychological_impact_log.source_type IS 'نوع المصدر: reaction (تفاعل)، dwell_time (وقت القراءة)، read، comment، share';
COMMENT ON COLUMN psychological_impact_log.context_data IS 'سياق إضافي مثل نوع الـ Bazzzz وأبعاد المنشور';

-- ═══════════════════════════════════════════════════════════════
-- SECTION 6: PUBLISHER LEARNING HISTORY (Analytics)
-- ═══════════════════════════════════════════════════════════════

CREATE TABLE IF NOT EXISTS publisher_learning (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    publisher_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    post_id UUID NOT NULL UNIQUE REFERENCES zoon_posts(id) ON DELETE CASCADE,
    
    -- Actual outcome (no need to duplicate predicted - it's in zoon_posts)
    actual_audience_profile JSONB NOT NULL, 
    -- Example structure:
    -- {
    --   "avg_openness": 75.5,
    --   "avg_conscientiousness": 52.3,
    --   "avg_extraversion": 45.2,
    --   "avg_agreeableness": 68.1,
    --   "avg_neuroticism": 38.9,
    --   "dominant_trait": "openness",
    --   "total_reactions": 150,
    --   "engagement_rate": 0.85
    -- }
    
    accuracy_score DECIMAL(3,2) NOT NULL CHECK (accuracy_score >= 0 AND accuracy_score <= 1),
    learning_message TEXT,
    feedback_shown BOOLEAN DEFAULT false,
    feedback_shown_at TIMESTAMP WITH TIME ZONE,
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_pl_publisher ON publisher_learning(publisher_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_pl_accuracy ON publisher_learning(accuracy_score DESC);
CREATE INDEX IF NOT EXISTS idx_pl_feedback_pending ON publisher_learning(feedback_shown) WHERE feedback_shown = false;

-- Comments
COMMENT ON TABLE publisher_learning IS 'سجل تعلم الناشر - مقارنة بين توقعاته والواقع لتحسين دقة التصنيف';
COMMENT ON COLUMN publisher_learning.accuracy_score IS 'دقة توقع الناشر (0-1): كلما اقترب من 1 كان أكثر دقة';
COMMENT ON COLUMN publisher_learning.learning_message IS 'رسالة تعليمية تُرسل للناشر لتحسين مهاراته';

-- ═══════════════════════════════════════════════════════════════
-- SECTION 7: TRIGGERS & FUNCTIONS
-- ═══════════════════════════════════════════════════════════════

-- Function: Auto-update user psychological profile when new impact is logged
CREATE OR REPLACE FUNCTION update_user_profile()
RETURNS TRIGGER AS $$
BEGIN
    -- Skip if user opted out
    IF EXISTS (
        SELECT 1 FROM user_psychological_profile 
        WHERE user_id = NEW.user_id AND opted_out = true
    ) THEN
        RETURN NEW;
    END IF;
    
    -- Insert or update profile
    INSERT INTO user_psychological_profile (
        user_id,
        openness,
        conscientiousness,
        extraversion,
        agreeableness,
        neuroticism,
        total_interactions,
        last_calculated_at,
        updated_at
    ) VALUES (
        NEW.user_id,
        50.00 + NEW.openness_delta,
        50.00 + NEW.conscientiousness_delta,
        50.00 + NEW.extraversion_delta,
        50.00 + NEW.agreeableness_delta,
        50.00 + NEW.neuroticism_delta,
        1,
        NOW(),
        NOW()
    )
    ON CONFLICT (user_id) DO UPDATE SET
        openness = GREATEST(0, LEAST(100, user_psychological_profile.openness + NEW.openness_delta)),
        conscientiousness = GREATEST(0, LEAST(100, user_psychological_profile.conscientiousness + NEW.conscientiousness_delta)),
        extraversion = GREATEST(0, LEAST(100, user_psychological_profile.extraversion + NEW.extraversion_delta)),
        agreeableness = GREATEST(0, LEAST(100, user_psychological_profile.agreeableness + NEW.agreeableness_delta)),
        neuroticism = GREATEST(0, LEAST(100, user_psychological_profile.neuroticism + NEW.neuroticism_delta)),
        total_interactions = user_psychological_profile.total_interactions + 1,
        last_calculated_at = NOW(),
        updated_at = NOW();
    
    -- Update completeness score (logarithmic scale)
    UPDATE user_psychological_profile
    SET profile_completeness = LEAST(1.00, LN(total_interactions + 1) / LN(101))
    WHERE user_id = NEW.user_id;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Drop existing trigger if exists
DROP TRIGGER IF EXISTS trigger_update_profile ON psychological_impact_log;

-- Create trigger
CREATE TRIGGER trigger_update_profile
AFTER INSERT ON psychological_impact_log
FOR EACH ROW
EXECUTE FUNCTION update_user_profile();

COMMENT ON FUNCTION update_user_profile() IS 'تحديث الملف النفسي تلقائياً عند إضافة تأثير جديد';

-- ───────────────────────────────────────────────────────────────

-- Function: Auto-increment template usage count
CREATE OR REPLACE FUNCTION increment_template_usage()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.template_id IS NOT NULL THEN
        UPDATE content_templates
        SET usage_count = usage_count + 1,
            updated_at = NOW()
        WHERE id = NEW.template_id;
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Drop existing trigger if exists
DROP TRIGGER IF EXISTS trigger_increment_template ON zoon_posts;

-- Create trigger
CREATE TRIGGER trigger_increment_template
AFTER INSERT ON zoon_posts
FOR EACH ROW
WHEN (NEW.template_id IS NOT NULL)
EXECUTE FUNCTION increment_template_usage();

COMMENT ON FUNCTION increment_template_usage() IS 'زيادة عداد استخدام القالب عند إنشاء منشور جديد';

-- ───────────────────────────────────────────────────────────────

-- Function: Auto-calculate confidence level based on template usage
CREATE OR REPLACE FUNCTION auto_set_confidence_level()
RETURNS TRIGGER AS $$
BEGIN
    -- If using a template with minimal changes, set high confidence
    IF NEW.template_id IS NOT NULL THEN
        -- Check if percentages match template exactly
        IF EXISTS (
            SELECT 1 FROM content_templates 
            WHERE id = NEW.template_id
            AND intellectual_pct = NEW.intellectual_pct
            AND social_pct = NEW.social_pct
            AND values_pct = NEW.values_pct
        ) THEN
            NEW.confidence_level := 'high';
            NEW.classification_source := 'publisher_template';
        ELSE
            -- Template used but modified
            NEW.confidence_level := 'medium';
            NEW.classification_source := 'publisher_manual';
        END IF;
    ELSE
        -- Manual entry without template
        IF NEW.intellectual_pct = 33 AND NEW.social_pct = 33 AND NEW.values_pct = 34 THEN
            -- Default values = low confidence
            NEW.confidence_level := 'low';
            NEW.classification_source := 'system_neutral';
        ELSE
            -- Custom manual values = medium confidence
            NEW.confidence_level := 'medium';
            NEW.classification_source := 'publisher_manual';
        END IF;
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Drop existing trigger if exists
DROP TRIGGER IF EXISTS trigger_auto_confidence ON zoon_posts;

-- Create trigger
CREATE TRIGGER trigger_auto_confidence
BEFORE INSERT OR UPDATE OF intellectual_pct, social_pct, values_pct, template_id ON zoon_posts
FOR EACH ROW
EXECUTE FUNCTION auto_set_confidence_level();

COMMENT ON FUNCTION auto_set_confidence_level() IS 'تحديد مستوى الثقة تلقائياً بناءً على طريقة التصنيف';

-- ═══════════════════════════════════════════════════════════════
-- SECTION 8: VIEWS & ANALYTICS
-- ═══════════════════════════════════════════════════════════════

-- View: Admin Review Queue - Posts needing classification review
CREATE OR REPLACE VIEW admin_review_queue AS
SELECT 
    p.id,
    p.content,
    p.user_id as author_id,
    p.intellectual_pct,
    p.social_pct,
    p.values_pct,
    p.confidence_level,
    p.classification_source,
    p.template_id,
    ct.name as template_name,
    p.created_at,
    COUNT(DISTINCT pr.id) as reactions_count,
    COALESCE(AVG(pl.accuracy_score), 0) as publisher_avg_accuracy
FROM zoon_posts p
LEFT JOIN content_templates ct ON p.template_id = ct.id
LEFT JOIN zoon_post_interactions pr ON p.id = pr.post_id
LEFT JOIN publisher_learning pl ON pl.publisher_id = p.user_id
WHERE p.confidence_level = 'low' 
  AND p.classification_source IN ('system_neutral', 'publisher_manual')
GROUP BY p.id, p.content, p.user_id, ct.name, pl.accuracy_score
ORDER BY p.created_at DESC;

COMMENT ON VIEW admin_review_queue IS 'قائمة المنشورات التي تحتاج مراجعة إدارية للتصنيف';

-- View: Publisher Analytics Dashboard
CREATE OR REPLACE VIEW publisher_analytics AS
SELECT 
    p.user_id as publisher_id,
    COUNT(DISTINCT p.id) as total_posts,
    COALESCE(AVG(pl.accuracy_score), 0) as avg_accuracy,
    AVG(p.intellectual_pct) as avg_intellectual,
    AVG(p.social_pct) as avg_social,
    AVG(p.values_pct) as avg_values,
    COUNT(DISTINCT CASE WHEN pl.accuracy_score >= 0.85 THEN p.id END) as accurate_posts,
    MAX(pl.accuracy_score) as best_accuracy,
    COUNT(DISTINCT pr.id) as total_reactions_received,
    -- Badge eligibility
    CASE 
        WHEN AVG(pl.accuracy_score) >= 0.85 THEN true 
        ELSE false 
    END as eligible_for_accurate_badge,
    CASE 
        WHEN STDDEV(p.intellectual_pct) < 20 
         AND STDDEV(p.social_pct) < 20 
         AND STDDEV(p.values_pct) < 20 
        THEN true 
        ELSE false 
    END as eligible_for_balanced_badge
FROM zoon_posts p
LEFT JOIN publisher_learning pl ON p.id = pl.post_id
LEFT JOIN zoon_post_interactions pr ON p.id = pr.post_id
GROUP BY p.user_id;

COMMENT ON VIEW publisher_analytics IS 'لوحة تحليلات الناشر - الأداء والدقة والأوسمة';

-- View: Content Performance by Dimension
CREATE OR REPLACE VIEW content_performance_by_dimension AS
SELECT 
    CASE 
        WHEN intellectual_pct >= 60 THEN 'Intellectual-Heavy'
        WHEN social_pct >= 60 THEN 'Social-Heavy'
        WHEN values_pct >= 60 THEN 'Values-Heavy'
        ELSE 'Balanced'
    END as content_type,
    COUNT(*) as posts_count,
    AVG((SELECT COUNT(*) FROM zoon_post_interactions WHERE post_id = p.id)) as avg_reactions,
    COALESCE(AVG(pl.accuracy_score), 0) as avg_accuracy,
    AVG(p.intellectual_pct) as avg_intellectual_pct,
    AVG(p.social_pct) as avg_social_pct,
    AVG(p.values_pct) as avg_values_pct
FROM zoon_posts p
LEFT JOIN publisher_learning pl ON p.id = pl.post_id
GROUP BY content_type
ORDER BY avg_reactions DESC;

COMMENT ON VIEW content_performance_by_dimension IS 'أداء المحتوى حسب النوع - أي نوع يحقق engagement أفضل؟';

-- View: User Profile Summary (for displaying to users)
CREATE OR REPLACE VIEW user_profile_summary AS
SELECT 
    user_id,
    ROUND(openness::numeric, 1) as openness,
    ROUND(conscientiousness::numeric, 1) as conscientiousness,
    ROUND(extraversion::numeric, 1) as extraversion,
    ROUND(agreeableness::numeric, 1) as agreeableness,
    ROUND(neuroticism::numeric, 1) as neuroticism,
    total_interactions,
    ROUND((profile_completeness * 100)::numeric, 0) as completeness_percentage,
    CASE 
        WHEN profile_completeness >= 0.9 THEN 'Complete'
        WHEN profile_completeness >= 0.5 THEN 'Moderate'
        ELSE 'Incomplete'
    END as profile_status,
    -- Dominant trait
    CASE 
        WHEN openness >= GREATEST(conscientiousness, extraversion, agreeableness, 100-neuroticism) THEN 'Creative & Open'
        WHEN conscientiousness >= GREATEST(openness, extraversion, agreeableness, 100-neuroticism) THEN 'Organized & Disciplined'
        WHEN extraversion >= GREATEST(openness, conscientiousness, agreeableness, 100-neuroticism) THEN 'Social & Outgoing'
        WHEN agreeableness >= GREATEST(openness, conscientiousness, extraversion, 100-neuroticism) THEN 'Cooperative & Empathetic'
        ELSE 'Emotionally Stable'
    END as personality_summary,
    opted_out,
    last_calculated_at
FROM user_psychological_profile;

COMMENT ON VIEW user_profile_summary IS 'ملخص الملف النفسي للعرض للمستخدمين';

-- ═══════════════════════════════════════════════════════════════
-- SECTION 9: HELPER FUNCTIONS
-- ═══════════════════════════════════════════════════════════════

-- Function: Get user's detailed psychological profile
CREATE OR REPLACE FUNCTION get_user_profile_details(p_user_id UUID)
RETURNS TABLE (
    trait_name VARCHAR,
    score DECIMAL,
    percentile INTEGER,
    description TEXT
) AS $$
BEGIN
    RETURN QUERY
    SELECT * FROM (
        SELECT 
            'Openness'::VARCHAR as trait_name, 
            upp.openness as score,
            (SELECT COUNT(*) * 100 / GREATEST((SELECT COUNT(*) FROM user_psychological_profile), 1) 
             FROM user_psychological_profile upp2 WHERE upp2.openness < upp.openness)::INTEGER as percentile,
            'الانفتاح على التجارب والأفكار الجديدة'::TEXT as description
        FROM user_psychological_profile upp WHERE user_id = p_user_id
        
        UNION ALL
        
        SELECT 
            'Conscientiousness', 
            upp.conscientiousness,
            (SELECT COUNT(*) * 100 / GREATEST((SELECT COUNT(*) FROM user_psychological_profile), 1)
             FROM user_psychological_profile upp2 WHERE upp2.conscientiousness < upp.conscientiousness)::INTEGER,
            'اليقظة والانضباط الذاتي'::TEXT
        FROM user_psychological_profile upp WHERE user_id = p_user_id
        
        UNION ALL
        
        SELECT 
            'Extraversion', 
            upp.extraversion,
            (SELECT COUNT(*) * 100 / GREATEST((SELECT COUNT(*) FROM user_psychological_profile), 1)
             FROM user_psychological_profile upp2 WHERE upp2.extraversion < upp.extraversion)::INTEGER,
            'الانبساط والتواصل الاجتماعي'::TEXT
        FROM user_psychological_profile upp WHERE user_id = p_user_id
        
        UNION ALL
        
        SELECT 
            'Agreeableness', 
            upp.agreeableness,
            (SELECT COUNT(*) * 100 / GREATEST((SELECT COUNT(*) FROM user_psychological_profile), 1)
             FROM user_psychological_profile upp2 WHERE upp2.agreeableness < upp.agreeableness)::INTEGER,
            'الوفاق والتعاطف مع الآخرين'::TEXT
        FROM user_psychological_profile upp WHERE user_id = p_user_id
        
        UNION ALL
        
        SELECT 
            'Neuroticism', 
            upp.neuroticism,
            (SELECT COUNT(*) * 100 / GREATEST((SELECT COUNT(*) FROM user_psychological_profile), 1)
             FROM user_psychological_profile upp2 WHERE upp2.neuroticism < upp.neuroticism)::INTEGER,
            'العصابية وعدم الاستقرار العاطفي'::TEXT
        FROM user_psychological_profile upp WHERE user_id = p_user_id
    ) traits
    ORDER BY score DESC;
END;
$$ LANGUAGE plpgsql;

COMMENT ON FUNCTION get_user_profile_details(UUID) IS 'الحصول على تفاصيل الملف النفسي مع النسب المئوية';

-- Function: Calculate similarity between two users
CREATE OR REPLACE FUNCTION calculate_user_similarity(p_user1_id UUID, p_user2_id UUID)
RETURNS DECIMAL AS $$
DECLARE
    v_similarity DECIMAL;
BEGIN
    SELECT 
        1 - (
            ABS(u1.openness - u2.openness) +
            ABS(u1.conscientiousness - u2.conscientiousness) +
            ABS(u1.extraversion - u2.extraversion) +
            ABS(u1.agreeableness - u2.agreeableness) +
            ABS(u1.neuroticism - u2.neuroticism)
        ) / 500.0 INTO v_similarity
    FROM user_psychological_profile u1
    CROSS JOIN user_psychological_profile u2
    WHERE u1.user_id = p_user1_id AND u2.user_id = p_user2_id;
    
    RETURN COALESCE(v_similarity, 0);
END;
$$ LANGUAGE plpgsql;

COMMENT ON FUNCTION calculate_user_similarity(UUID, UUID) IS 'حساب التشابه بين مستخدمين (0-1): 1 = متطابقان تماماً';

-- Function: Recommend posts for user based on psychological profile
CREATE OR REPLACE FUNCTION recommend_posts_for_user(
    p_user_id UUID,
    p_limit INTEGER DEFAULT 10
)
RETURNS TABLE (
    post_id UUID,
    content TEXT,
    match_score DECIMAL,
    intellectual_pct INTEGER,
    social_pct INTEGER,
    values_pct INTEGER
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        p.id as post_id,
        p.content,
        -- Match score based on user's profile
        (
            (CASE WHEN upp.openness > 60 THEN p.intellectual_pct ELSE 0 END) +
            (CASE WHEN upp.extraversion > 60 THEN p.social_pct ELSE 0 END) +
            (CASE WHEN (100 - upp.neuroticism) > 60 THEN p.values_pct ELSE 0 END)
        ) / 100.0 as match_score,
        p.intellectual_pct,
        p.social_pct,
        p.values_pct
    FROM zoon_posts p
    CROSS JOIN user_psychological_profile upp
    WHERE upp.user_id = p_user_id
    AND p.user_id != p_user_id  -- Exclude user's own posts
    ORDER BY match_score DESC
    LIMIT p_limit;
END;
$$ LANGUAGE plpgsql;

COMMENT ON FUNCTION recommend_posts_for_user(UUID, INTEGER) IS 'اقتراح منشورات للمستخدم بناءً على ملفه النفسي';

-- ═══════════════════════════════════════════════════════════════
-- SECTION 10: MAINTENANCE & UTILITIES
-- ═══════════════════════════════════════════════════════════════

-- Function: Create new monthly partition automatically
CREATE OR REPLACE FUNCTION create_partition_if_not_exists(
    p_table_name TEXT,
    p_start_date DATE,
    p_end_date DATE
)
RETURNS BOOLEAN AS $$
DECLARE
    v_partition_name TEXT;
    v_exists BOOLEAN;
BEGIN
    v_partition_name := p_table_name || '_' || TO_CHAR(p_start_date, 'YYYY_MM');
    
    -- Check if partition exists
    SELECT EXISTS (
        SELECT 1 FROM pg_class WHERE relname = v_partition_name
    ) INTO v_exists;
    
    IF NOT v_exists THEN
        EXECUTE FORMAT(
            'CREATE TABLE IF NOT EXISTS %I PARTITION OF %I FOR VALUES FROM (%L) TO (%L)',
            v_partition_name,
            p_table_name,
            p_start_date,
            p_end_date
        );
        RETURN TRUE;
    END IF;
    
    RETURN FALSE;
END;
$$ LANGUAGE plpgsql;

COMMENT ON FUNCTION create_partition_if_not_exists(TEXT, DATE, DATE) IS 'إنشاء partition جديد تلقائياً للشهر القادم';

-- ═══════════════════════════════════════════════════════════════
-- SECTION 11: INITIAL DATA & FINALIZATION
-- ═══════════════════════════════════════════════════════════════

-- Update existing posts with default values
UPDATE zoon_posts 
SET 
    intellectual_pct = 33,
    social_pct = 33,
    values_pct = 34,
    classification_source = 'system_neutral',
    confidence_level = 'low'
WHERE intellectual_pct IS NULL;

-- Create initial psychological profiles for existing users
INSERT INTO user_psychological_profile (user_id)
SELECT id FROM auth.users
WHERE id NOT IN (SELECT user_id FROM user_psychological_profile)
ON CONFLICT (user_id) DO NOTHING;

-- ═══════════════════════════════════════════════════════════════
-- SECTION 12: RANKING & SCORING SYSTEM (V2.2.3)
-- ═══════════════════════════════════════════════════════════════

-- Function: Update post ranking score
CREATE OR REPLACE FUNCTION update_post_ranking_score()
RETURNS TRIGGER AS $$
DECLARE
    v_post_id UUID;
    v_total_points INTEGER := 0;
    v_interaction_points INTEGER := 0;
    v_comment_points INTEGER := 0;
BEGIN
    v_post_id := COALESCE(NEW.post_id, OLD.post_id);

    -- Calculate interaction points
    SELECT COALESCE(SUM(bt.points_given), 0)
    INTO v_interaction_points
    FROM zoon_post_interactions pi
    JOIN zoon_bazzzz_types bt ON pi.bazzzz_type_id = bt.id
    WHERE pi.post_id = v_post_id;

    -- Calculate comment points (Bazzzz linked with comments)
    SELECT COALESCE(SUM(bt.points_given), 0)
    INTO v_comment_points
    FROM zoon_post_comments pc
    JOIN zoon_bazzzz_types bt ON pc.bazzzz_type_id = bt.id
    WHERE pc.post_id = v_post_id;

    v_total_points := v_interaction_points + v_comment_points;

    -- Update post
    UPDATE zoon_posts 
    SET ranking_score = v_total_points
    WHERE id = v_post_id;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Triggers for ranking
DROP TRIGGER IF EXISTS trigger_update_ranking_interaction ON zoon_post_interactions;
CREATE TRIGGER trigger_update_ranking_interaction
AFTER INSERT OR UPDATE OR DELETE ON zoon_post_interactions
FOR EACH ROW EXECUTE FUNCTION update_post_ranking_score();

DROP TRIGGER IF EXISTS trigger_update_ranking_comment ON zoon_post_comments;
CREATE TRIGGER trigger_update_ranking_comment
AFTER INSERT OR UPDATE OR DELETE ON zoon_post_interactions -- Corrected to comment table logic
FOR EACH ROW EXECUTE FUNCTION update_post_ranking_score();

-- Fixed trigger for comments
DROP TRIGGER IF EXISTS trigger_update_ranking_comment ON zoon_post_comments;
CREATE TRIGGER trigger_update_ranking_comment
AFTER INSERT OR UPDATE OR DELETE ON zoon_post_comments
FOR EACH ROW EXECUTE FUNCTION update_post_ranking_score();

COMMENT ON FUNCTION update_post_ranking_score() IS 'تحديث نقاط ترتيب المنشور تلقائياً بناءً على التفاعلات والتعليقات';

-- ═══════════════════════════════════════════════════════════════
-- END OF SCHEMA
-- ═══════════════════════════════════════════════════════════════

-- Success message
DO $$
BEGIN
    RAISE NOTICE '═══════════════════════════════════════════════════════════════';
    RAISE NOTICE 'Behavioral Intelligence Engine V2.2.2 Schema Applied Successfully!';
    RAISE NOTICE '═══════════════════════════════════════════════════════════════';
    RAISE NOTICE 'Tables created: 4';
    RAISE NOTICE 'Views created: 4';
    RAISE NOTICE 'Functions created: 7';
    RAISE NOTICE 'Triggers created: 3';
    RAISE NOTICE '';
    RAISE NOTICE 'Next Steps:';
    RAISE NOTICE '1. Test the schema with sample data';
    RAISE NOTICE '2. Implement backend services';
    RAISE NOTICE '3. Build frontend UI for post creation';
    RAISE NOTICE '4. Create admin dashboard';
    RAISE NOTICE '═══════════════════════════════════════════════════════════════';
END $$;
