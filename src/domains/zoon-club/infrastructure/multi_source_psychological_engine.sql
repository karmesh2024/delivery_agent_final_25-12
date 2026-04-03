-- ═══════════════════════════════════════════════════════════════
-- MASTER MIGRATION: Goal-Driven Architecture + Multi-Source Engine
-- Date: 2026-02-14
-- Version: 3.0 (Includes Goal-Driven Circles + Fast Data Sources)
-- ═══════════════════════════════════════════════════════════════

-- ───────────────────────────────────────────────────────────────
-- PART 1: GOAL-DRIVEN SOCIAL ARCHITECTURE (The Structure)
-- ───────────────────────────────────────────────────────────────

-- 1.1 Extend zoon_circles
ALTER TABLE zoon_circles
ADD COLUMN IF NOT EXISTS goal_type VARCHAR(50) 
    CHECK (goal_type IN ('business', 'social', 'impact', 'learning', 'creative')),
ADD COLUMN IF NOT EXISTS goal_stage VARCHAR(50) DEFAULT 'exploration'
    CHECK (goal_stage IN ('exploration', 'building', 'scaling', 'maintaining')),
ADD COLUMN IF NOT EXISTS goal_vector JSONB DEFAULT '{
    "required_openness": 50, "required_conscientiousness": 50, "required_extraversion": 50, 
    "required_agreeableness": 50, "required_stability": 50
}'::jsonb,
ADD COLUMN IF NOT EXISTS complementarity_mode VARCHAR(50) DEFAULT 'balanced',
ADD COLUMN IF NOT EXISTS core_values JSONB DEFAULT '[]'::jsonb,
ADD COLUMN IF NOT EXISTS governance_rules JSONB DEFAULT '{"can_members_vote": true}'::jsonb;

CREATE INDEX IF NOT EXISTS idx_circles_goal ON zoon_circles(goal_type, goal_stage);

-- 1.2 Extend zoon_circle_members
ALTER TABLE zoon_circle_members
ADD COLUMN IF NOT EXISTS status VARCHAR(20) DEFAULT 'active',
ADD COLUMN IF NOT EXISTS assigned_role VARCHAR(50),
ADD COLUMN IF NOT EXISTS value_alignment_score DECIMAL(5,2),
ADD COLUMN IF NOT EXISTS role_complementarity_score DECIMAL(5,2),
ADD COLUMN IF NOT EXISTS contribution_score DECIMAL(5,2) DEFAULT 0;

CREATE INDEX IF NOT EXISTS idx_members_role ON zoon_circle_members(assigned_role);

-- 1.3 Interaction Graph
CREATE TABLE IF NOT EXISTS interaction_graph (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    source_user_id UUID REFERENCES auth.users(id),
    target_user_id UUID REFERENCES auth.users(id),
    circle_id UUID REFERENCES zoon_circles(id),
    interaction_count INTEGER DEFAULT 0,
    emotional_valence DECIMAL(5,2) DEFAULT 0,
    weight DECIMAL(5,2) DEFAULT 0,
    last_interaction_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(source_user_id, target_user_id, circle_id)
);

-- ───────────────────────────────────────────────────────────────
-- PART 2: MULTI-SOURCE DATA ENGINE (The Speed)
-- ───────────────────────────────────────────────────────────────

-- 2.1 Room Entry/Exit Questions (Immediate Data)
CREATE TABLE IF NOT EXISTS room_entry_exit_questions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    room_id UUID, -- Can be linked to a specific room or NULL for global
    question_text TEXT NOT NULL,
    question_type VARCHAR(20) CHECK (question_type IN ('entry', 'exit')),
    options JSONB NOT NULL,  -- [{"text": "...", "trait": "openness", "weight": 5}]
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS room_question_responses (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id),
    question_id UUID REFERENCES room_entry_exit_questions(id),
    selected_option INTEGER,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Trigger: Convert Answer -> Psychological Impact
