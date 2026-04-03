// src/domains/zoon-os/functions/registry/index.ts

export type ParamType = 'date' | 'text' | 'number' | 'select' | 'boolean' | 'object'
export type OutputFormat = 'pdf' | 'docx' | 'xlsx' | 'json' | 'text' | 'binary'
export type NodeCategory = 'financial' | 'export' | 'search' | 'delivery' | 'messaging' | 'ai' | 'files' | 'workflow'

export interface NodeParam {
  key: string
  label: string              // عرض بالعربي في الواجهة
  type: ParamType
  required: boolean
  options?: string[]         // للـ select فقط
  default?: unknown
  description?: string       // تلميح في الواجهة
}

export interface NodeOutput {
  key: string
  type: string
  description: string
}

export interface FunctionNode {
  id: string
  label: string              // اسم عربي للواجهة
  description: string        // وصف لما تفعله
  category: NodeCategory
  icon: string
  params: NodeParam[]
  outputs: NodeOutput[]
  handler: string            // اسم الدالة في handlers/
  isHITL?: boolean           // هل تحتاج موافقة بشرية؟
  supportedFormats?: OutputFormat[]
}

/**
 * سجل كل الـ Functions المتاحة في النظام
 */
import { FILE_NODES } from './file-nodes';
import { FINANCIAL_NODES } from './financial-nodes';
import { EXPORT_NODES } from './export-nodes';
import { SOCIAL_NODES } from './social-nodes';
import { SEARCH_NODES } from './search-nodes';

export const FUNCTION_NODES: Record<string, FunctionNode> = {
  ...FILE_NODES,
  ...FINANCIAL_NODES,
  ...EXPORT_NODES,
  ...SOCIAL_NODES,
  ...SEARCH_NODES,
};

// مساعد: جلب Function بالـ ID
export function getFunctionNode(id: string): FunctionNode | undefined {
  return FUNCTION_NODES[id];
}

// مساعد: جلب كل Functions فئة معينة
export function getFunctionsByCategory(category: NodeCategory): FunctionNode[] {
  return Object.values(FUNCTION_NODES).filter(n => n.category === category);
}
