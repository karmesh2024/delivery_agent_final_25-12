/**
 * أنواع بيانات نطاق الدعم الفني
 */

/**
 * نوع بيانات تذكرة دعم فني
 */
export interface Ticket {
  id: string;
  subject: string;
  status: 'open' | 'in_progress' | 'pending' | 'resolved' | 'closed';
  priority: 'high' | 'medium' | 'low';
  created: Date;
  lastUpdated: Date;
  category: string;
  assignee: string;
}

/**
 * نوع بيانات سؤال شائع (FAQ)
 */
export interface FAQ {
  id: string;
  question: string;
  answer: string;
}

/**
 * نوع بيانات فئة الدعم الفني
 */
export interface SupportCategory {
  name: string;
  icon: React.ReactNode;
  count: number;
}

/**
 * نوع بيانات مقالة قاعدة المعرفة
 */
export interface KnowledgeBaseArticle {
  title: string;
  category: string;
  views: number;
  lastUpdated: string;
}

/**
 * نوع بيانات مادة تدريبية
 */
export interface TrainingMaterial {
  title: string;
  description: string;
  icon: React.ReactNode;
  type: string;
  duration: string;
}

/**
 * خصائص مكون عنصر سؤال شائع (FAQ)
 */
export interface FAQItemProps {
  faq: FAQ;
  isOpen: boolean;
  toggle: () => void;
}

/**
 * حالة صفحة الدعم الفني
 */
export interface SupportState {
  tickets: Ticket[];
  faqs: FAQ[];
  loading: boolean;
  searchTerm: string;
  openFaqs: { [key: string]: boolean };
  selectedTicketStatus: string;
}