CREATE OR REPLACE FUNCTION process_room_question_response()
RETURNS TRIGGER AS $$
DECLARE
    v_question RECORD;
    v_option JSONB;
BEGIN
    SELECT * INTO v_question FROM room_entry_exit_questions WHERE id = NEW.question_id;
    v_option := (v_question.options->NEW.selected_option);
    
    INSERT INTO psychological_impact_log (
        user_id, source_type, source_id,
        openness_delta, conscientiousness_delta, extraversion_delta,
        agreeableness_delta, neuroticism_delta
    ) VALUES (
        NEW.user_id, 'room_question', NEW.id,
        COALESCE((v_option->>'openness')::DECIMAL, 0) * 1.2,
        COALESCE((v_option->>'conscientiousness')::DECIMAL, 0) * 1.2,
        COALESCE((v_option->>'extraversion')::DECIMAL, 0) * 1.2,
        COALESCE((v_option->>'agreeableness')::DECIMAL, 0) * 1.2,
        COALESCE((v_option->>'neuroticism')::DECIMAL, 0) * 1.2
    );
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS trigger_room_question_impact ON room_question_responses;
CREATE TRIGGER trigger_room_question_impact
AFTER INSERT ON room_question_responses
FOR EACH ROW EXECUTE FUNCTION process_room_question_response();

-- 2.2 Radio Experience (Deep Engagement)
CREATE TABLE IF NOT EXISTS radio_episodes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    title TEXT NOT NULL,
    topic VARCHAR(100),
    duration_seconds INTEGER,
    psychological_profile JSONB,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS radio_interactions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id),
    episode_id UUID REFERENCES radio_episodes(id),
    listened_duration INTEGER,
    reactions JSONB,
    shared BOOLEAN DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Trigger: Convert Radio -> Psychological Impact
CREATE OR REPLACE FUNCTION process_radio_interaction()
RETURNS TRIGGER AS $$
DECLARE
    v_episode RECORD;
    v_factor DECIMAL;
BEGIN
    SELECT * INTO v_episode FROM radio_episodes WHERE id = NEW.episode_id;
    -- Engagement Factor: Percentage of episode listened (Max 1.0)
    v_factor := LEAST(1.0, NEW.listened_duration::DECIMAL / NULLIF(v_episode.duration_seconds, 1));
    
    INSERT INTO psychological_impact_log (
        user_id, source_type, source_id,
        openness_delta, conscientiousness_delta, extraversion_delta,
        agreeableness_delta, neuroticism_delta
    ) VALUES (
        NEW.user_id, 'radio', NEW.id,
        COALESCE((v_episode.psychological_profile->>'openness')::DECIMAL, 0) * v_factor * 1.8,
        COALESCE((v_episode.psychological_profile->>'conscientiousness')::DECIMAL, 0) * v_factor * 1.8,
        COALESCE((v_episode.psychological_profile->>'extraversion')::DECIMAL, 0) * v_factor * 1.8,
        COALESCE((v_episode.psychological_profile->>'agreeableness')::DECIMAL, 0) * v_factor * 1.8,
        COALESCE((v_episode.psychological_profile->>'neuroticism')::DECIMAL, 0) * v_factor * 1.8
    );
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS trigger_radio_impact ON radio_interactions;
CREATE TRIGGER trigger_radio_impact
AFTER INSERT ON radio_interactions
FOR EACH ROW EXECUTE FUNCTION process_radio_interaction();

-- ───────────────────────────────────────────────────────────────
-- PART 3: UTILITY FUNCTIONS (Role Assignment & Fit)
-- ───────────────────────────────────────────────────────────────

-- 3.1 Role Assignment (Using existing 'zoon_circles')
CREATE OR REPLACE FUNCTION assign_circle_role(p_user_id UUID, p_circle_id UUID) 
RETURNS VARCHAR AS $$
DECLARE
    v_profile RECORD;
    v_circle RECORD;
