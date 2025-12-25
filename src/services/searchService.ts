import { Agent } from "@/types";

export interface SearchFilters {
  query: string;
  status?: 'online' | 'offline' | 'busy' | 'all';
  minRating?: number;
  hasLocation?: boolean;
  sortBy?: 'name' | 'rating' | 'deliveries' | 'lastActive';
  sortOrder?: 'asc' | 'desc';
}

export interface SearchResult {
  agents: Agent[];
  totalCount: number;
  hasMore: boolean;
}

/**
 * خدمة البحث في المندوبين
 * يمكن توسيعها لتدعم البحث في الطلبات والعملاء أيضاً
 */
export class SearchService {
  /**
   * البحث في المندوبين
   */
  static async searchAgents(
    agents: Agent[], 
    filters: SearchFilters
  ): Promise<SearchResult> {
    let results = [...agents];

    // البحث النصي
    if (filters.query?.trim()) {
      const query = filters.query.toLowerCase();
      results = results.filter(agent => 
        agent.name?.toLowerCase().includes(query) ||
        agent.phone?.includes(query) ||
        agent.delivery_code?.toLowerCase().includes(query) ||
        agent.preferred_vehicle?.toLowerCase().includes(query) ||
        agent.referral_code?.toLowerCase().includes(query)
      );
    }

    // فلترة حسب الحالة
    if (filters.status && filters.status !== 'all') {
      results = results.filter(agent => agent.status === filters.status);
    }

    // فلترة حسب التقييم
    if (filters.minRating && filters.minRating > 0) {
      results = results.filter(agent => (agent.rating || 0) >= filters.minRating!);
    }

    // فلترة حسب وجود الموقع
    if (filters.hasLocation) {
      results = results.filter(agent => agent.location !== undefined);
    }

    // الترتيب
    if (filters.sortBy) {
      results.sort((a, b) => {
        let aValue: any, bValue: any;
        
        switch (filters.sortBy) {
          case 'name':
            aValue = a.name || '';
            bValue = b.name || '';
            break;
          case 'rating':
            aValue = a.rating || 0;
            bValue = b.rating || 0;
            break;
          case 'deliveries':
            aValue = a.total_deliveries || 0;
            bValue = b.total_deliveries || 0;
            break;
          case 'lastActive':
            aValue = new Date(a.last_active || 0).getTime();
            bValue = new Date(b.last_active || 0).getTime();
            break;
          default:
            return 0;
        }

        if (filters.sortOrder === 'desc') {
          return aValue < bValue ? 1 : -1;
        } else {
          return aValue > bValue ? 1 : -1;
        }
      });
    }

    return {
      agents: results,
      totalCount: results.length,
      hasMore: false // يمكن تحسينه لدعم الصفحات
    };
  }

  /**
   * البحث السريع (للاقتراحات)
   */
  static async quickSearch(
    agents: Agent[], 
    query: string, 
    limit: number = 5
  ): Promise<Agent[]> {
    if (!query.trim()) return [];

    const results = await this.searchAgents(agents, { 
      query, 
      sortBy: 'name', 
      sortOrder: 'asc' 
    });

    return results.agents.slice(0, limit);
  }

  /**
   * إحصائيات البحث
   */
  static getSearchStats(agents: Agent[], filters: SearchFilters) {
    const total = agents.length;
    const hasActiveFilters = !!(
      filters.query?.trim() ||
      (filters.status && filters.status !== 'all') ||
      (filters.minRating && filters.minRating > 0) ||
      filters.hasLocation
    );

    return {
      total,
      hasActiveFilters,
      statusCounts: {
        all: agents.length,
        online: agents.filter(a => a.status === 'online').length,
        offline: agents.filter(a => a.status === 'offline').length,
        busy: agents.filter(a => a.status === 'busy').length,
      }
    };
  }
}
