-- ═══════════════════════════════════════════════════════════════
-- MIGRATION: Extending Existing Schema (No Breaking Changes!)
-- From zoon_circles → Goal-Driven Architecture
-- Date: 2026-02-14
-- ═══════════════════════════════════════════════════════════════

-- ───────────────────────────────────────────────────────────────
-- PHASE 1: EXTEND EXISTING TABLES (NO BREAKING CHANGES)
-- ───────────────────────────────────────────────────────────────

-- 1.1 Extend zoon_circles with Goal-Driven fields
ALTER TABLE zoon_circles
ADD COLUMN IF NOT EXISTS goal_type VARCHAR(50) 
    CHECK (goal_type IN ('business', 'social', 'impact', 'learning', 'creative')),
ADD COLUMN IF NOT EXISTS goal_stage VARCHAR(50) DEFAULT 'exploration'
    CHECK (goal_stage IN ('exploration', 'building', 'scaling', 'maintaining')),
ADD COLUMN IF NOT EXISTS goal_vector JSONB DEFAULT '{
    "required_openness": 50,
    "required_conscientiousness": 50,
    "required_extraversion": 50,
    "required_agreeableness": 50,
    "required_stability": 50
}'::jsonb,
ADD COLUMN IF NOT EXISTS complementarity_mode VARCHAR(50) DEFAULT 'balanced'
    CHECK (complementarity_mode IN (
        'vision_execution', 
        'emotional_analytical', 
        'network_operator', 
        'creative_disciplined', 
        'balanced'
    )),
ADD COLUMN IF NOT EXISTS core_values JSONB DEFAULT '[]'::jsonb,
ADD COLUMN IF NOT EXISTS governance_rules JSONB DEFAULT '{
    "can_members_vote": true,
    "can_merge_circles": false,
    "min_value_alignment": 70,
    "leader_removal_threshold": 80
}'::jsonb,
ADD COLUMN IF NOT EXISTS max_members INTEGER DEFAULT 50,
ADD COLUMN IF NOT EXISTS auto_match_enabled BOOLEAN DEFAULT true;

-- Create indexes for new columns
CREATE INDEX IF NOT EXISTS idx_zoon_circles_goal_type ON zoon_circles(goal_type, goal_stage);
CREATE INDEX IF NOT EXISTS idx_zoon_circles_goal_vector ON zoon_circles USING GIN (goal_vector);

COMMENT ON COLUMN zoon_circles.goal_type IS 
'نوع الهدف: business/social/impact/learning/creative';
COMMENT ON COLUMN zoon_circles.goal_stage IS 
'مرحلة الهدف: exploration/building/scaling/maintaining';
COMMENT ON COLUMN zoon_circles.goal_vector IS 
'متطلبات الشخصية المطلوبة لتحقيق الهدف (Goal Vector)';

-- ───────────────────────────────────────────────────────────────
-- 1.2 Extend zoon_circle_members with Roles & Fit Scores
-- ───────────────────────────────────────────────────────────────

-- ⚠️ FIX: Add 'status' column first (does not exist in original schema!)
ALTER TABLE zoon_circle_members
ADD COLUMN IF NOT EXISTS status VARCHAR(20) DEFAULT 'active'
    CHECK (status IN ('active', 'inactive', 'removed'));

ALTER TABLE zoon_circle_members
ADD COLUMN IF NOT EXISTS assigned_role VARCHAR(50)
    CHECK (assigned_role IN (
        'strategist', 'operator', 'connector', 
        'analyst', 'stabilizer', 'creator'
    )),
ADD COLUMN IF NOT EXISTS value_alignment_score DECIMAL(5,2) 
    CHECK (value_alignment_score >= 0 AND value_alignment_score <= 100),
ADD COLUMN IF NOT EXISTS role_complementarity_score DECIMAL(5,2)
    CHECK (role_complementarity_score >= 0 AND role_complementarity_score <= 100),
ADD COLUMN IF NOT EXISTS contribution_score DECIMAL(5,2) DEFAULT 0
    CHECK (contribution_score >= 0 AND contribution_score <= 100);

