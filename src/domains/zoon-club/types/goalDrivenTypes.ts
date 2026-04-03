// ═══════════════════════════════════════════════════════════════
// Goal-Driven Circle Types
// Extends the existing ZoonCircle types with goal-driven fields
// ═══════════════════════════════════════════════════════════════

// ───────────────────────────────────────────────────────────────
// Enums & Literal Types
// ───────────────────────────────────────────────────────────────

/** نوع هدف الدائرة */
export type GoalType = 'business' | 'social' | 'impact' | 'learning' | 'creative';

/** مرحلة الهدف (دورة حياة الدائرة) */
export type GoalStage = 'exploration' | 'building' | 'scaling' | 'maintaining';

/** نمط التكامل المطلوب */
export type ComplementarityMode =
  | 'vision_execution'       // مبدعون + منفذون
  | 'emotional_analytical'   // عاطفيون + تحليليون
  | 'network_operator'       // اجتماعيون + منظمون
  | 'creative_disciplined'   // إبداع + انضباط
  | 'balanced';              // متوازن (افتراضي)

/** الدور الديناميكي داخل الدائرة */
export type CircleRole =
  | 'strategist'   // رؤية / استراتيجية
  | 'operator'     // تنفيذ / عمليات
  | 'connector'    // شبكات / علاقات
  | 'analyst'      // تحليل / بيانات
  | 'stabilizer'   // استقرار / دعم
  | 'creator';     // إبداع / محتوى

/** حالة العضو في الدائرة */
export type MemberStatus = 'active' | 'inactive' | 'removed';

/** مستوى التوتر بين شخصيتين */
export type TensionLevel = 'too_similar' | 'optimal' | 'challenging' | 'too_different';

/** جودة التفاعل */
export type InteractionQuality = 'echo_chamber' | 'growth_zone' | 'requires_mediation' | 'high_conflict_risk';

// ───────────────────────────────────────────────────────────────
// Interfaces
// ───────────────────────────────────────────────────────────────

/** متجه الهدف: يحدد السمات المطلوبة لتحقيق هدف الدائرة */
export interface GoalVector {
  required_openness: number;          // 0-100
  required_conscientiousness: number; // 0-100
  required_extraversion: number;      // 0-100
  required_agreeableness: number;     // 0-100
  required_stability: number;         // 0-100 (عكس neuroticism)
}

/** قواعد الحوكمة الداخلية للدائرة */
export interface GovernanceRules {
  can_members_vote: boolean;
  can_merge_circles: boolean;
  min_value_alignment: number;        // الحد الأدنى لنسبة التوافق للقبول
  leader_removal_threshold: number;   // نسبة التصويت لإزالة القائد
}

/** الحقول الجديدة المضافة لـ ZoonCircle (Goal-Driven Extension) */
export interface GoalDrivenCircleFields {
  goal_type?: GoalType;
  goal_stage?: GoalStage;
  goal_vector?: GoalVector;
  complementarity_mode?: ComplementarityMode;
  core_values?: string[];
  governance_rules?: GovernanceRules;
  max_members?: number;
  auto_match_enabled?: boolean;
}

/** الحقول الجديدة المضافة لـ ZoonCircleMember (Role-Driven Extension) */
export interface RoleDrivenMemberFields {
  status?: MemberStatus;
  assigned_role?: CircleRole;
  value_alignment_score?: number;     // 0-100
  role_complementarity_score?: number; // 0-100
  contribution_score?: number;        // 0-100
}

// ───────────────────────────────────────────────────────────────
// Function Return Types (من الـ SQL Functions)
// ───────────────────────────────────────────────────────────────

/** نتيجة حساب التوافق والتكامل */
export interface CircleFitResult {
  alignment_score: number;
  complementarity_score: number;
  overall_fit: number;
  recommended_role: CircleRole;
  reasoning: string;
}

/** نتيجة حساب التوتر بين شخصيتين */
export interface TensionResult {
  tension_level: TensionLevel;
  tension_score: number;
  interaction_quality: InteractionQuality;
  recommendation: string;
}

/** سجل في شبكة التفاعل */
export interface InteractionGraphEntry {
  id: string;
  source_user_id: string;
  target_user_id: string;
  circle_id?: string;
  interaction_count: number;
  emotional_valence: number;          // -100 to +100
  weight: number;
  last_interaction_at: string;
}

/** استبيان البداية الباردة (Initial Survey) */
export interface UserInitialSurvey {
  user_id: string;
  q1_new_experiences: number; // 1-5 (Openness)
  q2_details_oriented: number; // 1-5 (Conscientiousness)
  q3_social_energy: number;     // 1-5 (Extraversion)
  q4_cooperation: number;       // 1-5 (Agreeableness)
  q5_stress_handling: number;   // 1-5 (Neuroticism/Stability)
  created_at?: string;
}

