-- ═══════════════════════════════════════════════════════════════
-- Goal-Driven Social Architecture V2.0
-- From Person × Person to Person × Goal × Role
-- ═══════════════════════════════════════════════════════════════

-- ───────────────────────────────────────────────────────────────
-- 1. POLARIZATION DETECTION (Critical Missing Piece!)
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
    END as polarization_status,
    CASE 
        WHEN STDDEV(neuroticism) > 25 THEN 
            'المجتمع منقسم بين متوترين جداً ومستقرين جداً - خطر صراع'
        ELSE 'توزيع طبيعي'
    END as interpretation
FROM user_psychological_profile
WHERE opted_out = false

UNION ALL

SELECT 
    'Openness',
    ROUND(AVG(openness)::NUMERIC, 1),
    ROUND(STDDEV(openness)::NUMERIC, 1),
    CASE 
        WHEN STDDEV(openness) > 25 THEN '🔴 انقسام خطير'
        WHEN STDDEV(openness) > 18 THEN '🟡 تباين ملحوظ'
        ELSE '🟢 متجانس'
    END,
    CASE 
        WHEN STDDEV(openness) > 25 THEN 
            'انقسام بين مبدعين ومحافظين - echo chambers محتملة'
        ELSE 'تنوع صحي'
    END
FROM user_psychological_profile
WHERE opted_out = false

UNION ALL

SELECT 
    'Agreeableness',
    ROUND(AVG(agreeableness)::NUMERIC, 1),
    ROUND(STDDEV(agreeableness)::NUMERIC, 1),
    CASE 
        WHEN STDDEV(agreeableness) > 25 THEN '🔴 انقسام خطير'
        WHEN STDDEV(agreeableness) > 18 THEN '🟡 تباين ملحوظ'
        ELSE '🟢 متجانس'
    END,
    CASE 
        WHEN STDDEV(agreeableness) > 25 THEN 
            'انقسام بين متعاونين وتنافسيين - خطر صراع عالي'
        ELSE 'تعاون صحي'
    END
FROM user_psychological_profile
WHERE opted_out = false;

COMMENT ON VIEW community_polarization_index IS 
'كشف الاستقطاب: المتوسط لا يكفي - التباين هو المؤشر الخطير';

-- ───────────────────────────────────────────────────────────────
-- 2. CIRCLES (SCOPES) - Goal-Driven Architecture
-- ───────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS circles (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(255) NOT NULL,
    description TEXT,
    founder_id UUID NOT NULL REFERENCES users(id),
    
    -- Goal Definition Layer
    goal_type VARCHAR(50) NOT NULL CHECK (goal_type IN (
        'business',      -- بيزنس / إنتاج
        'social',        -- اجتماعي / ترفيهي
        'impact',        -- تأثير / خيري
        'learning',      -- تعليمي / نمو شخصي
        'creative'       -- إبداعي / فني
    )),
    
    goal_stage VARCHAR(50) NOT NULL CHECK (goal_stage IN (
        'exploration',   -- استكشاف / brainstorming
        'building',      -- بناء / تنفيذ
        'scaling',       -- توسع / نمو
        'maintaining'    -- صيانة / استقرار
    )),
    
    -- Goal Vector (Required Traits)
    goal_vector JSONB NOT NULL DEFAULT '{
        "required_openness": 50,
        "required_conscientiousness": 50,
        "required_extraversion": 50,
        "required_agreeableness": 50,
        "required_stability": 50
    }'::jsonb,
    
    -- Complementarity Pattern
    complementarity_mode VARCHAR(50) NOT NULL CHECK (complementarity_mode IN (
        'vision_execution',      -- مبدعون + منفذون
        'emotional_analytical',  -- عاطفيون + تحليليون
        'network_operator',      -- اجتماعيون + منظمون
        'creative_disciplined',  -- إبداع + انضباط
        'balanced'               -- متوازن
    )),
    
    -- Core Values (Must Align)
    core_values JSONB NOT NULL DEFAULT '[]'::jsonb,
    
    -- Settings
    max_members INTEGER DEFAULT 50,
    is_private BOOLEAN DEFAULT false,
    auto_match_enabled BOOLEAN DEFAULT true,
    
    -- Governance
    governance_rules JSONB DEFAULT '{
        "can_members_vote": true,
        "can_merge_circles": false,
        "min_value_alignment": 70,
        "leader_removal_threshold": 80
    }'::jsonb,
    
    -- Metadata
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_circles_founder ON circles(founder_id);
CREATE INDEX idx_circles_goal_type ON circles(goal_type, goal_stage);