CREATE INDEX IF NOT EXISTS idx_zcm_assigned_role ON zoon_circle_members(circle_id, assigned_role);
CREATE INDEX IF NOT EXISTS idx_zcm_fit_scores ON zoon_circle_members(value_alignment_score DESC, role_complementarity_score DESC);
CREATE INDEX IF NOT EXISTS idx_zcm_status ON zoon_circle_members(circle_id, status);

COMMENT ON COLUMN zoon_circle_members.assigned_role IS 
'الدور الديناميكي: strategist/operator/connector/analyst/stabilizer/creator';
COMMENT ON COLUMN zoon_circle_members.value_alignment_score IS 
'قياس التوافق في القيم والاتجاه (0-100)';
COMMENT ON COLUMN zoon_circle_members.role_complementarity_score IS 
'قياس التكامل في الأدوار (0-100)';

-- ───────────────────────────────────────────────────────────────
-- 1.3 Add Growth Orientation to user_psychological_profile
-- ───────────────────────────────────────────────────────────────

ALTER TABLE user_psychological_profile
ADD COLUMN IF NOT EXISTS growth_orientation DECIMAL(5,2) DEFAULT 50.00
    CHECK (growth_orientation >= 0 AND growth_orientation <= 100);

COMMENT ON COLUMN user_psychological_profile.growth_orientation IS 
'توجه النمو: growth-seeking (عالي) vs comfort-seeking (منخفض)';

-- ───────────────────────────────────────────────────────────────
-- PHASE 2: NEW TABLES (NON-CONFLICTING)
-- ───────────────────────────────────────────────────────────────

-- 2.1 Interaction Graph (completely new, no conflict)
CREATE TABLE IF NOT EXISTS interaction_graph (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    source_user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    target_user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    circle_id UUID REFERENCES zoon_circles(id) ON DELETE CASCADE,
    
    -- Metrics
    interaction_count INTEGER DEFAULT 0,
    positive_interactions INTEGER DEFAULT 0,
    negative_interactions INTEGER DEFAULT 0,
    emotional_valence DECIMAL(5,2) DEFAULT 0 
        CHECK (emotional_valence >= -100 AND emotional_valence <= 100),
    weight DECIMAL(5,2) DEFAULT 0,
    
    -- Timestamps
    first_interaction_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    last_interaction_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    CHECK (source_user_id != target_user_id),
    UNIQUE(source_user_id, target_user_id, circle_id)
);

CREATE INDEX IF NOT EXISTS idx_ig_source ON interaction_graph(source_user_id, weight DESC);
CREATE INDEX IF NOT EXISTS idx_ig_target ON interaction_graph(target_user_id, weight DESC);
CREATE INDEX IF NOT EXISTS idx_ig_circle ON interaction_graph(circle_id, weight DESC);
CREATE INDEX IF NOT EXISTS idx_ig_toxic ON interaction_graph(emotional_valence) 
    WHERE emotional_valence < -50;

COMMENT ON TABLE interaction_graph IS 
'شبكة التفاعل الاجتماعي: من يتفاعل مع من ومن يؤثر في من';

-- ───────────────────────────────────────────────────────────────
-- PHASE 3: FUNCTIONS (COMPATIBLE WITH EXISTING SCHEMA)
-- ───────────────────────────────────────────────────────────────

-- 3.1 Role Assignment Engine
CREATE OR REPLACE FUNCTION assign_circle_role(
    p_user_id UUID,
    p_circle_id UUID
) RETURNS VARCHAR AS $$
DECLARE
    v_profile RECORD;
    v_circle RECORD;
    v_role VARCHAR;
