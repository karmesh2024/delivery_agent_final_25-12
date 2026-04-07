'use client';

import { useEffect, useState, useCallback } from 'react';
import { createClient } from '@/lib/supabase/client';
import { FiSettings } from 'react-icons/fi';

// ═══════════════════════════════════════════
// Types
// ═══════════════════════════════════════════

interface SearchResult {
  title:   string;
  url:     string;
  snippet: string;
}

interface FeedItem {
  id:         string;
  category:   string;
  query:      string;
  title:      string;
  content:    SearchResult[];
  importance: 'normal' | 'high' | 'critical';
  is_read:    boolean;
  created_at: string;
}

// ═══════════════════════════════════════════
// ثوابت العرض
// ═══════════════════════════════════════════

const CATEGORY_META: Record<string, { label: string; color: string }> = {
  fuel:        { label: '⛽ أسعار الوقود',  color: 'bg-orange-100 border-orange-300' },
  competitors: { label: '🏢 المنافسون',      color: 'bg-blue-100 border-blue-300'    },
  waste:       { label: '♻️ سوق المخلفات',  color: 'bg-green-100 border-green-300'  },
  logistics:   { label: '🚛 اللوجستيات',     color: 'bg-purple-100 border-purple-300'},
  economy:     { label: '📈 الاقتصاد',       color: 'bg-yellow-100 border-yellow-300'},
};

const IMPORTANCE_BADGE: Record<string, string> = {
  critical: 'bg-red-500 text-white',
  high:     'bg-orange-400 text-white',
  normal:   'bg-gray-200 text-gray-700',
};

const IMPORTANCE_LABEL: Record<string, string> = {
  critical: '🚨 عاجل',
  high:     '⚡ مهم',
  normal:   '📌 عادي',
};

// ═══════════════════════════════════════════
// المكون الرئيسي
// ═══════════════════════════════════════════

const supabase = createClient();