COMMENT ON TABLE circles IS 
'الدوائر: مساحات هدفية يقودها مؤسسون - Person × Goal × Role';

-- ───────────────────────────────────────────────────────────────
-- 3. CIRCLE MEMBERSHIPS WITH ROLES
-- ───────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS circle_members (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    circle_id UUID NOT NULL REFERENCES circles(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    
    -- Dynamic Role Assignment
    assigned_role VARCHAR(50) CHECK (assigned_role IN (
        'strategist',    -- رؤية / استراتيجية
        'operator',      -- تنفيذ / عمليات
        'connector',     -- شبكات / علاقات
        'analyst',       -- تحليل / بيانات
        'stabilizer',    -- استقرار / دعم
        'creator'        -- إبداع / محتوى
    )),
    
    -- Fit Scores
    value_alignment_score DECIMAL(5,2) CHECK (value_alignment_score >= 0 AND value_alignment_score <= 100),
    role_complementarity_score DECIMAL(5,2) CHECK (role_complementarity_score >= 0 AND role_complementarity_score <= 100),
    contribution_score DECIMAL(5,2) DEFAULT 0,
    
    -- Status
    status VARCHAR(20) DEFAULT 'active' CHECK (status IN ('active', 'inactive', 'removed')),
    joined_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    UNIQUE(circle_id, user_id)
);

CREATE INDEX idx_circle_members_circle ON circle_members(circle_id, status);
CREATE INDEX idx_circle_members_user ON circle_members(user_id, status);
CREATE INDEX idx_circle_members_role ON circle_members(circle_id, assigned_role);

COMMENT ON TABLE circle_members IS 
'عضوية الدوائر مع أدوار ديناميكية وقياسات توافق';

-- ───────────────────────────────────────────────────────────────
-- 4. INTERACTION GRAPH (Critical Missing Layer!)
-- ───────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS interaction_graph (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    source_user_id UUID NOT NULL REFERENCES users(id),
    target_user_id UUID NOT NULL REFERENCES users(id),
    circle_id UUID REFERENCES circles(id) ON DELETE CASCADE,
    
    -- Interaction Metrics
    interaction_count INTEGER DEFAULT 0,
    positive_interactions INTEGER DEFAULT 0,
    negative_interactions INTEGER DEFAULT 0,
    
    -- Emotional Valence (-100 to +100)
    emotional_valence DECIMAL(5,2) DEFAULT 0 CHECK (emotional_valence >= -100 AND emotional_valence <= 100),
    
    -- Weight (strength of connection)
    weight DECIMAL(5,2) DEFAULT 0,
    
    -- Timestamps
    first_interaction_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    last_interaction_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    CHECK (source_user_id != target_user_id),
    UNIQUE(source_user_id, target_user_id, circle_id)
);

CREATE INDEX idx_interaction_source ON interaction_graph(source_user_id, weight DESC);
CREATE INDEX idx_interaction_target ON interaction_graph(target_user_id, weight DESC);
CREATE INDEX idx_interaction_circle ON interaction_graph(circle_id, weight DESC);
CREATE INDEX idx_interaction_valence ON interaction_graph(emotional_valence) 
    WHERE emotional_valence < -50; -- Flag toxic interactions

COMMENT ON TABLE interaction_graph IS 
'الشبكة الاجتماعية: من يتفاعل مع من؟ من يؤثر في من؟';

-- ───────────────────────────────────────────────────────────────
-- 5. ROLE ASSIGNMENT ENGINE
-- ───────────────────────────────────────────────────────────────

CREATE OR REPLACE FUNCTION assign_circle_role(
    p_user_id UUID,
    p_circle_id UUID
) RETURNS VARCHAR AS $$
DECLARE
    v_profile RECORD;
    v_circle RECORD;
    v_role VARCHAR;
BEGIN
    -- Get user profile
    SELECT * INTO v_profile
    FROM user_psychological_profile
    WHERE user_id = p_user_id;
    
    -- Get circle info
    SELECT * INTO v_circle
    FROM circles
    WHERE id = p_circle_id;
    
    -- Role assignment logic based on personality + circle needs
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
        v_role := 'operator'; -- default
    END IF;
    
    RETURN v_role;
END;
$$ LANGUAGE plpgsql;

COMMENT ON FUNCTION assign_circle_role(UUID, UUID) IS 
'تعيين دور ديناميكي بناءً على: الشخصية × احتياجات الدائرة';

-- ───────────────────────────────────────────────────────────────
-- 6. ALIGNMENT vs COMPLEMENTARITY SCORING
-- ───────────────────────────────────────────────────────────────

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
    SELECT * INTO v_profile FROM user_psychological_profile WHERE user_id = p_user_id;
    SELECT * INTO v_circle FROM circles WHERE id = p_circle_id;
    v_goal_vector := v_circle.goal_vector;
    
    -- 1. Calculate Alignment Score (Direction match)
    v_align := 100 - SQRT(
        POWER(v_profile.openness - (v_goal_vector->>'required_openness')::DECIMAL, 2) +
        POWER(v_profile.conscientiousness - (v_goal_vector->>'required_conscientiousness')::DECIMAL, 2) +
        POWER(v_profile.extraversion - (v_goal_vector->>'required_extraversion')::DECIMAL, 2) +
        POWER(v_profile.agreeableness - (v_goal_vector->>'required_agreeableness')::DECIMAL, 2) +
        POWER((100-v_profile.neuroticism) - (v_goal_vector->>'required_stability')::DECIMAL, 2)
    ) / 2.236; -- Normalize to 0-100
    
    -- 2. Calculate Complementarity Score
    WITH circle_avg AS (
        SELECT 
            AVG(upp.openness) as avg_openness,
            AVG(upp.conscientiousness) as avg_conscientiousness,
            AVG(upp.extraversion) as avg_extraversion,
            AVG(upp.agreeableness) as avg_agreeableness,
            AVG(100 - upp.neuroticism) as avg_stability
        FROM circle_members cm
        JOIN user_psychological_profile upp ON cm.user_id = upp.user_id
        WHERE cm.circle_id = p_circle_id
        AND cm.status = 'active'
    )
    SELECT 
        CASE 
            WHEN v_circle.complementarity_mode = 'vision_execution' THEN
                CASE 
                    WHEN v_profile.openness > 70 AND avg_openness < 50 THEN 90
                    WHEN v_profile.conscientiousness > 70 AND avg_conscientiousness < 50 THEN 90
                    ELSE 50
                END
            WHEN v_circle.complementarity_mode = 'emotional_analytical' THEN
                CASE 
                    WHEN v_profile.agreeableness > 70 AND avg_agreeableness < 50 THEN 85
                    WHEN v_profile.conscientiousness > 70 AND avg_conscientiousness < 50 THEN 85
                    ELSE 50
                END
            ELSE 60
        END INTO v_complement
    FROM circle_avg;
    
    v_role := assign_circle_role(p_user_id, p_circle_id);
    
    RETURN QUERY
    SELECT 
        ROUND(GREATEST(0, LEAST(100, v_align))::NUMERIC, 1) as alignment_score,
        ROUND(v_complement::NUMERIC, 1) as complementarity_score,
        ROUND((v_align * 0.6 + v_complement * 0.4)::NUMERIC, 1) as overall_fit,
        v_role as recommended_role,
        format(
            'التوافق: %s%% | التكامل: %s%% | الدور المقترح: %s',
            ROUND(v_align),
            ROUND(v_complement),
            v_role
        ) as reasoning;
END;
$$ LANGUAGE plpgsql;

COMMENT ON FUNCTION calculate_circle_fit(UUID, UUID) IS 
'محرك التوافق والتكامل: Alignment (قيم) + Complementarity (أدوار)';

-- ───────────────────────────────────────────────────────────────
-- 7. GROWTH ORIENTATION SCORE (New Trait!)
-- ───────────────────────────────────────────────────────────────

ALTER TABLE user_psychological_profile
ADD COLUMN IF NOT EXISTS growth_orientation DECIMAL(5,2) DEFAULT 50.00 
    CHECK (growth_orientation >= 0 AND growth_orientation <= 100);

COMMENT ON COLUMN user_psychological_profile.growth_orientation IS 
'توجه النمو: هل الشخص يميل للتطور؟ أم الراحة؟ أم الهيمنة؟';

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
            (avg_openness_change * 5) +
            (avg_discipline_change * 3) +
            (interaction_diversity * 5)
        )) INTO v_growth
    FROM user_patterns;
    
    RETURN COALESCE(v_growth, 50.00);