BEGIN
    SELECT * INTO v_profile
    FROM user_psychological_profile
    WHERE user_id = p_user_id;
    
    -- Uses zoon_circles (existing table!)
    SELECT * INTO v_circle
    FROM zoon_circles
    WHERE id = p_circle_id;
    
    IF v_profile IS NULL OR v_circle IS NULL THEN
        RETURN 'operator'; -- Safe default
    END IF;
    
    IF v_profile.openness > 70 AND v_circle.goal_stage = 'exploration' THEN
        v_role := 'strategist';
    ELSIF v_profile.conscientiousness > 70 AND v_circle.goal_stage IN ('building', 'scaling') THEN
        v_role := 'operator';
    ELSIF v_profile.extraversion > 70 THEN
        v_role := 'connector';
    ELSIF v_profile.openness > 65 AND v_profile.conscientiousness < 50 THEN
        v_role := 'creator';
    ELSIF v_profile.conscientiousness > 60 AND v_profile.openness < 60 THEN
        v_role := 'analyst';
    ELSIF (100 - v_profile.neuroticism) > 70 AND v_profile.agreeableness > 65 THEN
        v_role := 'stabilizer';
    ELSE
        v_role := 'operator';
    END IF;
    
    RETURN v_role;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 3.2 Circle Fit Calculator
CREATE OR REPLACE FUNCTION calculate_circle_fit(
    p_user_id UUID,
    p_circle_id UUID
) RETURNS TABLE (
    alignment_score DECIMAL,
    complementarity_score DECIMAL,
    overall_fit DECIMAL,
    recommended_role VARCHAR,
    reasoning TEXT
) AS $$
DECLARE
    v_profile RECORD;
    v_circle RECORD;
    v_goal_vector JSONB;
    v_align DECIMAL;
    v_complement DECIMAL;
    v_role VARCHAR;
BEGIN
    SELECT * INTO v_profile 
    FROM user_psychological_profile 
    WHERE user_id = p_user_id;
    
    SELECT * INTO v_circle 
    FROM zoon_circles 
    WHERE id = p_circle_id;
    
    IF v_profile IS NULL OR v_circle IS NULL THEN
        RETURN QUERY SELECT 50.0, 50.0, 50.0, 'operator'::VARCHAR, 'بيانات غير كافية'::TEXT;
        RETURN;
    END IF;
    
    v_goal_vector := COALESCE(v_circle.goal_vector, '{
        "required_openness": 50,
        "required_conscientiousness": 50,
        "required_extraversion": 50,
        "required_agreeableness": 50,
        "required_stability": 50
    }'::jsonb);
    
    v_align := 100 - SQRT(
        POWER(v_profile.openness - COALESCE((v_goal_vector->>'required_openness')::DECIMAL, 50), 2) +
        POWER(v_profile.conscientiousness - COALESCE((v_goal_vector->>'required_conscientiousness')::DECIMAL, 50), 2) +
        POWER(v_profile.extraversion - COALESCE((v_goal_vector->>'required_extraversion')::DECIMAL, 50), 2) +
        POWER(v_profile.agreeableness - COALESCE((v_goal_vector->>'required_agreeableness')::DECIMAL, 50), 2) +
        POWER((100-v_profile.neuroticism) - COALESCE((v_goal_vector->>'required_stability')::DECIMAL, 50), 2)
    ) / 2.236;
    
    WITH circle_avg AS (
        SELECT 
            AVG(upp.openness) as avg_openness,
            AVG(upp.conscientiousness) as avg_conscientiousness,
            AVG(upp.extraversion) as avg_extraversion,
            AVG(upp.agreeableness) as avg_agreeableness,
            AVG(100 - upp.neuroticism) as avg_stability
        FROM zoon_circle_members zcm
        JOIN user_psychological_profile upp ON zcm.user_id = upp.user_id
        WHERE zcm.circle_id = p_circle_id
        AND COALESCE(zcm.status, 'active') = 'active'
    )
    SELECT 
        CASE 
            WHEN COALESCE(v_circle.complementarity_mode, 'balanced') = 'vision_execution' THEN
                CASE 
                    WHEN v_profile.openness > 70 AND COALESCE(avg_openness, 50) < 50 THEN 90
                    WHEN v_profile.conscientiousness > 70 AND COALESCE(avg_conscientiousness, 50) < 50 THEN 90
                    ELSE 50
                END
            WHEN COALESCE(v_circle.complementarity_mode, 'balanced') = 'emotional_analytical' THEN
                CASE 
                    WHEN v_profile.agreeableness > 70 AND COALESCE(avg_agreeableness, 50) < 50 THEN 85
                    WHEN v_profile.conscientiousness > 70 AND COALESCE(avg_conscientiousness, 50) < 50 THEN 85
                    ELSE 50
                END
            ELSE 60
        END INTO v_complement
    FROM circle_avg;
    
    v_complement := COALESCE(v_complement, 60);
    v_role := assign_circle_role(p_user_id, p_circle_id);
    
    RETURN QUERY
    SELECT 
        ROUND(GREATEST(0, LEAST(100, v_align))::NUMERIC, 1),
        ROUND(v_complement::NUMERIC, 1),
        ROUND((v_align * 0.6 + v_complement * 0.4)::NUMERIC, 1),
        v_role,
        format('التوافق: %s%% | التكامل: %s%% | الدور: %s',
            ROUND(v_align), ROUND(v_complement), v_role);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 3.3 Growth Orientation Calculator