/** مؤشر الاستقطاب المجتمعي */
export interface PolarizationIndex {
  trait_name: string;
  avg_value: number;
  polarization: number;               // STDDEV
  polarization_status: string;        // 🔴/🟡/🟢
}

/** صحة المجتمع الشاملة */
export interface CommunityHealth {
  emotional_climate: {
    avg_stress: number;
    polarization: number;
    status: string;
  };
  innovation_pulse: {
    avg_creativity: number;
    diversity_index: number;
    pulse: number;
    status: string;
  };
  conflict_risk: {
    high_risk_members: number;
    risk_percentage: number;
    status: string;
  };
  recommendations: string[];
}

/** مسار نمو المستخدم */
export interface GrowthTrajectory {
  growth_orientation: number;
  primary_trait_change: string;
  interaction_diversity: number;
}

// ───────────────────────────────────────────────────────────────
// Labels & Display Maps (للعرض في الواجهة)
// ───────────────────────────────────────────────────────────────

export const GOAL_TYPE_LABELS: Record<GoalType, { ar: string; en: string; icon: string }> = {
  business:  { ar: 'بيزنس / إنتاج', en: 'Business', icon: '💼' },
  social:    { ar: 'اجتماعي / ترفيهي', en: 'Social', icon: '🎭' },
  impact:    { ar: 'تأثير / خيري', en: 'Impact', icon: '🌍' },
  learning:  { ar: 'تعليمي / نمو شخصي', en: 'Learning', icon: '📚' },
  creative:  { ar: 'إبداعي / فني', en: 'Creative', icon: '🎨' },
};

export const GOAL_STAGE_LABELS: Record<GoalStage, { ar: string; en: string; icon: string }> = {
  exploration: { ar: 'استكشاف', en: 'Exploration', icon: '🧭' },
  building:    { ar: 'بناء', en: 'Building', icon: '🏗️' },
  scaling:     { ar: 'توسع', en: 'Scaling', icon: '🚀' },
  maintaining: { ar: 'صيانة', en: 'Maintaining', icon: '🛡️' },
};

export const CIRCLE_ROLE_LABELS: Record<CircleRole, { ar: string; en: string; icon: string; description: string }> = {
  strategist: { ar: 'استراتيجي', en: 'Strategist', icon: '🎯', description: 'يرسم الرؤية والخطط' },
  operator:   { ar: 'منفذ', en: 'Operator', icon: '⚙️', description: 'ينفذ المهام بدقة' },
  connector:  { ar: 'واصل', en: 'Connector', icon: '🔗', description: 'يبني علاقات وشبكات' },
  analyst:    { ar: 'محلل', en: 'Analyst', icon: '📊', description: 'يحلل البيانات والأداء' },
  stabilizer: { ar: 'موازن', en: 'Stabilizer', icon: '⚖️', description: 'يحافظ على التوازن' },
  creator:    { ar: 'مبدع', en: 'Creator', icon: '💡', description: 'يبتكر أفكار ومحتوى' },
};

export const COMPLEMENTARITY_MODE_LABELS: Record<ComplementarityMode, { ar: string; en: string }> = {
  vision_execution:      { ar: 'رؤية + تنفيذ', en: 'Vision + Execution' },
  emotional_analytical:  { ar: 'عاطفي + تحليلي', en: 'Emotional + Analytical' },
  network_operator:      { ar: 'شبكات + عمليات', en: 'Network + Operations' },
  creative_disciplined:  { ar: 'إبداع + انضباط', en: 'Creative + Disciplined' },
  balanced:              { ar: 'متوازن', en: 'Balanced' },
};

export const TENSION_LABELS: Record<TensionLevel, { ar: string; color: string }> = {
  too_similar:   { ar: 'متشابهون جداً - خطر echo chamber', color: '#f59e0b' },
  optimal:       { ar: 'منطقة النمو المثلى ✓', color: '#22c55e' },
  challenging:   { ar: 'يحتاج وسيط', color: '#f97316' },
  too_different:  { ar: 'مختلفون جداً - خطر صراع', color: '#ef4444' },
};

// ───────────────────────────────────────────────────────────────
// Default Values
// ───────────────────────────────────────────────────────────────

export const DEFAULT_GOAL_VECTOR: GoalVector = {
  required_openness: 50,
  required_conscientiousness: 50,
  required_extraversion: 50,
  required_agreeableness: 50,
  required_stability: 50,
};

export const DEFAULT_GOVERNANCE_RULES: GovernanceRules = {
  can_members_vote: true,
  can_merge_circles: false,
  min_value_alignment: 70,
  leader_removal_threshold: 80,
};
