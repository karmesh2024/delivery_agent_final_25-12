import axios from 'axios';

const API_BASE_URL = '/api/zoon/skills';

// ========================================
// الأنواع (Types)
// ========================================

export interface AISkillFunction {
  id?: string;
  skill_id?: string;
  name: string;
  label: string;
  description: string;
  type: 'internal' | 'webhook' | 'hitl' | 'pipeline';
  endpoint?: string;
  input_schema: Record<string, any>;
  is_active: boolean;
  sort_order?: number;
  created_at?: string;
  updated_at?: string;
}

export interface AISkill {
  id: string;
  name: string;
  description: string;
  type: string;
  input_schema: any;
  webhook_url?: string;
  is_active: boolean;
  category?: string;
  icon?: string;
  source?: string;
  pipeline_id?: string;
  ai_skill_functions?: AISkillFunction[];
  created_at?: string;
  updated_at?: string;
}

export type AISkillCreatePayload = Partial<AISkill> & {
  functions?: Partial<AISkillFunction>[];
};

// ========================================
// دوال الاتصال بالـ API
// ========================================

export const fetchAISkills = async (): Promise<AISkill[]> => {
  const response = await axios.get(API_BASE_URL);
  return response.data;
};

export const createAISkill = async (data: AISkillCreatePayload): Promise<AISkill> => {
  const response = await axios.post(API_BASE_URL, data);
  return response.data;
};

export const updateAISkill = async (id: string, data: AISkillCreatePayload): Promise<AISkill> => {
  const response = await axios.put(`${API_BASE_URL}/${id}`, data);
  return response.data;
};

export const deleteAISkill = async (id: string): Promise<void> => {
  await axios.delete(`${API_BASE_URL}/${id}`);
};