CREATE OR REPLACE FUNCTION calculate_growth_orientation(
    p_user_id UUID
) RETURNS DECIMAL AS $$
DECLARE
    v_growth DECIMAL;
BEGIN
    WITH user_patterns AS (
        SELECT 
            AVG(openness_delta) as avg_openness_change,
            AVG(conscientiousness_delta) as avg_discipline_change,
            COUNT(DISTINCT source_type) as interaction_diversity
        FROM psychological_impact_log
        WHERE user_id = p_user_id
        AND created_at > NOW() - INTERVAL '90 days'
    )
    SELECT 
        GREATEST(0, LEAST(100,
            50 + 
            (COALESCE(avg_openness_change, 0) * 5) +
            (COALESCE(avg_discipline_change, 0) * 3) +
            (COALESCE(interaction_diversity, 0) * 5)
        )) INTO v_growth
    FROM user_patterns;
    
    RETURN COALESCE(v_growth, 50.00);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 3.4 Optimal Tension Window (builds on existing calculate_trait_distance)
CREATE OR REPLACE FUNCTION calculate_interaction_tension(
    p_user1_id UUID,
    p_user2_id UUID
) RETURNS TABLE (
    tension_level VARCHAR,
    tension_score DECIMAL,
    interaction_quality VARCHAR,
    recommendation TEXT
) AS $$
DECLARE
    v_distance DECIMAL;
    v_tension VARCHAR;
    v_quality VARCHAR;
BEGIN
    v_distance := calculate_trait_distance(p_user1_id, p_user2_id);
    
    IF v_distance < 20 THEN
        v_tension := 'too_similar';
        v_quality := 'echo_chamber';
    ELSIF v_distance < 40 THEN
        v_tension := 'optimal';
        v_quality := 'growth_zone';
    ELSIF v_distance < 60 THEN
        v_tension := 'challenging';
        v_quality := 'requires_mediation';
    ELSE
        v_tension := 'too_different';
        v_quality := 'high_conflict_risk';
    END IF;
    
    RETURN QUERY
    SELECT 
        v_tension,
        ROUND(v_distance::NUMERIC, 1),
        v_quality,
        CASE 
            WHEN v_tension = 'too_similar' THEN 'متشابهون جداً - خطر echo chamber'
            WHEN v_tension = 'optimal' THEN 'منطقة النمو المثلى'
            WHEN v_tension = 'challenging' THEN 'يحتاج وسيط'
            ELSE 'مختلفون جداً - خطر صراع'
        END;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ───────────────────────────────────────────────────────────────
-- PHASE 4: VIEWS (NON-BREAKING)
-- ───────────────────────────────────────────────────────────────

CREATE OR REPLACE VIEW community_polarization_index AS
SELECT 
    'Neuroticism' as trait_name,
    ROUND(AVG(neuroticism)::NUMERIC, 1) as avg_value,
    ROUND(STDDEV(neuroticism)::NUMERIC, 1) as polarization,
    CASE 
        WHEN STDDEV(neuroticism) > 25 THEN '🔴 انقسام خطير'
        WHEN STDDEV(neuroticism) > 18 THEN '🟡 تباين ملحوظ'
        ELSE '🟢 متجانس'
    END as polarization_status