export default function DiscoveryFeed() {

  const [items,     setItems]     = useState<FeedItem[]>([]);
  const [loading,   setLoading]   = useState(true);
  const [filter,    setFilter]    = useState<string>('all');
  const [triggering, setTriggering] = useState(false);

  // ── جلب البيانات ─────────────────────────────
  const fetchFeed = useCallback(async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from('discovery_feed')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(50);

    if (!error && data) setItems(data as FeedItem[]);
    setLoading(false);
  }, []); // لا يحتاج إلى supabase كتابع لأنه ثابت الآن

  useEffect(() => { 
    fetchFeed(); 
  }, [fetchFeed]);

  // ── Real-time Subscription ───────────────────
  useEffect(() => {
    const channel = supabase
      .channel('discovery_feed_live')
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'discovery_feed' },
        (payload: any) => {
          setItems(prev => [payload.new as FeedItem, ...prev]);
        }
      )
      .on(
        'postgres_changes',
        { event: 'UPDATE', schema: 'public', table: 'discovery_feed' },
        (payload: any) => {
          setItems(prev =>
            prev.map(item =>
              item.id === payload.new.id
                ? { ...item, ...(payload.new as FeedItem) }
                : item
            )
          );
        }
      )
      .subscribe();

    return () => { 
      supabase.removeChannel(channel); 
    };
  }, []); // لا يحتاج إلى supabase كتابع

  // ── وظائف التفاعل ────────────────────────────
  const markAsRead = async (id: string) => {
    await supabase
      .from('discovery_feed')
      .update({ is_read: true })
      .eq('id', id);
  };

  const markAllRead = async () => {
    await supabase
      .from('discovery_feed')
      .update({ is_read: true })
      .eq('is_read', false);
    setItems(prev => prev.map(item => ({ ...item, is_read: true })));
  };

  // ✅ الاستدعاء الآمن عبر pulse-trigger (بدون كشف CRON_SECRET)
  const triggerManualPulse = async () => {
    setTriggering(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      
      console.log('[DiscoveryFeed] Session check before trigger:', !!session);

      if (!session) {
        console.error('[DiscoveryFeed] No session found. Pulse-trigger will fail.');
      }

      const res = await fetch('/api/zoon/discovery/pulse-trigger', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${session?.access_token || ''}`,
        }
      });
      
      const resData = await res.json();
      if (res.ok) {
        await fetchFeed();
      } else {
        console.error('[DiscoveryFeed] Trigger failed:', resData);
      }
    } catch (err) {
      console.error('[DiscoveryFeed] Fetch error:', err);
    } finally {
      setTriggering(false);
    }
  };

  // ── الفلترة ───────────────────────────────────
  const categories  = ['all', ...Object.keys(CATEGORY_META)];
  const filtered    = filter === 'all'
    ? items
    : items.filter(i => i.category === filter);
  const unreadCount = items.filter(i => !i.is_read).length;

  // ── حالة التحميل ─────────────────────────────
  if (loading) {
    return (
      <div className="flex items-center justify-center h-40 text-gray-400">
        <span className="animate-pulse">جارٍ تحميل النبض الاستباقي...</span>
      </div>
    );
  }

  // ── واجهة العرض ──────────────────────────────
  return (
    <div className="space-y-4 p-4" dir="rtl">

      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <h2 className="text-xl font-bold">🔍 النبض الاستباقي</h2>
          {unreadCount > 0 && (
            <span className="bg-red-500 text-white text-xs font-bold px-2 py-0.5 rounded-full">
              {unreadCount} جديد
            </span>
          )}
        </div>
        <div className="flex items-center gap-2">
          {unreadCount > 0 && (
            <button
              onClick={markAllRead}
              className="text-xs text-gray-500 hover:text-gray-800 underline"
            >
              تعليم الكل كمقروء
            </button>
          )}
          <button
            onClick={triggerManualPulse}
            disabled={triggering}
            className="text-xs bg-blue-600 text-white px-3 py-1 rounded-lg
                       hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {triggering ? '⏳ جارٍ التحديث...' : '🔄 تحديث الآن'}
          </button>
          
          <a
            href="/settings/zoon-os/pulse"
            className="p-1 text-gray-400 hover:text-blue-600 border border-gray-200 rounded-lg hover:border-blue-200 transition-colors"
            title="إعدادات الوقت المرقمن"
          >
            <FiSettings className="w-4 h-4" />
          </a>
        </div>
      </div>

      {/* Filters */}
      <div className="flex gap-2 flex-wrap">
        {categories.map(cat => (
          <button
            key={cat}
            onClick={() => setFilter(cat)}
            className={`text-xs px-3 py-1 rounded-full border transition ${
              filter === cat
                ? 'bg-blue-600 text-white border-blue-600'
                : 'bg-white text-gray-600 border-gray-300 hover:border-blue-400'
            }`}
          >
            {cat === 'all' ? '🌐 الكل' : CATEGORY_META[cat]?.label ?? cat}
          </button>
        ))}
      </div>

      {/* Feed Items */}
      {filtered.length === 0 ? (
        <div className="text-center text-gray-400 py-10">
          لا توجد نتائج بعد — سيبدأ النبض تلقائياً كل 6 ساعات
        </div>
      ) : (
        <div className="space-y-3">
          {filtered.map(item => {
            const meta = CATEGORY_META[item.category]
              ?? { label: item.category, color: 'bg-gray-100 border-gray-300' };

            return (
              <div
                key={item.id}
                onClick={() => !item.is_read && markAsRead(item.id)}
                className={`border rounded-xl p-4 cursor-pointer transition-all hover:shadow-md ${
                  item.is_read
                    ? 'opacity-60 bg-gray-50'
                    : `${meta.color} shadow-sm`
                }`}
              >
                {/* Item Header */}
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="font-semibold text-sm">{meta.label}</span>
                    <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                      IMPORTANCE_BADGE[item.importance ?? 'normal']
                    }`}>
                      {IMPORTANCE_LABEL[item.importance ?? 'normal']}
                    </span>
                    {!item.is_read && (
                      <span className="w-2 h-2 bg-blue-500 rounded-full inline-block" />
                    )}
                  </div>
                  <span className="text-xs text-gray-400 shrink-0">
                    {new Date(item.created_at).toLocaleString('ar-EG', {
                      month:  'short',
                      day:    'numeric',
                      hour:   '2-digit',
                      minute: '2-digit',
                    })}
                  </span>
                </div>

                {/* Results */}
                <div className="space-y-2">
                  {Array.isArray(item.content)
                    ? item.content.slice(0, 3).map((result, i) => (
                        <div key={i} className="text-sm">
                          <a
                            href={result.url}
                            target="_blank"
                            rel="noopener noreferrer"
                            onClick={e => e.stopPropagation()}
                            className="text-blue-700 hover:underline font-medium block truncate"
                          >
                            {result.title}
                          </a>
                          <p className="text-gray-600 text-xs mt-0.5 line-clamp-2">
                            {result.snippet}
                          </p>
                        </div>
                      ))
                    : (
                        <p className="text-gray-600 text-xs text-right" dir="rtl">
                          {String(item.content)}
                        </p>
                      )
                  }
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