BEGIN
    SELECT * INTO v_profile FROM user_psychological_profile WHERE user_id = p_user_id;
    SELECT * INTO v_circle FROM zoon_circles WHERE id = p_circle_id;
    
    IF v_profile IS NULL THEN RETURN 'operator'; END IF;

    IF v_profile.openness > 70 AND v_circle.goal_stage = 'exploration' THEN RETURN 'strategist';
    ELSIF v_profile.conscientiousness > 70 AND v_circle.goal_stage IN ('building','scaling') THEN RETURN 'operator';
    ELSIF v_profile.extraversion > 70 THEN RETURN 'connector';
    ELSIF v_profile.openness > 65 AND v_profile.conscientiousness < 50 THEN RETURN 'creator';
    ELSIF (100 - v_profile.neuroticism) > 70 AND v_profile.agreeableness > 65 THEN RETURN 'stabilizer';
    ELSE RETURN 'operator';
    END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 3.2 Calculate Fit (Fixed Null Safety)
CREATE OR REPLACE FUNCTION calculate_circle_fit(p_user_id UUID, p_circle_id UUID)
RETURNS TABLE (
    alignment_score DECIMAL, complementarity_score DECIMAL, overall_fit DECIMAL, recommended_role VARCHAR
) AS $$
DECLARE
    v_profile RECORD;
    v_circle RECORD;
    v_vector JSONB;
    v_align DECIMAL;
BEGIN
    SELECT * INTO v_profile FROM user_psychological_profile WHERE user_id = p_user_id;
    SELECT * INTO v_circle FROM zoon_circles WHERE id = p_circle_id;
    
    IF v_profile IS NULL OR v_circle IS NULL THEN 
        RETURN QUERY SELECT 50.0, 50.0, 50.0, 'operator'::VARCHAR; RETURN; 
    END IF;

    v_vector := COALESCE(v_circle.goal_vector, '{"required_openness":50}'::jsonb);
    
    v_align := 100 - SQRT(
        POWER(v_profile.openness - COALESCE((v_vector->>'required_openness')::DECIMAL, 50), 2) +
        POWER(v_profile.conscientiousness - COALESCE((v_vector->>'required_conscientiousness')::DECIMAL, 50), 2)
    ) / 2.236;
    
    RETURN QUERY SELECT 
        ROUND(v_align::NUMERIC, 1), 
        60.0, -- Default complementarity for now
        ROUND((v_align * 0.6 + 60 * 0.4)::NUMERIC, 1), 
        assign_circle_role(p_user_id, p_circle_id);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ───────────────────────────────────────────────────────────────
-- PART 4: DATA MIGRATION (Safe & Idempotent)
-- ───────────────────────────────────────────────────────────────

-- 4.1 Update Goal Types based on existing types
UPDATE zoon_circles 
SET goal_type = CASE 
    WHEN UPPER(type) = 'BUSINESS' THEN 'business'
    WHEN UPPER(type) = 'INTEREST' THEN 'learning'
    WHEN UPPER(type) = 'PERSONAL' THEN 'creative'
    ELSE 'social'
END 
WHERE goal_type IS NULL;

-- 4.2 Assign Roles to existing members
DO $$
DECLARE
    r RECORD;
BEGIN
    FOR r IN SELECT * FROM zoon_circle_members WHERE assigned_role IS NULL LIMIT 1000 LOOP
        UPDATE zoon_circle_members 
        SET assigned_role = assign_circle_role(user_id, circle_id),
            status = COALESCE(status, 'active')
        WHERE id = r.id;
    END LOOP;
END $$;

-- ═══════════════════════════════════════════════════════════════
-- SUCCESS
-- ═══════════════════════════════════════════════════════════════
DO $$ BEGIN
    RAISE NOTICE 'Migration V3.0 Complete: Goal-Driven + Multi-Source Engine Ready 🚀';
END $$;