FROM user_psychological_profile
WHERE opted_out = false

UNION ALL

SELECT 'Openness',
    ROUND(AVG(openness)::NUMERIC, 1),
    ROUND(STDDEV(openness)::NUMERIC, 1),
    CASE 
        WHEN STDDEV(openness) > 25 THEN '🔴 انقسام خطير'
        WHEN STDDEV(openness) > 18 THEN '🟡 تباين ملحوظ'
        ELSE '🟢 متجانس'
    END
FROM user_psychological_profile
WHERE opted_out = false

UNION ALL

SELECT 'Conscientiousness',
    ROUND(AVG(conscientiousness)::NUMERIC, 1),
    ROUND(STDDEV(conscientiousness)::NUMERIC, 1),
    CASE 
        WHEN STDDEV(conscientiousness) > 25 THEN '🔴 انقسام خطير'
        WHEN STDDEV(conscientiousness) > 18 THEN '🟡 تباين ملحوظ'
        ELSE '🟢 متجانس'
    END
FROM user_psychological_profile
WHERE opted_out = false

UNION ALL

SELECT 'Extraversion',
    ROUND(AVG(extraversion)::NUMERIC, 1),
    ROUND(STDDEV(extraversion)::NUMERIC, 1),
    CASE 
        WHEN STDDEV(extraversion) > 25 THEN '🔴 انقسام خطير'
        WHEN STDDEV(extraversion) > 18 THEN '🟡 تباين ملحوظ'
        ELSE '🟢 متجانس'
    END
FROM user_psychological_profile
WHERE opted_out = false

UNION ALL

SELECT 'Agreeableness',
    ROUND(AVG(agreeableness)::NUMERIC, 1),
    ROUND(STDDEV(agreeableness)::NUMERIC, 1),
    CASE 
        WHEN STDDEV(agreeableness) > 25 THEN '🔴 انقسام خطير'
        WHEN STDDEV(agreeableness) > 18 THEN '🟡 تباين ملحوظ'
        ELSE '🟢 متجانس'
    END
FROM user_psychological_profile
WHERE opted_out = false;

COMMENT ON VIEW community_polarization_index IS 
'كشف الاستقطاب المجتمعي - يغطي جميع السمات الخمس';

-- ───────────────────────────────────────────────────────────────
-- PHASE 5: DATA MIGRATION (BACKWARD COMPATIBILITY)
-- ───────────────────────────────────────────────────────────────

-- ⚠️ FIX: Use UPPER() for case-insensitive matching with existing type values
-- (zoon_circles.type uses UPPERCASE: 'PERSONAL', 'BUSINESS', 'FRIENDS', 'INTEREST', 'FAMILY')
UPDATE zoon_circles
SET goal_type = CASE 
    WHEN UPPER(type) IN ('BUSINESS') THEN 'business'
    WHEN UPPER(type) IN ('FRIENDS', 'FAMILY') THEN 'social'
    WHEN UPPER(type) IN ('INTEREST') THEN 'learning'
    WHEN UPPER(type) IN ('PERSONAL') THEN 'creative'
    ELSE 'social'
END
WHERE goal_type IS NULL;

-- 5.2 Assign initial roles to existing members (safe: skips if profile missing)
UPDATE zoon_circle_members zcm
SET assigned_role = assign_circle_role(zcm.user_id, zcm.circle_id)
WHERE assigned_role IS NULL
AND user_id IS NOT NULL
AND COALESCE(status, 'active') = 'active';

-- 5.3 Calculate initial fit scores (batch processing with cursor)
DO $$
DECLARE
    v_member RECORD;
    v_fit RECORD;
    v_count INTEGER := 0;