END;
$$ LANGUAGE plpgsql;

COMMENT ON FUNCTION calculate_growth_orientation(UUID) IS 
'حساب توجه النمو من السلوك الفعلي (استكشاف + التزام + تنوع)';

-- ───────────────────────────────────────────────────────────────
-- 8. OPTIMAL TENSION WINDOW
-- ───────────────────────────────────────────────────────────────

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
        v_tension as tension_level,
        ROUND(v_distance::NUMERIC, 1) as tension_score,
        v_quality as interaction_quality,
        CASE 
            WHEN v_tension = 'too_similar' THEN 
                'متشابهون جداً - خطر echo chamber - اقترح تنوع'
            WHEN v_tension = 'optimal' THEN 
                'منطقة التوتر المثلى - نمو صحي متوقع'
            WHEN v_tension = 'challenging' THEN 
                'اختلاف كبير - يحتاج وسيط أو هيكلة'
            ELSE 
                'مختلفون جداً - خطر صراع عالي - تجنب التفاعل المباشر'
        END as recommendation;
END;
$$ LANGUAGE plpgsql;

COMMENT ON FUNCTION calculate_interaction_tension(UUID, UUID) IS 
'نافذة التوتر المثلى: لا تشابه مطلق ولا اختلاف متطرف';

-- ═══════════════════════════════════════════════════════════════
-- SUCCESS MESSAGE
-- ═══════════════════════════════════════════════════════════════

DO $$
BEGIN
    RAISE NOTICE '═══════════════════════════════════════════════════════════════';
    RAISE NOTICE 'Goal-Driven Social Architecture Applied!';
    RAISE NOTICE '';
    RAISE NOTICE 'New Capabilities:';
    RAISE NOTICE '  ✓ Polarization Detection (STDDEV-based)';
    RAISE NOTICE '  ✓ Circles with Goal Vectors';
    RAISE NOTICE '  ✓ Dynamic Role Assignment';
    RAISE NOTICE '  ✓ Interaction Graph (who influences whom)';
    RAISE NOTICE '  ✓ Alignment vs Complementarity Engine';
    RAISE NOTICE '  ✓ Growth Orientation Score';
    RAISE NOTICE '  ✓ Optimal Tension Window';
    RAISE NOTICE '';
    RAISE NOTICE 'Philosophy: Person × Goal × Role > Person × Person';
    RAISE NOTICE '═══════════════════════════════════════════════════════════════';
END $$;