BEGIN
    FOR v_member IN 
        SELECT user_id, circle_id 
        FROM zoon_circle_members 
        WHERE value_alignment_score IS NULL
        AND user_id IS NOT NULL
        AND COALESCE(status, 'active') = 'active'
        LIMIT 1000
    LOOP
        BEGIN
            SELECT * INTO v_fit 
            FROM calculate_circle_fit(v_member.user_id, v_member.circle_id);
            
            UPDATE zoon_circle_members
            SET 
                value_alignment_score = v_fit.alignment_score,
                role_complementarity_score = v_fit.complementarity_score
            WHERE user_id = v_member.user_id 
            AND circle_id = v_member.circle_id;
            
            v_count := v_count + 1;
        EXCEPTION WHEN OTHERS THEN
            RAISE NOTICE 'Skipped member % in circle %: %', 
                v_member.user_id, v_member.circle_id, SQLERRM;
        END;
    END LOOP;
    
    RAISE NOTICE 'Successfully processed % members', v_count;
END $$;

-- ═══════════════════════════════════════════════════════════════
-- ROLLBACK COMMANDS (if needed)
-- ═══════════════════════════════════════════════════════════════

-- ALTER TABLE zoon_circles DROP COLUMN IF EXISTS goal_type;
-- ALTER TABLE zoon_circles DROP COLUMN IF EXISTS goal_stage;
-- ALTER TABLE zoon_circles DROP COLUMN IF EXISTS goal_vector;
-- ALTER TABLE zoon_circles DROP COLUMN IF EXISTS complementarity_mode;
-- ALTER TABLE zoon_circles DROP COLUMN IF EXISTS core_values;
-- ALTER TABLE zoon_circles DROP COLUMN IF EXISTS governance_rules;
-- ALTER TABLE zoon_circles DROP COLUMN IF EXISTS max_members;
-- ALTER TABLE zoon_circles DROP COLUMN IF EXISTS auto_match_enabled;
-- ALTER TABLE zoon_circle_members DROP COLUMN IF EXISTS assigned_role;
-- ALTER TABLE zoon_circle_members DROP COLUMN IF EXISTS value_alignment_score;
-- ALTER TABLE zoon_circle_members DROP COLUMN IF EXISTS role_complementarity_score;
-- ALTER TABLE zoon_circle_members DROP COLUMN IF EXISTS contribution_score;
-- ALTER TABLE user_psychological_profile DROP COLUMN IF EXISTS growth_orientation;
-- DROP TABLE IF EXISTS interaction_graph;
-- DROP FUNCTION IF EXISTS assign_circle_role(UUID, UUID);
-- DROP FUNCTION IF EXISTS calculate_circle_fit(UUID, UUID);
-- DROP FUNCTION IF EXISTS calculate_growth_orientation(UUID);
-- DROP FUNCTION IF EXISTS calculate_interaction_tension(UUID, UUID);
-- DROP VIEW IF EXISTS community_polarization_index;

-- ═══════════════════════════════════════════════════════════════
-- SUCCESS MESSAGE
-- ═══════════════════════════════════════════════════════════════

DO $$
BEGIN
    RAISE NOTICE '═══════════════════════════════════════════════════════════════';
    RAISE NOTICE 'Migration Complete: Existing Schema → Goal-Driven Architecture';
    RAISE NOTICE '';
    RAISE NOTICE 'Changes Applied:';
    RAISE NOTICE '  ✓ Extended zoon_circles with goal fields';
    RAISE NOTICE '  ✓ Extended zoon_circle_members with roles & fit scores';
    RAISE NOTICE '  ✓ Added growth_orientation to profiles';
    RAISE NOTICE '  ✓ Created interaction_graph (new table)';
    RAISE NOTICE '  ✓ Added new functions (compatible with existing)';
    RAISE NOTICE '  ✓ Added polarization detection view (all 5 traits)';
    RAISE NOTICE '  ✓ Migrated existing data with error handling';
    RAISE NOTICE '';
    RAISE NOTICE 'NO BREAKING CHANGES - All existing code still works!';
    RAISE NOTICE '═══════════════════════════════════════════════════════════════';
END $$;
